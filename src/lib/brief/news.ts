import { fetchWithTimeout } from "./util";

const FEED = { source: "TechNews 科技新報", url: "https://technews.tw/feed/" };
const MAX_ITEMS = 8;

export type NewsItem = {
  title: string;
  link: string;
  publishedAt: string;
  summary: string;
};

export type News = { source: string; items: NewsItem[] };

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name] ?? match);
}

// 取出 <tag>…</tag> 的純文字，處理 CDATA、HTML 標籤與 entity
function readTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  if (!match) return "";
  const raw = match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  return decodeEntities(decodeEntities(raw).replace(/<[^>]+>/g, "")).trim();
}

export async function getNews(): Promise<News> {
  const res = await fetchWithTimeout(FEED.url, {
    headers: { "User-Agent": "Mozilla/5.0 (my-ai-email)" },
  });
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .slice(0, MAX_ITEMS)
    .map(([, item]) => {
      const pubDate = new Date(readTag(item, "pubDate"));
      return {
        title: readTag(item, "title"),
        link: readTag(item, "link"),
        publishedAt: isNaN(pubDate.getTime()) ? "" : pubDate.toISOString(),
        summary: readTag(item, "description"),
      };
    });

  if (items.length === 0) throw new Error("RSS 沒有解析到任何新聞");
  return { source: FEED.source, items };
}
