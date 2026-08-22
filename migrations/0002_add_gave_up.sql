-- Giving up ends a day without playing it out. It is stored alongside results so the server derives
-- the same streak the client shows: the streak breaks, but games played and win rate do not move.
ALTER TABLE results ADD COLUMN gave_up INTEGER NOT NULL DEFAULT 0;
