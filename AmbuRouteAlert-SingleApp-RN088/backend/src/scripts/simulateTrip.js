const base = process.env.API_URL || 'http://127.0.0.1:4000';
const start = await fetch(`${base}/api/trips/start-demo`, {method: 'POST'}).then(r => r.json());
const tripId = start.tripId;
console.log('Started trip', tripId);

const points = [
  [28.6090, 77.2040],
  [28.6110, 77.2060],
  [28.6125, 77.2075],
  [28.6130, 77.2082],
  [28.6137, 77.2088],
];

for (const [latitude, longitude] of points) {
  const r = await fetch(`${base}/api/trips/${tripId}/location`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({latitude, longitude}),
  }).then(x => x.json());
  console.log(r.nextJunction);
  await new Promise(resolve => setTimeout(resolve, 1500));
}
console.log(`Use POST ${base}/api/trips/${tripId}/pass-current-junction to simulate crossing.`);
