

DROP FUNCTION IF EXISTS public.fn_get_user_inbox(UUID);
DROP FUNCTION IF EXISTS public.fn_mark_conversation_read(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.fn_send_message(UUID, UUID, TEXT, TEXT, TEXT, TEXT);

-- ============================================================================
-- Function Name : fn_send_message
-- Purpose       : Sends a message to a conversation with content validation and
--                 block checking. Updates conversation timestamps and unread
--                 counts. Supports different content types for rich messaging.
-- Author        : OFFBEAT
-- Created On    : 23/02/2025
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_send_message(
        p_conversation_id uuid,
        p_sender_id uuid,
        p_content text,
        p_iv text,
        p_auth_tag text,
        p_content_type text
    ) RETURNS uuid LANGUAGE 'plpgsql' COST 100 VOLATILE PARALLEL UNSAFE AS $$
DECLARE v_message_id uuid;
v_message_content_type_id uuid;
BEGIN
-- Check for blocks
IF EXISTS (
    SELECT 1
    FROM conversation_member cm
    JOIN user_report ur ON
      (ur.user_id = p_sender_id AND ur.blocked_user_id = cm.user_id) OR
      (ur.user_id = cm.user_id AND ur.blocked_user_id = p_sender_id)
    WHERE cm.conversation_id = p_conversation_id
      AND cm.user_id != p_sender_id
    LIMIT 1
) THEN
    RAISE EXCEPTION 'Message blocked: One of the users has blocked the other.';
END IF;
 
-- resolve message content type
SELECT id INTO v_message_content_type_id
FROM public.message_content_type
WHERE name = p_content_type
LIMIT 1;
IF v_message_content_type_id IS NULL THEN RAISE EXCEPTION 'Invalid message content type: %',
p_content_type;
END IF;
INSERT INTO public.message (
        conversation_id,
        sender_id,
        content,
        message_content_type_id,
        created_by,
        created_at
    )
VALUES (
        p_conversation_id,
        p_sender_id,
        p_content,
        -- ✅ encrypted Base64 here
        v_message_content_type_id,
        p_sender_id,
        NOW()
    )
RETURNING id INTO v_message_id;

UPDATE conversation
SET last_message_at = NOW()
WHERE id = p_conversation_id;

UPDATE conversation_member
SET unread_count = unread_count + 1
WHERE conversation_id = p_conversation_id
    AND user_id != p_sender_id;

UPDATE conversation_member
SET last_read_message_id = v_message_id,
    updated_at = NOW()
WHERE conversation_id = p_conversation_id
    AND user_id = p_sender_id;

RETURN v_message_id;
END;
$$;


-- ============================================================================
-- Function Name : fn_get_user_inbox
-- Purpose       : Retrieves a user's inbox, including conversation details,
--                 unread message counts, and last message information.
--                 Used for displaying the user's inbox interface.
-- Author        : OFFBEAT
-- Created On    : 23/02/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_user_inbox(
	p_user_id uuid)
    RETURNS TABLE(conversation_id uuid, title character varying, type_name character varying, unread_count integer, last_read_message_id uuid, last_message_preview text, last_message_at timestamp without time zone, last_message_sender_id uuid, last_message_sender_name text, source_type character varying, source_id uuid, is_blocked boolean, blocked_by uuid, other_user_id uuid, other_user_profile_image_url text) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
 BEGIN RETURN QUERY SELECT c.id AS conversation_id, CASE WHEN ct.name = 'individual' THEN COALESCE( NULLIF(TRIM(u_other.firstname || ' ' || u_other.lastname), ''), u_other.username ) ELSE c.title END AS title, ct.name AS type_name, ( SELECT COUNT(*)::int FROM message m_unread WHERE m_unread.conversation_id = c.id AND m_unread.sender_id <> p_user_id AND ( cm.last_read_message_id IS NULL OR m_unread.created_at > ( SELECT m_lr.created_at FROM message m_lr WHERE m_lr.id = cm.last_read_message_id LIMIT 1 ) ) ) AS unread_count, cm.last_read_message_id,CASE 
  WHEN block_info.is_blocked THEN NULL 
  ELSE LEFT(SPLIT_PART(m.content, E'\n', 1), 80) 
END AS last_message_preview, c.last_message_at, m.sender_id AS last_message_sender_id, u_sender.username::text AS last_message_sender_name, cst.name AS source_type, c.source_id, COALESCE(block_info.is_blocked, FALSE) AS is_blocked, block_info.blocked_by, cm_other.user_id AS other_user_id, CASE WHEN block_info.is_blocked THEN NULL ELSE u_other.profile_image_url END AS other_user_profile_image_url FROM conversation_member cm JOIN conversation c ON cm.conversation_id = c.id JOIN conversation_type ct ON c.conversation_type_id = ct.id JOIN conversation_member cm_other ON cm_other.conversation_id = c.id AND cm_other.user_id <> p_user_id JOIN public."user" u_other ON u_other.id = cm_other.user_id LEFT JOIN conversation_source_type cst ON c.conversation_source_type_id = cst.id LEFT JOIN LATERAL ( SELECT m2.sender_id, m2.content FROM message m2 WHERE m2.conversation_id = c.id ORDER BY m2.created_at DESC LIMIT 1 ) m ON TRUE LEFT JOIN public."user" u_sender ON u_sender.id = m.sender_id LEFT JOIN LATERAL ( SELECT TRUE AS is_blocked, ur.user_id AS blocked_by FROM user_report ur WHERE ( ur.user_id = p_user_id AND ur.blocked_user_id = cm_other.user_id ) OR ( ur.user_id = cm_other.user_id AND ur.blocked_user_id = p_user_id ) LIMIT 1 ) block_info ON TRUE WHERE cm.user_id = p_user_id ORDER BY c.last_message_at DESC NULLS LAST; END; 
$BODY$;

ALTER FUNCTION public.fn_get_user_inbox(uuid)
    OWNER TO postgres;


-- ============================================================================
-- Function Name : fn_mark_conversation_read
-- Purpose       : Marks a conversation as read for a specific user by resetting
--                 their unread count and updating the last read message ID.
--                 Used for tracking read status and notification management.
-- Author        : OFFBEAT
-- Created On    : 23/02/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_mark_conversation_read(
        p_conversation_id UUID,
        p_user_id UUID,
        p_last_message_id UUID DEFAULT NULL
    ) RETURNS VOID AS $$ 
DECLARE
    v_effective_last_message_id UUID;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM conversation_member 
        WHERE conversation_id = p_conversation_id 
            AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'User is not a member of this conversation';
    END IF;

    IF p_last_message_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM message 
            WHERE id = p_last_message_id 
                AND conversation_id = p_conversation_id
        ) THEN
            RAISE EXCEPTION 'Message does not exist in this conversation';
        END IF;
    END IF;

    IF p_last_message_id IS NULL THEN
        SELECT m.id
        INTO v_effective_last_message_id
        FROM message m
        WHERE m.conversation_id = p_conversation_id
        ORDER BY m.created_at DESC
        LIMIT 1;
    ELSE
        v_effective_last_message_id := p_last_message_id;
    END IF;

    UPDATE conversation_member
    SET unread_count = 0,
        last_read_message_id = COALESCE(v_effective_last_message_id, last_read_message_id),
        updated_at = NOW()
    WHERE conversation_id = p_conversation_id
        AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;




-- ============================================================================
-- Function Name : fn_get_conversation_messages
-- Purpose       : Retrieves messages from a conversation with optional pagination.
--                 Orders messages by creation time in descending order.
--                 Returns message details including sender name and read status.
-- Author        : OFFBEAT
-- Created On    : 23/02/2026
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_get_conversation_messages(
  p_conversation_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  content text,
  created_at timestamp,
  content_type text,
  sender_name text,
  isread boolean
)
LANGUAGE sql
AS $$
  SELECT
    m.id,
    m.sender_id,
    m.content,
    m.created_at,
    mct.name AS content_type,
    u.username AS sender_name,
    CASE 
      WHEN p_user_id IS NULL THEN FALSE
      WHEN cm.last_read_message_id IS NULL THEN FALSE
      WHEN m.created_at <= (
        SELECT m_lr.created_at 
        FROM message m_lr 
        WHERE m_lr.id = cm.last_read_message_id
      ) THEN TRUE
      ELSE FALSE
    END AS isread
  FROM message m
  JOIN message_content_type mct
    ON m.message_content_type_id = mct.id
  LEFT JOIN "user" u
    ON u.id = m.sender_id
  LEFT JOIN conversation_member cm
    ON cm.conversation_id = m.conversation_id 
    AND cm.user_id = p_user_id
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;


CREATE OR REPLACE FUNCTION public.fn_log_for_user_login(
    p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_log_id uuid;
BEGIN
    INSERT INTO public.user_login_log (
        user_id,
        logout_datetime,
        created_by,
        created_at
    )
    VALUES (
        p_user_id,
        NULL,
        p_user_id,
        NOW()
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.fn_log_for_user_logout(
    session_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.user_login_log
    SET logout_datetime = NOW()
    WHERE id = session_id;
END;
$$;



DROP FUNCTION IF EXISTS public.check_rate_limit(character varying, integer, integer, character varying, text);

-- ============================================================================
-- Function Name : check_rate_limit
-- Purpose       : Checks whether a client (identified by IP address) has
--                 exceeded the allowed number of requests within a defined
--                 time window. Every request is logged for auditing and
--                 monitoring purposes.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION check_rate_limit(
    -- Client IP address used to track request frequency
    p_ip_address VARCHAR,
    
    -- Maximum allowed requests within the time window
    p_limit INTEGER,
    
    -- Time window (in seconds) for rate limiting
    p_window_seconds INTEGER,
    
    -- API endpoint being accessed (e.g., 'api/login')
    p_request_url VARCHAR,
    
    -- Request payload/body for auditing or debugging
    p_request_body TEXT,

    -- User ID for auditing purposes
    p_user_id UUID
) 
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_request_count INTEGER;
BEGIN
    -- Count number of requests from the IP for this specific route within the time window
    SELECT COUNT(*)
    INTO v_request_count
    FROM api_rate_limit
    WHERE user_ip_address = p_ip_address
      AND request_url = p_request_url          -- <-- check for this route only
      AND created_at >= NOW() - (p_window_seconds || ' seconds')::INTERVAL;

    -- Log the current request (logged regardless of limit result)
    INSERT INTO api_rate_limit (
        request_url,
        request_data,
        user_ip_address,
        created_at,
            created_by
    ) VALUES (
        p_request_url,
        p_request_body,
        p_ip_address,
        NOW(),
        p_user_id
    );

    -- Deny request if count exceeds or equals limit
    IF v_request_count >= p_limit THEN
        RETURN FALSE;
    END IF;

    -- Request is within allowed rate limit
    RETURN TRUE;
END;
$$;
