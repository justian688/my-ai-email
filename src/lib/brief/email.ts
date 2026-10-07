import type { Brief } from ".";

// Resend 預設寄件人；使用它時只能寄到 Resend 帳號本人的信箱
const FROM = "AI 每日簡報 <onboarding@resend.dev>";
const TO = "justian688@gmail.com";

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang TC','Microsoft JhengHei',Arial,sans-serif";

const escapeHtml = (value: unknown) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// 信件用 table 排版與 inline style，各家信箱才能正確顯示
function section(title: string, body: string): string {
  return `<tr><td style="padding:24px 32px;border-top:1px solid #e4e4e7;">
<p style="margin:0 0 12px;font-size:13px;color:#71717a;">${escapeHtml(title)}</p>
${body}
</td></tr>`;
}

const paragraph = (text: string) =>
  `<p style="margin:0;font-size:15px;line-height:1.7;color:#18181b;">${escapeHtml(text)}</p>`;

function stats(pairs: [string, string][]): string {
  const cells = pairs
    .map(
      ([label, value]) =>
        `<td style="padding:0 16px 12px 0;vertical-align:top;">
<span style="font-size:12px;color:#71717a;">${escapeHtml(label)}</span><br>
<span style="font-size:15px;font-weight:600;color:#18181b;">${escapeHtml(value)}</span>
</td>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 4px;"><tr>${cells}</tr></table>`;
}

const unavailable = (reason?: string) =>
  paragraph(`無法取得資料${reason ? `：${reason}` : ""}`);

export function renderEmail(brief: Brief) {
  const { summary, weather, stock, news, errors } = brief;
  const sections: string[] = [];

  if (summary) {
    sections.push(
      section(
        "給你的話",
        `<p style="margin:0;font-size:17px;line-height:1.8;color:#18181b;">${escapeHtml(summary.encouragement)}</p>`,
      ),
    );
  }

  sections.push(
    section(
      `今日天氣${weather ? `・${weather.location}` : ""}`,
      (weather
        ? stats([
            ["目前", `${weather.current.temperature}°C ${weather.current.condition}`],
            ["今日天氣", weather.condition],
            ["最高 / 最低", `${weather.temperatureMax}° / ${weather.temperatureMin}°`],
          ]) +
          stats([
            ["降雨機率", `${weather.precipitationProbability}%`],
            ["體感溫度", `${weather.current.apparentTemperature}°C`],
            ["濕度", `${weather.current.humidity}%`],
            ["風速", `${weather.current.windSpeed} km/h`],
          ])
        : unavailable(errors.weather)) +
        (summary ? paragraph(summary.weather) : ""),
    ),
  );

  // 台股慣例：漲紅跌綠
  const changeColor = !stock
    ? ""
    : stock.change > 0
      ? "#dc2626"
      : stock.change < 0
        ? "#16a34a"
        : "#52525b";
  sections.push(
    section(
      stock ? `${stock.name}（${stock.symbol}）・${stock.date}` : "台積電股價",
      (stock
        ? `<p style="margin:0 0 12px;font-size:28px;font-weight:700;color:#18181b;">${escapeHtml(stock.close.toLocaleString())}
<span style="font-size:15px;font-weight:600;color:${changeColor};">${stock.change > 0 ? "+" : ""}${escapeHtml(stock.change.toLocaleString())}</span></p>` +
          stats([
            ["開盤", stock.open.toLocaleString()],
            ["最高", stock.high.toLocaleString()],
            ["最低", stock.low.toLocaleString()],
            ["成交股數", stock.volume.toLocaleString()],
          ])
        : unavailable(errors.stock)) +
        (summary ? paragraph(summary.stock) : ""),
    ),
  );

  const highlights =
    summary && summary.news.length > 0
      ? `<p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#18181b;">AI 重點整理</p>
<ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.7;color:#18181b;">${summary.news
          .map((line) => `<li style="margin-bottom:6px;">${escapeHtml(line)}</li>`)
          .join("")}</ul>`
      : "";
  const articles = news
    ? news.items
        .map((item) => {
          // 只允許 http(s) 連結，避免 javascript: 之類的網址進到信件
          const title = /^https?:\/\//.test(item.link)
            ? `<a href="${escapeHtml(item.link)}" style="color:#1d4ed8;text-decoration:none;font-weight:600;">${escapeHtml(item.title)}</a>`
            : `<strong>${escapeHtml(item.title)}</strong>`;
          return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#18181b;">${title}${
            item.publishedAt
              ? `<br><span style="font-size:12px;color:#71717a;">${escapeHtml(formatTime(item.publishedAt))}</span>`
              : ""
          }${
            item.summary
              ? `<br><span style="font-size:14px;color:#52525b;">${escapeHtml(item.summary)}</span>`
              : ""
          }</p>`;
        })
        .join("")
    : unavailable(errors.news);
  sections.push(
    section(`科技新聞${news ? `・${news.source}` : ""}`, highlights + articles),
  );

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI 每日簡報</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;font-family:${FONT};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:12px;">
<tr><td style="padding:28px 32px;">
<h1 style="margin:0;font-size:22px;color:#18181b;">AI 每日簡報</h1>
<p style="margin:6px 0 0;font-size:13px;color:#71717a;">${escapeHtml(brief.date)}</p>
</td></tr>
${sections.join("\n")}
<tr><td style="padding:20px 32px;border-top:1px solid #e4e4e7;">
<p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;">資料來源：Open-Meteo、臺灣證券交易所${news ? `、${escapeHtml(news.source)}` : ""}。摘要與鼓勵話語由 AI 產生，內容請以原始資料為準。</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject: `AI 每日簡報 ${brief.date}`, html };
}

export async function sendBriefEmail(brief: Brief) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("找不到環境變數 RESEND_API_KEY");

  const { subject, html } = renderEmail(brief);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [TO], subject, html }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message ?? `Resend 回應 HTTP ${res.status}`);
  }
  return { id: data.id as string, from: FROM, to: TO, subject };
}
