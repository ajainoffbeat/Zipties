-- ============================================================================
-- Table Name    : migrate
-- Purpose       : Stores database migration history
-- ============================================================================
CREATE TABLE IF NOT EXISTS sql_migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  executed_at TIMESTAMP NOT NULL DEFAULT NOW()
);



-- ============================================================================
-- Table: user_status
-- ============================================================================
CREATE TABLE user_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(30) NOT NULL,
    description VARCHAR(30),

    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- Table: city
-- ============================================================================
CREATE TABLE city (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(30) NOT NULL,
    country_code VARCHAR(30) NOT NULL,
    city VARCHAR(30) NOT NULL,
    state VARCHAR(30),

    is_active BOOLEAN DEFAULT TRUE
);


-- ============================================================================
-- Table: user
-- ============================================================================
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    firstname VARCHAR(50),
    lastname VARCHAR(50),

    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(70) UNIQUE NOT NULL,
    password VARCHAR(70) NOT NULL,

    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_blocked BOOLEAN DEFAULT FALSE,

    status_id UUID,
    city_id UUID,

    bio VARCHAR(100),
    profile_image_url VARCHAR(100),

    interests TEXT,
    tags TEXT,

    reset_password_token VARCHAR(70),
    token_expires_at TIMESTAMP WITHOUT TIME ZONE,

    blocked_at TIMESTAMP WITHOUT TIME ZONE,

    created_by UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),

    updated_by UUID,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_user_created_by
        FOREIGN KEY (created_by)
        REFERENCES "user"(id),

    CONSTRAINT fk_user_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES "user"(id),

    CONSTRAINT fk_user_status
        FOREIGN KEY (status_id)
        REFERENCES user_status(id),

    CONSTRAINT fk_user_city
        FOREIGN KEY (city_id)
        REFERENCES city(id)
);

-- ============================================================================
-- Table: user_role
-- ============================================================================
CREATE TABLE user_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(30) NOT NULL,
    description VARCHAR(30),

    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- Table: user_role_mapping
-- ============================================================================
CREATE TABLE user_role_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    role_id UUID NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_urm_user
        FOREIGN KEY (user_id)
        REFERENCES "user"(id),

    CONSTRAINT fk_urm_role
        FOREIGN KEY (role_id)
        REFERENCES user_role(id),

    CONSTRAINT uq_user_role
        UNIQUE (user_id, role_id)
);

-- ============================================================================
-- Table: error_log
-- ============================================================================
CREATE TABLE error_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    action VARCHAR(100) NOT NULL,
    request_data TEXT,
    stack_trace TEXT,
    error_message TEXT,

    created_by UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_error_log_created_by
        FOREIGN KEY (created_by)
        REFERENCES "user"(id)
);

-- ============================================================================
-- Table: api_rate_limit
-- ============================================================================
CREATE TABLE api_rate_limit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    request_url VARCHAR(100) NOT NULL,
    request_data TEXT,

    user_ip_address VARCHAR(30),

    created_by UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_api_rate_limit_created_by
        FOREIGN KEY (created_by)
        REFERENCES "user"(id)
);

-- ============================================================================
-- Table: user_login_log
-- ============================================================================
CREATE TABLE user_login_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    logout_datetime TIMESTAMP WITHOUT TIME ZONE,

    created_by UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_user_login_log_user
        FOREIGN KEY (user_id)
        REFERENCES "user"(id),

    CONSTRAINT fk_user_login_log_created_by
        FOREIGN KEY (created_by)
        REFERENCES "user"(id)
);

-- ============================================================================
-- Table: report_status
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: conversation_type
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversation_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: conversation_source_type
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversation_source_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: conversation
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_type_id UUID REFERENCES conversation_type(id),
    title VARCHAR(255),
    created_by UUID REFERENCES "user"(id),
    conversation_source_type_id UUID REFERENCES conversation_source_type(id), -- post, listing, marketplace
    source_id UUID,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Table: message_content_type
-- ============================================================================
CREATE TABLE IF NOT EXISTS message_content_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: message
-- ============================================================================
CREATE TABLE IF NOT EXISTS message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversation(id),
    sender_id UUID REFERENCES "user"(id),
    content TEXT,
    message_content_type_id UUID REFERENCES message_content_type(id),
    created_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES "user"(id),
    updated_at TIMESTAMP
);

-- ============================================================================
-- Table: conversation_member
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversation_member (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversation(id),
    user_id UUID REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES "user"(id),
    updated_by UUID REFERENCES "user"(id),
    updated_at TIMESTAMP,
    last_read_message_id UUID REFERENCES message(id),
    unread_count INT
);

-- ============================================================================
-- Table: user_report
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_report (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES "user"(id),
    comment VARCHAR(200),
    blocked_user_id UUID REFERENCES "user"(id), -- user being blocked by another user
    created_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Table: post
-- ============================================================================
CREATE TABLE IF NOT EXISTS post (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES "user"(id),
    content VARCHAR(200),
    is_blocked BIT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES "user"(id),
    updated_at TIMESTAMP,
    blocked_at TIMESTAMP
);

-- ============================================================================
-- Table: post_report
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_report (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES post(id),
    comment VARCHAR(200),
    blocked_user_id UUID REFERENCES "user"(id), -- user who reported post
    created_at TIMESTAMP DEFAULT NOW(),
    report_status_id UUID REFERENCES report_status(id) -- open/rejected/actioned
);

-- ============================================================================
-- Table: post_reaction_type
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_reaction_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: post_reaction
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_reaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES post(id),
    post_reaction_type_id UUID REFERENCES post_reaction_type(id), -- like/dislike
    user_id UUID REFERENCES "user"(id),
    is_active BIT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES "user"(id),
    updated_at TIMESTAMP
);

-- ============================================================================
-- Table: assets_type
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: post_assets
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES post(id),
    assets_type_id UUID REFERENCES assets_type(id), -- image/video
    url VARCHAR(150),
    mimetype VARCHAR(150),
    file_size_bytes INT,
    position INT,
    is_active BIT,
    created_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES "user"(id),
    updated_at TIMESTAMP
);

-- ============================================================================
-- Table: post_comment
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_comment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES post(id),
    comment VARCHAR(150), -- fixed typo varhcar -> varchar
    user_id UUID REFERENCES "user"(id), -- user who added comment
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES "user"(id),
    updated_at TIMESTAMP,
    is_blocked BIT,
    blocked_at TIMESTAMP
);

-- ============================================================================
-- Table: post_comment_report
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_comment_report (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_comment_id UUID REFERENCES post_comment(id),
    comment VARCHAR(200),
    blocked_user_id UUID REFERENCES "user"(id), -- user who reported comment
    created_at TIMESTAMP DEFAULT NOW(),
    report_status_id UUID REFERENCES report_status(id) -- open/rejected/actioned
);

-- ============================================================================
-- Table: currency
-- ============================================================================
CREATE TABLE IF NOT EXISTS currency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30)
);

-- ============================================================================
-- Table: proposal_status
-- ============================================================================
CREATE TABLE IF NOT EXISTS proposal_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: proposal_category
-- ============================================================================
CREATE TABLE IF NOT EXISTS proposal_category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: proposal
-- ============================================================================
CREATE TABLE IF NOT EXISTS proposal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID REFERENCES "user"(id),
    title VARCHAR(200),
    description TEXT,
    budget_amount FLOAT,
    currency_id UUID REFERENCES currency(id),
    status_id UUID REFERENCES proposal_status(id),
    proposal_category_id UUID REFERENCES proposal_category(id),
    interested_count INT,
    joined_count INT,
    location_id UUID REFERENCES city(id),
    is_active BIT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES "user"(id),
    updated_at TIMESTAMP,
    blocked_at TIMESTAMP
);

-- ============================================================================
-- Table: proposal_participant_status
-- ============================================================================
CREATE TABLE IF NOT EXISTS proposal_participant_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: proposal_participant
-- ============================================================================
CREATE TABLE IF NOT EXISTS proposal_participant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES "user"(id),
    proposal_id UUID REFERENCES proposal(id),
    proposal_participant_status_id UUID REFERENCES proposal_participant_status(id),
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BIT
);

-- ============================================================================
-- Table: marketplace_category
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: marketplace_status
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: marketplace
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_user_id UUID REFERENCES "user"(id),
    title VARCHAR(150),
    description TEXT,
    price_amount FLOAT,
    currency_id UUID REFERENCES currency(id),
    currency_code VARCHAR(10),
    location_id UUID REFERENCES city(id),
    marketplace_category_id UUID REFERENCES marketplace_category(id),
    marketplace_status_id UUID REFERENCES marketplace_status(id),
    is_active BIT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES "user"(id),
    updated_at TIMESTAMP,
    blocked_at TIMESTAMP
);

-- ============================================================================
-- Table: marketplace_assets
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id UUID REFERENCES marketplace(id),
    assets_type_id UUID REFERENCES assets_type(id), -- image/video
    url VARCHAR(150),
    mimetype VARCHAR(150),
    file_size_bytes INT,
    position INT,
    created_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES "user"(id),
    updated_at TIMESTAMP
);



-- ============================================================================
-- Table: marketplace_report
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_report (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id UUID REFERENCES marketplace(id),
    comment VARCHAR(200),
    blocked_user_id UUID REFERENCES "user"(id),
    created_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT NOW(),
    report_status_id UUID REFERENCES report_status(id)
);

-- ============================================================================
-- Table: follower
-- ============================================================================
CREATE TABLE IF NOT EXISTS follower (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES "user"(id), -- user who follows
    followed_id UUID REFERENCES "user"(id), -- user being followed
    created_at TIMESTAMP DEFAULT NOW()
);


-- ============================================================================
-- Function Name : fn_get_user_status_id_by_status_name
-- Purpose       : Retrieves the UUID of an active user status based on the
--                 provided status name. The lookup is case-insensitive and
--                 ensures only active statuses are considered.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_user_status_id_by_status_name(
    -- Name of the user status (e.g., 'Active', 'Inactive', 'Pending')
    p_status_name VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    -- Variable to store the matched user status ID
    v_status_id UUID;
BEGIN
    -- Fetch the ID of the active user status matching the given name
    SELECT id
    INTO v_status_id
    FROM user_status
    WHERE LOWER(name) = LOWER(p_status_name)
      AND is_active = TRUE
    LIMIT 1;

    -- Return the user status ID (NULL if not found)
    RETURN v_status_id;
END;
$$;



-- ============================================================================
-- Function Name : fn_get_active_user_status_id
-- Purpose       : Retrieves the UUID of the ACTIVE user status by internally
--                 calling the reusable status lookup function. This function
--                 acts as a convenience wrapper to avoid hardcoding status
--                 names across the codebase.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_active_user_status_id()
RETURNS UUID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delegate status lookup to the generic status-name-based function
    RETURN fn_get_user_status_id_by_status_name('active');
END;
$$;



-- ============================================================================
-- Function Name : create_user
-- Purpose       : Creates a new user record in the system with default
--                 initialization values. The function assigns an ACTIVE
--                 user status, ensures email uniqueness, and returns the
--                 generated user ID upon successful creation.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION create_user(
    p_email VARCHAR,
    p_password VARCHAR,
    p_firstname VARCHAR,
    p_lastname VARCHAR
)
RETURNS TABLE(
    user_id UUID,
    user_role VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_status_id UUID;
    v_role_id UUID;
    v_role_name VARCHAR := 'user'; -- default role
BEGIN
    -- Get active status
    v_status_id := fn_get_active_user_status_id();

    -- Check existing user
    IF EXISTS (
        SELECT 1 FROM "user" WHERE email = p_email
    ) THEN
        RETURN;
    END IF;

    -- Insert user
    INSERT INTO "user" (
        id,
        email,
        username,
        password,
        firstname,
        lastname,
        is_verified,
        is_active,
        status_id,
        created_at
    ) VALUES (
        v_user_id,
        p_email,
        p_email,
        p_password,
        p_firstname,
        p_lastname,
        FALSE,
        TRUE,
        v_status_id,
        NOW()
    );

    -- Get role ID
    v_role_id := fn_get_user_role_id(v_role_name);

    -- Map user to role
    PERFORM fn_assign_user_role(v_user_id, v_role_id);

    -- Return result
    RETURN QUERY
    SELECT v_user_id, v_role_name;
END;
$$;



-- ============================================================================
-- Function Name : get_user_by_email
-- Purpose       : Fetches a user's basic authentication details using email.
--                 This function is primarily used during login to retrieve
--                 the user ID and hashed password.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_by_email(p_email VARCHAR)
RETURNS TABLE(
    user_id UUID,
    password VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.password
    FROM "user" u
    WHERE u.email = p_email
    LIMIT 1;
END;
$$;



-- ============================================================================
-- Function Name : check_rate_limit
-- Purpose       : Checks whether a client (identified by IP address) has
--                 exceeded the allowed number of requests within a defined
--                 time window. Every request is logged for auditing and
--                 monitoring purposes.
-- Author        : OFFBEAT
-- Created On    : 29/01/2025
-- ============================================================================
CREATE OR REPLACE FUNCTION check_rate_limit(
    -- Client IP address used to track request frequency
    p_ip_address VARCHAR,
    
    -- Maximum allowed requests within the time window
    p_limit INTEGER,
    
    -- Time window (in seconds) for rate limiting
    p_window_seconds INTEGER,
    
    -- API endpoint being accessed (e.g., 'api/login')
    p_request_url VARCHAR,
    
    -- Request payload/body for auditing or debugging
    p_request_body TEXT
) 
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_request_count INTEGER;
BEGIN
    -- Count number of requests from the IP for this specific route within the time window
    SELECT COUNT(*)
    INTO v_request_count
    FROM api_rate_limit
    WHERE user_ip_address = p_ip_address
      AND request_url = p_request_url          -- <-- check for this route only
      AND created_at >= NOW() - (p_window_seconds || ' seconds')::INTERVAL;

    -- Log the current request (logged regardless of limit result)
    INSERT INTO api_rate_limit (
        request_url,
        request_data,
        user_ip_address,
        created_at
    ) VALUES (
        p_request_url,
        p_request_body,
        p_ip_address,
        NOW()
    );

    -- Deny request if count exceeds or equals limit
    IF v_request_count >= p_limit THEN
        RETURN FALSE;
    END IF;

    -- Request is within allowed rate limit
    RETURN TRUE;
END;
$$;

-- ============================================================================
-- Function Name : log_error
-- Purpose       : Logs application or database errors into the error_log table
--                 for debugging, audit, and monitoring purposes.
-- Author        : OFFBEAT
-- Created On    : 29/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION log_error(
    p_action character varying,
    p_request_data character varying,
    p_stack_trace text,
    p_error_message character varying,
    p_created_by uuid
)
RETURNS void
LANGUAGE plpgsql
COST 100
VOLATILE PARALLEL UNSAFE
AS $$
BEGIN
    INSERT INTO error_log (
        id,
        action,
        request_data,
        stack_trace,
        error_message,
        created_by
    )
    VALUES (
        gen_random_uuid(),
        p_action,
        p_request_data,
        p_stack_trace,
        p_error_message,
        p_created_by
    );
END;
$$;


-- ============================================================================
-- Function Name : log_for_user_login
-- Purpose       : Creates a login log entry when a user successfully logs in
--                 and returns the generated login log ID.
-- Author        : OFFBEAT
-- Created On    : 30/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION log_for_user_login(
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO user_login_log (
        id,
        user_id,
        created_by,
        created_at
    )
    VALUES (
        gen_random_uuid(),
        p_user_id,
        p_user_id,
        NOW()
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- Function Name : fn_get_user_role_id
-- Purpose       : Fetches role ID based on the provided role name.
-- Author        : OFFBEAT
-- Created On    : 30/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_user_role_id(
    p_role_name VARCHAR
)
RETURNS UUID AS $$
DECLARE
    v_role_id UUID;
BEGIN
    SELECT id
    INTO v_role_id
    FROM user_role
    WHERE name = p_role_name;

    RETURN v_role_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- Function Name : fn_assign_user_role
-- Purpose       : Assigns a role to a user by inserting a record into
--                 user_role_mapping table.
-- Author        : OFFBEAT
-- Created On    : 30/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_assign_user_role(
    p_user_id UUID,
    p_role_id UUID
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_role_mapping (
        id,
        user_id,
        role_id,
        is_active
    )
    VALUES (
        gen_random_uuid(),
        p_user_id,
        p_role_id,
        TRUE
    );
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- Function Name : log_for_user_logout
-- Purpose       : Updates the latest active login record with logout time
--                 when a user logs out.
-- Author        : OFFBEAT
-- Created On    : 30/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION log_for_user_logout(
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    SELECT id
    INTO v_log_id
    FROM user_login_log
    WHERE user_id = p_user_id
      AND logout_datetime IS NULL
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_log_id IS NULL THEN
        RETURN FALSE;
    END IF;

    UPDATE user_login_log
    SET logout_dateime = NOW()
    WHERE id = v_log_id;

    RETURN TRUE;
END;
$$;


-- ============================================================================
-- Function Name : fn_reset_password_with_token
-- Purpose       : Resets user password using a valid reset token and
--                 clears the token after successful update.
-- Author        : OFFBEAT
-- Created On    : 30/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_reset_password_with_token(
    p_token text,
    p_new_password text
)
RETURNS boolean
LANGUAGE 'plpgsql'
COST 100
VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE "user"
    SET
        password = p_new_password,
        reset_password_token = NULL,
        token_expires_at = NULL
    WHERE reset_password_token = p_token
      AND token_expires_at > NOW();

    GET DIAGNOSTICS rows_updated = ROW_COUNT;

    RETURN rows_updated = 1;
END;
$BODY$;


-- ============================================================================
-- Function Name : fn_update_user_password_reset_token
-- Purpose       : Generates and stores password reset token and expiry
--                 for a user identified by email.
-- Author        : OFFBEAT
-- Created On    : 30/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_update_user_password_reset_token(
    p_email character varying,
    p_reset_token text,
    p_expires_at timestamp without time zone
)
RETURNS boolean
LANGUAGE 'plpgsql'
COST 100
VOLATILE PARALLEL UNSAFE
AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE "user"
    SET
        reset_password_token = p_reset_token,
        token_expires_at = p_expires_at
    WHERE email = p_email;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;

    RETURN rows_updated > 0;
END;
$$;


-- ============================================================================
-- Function Name : fn_verify_password_reset_token
-- Purpose       : Validates whether a password reset token exists
--                 and has not expired.
-- Author        : OFFBEAT
-- Created On    : 30/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_verify_password_reset_token(
    p_token text
)
RETURNS boolean
LANGUAGE 'plpgsql'
COST 100
VOLATILE PARALLEL UNSAFE
AS $$
DECLARE
    token_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM "user"
        WHERE reset_password_token = p_token
          AND token_expires_at > NOW()
    )
    INTO token_exists;

    RETURN token_exists;
END;
$$;


-- ============================================================================
-- Function Name : get_user_role_by_user_id
-- Purpose       : Fetches the active role assigned to a user.
-- Author        : OFFBEAT
-- Created On    : 30/01/2026
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_role_by_user_id(
    p_user_id UUID
)
RETURNS TABLE (
    role_id   UUID,
    role_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ur.id   AS role_id,
        ur.name AS role_name
    FROM user_role_mapping urm
    JOIN user_role ur
        ON ur.id = urm.role_id
    WHERE urm.user_id = p_user_id
      AND urm.is_active::int = 1
      AND ur.is_active::int = 1
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================================
-- Function Name : fn_log_migration
-- Purpose       : Inserts a migration record into migrate table
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_log_migration(
    p_table_name VARCHAR,
    p_description TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_migration_id UUID;
BEGIN
    INSERT INTO migrate (
        id,
        table_name,
        description,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        p_table_name,
        p_description,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_migration_id;

    RETURN v_migration_id;
END;
$$;

INSERT INTO public.user_status (id,name,description,is_active)
VALUES ('c9f1669f-ec39-4694-a268-3eead4ad9f13', 'active','active',true);


INSERT INTO public.user_role (id,name,description,is_active)
VALUES ('2b76a922-2d37-4572-8c0a-50f8e56788b0', 'user','user',true);

INSERT INTO public.user_role (id,name,description,is_active)
VALUES ('dda065c8-cb99-461b-86b6-572f4ccd9d21', 'admin','admin',true);

CREATE OR REPLACE FUNCTION public.sp_get_user_role_by_user_id(
	p_user_id uuid)
    RETURNS TABLE(role_id uuid, role_name character varying) 
    LANGUAGE 'plpgsql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000
 
AS $BODY$
 
BEGIN
    RETURN QUERY
    SELECT
        ur.id   AS role_id,
        ur.name AS role_name
    FROM user_role_mapping urm
    JOIN user_role ur
        ON ur.id = urm.role_id
    WHERE urm.user_id = p_user_id
      AND urm.is_active::int = 1
      AND ur.is_active::int = 1
    LIMIT 1;
END;
$BODY$;
 