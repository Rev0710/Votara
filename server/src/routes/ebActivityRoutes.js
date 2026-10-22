const express=require('express');const requireStaff=require('../middleware/requireStaff');const {createAuditLog}=require('../services/auditLogsService');const router=express.Router();
const sections={dashboard:'Overview',registrations:'Registration',partyLists:'Party List Management',candidates:'Candidate Management',election:'Election Management',kiosk:'Kiosk',monitoring:'Monitoring',results:'Results',support:'Issue Reports',logs:'Audit Logs',settings:'Settings',profile:'Profile'};
router.post('/',requireStaff('electoral_board'),async(req,res)=>{const section=Object.hasOwn(sections,req.body?.section)?sections[req.body.section]:null;if(!section)return res.status(400).json({success:false,message:'Select a valid workspace section.'});try{await createAuditLog({actorId:req.user.id,actorName:req.user.fullName,actorEmail:req.user.email,actorRole:'electoral_board',action:req.body?.event==='logout'?'Logout':'View',module:section,description:req.body?.event==='logout'?'Electoral Board signed out.':'Opened the '+section+' workspace.',ipAddress:req.ip,userAgent:req.get('user-agent')});return res.json({success:true});}catch(error){
    // Workspace navigation is non-critical telemetry. Keep it from producing
    // a failed dashboard request when audit storage is temporarily unavailable.
    console.warn('EB workspace activity could not be written:',error?.message||error);
    return res.json({success:true,auditWarning:true});
}});module.exports=router;
