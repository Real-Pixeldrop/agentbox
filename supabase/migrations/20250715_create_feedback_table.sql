-- Feedback table for beta testers
-- To remove after beta: DROP TABLE IF EXISTS feedback;

CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'improvement', 'suggestion')),
  description TEXT NOT NULL,
  page_url TEXT,
  agent_id TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved'))
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert feedback
CREATE POLICY "Users can insert feedback" ON feedback
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow users to view their own feedback
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
