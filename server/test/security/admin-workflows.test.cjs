const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const root = path.resolve(__dirname, '../..');
const secret = 'isolated-admin-workflow-tests-only';
function load(file, dependencies = {}) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), {
        module, exports: module.exports, Buffer, Date, URL, console: { error() {}, log() {} },
        process: { env: { JWT_SECRET: secret } },
        require: name => name === '../services/reportQuota' ? load('src/services/reportQuota.js', dependencies) : Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
    }, { filename: file });
    return module.exports;
}
const token = role => jwt.sign({ userId: role + '-1', role }, secret);
function database() {
    const tables = {
        staff_users: [
            { id: 'admin-1', role: 'admin', is_active: true, full_name: 'Test Admin', email: 'admin@example.test', password_hash: bcrypt.hashSync('OldPassword1!', 4) },
            { id: 'electoral_board-1', role: 'electoral_board', is_active: true },
        ],
        registration_applications: [
            { id: 'late-1', registration_type: 'late', application_status: 'pending_review' },
            { id: 'late-2', registration_type: 'late_enrollee', application_status: 'pending_review' },
            { id: 'regular-1', registration_type: 'regular', application_status: 'pending_review' },
        ],
    };
    const db = { from(table) {
        const filters = []; let update;
        const query = {
            insert(value) { const entry={id:'created-report',...value};(tables[table] ||= []).push(entry);filters.push(row=>row===entry);return query; },
            select() { return query; }, eq(key, value) { filters.push(row => row[key] === value); return query; },
            order() { return query; }, limit() { return query; }, upsert(values) { update = values[0]; return query; }, update(value) { update = value; return query; },
            async single() { return result(true); }, async maybeSingle() { return result(true); },
            then(resolve, reject) { return Promise.resolve(result(false)).then(resolve, reject); },
        };
        function result(single) {
            const rows = (tables[table] || []).filter(row => filters.every(filter => filter(row)));
            if (update) rows.forEach(row => Object.assign(row, update));
            return { data: single ? rows[0] || null : rows, error: null };
        }
        return query;
    } };
    return { db, tables };
}

test('maintenance schedule respects Manila time, start/end boundaries, and 24-hour announcement window', () => {
    const { statusFromSettings } = load('src/services/platformStatus.js', { '../config/supabase': {} });
    const settings = { maintenanceMode: true, scheduledStart: '2026-11-02T02:00', scheduledEnd: '2026-11-02T04:00' };
    const start = Date.parse('2026-11-01T18:00:00Z');
    assert.equal(statusFromSettings(settings, start - 86400001).upcoming, false);
    assert.equal(statusFromSettings(settings, start - 86400000).upcoming, true);
    assert.equal(statusFromSettings(settings, start - 1).enabled, false);
    assert.equal(statusFromSettings(settings, start).enabled, true);
    assert.equal(statusFromSettings(settings, start + 7200000).enabled, false);
    assert.equal(statusFromSettings({ ...settings, scheduledEnd: '2026-11-01T01:00' }, start).enabled, false);
    assert.equal(statusFromSettings({ maintenanceMode: true, scheduledStart: '', scheduledEnd: '' }).enabled, true);
});

test('maintenance blocks student/EB mutations while keeping recovery APIs and public status available', async () => {
    const middleware = load('src/middleware/platformAvailability.js', {
        '../services/platformStatus': { readSettings: async () => ({}), statusFromSettings: () => ({ enabled: true, message: 'Planned maintenance' }) },
    });
    const app = express(); app.use(middleware); app.use((req, res) => res.json({ ok: true }));
    assert.equal((await request(app).post('/voting/submit')).status, 503);
    assert.equal((await request(app).patch('/eb/registrations/1/review')).status, 503);
    assert.equal((await request(app).put('/admin/settings')).status, 200);
    assert.equal((await request(app).get('/system/maintenance-status')).status, 200);
});

test('late enrollee routes allow active administrators and reject EB, students, and inactive admins', async () => {
    const { db, tables } = database();
    const requireStaff = load('src/middleware/requireStaff.js', { '../config/supabase': db });
    const handlers = Object.fromEntries(['getLateEnrolleeApplications', 'getLateEnrolleeDocuments', 'approveLateEnrollee', 'rejectLateEnrollee', 'requestCorrection'].map(name => [name, (req, res) => res.json({ success: true })]));
    const router = load('src/routes/lateEnrolleeRoutes.js', { '../middleware/requireStaff': requireStaff, '../controllers/lateEnrolleeController': handlers });
    const app = express(); app.use(router);
    for (const [method, url] of [['get','/'], ['get','/1/documents'], ['patch','/1/approve'], ['patch','/1/reject'], ['patch','/1/correction']]) {
        assert.equal((await request(app)[method](url).set('Authorization', 'Bearer ' + token('electoral_board'))).status, 403);
        assert.equal((await request(app)[method](url).set('Authorization', 'Bearer ' + token('student'))).status, 403);
        assert.equal((await request(app)[method](url).set('Authorization', 'Bearer ' + token('admin'))).status, 200);
    }
    tables.staff_users[0].is_active = false;
    assert.equal((await request(app).get('/').set('Authorization', 'Bearer ' + token('admin'))).status, 403);
});

test('legacy EB review cannot approve either late registration type through its general registration endpoint', async () => {
    const { db } = database();
    const controller = load('src/controllers/ebRegistrationController.js', { '../config/supabase': db, '../services/emailService': {} });
    const app = express(); app.use(express.json()); app.patch('/:id/review', controller.reviewStudentRegistration); app.get('/', controller.getStudentRegistrations);
    for (const id of ['late-1', 'late-2']) {
        const response = await request(app).patch('/' + id + '/review').set('Authorization', 'Bearer ' + token('electoral_board')).send({ decision: 'approve' });
        assert.equal(response.status, 403, response.text);
    }
    const list = await request(app).get('/').set('Authorization', 'Bearer ' + token('electoral_board'));
    assert.equal(list.status, 200, list.text);
    assert.deepEqual(list.body.applications.map(row => row.id), ['regular-1']);
});

test('administrator profile hides password hashes and requires password plus verified new email for credential changes', async () => {
    const { db, tables } = database(); let code;
    const requireStaff = load('src/middleware/requireStaff.js', { '../config/supabase': db });
    const router = load('src/routes/adminProfileRoutes.js', {
        '../config/supabase': db, '../middleware/requireStaff': requireStaff,
        '../services/emailService': { sendAdminEmailChangeCode: async (email, value) => { code = value; } },
    });
    const app = express(); app.use(express.json()); app.use(router);
    const auth = 'Bearer ' + token('admin');
    const profile = await request(app).get('/').set('Authorization', auth);
    assert.equal(profile.status, 200); assert.equal(profile.body.admin.password_hash, undefined);
    const denied = await request(app).patch('/').set('Authorization', auth).send({ email: 'new@example.test', currentPassword: 'incorrect' });
    assert.equal(denied.status, 403);
    assert.equal((await request(app).patch('/').set('Authorization', auth).send({ email: 'new@example.test', currentPassword: 'OldPassword1!' })).status, 400);
    assert.equal((await request(app).post('/email-code').set('Authorization', auth).send({ email: 'new@example.test', currentPassword: 'OldPassword1!' })).status, 200);
    const saved = await request(app).patch('/').set('Authorization', auth).send({ email: 'new@example.test', currentPassword: 'OldPassword1!', emailCode: code });
    assert.equal(saved.status, 200, saved.text); assert.equal(tables.staff_users[0].email, 'new@example.test');
    assert.equal((await request(app).get('/').set('Authorization', 'Bearer ' + token('student'))).status, 403);
});


test('public platform status includes published notices but never draft or private settings', () => {
    const { statusFromSettings } = load('src/services/platformStatus.js', { '../config/supabase': {} });
    const status = statusFromSettings({platformNotice:'Published notice',platformNoticeDraft:'Private draft',loginAttempts:'private policy'});
    assert.equal(status.notice,'Published notice');
    assert.equal(JSON.stringify(status).includes('Private draft'),false);
    assert.equal(status.loginAttempts,undefined);
});

test('enabling maintenance during an open election requires explicit acknowledgement', async () => {
    const {db,tables}=database();
    tables.system_settings=[{id:1,settings:{maintenanceMode:false}}];
    tables.elections=[{id:'election-1',status:'open'}];
    const platform=load('src/services/platformStatus.js',{'../config/supabase':db});
    const controller=load('src/controllers/adminSettingsController.js',{'../config/supabase':db,'../services/platformStatus':platform,'../services/auditLogsService':{createAuditLog:async()=>({})}});
    const app=express();app.use(express.json());app.put('/',controller.updateAdminSystemSettings);
    const settings={maintenanceMode:true,scheduledStart:'',scheduledEnd:'',votingSafeguard:true};
    const denied=await request(app).put('/').set('Authorization','Bearer '+token('admin')).send({settings});
    assert.equal(denied.status,409,denied.text);
    assert.equal(tables.system_settings[0].settings.maintenanceMode,false);
    const saved=await request(app).put('/').set('Authorization','Bearer '+token('admin')).send({settings,acknowledgeActiveElection:true});
    assert.equal(saved.status,200,saved.text);
    assert.equal(tables.system_settings[0].settings.maintenanceMode,true);
});


test('EB issue reports isolate owners and restrict administrator replies', async () => {
 const {db,tables}=database();
 tables.staff_issue_reports=[{id:'one',staff_id:'electoral_board-1',status:'submitted',subject:'Own report'},{id:'two',staff_id:'other-eb',status:'submitted',subject:'Private report'}];
 const guard=load('src/middleware/requireStaff.js',{'../config/supabase':db});
 const router=load('src/routes/staffIssueReportsRoutes.js',{'../middleware/requireStaff':guard,'../middleware/auditEBRequest':()=> (req,res,next)=>next(),'../config/supabase':db});
 const app=express();app.use(express.json());app.use('/api/electoral-board/issues',router);app.use('/api/admin/staff-issue-reports',router);
 const eb=await request(app).get('/api/electoral-board/issues').set('Authorization','Bearer '+token('electoral_board'));
 assert.equal(eb.status,200);assert.deepEqual(eb.body.reports.map(r=>r.id),['one']);
 const admin=await request(app).get('/api/admin/staff-issue-reports').set('Authorization','Bearer '+token('admin'));assert.equal(admin.body.reports.length,2);
 assert.equal((await request(app).get('/api/admin/staff-issue-reports').set('Authorization','Bearer '+token('electoral_board'))).status,403);
 assert.equal((await request(app).patch('/api/electoral-board/issues/two').set('Authorization','Bearer '+token('electoral_board')).send({status:'closed'})).status,403);
 const reply=await request(app).patch('/api/admin/staff-issue-reports/one').set('Authorization','Bearer '+token('admin')).send({status:'resolved',adminResponse:'Reviewed by support.'});assert.equal(reply.status,200);assert.equal(tables.staff_issue_reports[0].admin_response,'Reviewed by support.');
 assert.equal((await request(app).post('/api/electoral-board/issues').set('Authorization','Bearer '+token('electoral_board')).send({subject:'x',description:'short'})).status,400);
 tables.staff_users[1].is_active=false;assert.equal((await request(app).get('/api/electoral-board/issues').set('Authorization','Bearer '+token('electoral_board'))).status,403);
});

test('EB submission derives reporter identity from authentication and rejects admin submissions', async()=>{
 const {db,tables}=database();tables.staff_issue_reports=[];
 const guard=load('src/middleware/requireStaff.js',{'../config/supabase':db});const router=load('src/routes/staffIssueReportsRoutes.js',{'../middleware/requireStaff':guard,'../middleware/auditEBRequest':()=> (req,res,next)=>next(),'../config/supabase':db});const app=express();app.use(express.json());app.use('/api/electoral-board/issues',router);
 const report={subject:'Kiosk unavailable',description:'The kiosk connection needs administrator assistance.',staff_id:'other-user',status:'resolved'};
 const created=await request(app).post('/api/electoral-board/issues').set('Authorization','Bearer '+token('electoral_board')).send(report);assert.equal(created.status,201,created.text);assert.equal(created.body.report.staff_id,'electoral_board-1');assert.equal(created.body.report.status,'submitted');
 assert.equal((await request(app).post('/api/electoral-board/issues').set('Authorization','Bearer '+token('admin')).send(report)).status,403);
});

test('registry synchronization excludes first-year rows before inserting and rejects an all-first-year file',async()=>{
 const inserted=[];const db={from(table){const q={select(){return q},eq(){return q},async maybeSingle(){return {data:{id:'admin-1',role:'admin',is_active:true},error:null}},async in(){return {data:[],error:null}},async insert(rows){inserted.push(...rows);return {error:null}}};return q;}};
 const controller=load('src/controllers/adminDataManagementController.js',{'../config/supabase':db,'../services/auditLogsService':{createAuditLog:async()=>{}}});const app=express();app.use(express.json());app.post('/import',controller.importStudentDataset);
 const first={student_id:'1',full_name:'First Student',year_level:'1st Year'},second={student_id:'2',full_name:'Second Student',year_level:'2nd Year'};
 const result=await request(app).post('/import').set('Authorization','Bearer '+token('admin')).send({students:[first,second]});assert.equal(result.status,200,result.text);assert.equal(inserted.length,1);assert.equal(inserted[0].student_id,'2');assert.equal(result.body.excludedFirstYearCount,1);
 assert.equal((await request(app).post('/import').set('Authorization','Bearer '+token('admin')).send({students:[first]})).status,400);
});
test('EB five-report quota is per account and leaves history available',async()=>{const {db,tables}=database();tables.staff_issue_reports=[];const guard=load('src/middleware/requireStaff.js',{'../config/supabase':db});const router=load('src/routes/staffIssueReportsRoutes.js',{'../middleware/requireStaff':guard,'../middleware/auditEBRequest':()=> (req,res,next)=>next(),'../config/supabase':db});const app=express();app.use(express.json());app.use('/api/electoral-board/issues',router);const send=()=>request(app).post('/api/electoral-board/issues').set('Authorization','Bearer '+token('electoral_board')).send({subject:'Need assistance',description:'The workspace requires support.'});for(let i=0;i<5;i++)assert.equal((await send()).status,201);assert.equal((await send()).status,429);assert.equal(tables.staff_issue_reports.length,5);assert.equal((await request(app).get('/api/electoral-board/issues').set('Authorization','Bearer '+token('electoral_board'))).status,200);});
test('EB profile updates are owned by the authenticated account and exclude password hashes',async()=>{const {db,tables}=database();tables.staff_users[1].password_hash='private-hash';const guard=load('src/middleware/requireStaff.js',{'../config/supabase':db});const router=load('src/routes/ebProfileRoutes.js',{'../middleware/requireStaff':guard,'../config/supabase':db,'../services/auditLogsService':{createAuditLog:async()=>{}}});const app=express();app.use(express.json());app.use('/profile',router);const auth='Bearer '+token('electoral_board');const own=await request(app).get('/profile').set('Authorization',auth);assert.equal(own.status,200,own.text);assert.equal(own.body.user.id,'electoral_board-1');assert.equal(JSON.stringify(own.body).includes('private-hash'),false);assert.equal((await request(app).get('/profile').set('Authorization','Bearer '+token('admin'))).status,403);assert.equal((await request(app).patch('/profile').set('Authorization',auth).send({})).status,400);assert.equal((await request(app).patch('/profile').set('Authorization',auth).send({photoData:'data:image/svg+xml;base64,PHN2Zz4='})).status,400);const clear=await request(app).patch('/profile').set('Authorization',auth).send({id:'admin-1',photoData:''});assert.equal(clear.status,200,clear.text);assert.equal(tables.staff_users[1].profile_photo_url,null);});
test('EB password change checks the current password, confirmation, strength and stores only a hash',async()=>{const {db,tables}=database();tables.staff_users[1].password_hash=await bcrypt.hash('Previous-Test1!',4);const logs=[];const guard=load('src/middleware/requireStaff.js',{'../config/supabase':db});const router=load('src/routes/ebProfileRoutes.js',{'../middleware/requireStaff':guard,'../config/supabase':db,'../services/auditLogsService':{createAuditLog:async item=>logs.push(item)}});const app=express();app.use(express.json());app.use('/profile',router);const change=body=>request(app).post('/profile/password').set('Authorization','Bearer '+token('electoral_board')).send(body);assert.equal((await change({currentPassword:'wrong',newPassword:'New-Password2!',confirmPassword:'New-Password2!'})).status,403);assert.equal((await change({currentPassword:'Previous-Test1!',newPassword:'short',confirmPassword:'short'})).status,400);assert.equal((await change({currentPassword:'Previous-Test1!',newPassword:'New-Password2!',confirmPassword:'different'})).status,400);const success=await change({currentPassword:'Previous-Test1!',newPassword:'New-Password2!',confirmPassword:'New-Password2!'});assert.equal(success.status,200,success.text);assert.ok(await bcrypt.compare('New-Password2!',tables.staff_users[1].password_hash));assert.notEqual(tables.staff_users[1].password_hash,'New-Password2!');assert.equal(JSON.stringify(logs).includes('New-Password2!'),false);});

test('saved EB profile photo remains successful when audit storage fails and includes the audit identity',async()=>{
 const {db,tables}=database();tables.staff_users[1].full_name='Test EB';tables.staff_users[1].email='eb@example.test';let identity;
 const guard=load('src/middleware/requireStaff.js',{'../config/supabase':db});
 const router=load('src/routes/ebProfileRoutes.js',{'../middleware/requireStaff':guard,'../config/supabase':db,'../services/auditLogsService':{createAuditLog:async item=>{identity=item;throw Error('audit unavailable')}}});
 const app=express();app.use(express.json());app.use('/profile',router);const auth='Bearer '+token('electoral_board');
 const photoData='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==';
 const saved=await request(app).patch('/profile').set('Authorization',auth).send({photoData});assert.equal(saved.status,200,saved.text);assert.equal(saved.body.auditWarning,true);assert.equal(saved.body.user.profilePicture,photoData);assert.equal(identity.actorEmail,'eb@example.test');assert.equal(JSON.stringify(identity).includes(photoData),false);
 const reloaded=await request(app).get('/profile').set('Authorization',auth);assert.equal(reloaded.body.user.profilePicture,photoData);
});

test('completed EB password change reports success even when the separate audit write fails',async()=>{
 const {db,tables}=database();tables.staff_users[1].password_hash=await bcrypt.hash('Before-Test1!',4);const guard=load('src/middleware/requireStaff.js',{'../config/supabase':db});
 const router=load('src/routes/ebProfileRoutes.js',{'../middleware/requireStaff':guard,'../config/supabase':db,'../services/auditLogsService':{createAuditLog:async()=>{throw Error('audit unavailable')}}});const app=express();app.use(express.json());app.use('/profile',router);
 const result=await request(app).post('/profile/password').set('Authorization','Bearer '+token('electoral_board')).send({currentPassword:'Before-Test1!',newPassword:'After-Test2!',confirmPassword:'After-Test2!'});
 assert.equal(result.status,200,result.text);assert.equal(result.body.success,true);assert.equal(result.body.auditWarning,true);assert.ok(await bcrypt.compare('After-Test2!',tables.staff_users[1].password_hash));assert.equal(JSON.stringify(result.body).includes('After-Test2!'),false);
});
