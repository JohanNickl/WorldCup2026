using System.Security.Cryptography;
using System.Text;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/admin/games/{id:int}/score", async (
            int id,
            ScoreRequest body,
            HttpContext ctx,
            GameDataService gameData,
            IConfiguration config) =>
        {
            var expected = config["AdminKey"] ?? "";
            var provided = ctx.Request.Headers["X-Admin-Key"].FirstOrDefault() ?? "";
            if (!ValidateKey(expected, provided))
                return Results.Unauthorized();

            if (body.HomeScore < 0 || body.AwayScore < 0)
                return Results.BadRequest("Scores must be non-negative integers.");

            var updated = await gameData.UpdateGameAsync(id, body.HomeScore, body.AwayScore, body.Status);
            return updated
                ? Results.Ok(new { id, body.HomeScore, body.AwayScore, body.Status })
                : Results.NotFound();
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
