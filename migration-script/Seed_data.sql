--Entry into Subtables
INSERT INTO public.user_status (id,name,description,is_active)
VALUES ('c9f1669f-ec39-4694-a268-3eead4ad9f13', 'active','active',true);


INSERT INTO public.user_role (id,name,description,is_active)
VALUES ('2b76a922-2d37-4572-8c0a-50f8e56788b0', 'user','user',true);

INSERT INTO public.user_role (id,name,description,is_active)
VALUES ('dda065c8-cb99-461b-86b6-572f4ccd9d21', 'admin','admin',true);



-- Messaging Schema
-- Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Populate conversation types if not exists
INSERT INTO conversation_type (id, name, description, is_active)
SELECT uuid_generate_v4(), 'individual', 'Direct 1-on-1 chat', '1'::bit
WHERE NOT EXISTS (SELECT 1 FROM conversation_type WHERE name = 'individual');

INSERT INTO conversation_type (id, name, description, is_active)
SELECT uuid_generate_v4(), 'group', 'Group chat', '1'::bit
WHERE NOT EXISTS (SELECT 1 FROM conversation_type WHERE name = 'group');



--Messaging Logic

INSERT INTO message_content_type (id, name, description, is_active)
SELECT uuid_generate_v4(), 'text', 'Plain text message', '1'::bit
WHERE NOT EXISTS (SELECT 1 FROM message_content_type WHERE name = 'text');

INSERT INTO message_content_type (id, name, description, is_active)
SELECT uuid_generate_v4(), 'image', 'Image attachment', '1'::bit
WHERE NOT EXISTS (SELECT 1 FROM message_content_type WHERE name = 'image');



-- Add socket tracking fields to user table
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS socket_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS socket_connected_at TIMESTAMP;

-- Create index for faster socket lookups
CREATE INDEX IF NOT EXISTS idx_user_socket_id ON "user"(socket_id) WHERE socket_id IS NOT NULL;

