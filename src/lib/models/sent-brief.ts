import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// 每寄出一封信就存一筆：信件資訊加上當時寄出的完整簡報
const sentBriefSchema = new Schema(
  {
    date: { type: String, required: true, index: true },
    email: {
      resendId: { type: String, required: true },
      from: { type: String, required: true },
      to: { type: String, required: true },
      subject: { type: String, required: true },
    },
    summary: {
      weather: String,
      stock: String,
      news: [String],
      encouragement: String,
    },
    weather: Schema.Types.Mixed,
    stock: Schema.Types.Mixed,
    news: Schema.Types.Mixed,
    // `errors` 是 Mongoose 的保留欄位名稱，所以改叫 sourceErrors
    sourceErrors: Schema.Types.Mixed,
  },
  { timestamps: true },
);

export type SentBrief = InferSchemaType<typeof sentBriefSchema>;

// hot reload 時 model 可能已經註冊過，重複註冊會丟錯
export const SentBriefModel: Model<SentBrief> =
  mongoose.models.SentBrief ?? mongoose.model("SentBrief", sentBriefSchema);
