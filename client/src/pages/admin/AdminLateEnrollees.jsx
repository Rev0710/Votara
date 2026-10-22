import React from 'react';
import AdminTopNav from './AdminTopNav';
import Review from './AdminLateEnrolleesReview';
import './AdminDashboardLight.css';

export default function AdminLateEnrollees() {
    return (
        <div className="late-enrollees-view admin-polished-page">
            <a className="le-skip" href="#late-enrollees-content">Skip to applications</a>
            <AdminTopNav />
            <Review />
        </div>
    );
}
