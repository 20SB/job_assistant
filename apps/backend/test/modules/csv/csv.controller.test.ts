import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRequest, mockResponse } from "../../utils/mocks/request.mock.js";
import { mockUserPayload } from "../../utils/mocks/auth.mock.js";
import { mockCsvExport } from "../../utils/mocks/fixtures.js";

vi.mock("../../../src/modules/csv/csv.service.js", () => ({
  downloadCsv: vi.fn(),
  listExports: vi.fn(),
  archiveExport: vi.fn(),
}));
vi.mock("../../../src/modules/tasks/tasks.service.js", () => ({
  enqueue: vi.fn(),
}));
vi.mock("../../../src/modules/csv/csv.schemas.js", () => ({
  listExportsSchema: { parse: vi.fn((q: any) => ({ page: 1, limit: 20, ...q })) },
}));

import * as csvService from "../../../src/modules/csv/csv.service.js";
import * as tasksService from "../../../src/modules/tasks/tasks.service.js";
import { generate, download, listExports, archive } from "../../../src/modules/csv/csv.controller.js";

describe("csv.controller", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("generate enqueues task and returns 202", async () => {
    vi.mocked(tasksService.enqueue).mockResolvedValue({ id: "t-1" } as any);
    const req = mockRequest({ user: mockUserPayload, body: { batchId: "b-1", sendEmail: false } } as any);
    const res = mockResponse();
    await generate(req, res);
    expect(res.status).toHaveBeenCalledWith(202);
  });

  it("download sends buffer with correct headers", async () => {
    const buf = Buffer.from("csv,data\n");
    vi.mocked(csvService.downloadCsv).mockResolvedValue({ fileName: "test.csv", buffer: buf });
    const req = mockRequest({ user: mockUserPayload, params: { id: "e-1" } } as any);
    const res = mockResponse();
    await download(req, res);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv");
    expect(res.send).toHaveBeenCalledWith(buf);
  });

  it("listExports returns 200", async () => {
    vi.mocked(csvService.listExports).mockResolvedValue({ items: [], pagination: {} } as any);
    const req = mockRequest({ user: mockUserPayload, query: {} } as any);
    const res = mockResponse();
    await listExports(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("archive returns 200", async () => {
    vi.mocked(csvService.archiveExport).mockResolvedValue(mockCsvExport as any);
    const req = mockRequest({ user: mockUserPayload, params: { id: "e-1" } } as any);
    const res = mockResponse();
    await archive(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
