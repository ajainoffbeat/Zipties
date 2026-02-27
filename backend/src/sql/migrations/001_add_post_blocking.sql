
-- Function to block a post
CREATE OR REPLACE FUNCTION public.fn_block_post(p_user_id uuid, p_post_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO public.post_block (user_id, post_id, created_at)
    VALUES (p_user_id, p_post_id, NOW())
    ON CONFLICT (user_id, post_id) DO NOTHING;
    RETURN TRUE;
END;
$function$;

-- Function to report a post (using existing post_report table or creating if needed - schema check showed it exists)
-- Logic: Insert into post_report
CREATE OR REPLACE FUNCTION public.fn_report_post(
    p_user_id uuid, 
    p_post_id uuid, 
    p_comment text
)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO public.post_report (
        id,
        post_id,
        comment,
        created_at,
        blocked_user_id
    )
    VALUES (
        gen_random_uuid(),
        p_post_id,
        p_comment,
        NOW(),
        p_user_id
    );
    RETURN TRUE;
END;
$function$;

-- Update fn_get_posts to filter blocked posts and users
CREATE OR REPLACE FUNCTION public.fn_get_posts(p_user_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(post_id uuid, content character varying, created_at timestamp without time zone, user_id uuid, user_firstname character varying, user_lastname character varying, user_username character varying, assets json, like_count integer, comment_count integer, is_liked boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
RETURN QUERY
SELECT 
    p.id AS post_id,
    p.content,
    p.created_at,
    u.id AS user_id,
    u.firstname,
    u.lastname,
    u.username,

    -- ✅ Assets aggregated separately
    COALESCE(pa.assets, '[]'::json) AS assets,

    -- ✅ Likes counted separately
    COALESCE(lc.like_count, 0) AS like_count,

    -- ✅ Comments counted separately
    COALESCE(cc.comment_count, 0) AS comment_count,

    -- ✅ Is liked check
    EXISTS (
        SELECT 1
        FROM public.post_reaction pr_inner
        JOIN public.post_reaction_type prt_inner 
            ON pr_inner.post_reaction_type_id = prt_inner.id
        WHERE pr_inner.post_id = p.id
          AND pr_inner.user_id = p_user_id
          AND prt_inner.name = 'like'
          AND pr_inner.is_active = B'1'
    ) AS is_liked

FROM public.post p
JOIN public."user" u 
    ON p.user_id = u.id

-- 🔥 Aggregate assets separately
LEFT JOIN LATERAL (
    SELECT json_agg(
        json_build_object(
            'id', pa.id,
            'url', pa.url,
            'mimetype', pa.mimetype,
            'file_size_bytes', pa.file_size_bytes,
            'position', pa.position
        )
        ORDER BY pa.position
    ) AS assets
    FROM public.post_assets pa
    WHERE pa.post_id = p.id
      AND pa.is_active = true
) pa ON TRUE

-- 🔥 Count likes separately
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS like_count
    FROM public.post_reaction pr
    JOIN public.post_reaction_type prt 
        ON pr.post_reaction_type_id = prt.id
    WHERE pr.post_id = p.id
      AND prt.name = 'like'
      AND pr.is_active = B'1'
) lc ON TRUE

-- 🔥 Count comments separately
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS comment_count
    FROM public.post_comment pc
    WHERE pc.post_id = p.id
      AND pc.is_blocked = false
) cc ON TRUE

WHERE p.is_blocked = false
  AND u.is_blocked = false
  AND u.is_active = true
  
  -- 🚫 EXCLUDE POSTS FROM USERS BLOCKED BY CURRENT USER
  AND NOT EXISTS (
      SELECT 1 FROM public.user_report ur
      WHERE ur.blocked_user_id = p.user_id AND ur.user_id = p_user_id
  )

  -- 🚫 EXCLUDE POSTS FROM USERS WHO BLOCKED CURRENT USER
  AND NOT EXISTS (
      SELECT 1 FROM public.user_report ur
      WHERE ur.blocked_user_id = p_user_id AND ur.user_id = p.user_id
  )

ORDER BY p.created_at DESC
LIMIT p_limit OFFSET p_offset;

END;
$function$;

-- Update fn_search_posts to filter blocked posts and users
CREATE OR REPLACE FUNCTION public.fn_search_posts(p_search_query character varying, p_user_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(post_id uuid, content character varying, created_at timestamp without time zone, user_id uuid, user_firstname character varying, user_lastname character varying, user_username character varying, assets json, like_count integer, comment_count integer, is_liked boolean)
 LANGUAGE plpgsql
AS $function$ 
BEGIN 
RETURN QUERY
SELECT p.id as post_id,
    p.content,
    p.created_at,
    u.id as user_id,
    u.firstname as user_firstname,
    u.lastname as user_lastname,
    u.username as user_username,
    COALESCE(
        json_agg(
            json_build_object(
                'id',
                pa.id,
                'url',
                pa.url,
                'mimetype',
                pa.mimetype,
                'file_size_bytes',
                pa.file_size_bytes,
                'position',
                pa.position
            )
            ORDER BY pa.position
        ) FILTER (
            WHERE pa.id IS NOT NULL
        ),
        '[]'::json
    ) as assets,
    COUNT(DISTINCT CASE WHEN prt.name = 'like' AND pr.is_active = B'1' THEN pr.id END)::int as like_count,
    COUNT(DISTINCT pc.id)::int as comment_count,
    EXISTS(
        SELECT 1
        FROM public.post_reaction pr_inner
        LEFT JOIN public.post_reaction_type prt_inner ON pr_inner.post_reaction_type_id = prt_inner.id
        WHERE pr_inner.post_id = p.id
            AND pr_inner.user_id = p_user_id
            AND prt_inner.name = 'like'
            AND pr_inner.is_active = B'1'
    ) as is_liked
FROM public.post p
    LEFT JOIN public."user" u ON p.user_id = u.id
    LEFT JOIN public.post_assets pa ON p.id = pa.post_id AND pa.is_active = true
    LEFT JOIN public.post_reaction pr ON p.id = pr.post_id AND pr.is_active = B'1'
    LEFT JOIN public.post_reaction_type prt ON pr.post_reaction_type_id = prt.id AND prt.name = 'like' AND prt.is_active = B'1'
    LEFT JOIN public.post_comment pc ON p.id = pc.post_id AND pc.is_blocked = false
WHERE p.is_blocked = false
    AND u.is_blocked = false
    AND u.is_active = true
    AND p.content ILIKE '%' || p_search_query || '%'

    -- 🚫 EXCLUDE POSTS BLOCKED BY CURRENT USER
    AND NOT EXISTS (
        SELECT 1 FROM public.post_block pb 
        WHERE pb.post_id = p.id AND pb.user_id = p_user_id
    )

    -- 🚫 EXCLUDE POSTS FROM USERS BLOCKED BY CURRENT USER
    AND NOT EXISTS (
        SELECT 1 FROM public.user_report ur
        WHERE ur.blocked_user_id = p.user_id AND ur.user_id = p_user_id
    )

    -- 🚫 EXCLUDE POSTS FROM USERS WHO BLOCKED CURRENT USER
    AND NOT EXISTS (
        SELECT 1 FROM public.user_report ur
        WHERE ur.blocked_user_id = p_user_id AND ur.user_id = p.user_id
    )

GROUP BY p.id,
    p.content,
    p.created_at,
    u.id,
    u.firstname,
    u.lastname,
    u.username
ORDER BY p.created_at DESC
LIMIT p_limit OFFSET p_offset;
END;
$function$;
