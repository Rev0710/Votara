import React,{useEffect,useState} from 'react';
import {useLocation} from 'react-router-dom';

export default function AdminWorkspace({children}){
 const {pathname}=useLocation();const admin=pathname==='/admin-dashboard'||pathname.startsWith('/admin/');
 const [theme,setTheme]=useState(()=>localStorage.getItem('votaraAdminTheme')||'dark');
 useEffect(()=>{const change=()=>setTheme(localStorage.getItem('votaraAdminTheme')||'dark');window.addEventListener('votara-admin-theme',change);return()=>window.removeEventListener('votara-admin-theme',change);},[]);
 return admin?<div className="admin-workspace" data-admin-theme={theme}>{children}</div>:children;
}
