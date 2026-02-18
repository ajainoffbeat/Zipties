
-- ============================================================================
-- Function Name : fn_get_conversation_messages
-- Purpose       : Retrieves messages from a conversation with optional pagination.
--                 Orders messages by creation time in descending order.
--                 Returns message details including sender name.
-- Author        : OFFBEAT
-- Created On    : 17/02/2026
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_get_conversation_messages(
  conversation_id uuid,
  limit_val integer DEFAULT 50,
  offset_val integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  content text,
  created_at timestamp,
  content_type text,
  sender_name text
)
LANGUAGE sql
AS $$
  SELECT
    m.id,
    m.sender_id,
    m.content,
    m.created_at,
    mct.name AS content_type,
    u.username AS sender_name
  FROM message m
  JOIN message_content_type mct
    ON m.message_content_type_id = mct.id
  LEFT JOIN "user" u
    ON u.id = m.sender_id
  WHERE m.conversation_id = fn_get_conversation_messages.conversation_id
  ORDER BY m.created_at DESC
  LIMIT fn_get_conversation_messages.limit_val OFFSET fn_get_conversation_messages.offset_val;
$$;

-- ============================================================================
-- Function Name : fn_send_message
-- Purpose       : Sends a message to a conversation with content validation and
--                 block checking. Updates conversation timestamps and unread
--                 counts. Supports different content types for rich messaging.
-- Author        : OFFBEAT
-- Created On    : 17/02/2025
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
RETURN v_message_id;
END;
$$;

-- 1️⃣ Last message lookup (CRITICAL)
CREATE INDEX idx_message_conversation_created_at_desc
ON message (conversation_id, created_at DESC)
INCLUDE (sender_id, content);
 
-- 2️⃣ Viewer conversations
CREATE INDEX idx_conversation_member_user_id
ON conversation_member (user_id, conversation_id);
 
-- 3️⃣ Other member lookup
CREATE INDEX idx_conversation_member_conversation_user
ON conversation_member (conversation_id, user_id);
 
-- 4️⃣ Sort conversations
CREATE INDEX idx_conversation_last_message_at_desc
ON conversation (last_message_at DESC);
 
-- 5️⃣ Block lookup
CREATE INDEX idx_user_report_user_blocked
ON user_report (user_id, blocked_user_id);
 
CREATE INDEX idx_message_conversation_content_created_at_desc
ON message (conversation_id, created_at DESC)
INCLUDE (id, sender_id, content, message_content_type_id);