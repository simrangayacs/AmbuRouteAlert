import React,{useState} from 'react';
import {SafeAreaView,StyleSheet,Text,View} from 'react-native';
import {Button,Card,Input,Label,Title,colors} from '../components/UI';
import {api} from '../services/api';
import type {User,UserRole} from '../types';
export default function LoginScreen({role,onBack,onLogin}:{role:UserRole;onBack:()=>void;onLogin:(u:User)=>void}){
 const [id,setId]=useState(role==='DRIVER'?'DRV001':'POL001'); const [pw,setPw]=useState('1234'); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
 const login=async()=>{try{setLoading(true);setError('');const r=await api.login(id,pw,role);onLogin(r.user);}catch(e){setError((e as Error).message);}finally{setLoading(false)}};
 return <SafeAreaView style={s.root}><View style={s.wrap}><Text onPress={onBack} style={s.back}>‹ Back</Text><Title>{role==='DRIVER'?'Driver Login':'Traffic Police Login'}</Title><Text style={s.sub}>Hackathon demo authentication</Text><Card><Label>{role==='DRIVER'?'Driver ID':'Officer ID'}</Label><Input value={id} onChangeText={setId} autoCapitalize="characters"/><Label>Password / PIN</Label><Input value={pw} onChangeText={setPw} secureTextEntry keyboardType="number-pad"/>{error?<Text style={s.err}>{error}</Text>:null}<Button title={loading?'LOGGING IN...':'LOGIN'} variant={role==='DRIVER'?'red':'blue'} disabled={loading} onPress={login}/></Card><Text style={s.demo}>Demo: {role==='DRIVER'?'DRV001':'POL001'} / 1234</Text></View></SafeAreaView>
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:colors.bg},wrap:{padding:22,flex:1,justifyContent:'center'},back:{color:colors.muted,fontSize:16,marginBottom:18},sub:{color:colors.muted,marginVertical:8,marginBottom:24},err:{color:colors.red,marginBottom:8},demo:{color:colors.muted,textAlign:'center'}});
