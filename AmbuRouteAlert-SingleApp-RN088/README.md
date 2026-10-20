# AmbuRoute Alert — Single React Native CLI Hackathon Project

> Student-friendly hackathon implementation with **one React Native CLI app**, **Node.js + Express backend**, **MySQL**, **Socket.IO**, **MQTT**, and **ESP32 + LED/Buzzer**.

---

## 1. What is different in this package?

This package intentionally has **only one React Native mobile codebase**.

There is **no `driver-mobile` project and no `police-mobile` project**.

The same Android APK / iOS app is installed on both phones. On startup the user selects a role:

- **Ambulance Driver**
- **Traffic Police**

The selected role opens the correct login and dashboard inside the same application.

The package also already contains the native React Native CLI folders:

```text
mobile-app/android/
mobile-app/ios/
```

You do **not** need to generate a second React Native project.

---

## 2. Technology used

### Mobile

- React Native CLI **0.88.0**
- React **19.3.0**
- TypeScript
- Android native folder included
- iOS native folder included
- `react-native-maps` 1.29.11
- Google Maps
- `@react-native-community/geolocation`
- Socket.IO client

### Backend

- Node.js
- Express.js
- MySQL
- `mysql2`
- Socket.IO
- MQTT
- Mosquitto broker

### IoT

- ESP32 DevKit
- Active buzzer
- LED
- Wi-Fi
- MQTT

The hackathon version deliberately does **not** require PostgreSQL/PostGIS, Redis, NestJS, Kubernetes, microservices, or complicated enterprise authentication.

---

## 3. Final folder structure

```text
AmbuRouteAlert-SingleApp-RN088/
│
├── mobile-app/                         # ONE React Native CLI application
│   ├── android/                        # Native Android project INCLUDED
│   │   ├── app/
│   │   │   ├── build.gradle
│   │   │   └── src/main/
│   │   ├── build.gradle
│   │   ├── gradle.properties
│   │   ├── gradlew
│   │   └── settings.gradle
│   │
│   ├── ios/                            # Native iOS project INCLUDED
│   │   ├── AmbuRouteAlert/
│   │   ├── AmbuRouteAlert.xcodeproj/
│   │   └── Podfile
│   │
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── config/
│   │   ├── screens/
│   │   │   ├── RoleScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── DriverScreen.tsx
│   │   │   └── PoliceScreen.tsx
│   │   ├── services/
│   │   └── types/
│   │
│   ├── package.json
│   ├── babel.config.js
│   ├── metro.config.js
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   ├── scripts/
│   │   └── server.js
│   ├── sql/
│   ├── .env.example
│   └── package.json
│
├── database/
│   ├── amburoute_complete.sql
│   ├── schema.sql
│   └── seed.sql
│
├── esp32/
│   └── amburoute_speaker.ino
│
├── docker-compose.yml
├── mosquitto.conf
└── README.md
```

---

# 4. How the complete system works

```text
                   SAME REACT NATIVE APP
                 ┌─────────────────────────┐
                 │                         │
         Driver role                 Police role
              │                           ▲
              │ GPS                       │ Socket.IO
              ▼                           │
      ┌──────────────────────┐            │
      │ Node.js + Express    │────────────┘
      │ Backend              │
      └──────┬───────┬───────┘
             │       │
             │       └────────── MySQL
             │
             │ MQTT
             ▼
      ┌──────────────┐
      │ Mosquitto    │
      └──────┬───────┘
             │
             ▼
          ESP32
          │   │
          │   └── Buzzer
          └────── LED
```

### Driver flow

```text
Open app
  ↓
Choose Ambulance Driver
  ↓
Login DRV001 / 1234
  ↓
Start Emergency Demo Trip
  ↓
Phone GPS starts
  ↓
Coordinates sent to Node.js backend
  ↓
Backend checks NEXT ordered junction
  ↓
Distance <= 550 metres
  ↓
Police alert created
  ↓
MQTT PLAY command sent
  ↓
ESP32 LED + buzzer ON
  ↓
Ambulance crosses target
  ↓
MQTT STOP command
  ↓
ESP32 OFF
  ↓
Next junction becomes current target
```

### Police flow

```text
Open SAME app on second phone
  ↓
Choose Traffic Police
  ↓
Login POL001 / 1234
  ↓
Police dashboard
  ↓
No emergency = green NORMAL card
  ↓
Ambulance enters target range
  ↓
Socket.IO targeted sector alert
  ↓
Officer sees junction details
  ↓
ACKNOWLEDGE / CLEAR LANE / STOP TRAFFIC
  ↓
Driver receives officer action in real time
```

---

# 5. Demo logins

## Ambulance Driver

```text
Driver ID: DRV001
Password: 1234
```

## Traffic Police

```text
Officer ID: POL001
Password: 1234
Assigned Sector: SECTOR-A
```

The credentials are inserted by the MySQL seed file.

For a college hackathon these are intentionally simple demo credentials. Do not present plain-text password storage as production security.

---

# 6. What each module does

## `mobile-app/src/screens/RoleScreen.tsx`

Purpose:

- first screen of the single app
- lets user choose Driver or Police
- proves that one APK supports both roles

## `mobile-app/src/screens/LoginScreen.tsx`

Purpose:

- common login UI
- Driver uses `DRV001`
- Police uses `POL001`
- sends selected role to backend login API

## `mobile-app/src/screens/DriverScreen.tsx`

Purpose:

- real phone GPS
- Google Map
- ambulance marker
- junction markers
- route/checkpoint polyline
- starts demo trip
- uploads GPS coordinates
- receives police actions through Socket.IO
- contains hackathon simulator buttons

## `mobile-app/src/screens/PoliceScreen.tsx`

Purpose:

- shows only assigned sector alerts
- NORMAL state when no ambulance is approaching
- EMERGENCY state for active target
- ACKNOWLEDGE button
- CLEAR LANE button
- STOP TRAFFIC button

## `backend/src/routes/auth.js`

Purpose:

- checks dummy Driver/Police login against MySQL

## `backend/src/routes/trips.js`

Purpose:

- starts trip
- accepts GPS coordinates
- returns next junction
- marks passed junction
- completes trip

## `backend/src/services/tripService.js`

This is the main project logic.

It:

1. saves ambulance location
2. selects the next unpassed junction according to `route_order`
3. calculates distance using the Haversine formula
4. activates only the next target if it comes within the configured distance
5. sends MQTT speaker command
6. creates a police alert for that junction's sector
7. automatically detects a pass using a simple distance trend
8. closes the old alert and moves to the next ordered checkpoint

## `backend/src/services/mqttService.js`

Purpose:

- connects Node.js to Mosquitto
- publishes speaker commands
- receives ESP32 status

## `esp32/amburoute_speaker.ino`

Purpose:

- connects ESP32 to Wi-Fi
- connects ESP32 to MQTT
- listens on its own speaker topic
- flashes LED and buzzer for emergency alert
- stops when STOP command is received
- includes local TTL failsafe

---

# 7. Student-friendly forward-only logic

A production city system would use a route geometry engine. That is deliberately simplified for this hackathon.

Junctions are stored in MySQL with a fixed `route_order`:

```text
1 -> Junction A
2 -> Junction B
3 -> Hospital Gate
```

The backend always checks only the **first junction that has not been passed**.

Therefore a junction behind the ambulance does not become the new target again.

Activation:

```text
next junction distance <= 550m
              ↓
        speaker ON
        police alert
```

Pass detection:

```text
ambulance comes close to target
              ↓
then moves away beyond pass threshold
              ↓
old target marked PASSED
              ↓
speaker OFF
              ↓
next route_order becomes target
```

The manual `SIMULATE JUNCTION PASSED` button is also available as a hackathon fallback.

---

# 8. Required software

For the easiest Android hackathon setup install:

1. Node.js 22.11 or newer
2. npm
3. Android Studio
4. Android SDK
5. JDK 17 or newer supported by your Android tooling
6. MySQL 8 / XAMPP MySQL OR Docker Desktop
7. Mosquitto MQTT broker OR Docker Desktop
8. Arduino IDE
9. ESP32 board support in Arduino IDE

For iOS additionally:

1. macOS
2. Xcode
3. CocoaPods
4. Ruby/Bundler as required by React Native

---

# 9. React Native version

This codebase targets:

```text
react-native: 0.88.0
react:        19.3.0
CLI:          20.2.0
```

The included Android native values follow the React Native 0.88 stable template family:

```text
compileSdk:   37
targetSdk:    36
minSdk:       24
Kotlin:       2.2.0
NDK:          27.1.12297006
Gradle:       9.4.1
```

---

# 10. MySQL setup — easiest option using XAMPP

## Step 1

Start XAMPP.

Enable:

```text
MySQL
```

## Step 2

Open phpMyAdmin.

Usually:

```text
http://localhost/phpmyadmin
```

## Step 3

Choose **Import**.

Import:

```text
database/amburoute_complete.sql
```

This automatically creates:

```text
Database: amburoute
```

and the required tables and demo users.

## Tables

```text
users
junctions
trips
trip_junctions
police_alerts
```

---

# 11. MySQL setup — backend command option

Go to backend:

```bash
cd backend
```

Install:

```bash
npm install
```

Create environment file:

```bash
cp .env.example .env
```

Default XAMPP configuration:

```env
PORT=4000
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=amburoute
MQTT_URL=mqtt://127.0.0.1:1883
ACTIVATION_DISTANCE_METERS=550
PASSED_DISTANCE_METERS=80
PASS_CONFIRM_NEAR_METERS=60
```

Initialize DB:

```bash
npm run db:init
```

Expected:

```text
Database initialized with demo users and junctions.
```

---

# 12. Docker alternative for MySQL + MQTT

If Docker Desktop is installed:

From project root:

```bash
docker compose up -d
```

This starts:

```text
MySQL        port 3306
Mosquitto    port 1883
```

Docker MySQL password in `docker-compose.yml` is:

```text
root
```

Therefore update backend `.env`:

```env
MYSQL_PASSWORD=root
```

Then:

```bash
cd backend
npm install
npm run db:init
npm run dev
```

---

# 13. Start backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Expected:

```text
AmbuRoute backend: http://0.0.0.0:4000
[MQTT] connected
```

Check health in browser:

```text
http://localhost:4000/health
```

Expected JSON:

```json
{
  "status": "ok",
  "app": "AmbuRoute Alert"
}
```

---

# 14. Start Mosquitto without Docker

macOS Homebrew example:

```bash
brew install mosquitto
brew services start mosquitto
```

Or run manually:

```bash
mosquitto -c mosquitto.conf -v
```

Check port:

```text
1883
```

---

# 15. Configure React Native backend address

Open:

```text
mobile-app/src/config/env.ts
```

## Android emulator

Keep:

```ts
const PHYSICAL_DEVICE_HOST = '';
```

Android automatically uses:

```text
10.0.2.2:4000
```

## iOS simulator

Keep it empty. iOS simulator uses:

```text
127.0.0.1:4000
```

## Physical Android/iPhone on Wi-Fi

Find your Mac/laptop IP.

macOS example:

```bash
ipconfig getifaddr en0
```

Example result:

```text
192.168.1.20
```

Set:

```ts
const PHYSICAL_DEVICE_HOST = '192.168.1.20';
```

Phone and laptop must be on the same Wi-Fi/hotspot.

### Android USB shortcut

For one Android phone connected by USB you can also run:

```bash
adb reverse tcp:4000 tcp:4000
```

Then you may use `127.0.0.1` as the backend host for that device.

For two phones on Wi-Fi, using the laptop LAN IP is simpler.

---

# 16. Google Maps Android setup

Enable in Google Cloud:

```text
Maps SDK for Android
```

Open:

```text
mobile-app/android/gradle.properties
```

Replace:

```properties
MAPS_API_KEY=YOUR_GOOGLE_MAPS_ANDROID_KEY
```

with your key.

The key is injected into `AndroidManifest.xml` through a Gradle manifest placeholder.

For final use restrict the key to:

```text
Android application
Package: com.amburoutealert
SHA-1: your debug/release signing certificate
```

The app already has:

```xml
android.permission.INTERNET
android.permission.ACCESS_FINE_LOCATION
android.permission.ACCESS_COARSE_LOCATION
```

---

# 17. Google Maps iOS setup

Enable:

```text
Maps SDK for iOS
```

Open:

```text
mobile-app/ios/AmbuRouteAlert/Info.plist
```

Replace:

```xml
<string>YOUR_GOOGLE_MAPS_IOS_KEY</string>
```

under `GMSApiKey`.

`AppDelegate.swift` already initializes Google Maps when a real key is present.

`Podfile` already contains:

```ruby
rn_maps_path = '../node_modules/react-native-maps'
pod 'react-native-maps/Google', :path => rn_maps_path
```

Location permission description is also included.

---

# 18. Install and run React Native Android

```bash
cd mobile-app
npm install
```

Start Metro terminal 1:

```bash
npm start
```

Run Android terminal 2:

```bash
npm run android
```

Or explicitly:

```bash
npx react-native run-android
```

The `android/` folder is already included.

### First Gradle run

This ZIP includes a small `android/gradlew` bootstrap script. On first use it downloads the official Gradle **9.4.1** distribution, then runs Gradle normally. Later runs use the cached copy.

This avoids shipping an opaque Gradle wrapper JAR inside the hackathon ZIP.

---

# 19. Run React Native iOS

From `mobile-app`:

```bash
npm install
```

Then:

```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

Run:

```bash
npm run ios
```

Or open:

```text
mobile-app/ios/AmbuRouteAlert.xcworkspace
```

after `pod install` and run from Xcode.

The project uses the React Native 0.88 `SceneDelegate` lifecycle structure.

---

# 20. How to test the Driver module

Open app.

Choose:

```text
AMBULANCE DRIVER
```

Login:

```text
DRV001
1234
```

Press:

```text
START EMERGENCY DEMO TRIP
```

The app will request location permission.

If GPS is available, the phone starts sending its location.

The map displays:

- ambulance marker
- demo junctions
- polyline/checkpoint path
- next control point
- distance
- speaker state
- police acknowledgement

---

# 21. Hackathon simulator buttons

A real 550m drive is inconvenient inside a college hall.

Therefore Driver module includes:

```text
SIMULATE NEAR NEXT JUNCTION
```

This sends a coordinate close to the next target.

Expected result:

```text
Backend -> distance <= 550m
Backend -> active checkpoint
Backend -> MySQL police alert
Backend -> Socket.IO police event
Backend -> MQTT PLAY_EMERGENCY_ALERT
ESP32 -> buzzer/LED ON
```

Then use:

```text
SIMULATE JUNCTION PASSED
```

Expected:

```text
old checkpoint -> PASSED
police alert -> CLOSED
MQTT STOP_EMERGENCY_ALERT
ESP32 -> OFF
next route_order -> current target
```

This is a fallback. Real GPS remains implemented.

---

# 22. How to test the Police module

Install the **same APK** on another Android phone, or simply logout and change role.

Choose:

```text
TRAFFIC POLICE
```

Login:

```text
POL001
1234
```

Initially:

```text
ALL ASSIGNED SECTORS NORMAL
```

When Driver enters/simulates target range:

```text
EMERGENCY AMBULANCE APPROACHING
```

The officer can press:

```text
ACKNOWLEDGE
CLEAR LANE
STOP TRAFFIC
```

The selected action is emitted immediately to the Driver screen through Socket.IO.

For this student version these are workflow/control-room actions. They do **not** directly operate a real municipal traffic-light controller.

---

# 23. ESP32 hardware required

Minimum:

```text
1 x ESP32 DevKit
1 x active buzzer module
1 x LED (optional because many boards have built-in LED)
1 x 220 ohm resistor if external LED is used
1 x breadboard
jumper wires
USB cable
Wi-Fi hotspot/router
```

---

# 24. ESP32 wiring

Firmware defaults:

```text
BUZZER_PIN = GPIO 25
LED_PIN    = GPIO 2
```

Example active buzzer module:

```text
ESP32 GPIO 25  -> buzzer signal/input
ESP32 GND      -> buzzer GND
ESP32 3.3V/5V -> buzzer VCC according to module rating
```

Built-in LED normally uses GPIO 2 on common ESP32 DevKit boards.

Do not connect a high-power speaker directly to an ESP32 GPIO. A real speaker/amplifier requires the correct driver circuit.

---

# 25. Arduino IDE setup

Install ESP32 board support.

Install libraries:

```text
PubSubClient
ArduinoJson
```

Open:

```text
esp32/amburoute_speaker.ino
```

Change:

```cpp
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_HOST = "192.168.1.10";
```

`MQTT_HOST` must be the laptop IP running Mosquitto.

Do **not** use:

```text
localhost
127.0.0.1
```

inside ESP32 firmware because that would point to the ESP32 itself.

Keep:

```cpp
const char* SPEAKER_ID = "speaker-001";
```

The MySQL demo junctions use the same speaker ID.

Compile and upload to ESP32.

Serial Monitor:

```text
115200 baud
```

Expected:

```text
Connecting WiFi...
ESP32 IP: ...
Connecting MQTT...connected
```

---

# 26. MQTT topics

Command topic:

```text
amburoute/speaker/speaker-001/command
```

Status topic:

```text
amburoute/speaker/speaker-001/status
```

PLAY message example:

```json
{
  "command": "PLAY_EMERGENCY_ALERT",
  "tripId": 1,
  "speakerId": "speaker-001",
  "ttlMs": 30000
}
```

STOP:

```json
{
  "command": "STOP_EMERGENCY_ALERT",
  "tripId": 1,
  "speakerId": "speaker-001"
}
```

---

# 27. Direct ESP32 MQTT test

Before testing React Native, verify the IoT layer separately.

Terminal subscriber:

```bash
mosquitto_sub -h 127.0.0.1 -t 'amburoute/speaker/+/status' -v
```

Play:

```bash
mosquitto_pub -h 127.0.0.1 \
  -t 'amburoute/speaker/speaker-001/command' \
  -m '{"command":"PLAY_EMERGENCY_ALERT","tripId":1,"ttlMs":15000}'
```

Expected:

```text
LED flashes
buzzer pulses
```

Stop:

```bash
mosquitto_pub -h 127.0.0.1 \
  -t 'amburoute/speaker/speaker-001/command' \
  -m '{"command":"STOP_EMERGENCY_ALERT","tripId":1}'
```

Expected:

```text
LED OFF
buzzer OFF
```

---

# 28. ESP32 safety TTL

If Wi-Fi/backend fails after a PLAY command, the buzzer must not continue forever.

Firmware stores:

```text
alertExpiresAt
```

After the command TTL expires it automatically turns:

```text
LED OFF
BUZZER OFF
```

This is an important safety point to explain to judges.

---

# 29. Backend APIs

## Health

```text
GET /health
```

## Login

```text
POST /api/auth/login
```

Example:

```json
{
  "userId": "DRV001",
  "password": "1234",
  "role": "DRIVER"
}
```

## Start demo trip

```text
POST /api/trips/start-demo
```

## Current demo trip

```text
GET /api/trips/demo
```

## GPS update

```text
POST /api/trips/:tripId/location
```

```json
{
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

## Manual pass fallback

```text
POST /api/trips/:tripId/pass-current-junction
```

## Complete

```text
POST /api/trips/:tripId/complete
```

## Police alerts

```text
GET /api/police/alerts/SECTOR-A
```

## Police action

```text
POST /api/police/alerts/:id/action
```

```json
{
  "action": "CLEAR_LANE"
}
```

---

# 30. Socket.IO rooms/events

Driver joins:

```text
trip:{tripId}
```

Police joins:

```text
sector:SECTOR-A
```

Relevant events:

```text
police.alert.created
police.alert.closed
police.action
checkpoint.activated
checkpoint.passed
trip.location.updated
trip.completed
speaker.status
```

---

# 31. Database explanation

## `users`

Stores demo Driver and Police users.

## `junctions`

Stores:

```text
name
latitude
longitude
sector
speaker_id
route_order
```

## `trips`

Stores active ambulance trip and current coordinates.

## `trip_junctions`

Creates an ordered checkpoint list for each trip.

Status:

```text
UPCOMING
ACTIVE
PASSED
```

## `police_alerts`

Stores targeted sector alert and officer action.

---

# 32. Change route/junctions

Edit:

```text
database/seed.sql
```

or:

```text
database/amburoute_complete.sql
```

Example:

```sql
INSERT INTO junctions
(name, latitude, longitude, sector, speaker_id, route_order)
VALUES
('College Gate', 28.6000000, 77.2000000, 'SECTOR-A', 'speaker-001', 1),
('Main Crossing', 28.6010000, 77.2010000, 'SECTOR-A', 'speaker-001', 2),
('Hospital Gate', 28.6020000, 77.2020000, 'SECTOR-A', 'speaker-001', 3);
```

Then re-run DB import/init.

Use verified coordinates for the actual hackathon demo route.

---

# 33. Complete judge demo sequence

Use two phones plus one ESP32.

### Before judging

1. Start MySQL.
2. Start Mosquitto.
3. Start backend.
4. Confirm ESP32 says MQTT connected.
5. Start Metro.
6. Install same React Native APK on two phones.

### Phone 1

```text
Ambulance Driver
DRV001 / 1234
```

Start trip.

### Phone 2

```text
Traffic Police
POL001 / 1234
```

Police shows NORMAL.

### Trigger

On Driver phone press:

```text
SIMULATE NEAR NEXT JUNCTION
```

Judges should observe simultaneously:

```text
Driver: current target ACTIVE
Police: emergency alert appears
ESP32: LED + buzzer starts
Backend terminal: MQTT command
```

Police presses:

```text
CLEAR LANE
```

Driver should immediately show:

```text
Police: CLEAR LANE
```

Then Driver presses:

```text
SIMULATE JUNCTION PASSED
```

Observe:

```text
ESP32 OFF
Police old alert closed
Next checkpoint ready
```

That demonstrates the complete idea without physically travelling 550 metres inside the venue.

---

# 34. Real GPS demonstration

For outdoor testing, do not use simulator buttons.

Start the trip and physically move the Driver phone toward the configured junction coordinates.

React Native calls:

```text
Geolocation.watchPosition(...)
```

and uploads coordinates every few seconds / movement changes.

When the current ordered target is within the threshold, backend activates it.

---

# 35. Why GPS alone is not the IoT device

The phone GPS provides:

```text
latitude
longitude
```

The ESP32 provides the physical roadside output.

Therefore:

```text
Phone GPS -> backend decision -> MQTT -> ESP32 -> speaker/buzzer
```

GPS identifies where the ambulance is.

ESP32 performs the physical alert action.

---

# 36. Common troubleshooting

## `Network request failed`

Most common cause: physical phone cannot reach laptop.

Check:

```text
same Wi-Fi
correct PHYSICAL_DEVICE_HOST
backend listening on 0.0.0.0:4000
firewall allows port 4000
```

Test from phone browser:

```text
http://LAPTOP_IP:4000/health
```

## Android map blank / grey

Check:

```text
Maps SDK for Android enabled
MAPS_API_KEY updated
billing/project configuration valid
package restriction correct
```

Then rebuild the Android app.

## Location not updating

Check Android app permission:

```text
Settings -> Apps -> AmbuRoute Alert -> Permissions -> Location
```

Use precise location while testing.

## Police receives no alert

Check:

```text
POL001 sector = SECTOR-A
junction sector = SECTOR-A
Driver trip active
backend reachable
Socket.IO connected
```

## ESP32 does not connect

Check:

```text
ESP32 and laptop same Wi-Fi
MQTT_HOST is laptop IP
Mosquitto is running
port 1883 open
```

## ESP32 receives no command

Confirm manually using `mosquitto_pub` first.

## MySQL connection denied

Update:

```text
backend/.env
```

especially:

```env
MYSQL_USER=
MYSQL_PASSWORD=
```

## Port 3306 already in use

Do not run Docker MySQL and XAMPP MySQL on the same host port simultaneously.

Choose one.

---

# 37. Important demo-vs-production explanation

For the hackathon:

- one fixed ordered demo route is enough
- MySQL is enough
- one ESP32 can represent the currently targeted smart speaker
- dummy credentials are acceptable if clearly described as demo authentication
- simulator buttons are acceptable as a backup to show the system indoors

For a real city deployment you would later add:

- secure login/token authentication
- verified officer assignments
- proper routing engine
- route-aware geospatial projection
- encrypted MQTT/TLS
- individual speaker certificates
- background location policy
- device management
- redundant backend
- municipal traffic controller integration
- audit/security monitoring

Do not claim those production capabilities are already deployed in this student prototype.

---

# 38. Final run checklist

Backend:

```text
[ ] MySQL running
[ ] amburoute database imported
[ ] npm install completed
[ ] .env configured
[ ] backend running on 4000
```

MQTT/ESP32:

```text
[ ] Mosquitto running
[ ] ESP32 Wi-Fi configured
[ ] ESP32 MQTT_HOST = laptop IP
[ ] speaker-001 matches DB
[ ] direct MQTT PLAY/STOP tested
```

Mobile:

```text
[ ] npm install completed
[ ] Google Maps Android key configured
[ ] backend host configured for device
[ ] Metro running
[ ] same APK installed on both phones
[ ] Driver login works
[ ] Police login works
[ ] GPS permission works
[ ] map renders
```

End-to-end:

```text
[ ] Start trip
[ ] Simulate near target
[ ] ESP32 ON
[ ] Police alert appears
[ ] CLEAR LANE reaches Driver
[ ] Pass target
[ ] ESP32 OFF
[ ] Next target selected
```

---

# 39. Recommended presentation line

A simple explanation to judges:

> "We use the ambulance driver's phone GPS to continuously track the ambulance. The Node.js backend checks only the next junction in the configured emergency corridor. When that junction comes within the activation zone, only its ESP32 speaker is triggered through MQTT and only the responsible traffic sector receives the alert. After the ambulance crosses the junction, that alert is automatically isolated and the system moves to the next checkpoint."

---

# 40. Security note

`DRV001 / 1234` and `POL001 / 1234` are intentionally hackathon demo credentials.

Do not use this authentication design for a real emergency/public-safety deployment.
