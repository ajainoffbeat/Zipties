-- ============================================================================
-- Function Name : fn_get_user_by_email
-- Purpose       : Fetches a user's basic authentication details using email.
--                 This function is primarily used during login to retrieve
--                 the user ID and hashed password.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_user_by_email(p_email VARCHAR) RETURNS TABLE(user_id UUID, password VARCHAR) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
SELECT u.id,
    u.password
FROM "user" u
WHERE u.email = p_email
LIMIT 1;
END;
$$;
-- ============================================================================
-- Function Name : fn_get_user_profile
-- Purpose       : Fetches a user's profile information with blocking status.
--                 Returns user profile data and indicates if the current user
--                 has blocked the requested user or vice versa.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_user_profile(p_current_user_id uuid,p_user_id uuid) RETURNS TABLE(
        id uuid,
        first_name text,
        last_name text,
        username text,
        email text,
        bio text,
        city_id uuid,
        city_name text,
        interests text,
        tags text,
        profile_image_url text,
        joined_date timestamp without time zone,
        isblocked boolean
    ) LANGUAGE 'plpgsql' COST 100 STABLE PARALLEL UNSAFE ROWS 1000 AS $$ BEGIN RETURN QUERY
SELECT u.id,
    u.firstname::text AS first_name,
    u.lastname::text AS last_name,
    u.username::text,
    u.email::text,
    u.bio::text,
    u.city_id,
    c.name::text AS city_name,
    u.interests,
    u.tags,
    u.profile_image_url::text,
    u.created_at,
    CASE WHEN EXISTS (
        SELECT 1 
        FROM user_report ur 
        WHERE ur.blocked_user_id = u.id AND ur.user_id = p_current_user_id
    ) THEN true ELSE false END AS isblocked
FROM "user" u
    LEFT JOIN city c ON c.id = u.city_id
WHERE u.id = p_user_id
    AND u.is_blocked = false
    AND u.is_active = true;
END;
$$;
-- ============================================================================
-- Function Name : fn_update_user
-- Purpose       : Updates a user's profile information.
--                 This function is primarily used during login to retrieve
--                 the user ID and hashed password.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_update_user(
        p_user_id uuid,
        p_firstname character varying DEFAULT NULL::character varying,
        p_lastname character varying DEFAULT NULL::character varying,
        p_username character varying DEFAULT NULL::character varying,
        p_bio character varying DEFAULT NULL::character varying,
        p_profile_image_url character varying DEFAULT NULL::character varying,
        p_updated_by uuid DEFAULT NULL::uuid,
        p_city_id uuid DEFAULT NULL::uuid,
        p_interests text DEFAULT NULL::text,
        p_tags text DEFAULT NULL::text
    ) RETURNS boolean LANGUAGE 'plpgsql' COST 100 VOLATILE PARALLEL UNSAFE AS $$ BEGIN
UPDATE "user"
SET firstname = COALESCE(p_firstname, firstname),
    lastname = COALESCE(p_lastname, lastname),
    username = COALESCE(p_username, username),
    bio = COALESCE(p_bio, bio),
    profile_image_url = COALESCE(p_profile_image_url, profile_image_url),
    updated_by = COALESCE(p_updated_by, updated_by),
    updated_at = NOW(),
    city_id = COALESCE(p_city_id, city_id),
    interests = COALESCE(p_interests, interests),
    tags = COALESCE(p_tags, tags)
WHERE id = p_user_id;
RETURN FOUND;
END;
$$;
-- ============================================================================
-- Function Name : fn_block_user
-- Purpose       : Blocks a user from interacting with another user. Creates a
--                 block record to prevent messaging and other interactions.
--                 Includes validation to prevent self-blocking and duplicates.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_block_user(
        p_user_id UUID,
        p_blocked_user_id UUID,
        p_comment VARCHAR DEFAULT NULL
    ) RETURNS TABLE (success BOOLEAN, message TEXT) LANGUAGE plpgsql AS $$ BEGIN IF p_user_id IS NULL
    OR p_blocked_user_id IS NULL THEN RETURN QUERY
SELECT FALSE,
    'user_id and blocked_user_id are required';
RETURN;
END IF;
IF p_user_id = p_blocked_user_id THEN RETURN QUERY
SELECT FALSE,
    'User cannot block themselves';
RETURN;
END IF;
IF EXISTS (
    SELECT 1
    FROM user_report
    WHERE user_id = p_user_id
        AND blocked_user_id = p_blocked_user_id
) THEN RETURN QUERY
SELECT FALSE,
    'User already blocked';
RETURN;
END IF;
INSERT INTO user_report (
        id,
        user_id,
        comment,
        blocked_user_id,
        created_by,
        created_at
    )
VALUES (
        gen_random_uuid(),
        p_user_id,
        p_comment,
        p_blocked_user_id,
        p_user_id,
        NOW()
    );
RETURN QUERY
SELECT TRUE,
    'User blocked successfully';
EXCEPTION
WHEN OTHERS THEN RETURN QUERY
SELECT FALSE,
    'Error occurred while blocking user';
END;
$$;
-- ============================================================================
-- Function Name : fn_unblock_user
-- Purpose       : Removes a block between users, allowing them to interact
--                 again. Deletes the block record and validates the operation
--                 to ensure proper unblocking with error handling.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_unblock_user(
        p_user_id UUID,
        p_blocked_user_id UUID
    ) RETURNS TABLE (success BOOLEAN, message TEXT) LANGUAGE plpgsql AS $$ BEGIN IF p_user_id IS NULL
    OR p_blocked_user_id IS NULL THEN RETURN QUERY
SELECT FALSE,
    'user_id and blocked_user_id are required';
RETURN;
END IF;
IF p_user_id = p_blocked_user_id THEN RETURN QUERY
SELECT FALSE,
    'Invalid operation';
RETURN;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM user_report
    WHERE user_id = p_user_id
        AND blocked_user_id = p_blocked_user_id
) THEN RETURN QUERY
SELECT FALSE,
    'Block record not found';
RETURN;
END IF;
DELETE FROM user_report
WHERE user_id = p_user_id
    AND blocked_user_id = p_blocked_user_id;
RETURN QUERY
SELECT TRUE,
    'User unblocked successfully';
EXCEPTION
WHEN OTHERS THEN RETURN QUERY
SELECT FALSE,
    'Error occurred while unblocking user';
END;
$$;
-- ============================================================================
-- Function Name : fn_get_cities
-- Purpose       : Fetches cities based on country code and optional state filter.
--                 This function retrieves active cities with pagination support,
--                 ordered by city name. Used for populating city selection dropdowns
--                 and location-based searches.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_cities(
        p_country_code character varying,
        p_state character varying DEFAULT NULL,
        p_search character varying DEFAULT NULL,
        p_limit integer DEFAULT 50,
        p_offset integer DEFAULT 0
    ) RETURNS TABLE (
        id uuid,
        name character varying(100),
        city character varying(100),
        state character varying(100)
    ) LANGUAGE plpgsql VOLATILE AS $BODY$ BEGIN RETURN QUERY
SELECT c.id,
    c.name,
    c.city,
    c.state
FROM city c
WHERE c.country_code = p_country_code
    AND c.is_active = true
    AND (
        NULLIF(TRIM(p_state), '') IS NULL
        OR c.state ILIKE '%' || TRIM(p_state) || '%'
    )
    AND (
        NULLIF(TRIM(p_search), '') IS NULL
        OR c.city ILIKE '%' || TRIM(p_search) || '%'
        OR c.name ILIKE '%' || TRIM(p_search) || '%'
    )
ORDER BY c.city
LIMIT p_limit OFFSET p_offset;
END;
$BODY$;
-- ============================================================================
-- Function Name : fn_search_users_by_name
-- Purpose       : Searches for users by first name, last name, or username.
--                 Filters out blocked users for both the searcher and searched.
-- Author        : OFFBEAT
-- Created On    : 11/02/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_search_users_by_name(
        p_query character varying,
        p_current_user_id uuid
    ) RETURNS TABLE(
        id uuid,
        first_name text,
        last_name text,
        username character varying,
        profile_image_url character varying
    ) LANGUAGE 'plpgsql' COST 100 VOLATILE PARALLEL UNSAFE ROWS 1000 AS $BODY$ BEGIN RETURN QUERY
SELECT u.id,
    u.firstname::text AS first_name,
    u.lastname::text AS last_name,
    u.username,
    u.profile_image_url
FROM "user" u
WHERE (
        u.firstname ILIKE '%' || p_query || '%'
        OR u.lastname ILIKE '%' || p_query || '%'
        OR u.username ILIKE '%' || p_query || '%'
    )
    AND u.id != p_current_user_id
    AND NOT EXISTS (
        SELECT 1
        FROM user_report ur
        WHERE ur.user_id = u.id
            AND ur.blocked_user_id = p_current_user_id
    )
LIMIT 10;
END;
$BODY$;