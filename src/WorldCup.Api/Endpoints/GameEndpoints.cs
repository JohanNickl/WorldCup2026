using System.Text.Json;

public static class GameEndpoints
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static void MapGameEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/games", async (GameDataService gameData) =>
        {
            var games = await gameData.ReadGamesAsync();
            return Results.Json(games, JsonOpts);
        });
    }
}
