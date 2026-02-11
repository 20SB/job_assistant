import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/modules/csv/csv.service.js", () => ({
  generateCsv: vi.fn(),
}));

import { generateCsv } from "../../../src/modules/csv/csv.service.js";
import { csvGenerationWorker } from "../../../src/lib/workers/csv-generation.worker.js";

describe("csvGenerationWorker", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls generateCsv with payload params", async () => {
    vi.mocked(generateCsv).mockResolvedValue({ id: "export-1" } as any);

    await csvGenerationWorker({ userId: "user-1", batchId: "batch-1", sendEmail: true });

    expect(generateCsv).toHaveBeenCalledWith("user-1", "batch-1", true);
  });
});
