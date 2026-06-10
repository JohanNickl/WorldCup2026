using System.Text.Json;

public static class GroupEndpoints
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    public static void MapGroupEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/groups", (IWebHostEnvironment env) =>
        {
            var gamesPath = Path.Combine(env.ContentRootPath, "Data", "games.json");
            var groupsPath = Path.Combine(env.ContentRootPath, "Data", "groups.json");

            var games = JsonSerializer.Deserialize<List<GameRecord>>(File.ReadAllText(gamesPath), JsonOpts) ?? [];
            var groupDefs = JsonSerializer.Deserialize<List<GroupDef>>(File.ReadAllText(groupsPath), JsonOpts) ?? [];

            // Accumulate stats from completed games
            var stats = new Dictionary<string, (int Played, int Won, int Drawn, int Lost, int Gf, int Ga)>(StringComparer.OrdinalIgnoreCase);

            foreach (var game in games.Where(g => g.HomeScore.HasValue && g.AwayScore.HasValue))
            {
                var hs = game.HomeScore!.Value;
                var aws = game.AwayScore!.Value;

                stats.TryAdd(game.HomeTeam, default);
                stats.TryAdd(game.AwayTeam, default);

                var (hp, hw, hd, hl, hgf, hga) = stats[game.HomeTeam];
                var (ap, aw, ad, al, agf, aga) = stats[game.AwayTeam];

                hp++; ap++;
                hgf += hs; hga += aws;
                agf += aws; aga += hs;

                if (hs > aws) { hw++; al++; }
                else if (hs < aws) { hl++; aw++; }
                else { hd++; ad++; }

                stats[game.HomeTeam] = (hp, hw, hd, hl, hgf, hga);
                stats[game.AwayTeam] = (ap, aw, ad, al, agf, aga);
            }

            var result = groupDefs.Select(gd => new
            {
                group = gd.Group,
                teams = gd.Teams.Select(t =>
                {
                    var (played, won, drawn, lost, gf, ga) = stats.TryGetValue(t.Team, out var s) ? s : default;
                    return new
                    {
                        team = t.Team,
                        flag = t.Flag,
                        played,
                        won,
                        drawn,
                        lost,
                        gf,
                        ga,
                        gd = gf - ga,
                        points = won * 3 + drawn,
                    };
                }).ToList()
            }).ToList();

            return Results.Json(result);
        });
    }
}
