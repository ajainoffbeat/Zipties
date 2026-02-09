CREATE OR REPLACE FUNCTION public.fn_block_user(
    p_user_id UUID,
    p_blocked_user_id UUID,
    p_comment VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validate inputs
    IF p_user_id IS NULL OR p_blocked_user_id IS NULL THEN
        RETURN QUERY
        SELECT FALSE, 'user_id and blocked_user_id are required';
        RETURN;
    END IF;
 
    -- Prevent self-blocking
    IF p_user_id = p_blocked_user_id THEN
        RETURN QUERY
        SELECT FALSE, 'User cannot block themselves';
        RETURN;
    END IF;
 
    -- Prevent duplicate block
    IF EXISTS (
        SELECT 1
        FROM user_report
        WHERE user_id = p_user_id
          AND blocked_user_id = p_blocked_user_id
    ) THEN
        RETURN QUERY
        SELECT FALSE, 'User already blocked';
        RETURN;
    END IF;
 
    -- Insert block record
    INSERT INTO user_report (
        id,
        user_id,
        comment,
        blocked_user_id,
        created_by,
        created_at
    )
    VALUES (
        gen_random_uuid(),
        p_user_id,
        p_comment,
        p_blocked_user_id,
        p_user_id,
        NOW()
    );
 
    RETURN QUERY
    SELECT TRUE, 'User blocked successfully';
 
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY
        SELECT FALSE, 'Error occurred while blocking user';
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_unblock_user(
    p_user_id UUID,
    p_blocked_user_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validate inputs
    IF p_user_id IS NULL OR p_blocked_user_id IS NULL THEN
        RETURN QUERY
        SELECT FALSE, 'user_id and blocked_user_id are required';
        RETURN;
    END IF;
 
    -- Prevent self-unblocking edge case
    IF p_user_id = p_blocked_user_id THEN
        RETURN QUERY
        SELECT FALSE, 'Invalid operation';
        RETURN;
    END IF;
 
    -- Check if block exists
    IF NOT EXISTS (
        SELECT 1
        FROM user_report
        WHERE user_id = p_user_id
          AND blocked_user_id = p_blocked_user_id
    ) THEN
        RETURN QUERY
        SELECT FALSE, 'Block record not found';
        RETURN;
    END IF;
 
    -- Delete the block
    DELETE FROM user_report
    WHERE user_id = p_user_id
      AND blocked_user_id = p_blocked_user_id;
 
    RETURN QUERY
    SELECT TRUE, 'User unblocked successfully';
 
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY
        SELECT FALSE, 'Error occurred while unblocking user';
END;
$$;
 