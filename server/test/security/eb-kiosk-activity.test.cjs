const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
function middleware(logs){const module={exports:{}};vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../src/middleware/auditKioskActivity.js'),'utf8'),{module,exports:module.exports,console,require:()=>({createAuditLog:async item=>logs.push(item)})});return module.exports;}
test('successful kiosk assistance records EB identity without passwords or ballot selections',()=>{
 const logs=[],audit=middleware(logs);for(const url of ['/start','/verify-student','/authorize-student','/registration/submit','/registration/approve','/operation/start','/operation/test-id/complete','/operation/test-id/cancel','/session-id/close','/session-id/cancel']){
  const req={method:'POST',path:url,user:{userId:'eb-1',email:'eb@example.test',fullName:'Test EB',role:'electoral_board'},body:{password:'private-password',selections:['private-vote']},get:()=>'',ip:'127.0.0.1'};const res={statusCode:200,json:body=>body};audit(req,res,()=>{});res.json({success:true});
 }assert.equal(logs.length,10);assert.ok(logs.every(x=>x.actorId==='eb-1'&&x.actorEmail==='eb@example.test'&&x.module==='Kiosk Management'));assert.equal(JSON.stringify(logs).includes('private-'),false);assert.equal(logs[5].action,'Assist');
});
test('kiosk errors, heartbeats and student password activation produce no assistance logs',()=>{
 const logs=[],audit=middleware(logs);for(const [method,url,status,success] of [['POST','/start',403,false],['POST','/start',200,false],['PATCH','/id/heartbeat',200,true],['POST','/registration/set-password',200,true]]){
  const req={method,path:url,user:{role:'electoral_board'},get:()=>''};const res={statusCode:status,json:body=>body};audit(req,res,()=>{});res.json({success});
 }assert.equal(logs.length,0);
});
