export interface POIData {
  id: string;
  name: string;
  description: string;
  coordinates: {
    lng: number;
    lat: number;
  };
  type: string[];
  duration?: string;
  distance?: string;
  tourType?: string;
  address?: {
    streetAddress?: string;
    locality?: string;
    postalCode?: string;
    city?: string;
    department?: string;
    region?: string;
  };
  creationDate?: string;
  lastUpdate?: string;
  descriptions?: {
    [lang: string]: string;
  };
  paymentMethods?: string[];
  rawData?: any;
  source?: string; // "poi" ou "hiking"
}
