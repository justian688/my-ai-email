"use client";

import { useEffect, useState } from "react";
import type { Brief } from "@/lib/brief";
import type { SentRecord } from "@/lib/brief/history";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; records: SentRecord[] };

type MailState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent"; to: string; saveError?: string }
  | { status: "error"; message: string };

const ERROR_LABELS: Record<string, string> = {
  weather: "天氣",
  stock: "股價",
  news: "科技新聞",
  summary: "AI 統整",
};

// 從資料庫讀取寄信紀錄
async function loadRecords(): Promise<State> {
  try {
    const res = await fetch("/api/sent-briefs", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) return { status: "error", message: data.error };
    return { status: "ready", records: data.items as SentRecord[] };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

// 不帶內容，由伺服器產生最新的簡報後寄出並存檔
async function sendEmail(): Promise<MailState> {
  try {
    const res = await fetch("/api/send-email", { method: "POST" });
    const data = await res.json();
    if (!res.ok) return { status: "error", message: data.error };
    return { status: "sent", to: data.to, saveError: data.saveError };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

const formatTime =(iso: string) =>
  new Date(iso).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
      <h2 className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function Unavailable({ reason }: { reason?: string }) {
  return (
    <p className="text-sm text-zinc-500 dark:text-zinc-400">
      無法取得資料{reason ? `：${reason}` : ""}
    </p>
  );
}

function WeatherCard({ brief }: { brief: Brief }) {
  const { weather, summary } = brief;
  return (
    <Card title={`今日天氣${weather ? `・${weather.location}` : ""}`}>
      {weather ? (
        <>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-semibold tabular-nums">
              {weather.current.temperature}°C
            </span>
            <span className="text-zinc-600 dark:text-zinc-300">
              目前{weather.current.condition}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="今日天氣" value={weather.condition} />
            <Stat
              label="最高 / 最低"
              value={`${weather.temperatureMax}° / ${weather.temperatureMin}°`}
            />
            <Stat
              label="降雨機率"
              value={`${weather.precipitationProbability}%`}
            />
            <Stat
              label="體感溫度"
              value={`${weather.current.apparentTemperature}°C`}
            />
            <Stat label="濕度" value={`${weather.current.humidity}%`} />
            <Stat label="風速" value={`${weather.current.windSpeed} km/h`} />
          </dl>
        </>
      ) : (
        <Unavailable reason={brief.errors.weather} />
      )}
      {summary && (
        <p className="mt-4 border-t border-black/[.08] pt-4 leading-7 dark:border-white/[.145]">
          {summary.weather}
        </p>
      )}
    </Card>
  );
}

function StockCard({ brief }: { brief: Brief }) {
  const { stock, summary } = brief;
  // 台股慣例：漲紅跌綠
  const changeColor = !stock
    ? ""
    : stock.change > 0
      ? "text-red-600 dark:text-red-400"
      : stock.change < 0
        ? "text-green-600 dark:text-green-400"
        : "text-zinc-600 dark:text-zinc-300";
  return (
    <Card
      title={
        stock ? `${stock.name}（${stock.symbol}）・${stock.date}` : "台積電股價"
      }
    >
      {stock ? (
        <>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-semibold tabular-nums">
              {stock.close.toLocaleString()}
            </span>
            <span className={`font-medium tabular-nums ${changeColor}`}>
              {stock.change > 0 ? "+" : ""}
              {stock.change.toLocaleString()}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="開盤" value={stock.open.toLocaleString()} />
            <Stat label="最高" value={stock.high.toLocaleString()} />
            <Stat label="最低" value={stock.low.toLocaleString()} />
            <Stat
              label="成交股數"
              value={stock.volume.toLocaleString()}
            />
          </dl>
        </>
      ) : (
        <Unavailable reason={brief.errors.stock} />
      )}
      {summary && (
        <p className="mt-4 border-t border-black/[.08] pt-4 leading-7 dark:border-white/[.145]">
          {summary.stock}
        </p>
      )}
    </Card>
  );
}

function NewsCard({ brief }: { brief: Brief }) {
  const { news, summary } = brief;
  return (
    <Card title={`科技新聞${news ? `・${news.source}` : ""}`}>
      {summary && summary.news.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 font-medium">AI 重點整理</h3>
          <ul className="list-disc space-y-2 pl-5 leading-7">
            {summary.news.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
      {news ? (
        <ul className="divide-y divide-black/[.08] dark:divide-white/[.145]">
          {news.items.map((item) => (
            <li key={item.link} className="py-4 first:pt-0 last:pb-0">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {item.title}
              </a>
              {item.publishedAt && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatTime(item.publishedAt)}
                </p>
              )}
              {item.summary && (
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {item.summary}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Unavailable reason={brief.errors.news} />
      )}
    </Card>
  );
}

export default function DailyBrief() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mail, setMail] = useState<MailState>({ status: "idle" });

  useEffect(() => {
    let ignore = false;
    loadRecords().then((next) => {
      if (!ignore) setState(next);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const reload = () => {
    setState({ status: "loading" });
    setMail({ status: "idle" });
    loadRecords().then(setState);
  };

  // 寄完後重新讀取紀錄，並切回最新的一筆
  const send = async () => {
    setMail({ status: "sending" });
    const result = await sendEmail();
    setMail(result);
    if (result.status === "sent") {
      setSelectedId(null);
      setState(await loadRecords());
    }
  };

  const records = state.status === "ready" ? state.records : [];
  const selected = records.find((r) => r.id === selectedId) ?? records[0];
  const brief = selected?.brief;
  const errors = brief ? Object.entries(brief.errors) : [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6 sm:py-16">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI 每日簡報</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            寄信紀錄
            {state.status === "ready" && `・共 ${records.length} 筆`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={reload}
            disabled={state.status === "loading"}
            className="h-10 rounded-full border border-black/[.08] px-4 text-sm font-medium transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-white/[.08]"
          >
            重新整理
          </button>
          <button
            type="button"
            onClick={send}
            disabled={mail.status === "sending"}
            className="h-10 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {mail.status === "sending" ? "寄送中…" : "立即寄一封"}
          </button>
        </div>
      </header>

      {mail.status === "sending" && (
        <p
          role="status"
          className="rounded-2xl border border-black/[.08] px-6 py-4 text-sm text-zinc-600 dark:border-white/[.145] dark:text-zinc-300"
        >
          正在產生今天的簡報並寄出，大約需要 10 秒…
        </p>
      )}
      {mail.status === "sent" && (
        <p
          role="status"
          className="rounded-2xl border border-green-600/30 bg-green-600/10 px-6 py-4 text-sm text-green-800 dark:text-green-300"
        >
          已寄出到 {mail.to}
          {!mail.saveError && "，並已存到資料庫"}
        </p>
      )}
      {mail.status === "sent" && mail.saveError && (
        <p
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-700 dark:text-red-300"
        >
          信已寄出，但存到資料庫失敗：{mail.saveError}
        </p>
      )}
      {mail.status === "error" && (
        <p
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-700 dark:text-red-300"
        >
          寄信失敗：{mail.message}
        </p>
      )}

      {state.status === "loading" && (
        <p className="py-16 text-center text-zinc-500 dark:text-zinc-400">
          正在讀取寄信紀錄…
        </p>
      )}

      {state.status === "error" && (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-700 dark:text-red-300">
          載入失敗：{state.message}
        </p>
      )}

      {state.status === "ready" && records.length === 0 && (
        <p className="py-16 text-center text-zinc-500 dark:text-zinc-400">
          還沒有寄信紀錄，按「立即寄一封」試試看。
        </p>
      )}

      {selected && brief && (
        <>
          <nav aria-label="寄信紀錄" className="flex flex-wrap gap-2">
            {records.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => setSelectedId(record.id)}
                aria-pressed={record.id === selected.id}
                className={`h-9 rounded-full border px-3 text-sm tabular-nums transition-colors ${
                  record.id === selected.id
                    ? "border-transparent bg-foreground text-background"
                    : "border-black/[.08] hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.08]"
                }`}
              >
                {formatTime(record.sentAt)}
              </button>
            ))}
          </nav>

          <Card title="信件資訊">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Stat label="寄出時間" value={formatTime(selected.sentAt)} />
              <Stat label="簡報日期" value={brief.date} />
              <Stat label="主旨" value={selected.email.subject} />
              <Stat label="收件人" value={selected.email.to} />
              <Stat label="寄件人" value={selected.email.from} />
              <Stat label="Resend ID" value={selected.email.resendId} />
            </dl>
          </Card>

          {errors.length > 0 && (
            <ul className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-300">
              {errors.map(([key, reason]) => (
                <li key={key}>
                  {ERROR_LABELS[key] ?? key}：{reason}
                </li>
              ))}
            </ul>
          )}
          {brief.summary && (
            <Card title="給你的話">
              <p className="text-lg leading-8">{brief.summary.encouragement}</p>
            </Card>
          )}
          <WeatherCard brief={brief} />
          <StockCard brief={brief} />
          <NewsCard brief={brief} />
        </>
      )}
    </main>
  );
}
