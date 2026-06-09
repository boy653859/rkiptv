CREATE DATABASE IF NOT EXISTS if0_42142326_rkiptv
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE if0_42142326_rkiptv;

-- MATCHES
CREATE TABLE IF NOT EXISTS matches (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  sport        ENUM('cricket','football','others') NOT NULL,
  tournament   VARCHAR(200) NOT NULL,
  team1_name   VARCHAR(100) NOT NULL,
  team1_logo   VARCHAR(500) DEFAULT NULL,
  team2_name   VARCHAR(100) NOT NULL,
  team2_logo   VARCHAR(500) DEFAULT NULL,
  match_date   DATE         NOT NULL,
  match_time   TIME         NOT NULL,
  stream_url   VARCHAR(500) DEFAULT NULL,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_match_time (match_date, match_time),
  INDEX idx_sport (sport)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CHANNELS
CREATE TABLE IF NOT EXISTS channels (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  logo         VARCHAR(500) DEFAULT NULL,
  stream_url   VARCHAR(500) DEFAULT NULL,
  is_live      TINYINT(1)   DEFAULT 0,
  meta         VARCHAR(100) DEFAULT 'Sports',
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_meta (meta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ALL CHANNELS
CREATE TABLE IF NOT EXISTS all_channels (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  logo       VARCHAR(500) DEFAULT NULL,
  stream_url VARCHAR(500) DEFAULT NULL,
  is_live    TINYINT(1)   DEFAULT 0,
  meta       VARCHAR(100) DEFAULT 'Sports',
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_meta (meta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
