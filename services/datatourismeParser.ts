import { POIData } from "./interfaces/dataTourismeParserInterface";

export async function loadPOIData(filename: string): Promise<POIData | null> {
  try {
    const response = await fetch(`/POIs/${filename}`);
    if (!response.ok) {
      console.error(`Failed to load POI data: ${filename}`);
      return null;
    }

    const data = await response.json();
    return parseDATAtourismeJSON(data);
  } catch (error) {
    console.error("Error loading POI data:", error);
    return null;
  }
}

export function parseDATAtourismeJSON(data: any): POIData {
  // Extraire le nom (rdfs:label)
  const name =
    data["rdfs:label"]?.fr?.[0] ||
    data["rdfs:label"]?.en?.[0] ||
    "POI sans nom";

  // Extraire la description (priorité à hasDescription, sinon rdfs:comment)
  let description = "";
  if (data["hasDescription"]?.[0]?.["dc:description"]?.fr?.[0]) {
    description = data["hasDescription"][0]["dc:description"].fr[0];
  } else if (data["hasDescription"]?.[0]?.["dc:description"]?.en?.[0]) {
    description = data["hasDescription"][0]["dc:description"].en[0];
  } else if (data["rdfs:comment"]?.fr?.[0]) {
    description = data["rdfs:comment"].fr[0];
  } else if (data["rdfs:comment"]?.en?.[0]) {
    description = data["rdfs:comment"].en[0];
  }

  // Chercher d'autres sources de description possibles
  if (!description || description.trim() === "") {
    if (data["shortDescription"]?.fr?.[0]) {
      description = data["shortDescription"].fr[0];
    } else if (data["reducedMobilityAccess"]?.fr?.[0]) {
      description = data["reducedMobilityAccess"].fr[0];
    }
  }

  // Nettoyer les descriptions avec des "?" (templates non remplis)
  if (description) {
    // Remplacer "Itinéraire de randonnée de ? à ?" par une version générique
    description = description.replace(
      /[Ii]tinéraire\s+de\s+randonnées?\s+de\s+\?\s+à\s+\?\.?/gi,
      "Itinéraire de randonnée."
    );

    // Gérer les cas partiels "de [lieu] à ?" ou "de ? à [lieu]"
    description = description.replace(/\s+à\s+\?\s*\.?$/gi, ".");
    description = description.replace(/de\s+\?\s+à\s+/gi, "à ");

    // Supprimer d'autres patterns de "?"
    description = description.replace(/de\s+\?\s+à\s+\?/gi, "");
    description = description.replace(/from\s+\?\s+to\s+\?/gi, "");

    // Nettoyer les espaces et points multiples
    description = description.replace(/\s+/g, " ").trim();
    description = description.replace(/\.{2,}/g, ".").trim();

    // Supprimer un point en début
    if (description.startsWith(".")) {
      description = description.substring(1).trim();
    }

    // Si la description est juste "Itinéraire de randonnée." (inutile), la marquer pour génération
    if (
      description === "Itinéraire de randonnée." ||
      description === "Itinéraire de randonnée"
    ) {
      description = "__GENERATE__";
    }
  }

  // Extraire toutes les descriptions complètes multilingues (priorité à hasDescription)
  const descriptions: { [lang: string]: string } = {};

  // D'abord essayer hasDescription (description longue et complète)
  if (data["hasDescription"]?.[0]?.["dc:description"]) {
    const longDescriptions = data["hasDescription"][0]["dc:description"];
    Object.keys(longDescriptions).forEach((lang) => {
      descriptions[lang] = longDescriptions[lang][0];
    });
  }
  // Si pas de hasDescription, utiliser rdfs:comment (description courte)
  else if (data["rdfs:comment"]) {
    Object.keys(data["rdfs:comment"]).forEach((lang) => {
      descriptions[lang] = data["rdfs:comment"][lang][0];
    });
  }

  // Extraire les coordonnées
  const location = data["isLocatedAt"]?.[0];
  const coordinates = {
    lng: parseFloat(location?.["schema:geo"]?.["schema:longitude"] || "0"),
    lat: parseFloat(location?.["schema:geo"]?.["schema:latitude"] || "0"),
  };

  // Extraire l'adresse avec plus de robustesse
  const addressData = location?.["schema:address"]?.[0];
  const cityData = addressData?.hasAddressCity;
  const departmentData = cityData?.isPartOfDepartment;
  const regionData = departmentData?.isPartOfRegion;

  const address = {
    streetAddress: addressData?.["schema:streetAddress"]?.[0] || undefined,
    locality: addressData?.["schema:addressLocality"] || undefined,
    postalCode: addressData?.["schema:postalCode"] || undefined,
    city:
      cityData?.["rdfs:label"]?.fr?.[0] ||
      cityData?.["rdfs:label"]?.en?.[0] ||
      addressData?.["schema:addressLocality"] ||
      undefined,
    department:
      departmentData?.["rdfs:label"]?.fr?.[0] ||
      departmentData?.["rdfs:label"]?.en?.[0] ||
      undefined,
    region:
      regionData?.["rdfs:label"]?.fr?.[0] ||
      regionData?.["rdfs:label"]?.en?.[0] ||
      undefined,
  };

  // Extraire le type de parcours
  const tourType = data["hasTourType"]?.[0]?.["rdfs:label"]?.fr?.[0];

  const paymentMethods = data["offers"]?.[0]?.["schema:acceptedPaymentMethod"]
    ?.map((payment: any) => payment["rdfs:label"]?.fr?.[0])
    .filter(Boolean);

  // Extraire la durée (depuis plusieurs sources possibles)
  let duration: string | undefined;
  if (data["trekData"]?.duration) {
    const hours = parseFloat(data["trekData"].duration);
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h > 0 && m > 0) {
      duration = `${h}h ${m}min`;
    } else if (h > 0) {
      duration = `${h}h`;
    } else {
      duration = `${m}min`;
    }
  } else if (data["trekData"]?.durationMinutes) {
    duration = `${data["trekData"].durationMinutes} min`;
  } else if (data["duration"]) {
    duration = `${data["duration"]} min`;
  }

  let distance: string | undefined;
  if (data["trekData"]?.distance) {
    const dist = parseFloat(data["trekData"].distance);
    distance =
      dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${dist.toFixed(0)} m`;
  } else if (data["trekData"]?.distanceKm) {
    distance = `${parseFloat(data["trekData"].distanceKm).toFixed(1)} km`;
  } else if (data["tourDistance"]) {
    const tourDist = parseFloat(data["tourDistance"]);
    if (!isNaN(tourDist) && tourDist > 0) {
      distance = `${(tourDist / 1000).toFixed(1)} km`;
    }
  }

  const poi: POIData = {
    id: data["@id"] || "",
    name,
    description,
    coordinates,
    type: data["@type"] || [],
    duration,
    distance,
    tourType,
    address,
    creationDate: data["creationDate"],
    lastUpdate: data["lastUpdate"],
    descriptions,
    paymentMethods,
    rawData: data,
  };
  return poi;
}
