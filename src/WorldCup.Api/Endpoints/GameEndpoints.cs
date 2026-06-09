using System.Text.Json;

public static class GameEndpoints
{
    public static void MapGameEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/games", (IWebHostEnvironment env) =>
        {
            var path = Path.Combine(env.ContentRootPath, "Data", "games.json");
            var json = File.ReadAllText(path);
            return Results.Content(json, "application/json");
        });
    }
}
