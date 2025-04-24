import { getPendingTagSubmissions } from "@/app/actions/tag-submissions";
import { TagSubmissionManagement } from "@/components/administrator/TagSubmissionManagement";

export default async function TagSubmissionsPage() {
  const submissions = await getPendingTagSubmissions();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Tag Submissions</h1>
      <TagSubmissionManagement initialSubmissions={submissions} />
    </div>
  );
}