-- Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Populate conversation types if not exists
INSERT INTO conversation_type (id, name, description, is_active)
SELECT uuid_generate_v4(), 'individual', 'Direct 1-on-1 chat', '1'::bit
WHERE NOT EXISTS (SELECT 1 FROM conversation_type WHERE name = 'individual');

INSERT INTO conversation_type (id, name, description, is_active)
SELECT uuid_generate_v4(), 'group', 'Group chat', '1'::bit
WHERE NOT EXISTS (SELECT 1 FROM conversation_type WHERE name = 'group');

-- Function: Get or Create Conversation
CREATE OR REPLACE FUNCTION fn_get_or_create_conversation(
    p_user_ids UUID[],
    p_type_name VARCHAR,
    p_source_type_name VARCHAR DEFAULT NULL,
    p_source_id UUID DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
    v_type_id UUID;
    v_source_type_id UUID;
    v_is_direct BOOLEAN;
BEGIN
    -- Get conversation type ID
    SELECT id INTO v_type_id FROM conversation_type WHERE name = p_type_name;
    IF v_type_id IS NULL THEN
        RAISE EXCEPTION 'Invalid conversation type: %', p_type_name;
    END IF;

    -- Check if it is a direct conversation
    -- We treat 'individual' as direct
    v_is_direct := (p_type_name = 'individual'); 

    -- If Direct (individual), try to find existing conversation between exactly these users
    IF v_is_direct AND array_length(p_user_ids, 1) = 2 THEN
        SELECT cm1.conversation_id
        INTO v_conversation_id
        FROM conversation_member cm1
        JOIN conversation_member cm2 ON cm1.conversation_id = cm2.conversation_id
        JOIN conversation c ON cm1.conversation_id = c.id
        WHERE c.conversation_type_id = v_type_id
          AND cm1.user_id = p_user_ids[1]
          AND cm2.user_id = p_user_ids[2]
        LIMIT 1;
        
        IF v_conversation_id IS NOT NULL THEN
            RETURN v_conversation_id;
        END IF;
    END IF;

    -- Get source type ID if provided
    IF p_source_type_name IS NOT NULL THEN
        SELECT id INTO v_source_type_id FROM conversation_source_type WHERE name = p_source_type_name;
    END IF;

    -- Create new conversation
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
        CASE WHEN v_is_direct THEN 'Direct Chat' ELSE 'New Conversation' END
    )
    RETURNING id INTO v_conversation_id;

    -- Add members
    INSERT INTO conversation_member (conversation_id, user_id, created_at, unread_count, created_by)
    SELECT v_conversation_id, unnest(p_user_ids), NOW(), 0, p_created_by;

    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;
