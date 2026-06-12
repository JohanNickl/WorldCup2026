using System.Text.Json;

public class GameDataService
{
    private readonly SemaphoreSlim _writeLock = new(1, 1);
    private readonly string _gamesPath;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = true,
    };

    public GameDataService(IWebHostEnvironment env)
    {
        _gamesPath = Path.Combine(env.ContentRootPath, "Data", "games.json");
    }

    public async Task<List<GameRecord>> ReadGamesAsync()
    {
        var json = await File.ReadAllTextAsync(_gamesPath);
        return JsonSerializer.Deserialize<List<GameRecord>>(json, JsonOpts) ?? [];
    }

    public async Task<bool> UpdateGameAsync(
        int id, int homeScore, int awayScore, string status,
        string? referee = null, int? attendance = null,
        int? minute = null, List<GoalEvent>? goals = null)
    {
        await _writeLock.WaitAsync();
        try
        {
            var json = await File.ReadAllTextAsync(_gamesPath);
            var games = JsonSerializer.Deserialize<List<GameRecord>>(json, JsonOpts);
            if (games is null) return false;

            var index = games.FindIndex(g => g.Id == id);
            if (index < 0) return false;

            var existing = games[index];
            games[index] = existing with
            {
                HomeScore  = homeScore,
                AwayScore  = awayScore,
                Status     = status,
                Referee    = referee    ?? existing.Referee,
                Attendance = attendance ?? existing.Attendance,
                Minute     = minute,
                Goals      = goals      ?? existing.Goals,
            };

            var tmp = _gamesPath + ".tmp";
            await File.WriteAllTextAsync(tmp, JsonSerializer.Serialize(games, JsonOpts));
            File.Move(tmp, _gamesPath, overwrite: true);
            return true;
        }
        finally
        {
            _writeLock.Release();
        }
    }
}
