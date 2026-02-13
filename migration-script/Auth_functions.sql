-- ============================================================================
-- Function Name : fn_reset_password_with_token
-- Purpose       : Resets user password using a valid reset token and
--                 clears the token after successful update.
-- Author        : OFFBEAT
-- Created On    : 30/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_reset_password_with_token(p_token text, p_new_password text) RETURNS boolean LANGUAGE 'plpgsql' COST 100 VOLATILE PARALLEL UNSAFE AS $$
DECLARE rows_updated INTEGER;
BEGIN
UPDATE "user"
SET password = p_new_password,
    reset_password_token = NULL,
    token_expires_at = NULL
WHERE reset_password_token = p_token
    AND token_expires_at > NOW();
GET DIAGNOSTICS rows_updated = ROW_COUNT;
RETURN rows_updated = 1;
END;
$$;
-- ============================================================================
-- Function Name : fn_update_user_password_reset_token
-- Purpose       : Generates and stores password reset token and expiry
--                 for a user identified by email.
-- Author        : OFFBEAT
-- Created On    : 30/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_update_user_password_reset_token(
        p_email character varying,
        p_reset_token text,
        p_expires_at timestamp without time zone
    ) RETURNS boolean LANGUAGE 'plpgsql' COST 100 VOLATILE PARALLEL UNSAFE AS $$
DECLARE rows_updated INTEGER;
BEGIN
UPDATE "user"
SET reset_password_token = p_reset_token,
    token_expires_at = p_expires_at
WHERE email = p_email;
GET DIAGNOSTICS rows_updated = ROW_COUNT;
RETURN rows_updated > 0;
END;
$$;
-- ============================================================================
-- Function Name : fn_verify_password_reset_token
-- Purpose       : Validates whether a password reset token exists
--                 and has not expired.
-- Author        : OFFBEAT
-- Created On    : 30/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_verify_password_reset_token(p_token text) RETURNS boolean LANGUAGE 'plpgsql' COST 100 VOLATILE PARALLEL UNSAFE AS $$
DECLARE token_exists BOOLEAN;
BEGIN
SELECT EXISTS (
        SELECT 1
        FROM "user"
        WHERE reset_password_token = p_token
            AND token_expires_at > NOW()
    ) INTO token_exists;
RETURN token_exists;
END;
$$;
-- ============================================================================
-- Function Name : fn_create_user
-- Purpose       : Creates a new user record in the system with default
--                 initialization values. The function assigns an ACTIVE
--                 user status, ensures email uniqueness, and returns the
--                 generated user ID upon successful creation.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_create_user(
        p_email VARCHAR,
        p_password VARCHAR,
        p_firstname VARCHAR,
        p_lastname VARCHAR
    ) RETURNS TABLE(user_id UUID, user_role VARCHAR) LANGUAGE plpgsql AS $$
DECLARE v_user_id UUID := gen_random_uuid();
v_status_id UUID;
v_role_id UUID;
v_role_name VARCHAR := 'user';
BEGIN v_status_id := fn_get_active_user_status_id();
IF EXISTS (
    SELECT 1
    FROM "user"
    WHERE email = p_email
) THEN RETURN;
END IF;
INSERT INTO "user" (
        id,
        email,
        username,
        password,
        firstname,
        lastname,
        is_verified,
        is_active,
        status_id,
        created_at
    )
VALUES (
        v_user_id,
        p_email,
        NULL,
        p_password,
        p_firstname,
        p_lastname,
        FALSE,
        TRUE,
        v_status_id,
        NOW()
    );
v_role_id := fn_get_user_role_id(v_role_name);
PERFORM fn_assign_user_role(v_user_id, v_role_id);
RETURN QUERY
SELECT v_user_id,
    v_role_name;
END;
$$;
-- ============================================================================
-- Function Name : fn_get_active_user_status_id
-- Purpose       : Retrieves the UUID of the ACTIVE user status by internally
--                 calling the reusable status lookup function. This function
--                 acts as a convenience wrapper to avoid hardcoding status
--                 names across the codebase.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_active_user_status_id() RETURNS UUID LANGUAGE plpgsql AS $$ BEGIN RETURN fn_get_user_status_id_by_status_name('active');
END;
$$;
-- ============================================================================
-- Function Name : fn_get_user_status_id_by_status_name
-- Purpose       : Retrieves the UUID of an active user status based on the
--                 provided status name. The lookup is case-insensitive and
--                 ensures only active statuses are considered.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_user_status_id_by_status_name(p_status_name VARCHAR) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE v_status_id UUID;
BEGIN
SELECT id INTO v_status_id
FROM user_status
WHERE LOWER(name) = LOWER(p_status_name)
    AND is_active = TRUE
LIMIT 1;
RETURN v_status_id;
END;
$$;
-- ============================================================================
-- Function Name : fn_assign_user_role
-- Purpose       : Assigns a role to a user by inserting a record into
--                 user_role_mapping table.
-- Author        : OFFBEAT
-- Created On    : 30/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_assign_user_role(p_user_id UUID, p_role_id UUID) RETURNS VOID AS $$ BEGIN
INSERT INTO user_role_mapping (
        id,
        user_id,
        role_id,
        is_active
    )
VALUES (
        gen_random_uuid(),
        p_user_id,
        p_role_id,
        TRUE
    );
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- Function Name : fn_get_user_role_id
-- Purpose       : Fetches role ID based on the provided role name.
-- Author        : OFFBEAT
-- Created On    : 30/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_user_role_id(p_role_name VARCHAR) RETURNS UUID AS $$
DECLARE v_role_id UUID;
BEGIN
SELECT id INTO v_role_id
FROM user_role
WHERE name = p_role_name;
RETURN v_role_id;
END;
$$ LANGUAGE plpgsql;