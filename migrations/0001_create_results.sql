CREATE TABLE results (
  uuid TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  won INTEGER NOT NULL,
  guess_count INTEGER NOT NULL,
  hints_used INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (uuid, day_number)
);
