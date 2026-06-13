using System.Text.Json;

public static class GroupEndpoints
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static void MapGroupEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/groups", (GameDataService gameData) =>
        {
            var games = gameData.GetGames();
            var groupGames = games.Where(g => g.Stage == "GROUP_STAGE").ToList();

            // Build group membership and crest lookup from all group stage games
            var groupTeams = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
            var crests = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (var game in groupGames)
            {
                if (!groupTeams.ContainsKey(game.Group))
                    groupTeams[game.Group] = [];

                if (!groupTeams[game.Group].Contains(game.HomeTeam) && !string.IsNullOrEmpty(game.HomeTeam))
                    groupTeams[game.Group].Add(game.HomeTeam);
                if (!groupTeams[game.Group].Contains(game.AwayTeam) && !string.IsNullOrEmpty(game.AwayTeam))
                    groupTeams[game.Group].Add(game.AwayTeam);

                if (!string.IsNullOrEmpty(game.HomeTeam)) crests[game.HomeTeam] = game.HomeCrest;
                if (!string.IsNullOrEmpty(game.AwayTeam)) crests[game.AwayTeam] = game.AwayCrest;
            }

            // Accumulate stats from finished group games only
            var stats = new Dictionary<string, (int Played, int Won, int Drawn, int Lost, int Gf, int Ga)>(StringComparer.OrdinalIgnoreCase);

            foreach (var game in groupGames.Where(g => g.Status == "finished" && g.HomeScore.HasValue && g.AwayScore.HasValue))
            {
                var hs  = game.HomeScore!.Value;
                var aws = game.AwayScore!.Value;

                stats.TryAdd(game.HomeTeam, default);
                stats.TryAdd(game.AwayTeam, default);

                var (hp, hw, hd, hl, hgf, hga) = stats[game.HomeTeam];
                var (ap, aw, ad, al, agf, aga)  = stats[game.AwayTeam];

                hp++; ap++;
                hgf += hs; hga += aws;
                agf += aws; aga += hs;

                if (hs > aws) { hw++; al++; }
                else if (hs < aws) { hl++; aw++; }
                else { hd++; ad++; }

                stats[game.HomeTeam] = (hp, hw, hd, hl, hgf, hga);
                stats[game.AwayTeam] = (ap, aw, ad, al, agf, aga);
            }

            var result = groupTeams
                .OrderBy(kvp => kvp.Key)
                .Select(kvp => new
                {
                    group = kvp.Key,
                    teams = kvp.Value.Select(team =>
                    {
                        var (played, won, drawn, lost, gf, ga) = stats.TryGetValue(team, out var s) ? s : default;
                        return new
                        {
                            team,
                            crest = crests.TryGetValue(team, out var c) ? c : "",
                            played,
                            won,
                            drawn,
                            lost,
                            gf,
                            ga,
                            gd    = gf - ga,
                            points = won * 3 + drawn,
                        };
                    }).ToList()
                })
                .ToList();

            return Results.Json(result, JsonOpts);
        });
    }
}
