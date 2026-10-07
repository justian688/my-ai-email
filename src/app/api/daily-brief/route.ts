import { getBrief } from "@/lib/brief";

export async function GET() {
  const brief = await getBrief();
  return Response.json(brief, { status: brief.summary ? 200 : 502 });
}
