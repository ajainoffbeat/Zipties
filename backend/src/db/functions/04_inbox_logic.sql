-- Function: Mark Conversation Read (Step 6)
CREATE OR REPLACE FUNCTION fn_mark_conversation_read(
    p_conversation_id UUID,
    p_user_id UUID,
    p_last_message_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE conversation_member
    SET unread_count = 0,
        last_read_message_id = p_last_message_id,
        updated_at = NOW()
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;


-- Function: Get User Inbox (Step 7)
-- Returns: list of conversations with last message, unread count, etc.
CREATE OR REPLACE FUNCTION fn_get_user_inbox(
    p_user_id UUID
)
RETURNS TABLE (
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
    is_blocked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS conversation_id,
        c.title,
        ct.name AS type_name,
        cm.unread_count,

        -- Hide content if conversation is blocked
        CASE 
            WHEN blocked.is_blocked THEN NULL
            ELSE m.content
        END AS last_message_content,

        c.last_message_at,
        m.sender_id AS last_message_sender_id,
        u.username::TEXT AS last_message_sender_name,
        cst.name AS source_type,
        c.source_id,

        blocked.is_blocked

    FROM conversation_member cm
    JOIN conversation c 
        ON cm.conversation_id = c.id
    JOIN conversation_type ct 
        ON c.conversation_type_id = ct.id
    LEFT JOIN conversation_source_type cst 
        ON c.conversation_source_type_id = cst.id

    -- Latest message per conversation
    LEFT JOIN LATERAL (
        SELECT content, sender_id
        FROM message m2
        WHERE m2.conversation_id = c.id
        ORDER BY m2.created_at DESC
        LIMIT 1
    ) m ON true

    LEFT JOIN "user" u 
        ON m.sender_id = u.id

    -- Check if conversation is blocked (by anyone in the conversation or by user)
    LEFT JOIN LATERAL (
        SELECT EXISTS (
            SELECT 1
            FROM conversation_member cm2
            LEFT JOIN user_report ur
              ON ( (ur.user_id = p_user_id AND ur.blocked_user_id = cm2.user_id)
                OR (ur.user_id = cm2.user_id AND ur.blocked_user_id = p_user_id)
              )
            WHERE cm2.conversation_id = c.id
              AND ur.id IS NOT NULL
        ) AS is_blocked
    ) blocked ON true

    WHERE cm.user_id = p_user_id
    ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;
