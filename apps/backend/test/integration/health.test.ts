import request from "supertest";
import { app } from "../../src/app.js";

describe("Health & unknown routes", () => {
  it("GET /health returns 200 with status ok", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /unknown returns 404", async () => {
    const res = await request(app).get("/does-not-exist");

    expect(res.status).toBe(404);
  });
});
