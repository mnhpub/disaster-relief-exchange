-- Event Store table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  aggregate_id TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSON NOT NULL,
  version INTEGER NOT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_aggregate_id (aggregate_id),
  INDEX idx_aggregate_version (aggregate_id, version),
  INDEX idx_event_type (event_type),
  INDEX idx_timestamp (timestamp)
);

-- Read Models for Incidents
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  status TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  closed_at DATETIME,
  close_reason TEXT,
  version INTEGER NOT NULL,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Read Models for Resource Requests
CREATE TABLE IF NOT EXISTS resource_requests (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  priority TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  fulfilled_at DATETIME,
  cancelled_at DATETIME,
  expires_at DATETIME,
  version INTEGER NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  INDEX idx_incident_id (incident_id),
  INDEX idx_status (status),
  INDEX idx_resource_type (resource_type),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Read Models for Supply Offers
CREATE TABLE IF NOT EXISTS supply_offers (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  available_until DATETIME NOT NULL,
  note TEXT,
  status TEXT NOT NULL,
  reserved_quantity INTEGER DEFAULT 0,
  matched_request_id TEXT,
  created_at DATETIME NOT NULL,
  completed_at DATETIME,
  version INTEGER NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  INDEX idx_incident_id (incident_id),
  INDEX idx_status (status),
  INDEX idx_resource_type (resource_type),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Most Needed Today (aggregated)
CREATE TABLE IF NOT EXISTS most_needed_today (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  total_requests INTEGER NOT NULL,
  unfulfilled_requests INTEGER NOT NULL,
  last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  UNIQUE (incident_id, resource_type),
  INDEX idx_incident_id (incident_id)
);

-- Verified Organizations
CREATE TABLE IF NOT EXISTS verified_organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  verification_level INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  verified_at DATETIME,
  INDEX idx_verification_level (verification_level),
  INDEX idx_status (status)
);

-- Moderation Queue
CREATE TABLE IF NOT EXISTS moderation_queue (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL,
  flagged_content_id TEXT NOT NULL,
  flagged_content_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL,
  reviewed_at DATETIME,
  action TEXT,
  reviewed_by TEXT,
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  INDEX idx_incident_id (incident_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Snapshots (for optimizing aggregate loading)
CREATE TABLE IF NOT EXISTS snapshots (
  id TEXT PRIMARY KEY,
  aggregate_id TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  version INTEGER NOT NULL,
  payload JSON NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE (aggregate_id, aggregate_type),
  INDEX idx_aggregate_id (aggregate_id)
);
