import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRequest, mockResponse } from "../../utils/mocks/request.mock.js";
import { mockTask } from "../../utils/mocks/fixtures.js";

vi.mock("../../../src/modules/tasks/tasks.service.js", () => ({
  getTask: vi.fn(),
  listTasks: vi.fn(),
}));
vi.mock("../../../src/modules/tasks/tasks.schemas.js", () => ({
  listTasksSchema: { parse: vi.fn((q: any) => ({ page: 1, limit: 20, ...q })) },
}));

import * as service from "../../../src/modules/tasks/tasks.service.js";
import { getTask, listTasks } from "../../../src/modules/tasks/tasks.controller.js";

describe("tasks.controller", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("getTask passes params.id", async () => {
    vi.mocked(service.getTask).mockResolvedValue(mockTask as any);
    const req = mockRequest({ params: { id: "t-1" } } as any);
    const res = mockResponse();
    await getTask(req, res);
    expect(service.getTask).toHaveBeenCalledWith("t-1");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("listTasks returns 200", async () => {
    vi.mocked(service.listTasks).mockResolvedValue({ tasks: [], pagination: {} } as any);
    const req = mockRequest({ query: {} });
    const res = mockResponse();
    await listTasks(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
