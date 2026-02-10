-- ============================================================================
-- Function Name : fn_get_or_create_conversation
-- Purpose       : Gets an existing conversation between specified users or creates
--                 a new conversation if one doesn't exist. Handles both direct
--                 (individual) and group conversations with optional source
--                 tracking for audit purposes.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_or_create_conversation(
    p_user_ids UUID[],
    p_type_name VARCHAR,
    p_source_type_name VARCHAR DEFAULT NULL,
    p_source_id UUID DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID
AS $$
DECLARE
    v_conversation_id UUID;
    v_type_id UUID;
    v_source_type_id UUID;
    v_is_direct BOOLEAN;
BEGIN
    SELECT id
    INTO v_type_id
    FROM conversation_type
    WHERE name = p_type_name;

    IF v_type_id IS NULL THEN
        RAISE EXCEPTION 'Invalid conversation type: %', p_type_name;
    END IF;

    v_is_direct := (p_type_name = 'individual');

    IF v_is_direct AND array_length(p_user_ids, 1) = 2 THEN
        SELECT cm1.conversation_id
        INTO v_conversation_id
        FROM conversation_member cm1
        JOIN conversation_member cm2
            ON cm1.conversation_id = cm2.conversation_id
        JOIN conversation c
            ON cm1.conversation_id = c.id
        WHERE c.conversation_type_id = v_type_id
          AND cm1.user_id = p_user_ids[1]
          AND cm2.user_id = p_user_ids[2]
        LIMIT 1;

        IF v_conversation_id IS NOT NULL THEN
            RETURN v_conversation_id;
        END IF;
    END IF;

    IF p_source_type_name IS NOT NULL THEN
        SELECT id
        INTO v_source_type_id
        FROM conversation_source_type
        WHERE name = p_source_type_name;
    END IF;

    INSERT INTO conversation (
        conversation_type_id,
        conversation_source_type_id,
        source_id,
        created_by,
        last_message_at,
        title
    )
    VALUES (
        v_type_id,
        v_source_type_id,
        p_source_id,
        p_created_by,
        NOW(),
        CASE
            WHEN v_is_direct THEN 'Direct Chat'
            ELSE 'New Conversation'
        END
    )
    RETURNING id INTO v_conversation_id;

    INSERT INTO conversation_member (
        conversation_id,
        user_id,
        created_at,
        unread_count,
        created_by
    )
    SELECT
        v_conversation_id,
        unnest(p_user_ids),
        NOW(),
        0,
        p_created_by;

    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function Name : fn_mark_conversation_read
-- Purpose       : Marks a conversation as read for a specific user by resetting
--                 their unread count and updating the last read message ID.
--                 Used for tracking read status and notification management.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
-- Function: Mark Conversation Read (Step 6)
CREATE OR REPLACE FUNCTION public.fn_mark_conversation_read(
        p_conversation_id UUID,
        p_user_id UUID,
        p_last_message_id UUID
    ) RETURNS VOID AS $$ BEGIN
UPDATE conversation_member
SET unread_count = 0,
    last_read_message_id = p_last_message_id,
    updated_at = NOW()
WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- Function Name : fn_get_user_inbox
-- Purpose       : Retrieves all conversations for a user with detailed information
--                 including unread counts, last message details, and block status.
--                 Returns inbox data sorted by most recent message activity.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_user_inbox(p_user_id UUID) RETURNS TABLE (
        conversation_id UUID,
        title VARCHAR,
        type_name VARCHAR,
        unread_count INT,
        last_message_content TEXT,
        last_message_at TIMESTAMP,
        last_message_sender_id UUID,
        last_message_sender_name TEXT,
        source_type VARCHAR,
        source_id UUID,
        is_blocked BOOLEAN,
        blocked_by UUID
    ) AS $$ BEGIN RETURN QUERY
SELECT c.id AS conversation_id,
    c.title,
    ct.name AS type_name,
    cm.unread_count,
    CASE
        WHEN block_info.is_blocked THEN NULL
        ELSE m.content
    END AS last_message_content,
    c.last_message_at,
    m.sender_id AS last_message_sender_id,
    u.username::TEXT AS last_message_sender_name,
    cst.name AS source_type,
    c.source_id,
    COALESCE(block_info.is_blocked, FALSE),
    block_info.blocked_by
FROM conversation_member cm
    JOIN conversation c ON cm.conversation_id = c.id
    JOIN conversation_type ct ON c.conversation_type_id = ct.id
    LEFT JOIN conversation_source_type cst ON c.conversation_source_type_id = cst.id
    LEFT JOIN LATERAL (
        SELECT content,
            sender_id
        FROM message m2
        WHERE m2.conversation_id = c.id
        ORDER BY m2.created_at DESC
        LIMIT 1
    ) m ON true
    LEFT JOIN "user" u ON m.sender_id = u.id
    LEFT JOIN LATERAL (
        SELECT TRUE AS is_blocked,
            ur.user_id AS blocked_by
        FROM user_report ur
        WHERE (
                ur.user_id = p_user_id
                AND ur.blocked_user_id = cm.user_id
            )
            OR (
                ur.user_id = cm.user_id
                AND ur.blocked_user_id = p_user_id
            )
        LIMIT 1
    ) block_info ON true
WHERE cm.user_id = p_user_id
ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- Function Name : fn_update_unread_counts
-- Purpose       : Increments unread message count for all conversation members
--                 except the sender. Called after sending a new message to
--                 track unread notifications for other participants.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_update_unread_counts(
        p_conversation_id UUID,
        p_sender_id UUID
    ) RETURNS VOID AS $$ BEGIN
UPDATE conversation_member
SET unread_count = unread_count + 1
WHERE conversation_id = p_conversation_id
    AND user_id != p_sender_id;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- Function Name : fn_update_last_message_at
-- Purpose       : Updates the last message timestamp for a conversation.
--                 Used for sorting conversations by recent activity and
--                 maintaining conversation ordering in user interfaces.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_update_last_message_at(
        p_conversation_id UUID,
        p_timestamp TIMESTAMP
    ) RETURNS VOID AS $$ BEGIN
UPDATE conversation
SET last_message_at = p_timestamp
WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- Function Name : fn_send_message
-- Purpose       : Sends a message to a conversation with content validation and
--                 block checking. Updates conversation timestamps and unread
--                 counts. Supports different content types for rich messaging.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_send_message(
        p_conversation_id UUID,
        p_sender_id UUID,
        p_content TEXT,
        p_content_type_name VARCHAR DEFAULT 'text'
    ) RETURNS UUID AS $$
DECLARE v_message_id UUID;
v_content_type_id UUID;
v_now TIMESTAMP := NOW();
BEGIN
SELECT id INTO v_content_type_id
FROM message_content_type
WHERE name = p_content_type_name;
IF v_content_type_id IS NULL THEN RAISE EXCEPTION 'Invalid content type: %',
p_content_type_name;
END IF;
IF EXISTS (
    SELECT 1
    FROM conversation_member cm
    WHERE cm.conversation_id = p_conversation_id
        AND cm.user_id != p_sender_id
        AND EXISTS (
            SELECT 1
            FROM user_report ur
            WHERE (
                    ur.user_id = p_sender_id
                    AND ur.blocked_user_id = cm.user_id
                )
                OR (
                    ur.user_id = cm.user_id
                    AND ur.blocked_user_id = p_sender_id
                )
        )
) THEN RAISE EXCEPTION 'Message blocked: One of the users has blocked the other.';
END IF;
INSERT INTO message (
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
        v_content_type_id,
        p_sender_id,
        v_now
    )
RETURNING id INTO v_message_id;
PERFORM fn_update_last_message_at(p_conversation_id, v_now);
PERFORM fn_update_unread_counts(p_conversation_id, p_sender_id);
RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- Function Name : fn_update_user_socket
-- Purpose       : Updates a user's socket connection ID and timestamp for
--                 real-time messaging. Used to track active connections and
--                 enable instant message delivery via WebSocket.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_update_user_socket(p_user_id UUID, p_socket_id VARCHAR) RETURNS VOID AS $$ BEGIN
UPDATE "user"
SET socket_id = p_socket_id,
    socket_connected_at = NOW()
WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- Function Name : fn_clear_user_socket
-- Purpose       : Clears a user's socket connection when they disconnect.
--                 Removes socket ID and connection timestamp to mark user
--                 as offline for real-time messaging system.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_clear_user_socket(p_socket_id VARCHAR) RETURNS VOID AS $$ BEGIN
UPDATE "user"
SET socket_id = NULL,
    socket_connected_at = NULL
WHERE socket_id = p_socket_id;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- Function Name : fn_get_conversation_sockets
-- Purpose       : Retrieves socket connection details for all active users in
--                 a conversation except the sender. Used for real-time message
--                 broadcasting to connected participants in chat.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_conversation_sockets(
        p_conversation_id UUID,
        p_sender_id UUID
    ) RETURNS TABLE (
        user_id UUID,
        socket_id VARCHAR,
        username TEXT
    ) AS $$ BEGIN RETURN QUERY
SELECT u.id AS user_id,
    u.socket_id,
    u.username::TEXT
FROM conversation_member cm
    JOIN "user" u ON u.id = cm.user_id
WHERE cm.conversation_id = p_conversation_id
    AND cm.user_id != p_sender_id
    AND u.socket_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- Function Name : fn_get_user_by_socket
-- Purpose       : Retrieves user details by socket connection ID. Used to
--                 identify connected users for real-time messaging and
--                 authentication of WebSocket connections.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_user_by_socket(p_socket_id VARCHAR) RETURNS TABLE (
        user_id UUID,
        username TEXT,
        email TEXT
    ) AS $$ BEGIN RETURN QUERY
SELECT u.id AS user_id,
    u.username::TEXT,
    u.email::TEXT
FROM "user" u
WHERE u.socket_id = p_socket_id;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- Function Name : fn_add_conversation_members
-- Purpose       : Adds multiple users to an existing conversation as members.
--                 Prevents duplicate entries and initializes unread counts.
--                 Used for group chat management and conversation expansion.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_add_conversation_members(
        p_conversation_id UUID,
        p_user_ids UUID[]
    ) RETURNS VOID AS $$ BEGIN
INSERT INTO conversation_member (
        conversation_id,
        user_id,
        created_at,
        unread_count
    )
SELECT p_conversation_id,
    u_id,
    NOW(),
    0
FROM unnest(p_user_ids) AS u_id
WHERE NOT EXISTS (
        SELECT 1
        FROM conversation_member
        WHERE conversation_id = p_conversation_id
            AND user_id = u_id
    );
END;
$$ LANGUAGE plpgsql;