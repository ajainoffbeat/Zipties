-- Ensure default message types exist
INSERT INTO message_content_type (id, name, description, is_active)
SELECT uuid_generate_v4(), 'text', 'Plain text message', '1'::bit
WHERE NOT EXISTS (SELECT 1 FROM message_content_type WHERE name = 'text');

INSERT INTO message_content_type (id, name, description, is_active)
SELECT uuid_generate_v4(), 'image', 'Image attachment', '1'::bit
WHERE NOT EXISTS (SELECT 1 FROM message_content_type WHERE name = 'image');


-- Function: Update Unread Counts (Step 5)
CREATE OR REPLACE FUNCTION fn_update_unread_counts(
    p_conversation_id UUID,
    p_sender_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE conversation_member
    SET unread_count = unread_count + 1
    WHERE conversation_id = p_conversation_id
      AND user_id != p_sender_id;
END;
$$ LANGUAGE plpgsql;


-- Function: Update Conversation Freshness (Step 4)
CREATE OR REPLACE FUNCTION fn_update_last_message_at(
    p_conversation_id UUID,
    p_timestamp TIMESTAMP
)
RETURNS VOID AS $$
BEGIN
    UPDATE conversation
    SET last_message_at = p_timestamp
    WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql;


-- Function: Send Message (Step 3)
CREATE OR REPLACE FUNCTION fn_send_message(
    p_conversation_id UUID,
    p_sender_id UUID,
    p_content TEXT,
    p_content_type_name VARCHAR DEFAULT 'text'
)
RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
    v_content_type_id UUID;
    v_now TIMESTAMP := NOW();
BEGIN
    -- Get content type ID
    SELECT id INTO v_content_type_id FROM message_content_type WHERE name = p_content_type_name;
    IF v_content_type_id IS NULL THEN
        RAISE EXCEPTION 'Invalid content type: %', p_content_type_name;
    END IF;

    -- Insert Message
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

    -- Update Last Message Timestamp on Conversation
    PERFORM fn_update_last_message_at(p_conversation_id, v_now);

    -- Update Unread Counts for other members
    PERFORM fn_update_unread_counts(p_conversation_id, p_sender_id);

    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;
