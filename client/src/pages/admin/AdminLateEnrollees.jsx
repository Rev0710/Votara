import React from 'react';
import AdminTopNav from './AdminTopNav';
import Review from './AdminLateEnrolleesReview';
export default function AdminLateEnrollees(){return <div><AdminTopNav/><main className="admin-feature-page"><p className="admin-eyebrow">ADMINISTRATION</p><p>Review online and kiosk late enrollee applications, including their submitted documents. Existing applications are retained.</p><Review/></main></div>;}
