import { getPendingTagSubmissions } from "@/app/actions/tag-submissions";
import { TagSubmissionManagement } from "@/components/administrator/TagSubmissionManagement";

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic';

export default async function TagSubmissionsPage() {
  const submissions = await getPendingTagSubmissions();

  return (
    <div className="w-full px-4 2xl:px-8 3xl:px-12 py-8">
      <h1 className="text-3xl font-bold mb-6">Tag Submissions</h1>
      <TagSubmissionManagement initialSubmissions={submissions} />
    </div>
  );
}