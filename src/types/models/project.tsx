// definition of the Project interface
// This interface will be used to define the shape of the project data that we fetch from the database.
// This will help us catch any errors in the data structure before runtime.
export interface Project {
  isFavorite: any;
  id: string;
  title: string;
  slug: string;
  tags: string[];
  description: string;
  tier: string;
  difficulty: string;
  created_at: string;
}
