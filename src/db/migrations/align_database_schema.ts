// Migration file to align database with schema definitions
import { sql } from "drizzle-orm";
import { executeQuery } from "../server";
import * as schema from "../schema";

/**
 * This function aligns the database structure with our Drizzle ORM schema definitions
 * It handles missing tables, columns, and data migration where needed
 */
export async function alignDatabaseWithSchema() {
  try {
    return await executeQuery(async (db) => {
      // Begin transaction for all schema changes
      return await db.transaction(async (tx) => {
        
        console.log('Starting database schema alignment...');
        
        // 1. Update tags table with missing columns
        console.log('Updating tags table...');
        await tx.execute(sql`
          ALTER TABLE tags 
          ADD COLUMN IF NOT EXISTS description TEXT,
          ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
        `);
        
        // 2. Update project_tags table
        console.log('Updating project_tags table...');
        
        // Check the primary key structure using Drizzle
        const pkCheck = await tx.execute(sql`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = 'project_tags' 
          AND constraint_type = 'PRIMARY KEY'
        `);
        
        // Check for required columns using Drizzle
        const hasIdColumn = await tx.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'project_tags' AND column_name = 'id'
        `);
        
        const hasTimestampColumn = await tx.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'project_tags' AND column_name = 'created_at'
        `);
        
        // If there's no id column, but there is a primary key constraint,
        // the primary key is likely on (project_id, tag_id)
        if (hasIdColumn.length === 0 && pkCheck.length > 0) {
          // Add the id column without making it a primary key
          console.log('Adding id column to project_tags without primary key constraint...');
          await tx.execute(sql`ALTER TABLE project_tags ADD COLUMN id UUID DEFAULT gen_random_uuid()`);
        } else if (hasIdColumn.length === 0 && pkCheck.length === 0) {
          // No PK at all, add id column as PK
          console.log('Adding id column as primary key to project_tags...');
          await tx.execute(sql`ALTER TABLE project_tags ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid()`);
        }
        
        // Add timestamp if missing
        if (hasTimestampColumn.length === 0) {
          console.log('Adding created_at timestamp to project_tags...');
          await tx.execute(sql`ALTER TABLE project_tags ADD COLUMN created_at TIMESTAMP DEFAULT NOW()`);
        }
        
        // 3. Create content_tags table if it doesn't exist
        console.log('Creating content_tags table...');
        await tx.execute(sql`
          CREATE TABLE IF NOT EXISTS content_tags (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            content_type VARCHAR(50) NOT NULL,
            content_id UUID NOT NULL,
            tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE RESTRICT,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(content_type, content_id, tag_id)
          )
        `);
        
        // 4. Create tutorials table if it doesn't exist
        console.log('Creating tutorials table...');
        await tx.execute(sql`
          CREATE TABLE IF NOT EXISTS tutorials (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT,
            title TEXT NOT NULL,
            slug VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            content TEXT,
            level VARCHAR(50) DEFAULT 'beginner',
            estimated_time VARCHAR(50),
            tier VARCHAR(50) NOT NULL DEFAULT 'free',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            published_at TIMESTAMP,
            deleted_at TIMESTAMP
          )
        `);
        
        // 5. Create tutorial_tags junction table if it doesn't exist
        console.log('Creating tutorial_tags table...');
        await tx.execute(sql`
          CREATE TABLE IF NOT EXISTS tutorial_tags (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
            tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE RESTRICT,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(tutorial_id, tag_id)
          )
        `);
        
        // 6. Create pages table if it doesn't exist
        console.log('Creating pages table...');
        await tx.execute(sql`
          CREATE TABLE IF NOT EXISTS pages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT,
            title TEXT NOT NULL,
            slug VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            content TEXT,
            is_published BOOLEAN DEFAULT FALSE,
            tier VARCHAR(50) NOT NULL DEFAULT 'free',
            seo_title TEXT,
            seo_description TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            published_at TIMESTAMP,
            deleted_at TIMESTAMP
          )
        `);
        
        // 7. Create page_tags junction table if it doesn't exist
        console.log('Creating page_tags table...');
        await tx.execute(sql`
          CREATE TABLE IF NOT EXISTS page_tags (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
            tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE RESTRICT,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(page_id, tag_id)
          )
        `);
        
        // 8. Create snippets table if it doesn't exist
        console.log('Creating snippets table...');
        await tx.execute(sql`
          CREATE TABLE IF NOT EXISTS snippets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT,
            title TEXT NOT NULL,
            description TEXT,
            code TEXT NOT NULL,
            language VARCHAR(50),
            tier VARCHAR(50) NOT NULL DEFAULT 'free',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            deleted_at TIMESTAMP
          )
        `);
        
        // 9. Create snippet_tags junction table if it doesn't exist
        console.log('Creating snippet_tags table...');
        await tx.execute(sql`
          CREATE TABLE IF NOT EXISTS snippet_tags (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            snippet_id UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
            tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE RESTRICT,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(snippet_id, tag_id)
          )
        `);
        
        // 10. Create tag_submissions table if it doesn't exist
        console.log('Creating tag_submissions table...');
        await tx.execute(sql`
          CREATE TABLE IF NOT EXISTS tag_submissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            tag_name TEXT NOT NULL,
            submitter_email TEXT NOT NULL,
            description TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            admin_notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            reviewed_at TIMESTAMP
          )
        `);
        
        // 11. Update profiles table to align with schema
        console.log('Updating profiles table...');
        // Check for profile_image_url column
        const hasAvatarColumn = await tx.execute(sql`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'profiles' AND column_name = 'profile_image_url'
        `);
        
        if (hasAvatarColumn.length === 0) {
          await tx.execute(sql`
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
            ADD COLUMN IF NOT EXISTS email TEXT
          `);
          
          // Migrate email_address data to email column
          await tx.execute(sql`
            UPDATE profiles
            SET email = email_address
            WHERE email_address IS NOT NULL AND email IS NULL
          `);
        }
        
        // 12. Migrate data from projects.tags array to project_tags junction table
        console.log('Migrating project tags from array to junction table...');
        // First check if the tags column exists
        const hasTagsColumn = await tx.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'projects' AND column_name = 'tags'
        `);

        if (hasTagsColumn.length > 0) {
          // Only attempt migration if tags column exists
          await tx.execute(sql`
            DO $$
            DECLARE
              project_record RECORD;
              tag_name TEXT;
              tag_id_var UUID;
            BEGIN
              -- For each project with non-empty tags
              FOR project_record IN SELECT id, tags FROM projects WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
              LOOP
                -- For each tag in the project's tags array
                FOREACH tag_name IN ARRAY project_record.tags
                LOOP
                  -- Check if the tag exists, if not create it
                  SELECT id INTO tag_id_var FROM tags WHERE name = tag_name;
                  IF tag_id_var IS NULL THEN
                    INSERT INTO tags (name) VALUES (tag_name) RETURNING id INTO tag_id_var;
                  END IF;
                  
                  -- Associate the project with the tag if not already associated
                  IF NOT EXISTS (SELECT 1 FROM project_tags WHERE project_id = project_record.id AND tag_id = tag_id_var) THEN
                    INSERT INTO project_tags (project_id, tag_id) VALUES (project_record.id, tag_id_var);
                  END IF;
                END LOOP;
              END LOOP;
            END $$;
          `);
        } else {
          console.log('Tags column does not exist in projects table - skipping migration');
        }
        
        return { success: true, message: 'Database schema alignment successful' };
      });
    });
  } catch (error) {
    console.error('Error aligning database schema:', error);
    return { success: false, message: `Database schema alignment failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// Allow running this file directly with Node.js
if (require.main === module) {
  alignDatabaseWithSchema()
    .then((result) => {
      if (result.success) {
        console.log('✅', result.message);
        process.exit(0);
      } else {
        console.error('❌', result.message);
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Fatal error during database alignment:', err);
      process.exit(1);
    });
}