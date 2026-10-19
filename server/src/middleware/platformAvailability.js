const {readSettings,statusFromSettings}=require('../services/platformStatus');
module.exports=async(req,res,next)=>{
 if(['GET','HEAD','OPTIONS'].includes(req.method) || /^\/(admin(?:\/|-)|system\/|auth\/(?:admin|staff|student-logout))/.test(req.path)) return next();
 try {
  const settings=await readSettings(), status=statusFromSettings(settings);
  if(status.enabled) return res.status(503).set('Retry-After','60').json({success:false,message:status.message,maintenance:true});
  if(settings.allowVoting === false && /^\/voting\/submit/.test(req.path)) return res.status(503).json({success:false,message:'Voting is temporarily paused by the administrator.'});
  if(settings.allowRegistration === false && /^\/(registration|registrations)(\/|$)/.test(req.path)) return res.status(503).json({success:false,message:'Registration is temporarily paused by the administrator.'});
  return next();
 } catch {return res.status(503).json({success:false,message:'Unable to verify platform availability. Please retry.'});}
};
