CREATE DATABASE IF NOT EXISTS amburoute;
USE amburoute;

DROP TABLE IF EXISTS police_alerts;
DROP TABLE IF EXISTS trip_junctions;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS junctions;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('DRIVER','POLICE') NOT NULL,
  sector VARCHAR(50) NULL
);

CREATE TABLE junctions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  sector VARCHAR(50) NOT NULL,
  speaker_id VARCHAR(100) NOT NULL,
  route_order INT NOT NULL
);

CREATE TABLE trips (
  id INT PRIMARY KEY AUTO_INCREMENT,
  driver_user_id INT NOT NULL,
  ambulance_no VARCHAR(30) NOT NULL,
  destination VARCHAR(150) NOT NULL,
  status ENUM('ACTIVE','COMPLETED','CANCELLED') DEFAULT 'ACTIVE',
  current_latitude DECIMAL(10,7) NULL,
  current_longitude DECIMAL(10,7) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_user_id) REFERENCES users(id)
);

CREATE TABLE trip_junctions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trip_id INT NOT NULL,
  junction_id INT NOT NULL,
  sequence_no INT NOT NULL,
  status ENUM('UPCOMING','ACTIVE','PASSED') DEFAULT 'UPCOMING',
  activated_at DATETIME NULL,
  passed_at DATETIME NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  FOREIGN KEY (junction_id) REFERENCES junctions(id)
);

CREATE TABLE police_alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trip_id INT NOT NULL,
  junction_id INT NOT NULL,
  sector VARCHAR(50) NOT NULL,
  status ENUM('ACTIVE','CLOSED') DEFAULT 'ACTIVE',
  last_action VARCHAR(40) NULL,
  acknowledged_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  FOREIGN KEY (junction_id) REFERENCES junctions(id)
);
USE amburoute;

INSERT INTO users (user_id, password, name, role, sector) VALUES
('DRV001', '1234', 'Demo Ambulance Driver', 'DRIVER', NULL),
('POL001', '1234', 'Demo Traffic Officer', 'POLICE', 'SECTOR-A');

-- Demo coordinates only. Replace with verified local coordinates for the final hackathon venue.
INSERT INTO junctions (name, latitude, longitude, sector, speaker_id, route_order) VALUES
('Junction A - Demo', 28.6139000, 77.2090000, 'SECTOR-A', 'speaker-001', 1),
('Junction B - Demo', 28.6148000, 77.2105000, 'SECTOR-A', 'speaker-001', 2),
('Hospital Gate - Demo', 28.6161000, 77.2120000, 'SECTOR-A', 'speaker-001', 3);
