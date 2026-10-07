import mongoose from "mongoose";

// dev 的 hot reload 會重新載入模組，把連線存在 globalThis 才不會重複連線
const cache = globalThis as typeof globalThis & {
  mongoosePromise?: Promise<typeof mongoose>;
};

export function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("找不到環境變數 MONGODB_URI");

  cache.mongoosePromise ??= mongoose
    .connect(uri, { serverSelectionTimeoutMS: 10_000 })
    .catch((error) => {
      // 連線失敗時清掉快取，下次呼叫才會重試
      cache.mongoosePromise = undefined;
      throw error;
    });
  return cache.mongoosePromise;
}
