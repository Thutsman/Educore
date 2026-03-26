-- Term calendar events for attendance/day counting
CREATE TABLE IF NOT EXISTS term_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('public_holiday', 'exeat_weekend', 'closure', 'school_day')),
  title TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT term_calendar_events_unique_day UNIQUE (term_id, event_date)
);

CREATE INDEX IF NOT EXISTS idx_term_calendar_events_term_date
  ON term_calendar_events(term_id, event_date);

ALTER TABLE term_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "term_calendar_events_select" ON term_calendar_events;
CREATE POLICY "term_calendar_events_select" ON term_calendar_events
  FOR SELECT USING (
    school_id = ANY(get_user_school_ids())
  );

DROP POLICY IF EXISTS "term_calendar_events_manage" ON term_calendar_events;
CREATE POLICY "term_calendar_events_manage" ON term_calendar_events
  FOR ALL USING (
    has_any_role(ARRAY['school_admin', 'headmaster', 'deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );
