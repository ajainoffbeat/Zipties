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
ALTER TABLE post_assets
ALTER COLUMN url TYPE text USING url::text;
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
-- Returns: Table with post details
-- Author        : OFFBEAT
-- Created On    : 18/02/2026   
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_post(p_post_id UUID) RETURNS TABLE(
        post_id UUID,
        content VARCHAR,
        is_blocked BOOLEAN,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        user_id UUID,
        user_firstname VARCHAR,
        user_lastname VARCHAR,
        user_username VARCHAR,
        assets JSON
    ) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
SELECT p.id as post_id,
    p.content,
    p.is_blocked,
    p.created_at,
    p.updated_at,
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
    ) as assets
FROM public.post p
    LEFT JOIN public."user" u ON p.user_id = u.id
    LEFT JOIN public.post_assets pa ON p.id = pa.post_id
    AND pa.is_active = true
WHERE p.id = p_post_id
    AND p.is_blocked = false
    AND u.is_blocked = false
    AND u.is_active = true
GROUP BY p.id,
    p.content,
    p.is_blocked,
    p.created_at,
    p.updated_at,
    u.id,
    u.firstname,
    u.lastname,
    u.username;
END;
$$;
-- ============================================================================
-- Function: fn_get_posts
-- Purpose: Gets posts for home page with pagination
-- Parameters:
--   p_limit: INTEGER - Number of posts to return
--   p_offset: INTEGER - Number of posts to skip
-- Returns: Table with posts and their details
-- Author        : OFFBEAT
-- Created On    : 18/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_posts(
        p_limit INTEGER DEFAULT 20,
        p_offset INTEGER DEFAULT 0
    ) RETURNS TABLE(
        post_id UUID,
        content VARCHAR,
        created_at TIMESTAMP,
        user_id UUID,
        user_firstname VARCHAR,
        user_lastname VARCHAR,
        user_username VARCHAR,
        assets JSON
    ) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
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
    ) as assets
FROM public.post p
    LEFT JOIN public."user" u ON p.user_id = u.id
    LEFT JOIN public.post_assets pa ON p.id = pa.post_id
    AND pa.is_active = true
WHERE p.is_blocked = false
    AND u.is_blocked = false
    AND u.is_active = true
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
$$;
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
--   p_limit: INTEGER - Number of posts to return
--   p_offset: INTEGER - Number of posts to skip
-- Returns: Table with posts and their details
-- Author        : OFFBEAT
-- Created On    : 18/02/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_search_posts(
        p_search_query VARCHAR,
        p_limit INTEGER DEFAULT 20,
        p_offset INTEGER DEFAULT 0
    ) RETURNS TABLE(
        post_id UUID,
        content VARCHAR,
        created_at TIMESTAMP,
        user_id UUID,
        user_firstname VARCHAR,
        user_lastname VARCHAR,
        user_username VARCHAR,
        assets JSON
    ) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
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
    ) as assets
FROM public.post p
    LEFT JOIN public."user" u ON p.user_id = u.id
    LEFT JOIN public.post_assets pa ON p.id = pa.post_id
    AND pa.is_active = true
WHERE p.is_blocked = false
    AND u.is_blocked = false
    AND u.is_active = true
    AND p.content ILIKE '%' || p_search_query || '%'
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
$$;


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