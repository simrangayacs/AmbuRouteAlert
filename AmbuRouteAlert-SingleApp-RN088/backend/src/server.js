import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import {Server} from 'socket.io';
import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import policeRoutes from './routes/police.js';
import {configureSocket} from './socket/index.js';
import {initMqtt} from './services/mqttService.js';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => res.json({status: 'ok', app: 'AmbuRoute Alert'}));
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/police', policeRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({success: false, message: err.message || 'Internal server error'});
});

const server = http.createServer(app);
const io = new Server(server, {cors: {origin: '*'}});
app.set('io', io);
configureSocket(io);
initMqtt(io);

const port = Number(process.env.PORT || 4000);
server.listen(port, '0.0.0.0', () => console.log(`AmbuRoute backend: http://0.0.0.0:${port}`));
