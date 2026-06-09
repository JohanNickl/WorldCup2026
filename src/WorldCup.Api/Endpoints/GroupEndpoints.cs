public static class GroupEndpoints
{
    public static void MapGroupEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/groups", (IWebHostEnvironment env) =>
        {
            var path = Path.Combine(env.ContentRootPath, "Data", "groups.json");
            var json = File.ReadAllText(path);
            return Results.Content(json, "application/json");
        });
    }
}
