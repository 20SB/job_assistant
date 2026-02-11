import * as matchingService from "../../modules/matching/matching.service.js";

interface MatchingPayload {
  userId: string;
  trigger: "new_job" | "cv_updated" | "preferences_updated" | "scheduled";
}

export async function matchingWorker(payload: unknown): Promise<unknown> {
  const { userId, trigger } = payload as MatchingPayload;
  return matchingService.runMatching(userId, trigger);
}
