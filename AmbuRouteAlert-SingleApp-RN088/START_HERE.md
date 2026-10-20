# START HERE

This ZIP contains **one React Native CLI 0.88 app** for both Driver and Police.

1. Read `README.md`.
2. Import `database/amburoute_complete.sql` into MySQL.
3. Start Mosquitto.
4. `cd backend && npm install && cp .env.example .env && npm run dev`
5. Put your Google Maps key in `mobile-app/android/gradle.properties`.
6. For a physical phone, set your laptop IP in `mobile-app/src/config/env.ts`.
7. `cd mobile-app && npm install && npm start`
8. In another terminal: `cd mobile-app && npm run android`
9. Driver login: `DRV001 / 1234`.
10. Police login: `POL001 / 1234`.
11. ESP32 firmware is `esp32/amburoute_speaker.ino`.

There are no separate `driver-mobile` and `police-mobile` projects.
