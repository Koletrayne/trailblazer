import { NextResponse } from "next/server";
import { getAllMonuments } from "@/lib/nps";

export const revalidate = 86400;

export async function GET() {
  const monuments = await getAllMonuments();
  return NextResponse.json({ monuments, count: monuments.length });
}
