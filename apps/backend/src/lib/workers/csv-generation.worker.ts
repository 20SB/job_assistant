import * as csvService from "../../modules/csv/csv.service.js";

interface CsvGenerationPayload {
  userId: string;
  batchId: string;
  sendEmail: boolean;
}

export async function csvGenerationWorker(payload: unknown): Promise<unknown> {
  const { userId, batchId, sendEmail } = payload as CsvGenerationPayload;
  return csvService.generateCsv(userId, batchId, sendEmail);
}
