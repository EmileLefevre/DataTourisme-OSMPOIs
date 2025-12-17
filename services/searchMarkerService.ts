import maplibregl from "maplibre-gl";
import { SEARCH_MARKER_CONFIG } from "../constants/searchMarker";
export const SEARCH_MARKER_RADIUS_KM = SEARCH_MARKER_CONFIG.RADIUS_KM;

export function addSearchMarker(
  map: maplibregl.Map,
  lng: number,
  lat: number
): void {
  removeSearchMarker(map);
  map.addSource("search-marker-source", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            type: "search-marker",
          },
          geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
        },
      ],
    },
  });

  map.addLayer({
    id: "search-marker-layer",
    type: "circle",
    source: "search-marker-source",
    paint: {
      "circle-color": SEARCH_MARKER_CONFIG.STYLE.COLOR,
      "circle-radius": SEARCH_MARKER_CONFIG.STYLE.RADIUS,
      "circle-stroke-width": SEARCH_MARKER_CONFIG.STYLE.STROKE.WIDTH,
      "circle-stroke-color": SEARCH_MARKER_CONFIG.STYLE.STROKE.COLOR,
    },
  });
}

export function removeSearchMarker(map: maplibregl.Map): void {
  if (map.getLayer("search-marker-layer")) {
    map.removeLayer("search-marker-layer");
  }
  if (map.getSource("search-marker-source")) {
    map.removeSource("search-marker-source");
  }
}

export function hasSearchMarker(map: maplibregl.Map): boolean {
  return !!map.getSource("search-marker-source");
}
