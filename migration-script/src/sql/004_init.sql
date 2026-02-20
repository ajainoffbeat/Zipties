-- For post table
ALTER TABLE public.post
ALTER COLUMN is_blocked TYPE BOOLEAN USING (is_blocked = B '1');
-- Converts the existing 'is_blocked' column from BIT(1) to BOOLEAN.
-- Any value B'1' becomes TRUE, B'0' becomes FALSE.
ALTER TABLE public.post
ALTER COLUMN is_blocked
SET DEFAULT FALSE;
-- Sets the default value of 'is_blocked' to FALSE for new rows.
-- For post_assets table
ALTER TABLE public.post_assets
ALTER COLUMN is_active TYPE BOOLEAN USING (is_active = B '1');
-- Converts 'is_active' from BIT(1) to BOOLEAN.
-- B'1' → TRUE, B'0' → FALSE.
ALTER TABLE public.post_assets
ALTER COLUMN is_active
SET DEFAULT TRUE;
-- Sets the default value of 'is_active' to TRUE for new rows.
INSERT INTO public.assets_type (
        id,
        name,
        description,
        is_active
    )
VALUES (
        uuid_generate_v4(),
        'image',
        'Image files',
        b '1'
    );

INSERT INTO public.post_reaction_type (
        id,
        name,
        description,
        is_active
    )
VALUES (
        uuid_generate_v4(),
        'like',
        'Like reaction',
        b '1'
    );

ALTER TABLE post_assets
ALTER COLUMN url TYPE text USING url::text;

-- Convert is_blocked from BIT(1) to BOOLEAN in post_comment table
ALTER TABLE post_comment
ALTER COLUMN is_blocked TYPE BOOLEAN
USING (is_blocked::int = 1);

-- Set default value for is_blocked in post_comment table
ALTER TABLE post_comment
ALTER COLUMN is_blocked SET DEFAULT FALSE;
-- ============================================================================
-- Function: fn_create_post
-- Purpose: Creates a new post
-- Parameters:
--   p_user_id: UUID - The ID of the user creating the post
--   p_content: VARCHAR - The content of the post
-- Returns: UUID - The ID of the newly created post
-- Author        : OFFBEAT
-- Created On    : 18/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_create_post(p_user_id UUID, p_content VARCHAR) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE v_post_id UUID;
BEGIN
INSERT INTO public.post (
        user_id,
        content,
        created_at
    )
VALUES (
        p_user_id,
        p_content,
        NOW()
    )
RETURNING id INTO v_post_id;
RETURN v_post_id;
END;
$$;
-- ============================================================================
-- Function: fn_edit_post
-- Purpose: Edits an existing post's content
-- Parameters:
--   p_post_id: UUID - The ID of the post to edit
--   p_user_id: UUID - The ID of the user editing the post (for tracking)
--   p_content: VARCHAR - The new content of the post
-- Returns: BOOLEAN - True if the post was successfully edited, false otherwise
-- Author        : OFFBEAT
-- Created On    : 18/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_edit_post(
        p_post_id UUID,
        p_user_id UUID,
        p_content VARCHAR
    ) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE v_exists BOOLEAN := FALSE;
BEGIN -- Check if the post exists and belongs to the user
SELECT EXISTS(
        SELECT 1
        FROM public.post
        WHERE id = p_post_id
            AND user_id = p_user_id
    ) INTO v_exists;
IF NOT v_exists THEN RETURN FALSE;
END IF;
UPDATE public.post
SET content = p_content,
    updated_by = p_user_id,
    updated_at = NOW()
WHERE id = p_post_id;
RETURN TRUE;
END;
$$;
-- ============================================================================
-- Function: fn_delete_post
-- Purpose: Deletes a post if owned by the user
-- Parameters:
--   p_post_id: UUID - The ID of the post to delete
--   p_user_id: UUID - The ID of the user attempting to delete
-- Returns: BOOLEAN - True if the post was successfully deleted, false otherwise
-- Author        : OFFBEAT
-- Created On    : 18/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_delete_post(p_post_id UUID, p_user_id UUID) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE v_exists BOOLEAN := FALSE;
BEGIN -- Check if the post exists and belongs to the user
SELECT EXISTS(
        SELECT 1
        FROM public.post
        WHERE id = p_post_id
            AND user_id = p_user_id
    ) INTO v_exists;
IF NOT v_exists THEN RETURN FALSE;
END IF;
-- Delete associated assets first
DELETE FROM public.post_assets
WHERE post_id = p_post_id;
-- Delete associated reactions
DELETE FROM public.post_reaction
WHERE post_id = p_post_id;
-- Delete associated comments and their reports
DELETE FROM public.post_comment_report
WHERE post_comment_id IN (
        SELECT id
        FROM public.post_comment
        WHERE post_id = p_post_id
    );
DELETE FROM public.post_comment
WHERE post_id = p_post_id;
-- Delete post reports
DELETE FROM public.post_report
WHERE post_id = p_post_id;
-- Finally delete the post
DELETE FROM public.post
WHERE id = p_post_id
    AND user_id = p_user_id;
RETURN TRUE;
END;
$$;
-- ============================================================================
-- Function: fn_get_post
-- Purpose: Gets a single post with its assets and user information
-- Parameters:
--   p_post_id: UUID - The ID of the post to retrieve
--   p_user_id: UUID - The ID of the user retrieving the post
-- Returns: Table with post details including like and comment counts
-- Author        : OFFBEAT
-- Created On    : 18/02/2026   
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_post(
    p_post_id UUID,
    p_user_id UUID
)
RETURNS TABLE(
    post_id UUID,
    content VARCHAR,
    is_blocked BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    user_id UUID,
    user_firstname VARCHAR,
    user_lastname VARCHAR,
    user_username VARCHAR,
    assets JSON,
    like_count INTEGER,
    comment_count INTEGER,
    is_liked BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
SELECT 
    p.id AS post_id,
    p.content,
    p.is_blocked,
    p.created_at,
    p.updated_at,
    u.id AS user_id,
    u.firstname,
    u.lastname,
    u.username,

    -- ✅ Assets aggregated separately
    COALESCE(pa.assets, '[]'::json) AS assets,

    -- ✅ Likes counted separately
    COALESCE(lc.like_count, 0) AS like_count,

    -- ✅ Comments counted separately
    COALESCE(cc.comment_count, 0) AS comment_count,

    -- ✅ Is liked check
    EXISTS (
        SELECT 1
        FROM public.post_reaction pr_inner
        JOIN public.post_reaction_type prt_inner 
            ON pr_inner.post_reaction_type_id = prt_inner.id
        WHERE pr_inner.post_id = p.id
          AND pr_inner.user_id = p_user_id
          AND prt_inner.name = 'like'
          AND pr_inner.is_active = B'1'
    ) AS is_liked

FROM public.post p
JOIN public."user" u 
    ON p.user_id = u.id

-- 🔥 Aggregate assets separately
LEFT JOIN LATERAL (
    SELECT json_agg(
        json_build_object(
            'id', pa.id,
            'url', pa.url,
            'mimetype', pa.mimetype,
            'file_size_bytes', pa.file_size_bytes,
            'position', pa.position
        )
        ORDER BY pa.position
    ) AS assets
    FROM public.post_assets pa
    WHERE pa.post_id = p.id
      AND pa.is_active = true
) pa ON TRUE

-- 🔥 Count likes separately
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS like_count
    FROM public.post_reaction pr
    JOIN public.post_reaction_type prt 
        ON pr.post_reaction_type_id = prt.id
    WHERE pr.post_id = p.id
      AND prt.name = 'like'
      AND pr.is_active = B'1'
) lc ON TRUE

-- 🔥 Count comments separately
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS comment_count
    FROM public.post_comment pc
    WHERE pc.post_id = p.id
      AND pc.is_blocked = false
) cc ON TRUE

WHERE p.id = p_post_id
  AND p.is_blocked = false
  AND u.is_blocked = false
  AND u.is_active = true;

END;
$$;

-- ============================================================================
-- Function: fn_get_posts
-- Purpose: Gets posts for home page with pagination
-- Parameters:
--   p_user_id: UUID - The ID of the user performing the action
--   p_limit: INTEGER - Number of posts to return
--   p_offset: INTEGER - Number of posts to skip
-- Returns: Table with posts and their details including like and comment counts
-- Author        : OFFBEAT
-- Created On    : 18/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_posts(p_user_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(post_id uuid, content character varying, created_at timestamp without time zone, user_id uuid, user_firstname character varying, user_lastname character varying, user_username character varying, assets json, like_count integer, comment_count integer, is_liked boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
RETURN QUERY
SELECT 
    p.id AS post_id,
    p.content,
    p.created_at,
    u.id AS user_id,
    u.firstname,
    u.lastname,
    u.username,

    -- ✅ Assets aggregated separately
    COALESCE(pa.assets, '[]'::json) AS assets,

    -- ✅ Likes counted separately
    COALESCE(lc.like_count, 0) AS like_count,

    -- ✅ Comments counted separately
    COALESCE(cc.comment_count, 0) AS comment_count,

    -- ✅ Is liked check
    EXISTS (
        SELECT 1
        FROM public.post_reaction pr_inner
        JOIN public.post_reaction_type prt_inner 
            ON pr_inner.post_reaction_type_id = prt_inner.id
        WHERE pr_inner.post_id = p.id
          AND pr_inner.user_id = p_user_id
          AND prt_inner.name = 'like'
          AND pr_inner.is_active = B'1'
    ) AS is_liked

FROM public.post p
JOIN public."user" u 
    ON p.user_id = u.id

-- 🔥 Aggregate assets separately
LEFT JOIN LATERAL (
    SELECT json_agg(
        json_build_object(
            'id', pa.id,
            'url', pa.url,
            'mimetype', pa.mimetype,
            'file_size_bytes', pa.file_size_bytes,
            'position', pa.position
        )
        ORDER BY pa.position
    ) AS assets
    FROM public.post_assets pa
    WHERE pa.post_id = p.id
      AND pa.is_active = true
) pa ON TRUE

-- 🔥 Count likes separately
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS like_count
    FROM public.post_reaction pr
    JOIN public.post_reaction_type prt 
        ON pr.post_reaction_type_id = prt.id
    WHERE pr.post_id = p.id
      AND prt.name = 'like'
      AND pr.is_active = B'1'
) lc ON TRUE

-- 🔥 Count comments separately
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS comment_count
    FROM public.post_comment pc
    WHERE pc.post_id = p.id
      AND pc.is_blocked = false
) cc ON TRUE

WHERE p.is_blocked = false
  AND u.is_blocked = false
  AND u.is_active = true
  
  -- 🚫 EXCLUDE POSTS FROM USERS BLOCKED BY CURRENT USER
  AND NOT EXISTS (
      SELECT 1 FROM public.user_report ur
      WHERE ur.blocked_user_id = p.user_id AND ur.user_id = p_user_id
  )

  -- 🚫 EXCLUDE POSTS FROM USERS WHO BLOCKED CURRENT USER
  AND NOT EXISTS (
      SELECT 1 FROM public.user_report ur
      WHERE ur.blocked_user_id = p_user_id AND ur.user_id = p.user_id
  )

ORDER BY p.created_at DESC
LIMIT p_limit OFFSET p_offset;

END;
$function$;

-- ============================================================================
-- Function: fn_deactivate_post_assets
-- Purpose: Deactivates (soft deletes) specified post assets
-- Parameters:
--   p_user_id: UUID - The ID of the user performing the action
--   p_asset_ids: UUID[] - Array of asset IDs to deactivate
--   p_post_id: UUID - The ID of the post the assets belong to
-- Returns: INTEGER - Number of assets deactivated
-- Author        : OFFBEAT
-- Created On    : 18/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_deactivate_post_assets(
        p_user_id UUID,
        p_asset_ids UUID [],
        p_post_id UUID
    ) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE v_deactivated_count INTEGER;
BEGIN
UPDATE public.post_assets
SET is_active = false,
    updated_by = p_user_id,
    updated_at = NOW()
WHERE id = ANY(p_asset_ids)
    AND post_id = p_post_id
    AND is_active = true;
GET DIAGNOSTICS v_deactivated_count = ROW_COUNT;
RETURN v_deactivated_count;
END;
$$;
-- ============================================================================
-- Function: fn_renumber_post_asset_positions
-- Purpose: Renumbers asset positions sequentially for a post
-- Parameters:
--   p_post_id: UUID - The ID of the post
--   p_user_id: UUID - The ID of the user performing the action
-- Returns: INTEGER - Number of assets updated
-- Author        : OFFBEAT
-- Created On    : 18/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_renumber_post_asset_positions(p_post_id UUID, p_user_id UUID) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE v_updated_count INTEGER;
BEGIN WITH numbered_assets AS (
    SELECT id,
        ROW_NUMBER() OVER (
            ORDER BY position,
                created_at
        ) as new_position
    FROM public.post_assets
    WHERE post_id = p_post_id
        AND is_active = true
)
UPDATE public.post_assets
SET position = numbered_assets.new_position,
    updated_by = p_user_id,
    updated_at = NOW()
FROM numbered_assets
WHERE public.post_assets.id = numbered_assets.id;
GET DIAGNOSTICS v_updated_count = ROW_COUNT;
RETURN v_updated_count;
END;
$$;
-- ============================================================================
-- Function: fn_get_max_post_asset_position
-- Purpose: Gets the maximum position for active assets of a post
-- Parameters:
--   p_post_id: UUID - The ID of the post
-- Returns: INTEGER - Maximum position (0 if no assets)
-- Author        : OFFBEAT
-- Created On    : 18/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_max_post_asset_position(p_post_id UUID) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE v_max_position INTEGER;
BEGIN
SELECT COALESCE(MAX(position), 0) INTO v_max_position
FROM public.post_assets
WHERE post_id = p_post_id
    AND is_active = true;
RETURN v_max_position;
END;
$$;
-- ============================================================================
-- Function: fn_ensure_image_asset_type
-- Purpose: Ensures the 'image' asset type exists and returns its ID
-- Parameters: None
-- Returns: UUID - The ID of the image asset type
-- Author        : OFFBEAT
-- Created On    : 18/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_ensure_image_asset_type() RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE v_asset_type_id UUID;
BEGIN -- Try to get existing image type
SELECT id INTO v_asset_type_id
FROM public.assets_type
WHERE name = 'image'
LIMIT 1;
-- If not found, create it
IF v_asset_type_id IS NULL THEN
INSERT INTO public.assets_type (name, description, is_active)
VALUES ('image', 'Image files', true)
RETURNING id INTO v_asset_type_id;
END IF;
RETURN v_asset_type_id;
END;
$$;
-- ============================================================================
-- Function: fn_insert_post_assets
-- Purpose: Inserts multiple post assets in a single operation
-- Parameters:
--   p_assets: JSONB[] - Array of asset data as JSONB objects
--     Each object should contain: post_id, url, mimetype, file_size_bytes, position, created_by, updated_by
-- Returns: INTEGER - Number of assets inserted
-- Author        : OFFBEAT
-- Created On    : 18/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_insert_post_assets(p_assets JSONB []) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE v_asset_type_id UUID;
v_inserted_count INTEGER;
BEGIN -- Ensure image asset type exists
SELECT fn_ensure_image_asset_type() INTO v_asset_type_id;
-- Insert all assets
INSERT INTO public.post_assets (
        post_id,
        assets_type_id,
        url,
        mimetype,
        file_size_bytes,
        position,
        is_active,
        created_by,
        created_at,
        updated_by,
        updated_at
    )
SELECT (asset->>'post_id')::UUID,
    v_asset_type_id,
    asset->>'url',
    asset->>'mimetype',
    (asset->>'file_size_bytes')::BIGINT,
    (asset->>'position')::INTEGER,
    true,
    (asset->>'created_by')::UUID,
    NOW(),
    (asset->>'updated_by')::UUID,
    NOW()
FROM unnest(p_assets) AS asset;
GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
RETURN v_inserted_count;
END;
$$;
-- ============================================================================
-- Function: fn_get_active_post_assets_count
-- Purpose: Gets the count of active assets for a specific post
-- Parameters:
--   p_post_id: UUID - The ID of the post
-- Returns: INTEGER - Number of active assets for the post
-- Author        : OFFBEAT
-- Created On    : 18/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_active_post_assets_count(p_post_id UUID) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE v_count INTEGER;
BEGIN
SELECT COUNT(*) INTO v_count
FROM public.post_assets
WHERE post_id = p_post_id
    AND is_active = true;
RETURN v_count;
END;
$$;
-- ============================================================================
-- Function: fn_get_post_asset_urls
-- Purpose: Gets the URLs of all active assets for a specific post
-- Parameters:
--   p_post_id: UUID - The ID of the post
-- Returns: TABLE(url TEXT) - URLs of active assets
-- Author        : OFFBEAT
-- Created On    : 19/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_post_asset_urls(p_post_id UUID) RETURNS TABLE(url TEXT) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
SELECT pa.url
FROM public.post_assets pa
WHERE pa.post_id = p_post_id
    AND pa.is_active = true;
END;
$$;
-- ============================================================================
-- Function: fn_search_posts
-- Purpose: Searches posts by content with pagination
-- Parameters:
--   p_search_query: VARCHAR - The search term to look for in post content
--   p_user_id: UUID - The ID of the user performing the search
--   p_limit: INTEGER - Number of posts to return
--   p_offset: INTEGER - Number of posts to skip
-- Returns: Table with posts and their details including like and comment counts
-- Author        : OFFBEAT
-- Created On    : 18/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_search_posts(p_search_query character varying, p_user_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(post_id uuid, content character varying, created_at timestamp without time zone, user_id uuid, user_firstname character varying, user_lastname character varying, user_username character varying, assets json, like_count integer, comment_count integer, is_liked boolean)
 LANGUAGE plpgsql
AS $function$ 
BEGIN 
RETURN QUERY
SELECT p.id as post_id,
    p.content,
    p.created_at,
    u.id as user_id,
    u.firstname as user_firstname,
    u.lastname as user_lastname,
    u.username as user_username,
    COALESCE(
        json_agg(
            json_build_object(
                'id',
                pa.id,
                'url',
                pa.url,
                'mimetype',
                pa.mimetype,
                'file_size_bytes',
                pa.file_size_bytes,
                'position',
                pa.position
            )
            ORDER BY pa.position
        ) FILTER (
            WHERE pa.id IS NOT NULL
        ),
        '[]'::json
    ) as assets,
    COUNT(DISTINCT CASE WHEN prt.name = 'like' AND pr.is_active = B'1' THEN pr.id END)::int as like_count,
    COUNT(DISTINCT pc.id)::int as comment_count,
    EXISTS(
        SELECT 1
        FROM public.post_reaction pr_inner
        LEFT JOIN public.post_reaction_type prt_inner ON pr_inner.post_reaction_type_id = prt_inner.id
        WHERE pr_inner.post_id = p.id
            AND pr_inner.user_id = p_user_id
            AND prt_inner.name = 'like'
            AND pr_inner.is_active = B'1'
    ) as is_liked
FROM public.post p
    LEFT JOIN public."user" u ON p.user_id = u.id
    LEFT JOIN public.post_assets pa ON p.id = pa.post_id AND pa.is_active = true
    LEFT JOIN public.post_reaction pr ON p.id = pr.post_id AND pr.is_active = B'1'
    LEFT JOIN public.post_reaction_type prt ON pr.post_reaction_type_id = prt.id AND prt.name = 'like' AND prt.is_active = B'1'
    LEFT JOIN public.post_comment pc ON p.id = pc.post_id AND pc.is_blocked = false
WHERE p.is_blocked = false
    AND u.is_blocked = false
    AND u.is_active = true
    AND p.content ILIKE '%' || p_search_query || '%'

    -- 🚫 EXCLUDE POSTS BLOCKED BY CURRENT USER
    AND NOT EXISTS (
        SELECT 1 FROM public.post_block pb 
        WHERE pb.post_id = p.id AND pb.user_id = p_user_id
    )

    -- 🚫 EXCLUDE POSTS FROM USERS BLOCKED BY CURRENT USER
    AND NOT EXISTS (
        SELECT 1 FROM public.user_report ur
        WHERE ur.blocked_user_id = p.user_id AND ur.user_id = p_user_id
    )

    -- 🚫 EXCLUDE POSTS FROM USERS WHO BLOCKED CURRENT USER
    AND NOT EXISTS (
        SELECT 1 FROM public.user_report ur
        WHERE ur.blocked_user_id = p_user_id AND ur.user_id = p.user_id
    )

GROUP BY p.id,
    p.content,
    p.created_at,
    u.id,
    u.firstname,
    u.lastname,
    u.username
ORDER BY p.created_at DESC
LIMIT p_limit OFFSET p_offset;
END;
$function$;
-- ============================================================================
-- Function: fn_get_post_asset_urls_by_ids
-- Purpose: Gets the URLs of specific active assets for a post
-- Parameters:
--   p_asset_ids: UUID[] - Array of asset IDs to retrieve
--   p_post_id: UUID - The post ID to filter by
-- Returns: Table with asset URLs
-- Author        : OFFBEAT
-- Created On    : 19/02/2026
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_get_post_asset_urls_by_ids(
    p_asset_ids UUID[],
    p_post_id UUID
)
RETURNS TABLE(url TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT pa.url
    FROM public.post_assets pa
    WHERE pa.id = ANY(p_asset_ids)
      AND pa.post_id = p_post_id
      AND pa.is_active = true;
END;
$$;

-- ============================================================================
-- Function: fn_get_post_comments
-- Purpose: Gets comments for a specific post with user information and pagination
-- Parameters:
--   p_post_id: UUID - The ID of the post to get comments for
--   p_limit: INTEGER - Number of comments to return
--   p_offset: INTEGER - Number of comments to skip
-- Returns: Table with comment details and user information
-- Author        : OFFBEAT
-- Created On    : 19/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_post_comments(
    p_post_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
) 
RETURNS TABLE(
    comment_id UUID,
    post_id UUID,
    comment VARCHAR,
    user_id UUID,
    created_at TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP,
    is_blocked BOOLEAN,
    blocked_at TIMESTAMP,
    user_firstname VARCHAR,
    user_lastname VARCHAR,
    user_username VARCHAR,
    user_profile_image_url TEXT
) 
LANGUAGE plpgsql 
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id AS comment_id,
        pc.post_id,
        pc.comment,
        pc.user_id,
        pc.created_at,
        pc.updated_by,
        pc.updated_at,
        pc.is_blocked,
        pc.blocked_at,
        u.firstname AS user_firstname,
        u.lastname AS user_lastname,
        u.username AS user_username,
        u.profile_image_url
    FROM public.post_comment pc
    LEFT JOIN public."user" u ON pc.user_id = u.id
    WHERE pc.post_id = p_post_id
        AND pc.is_blocked = FALSE
        AND u.is_blocked = FALSE
        AND u.is_active = TRUE
    ORDER BY pc.created_at ASC
    LIMIT p_limit OFFSET p_offset;
END;
$$;


-- ============================================================================
-- Function: fn_create_post_comment
-- Purpose: Creates a new comment on a post
-- Parameters:
--   p_user_id: UUID - The ID of the user creating the comment
--   p_post_id: UUID - The ID of the post being commented on
--   p_comment: VARCHAR - The comment text
-- Returns: UUID - The ID of the newly created comment
-- Author        : OFFBEAT
-- Created On    : 19/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_create_post_comment(p_user_id UUID, p_post_id UUID, p_comment VARCHAR) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE v_comment_id UUID;
BEGIN
INSERT INTO public.post_comment (
        user_id,
        post_id,
        comment,
        created_at
    )
VALUES (
        p_user_id,
        p_post_id,
        p_comment,
        NOW()
    )
RETURNING id INTO v_comment_id;
RETURN v_comment_id;
END;
$$;

-- ============================================================================
-- Function: fn_toggle_post_like
-- Purpose: Toggles like reaction on a post for a user
-- Parameters:
--   p_user_id: UUID - The ID of the user
--   p_post_id: UUID - The ID of the post
-- Returns: BOOLEAN - True if liked after toggle, false if unliked
-- Author        : CASCADE
-- Created On    : 19/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_toggle_post_like(p_user_id UUID, p_post_id UUID) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE v_reaction_type_id UUID;
v_existing_reaction_id UUID;
v_is_active BIT;
BEGIN
-- Get the like reaction type id
SELECT id INTO v_reaction_type_id
FROM public.post_reaction_type
WHERE name = 'like' AND is_active = B'1'
LIMIT 1;

IF v_reaction_type_id IS NULL THEN
    RAISE EXCEPTION 'Like reaction type not found';
END IF;

-- Check if reaction exists
SELECT id, is_active INTO v_existing_reaction_id, v_is_active
FROM public.post_reaction
WHERE user_id = p_user_id AND post_id = p_post_id AND post_reaction_type_id = v_reaction_type_id
LIMIT 1;

IF v_existing_reaction_id IS NOT NULL THEN
    -- Toggle
    IF v_is_active = B'1' THEN
        -- Unlike
        UPDATE public.post_reaction
        SET is_active = B'0', updated_by = p_user_id, updated_at = NOW()
        WHERE id = v_existing_reaction_id;
        RETURN FALSE;
    ELSE
        -- Like
        UPDATE public.post_reaction
        SET is_active = B'1', updated_by = p_user_id, updated_at = NOW()
        WHERE id = v_existing_reaction_id;
        RETURN TRUE;
    END IF;
ELSE
    -- Insert new like
    INSERT INTO public.post_reaction (
        post_id,
        post_reaction_type_id,
        user_id,
        is_active,
        created_at,
        updated_by,
        updated_at
    ) VALUES (
        p_post_id,
        v_reaction_type_id,
        p_user_id,
        B'1',
        NOW(),
        p_user_id,
        NOW()
    );
    RETURN TRUE;
END IF;
END;
$$;

-- Function to block a post
CREATE OR REPLACE FUNCTION public.fn_block_post(p_user_id uuid, p_post_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO public.post_block (user_id, post_id, created_at)
    VALUES (p_user_id, p_post_id, NOW())
    ON CONFLICT (user_id, post_id) DO NOTHING;
    RETURN TRUE;
END;
$function$;

-- Function to report a post (using existing post_report table or creating if needed - schema check showed it exists)
-- Logic: Insert into post_report
CREATE OR REPLACE FUNCTION public.fn_report_post(
    p_user_id uuid, 
    p_post_id uuid, 
    p_comment text
)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO public.post_report (
        id,
        post_id,
        comment,
        created_at,
        blocked_user_id
    )
    VALUES (
        gen_random_uuid(),
        p_post_id,
        p_comment,
        NOW(),
        p_user_id
    );
    RETURN TRUE;
END;
$function$;