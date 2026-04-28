import { notFound } from "next/navigation";
import { getPark, getThingsToDo, getCampgrounds, getAlerts } from "@/lib/nps";
import ParkDetailClient from "@/components/ParkDetailClient";

export const revalidate = 86400;

export default async function ParkPage({ params }: { params: { parkCode: string } }) {
  const code = params.parkCode.toLowerCase();
  const [park, thingsToDo, campgrounds, alerts] = await Promise.all([
    getPark(code),
    getThingsToDo(code),
    getCampgrounds(code),
    getAlerts(code)
  ]);

  if (!park) notFound();

  return (
    <ParkDetailClient
      park={park}
      thingsToDo={thingsToDo}
      campgrounds={campgrounds}
      alerts={alerts}
    />
  );
}
