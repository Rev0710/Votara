const supabase=require('../config/supabase');
const LIMIT=5;
async function assertReportQuota(table,column,id){const {data,error}=await supabase.from(table).select('id').eq(column,id).limit(LIMIT);if(error)throw error;if((data||[]).length>=LIMIT){const e=new Error('You have reached the limit of 5 reports for this account. You can still read report history and administrator replies.');e.statusCode=429;throw e;}}
module.exports={assertReportQuota,LIMIT};
