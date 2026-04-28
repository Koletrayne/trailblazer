export type ParkImage = {
  url: string;
  altText?: string;
  caption?: string;
  credit?: string;
};

export type Activity = { id: string; name: string };

export type Fee = {
  cost: string;
  description: string;
  title: string;
};

export type OperatingHours = {
  name: string;
  description: string;
  standardHours: Record<string, string>;
};

export type Alert = {
  id: string;
  title: string;
  description: string;
  category: string;
  url?: string;
};

export type Park = {
  id: string;
  parkCode: string;
  fullName: string;
  name: string;
  designation: string;
  states: string;
  latitude: number;
  longitude: number;
  description: string;
  url: string;
  weatherInfo?: string;
  directionsInfo?: string;
  images: ParkImage[];
  activities: Activity[];
  entranceFees?: Fee[];
  operatingHours?: OperatingHours[];
};

export type ThingToDo = {
  id: string;
  title: string;
  shortDescription?: string;
  url?: string;
  activities: Activity[];
  duration?: string;
  difficulty?: string;
  imageUrl?: string;
};

export type Campground = {
  id: string;
  name: string;
  description: string;
  url?: string;
  reservationUrl?: string;
  reservationInfo?: string;
  numberOfSitesReservable?: string;
  numberOfSitesFirstComeFirstServe?: string;
  fees?: Fee[];
  amenities?: Record<string, string | string[]>;
  imageUrl?: string;
};

export type Status = "not_visited" | "wishlist" | "planned" | "visited";

export type UserParkStatus = {
  parkCode: string;
  status: Status;
  visitedDate?: string;
  notes?: string;
  rating?: number;
};

export type GearCategory =
  | "clothing"
  | "safety"
  | "food_water"
  | "camping"
  | "electronics"
  | "documents"
  | "navigation"
  | "personal";

export type GearItem = {
  id: string;
  label: string;
  category: GearCategory;
  checked: boolean;
};

export type RouteStop = {
  parkCode: string;
  arrivalDate?: string;
  nights?: number;
};

export type TripStyle = "camping" | "hotel" | "mixed";

export type Trip = {
  id: string;
  name: string;
  startLocation: string;
  startDate?: string;
  endDate?: string;
  parkCodes: string[];
  routeStops: RouteStop[];
  gearChecklist: GearItem[];
  style: TripStyle;
  travelers: number;
  notes?: string;
  createdAt: string;
};

export type Season = "spring" | "summer" | "fall" | "winter";

export type SeasonRule = {
  parkCode: string;
  bestMonths: number[];
  shoulderMonths: number[];
  avoidMonths: number[];
  cautions: Partial<Record<Season, string[]>>;
  climate: "alpine" | "desert" | "tropical" | "temperate" | "arctic" | "coastal" | "subtropical";
};

export type Badge = {
  id: string;
  label: string;
  description: string;
  parkCodes: string[];
  icon: string;
};
