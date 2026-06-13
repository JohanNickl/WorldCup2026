using System.Text.Json;

public static class BracketEndpoints
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private static readonly (string Stage, string Name, string ShortName)[] RoundOrder =
    [
        ("ROUND_OF_32",    "Round of 32",    "R32"),
        ("ROUND_OF_16",    "Round of 16",    "R16"),
        ("QUARTER_FINALS", "Quarter-finals", "QF"),
        ("SEMI_FINALS",    "Semi-finals",    "SF"),
        ("THIRD_PLACE",    "Third Place",    "3rd"),
        ("FINAL",          "Final",          "F"),
    ];

    public static void MapBracketEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/bracket", (GameDataService gameData) =>
        {
            var games = gameData.GetGames();

            var rounds = RoundOrder
                .Select(r => new
                {
                    name      = r.Name,
                    shortName = r.ShortName,
                    matches   = games
                        .Where(g => g.Stage == r.Stage)
                        .OrderBy(g => g.Date)
                        .Select(g => new
                        {
                            id        = g.Id.ToString(),
                            date      = g.Date,
                            homeTeam  = g.HomeTeam,
                            homeCrest = g.HomeCrest,
                            awayTeam  = g.AwayTeam,
                            awayCrest = g.AwayCrest,
                            homeScore = g.HomeScore,
                            awayScore = g.AwayScore,
                            venue     = g.Venue,
                            city      = g.City,
                        })
                        .ToList()
                })
                .Where(r => r.matches.Count > 0)
                .ToList();

            return Results.Json(new { rounds }, JsonOpts);
        });
    }
}
