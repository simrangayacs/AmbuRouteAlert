import React from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {Button, Card, Title, colors} from '../components/UI';
import type {UserRole} from '../types';
export default function RoleScreen({onSelect}:{onSelect:(r:UserRole)=>void}){
 return <SafeAreaView style={s.root}><View style={s.wrap}><Text style={s.badge}>EMERGENCY CORRIDOR SYSTEM</Text><Title>AmbuRoute Alert</Title><Text style={s.sub}>GPS + targeted police alert + ESP32 smart speaker demo</Text><Card><Text style={s.cardTitle}>Choose Demo Role</Text><Button title="AMBULANCE DRIVER" onPress={()=>onSelect('DRIVER')} /><Button title="TRAFFIC POLICE" variant="blue" onPress={()=>onSelect('POLICE')} /></Card><Text style={s.note}>Single React Native codebase. Role decides which module opens after login.</Text></View></SafeAreaView>
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:colors.bg},wrap:{flex:1,justifyContent:'center',padding:22},badge:{color:colors.red,fontWeight:'900',letterSpacing:1.3,marginBottom:10},sub:{color:colors.muted,fontSize:16,lineHeight:24,marginVertical:12,marginBottom:28},cardTitle:{color:colors.text,fontSize:20,fontWeight:'800',marginBottom:6},note:{color:colors.muted,textAlign:'center',lineHeight:20}});
