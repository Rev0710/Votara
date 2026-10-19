const router=require('express').Router();
const bcrypt=require('bcryptjs'), crypto=require('crypto');
const db=require('../config/supabase');
const {sendAdminEmailChangeCode}=require('../services/emailService');
const {rateLimit}=require('express-rate-limit');
router.use(require('../middleware/requireStaff')('admin'));
router.use(rateLimit({windowMs:600000,limit:30,standardHeaders:'draft-8',legacyHeaders:false}));
const challenges=new Map();const fields='id,full_name,email,role,is_active,profile_photo_url';
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
async function account(id){const {data,error}=await db.from('staff_users').select(fields+',password_hash').eq('id',id).single();if(error||!data)throw Error('Unable to load administrator account.');return data;}
function safe(row){return Object.fromEntries(fields.split(',').map(key=>[key,row[key]]));}
router.get('/',async(req,res)=>{try{return res.json({success:true,admin:safe(await account(req.user.id))});}catch{return res.status(500).json({success:false,message:'Unable to load profile.'});}});
router.post('/email-code',async(req,res)=>{try{
 const row=await account(req.user.id),email=String(req.body.email||'').trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return res.status(400).json({success:false,message:'Enter a valid email address.'});
 if(!await bcrypt.compare(String(req.body.currentPassword||''),row.password_hash))return res.status(403).json({success:false,message:'Current password is incorrect.'});
 const previous=challenges.get(row.id);if(previous&&Date.now()-previous.created<60000)return res.status(429).json({success:false,message:'Wait a minute before requesting another code.'});
 const code=String(crypto.randomInt(100000,1000000));await sendAdminEmailChangeCode(email,code);
 challenges.set(row.id,{email,digest:hash(code),created:Date.now(),attempts:0});return res.json({success:true,message:'Verification code sent to the new email.'});
 }catch{return res.status(503).json({success:false,message:'Unable to send verification code. Check email service configuration.'});}});
router.patch('/',async(req,res)=>{try{
 const row=await account(req.user.id),changes={};
 if(req.body.fullName!==undefined){const name=String(req.body.fullName).trim();if(name.length<2||name.length>120)return res.status(400).json({success:false,message:'Name must be 2–120 characters.'});changes.full_name=name;}
 const email=req.body.email?String(req.body.email).trim().toLowerCase():row.email;
 const credentialChange=email!==row.email||Boolean(req.body.newPassword);
 if(credentialChange&&!await bcrypt.compare(String(req.body.currentPassword||''),row.password_hash))return res.status(403).json({success:false,message:'Current password is incorrect.'});
 if(email!==row.email){const c=challenges.get(row.id);if(!c||c.email!==email||Date.now()-c.created>600000||c.attempts>=5)return res.status(400).json({success:false,message:'Request a new email verification code.'});c.attempts++;if(c.digest!==hash(String(req.body.emailCode||'')))return res.status(400).json({success:false,message:'Email verification code is incorrect.'});changes.email=email;}
 if(req.body.newPassword){const password=String(req.body.newPassword);if(password.length<8||Buffer.byteLength(password,'utf8')>72||!/[A-Z]/.test(password)||!/[a-z]/.test(password)||!/[0-9]/.test(password)||!/[^A-Za-z0-9]/.test(password))return res.status(400).json({success:false,message:'Password needs 8 or more characters (maximum 72 UTF-8 bytes) with uppercase, lowercase, number, and symbol.'});changes.password_hash=await bcrypt.hash(password,12);}
 if(req.body.photoData!==undefined){const photo=String(req.body.photoData||'');if(photo&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(photo))return res.status(400).json({success:false,message:'Choose a JPG, PNG, or WEBP image.'});if(Buffer.byteLength(photo)>2100000)return res.status(400).json({success:false,message:'Photo must be under 1.5 MB.'});changes.profile_photo_url=photo||null;}
 if(!Object.keys(changes).length)return res.status(400).json({success:false,message:'No changes to save.'});
 const {data,error}=await db.from('staff_users').update(changes).eq('id',row.id).select(fields).single();
 if(error)return res.status(400).json({success:false,message:error.code==='23505'?'That email is already in use.':'Unable to save profile.'});
 if(changes.email)challenges.delete(row.id);
 return res.json({success:true,admin:safe(data)});
 }catch{return res.status(500).json({success:false,message:'Unable to save administrator profile.'});}});
module.exports=router;
