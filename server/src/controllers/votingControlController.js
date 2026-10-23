const votingControls = require("../config/votingControls");
const supabase = require("../config/supabase");

const {votingAvailability,nextVotingResume} = require("../utils/electionTime");
exports.availability = async (req,res) => {
    const {error:resumeError}=(votingControls.enabled ? await supabase.rpc("resume_due_voting_controls") : {error:null});
    if(resumeError) return res.status(503).json({success:false,message:"Voting is temporarily unavailable. Please contact the Electoral Board."});
    const {data,error}=await supabase.from("elections").select("*").eq("id",req.params.id).maybeSingle();
    if(error) return res.status(503).json({success:false,message:"Voting availability could not be checked."});
    if(!data) return res.status(404).json({success:false,message:"Election not found."});
    return res.json({success:true,...votingAvailability(data)});
};
exports.setPaused = async (req,res) => {
    if(!votingControls.enabled) return res.status(409).json({success:false,code:"VOTING_CONTROLS_DISABLED",message:"Pause and resume are temporarily disabled for testing."});
    if(typeof req.body?.paused !== "boolean" || typeof req.body?.expectedPaused !== "boolean")
        return res.status(400).json({success:false,message:"Provide paused and expectedPaused as booleans."});
    const {error:resumeError}=(votingControls.enabled ? await supabase.rpc("resume_due_voting_controls") : {error:null});
    const changes={voting_paused:req.body.paused,...(req.body.paused ? {voting_resumes_at:nextVotingResume()} : {})};
    const {data,error}=resumeError ? {data:null,error:resumeError} : await supabase.from("elections").update(changes)
        .eq("id",req.params.id).eq("status","open").eq("is_published",true)
        .eq("voting_paused",req.body.expectedPaused).select("*").maybeSingle();
    if(error) {
        console.error("Voting pause database error:", {code:error.code,message:error.message});
        const missing = ["42703","42P01","42883","PGRST204","PGRST205","PGRST202"].includes(error.code);
        const denied = error.code === "42501";
        return res.status(503).json({
            success:false,
            code:missing ? "VOTING_CONTROLS_NOT_INSTALLED" : denied ? "VOTING_CONTROLS_PERMISSION_DENIED" : "VOTING_CONTROL_UPDATE_FAILED",
            message:missing
                ? "Voting controls are not installed or the database schema cache is outdated. Run server/voting-controls.sql in Supabase SQL Editor, then retry. No voting setting was changed."
                : denied
                ? "The server does not have permission to update voting controls. Ask the administrator to check the Supabase server key and migration permissions. No voting setting was changed."
                : "The database could not save this voting change. No voting setting was changed. Try again; if it continues, ask the administrator to check the server logs."
        });
    }
    if(!data) return res.status(409).json({success:false,message:"The election changed. Refresh before trying again."});
    try {
        await require("../services/auditLogsService").createAuditLog({
            actorId:req.user.id, actorName:req.user.fullName, actorRole:req.user.role,
            action:data.voting_paused ? "pause_voting" : "resume_voting", module:"Election Management",
            description:(data.voting_paused ? "Paused" : "Resumed")+" online and kiosk voting for "+data.title,
            electionId:data.id,targetId:data.id,targetType:"election",metadata:{paused:data.voting_paused}
        });
    } catch (auditError) {console.error("Voting control audit failed:",auditError.message);}
    return res.json({success:true,election:data,...votingAvailability(data)});
};
exports.notices = async (req,res) => {
    if(!votingControls.enabled) return res.json({success:true,notices:[]});
    const {data,error}=await supabase.rpc("get_election_voting_notices");
    if(error) return res.status(503).json({success:false,message:"Voting notifications could not be refreshed."});
    return res.json({success:true,notices:data||[]});
};
exports.votingAvailability=votingAvailability;
