import * as MTP from "@dvt3d/maplibre-three-plugin";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { navigationService } from "./navigationService";
import { Model3DOptions } from "./interfaces/threeboxServiceInterface";
import { MODEL_3D_CONFIG } from "../constants/model3d";

export class ThreebodDOM {
  private model: THREE.Object3D | null = null;
  private rtcGroup: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private walkAction: THREE.AnimationAction | null = null;
  private idleAction: THREE.AnimationAction | null = null;
  private modelPosition: [number, number] = [0, 0];
  private mapInstance: any = null;
  private mapScene: any = null;
  private isMoving = false;
  private followMode = true;
  private onArrivalCallback: (() => void) | null = null;
  createRTCGroup = (center: [number, number]) =>
    (MTP.Creator as any).createRTCGroup(center);

  createThreeScene(map: any, modelOptions: Model3DOptions) {
    this.mapInstance = map;

    // Créer la scène 3D MapLibre-Three
    this.mapScene = new MTP.MapScene(map);

    // Ajouter les lumières
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.mapScene.addLight(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, -10, 10).normalize();
    this.mapScene.addLight(directionalLight);

    // Sauvegarder la position initiale
    this.modelPosition = [modelOptions.lng, modelOptions.lat];

    // Charger le modèle GLTF
    const loader = new GLTFLoader();

    // Fonction pour calculer l'échelle selon le zoom
    const calculateModelScale = () => {
      const currentZoom = map.getZoom();
      const zoomFactor = Math.pow(
        2,
        MODEL_3D_CONFIG.REFERENCE_ZOOM - currentZoom
      );
      return MODEL_3D_CONFIG.BASE_MODEL_SIZE * zoomFactor;
    };

    // Fonction pour mettre à jour l'échelle
    const updateModelScale = () => {
      if (this.model && this.rtcGroup) {
        const newScale = calculateModelScale();
        this.mapScene.removeObject(this.rtcGroup);
        this.model.scale.set(newScale, newScale, newScale);
        this.model.position.set(
          MODEL_3D_CONFIG.OFFSET.X,
          MODEL_3D_CONFIG.OFFSET.Y,
          MODEL_3D_CONFIG.OFFSET.Z
        );
        this.rtcGroup.add(this.model);
        this.mapScene.addObject(this.rtcGroup);
      }
    };

    loader.load(
      modelOptions.modelPath,
      (gltf) => {
        this.model = gltf.scene;

        // Échelle initiale calculée selon le zoom
        const initialScale = calculateModelScale();
        this.model.scale.set(initialScale, initialScale, initialScale);
        this.model.position.set(
          MODEL_3D_CONFIG.OFFSET.X,
          MODEL_3D_CONFIG.OFFSET.Y,
          MODEL_3D_CONFIG.OFFSET.Z
        );
        console.log(
          `Échelle initiale: ${initialScale} (zoom: ${map.getZoom()})`
        );

        // Écouter les changements de zoom
        map.on("zoom", updateModelScale);

        // Créer un groupe RTC
        this.rtcGroup = this.createRTCGroup(this.modelPosition);
        if (!this.rtcGroup) return;
        this.rtcGroup.add(this.model);
        this.mapScene.addObject(this.rtcGroup);

        // Configuration des animations
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.model);

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
            this.idleAction = this.mixer.clipAction(idleAnim);
            this.idleAction.setLoop(THREE.LoopRepeat, Infinity);
            this.idleAction.setEffectiveWeight(1); // 100% idle
            this.idleAction.timeScale = 3; // Accélérer l'animation pour la rendre plus visible
            this.idleAction.play();
            console.log("Animation idle configurée:", idleAnim.name);
          }
          console.log(
            "Animation de marche configurée (respiration légère):",
            walkAnim.name
          );
        }

        // Démarrer la boucle d'animation
        this.startAnimationLoop();
      },
      () => {
        console.log(`Chargement ...`);
      },
      (error) => {
        console.error("❌ Erreur de chargement:", error);
      }
    );
    return this.mapScene;
  }

  // Boucle d'animation
  startAnimationLoop() {
    let lastUpdateTime = 0;

    const animate = () => {
      requestAnimationFrame(animate);
      const currentTime = Date.now();

      // Mettre à jour les animations
      if (this.mixer) {
        this.mixer.update(MODEL_3D_CONFIG.ANIMATION.MIXER_UPDATE_DELTA);
      }

      // Forcer le rafraîchissement de la carte pour voir l'animation
      if (this.mapInstance && this.mapScene) {
        this.mapInstance.triggerRepaint();
      }

      // Limiter les mises à jour de position
      if (
        currentTime - lastUpdateTime <
        MODEL_3D_CONFIG.ANIMATION.UPDATE_INTERVAL_MS
      ) {
        return;
      }
      lastUpdateTime = currentTime;

      // Gestion du déplacement
      if (this.model && this.rtcGroup && this.isMoving) {
        const wasMoving = this.isMoving;

        const result = navigationService.updateMovement(
          this.mapInstance,
          this.modelPosition,
          this.model,
          this.walkAction,
          this.idleAction,
          this.followMode
        );

        this.modelPosition = result.modelPosition;
        this.isMoving = result.isMoving;

        // Si le personnage vient de s'arrêter (arrivé à destination)
        if (wasMoving && !this.isMoving && this.onArrivalCallback) {
          this.onArrivalCallback();
        }

        // Mettre à jour la position géographique du modèle
        this.model.position.set(
          MODEL_3D_CONFIG.OFFSET.X,
          MODEL_3D_CONFIG.OFFSET.Y,
          MODEL_3D_CONFIG.OFFSET.Z
        );
        this.mapScene.removeObject(this.rtcGroup);
        this.rtcGroup = this.createRTCGroup(this.modelPosition);
        if (!this.rtcGroup) return;
        this.rtcGroup.add(this.model);
        this.mapScene.addObject(this.rtcGroup);
      }
    };

    animate();
  }

  // Fonction publique pour déclencher la navigation
  async startNavigation(
    lng: number,
    lat: number,
    shouldFollow: boolean = true
  ) {
    if (!this.mapInstance || !this.model) {
      console.error("[NAV] Carte ou modèle non initialisés");
      return;
    }

    console.log("[NAV] Démarrage de la navigation vers:", lng, lat);

    const result = await navigationService.navigateToPOI(
      this.mapInstance,
      this.modelPosition,
      lng,
      lat
    );
    this.isMoving = result.isMoving;
    this.followMode = shouldFollow;
  }

  // Fonction publique pour mettre à jour le follow mode
  setFollowMode(follow: boolean) {
    this.followMode = follow;
  }

  // Fonction publique pour obtenir l'état du follow mode
  getFollowMode(): boolean {
    return this.followMode;
  }

  // Fonction publique pour obtenir la position actuelle du modèle
  getModelPosition(): [number, number] {
    return [...this.modelPosition];
  }

  // Fonction publique pour définir le callback d'arrivée
  setOnArrivalCallback(callback: (() => void) | null) {
    this.onArrivalCallback = callback;
    console.log("[NAV] Callback d'arrivée défini:", !!callback);
  }

  // Fonction publique pour arrêter la navigation
  stopNavigation() {
    if (!this.mapInstance) {
      console.error("[NAV] Carte non initialisée");
      return;
    }

    this.isMoving = false;

    // Arrêter l'animation de marche
    if (this.walkAction) {
      this.walkAction.setEffectiveWeight(0);
    }

    // Activer l'animation idle
    if (this.idleAction) {
      this.idleAction.setEffectiveWeight(1);
    }

    // Supprimer la route de la carte
    if (this.mapInstance.getSource("route")) {
      this.mapInstance.removeLayer("route");
      this.mapInstance.removeSource("route");
    }
  }

  // Crée une scène avec le modèle Soldier
  createSoldierScene(
    map: any,
    lng: number,
    lat: number,
    options?: Partial<Model3DOptions>
  ) {
    return this.createThreeScene(map, {
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
}

export const model3DService = new ThreebodDOM();
