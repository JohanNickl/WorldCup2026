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
    string Stage,
    string HomeTeam,
    string HomeCrest,
    string AwayTeam,
    string AwayCrest,
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
