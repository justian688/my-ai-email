import { fetchWithTimeout, taipeiToday } from "./util";

const STOCK = { symbol: "2330", name: "台積電" };

export type Stock = {
  symbol: string;
  name: string;
  // 今天之前最近的一個交易日（昨天若休市則往前找）
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  volume: number;
};

type Row = string[];

const toNumber = (value: string) => Number(value.replace(/[^\d.+-]/g, ""));

// 民國日期 115/10/07 -> 2026-10-07
function rocToIso(roc: string): string {
  const [year, month, day] = roc.trim().split("/");
  return `${Number(year) + 1911}-${month}-${day}`;
}

// 證交所個股日成交資訊，一次回傳 yyyymm 當月所有交易日
async function fetchMonth(yyyymm: string): Promise<Row[]> {
  const res = await fetchWithTimeout(
    `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${yyyymm}01&stockNo=${STOCK.symbol}`,
  );
  const data = await res.json();
  return data.stat === "OK" ? (data.data as Row[]) : [];
}

export async function getStock(): Promise<Stock> {
  const today = taipeiToday();
  const [year, month] = today.split("-").map(Number);
  const previous = new Date(Date.UTC(year, month - 2, 1));
  const months = [
    `${year}${String(month).padStart(2, "0")}`,
    `${previous.getUTCFullYear()}${String(previous.getUTCMonth() + 1).padStart(2, "0")}`,
  ];

  // 月初時當月可能還沒有今天以前的交易日，改查上個月
  for (const yyyymm of months) {
    const rows = await fetchMonth(yyyymm);
    const row = rows.filter((r) => rocToIso(r[0]) < today).at(-1);
    if (row) {
      return {
        ...STOCK,
        date: rocToIso(row[0]),
        volume: toNumber(row[1]),
        open: toNumber(row[3]),
        high: toNumber(row[4]),
        low: toNumber(row[5]),
        close: toNumber(row[6]),
        change: toNumber(row[7]),
      };
    }
  }
  throw new Error("證交所查無近期的成交資料");
}
