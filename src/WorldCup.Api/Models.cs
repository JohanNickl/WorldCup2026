public record GameRecord(
    int Id,
    string Date,
    string Timezone,
    string Group,
    string HomeTeam,
    string AwayTeam,
    string Venue,
    string City,
    string Country,
    int? HomeScore,
    int? AwayScore,
    string Status = "scheduled"
);

// Status: "scheduled" | "live" | "finished"
public record ScoreRequest(int HomeScore, int AwayScore, string Status = "finished");

public record TeamInfo(string Team, string Flag);

public record GroupDef(string Group, List<TeamInfo> Teams);
