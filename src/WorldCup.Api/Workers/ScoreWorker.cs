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
            logger.LogInformation("Polling football API for scores");

            var games = await gameData.ReadGamesAsync();
            var results = await apiClient.GetMatchesAsync();

            foreach (var result in results)
            {
                var ourStatus = MapStatus(result.ApiStatus);
                if (ourStatus == "scheduled" && result.HomeScore is null) continue;

                var match = games.FirstOrDefault(g =>
                    Normalize(g.HomeTeam) == Normalize(result.HomeTeam) &&
                    Normalize(g.AwayTeam) == Normalize(result.AwayTeam));

                if (match is null)
                {
                    logger.LogWarning("No match found for {Home} vs {Away}", result.HomeTeam, result.AwayTeam);
                    continue;
                }

                var homeScore = result.HomeScore ?? match.HomeScore ?? 0;
                var awayScore = result.AwayScore ?? match.AwayScore ?? 0;

                await gameData.UpdateGameAsync(
                    match.Id, homeScore, awayScore, ourStatus,
                    result.Referee, result.Attendance, result.Minute, result.Goals);

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

    private static string MapStatus(string apiStatus) => apiStatus switch
    {
        "IN_PLAY" or "PAUSED" or "HALFTIME" => "live",
        "FINISHED" or "AWARDED" => "finished",
        _ => "scheduled",
    };

    // Strip accents, lowercase, normalise hyphens so minor API variations still match
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
