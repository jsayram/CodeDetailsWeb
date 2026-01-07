export interface Profile {
  id: string;
  user_id: string;
  username?: string;
  full_name?: string;
  profile_image_url?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}