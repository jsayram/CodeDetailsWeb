import { permanentlyDeleteProject as permanentlyDeleteAction, restoreProject as restoreAction } from "@/app/actions/projects";

export async function permanentlyDeleteProject(projectId: string, userId: string) {
  try {
    return await permanentlyDeleteAction(projectId, userId);
  } catch (error) {
    console.error('Error in permanentlyDeleteProject:', error);
    throw error;
  }
}

export async function restoreProject(projectId: string, userId: string) {
  try {
    return await restoreAction(projectId, userId);
  } catch (error) {
    console.error('Error in restoreProject:', error);
    throw error;
  }
}