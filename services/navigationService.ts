import * as THREE from "three";
import maplibregl from "maplibre-gl";
import { NAVIGATION_CONFIG } from "@/constants/navigation";

export class Navigation {
  private routeQueue: [number, number][] = [];
  private currentTarget: [number, number] | null = null;
  private isMoving = false;
  private currentBearing = 0;
  private fullRoute: [number, number][] = [];

  // Calculer une route avec OSRM
  async calculateRoute(
    start: [number, number],
    end: [number, number]
  ): Promise<[number, number][]> {
    try {
      console.log("[OSRM] Calcul de route de", start, "vers", end);
      const url = `https://router.project-osrm.org/route/v1/foot/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0].geometry.coordinates;
        console.log("[OSRM] Route calculée avec", route.length, "points");
        return route;
      } else {
        console.warn("[OSRM] Aucune route trouvée, déplacement direct");
        return [start, end];
      }
    } catch (error) {
      console.error("[OSRM] Erreur lors du calcul de route:", error);
      console.log("[OSRM] Fallback vers déplacement direct");
      return [start, end];
    }
  }

  // Afficher la route sur la carte
  displayRoute(
    map: maplibregl.Map,
    routeCoordinates: [number, number][]
  ): void {
    if (!routeCoordinates || routeCoordinates.length < 2) {
      // Supprimer la route si pas de coordonnées
      if (map.getSource("route")) {
        map.removeLayer("route");
        map.removeSource("route");
      }
      return;
    }

    const source = map.getSource("route");
    if (source) {
      (source as maplibregl.GeoJSONSource).setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: routeCoordinates,
        },
      });
    } else {
      // Créer une nouvelle source et couche
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: routeCoordinates,
          },
        },
      });

      // Trouver une couche de référence pour placer la route
      const layers = map.getStyle().layers;
      let beforeLayerId;
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === "symbol") {
          beforeLayerId = layers[i].id;
          break;
        }
      }

      map.addLayer(
        {
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#1e90ff",
            "line-width": 6,
            "line-opacity": 0.8,
          },
        },
        beforeLayerId
      );
    }
  }

  // Mettre à jour la route restante
  updateRemainingRoute(
    map: maplibregl.Map,
    modelPosition: [number, number]
  ): void {
    if (this.fullRoute.length > 0 && this.routeQueue.length > 0) {
      const remainingRoute = [modelPosition, ...this.routeQueue];
      this.displayRoute(map, remainingRoute);
    }
  }

  // Naviguer vers un POI
  async navigateToPOI(
    map: maplibregl.Map,
    modelPosition: [number, number],
    targetLng: number,
    targetLat: number
  ): Promise<{
    routeQueue: [number, number][];
    fullRoute: [number, number][];
    isMoving: boolean;
  }> {
    console.log(
      "[NAVIGATION] Demande de navigation vers:",
      targetLng,
      targetLat
    );

    const destination: [number, number] = [targetLng, targetLat];
    const route = await this.calculateRoute(modelPosition, destination);

    // Sauvegarder et afficher la route sur la carte
    this.fullRoute = [...route];
    this.displayRoute(map, route);

    // Vider la file actuelle et ajouter les nouveaux points
    this.routeQueue = [...route.slice(1)]; // Exclure le point de départ
    this.currentTarget = null;
    this.isMoving = true;

    return {
      routeQueue: [...this.routeQueue],
      fullRoute: [...this.fullRoute],
      isMoving: this.isMoving,
    };
  }

  // Arrêter le déplacement
  stopMovement(map: maplibregl.Map) {
    this.routeQueue = [];
    this.currentTarget = null;
    this.isMoving = false;
    this.fullRoute = [];

    // Supprimer la route de la carte
    if (map.getSource("route")) {
      map.removeLayer("route");
      map.removeSource("route");
    }
    return { routeQueue: [], fullRoute: [], isMoving: false };
  }

  // Mise à jour du mouvement du modèle
  // Retourne les nouvelles valeurs pour modelPosition, currentBearing, isMoving
  updateMovement(
    map: maplibregl.Map,
    modelPosition: [number, number],
    model: THREE.Object3D,
    walkAction: THREE.AnimationAction | null,
    idleAction: THREE.AnimationAction | null,
    followMode: boolean = true
  ): {
    modelPosition: [number, number];
    currentBearing: number;
    isMoving: boolean;
    currentTarget: [number, number] | null;
    routeQueue: [number, number][];
  } {
    if (!this.isMoving) {
      return {
        modelPosition,
        currentBearing: this.currentBearing,
        isMoving: false,
        currentTarget: null,
        routeQueue: [],
      };
    }

    // Vérifier s'il faut un nouveau point cible
    if (!this.currentTarget && this.routeQueue.length > 0) {
      this.currentTarget = this.routeQueue.shift()!;
      console.log("[MOVEMENT] Nouveau point cible:", this.currentTarget);
    }

    if (this.currentTarget) {
      const speed = NAVIGATION_CONFIG.MOVEMENT.SPEED;
      const dx = this.currentTarget[0] - modelPosition[0];
      const dy = this.currentTarget[1] - modelPosition[1];
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > NAVIGATION_CONFIG.MOVEMENT.ARRIVAL_DISTANCE_THRESHOLD) {
        // Calculer le déplacement
        const moveX = (dx / distance) * Math.min(speed, distance);
        const moveY = (dy / distance) * Math.min(speed, distance);

        // Mettre à jour la position
        modelPosition[0] += moveX;
        modelPosition[1] += moveY;

        // Calculer l'angle de déplacement
        const directionAngle = Math.atan2(dx, dy);
        const directionDegrees = directionAngle * (180 / Math.PI);
        let targetBearing = -directionDegrees;
        targetBearing = ((targetBearing % 360) + 360) % 360;

        // Interpolation du bearing
        let bearingDiff = targetBearing - this.currentBearing;
        while (bearingDiff > 180) bearingDiff -= 360;
        while (bearingDiff < -180) bearingDiff += 360;
        this.currentBearing +=
          bearingDiff * NAVIGATION_CONFIG.ROTATION.BEARING_SMOOTHING_FACTOR;

        // Rotation du modèle
        model.rotation.y = -directionAngle;

        // Animation de marche
        if (walkAction) {
          walkAction.setEffectiveWeight(1);
          walkAction.setEffectiveTimeScale(
            NAVIGATION_CONFIG.ANIMATION.WALK_SPEED
          );
        }
        if (idleAction) {
          idleAction.setEffectiveWeight(0);
        }

        // Mettre à jour la route restante
        this.updateRemainingRoute(map, modelPosition);

        // Caméra suit le personnage
        if (followMode) {
          map.setCenter(modelPosition);
          map.setBearing(-this.currentBearing - 5);
        } else {
          // Forcer un trigger de rendu même si la caméra ne suit pas
          map.triggerRepaint();
        }
      } else {
        // Arrivé au point cible actuel
        modelPosition = [...this.currentTarget];
        this.currentTarget = null;

        // Vérifier s'il y a d'autres points
        if (this.routeQueue.length === 0) {
          this.isMoving = false;

          // Arrêter l'animation de marche
          if (walkAction) {
            walkAction.setEffectiveWeight(0);
          }
          if (idleAction) {
            idleAction.setEffectiveWeight(1);
          }
          if (map.getSource("route")) {
            map.removeLayer("route");
            map.removeSource("route");
          }
        }
      }
    }

    return {
      modelPosition,
      currentBearing: this.currentBearing,
      isMoving: this.isMoving,
      currentTarget: this.currentTarget,
      routeQueue: [...this.routeQueue],
    };
  }
}

export const navigationService = new Navigation();
