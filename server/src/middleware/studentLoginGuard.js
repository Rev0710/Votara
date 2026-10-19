const crypto=require('crypto');
const {readSettings}=require('../services/platformStatus');
const attempts=new Map();
const number=(value,fallback,min,max)=>{const n=parseInt(String(value??''),10);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;};
module.exports=async(req,res,next)=>{
 if(!req.body?.studentId||!req.body?.password)return next();
 let settings={};try{settings=await readSettings();}catch{}
 const limit=number(settings.loginAttempts,5,3,20),seconds=number(settings.lockoutDuration,30,2,3600);
 const now=Date.now(),key=crypto.createHash('sha256').update(`${String(req.body.studentId).trim()}|${req.ip||'local'}`).digest('hex');
 for(const [id,entry] of attempts)if(entry.expires<=now)attempts.delete(id);
 const existing=attempts.get(key);
 const locked=entry=>{const retryAfter=Math.max(1,Math.ceil((entry.lockedUntil-Date.now())/1000));res.set('Retry-After',String(retryAfter));return res.status(429).json({success:false,locked:true,retryAfter,message:`Too many unsuccessful sign-in attempts. Try again in ${retryAfter} seconds.`});};
 if(existing?.lockedUntil>now)return locked(existing);
 const original=res.json.bind(res);
 res.json=body=>{
  if(res.statusCode===401){const entry=attempts.get(key)||{count:0,expires:now+15*60000};entry.count+=1;if(entry.count>=limit){entry.lockedUntil=Date.now()+seconds*1000;entry.expires=entry.lockedUntil;attempts.set(key,entry);res.json=original;return locked(entry);}if(attempts.size>=10000&&!attempts.has(key))attempts.delete(attempts.keys().next().value);attempts.set(key,entry);}
  else if(res.statusCode>=200&&res.statusCode<300)attempts.delete(key);
  return original(body);
 };
 return next();
};
