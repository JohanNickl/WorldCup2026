var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration["AllowedOrigins"]?.Split(',')
            ?? ["http://localhost:5173"];
        policy.WithOrigins(origins).AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.AddHttpClient("football-api", (sp, client) =>
{
    var cfg = sp.GetRequiredService<IConfiguration>();
    client.BaseAddress = new Uri("https://api.football-data.org/v4/");
    var key = cfg["FootballApi:ApiKey"];
    if (!string.IsNullOrWhiteSpace(key))
        client.DefaultRequestHeaders.Add("X-Auth-Token", key);
});

builder.Services.AddSingleton<GameDataService>();
builder.Services.AddSingleton<FootballApiClient>();
builder.Services.AddHostedService<ScoreWorker>();

var app = builder.Build();

app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGameEndpoints();
app.MapGroupEndpoints();
app.MapBracketEndpoints();
app.MapAdminEndpoints();

app.MapFallbackToFile("index.html");

app.Run();
