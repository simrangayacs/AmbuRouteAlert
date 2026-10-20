export type UserRole = 'DRIVER' | 'POLICE';
export type User = {id:number; user_id:string; name:string; role:UserRole; sector?:string|null};
export type Junction = {id:number; name:string; latitude:number|string; longitude:number|string; sector:string; speaker_id:string; route_order:number; status?:string; sequence_no?:number};
export type Trip = {id:number; ambulance_no:string; destination:string; status:string};
