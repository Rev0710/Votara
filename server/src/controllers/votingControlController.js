const supabase = require("../config/supabase");

const {votingAvailability} = require("../utils/electionTime");
exports.availability = async (req,res) => {
    const {data,error}=await supabase.from("elections").select("*").eq("id",req.params.id).maybeSingle();
    if(error) return res.status(503).json({success:false,message:"Voting availability could not be checked."});
    if(!data) return res.status(404).json({success:false,message:"Election not found."});
    return res.json({success:true,...votingAvailability(data)});
};
exports.setPaused = async (req,res) => {
    if(typeof req.body.paused !== "boolean" || typeof req.body.expectedPaused !== "boolean")
        return res.status(400).json({success:false,message:"Provide paused and expectedPaused as booleans."});
    const {data,error}=await supabase.from("elections").update({voting_paused:req.body.paused})
        .eq("id",req.params.id).eq("status","open").eq("is_published",true)
        .eq("voting_paused",req.body.expectedPaused).select("*").maybeSingle();
    if(error) return res.status(503).json({success:false,message:"Unable to change voting availability. Confirm the voting-controls SQL migration has been applied."});
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
    const {data,error}=await supabase.rpc("get_election_voting_notices");
    if(error) return res.status(503).json({success:false,message:"Voting notifications could not be refreshed."});
    return res.json({success:true,notices:data||[]});
};
exports.votingAvailability=votingAvailability;
