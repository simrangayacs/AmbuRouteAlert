import 'dotenv/config';
import {pool} from '../config/db.js';
import {getDistanceMeters} from '../utils/distance.js';
import {publishSpeakerCommand} from './mqttService.js';

const activationDistance = Number(process.env.ACTIVATION_DISTANCE_METERS || 550);
const passedDistance = Number(process.env.PASSED_DISTANCE_METERS || 80);
const nearDistance = Number(process.env.PASS_CONFIRM_NEAR_METERS || 60);

// Student-friendly in-memory distance trend. No Redis/PostGIS is needed for the hackathon.
// This is only used to determine that the ambulance came close to the current target and
// then moved away from it, which is treated as "passed" for the ordered demo route.
const distanceState = new Map();

export async function getTripWithNextJunction(tripId) {
  const [[trip]] = await pool.query('SELECT * FROM trips WHERE id = ?', [tripId]);
  if (!trip) return null;

  const [[junction]] = await pool.query(
    `SELECT tj.*, j.name, j.latitude, j.longitude, j.speaker_id, j.sector
     FROM trip_junctions tj
     JOIN junctions j ON j.id = tj.junction_id
     WHERE tj.trip_id = ? AND tj.status IN ('UPCOMING','ACTIVE')
     ORDER BY tj.sequence_no ASC
     LIMIT 1`,
    [tripId],
  );

  return {trip, junction: junction || null};
}

export async function processLocation({tripId, latitude, longitude}, io) {
  await pool.query(
    'UPDATE trips SET current_latitude=?, current_longitude=?, updated_at=NOW() WHERE id=?',
    [latitude, longitude, tripId],
  );

  const data = await getTripWithNextJunction(tripId);
  if (!data) throw new Error('Trip not found');

  const {trip, junction} = data;
  const response = {tripId, latitude, longitude, nextJunction: null, autoPassed: false};

  if (!junction) {
    io.to(`trip:${tripId}`).emit('trip.location.updated', response);
    return response;
  }

  const distance = Math.round(getDistanceMeters(
    latitude,
    longitude,
    Number(junction.latitude),
    Number(junction.longitude),
  ));

  response.nextJunction = {
    id: junction.junction_id,
    name: junction.name,
    distanceMeters: distance,
    status: junction.status,
    sector: junction.sector,
  };

  const key = `${tripId}:${junction.junction_id}`;
  const state = distanceState.get(key) || {minDistance: Number.POSITIVE_INFINITY};
  state.minDistance = Math.min(state.minDistance, distance);
  distanceState.set(key, state);

  if (junction.status === 'UPCOMING' && distance <= activationDistance) {
    const [update] = await pool.query(
      `UPDATE trip_junctions SET status='ACTIVE', activated_at=NOW()
       WHERE trip_id=? AND junction_id=? AND status='UPCOMING'`,
      [tripId, junction.junction_id],
    );

    if (update.affectedRows > 0) {
      if (junction.speaker_id) {
        publishSpeakerCommand(junction.speaker_id, 'PLAY_EMERGENCY_ALERT', tripId);
      }

      await pool.query(
        `INSERT INTO police_alerts (trip_id, junction_id, sector, status)
         SELECT ?, ?, ?, 'ACTIVE'
         WHERE NOT EXISTS (
           SELECT 1 FROM police_alerts
           WHERE trip_id=? AND junction_id=? AND status='ACTIVE'
         )`,
        [tripId, junction.junction_id, junction.sector, tripId, junction.junction_id],
      );

      const alert = {
        tripId,
        junctionId: junction.junction_id,
        junctionName: junction.name,
        sector: junction.sector,
        distanceMeters: distance,
        ambulanceNo: trip.ambulance_no,
        destination: trip.destination,
      };

      io.to(`sector:${junction.sector}`).emit('police.alert.created', alert);
      io.to(`trip:${tripId}`).emit('checkpoint.activated', alert);
    }
    response.nextJunction.status = 'ACTIVE';
  }

  // Automatic student-demo pass detection:
  // once the active ambulance gets close to the junction and then is farther than
  // PASSED_DISTANCE_METERS, the current checkpoint is considered crossed.
  const currentlyActive = response.nextJunction.status === 'ACTIVE' || junction.status === 'ACTIVE';
  if (currentlyActive && state.minDistance <= nearDistance && distance >= passedDistance) {
    await markCurrentJunctionPassed(tripId, io);
    response.autoPassed = true;
    response.nextJunction.status = 'PASSED';
  }

  io.to(`trip:${tripId}`).emit('trip.location.updated', response);
  return response;
}

export async function markCurrentJunctionPassed(tripId, io) {
  const data = await getTripWithNextJunction(tripId);
  if (!data?.junction) return null;
  const junction = data.junction;

  await pool.query(
    `UPDATE trip_junctions SET status='PASSED', passed_at=NOW()
     WHERE trip_id=? AND junction_id=? AND status IN ('UPCOMING','ACTIVE')`,
    [tripId, junction.junction_id],
  );

  await pool.query(
    `UPDATE police_alerts SET status='CLOSED'
     WHERE trip_id=? AND junction_id=? AND status='ACTIVE'`,
    [tripId, junction.junction_id],
  );

  if (junction.speaker_id) {
    publishSpeakerCommand(junction.speaker_id, 'STOP_EMERGENCY_ALERT', tripId);
  }

  distanceState.delete(`${tripId}:${junction.junction_id}`);

  io.to(`trip:${tripId}`).emit('checkpoint.passed', {
    tripId,
    junctionId: junction.junction_id,
    junctionName: junction.name,
  });

  io.to(`sector:${junction.sector}`).emit('police.alert.closed', {
    tripId,
    junctionId: junction.junction_id,
  });

  return junction;
}

export async function safelyCompleteTrip(tripId, io) {
  const [[active]] = await pool.query(
    `SELECT tj.junction_id, j.speaker_id, j.sector, j.name
     FROM trip_junctions tj
     JOIN junctions j ON j.id=tj.junction_id
     WHERE tj.trip_id=? AND tj.status='ACTIVE'
     ORDER BY tj.sequence_no LIMIT 1`,
    [tripId],
  );

  if (active?.speaker_id) {
    publishSpeakerCommand(active.speaker_id, 'STOP_EMERGENCY_ALERT', tripId);
  }

  await pool.query("UPDATE police_alerts SET status='CLOSED' WHERE trip_id=? AND status='ACTIVE'", [tripId]);
  await pool.query("UPDATE trips SET status='COMPLETED', updated_at=NOW() WHERE id=?", [tripId]);

  io.to(`trip:${tripId}`).emit('trip.completed', {tripId});
  if (active?.sector) {
    io.to(`sector:${active.sector}`).emit('police.alert.closed', {tripId, junctionId: active.junction_id});
  }
}
