export interface POIIndexEntry {
  id: string;
  name: string;
  coordinates: {
    lng: number;
    lat: number;
  };
  types: string[];
  filePath: string;
  source?: string; // "poi" ou "hiking"
}

export interface POIIndex {
  pois: POIIndexEntry[];
  totalCount: number;
  generatedAt: string;
}
