import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRequest, mockResponse } from "../../utils/mocks/request.mock.js";
import { mockUserPayload } from "../../utils/mocks/auth.mock.js";

vi.mock("../../../src/modules/jobs/jobs.service.js", () => ({
  listJobs: vi.fn(),
  getJobById: vi.fn(),
  listFetchLogs: vi.fn(),
}));
vi.mock("../../../src/modules/tasks/tasks.service.js", () => ({
  enqueue: vi.fn(),
}));
vi.mock("../../../src/modules/jobs/jobs.schemas.js", () => ({
  listJobsSchema: { parse: vi.fn((q: any) => ({ page: 1, limit: 20, ...q })) },
}));

import * as jobsService from "../../../src/modules/jobs/jobs.service.js";
import * as tasksService from "../../../src/modules/tasks/tasks.service.js";
import { listJobs, getJob, triggerFetch, fetchLogs } from "../../../src/modules/jobs/jobs.controller.js";

describe("jobs.controller", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("listJobs returns 200 with paginated data", async () => {
    vi.mocked(jobsService.listJobs).mockResolvedValue({ items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    const req = mockRequest({ query: {} });
    const res = mockResponse();
    await listJobs(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getJob passes params.id", async () => {
    vi.mocked(jobsService.getJobById).mockResolvedValue({} as any);
    const req = mockRequest({ params: { id: "j-1" } } as any);
    const res = mockResponse();
    await getJob(req, res);
    expect(jobsService.getJobById).toHaveBeenCalledWith("j-1");
  });

  it("triggerFetch enqueues task and returns 202", async () => {
    vi.mocked(tasksService.enqueue).mockResolvedValue({ id: "task-1" } as any);
    const req = mockRequest({ body: { roles: ["dev"] } });
    const res = mockResponse();
    await triggerFetch(req, res);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(tasksService.enqueue).toHaveBeenCalledWith("job_fetch", { roles: ["dev"] });
  });

  it("fetchLogs returns 200", async () => {
    vi.mocked(jobsService.listFetchLogs).mockResolvedValue([]);
    const res = mockResponse();
    await fetchLogs(mockRequest(), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
