using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

public static class AdminEndpoints
{
    private static readonly SemaphoreSlim WriteLock = new(1, 1);
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = true,
    };

    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/admin/games/{id:int}/score", async (
            int id,
            ScoreRequest body,
            HttpContext ctx,
            IWebHostEnvironment env,
            IConfiguration config) =>
        {
            var expected = config["AdminKey"] ?? "";
            var provided = ctx.Request.Headers["X-Admin-Key"].FirstOrDefault() ?? "";
            if (!ValidateKey(expected, provided))
                return Results.Unauthorized();

            if (body.HomeScore < 0 || body.AwayScore < 0)
                return Results.BadRequest("Scores must be non-negative integers.");

            var path = Path.Combine(env.ContentRootPath, "Data", "games.json");

            await WriteLock.WaitAsync();
            try
            {
                var json = await File.ReadAllTextAsync(path);
                var games = JsonSerializer.Deserialize<List<GameRecord>>(json, JsonOpts);
                if (games is null) return Results.Problem("Failed to read games data.");

                var index = games.FindIndex(g => g.Id == id);
                if (index < 0) return Results.NotFound();

                games[index] = games[index] with { HomeScore = body.HomeScore, AwayScore = body.AwayScore };

                var tmpPath = path + ".tmp";
                await File.WriteAllTextAsync(tmpPath, JsonSerializer.Serialize(games, JsonOpts));
                File.Move(tmpPath, path, overwrite: true);

                return Results.Ok(new { id, body.HomeScore, body.AwayScore });
            }
            finally
            {
                WriteLock.Release();
            }
        });
    }

    private static bool ValidateKey(string expected, string provided)
    {
        if (string.IsNullOrWhiteSpace(expected) || string.IsNullOrWhiteSpace(provided))
            return false;
        var a = Encoding.UTF8.GetBytes(expected);
        var b = Encoding.UTF8.GetBytes(provided);
        return CryptographicOperations.FixedTimeEquals(a, b);
    }
}
