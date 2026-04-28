import { NextResponse } from "next/server";
import { getPark, getThingsToDo, getCampgrounds, getAlerts } from "@/lib/nps";

export const revalidate = 86400;

export async function GET(_req: Request, { params }: { params: { parkCode: string } }) {
  const code = params.parkCode.toLowerCase();
  const [park, thingsToDo, campgrounds, alerts] = await Promise.all([
    getPark(code),
    getThingsToDo(code),
    getCampgrounds(code),
    getAlerts(code)
  ]);

  if (!park) {
    return NextResponse.json({ error: "Park not found" }, { status: 404 });
  }

  return NextResponse.json({ park, thingsToDo, campgrounds, alerts });
}
