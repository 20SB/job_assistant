import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/lib/email.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import { sendEmail } from "../../../src/lib/email.js";
import { emailDeliveryWorker } from "../../../src/lib/workers/email-delivery.worker.js";

describe("emailDeliveryWorker", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls sendEmail with payload", async () => {
    const result = await emailDeliveryWorker({
      to: "user@example.com",
      subject: "Hello",
      html: "<p>Hi</p>",
    });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "Hello",
        html: "<p>Hi</p>",
      }),
    );
    expect(result).toEqual({ sent: true, to: "user@example.com" });
  });

  it("handles base64 attachments", async () => {
    await emailDeliveryWorker({
      to: "user@example.com",
      subject: "Report",
      html: "<p>See attached</p>",
      attachments: [{ filename: "report.csv", content: Buffer.from("data").toString("base64") }],
    });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          expect.objectContaining({ filename: "report.csv" }),
        ],
      }),
    );
  });
});
