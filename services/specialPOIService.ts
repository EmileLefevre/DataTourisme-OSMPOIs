import { parseDATAtourismeJSON } from "./datatourismeParser";
import { POIData } from "../services/interfaces/dataTourismeParserInterface";

export async function loadSpecialPOI(): Promise<POIData | null> {
  try {
    const response = await fetch(
      "/POIs/objects/42-9236a1d8-19b7-3203-be16-d848fc5cb897.json"
    );

    if (!response.ok) {
      return null;
    }

    const rawData = await response.json();
    const poi = parseDATAtourismeJSON(rawData);
    return poi;
  } catch (error) {
    console.error("❌ Erreur lors du chargement du POI spécial:", error);
    return null;
  }
}

export function extractPhotoURLs(poi: POIData): string[] {
  const photos: string[] = [];

  if (!poi.rawData?.hasRepresentation) {
    return photos;
  }

  try {
    const representations = poi.rawData.hasRepresentation;

    for (const representation of representations) {
      const resources = representation["ebucore:hasRelatedResource"];
      if (resources && Array.isArray(resources)) {
        for (const resource of resources) {
          const locators = resource["ebucore:locator"];
          if (locators && Array.isArray(locators) && locators[0]) {
            photos.push(locators[0]);
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'extraction des photos:", error);
  }

  return photos;
}
