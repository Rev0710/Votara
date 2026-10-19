const {readSettings,statusFromSettings}=require('../services/platformStatus');
const getMaintenanceStatus=async(req,res)=>{try{res.set('Cache-Control','no-store');return res.json({success:true,maintenance:statusFromSettings(await readSettings())});}catch{return res.status(503).json({success:false,message:'Platform status is temporarily unavailable.'});}};
module.exports={getMaintenanceStatus};
