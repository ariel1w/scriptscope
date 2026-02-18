-- Marketing content table
CREATE TABLE IF NOT EXISTS marketing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent TEXT NOT NULL CHECK (agent IN ('writer', 'insider')),
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  suggested_target TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'skipped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  posted_at TIMESTAMP WITH TIME ZONE
);

-- Marketing events tracking table
CREATE TABLE IF NOT EXISTS marketing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_source TEXT NOT NULL CHECK (ref_source IN ('writer', 'insider')),
  event_type TEXT NOT NULL CHECK (event_type IN ('click', 'signup', 'analysis', 'purchase')),
  user_email TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketing_content_agent ON marketing_content(agent);
CREATE INDEX IF NOT EXISTS idx_marketing_content_created_at ON marketing_content(created_at);
CREATE INDEX IF NOT EXISTS idx_marketing_content_status ON marketing_content(status);
CREATE INDEX IF NOT EXISTS idx_marketing_events_ref_source ON marketing_events(ref_source);
CREATE INDEX IF NOT EXISTS idx_marketing_events_created_at ON marketing_events(created_at);
CREATE INDEX IF NOT EXISTS idx_marketing_events_event_type ON marketing_events(event_type);

-- RLS policies
ALTER TABLE marketing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_events ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role can do everything on marketing_content"
  ON marketing_content FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on marketing_events"
  ON marketing_events FOR ALL
  USING (auth.role() = 'service_role');
