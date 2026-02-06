-- Add socket tracking fields to user table
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS socket_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS socket_connected_at TIMESTAMP;

-- Create index for faster socket lookups
CREATE INDEX IF NOT EXISTS idx_user_socket_id ON "user"(socket_id) WHERE socket_id IS NOT NULL;


-- Function: Update User Socket on Connect
CREATE OR REPLACE FUNCTION fn_update_user_socket(
    p_user_id UUID,
    p_socket_id VARCHAR
)
RETURNS VOID AS $$
BEGIN
    UPDATE "user"
    SET socket_id = p_socket_id,
        socket_connected_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;


-- Function: Clear User Socket on Disconnect
CREATE OR REPLACE FUNCTION fn_clear_user_socket(
    p_socket_id VARCHAR
)
RETURNS VOID AS $$
BEGIN
    UPDATE "user"
    SET socket_id = NULL,
        socket_connected_at = NULL
    WHERE socket_id = p_socket_id;
END;
$$ LANGUAGE plpgsql;


-- Function: Get Conversation Member Sockets (for real-time delivery)
-- Returns socket IDs of online recipients (excluding sender)
CREATE OR REPLACE FUNCTION fn_get_conversation_sockets(
    p_conversation_id UUID,
    p_sender_id UUID
)
RETURNS TABLE (
    user_id UUID,
    socket_id VARCHAR,
    username TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id AS user_id,
        u.socket_id,
        u.username::TEXT
    FROM conversation_member cm
    JOIN "user" u ON u.id = cm.user_id
    WHERE cm.conversation_id = p_conversation_id
      AND cm.user_id != p_sender_id
      AND u.socket_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;


-- Function: Get User by Socket ID (for disconnect cleanup)
CREATE OR REPLACE FUNCTION fn_get_user_by_socket(
    p_socket_id VARCHAR
)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id AS user_id,
        u.username::TEXT,
        u.email::TEXT
    FROM "user" u
    WHERE u.socket_id = p_socket_id;
END;
$$ LANGUAGE plpgsql;
