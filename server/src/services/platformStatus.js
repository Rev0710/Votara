const supabase = require('../config/supabase');
let cached, expires = 0;
function scheduleTime(value) {
 if (!value) return null;
 if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return NaN;
 return Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : value + '+08:00');
}
function statusFromSettings(settings = {}, now = Date.now()) {
 const start = scheduleTime(settings.scheduledStart), end = scheduleTime(settings.scheduledEnd);
 const valid = (start === null || Number.isFinite(start)) && (end === null || Number.isFinite(end)) && !(start !== null && end !== null && end <= start);
 const enabled = settings.maintenanceMode === true && valid && (start === null || now >= start) && (end === null || now < end);
 const upcoming = settings.maintenanceMode === true && valid && start !== null && now < start && start - now <= 86400000;
 return { enabled, scheduled: settings.maintenanceMode === true && valid && start !== null && now < start,
  startsAt: Number.isFinite(start) ? new Date(start).toISOString() : null, endsAt: Number.isFinite(end) ? new Date(end).toISOString() : null,
  message: String(settings.maintenanceMessage || 'The system is under maintenance. Please check back later.').slice(0,2000),
  upcoming, notice: String(settings.platformNotice || '').slice(0,4000), scheduleValid: valid };
}
async function readSettings() {
 if(cached && Date.now() < expires) return cached;
 const {data,error}=await supabase.from('system_settings').select('settings').eq('id',1).maybeSingle();
 if(error) throw Error('Unable to read platform status.');
 cached=data?.settings || {}; expires=Date.now()+5000; return cached;
}
function invalidate(){expires=0;}
module.exports={scheduleTime,statusFromSettings,readSettings,invalidate};
