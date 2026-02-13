-- ============================================================================
-- Function Name : fn_log_error
-- Purpose       : Logs application or database errors into the error_log table
--                 for debugging, audit, and monitoring purposes.
-- Author        : OFFBEAT
-- Created On    : 29/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_log_error(
        p_action character varying,
        p_request_data character varying,
        p_stack_trace text,
        p_error_message character varying,
        p_created_by uuid
    ) RETURNS void LANGUAGE plpgsql COST 100 VOLATILE PARALLEL UNSAFE AS $$ BEGIN
INSERT INTO error_log (
        id,
        action,
        request_data,
        stack_trace,
        error_message,
        created_by
    )
VALUES (
        gen_random_uuid(),
        p_action,
        p_request_data,
        p_stack_trace,
        p_error_message,
        p_created_by
    );
END;
$$;
-- ============================================================================
-- Function Name : fn_log_for_user_login
-- Purpose       : Creates a login log entry when a user successfully logs in
--                 and returns the generated login log ID.
-- Author        : OFFBEAT
-- Created On    : 30/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_log_for_user_login(p_user_id UUID) RETURNS UUID AS $$
DECLARE v_log_id UUID;
BEGIN
INSERT INTO user_login_log (
        id,
        user_id,
        created_by,
        created_at
    )
VALUES (
        gen_random_uuid(),
        p_user_id,
        p_user_id,
        NOW()
    )
RETURNING id INTO v_log_id;
RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- Function Name : fn_log_for_user_logout
-- Purpose       : Updates the latest active login record with logout time
--                 when a user logs out.
-- Author        : OFFBEAT
-- Created On    : 30/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_log_for_user_logout(p_user_id UUID) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE v_log_id UUID;
BEGIN
SELECT id INTO v_log_id
FROM user_login_log
WHERE user_id = p_user_id
    AND logout_datetime IS NULL
ORDER BY created_at DESC
LIMIT 1;
IF v_log_id IS NULL THEN RETURN FALSE;
END IF;
UPDATE user_login_log
SET logout_datetime = NOW()
WHERE id = v_log_id;
RETURN TRUE;
END;
$$;
-- ============================================================================
-- Function Name : fn_check_rate_limit
-- Purpose       : Checks whether a client (identified by IP address) has
--                 exceeded the allowed number of requests within a defined
--                 time window. Every request is logged for auditing and
--                 monitoring purposes.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_check_rate_limit(
        p_ip_address VARCHAR,
        p_limit INTEGER,
        p_window_seconds INTEGER,
        p_request_url VARCHAR,
        p_request_body TEXT
    ) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE v_request_count INTEGER;
BEGIN
SELECT COUNT(*) INTO v_request_count
FROM api_rate_limit
WHERE user_ip_address = p_ip_address
    AND request_url = p_request_url
    AND created_at >= NOW() - (p_window_seconds || ' seconds')::INTERVAL;
INSERT INTO api_rate_limit (
        request_url,
        request_data,
        user_ip_address,
        created_at
    )
VALUES (
        p_request_url,
        p_request_body,
        p_ip_address,
        NOW()
    );
IF v_request_count >= p_limit THEN RETURN FALSE;
END IF;
RETURN TRUE;
END;
$$;