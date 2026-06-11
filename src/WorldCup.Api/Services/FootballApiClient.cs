using System.Text.Json;
using System.Text.Json.Serialization;

public class FootballApiClient(IHttpClientFactory factory, IConfiguration config, ILogger<FootballApiClient> logger)
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public async Task<IEnumerable<ExternalMatchResult>> GetMatchesAsync(DateOnly date)
    {
        var code = config["FootballApi:CompetitionCode"] ?? "WC";
        var dateStr = date.ToString("yyyy-MM-dd");

        try
        {
            using var http = factory.CreateClient("football-api");
            var response = await http.GetAsync($"competitions/{code}/matches?dateFrom={dateStr}&dateTo={dateStr}");

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Football API returned {StatusCode}", response.StatusCode);
                return [];
            }

            var json = await response.Content.ReadAsStringAsync();
            var data = JsonSerializer.Deserialize<MatchesResponse>(json, JsonOpts);
            return data?.Matches?.Select(ToResult) ?? [];
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Football API call failed");
            return [];
        }
    }

    private static ExternalMatchResult ToResult(MatchDto m) => new(
        m.HomeTeam?.ShortName ?? m.HomeTeam?.Name ?? "",
        m.AwayTeam?.ShortName ?? m.AwayTeam?.Name ?? "",
        m.Score?.FullTime?.Home,
        m.Score?.FullTime?.Away,
        m.Status ?? "SCHEDULED"
    );

    private record MatchesResponse(
        [property: JsonPropertyName("matches")] List<MatchDto>? Matches);

    private record MatchDto(
        [property: JsonPropertyName("status")] string? Status,
        [property: JsonPropertyName("homeTeam")] TeamDto? HomeTeam,
        [property: JsonPropertyName("awayTeam")] TeamDto? AwayTeam,
        [property: JsonPropertyName("score")] ScoreDto? Score);

    private record TeamDto(
        [property: JsonPropertyName("name")] string? Name,
        [property: JsonPropertyName("shortName")] string? ShortName);

    private record ScoreDto(
        [property: JsonPropertyName("fullTime")] ScoreValueDto? FullTime);

    private record ScoreValueDto(
        [property: JsonPropertyName("home")] int? Home,
        [property: JsonPropertyName("away")] int? Away);
}

public record ExternalMatchResult(
    string HomeTeam,
    string AwayTeam,
    int? HomeScore,
    int? AwayScore,
    string ApiStatus
);
