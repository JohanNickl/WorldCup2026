public static class BracketEndpoints
{
    public static void MapBracketEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/bracket", (IWebHostEnvironment env) =>
        {
            var path = Path.Combine(env.ContentRootPath, "Data", "bracket.json");
            var json = File.ReadAllText(path);
            return Results.Content(json, "application/json");
        });
    }
}
