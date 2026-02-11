import { sendEmail } from "../email.js";

interface EmailDeliveryPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[];
}

export async function emailDeliveryWorker(payload: unknown): Promise<unknown> {
  const { to, subject, html, attachments } = payload as EmailDeliveryPayload;
  await sendEmail({
    to,
    subject,
    html,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content, "base64"),
    })),
  });
  return { sent: true, to };
}
