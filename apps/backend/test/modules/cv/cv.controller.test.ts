import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRequest, mockResponse } from "../../utils/mocks/request.mock.js";
import { mockUserPayload } from "../../utils/mocks/auth.mock.js";
import { mockCvSnapshot } from "../../utils/mocks/fixtures.js";

vi.mock("../../../src/modules/cv/cv.service.js", () => ({
  createCv: vi.fn(),
  getActiveCv: vi.fn(),
  getCvById: vi.fn(),
  listCvVersions: vi.fn(),
  updateCv: vi.fn(),
  deleteCv: vi.fn(),
}));

import * as cvService from "../../../src/modules/cv/cv.service.js";
import { create, getActive, getById, listVersions, update, remove } from "../../../src/modules/cv/cv.controller.js";

describe("cv.controller", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("create returns 201", async () => {
    vi.mocked(cvService.createCv).mockResolvedValue(mockCvSnapshot as any);
    const req = mockRequest({ user: mockUserPayload, body: { rawCvText: "cv" } } as any);
    const res = mockResponse();
    await create(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("getActive returns 200", async () => {
    vi.mocked(cvService.getActiveCv).mockResolvedValue(mockCvSnapshot as any);
    const req = mockRequest({ user: mockUserPayload } as any);
    const res = mockResponse();
    await getActive(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getById passes params.id", async () => {
    vi.mocked(cvService.getCvById).mockResolvedValue(mockCvSnapshot as any);
    const req = mockRequest({ user: mockUserPayload, params: { id: "cv-1" } } as any);
    const res = mockResponse();
    await getById(req, res);
    expect(cvService.getCvById).toHaveBeenCalledWith(mockUserPayload.userId, "cv-1");
  });

  it("listVersions returns 200", async () => {
    vi.mocked(cvService.listCvVersions).mockResolvedValue([]);
    const req = mockRequest({ user: mockUserPayload } as any);
    const res = mockResponse();
    await listVersions(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("update returns 200", async () => {
    vi.mocked(cvService.updateCv).mockResolvedValue(mockCvSnapshot as any);
    const req = mockRequest({ user: mockUserPayload, body: {} } as any);
    const res = mockResponse();
    await update(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("remove calls deleteCv with correct params", async () => {
    vi.mocked(cvService.deleteCv).mockResolvedValue({ message: "deleted" });
    const req = mockRequest({ user: mockUserPayload, params: { id: "cv-1" } } as any);
    const res = mockResponse();
    await remove(req, res);
    expect(cvService.deleteCv).toHaveBeenCalledWith(mockUserPayload.userId, "cv-1");
  });
});
