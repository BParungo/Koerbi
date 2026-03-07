-- ============================================
-- Run this in the Supabase SQL Editor
-- ============================================


-- ============================================
-- 1. HELPER FUNCTION (invite code)
-- ============================================

-- Generate random 8-character invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
  SELECT upper(substr(md5(random()::text), 1, 8))
$$ LANGUAGE sql
SET search_path = pg_catalog;


-- ============================================
-- 2. TABLES
-- ============================================

-- families
CREATE TABLE families (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  invite_code  TEXT UNIQUE NOT NULL DEFAULT generate_invite_code(),
  created_by   UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- family_members
CREATE TABLE family_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  avatar     TEXT,
  role       TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at  TIMESTAMPTZ DEFAULT now(),

  UNIQUE (family_id, user_id)
);

-- recipes
CREATE TABLE recipes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID REFERENCES families(id) ON DELETE CASCADE,
  created_by  UUID REFERENCES auth.users(id),
  name        TEXT NOT NULL,
  emoji       TEXT DEFAULT '🍽️',
  duration    TEXT,
  servings    INT DEFAULT 4,
  category    TEXT,
  steps       TEXT[],
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ingredients
CREATE TABLE ingredients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id  UUID REFERENCES recipes(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  amount     TEXT,
  unit       TEXT,
  sort_order INT DEFAULT 0
);

-- shopping_lists
CREATE TABLE shopping_lists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID REFERENCES families(id) ON DELETE CASCADE,
  name        TEXT DEFAULT 'Shopping List',
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- shopping_items
CREATE TABLE shopping_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id          UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  family_id        UUID REFERENCES families(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  amount           TEXT,
  unit             TEXT,
  category         TEXT,
  done             BOOLEAN DEFAULT false,
  done_by          UUID REFERENCES auth.users(id),
  done_at          TIMESTAMPTZ,
  assigned_to      UUID REFERENCES auth.users(id),
  from_recipe_id   UUID REFERENCES recipes(id),
  sort_order       INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);


-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_recipes_family_id ON recipes(family_id);
CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX idx_shopping_lists_family_id ON shopping_lists(family_id);
CREATE INDEX idx_shopping_items_list_id ON shopping_items(list_id);
CREATE INDEX idx_shopping_items_family_id ON shopping_items(family_id);
CREATE INDEX idx_shopping_items_done ON shopping_items(done);


-- ============================================
-- 4. HELPER FUNCTION
-- ============================================

-- Get all family IDs the current user belongs to
CREATE OR REPLACE FUNCTION my_family_ids()
RETURNS SETOF UUID AS $$
  SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp;


-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE families        ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists  ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items  ENABLE ROW LEVEL SECURITY;


-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- Helper: get family IDs including via ingredients (bypasses nested RLS)
CREATE OR REPLACE FUNCTION family_id_for_recipe(recipe_uuid UUID)
RETURNS UUID AS $$
  SELECT family_id FROM public.recipes WHERE id = recipe_uuid
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp;

-- families: members can view their own family
CREATE POLICY "Members can view own family"
  ON families FOR SELECT
  USING (id IN (SELECT my_family_ids()));

-- families: authenticated users can only create rows owned by themselves
CREATE POLICY "Authenticated users can create families"
  ON families FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- families: admin can update family name
CREATE POLICY "Admin can update family"
  ON families FOR UPDATE
  USING (id IN (SELECT my_family_ids()));

-- family_members: view members of own family
CREATE POLICY "View own family members"
  ON family_members FOR SELECT
  USING (family_id IN (SELECT my_family_ids()));

-- family_members: join a family (insert yourself)
-- Note: also allows first member after creating a family (no my_family_ids check)
CREATE POLICY "Join a family"
  ON family_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- family_members: update own membership
CREATE POLICY "Update own membership"
  ON family_members FOR UPDATE
  USING (user_id = auth.uid());

-- recipes: full access for own family
CREATE POLICY "Own family only"
  ON recipes FOR ALL
  USING (family_id IN (SELECT my_family_ids()));

-- ingredients: access via recipe's family (uses SECURITY DEFINER to avoid nested RLS)
CREATE POLICY "Own family only"
  ON ingredients FOR ALL
  USING (family_id_for_recipe(recipe_id) IN (SELECT my_family_ids()));

-- shopping_lists: full access for own family
CREATE POLICY "Own family only"
  ON shopping_lists FOR ALL
  USING (family_id IN (SELECT my_family_ids()));

-- shopping_items: full access for own family
CREATE POLICY "Own family only"
  ON shopping_items FOR ALL
  USING (family_id IN (SELECT my_family_ids()));
