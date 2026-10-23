function votingAvailability(election, now = new Date()) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
        timeZone:"Asia/Manila", year:"numeric", month:"2-digit", day:"2-digit",
        hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23"
    }).formatToParts(now).map(p => [p.type,p.value]));
    const date = parts.year+"-"+parts.month+"-"+parts.day;
    const time = parts.hour+":"+parts.minute+":"+parts.second;
    const starts = [String(election.start_time || "08:00:00"),"08:00:00"].sort().at(-1);
    const ends = [String(election.end_time || "17:00:00"),"17:00:00"].sort()[0];
    let message = "";
    if (typeof election.voting_paused !== "boolean") message="Voting is temporarily unavailable. Please contact the Electoral Board.";
    else if (!election.is_published || election.status !== "open") message="This election is not open for voting.";
    else if (election.voting_paused) message="Voting is paused by the Electoral Board.";
    else if (date !== String(election.election_date).slice(0,10) || time < starts || time >= ends)
        message="Voting is available only on the election date, from 8:00 AM to 5:00 PM (Asia/Manila), within the configured schedule.";
    return {available:!message, paused:election.voting_paused === true, message,
        timezone:"Asia/Manila", serverTime:now.toISOString()};
}

module.exports = {votingAvailability};
