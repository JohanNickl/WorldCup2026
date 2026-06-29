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

        // Normalize stage names: football-data.org uses LAST_32/LAST_16
        var stage = m.Stage switch
        {
            "LAST_32" => "ROUND_OF_32",
            "LAST_16" => "ROUND_OF_16",
            _ => m.Stage ?? "",
        };

        return new GameRecord(
            Id:        m.Id,
            Date:      m.UtcDate ?? "",
            Timezone:  "UTC",
            Group:     group,
            Stage:     stage,
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

    // Use classes (not records) so System.Text.Json property-setter deserialization
    // works cleanly — avoids the [property: JsonPropertyName] vs constructor-param
    // attribute-target ambiguity with private nested records.

    private class MatchesResponse
    {
        [JsonPropertyName("matches")]
        public List<MatchDto>? Matches { get; set; }
    }

    private class MatchDto
    {
        [JsonPropertyName("id")]         public int         Id         { get; set; }
        [JsonPropertyName("utcDate")]    public string?     UtcDate    { get; set; }
        [JsonPropertyName("status")]     public string?     Status     { get; set; }
        [JsonPropertyName("stage")]      public string?     Stage      { get; set; }
        [JsonPropertyName("group")]      public string?     Group      { get; set; }
        [JsonPropertyName("minute")]     public int?        Minute     { get; set; }
        [JsonPropertyName("attendance")] public int?        Attendance { get; set; }
        [JsonPropertyName("homeTeam")]   public TeamDto?    HomeTeam   { get; set; }
        [JsonPropertyName("awayTeam")]   public TeamDto?    AwayTeam   { get; set; }
        [JsonPropertyName("score")]      public ScoreDto?   Score      { get; set; }
        [JsonPropertyName("goals")]      public List<GoalDto>?   Goals     { get; set; }
        [JsonPropertyName("referees")]   public List<RefereeDto>? Referees { get; set; }
        [JsonPropertyName("venue")]      public string?     Venue      { get; set; }
    }

    private class TeamDto
    {
        [JsonPropertyName("name")]      public string? Name      { get; set; }
        [JsonPropertyName("shortName")] public string? ShortName { get; set; }
        [JsonPropertyName("crest")]     public string? Crest     { get; set; }
    }

    private class GoalDto
    {
        [JsonPropertyName("minute")]     public int?      Minute     { get; set; }
        [JsonPropertyName("injuryTime")] public int?      InjuryTime { get; set; }
        [JsonPropertyName("type")]       public string?   Type       { get; set; }
        [JsonPropertyName("team")]       public TeamDto?  Team       { get; set; }
        [JsonPropertyName("scorer")]     public PersonDto? Scorer    { get; set; }
    }

    private class RefereeDto
    {
        [JsonPropertyName("name")]        public string? Name        { get; set; }
        [JsonPropertyName("nationality")] public string? Nationality { get; set; }
    }

    private class PersonDto
    {
        [JsonPropertyName("name")] public string? Name { get; set; }
    }

    private class ScoreDto
    {
        [JsonPropertyName("fullTime")] public ScoreValueDto? FullTime { get; set; }
    }

    private class ScoreValueDto
    {
        [JsonPropertyName("home")] public int? Home { get; set; }
        [JsonPropertyName("away")] public int? Away { get; set; }
    }
}
