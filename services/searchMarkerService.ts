import maplibregl from "maplibre-gl";

export const SEARCH_MARKER_RADIUS_KM = 2;

// Ajoute un marqueur de recherche vert sur la carte
export function addSearchMarker(
  map: maplibregl.Map,
  lng: number,
  lat: number
): void {
  // Supprimer l'ancien marqueur s'il existe
  removeSearchMarker(map);

  // Créer une source pour le marqueur
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

  // Créer un layer vert pour le marqueur
  map.addLayer({
    id: "search-marker-layer",
    type: "circle",
    source: "search-marker-source",
    paint: {
      "circle-color": "#00ff00",
      "circle-radius": 8,
      "circle-stroke-width": 3,
      "circle-stroke-color": "#ffffff",
    },
  });
}

// Supprime le marqueur de recherche de la carte
export function removeSearchMarker(map: maplibregl.Map): void {
  if (map.getLayer("search-marker-layer")) {
    map.removeLayer("search-marker-layer");
  }
  if (map.getSource("search-marker-source")) {
    map.removeSource("search-marker-source");
  }
}

// Vérifie si un marqueur de recherche existe
export function hasSearchMarker(map: maplibregl.Map): boolean {
  return !!map.getSource("search-marker-source");
}
