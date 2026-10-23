const partsInManila = (now) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone:"Asia/Manila",year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"
}).formatToParts(now).map(p=>[p.type,p.value]));
function nextVotingResume(now=new Date()) {
    const p=partsInManila(now);
    // 08:00 Manila is 00:00 UTC; Date.UTC also handles month/year boundaries.
    return new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)+1)).toISOString();
}
function votingAvailability(election, now=new Date()) {
    const p=partsInManila(now);
    const date=p.year+"-"+p.month+"-"+p.day;
    const time=p.hour+":"+p.minute+":"+p.second;
    const resumesAt=election.voting_resumes_at ? new Date(election.voting_resumes_at) : null;
    const validResume=resumesAt && Number.isFinite(resumesAt.getTime());
    const resumeParts=validResume ? partsInManila(resumesAt) : null;
    const resumeDate=resumeParts ? resumeParts.year+"-"+resumeParts.month+"-"+resumeParts.day : null;
    const paused=election.voting_paused === true && (!validResume || now < resumesAt);
    const starts=[String(election.start_time || "08:00:00"),"08:00:00"].sort().at(-1);
    const ends=[String(election.end_time || "17:00:00"),"17:00:00"].sort()[0];
    const electionDate=String(election.election_date).slice(0,10);
    let message="";
    if(typeof election.voting_paused!=="boolean" || !Object.hasOwn(election,"voting_resumes_at"))
        message="Voting is temporarily unavailable. Please contact the Electoral Board.";
    else if(!election.is_published || election.status!=="open") message="This election is not open for voting.";
    else if(paused) message=validResume
        ? "Voting is paused by the Electoral Board. It will resume automatically on "+resumesAt.toLocaleString("en-US",{
            timeZone:"Asia/Manila",month:"long",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"
        })+" (Asia/Manila)."
        : "Voting is paused by the Electoral Board. Please wait for the next voting announcement.";
    else if(date<electionDate || (date!==electionDate && date!==resumeDate) || time<starts || time>=ends)
        message="Voting is available only on the election date or scheduled continuation date, from 8:00 AM to 5:00 PM (Asia/Manila), within the configured schedule.";
    return {available:!message,paused,resumesAt:validResume?resumesAt.toISOString():null,message,
        timezone:"Asia/Manila",serverTime:now.toISOString()};
}
module.exports={votingAvailability,nextVotingResume};
