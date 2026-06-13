public class ScoreWorker(
    GameDataService gameData,
    FootballApiClient apiClient,
    ILogger<ScoreWorker> logger,
    IConfiguration config) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!config.GetValue("FootballApi:Enabled", true))
        {
            logger.LogInformation("Score worker disabled via config");
            return;
        }

        logger.LogInformation("Score worker started");

        while (!stoppingToken.IsCancellationRequested)
        {
            await PollAsync();
            var interval = config.GetValue("FootballApi:PollIntervalSeconds", 60);
            await Task.Delay(TimeSpan.FromSeconds(interval), stoppingToken);
        }

        logger.LogInformation("Score worker stopped");
    }

    private async Task PollAsync()
    {
        try
        {
            logger.LogInformation("Polling football API");
            var matches = (await apiClient.FetchAllMatchesAsync()).ToList();
            gameData.SetGames(matches);
            logger.LogInformation("Loaded {Count} matches from API", matches.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Score worker poll error");
        }
    }
}
