/**
 * Script pour créer un index spatial léger de tous les POIs
 * Extrait uniquement : id, nom, coordonnées, type et chemin du fichier
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POIs_DIR = path.join(__dirname, "../public/POIs/objects");
const OUTPUT_FILE = path.join(__dirname, "../public/POIs/poi-index.json");

function extractPOIInfo(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(content);

    // Extraire les coordonnées
    const location = data["isLocatedAt"]?.[0];
    const geo = location?.["schema:geo"];

    if (!geo) return null;

    const lng = parseFloat(geo["schema:longitude"]);
    const lat = parseFloat(geo["schema:latitude"]);

    if (isNaN(lng) || isNaN(lat)) return null;

    // Extraire le nom
    const name =
      data["rdfs:label"]?.fr?.[0] ||
      data["rdfs:label"]?.en?.[0] ||
      "POI sans nom";

    // Extraire le type
    const types = data["@type"] || [];

    // Créer un chemin relatif pour charger le fichier plus tard
    const relativePath = path.relative(POIs_DIR, filePath);

    // Déterminer la source selon le chemin
    const source = relativePath.includes("hiking_paths") ? "hiking" : "poi";

    return {
      id: data["@id"],
      name,
      coordinates: { lng, lat },
      types,
      filePath: relativePath,
      source, // Ajouter la source (poi ou hiking)
    };
  } catch (error) {
    console.error(`Erreur lors du traitement de ${filePath}:`, error.message);
    return null;
  }
}

function scanDirectory(dir) {
  const pois = [];

  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        const poiInfo = extractPOIInfo(fullPath);
        if (poiInfo) {
          pois.push(poiInfo);
        }
      }
    }
  }
  scan(dir);
  return pois;
}

const startTime = Date.now();

const pois = scanDirectory(POIs_DIR);

// Compter les POI par source
const hikingCount = pois.filter((poi) => poi.source === "hiking").length;
const normalCount = pois.filter((poi) => poi.source === "poi").length;

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`${pois.length} POIs trouvés en ${duration}s`);
console.log(`  - ${normalCount} POIs normaux`);
console.log(`  - ${hikingCount} POIs hiking (violet)`);

// Créer le répertoire de sortie si nécessaire
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Écrire l'index
fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(
    { pois, totalCount: pois.length, generatedAt: new Date().toISOString() },
    null,
    2
  )
);

console.log(`Index créé: ${OUTPUT_FILE}`);
console.log(
  `📊 Taille du fichier: ${(
    fs.statSync(OUTPUT_FILE).size /
    1024 /
    1024
  ).toFixed(2)} MB`
);
