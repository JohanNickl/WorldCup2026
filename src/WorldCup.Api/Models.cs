record GameRecord(
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
record ScoreRequest(int HomeScore, int AwayScore, string Status = "finished");

record TeamInfo(string Team, string Flag);

record GroupDef(string Group, List<TeamInfo> Teams);
