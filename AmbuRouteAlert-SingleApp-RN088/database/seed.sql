USE amburoute;

INSERT INTO users (user_id, password, name, role, sector) VALUES
('DRV001', '1234', 'Demo Ambulance Driver', 'DRIVER', NULL),
('POL001', '1234', 'Demo Traffic Officer', 'POLICE', 'SECTOR-A');

-- Demo coordinates only. Replace with verified local coordinates for the final hackathon venue.
INSERT INTO junctions (name, latitude, longitude, sector, speaker_id, route_order) VALUES
('Junction A - Demo', 28.6139000, 77.2090000, 'SECTOR-A', 'speaker-001', 1),
('Junction B - Demo', 28.6148000, 77.2105000, 'SECTOR-A', 'speaker-001', 2),
('Hospital Gate - Demo', 28.6161000, 77.2120000, 'SECTOR-A', 'speaker-001', 3);
