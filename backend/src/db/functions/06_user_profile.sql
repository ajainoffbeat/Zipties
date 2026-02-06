CREATE OR REPLACE FUNCTION update_user(
    p_user_id UUID,
    p_firstname VARCHAR(50) DEFAULT NULL,
    p_lastname VARCHAR(50) DEFAULT NULL,
    p_username VARCHAR(50) DEFAULT NULL,
    p_bio VARCHAR(100) DEFAULT NULL,
    p_profile_image_url VARCHAR(100) DEFAULT NULL,
    p_updated_by UUID DEFAULT NULL,
    p_city_id UUID DEFAULT NULL,
    p_interests TEXT DEFAULT NULL,
    p_tags TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE "user"
    SET
        firstname = COALESCE(p_firstname, firstname),
        lastname = COALESCE(p_lastname, lastname),
        username = COALESCE(p_username, username),
        bio = COALESCE(p_bio, bio),
        profile_image_url = COALESCE(p_profile_image_url, profile_image_url),
        updated_by = COALESCE(p_updated_by, updated_by),
        updated_at = NOW(),
        city_id = COALESCE(p_city_id, city_id),
        interests = COALESCE(p_interests, interests),
        tags = COALESCE(p_tags, tags)
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$;
