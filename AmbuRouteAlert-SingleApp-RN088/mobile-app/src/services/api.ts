import {API_BASE_URL} from '../config/env';

async function request(path:string, options:RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {'Content-Type': 'application/json', ...(options.headers || {})},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  login: (userId:string, password:string, role:string) => request('/api/auth/login', {method:'POST', body:JSON.stringify({userId,password,role})}),
  startDemoTrip: () => request('/api/trips/start-demo', {method:'POST'}),
  getDemoTrip: () => request('/api/trips/demo'),
  sendLocation: (tripId:number, latitude:number, longitude:number) => request(`/api/trips/${tripId}/location`, {method:'POST', body:JSON.stringify({latitude,longitude})}),
  passCurrentJunction: (tripId:number) => request(`/api/trips/${tripId}/pass-current-junction`, {method:'POST'}),
  completeTrip: (tripId:number) => request(`/api/trips/${tripId}/complete`, {method:'POST'}),
  getPoliceAlerts: (sector:string) => request(`/api/police/alerts/${sector}`),
  policeAction: (alertId:number, action:string) => request(`/api/police/alerts/${alertId}/action`, {method:'POST', body:JSON.stringify({action})}),
};
