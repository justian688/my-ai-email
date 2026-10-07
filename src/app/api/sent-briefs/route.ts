import { listSentBriefs } from "@/lib/brief/history";

export async function GET() {
  try {
    return Response.json({ items: await listSentBriefs() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
