# MapLibre DataTourisme POI

Application mobile cross-platform de visualisation des Points d'Intérêt (POI) de DATAtourisme sur une carte interactive.

## Description

Cette application utilise MapLibre GL pour afficher une carte interactive avec des POI (Points d'Intérêt) issus de DATAtourisme. Elle supporte le clustering pour gérer l'affichage d'un grand nombre de points et offre une expérience fluide sur iOS, Android et le web.

## Fonctionnalités

- Carte interactive avec MapLibre GL
- Clustering automatique des POI pour de meilleures performances
- Support 3D avec MapLibre Three Plugin
- Configuration personnalisable (rayon de recherche, nombre max de POI, zoom, etc.)
- Compatible iOS, Android et Web

## Technologies

- **Framework**: Expo / React Native
- **Cartographie**: MapLibre GL
- **3D**: Three.js avec MapLibre Three Plugin
- **Navigation**: Expo Router (file-based routing)
- **UI**: React Native avec support Web

## Installation

1. Installer les dépendances

   ```bash
   npm install
   ```

2. Construire l'index POI (si nécessaire)

   ```bash
   npm run build-poi-index
   ```

## Lancement

Démarrer le serveur de développement:

```bash
npm start
```

Vous pouvez ensuite ouvrir l'application sur:

- **iOS**: Appuyez sur `i` ou utilisez `npm run ios`
- **Android**: Appuyez sur `a` ou utilisez `npm run android`
- **Web**: Appuyez sur `w` ou utilisez `npm run web`

## Configuration

Les paramètres de la carte peuvent être modifiés dans `app/(tabs)/index.tsx`:

```typescript
<MapLibreDOM
  centerLng={1.0964442584504468} // Longitude du centre
  centerLat={49.44223209259255} // Latitude du centre
  zoom={10} // Niveau de zoom initial
  enableClustering={true} // Activer le clustering
  maxPOIs={10000} // Nombre maximum de POI
  radiusKm={5} // Rayon de recherche en km
/>
```

## Scripts disponibles

- `npm start` - Démarrer le serveur Expo
- `npm run ios` - Lancer sur iOS
- `npm run android` - Lancer sur Android
- `npm run web` - Lancer sur le web
- `npm run build-poi-index` - Construire l'index des POI
- `npm run lint` - Linter le code

## Structure du projet

- `app/` - Routes et écrans de l'application (file-based routing)
- `components/` - Composants réutilisables
- `constants/` - Constantes et thèmes
- `hooks/` - Custom hooks React
- `scripts/` - Scripts utilitaires (buildPOIIndex.mjs)

## Ressources

- [Documentation MapLibre GL](https://maplibre.org/maplibre-gl-js/docs/)
- [Documentation Expo](https://docs.expo.dev/)
- [DATAtourisme](https://www.datatourisme.gouv.fr/)
