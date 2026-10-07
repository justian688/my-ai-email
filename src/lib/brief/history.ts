import type { Brief } from ".";
import { connectDB } from "../db";
import { SentBriefModel } from "../models/sent-brief";

const MAX_RECORDS = 30;

export type SentRecord = {
  id: string;
  sentAt: string;
  email: { resendId: string; from: string; to: string; subject: string };
  brief: Brief;
};

// 寄信紀錄，最新的在最前面
export async function listSentBriefs(): Promise<SentRecord[]> {
  await connectDB();
  const docs = await SentBriefModel.find()
    .sort({ createdAt: -1 })
    .limit(MAX_RECORDS)
    .lean<
      (Omit<Brief, "errors"> & {
        _id: { toString(): string };
        createdAt: Date;
        email: SentRecord["email"];
        sourceErrors?: Record<string, string>;
      })[]
    >();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    sentAt: doc.createdAt.toISOString(),
    email: doc.email,
    brief: {
      date: doc.date,
      summary: doc.summary ?? null,
      weather: doc.weather ?? null,
      stock: doc.stock ?? null,
      news: doc.news ?? null,
      errors: doc.sourceErrors ?? {},
    },
  }));
}
