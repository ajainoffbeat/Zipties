-- Create indexes for performance on existing follower table
CREATE INDEX IF NOT EXISTS idx_follower_follower_id ON public.follower(follower_id);
CREATE INDEX IF NOT EXISTS idx_follower_followed_id ON public.follower(followed_id);
CREATE INDEX IF NOT EXISTS idx_follower_created_at ON public.follower(created_at);

-- Add unique constraint to prevent duplicate follows (using DO block for compatibility)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_follower_followed' 
        AND conrelid = 'public.follower'::regclass
    ) THEN
        ALTER TABLE public.follower 
        ADD CONSTRAINT unique_follower_followed 
        UNIQUE(follower_id, followed_id);
    END IF;
END $$;

-- Function to follow a user (using existing follower table)
CREATE OR REPLACE FUNCTION public.fn_follow_user(p_follower_id uuid, p_followed_id uuid)
 RETURNS TABLE(success boolean, message text, follow_id uuid, followed_at timestamp without time zone)
 LANGUAGE plpgsql
AS $function$
DECLARE
    follow_record_id uuid;
BEGIN
    -- Validate inputs
    IF p_follower_id IS NULL OR p_followed_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Both user IDs are required', NULL::uuid, NULL::timestamp;
        RETURN;
    END IF;
    
    -- Prevent users from following themselves
    IF p_follower_id = p_followed_id THEN
        RETURN QUERY SELECT FALSE, 'Users cannot follow themselves', NULL::uuid, NULL::timestamp;
        RETURN;
    END IF;
    
    -- Check if users exist
    IF NOT EXISTS (SELECT 1 FROM public."user" WHERE id = p_follower_id AND is_active = true) THEN
        RETURN QUERY SELECT FALSE, 'Follower user not found', NULL::uuid, NULL::timestamp;
        RETURN;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public."user" WHERE id = p_followed_id AND is_active = true) THEN
        RETURN QUERY SELECT FALSE, 'Followed user not found', NULL::uuid, NULL::timestamp;
        RETURN;
    END IF;
    
    -- Check if already following
    IF EXISTS (SELECT 1 FROM public.follower WHERE follower_id = p_follower_id AND followed_id = p_followed_id) THEN
        RETURN QUERY SELECT FALSE, 'Already following this user', NULL::uuid, NULL::timestamp;
        RETURN;
    END IF;
    
    -- Create follow relationship
    INSERT INTO public.follower (follower_id, followed_id, created_at)
    VALUES (p_follower_id, p_followed_id, NOW())
    RETURNING id, created_at INTO follow_record_id, followed_at;
    
    RETURN QUERY SELECT TRUE, 'User followed successfully', follow_record_id, followed_at;
END;
$function$;

-- Function to unfollow a user (using existing follower table)
CREATE OR REPLACE FUNCTION public.fn_unfollow_user(p_follower_id uuid, p_followed_id uuid)
 RETURNS TABLE(success boolean, message text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Validate inputs
    IF p_follower_id IS NULL OR p_followed_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Both user IDs are required';
        RETURN;
    END IF;
    
    -- Prevent users from unfollowing themselves
    IF p_follower_id = p_followed_id THEN
        RETURN QUERY SELECT FALSE, 'Users cannot unfollow themselves';
        RETURN;
    END IF;
    
    -- Check if follow relationship exists
    IF NOT EXISTS (SELECT 1 FROM public.follower WHERE follower_id = p_follower_id AND followed_id = p_followed_id) THEN
        RETURN QUERY SELECT FALSE, 'Not following this user';
        RETURN;
    END IF;
    
    -- Remove follow relationship
    DELETE FROM public.follower 
    WHERE follower_id = p_follower_id AND followed_id = p_followed_id;
    
    RETURN QUERY SELECT TRUE, 'User unfollowed successfully';
END;
$function$;

-- Function to get follower count (using existing follower table)
CREATE OR REPLACE FUNCTION public.fn_get_follower_count(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN (
        SELECT COUNT(*)::integer 
        FROM public.follower 
        WHERE followed_id = p_user_id
    );
END;
$function$;

-- Function to get following count (using existing follower table)
CREATE OR REPLACE FUNCTION public.fn_get_following_count(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN (
        SELECT COUNT(*)::integer 
        FROM public.follower 
        WHERE follower_id = p_user_id
    );
END;
$function$;

-- Function to check if user is following another user (using existing follower table)
CREATE OR REPLACE FUNCTION public.fn_is_following(p_follower_id uuid, p_followed_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.follower 
        WHERE follower_id = p_follower_id AND followed_id = p_followed_id
    );
END;
$function$;
