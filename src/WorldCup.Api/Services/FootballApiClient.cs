using System.Text.Json;
using System.Text.Json.Serialization;

public class FootballApiClient(IHttpClientFactory factory, IConfiguration config, ILogger<FootballApiClient> logger)
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public async Task<IEnumerable<GameRecord>> FetchAllMatchesAsync()
    {
        var code = config["FootballApi:CompetitionCode"] ?? "WC";

        try
        {
            using var http = factory.CreateClient("football-api");
            var response = await http.GetAsync($"competitions/{code}/matches");

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Football API returned {StatusCode}", response.StatusCode);
                return [];
            }

            var json = await response.Content.ReadAsStringAsync();
            var data = JsonSerializer.Deserialize<MatchesResponse>(json, JsonOpts);
            return data?.Matches?.Select(ToGameRecord) ?? [];
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Football API call failed");
            return [];
        }
    }

    private static GameRecord ToGameRecord(MatchDto m)
    {
        var goals = m.Goals?
            .Where(g => g.Scorer?.Name != null && g.Minute.HasValue && g.Team != null)
            .Select(g => new GoalEvent(
                g.Scorer!.Name!,
                g.Minute!.Value,
                g.InjuryTime,
                g.Team!.Name ?? g.Team.ShortName ?? "",
                g.Type ?? "REGULAR"))
            .ToList();

        var referee = m.Referees?.FirstOrDefault(r => r.Name != null);
        var refStr = referee is null ? null
            : referee.Nationality is null ? referee.Name
            : $"{referee.Name} ({referee.Nationality})";

        var status = m.Status switch
        {
            "IN_PLAY" or "PAUSED" or "HALFTIME" => "live",
            "FINISHED" or "AWARDED" => "finished",
            _ => "scheduled",
        };

        // API returns "GROUP_A", "GROUP_B", etc. — strip the prefix
        var group = m.Group?.StartsWith("GROUP_") == true
            ? m.Group[6..]
            : m.Group ?? "";

        return new GameRecord(
            Id:        m.Id,
            Date:      m.UtcDate ?? "",
            Timezone:  "UTC",
            Group:     group,
            Stage:     m.Stage ?? "",
            HomeTeam:  m.HomeTeam?.Name ?? m.HomeTeam?.ShortName ?? "",
            HomeCrest: m.HomeTeam?.Crest ?? "",
            AwayTeam:  m.AwayTeam?.Name ?? m.AwayTeam?.ShortName ?? "",
            AwayCrest: m.AwayTeam?.Crest ?? "",
            Venue:     m.Venue ?? "",
            City:      "",
            Country:   "",
            HomeScore: m.Score?.FullTime?.Home,
            AwayScore: m.Score?.FullTime?.Away,
            Status:    status,
            Referee:   refStr,
            Attendance: m.Attendance,
            Minute:    m.Minute,
            Goals:     goals?.Count > 0 ? goals : null
        );
    }

    private record MatchesResponse(
        [property: JsonPropertyName("matches")] List<MatchDto>? Matches);

    private record MatchDto(
        [property: JsonPropertyName("id")]         int Id,
        [property: JsonPropertyName("utcDate")]    string? UtcDate,
        [property: JsonPropertyName("status")]     string? Status,
        [property: JsonPropertyName("stage")]      string? Stage,
        [property: JsonPropertyName("group")]      string? Group,
        [property: JsonPropertyName("minute")]     int? Minute,
        [property: JsonPropertyName("attendance")] int? Attendance,
        [property: JsonPropertyName("homeTeam")]   TeamDto? HomeTeam,
        [property: JsonPropertyName("awayTeam")]   TeamDto? AwayTeam,
        [property: JsonPropertyName("score")]      ScoreDto? Score,
        [property: JsonPropertyName("goals")]      List<GoalDto>? Goals,
        [property: JsonPropertyName("referees")]   List<RefereeDto>? Referees,
        [property: JsonPropertyName("venue")]      string? Venue);

    private record TeamDto(
        [property: JsonPropertyName("name")]      string? Name,
        [property: JsonPropertyName("shortName")] string? ShortName,
        [property: JsonPropertyName("crest")]     string? Crest);

    private record GoalDto(
        [property: JsonPropertyName("minute")]     int? Minute,
        [property: JsonPropertyName("injuryTime")] int? InjuryTime,
        [property: JsonPropertyName("type")]       string? Type,
        [property: JsonPropertyName("team")]       TeamDto? Team,
        [property: JsonPropertyName("scorer")]     PersonDto? Scorer);

    private record RefereeDto(
        [property: JsonPropertyName("name")]        string? Name,
        [property: JsonPropertyName("nationality")] string? Nationality);

    private record PersonDto(
        [property: JsonPropertyName("name")] string? Name);

    private record ScoreDto(
        [property: JsonPropertyName("fullTime")] ScoreValueDto? FullTime);

    private record ScoreValueDto(
        [property: JsonPropertyName("home")] int? Home,
        [property: JsonPropertyName("away")] int? Away);
}
