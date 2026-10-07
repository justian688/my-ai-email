import type { Brief } from ".";
import { connectDB } from "../db";
import { SentBriefModel } from "../models/sent-brief";
import { sendBriefEmail } from "./email";

type Sent = Awaited<ReturnType<typeof sendBriefEmail>>;

export type Delivery = Sent &
  ({ saved: true; recordId: string } | { saved: false; saveError: string });

// 寄信並存檔。寄信失敗會丟錯；信寄出後存檔失敗則回傳 saved: false
export async function deliverBrief(brief: Brief): Promise<Delivery> {
  const email = await sendBriefEmail(brief);

  try {
    await connectDB();
    const { errors, ...data } = brief;
    const record = await SentBriefModel.create({
      ...data,
      sourceErrors: errors,
      email: {
        resendId: email.id,
        from: email.from,
        to: email.to,
        subject: email.subject,
      },
    });
    return { ...email, saved: true, recordId: record.id };
  } catch (error) {
    return {
      ...email,
      saved: false,
      saveError: error instanceof Error ? error.message : String(error),
    };
  }
}
