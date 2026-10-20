import {Router} from 'express';
import {pool} from '../config/db.js';
import {processLocation, markCurrentJunctionPassed, safelyCompleteTrip} from '../services/tripService.js';
const router = Router();

router.get('/demo', async (_req, res) => {
  const [[trip]] = await pool.query("SELECT * FROM trips WHERE status='ACTIVE' ORDER BY id DESC LIMIT 1");
  if (!trip) return res.status(404).json({message: 'No active demo trip'});
  const [junctions] = await pool.query(
    `SELECT tj.sequence_no, tj.status, j.* FROM trip_junctions tj
     JOIN junctions j ON j.id=tj.junction_id
     WHERE tj.trip_id=? ORDER BY tj.sequence_no`,
    [trip.id],
  );
  res.json({trip, junctions});
});

router.post('/start-demo', async (_req, res) => {
  await pool.query("UPDATE trips SET status='COMPLETED' WHERE status='ACTIVE'");
  const [result] = await pool.query(
    `INSERT INTO trips (driver_user_id, ambulance_no, destination, status)
     VALUES ((SELECT id FROM users WHERE user_id='DRV001'), 'AMB-101', 'ANMMCH Hospital', 'ACTIVE')`,
  );
  const tripId = result.insertId;
  const [junctions] = await pool.query('SELECT id FROM junctions ORDER BY route_order');
  for (let i = 0; i < junctions.length; i++) {
    await pool.query(
      'INSERT INTO trip_junctions (trip_id, junction_id, sequence_no, status) VALUES (?,?,?,\'UPCOMING\')',
      [tripId, junctions[i].id, i + 1],
    );
  }
  res.json({success: true, tripId});
});

router.post('/:tripId/location', async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const result = await processLocation({
      tripId: Number(req.params.tripId),
      latitude: Number(req.body.latitude),
      longitude: Number(req.body.longitude),
    }, io);
    res.json({success: true, ...result});
  } catch (e) { next(e); }
});

router.post('/:tripId/pass-current-junction', async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const result = await markCurrentJunctionPassed(Number(req.params.tripId), io);
    res.json({success: true, junction: result});
  } catch (e) { next(e); }
});

router.post('/:tripId/complete', async (req, res, next) => {
  try {
    await safelyCompleteTrip(Number(req.params.tripId), req.app.get('io'));
    res.json({success: true});
  } catch (e) {
    next(e);
  }
});

export default router;
