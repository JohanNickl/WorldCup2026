public class GameDataService
{
    private IReadOnlyList<GameRecord> _games = [];
    private readonly object _lock = new();

    public void SetGames(IReadOnlyList<GameRecord> games)
    {
        lock (_lock) _games = games;
    }

    public IReadOnlyList<GameRecord> GetGames()
    {
        lock (_lock) return _games;
    }
}
