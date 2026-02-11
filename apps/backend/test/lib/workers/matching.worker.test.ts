import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/modules/matching/matching.service.js", () => ({
  runMatching: vi.fn(),
}));

import { runMatching } from "../../../src/modules/matching/matching.service.js";
import { matchingWorker } from "../../../src/lib/workers/matching.worker.js";

describe("matchingWorker", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls runMatching with userId and trigger", async () => {
    vi.mocked(runMatching).mockResolvedValue({ id: "batch-1" } as any);

    await matchingWorker({ userId: "user-1", trigger: "scheduled" });

    expect(runMatching).toHaveBeenCalledWith("user-1", "scheduled");
  });
});
