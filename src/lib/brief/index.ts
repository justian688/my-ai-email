import { getNews, type News } from "./news";
import { summarize, type BriefSummary } from "./openai";
import { getStock, type Stock } from "./stock";
import { taipeiToday } from "./util";
import { getWeather, type Weather } from "./weather";

export type Brief = {
  date: string;
  summary: BriefSummary | null;
  weather: Weather | null;
  stock: Stock | null;
  news: News | null;
  errors: Record<string, string>;
};

export async function getBrief(): Promise<Brief> {
  const errors: Record<string, string> = {};

  // 失敗的項目回傳 null 並記錄原因，不影響其他項目
  const settle = <T>(key: string, promise: Promise<T>): Promise<T | null> =>
    promise.catch((reason) => {
      errors[key] = reason instanceof Error ? reason.message : String(reason);
      return null;
    });

  const [weather, stock, news] = await Promise.all([
    settle("weather", getWeather()),
    settle("stock", getStock()),
    settle("news", getNews()),
  ]);

  const date = taipeiToday();
  const summary = await settle(
    "summary",
    summarize({ date, weather, stock, news }),
  );

  return { date, summary, weather, stock, news, errors };
}
