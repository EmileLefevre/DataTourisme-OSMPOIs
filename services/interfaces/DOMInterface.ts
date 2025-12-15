import { POIData } from "./dataTourismeParserInterface";

export interface MapLibreDOMProps {
  dom?: any;
  zoom: number;
  centerLng?: number;
  centerLat?: number;
  enableClustering?: boolean;
  maxPOIs?: number;
  radiusKm?: number;
  onPOIClick?: (poi: POIData) => void;
  onPOIGroupClick?: (pois: POIData[]) => void;
  onMapClick?: () => void;
  shouldRemoveRoute?: boolean;
  onRouteRemoved?: () => void;
}
