-- Update fn_get_user_profile to include follower/following counts and follow status
CREATE OR REPLACE FUNCTION public.fn_get_user_profile(p_current_user_id uuid, p_user_id uuid)
 RETURNS TABLE(
    id uuid,
    first_name character varying,
    last_name character varying,
    username character varying,
    email character varying,
    bio text,
    profile_image_url character varying,
    city_id uuid,
    city_name character varying,
    interests character varying,
    tags character varying,
    joined_date timestamp without time zone,
    isblocked boolean,
    followers_count integer,
    following_count integer,
    is_following boolean
 )
 LANGUAGE plpgsql
AS $function$
BEGIN
RETURN QUERY
SELECT 
    u.id,
    u.firstname AS first_name,
    u.lastname AS last_name,
    u.username,
    u.email,
    u.bio,
    u.profileimageurl AS profile_image_url,
    u.city_id AS city_id,
    c.name AS city_name,
    u.interests,
    u.tags,
    u.created_at AS joined_date,
    -- Check if current user has blocked this user or vice versa
    EXISTS (
        SELECT 1 FROM public.user_report ur 
        WHERE (ur.user_id = p_current_user_id AND ur.blocked_user_id = p_user_id)
        OR (ur.user_id = p_user_id AND ur.blocked_user_id = p_current_user_id)
    ) AS isblocked,
    -- Follower count (users who follow this user)
    COALESCE(fc.follower_count, 0) AS followers_count,
    -- Following count (users this user follows)
    COALESCE(foc.following_count, 0) AS following_count,
    -- Is current user following this profile user?
    public.fn_is_following(p_current_user_id, p_user_id) AS is_following
FROM public."user" u
LEFT JOIN public.city c ON u.city_id = c.id
-- Get follower count (count of records where this user is followed)
LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer as follower_count
    FROM public.follower 
    WHERE followed_id = p_user_id
) fc ON TRUE
-- Get following count (count of records where this user follows others)
LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer as following_count
    FROM public.follower 
    WHERE follower_id = p_user_id
) foc ON TRUE
WHERE u.id = p_user_id
  AND u.is_active = true;

END;
$function$;
