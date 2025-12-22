import maplibregl from "maplibre-gl";
import { POIData } from "./interfaces/dataTourismeParserInterface";
import { CLUSTER_CONFIG } from "../constants/clusterConfig";
import { UNCLUSTERED_POI_CONFIG } from "../constants/unclusterPoiConfig";

// Groupe les POIs par coordonnées exactes
function groupPOIsByCoordinates(pois: POIData[]): Map<string, POIData[]> {
  const grouped = new Map<string, POIData[]>();

  pois.forEach((poi) => {
    const key = `${poi.coordinates.lng},${poi.coordinates.lat}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(poi);
  });

  return grouped;
}

// Convertit les POIs en format GeoJSON pour MapLibre
export function poisToGeoJSON(pois: POIData[]): GeoJSON.FeatureCollection {
  const groupedPOIs = groupPOIsByCoordinates(pois);
  const features: GeoJSON.Feature[] = [];

  groupedPOIs.forEach((poisAtLocation, coordsKey) => {
    const [lng, lat] = coordsKey.split(",").map(Number);

    if (poisAtLocation.length === 1) {
      // POI unique
      const poi = poisAtLocation[0];
      features.push({
        type: "Feature",
        properties: {
          id: poi.id,
          name: poi.name,
          description: poi.description,
          type: poi.type,
          poiData: JSON.stringify(poi),
          poiCount: 1,
          source: poi.source || "poi", // Ajouter la source
        },
        geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
      });
    } else {
      // Plusieurs POIs au même endroit
      features.push({
        type: "Feature",
        properties: {
          id: poisAtLocation.map((p) => p.id).join(","),
          name: `${poisAtLocation.length} événements`,
          description: poisAtLocation.map((p) => p.name).join(", "),
          type: poisAtLocation[0].type,
          poiDataArray: JSON.stringify(poisAtLocation),
          poiCount: poisAtLocation.length,
          source: poisAtLocation[0].source || "poi", // Ajouter la source
        },
        geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
      });
    }
  });

  return {
    type: "FeatureCollection",
    features,
  };
}

// Ajoute la source GeoJSON avec clustering à la carte
export function addClusterSource(
  map: maplibregl.Map,
  initialData: POIData[] = []
): void {
  map.addSource("pois", {
    type: "geojson",
    data: poisToGeoJSON(initialData),
    cluster: true,
    clusterMaxZoom: CLUSTER_CONFIG.maxZoom,
    clusterRadius: CLUSTER_CONFIG.radius,
  });
}

// Ajoute le layer pour les clusters (cercles colorés)
export function addClusterLayer(map: maplibregl.Map): void {
  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "pois",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        CLUSTER_CONFIG.colors.small,
        CLUSTER_CONFIG.thresholds.medium,
        CLUSTER_CONFIG.colors.medium,
        CLUSTER_CONFIG.thresholds.large,
        CLUSTER_CONFIG.colors.large,
      ],
      "circle-radius": [
        "step",
        ["get", "point_count"],
        CLUSTER_CONFIG.radiusSizes.small,
        CLUSTER_CONFIG.thresholds.medium,
        CLUSTER_CONFIG.radiusSizes.medium,
        CLUSTER_CONFIG.thresholds.large,
        CLUSTER_CONFIG.radiusSizes.large,
      ],
    },
  });
}

// Ajoute le layer pour le compteur de POIs dans les clusters
export function addClusterCountLayer(map: maplibregl.Map): void {
  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "pois",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["Noto Sans Regular"],
      "text-size": 12,
    },
    paint: {
      "text-color": "#ffffff",
    },
  });
}

// Ajoute le layer pour les POIs individuels (non clusterisés)
export function addUnclusteredPointLayer(map: maplibregl.Map): void {
  map.addLayer({
    id: "unclustered-point",
    type: "circle",
    source: "pois",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": [
        "case",
        ["==", ["get", "source"], "hiking"],
        "#8e44ad", // Violet pour les POI hiking
        UNCLUSTERED_POI_CONFIG.color, // Bleu pour les autres
      ],
      "circle-radius": UNCLUSTERED_POI_CONFIG.radius,
      "circle-stroke-width": UNCLUSTERED_POI_CONFIG.strokeWidth,
      "circle-stroke-color": UNCLUSTERED_POI_CONFIG.strokeColor,
    },
  });
}

// Ajoute le layer pour afficher le compteur sur les POIs groupés
export function addPOICountLayer(map: maplibregl.Map): void {
  map.addLayer({
    id: "poi-count",
    type: "symbol",
    source: "pois",
    filter: [
      "all",
      ["!", ["has", "point_count"]],
      [">", ["get", "poiCount"], 1],
    ],
    layout: {
      "text-field": ["get", "poiCount"],
      "text-font": ["Noto Sans Bold"],
      "text-size": 12,
    },
    paint: {
      "text-color": "#ffffff",
    },
  });
}

export async function handleClusterClick(
  map: maplibregl.Map,
  e: maplibregl.MapLayerMouseEvent
): Promise<void> {
  const features = map.queryRenderedFeatures(e.point, {
    layers: ["clusters"],
  });

  if (!features.length) return;

  const clusterId = features[0].properties.cluster_id;
  const source = map.getSource("pois") as maplibregl.GeoJSONSource;

  try {
    const zoom = await source.getClusterExpansionZoom(clusterId);

    map.easeTo({
      center: (features[0].geometry as GeoJSON.Point).coordinates as [
        number,
        number
      ],
      zoom,
    });
  } catch (err) {
    console.error("Erreur lors de l’expansion du cluster :", err);
  }
}

export function handleUnclusteredPointClick(
  map: maplibregl.Map,
  e: maplibregl.MapLayerMouseEvent,
  onPOIClick?: (poi: POIData, coordinates: [number, number]) => void,
  onPOIGroupClick?: (pois: POIData[], coordinates: [number, number]) => void
): void {
  if (!e.features || !e.features.length) return;

  e.preventDefault();
  if (e.originalEvent) {
    e.originalEvent.stopPropagation();
  }

  const coordinates = (
    e.features![0].geometry as GeoJSON.Point
  ).coordinates.slice() as [number, number];
  const properties = e.features[0].properties;

  // Vérifier si c'est un POI groupé
  if (properties.poiDataArray) {
    const pois: POIData[] = JSON.parse(properties.poiDataArray);
    console.log(`[Clustering] Clic sur POI groupé: ${pois.length} POIs`);
    if (onPOIGroupClick) {
      onPOIGroupClick(pois, coordinates);
    }
  } else if (properties.poiData) {
    // POI unique
    const poiData: POIData = JSON.parse(properties.poiData);
    console.log(`[Clustering] Clic sur POI unique: ${poiData.name}`);
    if (onPOIClick) {
      onPOIClick(poiData, coordinates);
    }
  }
}

// Initialise le système de clustering sur la carte
export function initializeClustering(
  map: maplibregl.Map,
  initialData: POIData[] = [],
  onPOIClick?: (poi: POIData, coordinates: [number, number]) => void,
  onPOIGroupClick?: (pois: POIData[], coordinates: [number, number]) => void
): void {
  addClusterSource(map, initialData);
  addClusterLayer(map);
  addClusterCountLayer(map);
  addUnclusteredPointLayer(map);
  addPOICountLayer(map);

  map.on("click", "clusters", (e) => handleClusterClick(map, e));
  map.on("click", "unclustered-point", (e) =>
    handleUnclusteredPointClick(map, e, onPOIClick, onPOIGroupClick)
  );
  //setupCursorHandlers(map);
}

export function updateClusterData(map: maplibregl.Map, pois: POIData[]): void {
  const source = map.getSource("pois") as maplibregl.GeoJSONSource;
  if (source) {
    source.setData(poisToGeoJSON(pois));
  }
}

// Vérifie si le clustering est déjà initialisé sur la carte
export function isClusteringInitialized(map: maplibregl.Map): boolean {
  return !!map.getSource("pois");
}
