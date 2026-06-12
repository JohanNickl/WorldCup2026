public record GoalEvent(
    string Scorer,
    int Minute,
    int? InjuryTime,
    string Team,
    string Type   // REGULAR | OWN_GOAL | PENALTY
);

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
    string Status = "scheduled",
    string? Referee = null,
    int? Attendance = null,
    int? Minute = null,
    List<GoalEvent>? Goals = null
);

// Status: "scheduled" | "live" | "finished"
public record ScoreRequest(int HomeScore, int AwayScore, string Status = "finished");

public record TeamInfo(string Team, string Flag);

public record GroupDef(string Group, List<TeamInfo> Teams);
