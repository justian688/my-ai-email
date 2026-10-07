import type { News } from "./news";
import type { Stock } from "./stock";
import { fetchWithTimeout } from "./util";
import type { Weather } from "./weather";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export type BriefInput = {
  date: string;
  weather: Weather | null;
  stock: Stock | null;
  news: News | null;
};

export type BriefSummary = {
  weather: string;
  stock: string;
  news: string[];
  encouragement: string;
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["weather", "stock", "news", "encouragement"],
  properties: {
    weather: { type: "string", description: "今日天氣重點與穿著、帶傘建議" },
    stock: { type: "string", description: "台積電前一交易日股價表現" },
    news: {
      type: "array",
      description: "3 到 5 則最值得關注的科技新聞，每則一句話",
      items: { type: "string" },
    },
    encouragement: { type: "string", description: "給使用者的鼓勵話語" },
  },
};

const SYSTEM_PROMPT = `你是使用者的每日晨間助理，請用繁體中文（台灣用語）撰寫今日簡報。
只能根據使用者提供的 JSON 資料撰寫，不要捏造數字或新聞；某項資料為 null 時，請在該欄位說明今天無法取得。
news 每則請用自己的話濃縮成一句完整的話，不要照抄被截斷的摘要，也不要保留「[…]」。
人名、公司名等專有名詞必須沿用原文寫法，不可自行翻譯或音譯。
encouragement 請寫 2 到 3 句溫暖、具體、不流於空泛的鼓勵話語，可以自然呼應今天的天氣或新聞。`;

export async function summarize(input: BriefInput): Promise<BriefSummary> {
  // .env.local 裡 OpenAI 金鑰的變數名稱是 GPT
  const apiKey = process.env.GPT;
  if (!apiKey) throw new Error("找不到環境變數 GPT（OpenAI API key）");

  const res = await fetchWithTimeout(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(input) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "daily_brief", strict: true, schema: SCHEMA },
        },
      }),
    },
    60_000,
  );
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI 沒有回傳內容");
  return JSON.parse(content) as BriefSummary;
}
