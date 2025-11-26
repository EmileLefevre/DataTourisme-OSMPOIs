import * as MTP from "@dvt3d/maplibre-three-plugin";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { navigateToPOI, updateMovement } from "./navigationService";
import { Model3DOptions } from "./interfaces/threeboxServiceInterface";

let model: THREE.Object3D | null = null;
let rtcGroup: THREE.Group | null = null;
let mixer: THREE.AnimationMixer | null = null;
let walkAction: THREE.AnimationAction | null = null;
let idleAction: THREE.AnimationAction | null = null;
let modelPosition: [number, number] = [0, 0];
let mapInstance: any = null;
let mapScene: any = null;
let isMoving = false;
let followMode = true;
let onArrivalCallback: (() => void) | null = null;
const createRTCGroup = (center: [number, number]) =>
  (MTP.Creator as any).createRTCGroup(center);
const MODEL_OFFSET_X = -2.6;
const MODEL_OFFSET_Y = 0;
const MODEL_OFFSET_Z = 0;
const BASE_MODEL_SIZE = 9;
const REFERENCE_ZOOM = 18;

export function createThreeScene(map: any, modelOptions: Model3DOptions) {
  mapInstance = map;

  // Créer la scène 3D MapLibre-Three
  mapScene = new MTP.MapScene(map);

  // Ajouter les lumières
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
  mapScene.addLight(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, -10, 10).normalize();
  mapScene.addLight(directionalLight);

  // Sauvegarder la position initiale
  modelPosition = [modelOptions.lng, modelOptions.lat];

  // Charger le modèle GLTF
  const loader = new GLTFLoader();

  // Fonction pour calculer l'échelle selon le zoom
  const calculateModelScale = () => {
    const currentZoom = map.getZoom();
    const zoomFactor = Math.pow(2, REFERENCE_ZOOM - currentZoom);
    return BASE_MODEL_SIZE * zoomFactor;
  };

  // Fonction pour mettre à jour l'échelle
  const updateModelScale = () => {
    if (model && rtcGroup) {
      const newScale = calculateModelScale();
      mapScene.removeObject(rtcGroup);
      model.scale.set(newScale, newScale, newScale);
      model.position.set(MODEL_OFFSET_X, MODEL_OFFSET_Y, MODEL_OFFSET_Z);
      rtcGroup.add(model);
      mapScene.addObject(rtcGroup);
    }
  };

  loader.load(
    modelOptions.modelPath,
    (gltf) => {
      model = gltf.scene;

      // Échelle initiale calculée selon le zoom
      const initialScale = calculateModelScale();
      model.scale.set(initialScale, initialScale, initialScale);
      model.position.set(MODEL_OFFSET_X, MODEL_OFFSET_Y, MODEL_OFFSET_Z);
      console.log(`Échelle initiale: ${initialScale} (zoom: ${map.getZoom()})`);

      // Écouter les changements de zoom
      map.on("zoom", updateModelScale);

      // Créer un groupe RTC
      rtcGroup = createRTCGroup(modelPosition);
      if (!rtcGroup) return;
      rtcGroup.add(model);
      mapScene.addObject(rtcGroup);

      // Configuration des animations
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);

        // Trouver l'animation de marche
        const walkAnim =
          gltf.animations.find(
            (anim) =>
              anim.name.toLowerCase().includes("walk") ||
              anim.name.toLowerCase().includes("run")
          ) || gltf.animations[0];

        // Trouver l'animation d'idle
        const idleAnim = gltf.animations.find(
          (anim) =>
            anim.name.toLowerCase().includes("idle") ||
            anim.name.toLowerCase().includes("standing")
        );

        // Configurer l'animation d'idle (dominante)
        if (idleAnim) {
          idleAction = mixer.clipAction(idleAnim);
          idleAction.setLoop(THREE.LoopRepeat, Infinity);
          idleAction.setEffectiveWeight(1); // 100% idle
          idleAction.timeScale = 3; // Accélérer l'animation pour la rendre plus visible
          idleAction.play();
          console.log("Animation idle configurée:", idleAnim.name);
        }
        console.log(
          "Animation de marche configurée (respiration légère):",
          walkAnim.name
        );
      }

      // Démarrer la boucle d'animation
      startAnimationLoop();
    },
    () => {
      console.log(`Chargement ...`);
    },
    (error) => {
      console.error("❌ Erreur de chargement:", error);
    }
  );
  return mapScene;
}

// Boucle d'animation
function startAnimationLoop() {
  let lastUpdateTime = 0;
  const updateInterval = 50; // 50ms entre chaque mise à jour

  function animate() {
    requestAnimationFrame(animate);
    const currentTime = Date.now();

    // Mettre à jour les animations
    if (mixer) {
      mixer.update(0.016);
    }

    // Forcer le rafraîchissement de la carte pour voir l'animation
    if (mapInstance && mapScene) {
      mapInstance.triggerRepaint();
    }

    // Limiter les mises à jour de position
    if (currentTime - lastUpdateTime < updateInterval) {
      return;
    }
    lastUpdateTime = currentTime;

    // Gestion du déplacement
    if (model && rtcGroup && isMoving) {
      const wasMoving = isMoving;

      const result = updateMovement(
        mapInstance,
        modelPosition,
        model,
        walkAction,
        idleAction,
        followMode
      );

      modelPosition = result.modelPosition;
      isMoving = result.isMoving;

      // Si le personnage vient de s'arrêter (arrivé à destination)
      if (wasMoving && !isMoving && onArrivalCallback) {
        onArrivalCallback();
      }

      // Mettre à jour la position géographique du modèle
      model.position.set(MODEL_OFFSET_X, MODEL_OFFSET_Y, MODEL_OFFSET_Z);
      mapScene.removeObject(rtcGroup);
      rtcGroup = createRTCGroup(modelPosition);
      if (!rtcGroup) return;
      rtcGroup.add(model);
      mapScene.addObject(rtcGroup);
    }
  }

  animate();
}

// Fonction publique pour déclencher la navigation
export async function startNavigation(
  lng: number,
  lat: number,
  shouldFollow: boolean = true
) {
  if (!mapInstance || !model) {
    console.error("[NAV] Carte ou modèle non initialisés");
    return;
  }

  console.log("[NAV] Démarrage de la navigation vers:", lng, lat);

  const result = await navigateToPOI(mapInstance, modelPosition, lng, lat);
  isMoving = result.isMoving;
  followMode = shouldFollow;
}

// Fonction publique pour mettre à jour le follow mode
export function setFollowMode(follow: boolean) {
  followMode = follow;
}

// Fonction publique pour obtenir l'état du follow mode
export function getFollowMode(): boolean {
  return followMode;
}

// Fonction publique pour obtenir la position actuelle du modèle
export function getModelPosition(): [number, number] {
  return [...modelPosition];
}

// Fonction publique pour définir le callback d'arrivée
export function setOnArrivalCallback(callback: (() => void) | null) {
  onArrivalCallback = callback;
  console.log("[NAV] Callback d'arrivée défini:", !!callback);
}

// Fonction publique pour arrêter la navigation
export function stopNavigation() {
  if (!mapInstance) {
    console.error("[NAV] Carte non initialisée");
    return;
  }

  isMoving = false;

  // Arrêter l'animation de marche
  if (walkAction) {
    walkAction.setEffectiveWeight(0);
  }

  // Activer l'animation idle
  if (idleAction) {
    idleAction.setEffectiveWeight(1);
  }

  // Supprimer la route de la carte
  if (mapInstance.getSource("route")) {
    mapInstance.removeLayer("route");
    mapInstance.removeSource("route");
  }
}

// Crée une scène avec le modèle Soldier
export function createSoldierScene(
  map: any,
  lng: number,
  lat: number,
  options?: Partial<Model3DOptions>
) {
  return createThreeScene(map, {
    modelPath: "https://threejs.org/examples/models/gltf/Soldier.glb",
    lng,
    lat,
    altitude: options?.altitude || 0,
    baseScale: options?.baseScale || 5,
    fixedSize: options?.fixedSize !== undefined ? options.fixedSize : true,
    billboardRotation:
      options?.billboardRotation !== undefined
        ? options.billboardRotation
        : false,
    rotation: options?.rotation || { x: 90, y: 180, z: 0 },
    animated: options?.animated !== undefined ? options.animated : true,
  });
}
