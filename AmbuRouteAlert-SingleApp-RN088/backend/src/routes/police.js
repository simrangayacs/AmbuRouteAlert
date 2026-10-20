import {Router} from 'express';
import {pool} from '../config/db.js';
const router = Router();

router.get('/alerts/:sector', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT pa.*, j.name AS junction_name, t.ambulance_no, t.destination
     FROM police_alerts pa
     JOIN junctions j ON j.id=pa.junction_id
     JOIN trips t ON t.id=pa.trip_id
     WHERE pa.sector=? ORDER BY pa.id DESC LIMIT 20`,
    [req.params.sector],
  );
  res.json({alerts: rows});
});

router.post('/alerts/:id/action', async (req, res) => {
  const {action} = req.body;
  if (!['CLEAR_LANE', 'STOP_TRAFFIC', 'ACKNOWLEDGE'].includes(action)) {
    return res.status(400).json({message: 'Invalid action'});
  }
  const [[alert]] = await pool.query('SELECT * FROM police_alerts WHERE id=?', [req.params.id]);
  if (!alert) return res.status(404).json({message: 'Alert not found'});

  await pool.query(
    `UPDATE police_alerts SET last_action=?, acknowledged_at=NOW() WHERE id=?`,
    [action, req.params.id],
  );

  const payload = {alertId: Number(req.params.id), tripId: alert.trip_id, action};
  req.app.get('io').to(`trip:${alert.trip_id}`).emit('police.action', payload);
  res.json({success: true, ...payload});
});

export default router;
