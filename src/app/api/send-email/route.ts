import { getBrief, type Brief } from "@/lib/brief";
import { deliverBrief } from "@/lib/brief/deliver";

export async function POST(request: Request) {
  // 前端會把畫面上的簡報帶過來，寄出的內容才會和看到的一致；沒帶就重新產生
  const body = (await request.json().catch(() => null)) as Brief | null;

  try {
    const brief = body?.date ? body : await getBrief();
    return Response.json(await deliverBrief(brief));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
