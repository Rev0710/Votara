const fs=require('fs'),vm=require('vm'),path=require('path');const {test}=require('node:test'),assert=require('node:assert/strict'),express=require('express'),request=require('supertest');
const root=path.resolve(__dirname,'../..');
test('student sign-in follows configured threshold, blocks correct passwords while locked, expires and resets after success',async()=>{
 let now=100000;const module={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'src/middleware/studentLoginGuard.js'),'utf8'),{module,exports:module.exports,Date:{now:()=>now},Map,Number,String,Math,require:name=>name==='../services/platformStatus'?{readSettings:async()=>({loginAttempts:'3 attempts',lockoutDuration:'15 seconds'})}:require(name)});
 const app=express();app.use(express.json());app.post('/login',module.exports,(req,res)=>res.status(req.body.password==='correct'?200:401).json({success:req.body.password==='correct'}));
 const login=password=>request(app).post('/login').send({studentId:'12345',password});
 assert.equal((await login('bad')).status,401);assert.equal((await login('bad')).status,401);const third=await login('bad');assert.equal(third.status,429);assert.equal(third.body.retryAfter,15);assert.equal(third.headers['retry-after'],'15');assert.equal((await login('correct')).status,429);
 now+=15001;assert.equal((await login('correct')).status,200);assert.equal((await login('bad')).status,401);assert.equal((await login('correct')).status,200);assert.equal((await login('bad')).status,401);
 assert.equal((await request(app).post('/login').send({studentId:'another',password:'bad'})).status,401);
});
test('both public student login routes install the guard before authentication',()=>{for(const file of ['authRoutes.js','studentAuthRoutes.js']){const source=fs.readFileSync(path.join(root,'src/routes',file),'utf8');assert.match(source,/require\("\.\.\/middleware\/studentLoginGuard"\),\s*studentLogin/);}});
