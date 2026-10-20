import React,{useState} from 'react';
import {StatusBar} from 'react-native';
import RoleScreen from './screens/RoleScreen';
import LoginScreen from './screens/LoginScreen';
import DriverScreen from './screens/DriverScreen';
import PoliceScreen from './screens/PoliceScreen';
import type {User,UserRole} from './types';
export default function App(){
 const [role,setRole]=useState<UserRole|null>(null); const [user,setUser]=useState<User|null>(null);
 const logout=()=>{setUser(null);setRole(null)};
 return <><StatusBar barStyle="light-content"/>{!role?<RoleScreen onSelect={setRole}/>:!user?<LoginScreen role={role} onBack={()=>setRole(null)} onLogin={setUser}/>:user.role==='DRIVER'?<DriverScreen user={user} onLogout={logout}/>:<PoliceScreen user={user} onLogout={logout}/>}</>;
}
