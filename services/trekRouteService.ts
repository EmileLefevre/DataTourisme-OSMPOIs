import maplibregl from "maplibre-gl";
import { POIData } from "./interfaces/dataTourismeParserInterface";

const TREK_ROUTE_SOURCE_ID = "trek-route-source";
const TREK_ROUTE_LAYER_ID = "trek-route-layer";

export function isTrek(poi: POIData): boolean {
  if (poi.source === "hiking") {
    return true;
  }

  const types = poi.type || [];
  const isTrekType =
    types.includes("WalkingTour") ||
    types.includes("CyclingTour") ||
    types.includes("Trek");
  return isTrekType;
}
function extractRouteCoordinates(poi: POIData): [number, number][] | null {
  try {
    const rawData = poi.rawData;
    if (!rawData) {
      return null;
    }
    if (rawData.hasGeometry) {
      const geometry = Array.isArray(rawData.hasGeometry)
        ? rawData.hasGeometry[0]
        : rawData.hasGeometry;

      if (geometry["geo:asWKT"]) {
        const wkt = geometry["geo:asWKT"];
        return parseWKT(wkt);
      }
      if (geometry["geo:asGeoJSON"]) {
        const geoJSON = JSON.parse(geometry["geo:asGeoJSON"]);
        if (geoJSON.type === "LineString") {
          return geoJSON.coordinates;
        }
      }
    }

    if (rawData["schema:geo"]) {
      const geo = rawData["schema:geo"];
      if (geo.type === "LineString" && geo.coordinates) {
        return geo.coordinates;
      }
    }

    if (rawData.hasItinerary || rawData.hasTourRoute) {
      const route = rawData.hasItinerary || rawData.hasTourRoute;
      if (route.coordinates) {
        return route.coordinates;
      }
    }
    if (rawData.trekData) {
      if (rawData.trekData.coordinates) {
        return rawData.trekData.coordinates;
      }
      if (rawData.trekData.geometry) {
        const geometry = rawData.trekData.geometry;
        if (geometry.type === "LineString" && geometry.coordinates) {
          return geometry.coordinates;
        }
      }

      if (rawData.trekData.path || rawData.trekData.route) {
        const pathData = rawData.trekData.path || rawData.trekData.route;
        if (Array.isArray(pathData) && pathData.length > 0) {
          if (Array.isArray(pathData[0]) && pathData[0].length === 2) {
            return pathData;
          }
          if (typeof pathData[0] === "object") {
            const coords: [number, number][] = pathData.map((point: any) => {
              const lng = Number(point.lng ?? point.longitude ?? point[0]);
              const lat = Number(point.lat ?? point.latitude ?? point[1]);
              return [lng, lat];
            });
            return coords;
          }
        }
      }
    }
    return null;
  } catch (error) {
    console.error("❌ Erreur lors de l'extraction des coordonnées:", error);
    return null;
  }
}

function parseWKT(wkt: string): [number, number][] | null {
  try {
    const match = wkt.match(/LINESTRING\s*\((.*?)\)/i);
    if (!match) return null;

    const coordsString = match[1];
    const coords = coordsString.split(",").map((pair) => {
      const [lng, lat] = pair.trim().split(/\s+/).map(Number);
      return [lng, lat] as [number, number];
    });

    return coords;
  } catch (error) {
    console.error("❌ Erreur lors du parsing WKT:", error);
    return null;
  }
}

export function displayTrekRoute(
  map: maplibregl.Map,
  poi: POIData,
  onMarkerClick?: (poi: POIData) => void
) {
  removeTrekRoute(map);

  const routeCoords = extractRouteCoordinates(poi);

  if (!routeCoords || routeCoords.length < 2) {
    console.warn("⚠️ Pas assez de coordonnées pour afficher l'itinéraire");
    return;
  }

  map.addSource(TREK_ROUTE_SOURCE_ID, {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: routeCoords,
      },
    },
  });

  const layers = map.getStyle().layers;
  let beforeLayerId;
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].type === "symbol") {
      beforeLayerId = layers[i].id;
      break;
    }
  }

  const routeColor = poi.source === "hiking" ? "#8e44ad" : "#1e90ff";
  map.addLayer(
    {
      id: TREK_ROUTE_LAYER_ID,
      type: "line",
      source: TREK_ROUTE_SOURCE_ID,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": routeColor,
        "line-width": 4,
        "line-opacity": 0.8,
      },
    },
    beforeLayerId
  );

  const startCoord = routeCoords[0];
  const endCoord = routeCoords[routeCoords.length - 1];
  const startMarker = new maplibregl.Marker({
    color: "#22c55e",
    scale: 0.8,
  })
    .setLngLat(startCoord)
    .addTo(map);

  const endMarker = new maplibregl.Marker({
    color: "#ef4444",
    scale: 0.8,
  })
    .setLngLat(endCoord)
    .addTo(map);

  (map as any)._trekStartMarker = startMarker;
  (map as any)._trekEndMarker = endMarker;

  if (onMarkerClick) {
    startMarker.getElement().style.cursor = "pointer";
    startMarker.getElement().addEventListener("click", () => {
      onMarkerClick(poi);
    });

    endMarker.getElement().style.cursor = "pointer";
    endMarker.getElement().addEventListener("click", () => {
      onMarkerClick(poi);
    });
  }

  const bounds = new maplibregl.LngLatBounds();
  routeCoords.forEach((coord) => bounds.extend(coord));
  map.fitBounds(bounds, {
    padding: { top: 50, bottom: 50, left: 50, right: 50 },
    maxZoom: 15,
  });
}

export function removeTrekRoute(map: maplibregl.Map) {
  if (map.getLayer(TREK_ROUTE_LAYER_ID)) {
    map.removeLayer(TREK_ROUTE_LAYER_ID);
  }
  if (map.getSource(TREK_ROUTE_SOURCE_ID)) {
    map.removeSource(TREK_ROUTE_SOURCE_ID);
  }
  if ((map as any)._trekStartMarker) {
    (map as any)._trekStartMarker.remove();
    delete (map as any)._trekStartMarker;
  }
  if ((map as any)._trekEndMarker) {
    (map as any)._trekEndMarker.remove();
    delete (map as any)._trekEndMarker;
  }
}
