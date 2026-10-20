import React from 'react';
import {Pressable, StyleSheet, Text, TextInput, View, ViewStyle} from 'react-native';

export const colors = {bg:'#071321', card:'#102338', card2:'#162d46', text:'#f8fafc', muted:'#9fb0c3', red:'#e7333f', blue:'#3182f6', green:'#19b36b', amber:'#f6a821', border:'#26435f'};

export function Card({children, style}:{children:React.ReactNode; style?:ViewStyle}) { return <View style={[styles.card, style]}>{children}</View>; }
export function Title({children}:{children:React.ReactNode}) { return <Text style={styles.title}>{children}</Text>; }
export function Label({children}:{children:React.ReactNode}) { return <Text style={styles.label}>{children}</Text>; }
export function Input(props:React.ComponentProps<typeof TextInput>) { return <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.style]} />; }
export function Button({title,onPress,variant='red',disabled=false}:{title:string;onPress:()=>void;variant?:'red'|'blue'|'green'|'ghost';disabled?:boolean}) {
  const bg = variant==='blue'?colors.blue:variant==='green'?colors.green:variant==='ghost'?colors.card2:colors.red;
  return <Pressable disabled={disabled} onPress={onPress} style={({pressed})=>[styles.button,{backgroundColor:bg,opacity:disabled?0.45:pressed?0.8:1}]}><Text style={styles.buttonText}>{title}</Text></Pressable>;
}

const styles=StyleSheet.create({
  card:{backgroundColor:colors.card,borderRadius:18,padding:18,borderWidth:1,borderColor:colors.border,marginBottom:14},
  title:{fontSize:28,fontWeight:'800',color:colors.text},
  label:{fontSize:13,fontWeight:'700',color:colors.muted,marginBottom:7},
  input:{height:52,borderWidth:1,borderColor:colors.border,borderRadius:12,paddingHorizontal:14,color:colors.text,backgroundColor:colors.card2,marginBottom:14},
  button:{minHeight:52,borderRadius:14,alignItems:'center',justifyContent:'center',paddingHorizontal:18,marginTop:8},
  buttonText:{color:'#fff',fontSize:16,fontWeight:'800'},
});
