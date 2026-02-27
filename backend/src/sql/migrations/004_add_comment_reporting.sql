CREATE OR REPLACE FUNCTION public.fn_report_comment(
    p_post_comment_id UUID,
    p_reason TEXT,
    p_blocked_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_report_id UUID;
BEGIN
    -- Optional: prevent duplicate reports by same user
    IF EXISTS (
        SELECT 1 
        FROM public.post_comment_report 
        WHERE post_comment_id = p_post_comment_id
          AND blocked_user_id = p_blocked_user_id
    ) THEN
        RAISE EXCEPTION 'User has already reported this comment';
    END IF;

    INSERT INTO public.post_comment_report (
        post_comment_id,
        comment,
        blocked_user_id,
        report_status_id
    )
    VALUES (
        p_post_comment_id,
        p_reason,
        p_blocked_user_id,
        NULL
    )
    RETURNING id INTO v_report_id;

    RETURN v_report_id;
END;
$$;