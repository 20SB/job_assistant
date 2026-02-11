import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/modules/jobs/jobs.service.js", () => ({
  triggerFetch: vi.fn(),
}));

import { triggerFetch } from "../../../src/modules/jobs/jobs.service.js";
import { jobFetchWorker } from "../../../src/lib/workers/job-fetch.worker.js";

describe("jobFetchWorker", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls triggerFetch with payload params", async () => {
    vi.mocked(triggerFetch).mockResolvedValue({ id: "log-1" } as any);

    await jobFetchWorker({ roles: ["developer"], locations: ["London"], maxPages: 2 });

    expect(triggerFetch).toHaveBeenCalledWith({
      roles: ["developer"],
      locations: ["London"],
      maxPages: 2,
    });
  });

  it("defaults maxPages to 1 when not provided", async () => {
    vi.mocked(triggerFetch).mockResolvedValue({ id: "log-1" } as any);

    await jobFetchWorker({ roles: ["dev"] });

    expect(triggerFetch).toHaveBeenCalledWith(
      expect.objectContaining({ maxPages: 1 }),
    );
  });
});
