-- Set a default admin user ID for existing projects without a user_id
-- Replace 'admin_user_id_here' with a real admin user ID from your system
UPDATE projects
SET user_id = 'user_2v9mejvWxaj6DUpLOQqYng7JeVx'
WHERE user_id IS NULL;

-- Add a not null constraint to the user_id column to ensure all future projects have owners
ALTER TABLE projects
ALTER COLUMN user_id SET NOT NULL;