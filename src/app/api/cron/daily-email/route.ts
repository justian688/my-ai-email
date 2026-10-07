import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { getBrief } from "@/lib/brief";
import { deliverBrief } from "@/lib/brief/deliver";

// 回應後的背景工作最多可以跑多久（秒），需部署平台支援
export const maxDuration = 60;

// 排程服務要帶 Authorization: Bearer <CRON_SECRET> 才能觸發
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 整個流程可能超過排程服務的逾時限制，所以先回應，實際工作在回應送出後才執行。
  // 排程服務因此看不到執行結果，成功或失敗只會寫在伺服器 log
  after(async () => {
    try {
      const delivery = await deliverBrief(await getBrief());
      if (delivery.saved) {
        console.log("[cron/daily-email] 已寄出並存檔", delivery);
      } else {
        console.error("[cron/daily-email] 已寄出但存檔失敗", delivery);
      }
    } catch (error) {
      console.error("[cron/daily-email] 寄信失敗", error);
    }
  });

  return Response.json({ accepted: true }, { status: 202 });
}
