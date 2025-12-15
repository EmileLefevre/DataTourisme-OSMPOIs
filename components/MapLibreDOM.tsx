"use dom";

import {
  initializeClustering,
  updateClusterData,
} from "@/services/clusteringService";
import { POIData } from "../services/interfaces/dataTourismeParserInterface";
import { MapLibreDOMProps } from "../services/interfaces/DOMInterface";
import { getPOIStats, loadPOIsInRadius } from "@/services/poiService";
import {
  addSearchMarker,
  removeSearchMarker,
  SEARCH_MARKER_RADIUS_KM,
} from "@/services/searchMarkerService";
import { model3DService } from "@/services/threeboxServiceDOM";
import {
  displayTrekRoute,
  isTrek,
  removeTrekRoute,
} from "@/services/trekRouteService";
import "@/styles/MapLibreDOM.css";
import "@/styles/SearchMarkerButton.css";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import React, { useCallback, useEffect, useRef, useState } from "react";

export default function MapLibreDOM({
  dom,
  zoom,
  centerLng = 0.72816397,
  centerLat = 49.524509,
  enableClustering = false,
  maxPOIs = 0,
  radiusKm = 0,
  onPOIClick,
  onPOIGroupClick,
  onMapClick,
  shouldRemoveRoute,
  onRouteRemoved,
}: MapLibreDOMProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [pois, setPois] = useState<POIData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const clusteringInitialized = useRef(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const currentTrekIdRef = useRef<string | null>(null);
  const isPlacementMode = useRef(false);
  const [isPlacementModeUI, setIsPlacementModeUI] = useState(false);
  const [searchMarkerPOIs, setSearchMarkerPOIs] = useState<POIData[]>([]);
  const searchMarkerCoords = useRef<{ lng: number; lat: number } | null>(null);

  useEffect(() => {
    if (shouldRemoveRoute && mapInstance.current) {
      console.log("🗑️ Suppression de l'itinéraire depuis MapLibreDOM");
      removeTrekRoute(mapInstance.current);
      currentTrekIdRef.current = null;
      onRouteRemoved?.();
    }
  }, [shouldRemoveRoute, onRouteRemoved]);

  const handlePOIClick = useCallback(
    (poi: POIData, _coordinates: [number, number]) => {
      if (
        currentTrekIdRef.current &&
        currentTrekIdRef.current !== poi.id &&
        mapInstance.current
      ) {
        console.log("🗑️ Fermeture de l'itinéraire précédent");
        removeTrekRoute(mapInstance.current);
        currentTrekIdRef.current = null;
      }
      if (isTrek(poi) && mapInstance.current) {
        console.log("🗺️ Affichage de l'itinéraire pour:", poi.name);
        displayTrekRoute(mapInstance.current, poi, (clickedPoi) => {
          onPOIClick?.(clickedPoi);
        });
        currentTrekIdRef.current = poi.id;
      }

      onPOIClick?.(poi);
    },
    [onPOIClick]
  );

  const handlePOIGroupClick = useCallback(
    (pois: POIData[], _coordinates: [number, number]) => {
      onPOIGroupClick?.(pois);
    },
    [onPOIGroupClick]
  );

  useEffect(() => {
    const loadPOIs = async () => {
      setIsLoading(true);
      try {
        const stats = await getPOIStats();
        console.log(
          `Base de données: ${
            stats.total
          } POIs disponibles (généré le ${new Date(
            stats.generatedAt
          ).toLocaleString("fr-FR")})`
        );

        const nearbyPOIs = await loadPOIsInRadius(
          centerLng,
          centerLat,
          radiusKm,
          maxPOIs
        );
        setPois(nearbyPOIs);
        console.log(
          `${nearbyPOIs.length} POIs chargés dans un rayon de ${radiusKm}km`
        );
      } catch (error) {
        console.error("Erreur lors du chargement des POIs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (pois.length === 0) {
      loadPOIs();
    }
  }, [centerLat, centerLng, maxPOIs, pois.length, radiusKm]);

  useEffect(() => {
    if (mapInstance.current) return;

    mapInstance.current = new maplibregl.Map({
      container: mapRef.current!,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [centerLng, centerLat],
      zoom: 17,
      pitch: 60,
      attributionControl: false,
    });

    mapInstance.current.on("load", () => {
      setMapLoaded(true);
      const map = mapInstance.current;
      if (!map) return;

      map
        .getStyle()
        .layers.filter((layer: any) => layer.id.includes("poi"))
        .forEach((layer: any) => map.removeLayer(layer.id));

      try {
        console.log(
          `Position du modele 3D : lng=${centerLng}, lat=${centerLat}`
        );

        model3DService.createSoldierScene(
          mapInstance.current,
          centerLng,
          centerLat,
          {
            altitude: 0,
            animated: true,
          }
        );
      } catch (error) {
        console.error("Erreur lors de la création de la scène 3D:", error);
      }

      const updateBuildingsVisibility = () => {
        const currentZoom = map.getZoom();
        const layers = map.getStyle().layers;
        const shouldHideBuildings = currentZoom >= 18;

        layers.forEach((layer: any) => {
          if (layer.type === "fill-extrusion") {
            const visibility = shouldHideBuildings ? "none" : "visible";
            map.setLayoutProperty(layer.id, "visibility", visibility);
          }
        });
      };
      updateBuildingsVisibility();
      map.on("zoom", updateBuildingsVisibility);

      map.on("click", (e) => {
        if (isPlacementMode.current) {
          const lng = e.lngLat.lng;
          const lat = e.lngLat.lat;

          if (searchMarkerCoords.current) {
            removeSearchMarker(map);
            setSearchMarkerPOIs([]);
          }
          addSearchMarker(map, lng, lat);
          searchMarkerCoords.current = { lng, lat };
          loadPOIsInRadius(lng, lat, SEARCH_MARKER_RADIUS_KM, maxPOIs)
            .then((newPOIs) => {
              setSearchMarkerPOIs(newPOIs);
            })
            .catch((error) => {
              console.error(
                "Erreur lors du chargement des POIs autour du marqueur:",
                error
              );
            });
          isPlacementMode.current = false;
          setIsPlacementModeUI(false);
          return;
        }
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["unclustered-point", "clusters"],
        });

        if (features.length === 0 && onMapClick) {
          onMapClick();
        }
      });
    });
  }, [centerLng, centerLat, zoom, onMapClick, maxPOIs]);

  // useEffect 2 : Initialiser le clustering (RÉACTIF à enableClustering)
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    if (enableClustering && !clusteringInitialized.current) {
      initializeClustering(
        mapInstance.current,
        [],
        handlePOIClick,
        handlePOIGroupClick
      );
      clusteringInitialized.current = true;
    }
  }, [enableClustering, handlePOIClick, handlePOIGroupClick, mapLoaded]);

  useEffect(() => {
    if (!mapInstance.current || !pois.length) return;

    // Combiner les POIs normaux + les POIs du marqueur de recherche
    const allPOIs = [...pois, ...searchMarkerPOIs];

    if (enableClustering) updateClusterData(mapInstance.current, allPOIs);
  }, [pois, searchMarkerPOIs, enableClustering]);

  return (
    <>
      <div
        {...dom}
        ref={mapRef}
        style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
      >
        {isLoading && <div className="map-loading">Chargement des POIs...</div>}
      </div>
      <button
        onClick={() => {
          const newMode = !isPlacementMode.current;
          isPlacementMode.current = newMode;
          setIsPlacementModeUI(newMode);
        }}
        className={`search-marker-button ${isPlacementModeUI ? "active" : ""}`}
        title={
          isPlacementModeUI
            ? "Mode placement actif - Cliquez sur la carte"
            : "Placer un marqueur de recherche"
        }
      >
        📍
      </button>
    </>
  );
}
