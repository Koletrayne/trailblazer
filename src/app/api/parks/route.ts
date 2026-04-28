import { NextResponse } from "next/server";
import { getAllParks } from "@/lib/nps";

export const revalidate = 86400;

export async function GET() {
  const parks = await getAllParks();
  return NextResponse.json({ parks, count: parks.length });
}
