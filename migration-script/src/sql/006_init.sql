

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
v_post_user_id UUID;
BEGIN
-- Check if post exists and get the post owner
SELECT p.user_id INTO v_post_user_id
FROM public.post p
WHERE p.id = p_post_id
  AND p.is_blocked = false;

IF v_post_user_id IS NULL THEN
    RAISE EXCEPTION 'Post not found or blocked';
END IF;

-- Check if users are blocked (either direction)
IF EXISTS (
    SELECT 1 FROM public.user_report ur
    WHERE (ur.user_id = p_user_id AND ur.blocked_user_id = v_post_user_id)
       OR (ur.user_id = v_post_user_id AND ur.blocked_user_id = p_user_id)
) THEN
    RAISE EXCEPTION 'Cannot comment on post: users are blocked';
END IF;

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
v_post_user_id UUID;
BEGIN
-- Check if post exists and get the post owner
SELECT p.user_id INTO v_post_user_id
FROM public.post p
WHERE p.id = p_post_id
  AND p.is_blocked = false;

IF v_post_user_id IS NULL THEN
    RAISE EXCEPTION 'Post not found or blocked';
END IF;

-- Check if users are blocked (either direction)
IF EXISTS (
    SELECT 1 FROM public.user_report ur
    WHERE (ur.user_id = p_user_id AND ur.blocked_user_id = v_post_user_id)
       OR (ur.user_id = v_post_user_id AND ur.blocked_user_id = p_user_id)
) THEN
    RAISE EXCEPTION 'Cannot like post: users are blocked';
END IF;

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
