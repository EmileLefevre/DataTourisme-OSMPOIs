import { parseDATAtourismeJSON } from "./datatourismeParser";
import { POIData } from "./interfaces/dataTourismeParserInterface";
import { POIIndexEntry, POIIndex } from "./interfaces/poiServiceInterface";
import { haversine } from "./utils/haversine";
import { poiCache } from "./cache/poiCache";

async function loadPOIIndex(): Promise<POIIndex> {
  return poiCache.getIndex();
}

// Filtre les POIs dans un rayon (en km) autour d'un point
function filterPOIsInRadius(
  pois: POIIndexEntry[],
  centerLng: number,
  centerLat: number,
  radiusKm: number
): POIIndexEntry[] {
  return pois.filter((poi) => {
    const distance = haversine(
      centerLat,
      centerLng,
      poi.coordinates.lat,
      poi.coordinates.lng
    );
    return distance <= radiusKm;
  });
}

// Charge les détails complets d'un POI depuis son fichier JSON
async function loadPOIDetails(
  filePath: string,
  source: string = "poi"
): Promise<POIData | null> {
  try {
    const response = await fetch(`/POIs/objects/${filePath}`);
    if (!response.ok) {
      console.error(`Failed to load POI: ${filePath}`);
      return null;
    }
    const data = await response.json();
    const poi = parseDATAtourismeJSON(data);
    poi.source = source; // Ajouter la source au POI
    return poi;
  } catch (error) {
    console.error(`Error loading POI details for ${filePath}:`, error);
    return null;
  }
}

// Charge les POIs dans un rayon (en km) autour d'un point
export async function loadPOIsInRadius(
  centerLng: number,
  centerLat: number,
  radiusKm: number,
  maxResults: number = 100
): Promise<POIData[]> {
  const index = await loadPOIIndex();
  const filteredIndex = filterPOIsInRadius(
    index.pois,
    centerLng,
    centerLat,
    radiusKm
  );

  console.log(
    `${filteredIndex.length} POIs trouvés dans un rayon de ${radiusKm}km (limite: ${maxResults})`
  );

  // Limiter le nombre de POIs
  const limitedPOIs = filteredIndex.slice(0, maxResults);

  // Charger les détails
  const poiDetailsPromises = limitedPOIs.map((poi) =>
    loadPOIDetails(poi.filePath, poi.source || "poi")
  );
  const poiDetails = await Promise.all(poiDetailsPromises);

  return poiDetails.filter((poi): poi is POIData => poi !== null);
}

// Récupère les statistiques de l'index
export async function getPOIStats(): Promise<{
  total: number;
  generatedAt: string;
}> {
  const index = await loadPOIIndex();
  return {
    total: index.totalCount,
    generatedAt: index.generatedAt,
  };
}

// Charge TOUS les POIs (sans limite de rayon)
export async function loadAllPOIs(maxResults?: number): Promise<POIData[]> {
  const index = await loadPOIIndex();

  console.log(
    `Chargement de tous les POIs (${index.totalCount} disponibles)...`
  );

  // Limiter le nombre de POIs si spécifié
  const poisToLoad = maxResults ? index.pois.slice(0, maxResults) : index.pois;

  console.log(`Chargement de ${poisToLoad.length} POIs...`);

  // Charger les détails de tous les POIs
  const poiDetailsPromises = poisToLoad.map((poi) =>
    loadPOIDetails(poi.filePath, poi.source || "poi")
  );
  const poiDetails = await Promise.all(poiDetailsPromises);
  const loadedPOIs = poiDetails.filter((poi): poi is POIData => poi !== null);
  return loadedPOIs;
}
