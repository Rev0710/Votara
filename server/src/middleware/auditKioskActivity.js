const { createAuditLog } = require('../services/auditLogsService');
// Record successful assisted actions only. Never retain request bodies or ballot choices.
module.exports = (req, res, next) => {
    if(req.method !== 'POST') return next();
    const path = req.path;
    const activity = path === '/start' ? ['Start','Started a shared kiosk session.']
        : path === '/verify-student' ? ['Verify','Verified a student for kiosk assistance.']
        : path === '/authorize-student' ? ['Authorize','Authorized a student for kiosk assistance.']
        : path === '/registration/submit' ? ['Submit','Submitted an assisted student registration.']
        : path === '/registration/approve' ? ['Approve','Approved an assisted student registration.']
        : path === '/operation/start' ? ['Assist','Started a student kiosk operation.']
        : /^\/operation\/[^/]+\/complete$/.test(path) ? ['Complete','Completed student kiosk assistance.']
        : /^\/operation\/[^/]+\/cancel$/.test(path) ? ['Cancel','Cancelled student kiosk assistance.']
        : /^\/[^/]+\/close$/.test(path) ? ['Close','Closed a shared kiosk session.']
        : /^\/[^/]+\/cancel$/.test(path) ? ['Cancel','Cancelled a shared kiosk session.'] : null;
    if(!activity) return next();
    const json = res.json.bind(res);
    res.json = body => {
        if(res.statusCode < 400 && body?.success !== false && req.user?.role === 'electoral_board') {
            createAuditLog({actorId:req.user.userId || req.user.id,actorName:req.user.fullName,
                actorEmail:req.user.email,actorRole:'electoral_board',action:activity[0],
                module:'Kiosk Management',description:activity[1],ipAddress:req.ip,userAgent:req.get('user-agent')})
                .catch(error=>console.error('Unable to record kiosk activity:',error.message));
        }
        return json(body);
    };
    next();
};
