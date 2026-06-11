using System.Globalization;
using System.Text;

public class ScoreWorker(
    GameDataService gameData,
    FootballApiClient apiClient,
    ILogger<ScoreWorker> logger,
    IConfiguration config) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!config.GetValue("FootballApi:Enabled", true))
        {
            logger.LogInformation("Score worker disabled via config");
            return;
        }

        logger.LogInformation("Score worker started");

        while (!stoppingToken.IsCancellationRequested)
        {
            await PollAsync();
            var interval = config.GetValue("FootballApi:PollIntervalSeconds", 60);
            await Task.Delay(TimeSpan.FromSeconds(interval), stoppingToken);
        }

        logger.LogInformation("Score worker stopped");
    }

    private async Task PollAsync()
    {
        try
        {
            var games = await gameData.ReadGamesAsync();
            var now = DateTimeOffset.UtcNow;

            // Only call the external API when a match is live or about to start
            var hasRelevantGame = games.Any(g =>
            {
                var kickoff = DateTimeOffset.Parse(g.Date, null, DateTimeStyles.RoundtripKind);
                return kickoff >= now.AddHours(-3) && kickoff <= now.AddMinutes(15);
            });

            if (!hasRelevantGame)
            {
                logger.LogDebug("No live/imminent games – skipping API call");
                return;
            }

            logger.LogInformation("Polling football API for today's scores");
            var todayDate = DateOnly.FromDateTime(now.UtcDateTime);
            var results = await apiClient.GetMatchesAsync(todayDate);

            foreach (var result in results)
            {
                var ourStatus = MapStatus(result.ApiStatus);
                if (ourStatus == "scheduled" && result.HomeScore is null) continue;

                var match = games.FirstOrDefault(g =>
                    Normalize(g.HomeTeam) == Normalize(result.HomeTeam) &&
                    Normalize(g.AwayTeam) == Normalize(result.AwayTeam));

                if (match is null)
                {
                    // Try partial name matching via config overrides
                    var mapped = TryMapViaConfig(result.HomeTeam, result.AwayTeam, games);
                    if (mapped is null)
                    {
                        logger.LogDebug("No match found for {Home} vs {Away}", result.HomeTeam, result.AwayTeam);
                        continue;
                    }
                    match = mapped;
                }

                var homeScore = result.HomeScore ?? match.HomeScore ?? 0;
                var awayScore = result.AwayScore ?? match.AwayScore ?? 0;

                await gameData.UpdateGameAsync(match.Id, homeScore, awayScore, ourStatus);
                logger.LogInformation(
                    "Updated game {Id}: {Home} {HomeScore}–{AwayScore} {Away} ({Status})",
                    match.Id, match.HomeTeam, homeScore, awayScore, match.AwayTeam, ourStatus);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Score worker poll error");
        }
    }

    // Attempt matching using optional name-map overrides in config:
    //   FootballApi:TeamNameMap:0:ApiName = "Ivory Coast"
    //   FootballApi:TeamNameMap:0:OurName = "Côte d'Ivoire"
    private GameRecord? TryMapViaConfig(string apiHome, string apiAway, List<GameRecord> games)
    {
        var section = config.GetSection("FootballApi:TeamNameMap");
        if (!section.Exists()) return null;

        string Resolve(string apiName)
        {
            foreach (var entry in section.GetChildren())
            {
                if (string.Equals(entry["ApiName"], apiName, StringComparison.OrdinalIgnoreCase))
                    return entry["OurName"] ?? apiName;
            }
            return apiName;
        }

        var ourHome = Normalize(Resolve(apiHome));
        var ourAway = Normalize(Resolve(apiAway));

        return games.FirstOrDefault(g =>
            Normalize(g.HomeTeam) == ourHome && Normalize(g.AwayTeam) == ourAway);
    }

    private static string MapStatus(string apiStatus) => apiStatus switch
    {
        "IN_PLAY" or "PAUSED" or "HALFTIME" => "live",
        "FINISHED" or "AWARDED" => "finished",
        _ => "scheduled",
    };

    // Strip accents, lowercase, normalise hyphens so "Côte d'Ivoire" ≈ "cote d'ivoire"
    private static string Normalize(string name)
    {
        var decomposed = name.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(decomposed.Length);
        foreach (var c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }
        return sb.ToString().ToLowerInvariant().Replace('-', ' ').Trim();
    }
}
