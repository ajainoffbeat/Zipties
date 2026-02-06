-- Function: Add Conversation Members
CREATE OR REPLACE FUNCTION fn_add_conversation_members(
    p_conversation_id UUID,
    p_user_ids UUID[]
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO conversation_member (conversation_id, user_id, created_at, unread_count)
    SELECT p_conversation_id, u_id, NOW(), 0
    FROM unnest(p_user_ids) AS u_id
    WHERE NOT EXISTS (
        SELECT 1 FROM conversation_member 
        WHERE conversation_id = p_conversation_id AND user_id = u_id
    );
END;
$$ LANGUAGE plpgsql;
