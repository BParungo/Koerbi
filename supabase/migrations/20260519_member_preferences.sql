-- ============================================
-- member_preferences: dietary preferences & allergies per family member
-- ============================================

CREATE TABLE member_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('allergy', 'diet')),
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, type, value)
);

CREATE INDEX idx_member_preferences_member_id ON member_preferences(member_id);

ALTER TABLE member_preferences ENABLE ROW LEVEL SECURITY;

-- Helper: family_id for a given member (SECURITY DEFINER bypasses nested RLS)
CREATE OR REPLACE FUNCTION family_id_for_member(member_uuid UUID)
RETURNS UUID AS $$
  SELECT family_id FROM public.family_members WHERE id = member_uuid
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp;

-- Anyone in the same family can read preferences (needed for product checks)
CREATE POLICY "View own family preferences"
  ON member_preferences FOR SELECT
  USING (family_id_for_member(member_id) IN (SELECT my_family_ids()));

-- Only the member themselves can insert/update/delete their own preferences
CREATE POLICY "Manage own preferences"
  ON member_preferences FOR ALL
  USING (
    member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );
