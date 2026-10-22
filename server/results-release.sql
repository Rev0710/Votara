-- Persist Electoral Board result releases separately from election publishing.
-- Election publishing controls candidate visibility; result release controls
-- when aggregate tallies become visible on student dashboards.
ALTER TABLE public.elections
    ADD COLUMN IF NOT EXISTS results_released boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS results_released_at timestamptz;
