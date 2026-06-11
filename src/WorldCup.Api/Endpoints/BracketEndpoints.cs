using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

public static partial class BracketEndpoints
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    public static void MapBracketEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/bracket", (IWebHostEnvironment env) =>
        {
            var bracketPath = Path.Combine(env.ContentRootPath, "Data", "bracket.json");
            var gamesPath   = Path.Combine(env.ContentRootPath, "Data", "games.json");
            var groupsPath  = Path.Combine(env.ContentRootPath, "Data", "groups.json");

            var bracketData = JsonSerializer.Deserialize<BracketData>(File.ReadAllText(bracketPath), JsonOpts);
            if (bracketData is null) return Results.Problem("Failed to read bracket data.");

            var standings = ComputeStandings(gamesPath, groupsPath);

            foreach (var round in bracketData.Rounds)
            foreach (var match in round.Matches)
            {
                match.HomeTeam = Resolve(match.HomeTeam, standings);
                match.AwayTeam = Resolve(match.AwayTeam, standings);
            }

            return Results.Json(bracketData, JsonOpts);
        });
    }

    // Resolves a bracket slot code to a real team name where possible.
    // "1A"   → 1st place in group A
    // "2B"   → 2nd place in group B
    // "3DEF" → best 3rd-place team among groups D, E, F
    // "W R32-1", "L SF-2" → kept as-is (requires knockout results)
    private static string Resolve(
        string code,
        Dictionary<string, List<StandingEntry>> standings)
    {
        // 1st / 2nd place in a named group: "1A", "2L"
        var m12 = GroupPositionRegex().Match(code);
        if (m12.Success)
        {
            var pos   = int.Parse(m12.Groups[1].Value);
            var group = m12.Groups[2].Value;
            if (standings.TryGetValue(group, out var teams) && teams.Count >= pos)
                return teams[pos - 1].Team;
            return code;
        }

        // Best 3rd-place from a set of groups: "3DEF", "3GHJ", …
        var m3 = ThirdPlaceRegex().Match(code);
        if (m3.Success)
        {
            var groups = m3.Groups[1].Value.Select(c => c.ToString()).ToList();
            var candidates = groups
                .Where(g => standings.TryGetValue(g, out var t) && t.Count >= 3)
                .Select(g => standings[g][2])
                .OrderByDescending(t => t.Points)
                .ThenByDescending(t => t.Gd)
                .ThenByDescending(t => t.Gf)
                .ToList();

            return candidates.Count > 0 ? candidates[0].Team : code;
        }

        // Winner/loser labels ("W R32-1", "L SF-2") – leave unchanged
        return code;
    }

    private static Dictionary<string, List<StandingEntry>> ComputeStandings(
        string gamesPath, string groupsPath)
    {
        var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var games     = JsonSerializer.Deserialize<List<GameRecord>>(File.ReadAllText(gamesPath), opts) ?? [];
        var groupDefs = JsonSerializer.Deserialize<List<GroupDef>>(File.ReadAllText(groupsPath), opts) ?? [];

        var raw = new Dictionary<string, (int W, int D, int L, int Gf, int Ga)>(StringComparer.OrdinalIgnoreCase);

        foreach (var game in games.Where(g => g.HomeScore.HasValue && g.AwayScore.HasValue))
        {
            var hs  = game.HomeScore!.Value;
            var aws = game.AwayScore!.Value;

            raw.TryAdd(game.HomeTeam, default);
            raw.TryAdd(game.AwayTeam, default);

            var (hw, hd, hl, hgf, hga) = raw[game.HomeTeam];
            var (aw, ad, al, agf, aga) = raw[game.AwayTeam];

            hgf += hs; hga += aws;
            agf += aws; aga += hs;

            if (hs > aws)      { hw++; al++; }
            else if (hs < aws) { hl++; aw++; }
            else               { hd++; ad++; }

            raw[game.HomeTeam] = (hw, hd, hl, hgf, hga);
            raw[game.AwayTeam] = (aw, ad, al, agf, aga);
        }

        var result = new Dictionary<string, List<StandingEntry>>();

        foreach (var gd in groupDefs)
        {
            result[gd.Group] = gd.Teams
                .Select(t =>
                {
                    var (w, d, _, gf, ga) = raw.TryGetValue(t.Team, out var s) ? s : default;
                    var pts = w * 3 + d;
                    return new StandingEntry(t.Team, pts, gf - ga, gf);
                })
                .OrderByDescending(t => t.Points)
                .ThenByDescending(t => t.Gd)
                .ThenByDescending(t => t.Gf)
                .ThenBy(t => t.Team)
                .ToList();
        }

        return result;
    }

    private record StandingEntry(string Team, int Points, int Gd, int Gf);

    // Mutable classes so we can patch team names after deserialisation
    private class BracketData
    {
        [JsonPropertyName("rounds")]
        public List<BracketRound> Rounds { get; set; } = [];
    }

    private class BracketRound
    {
        [JsonPropertyName("name")]      public string Name      { get; set; } = "";
        [JsonPropertyName("shortName")] public string ShortName { get; set; } = "";
        [JsonPropertyName("matches")]   public List<BracketMatchMutable> Matches { get; set; } = [];
    }

    private class BracketMatchMutable
    {
        [JsonPropertyName("id")]        public string  Id        { get; set; } = "";
        [JsonPropertyName("date")]      public string  Date      { get; set; } = "";
        [JsonPropertyName("homeTeam")]  public string  HomeTeam  { get; set; } = "";
        [JsonPropertyName("awayTeam")]  public string  AwayTeam  { get; set; } = "";
        [JsonPropertyName("homeScore")] public int?    HomeScore { get; set; }
        [JsonPropertyName("awayScore")] public int?    AwayScore { get; set; }
        [JsonPropertyName("venue")]     public string  Venue     { get; set; } = "";
        [JsonPropertyName("city")]      public string  City      { get; set; } = "";
    }

    [GeneratedRegex(@"^([12])([A-L])$")]
    private static partial Regex GroupPositionRegex();

    [GeneratedRegex(@"^3([A-L]{2,})$")]
    private static partial Regex ThirdPlaceRegex();
}
