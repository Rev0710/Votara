const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function fixture(){
 const calls=[];const module={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../src/services/votingService.js'),'utf8'),{
 module,exports:module.exports,require:name=>name==='../config/supabase'?{rpc:async(name,args)=>{calls.push({name,args});return {data:{success:true,ballot_id:'test-ballot'}};}}:require(name)
 });return {service:module.exports,calls};
}
test('partial ballot passes only chosen positions to the existing atomic voting function',async()=>{
 const {service,calls}=fixture();
 await service.submitVote({electionId:'election',studentId:'student',selections:[{positionId:'president',candidateId:'candidate'}]});
 assert.equal(calls.length,1);assert.equal(calls[0].name,'submit_votara_vote');
 assert.deepEqual(JSON.parse(JSON.stringify(calls[0].args.p_selections)),[{positionId:'president',candidateId:'candidate'}]);
});
test('duplicate position choices are still rejected before database submission',async()=>{
 const {service,calls}=fixture();
 await assert.rejects(service.submitVote({electionId:'election',studentId:'student',selections:[{positionId:'p',candidateId:'a'},{positionId:'p',candidateId:'b'}]}),/multiple selections/);
 assert.equal(calls.length,0);
});
test('invalid candidate entries and entirely blank ballots remain rejected',async()=>{
 const {service,calls}=fixture();
 await assert.rejects(service.submitVote({electionId:'election',studentId:'student',selections:[{positionId:'p',candidateId:null}]}),/candidateId/);
 await assert.rejects(service.submitVote({electionId:'election',studentId:'student',selections:[]}),/At least one/);
 assert.equal(calls.length,0);
});
