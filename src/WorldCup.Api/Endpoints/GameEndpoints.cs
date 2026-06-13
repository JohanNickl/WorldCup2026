using System.Text.Json;

public static class GameEndpoints
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static void MapGameEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/games", (GameDataService gameData) =>
            Results.Json(gameData.GetGames(), JsonOpts));
    }
}
