-- ============================================================================
-- Table Name    : migrate
-- Purpose       : Stores database migration history
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sql_migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  executed_at TIMESTAMP NOT NULL DEFAULT NOW()
);



-- ============================================================================
-- Table: user_status
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(30) NOT NULL,
    description VARCHAR(30),

    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- Table: city
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.city (
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
CREATE TABLE IF NOT EXISTS public."user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    firstname VARCHAR(50),
    lastname VARCHAR(50),

    username VARCHAR(50) UNIQUE ,
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
CREATE TABLE IF NOT EXISTS public.user_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(30) NOT NULL,
    description VARCHAR(30),

    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- Table: user_role_mapping
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_role_mapping (
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
CREATE TABLE IF NOT EXISTS public.error_log (
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
CREATE TABLE IF NOT EXISTS public.api_rate_limit (
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
CREATE TABLE IF NOT EXISTS public.user_login_log (
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
CREATE TABLE IF NOT EXISTS public.report_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: conversation_type
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversation_type (
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
CREATE TABLE IF NOT EXISTS public.conversation (
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
CREATE TABLE IF NOT EXISTS public.message_content_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: message
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.message (
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
CREATE TABLE IF NOT EXISTS public.conversation_member (
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
CREATE TABLE IF NOT EXISTS public.user_report (
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
CREATE TABLE IF NOT EXISTS public.post (
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
CREATE TABLE IF NOT EXISTS public.post_report (
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
CREATE TABLE IF NOT EXISTS public.post_reaction_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: post_reaction
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.post_reaction (
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
CREATE TABLE IF NOT EXISTS public.assets_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: post_assets
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.post_assets (
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
CREATE TABLE IF NOT EXISTS public.post_comment (
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
CREATE TABLE IF NOT EXISTS public.post_comment_report (
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
CREATE TABLE IF NOT EXISTS public.currency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30)
);

-- ============================================================================
-- Table: proposal_status
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proposal_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: proposal_category
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proposal_category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: proposal
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proposal (
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
CREATE TABLE IF NOT EXISTS public.proposal_participant_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: proposal_participant
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proposal_participant (
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
CREATE TABLE IF NOT EXISTS public.marketplace_category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: marketplace_status
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.marketplace_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30),
    description VARCHAR(30),
    is_active BIT
);

-- ============================================================================
-- Table: marketplace
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.marketplace (
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
CREATE TABLE IF NOT EXISTS public.marketplace_assets (
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
CREATE TABLE IF NOT EXISTS public.marketplace_report (
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
CREATE TABLE IF NOT EXISTS public.follower (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES "user"(id), -- user who follows
    followed_id UUID REFERENCES "user"(id), -- user being followed
    created_at TIMESTAMP DEFAULT NOW()
);

