const getCityPolygon = async (cityName) => {
  const query = `
    [out:json];
    relation["boundary"="administrative"]["name"="${cityName}"];
    out geom;
  `;
  const response = await fetch(
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
  );
  const data = await response.json();

  const coords = data.elements?.[0]?.members
    ?.filter((m) => m.geometry)
    ?.flatMap((m) => m.geometry.map((g) => [g.lon, g.lat]));

  console.log("Coordonnées récupérées :", coords);
  return coords;
};

// Exemple d'appel :
getCityPolygon("Lyon")
  .then((coords) => {
    console.log("Coordonnées finales :", coords);
  })
  .catch((error) => {
    console.error("Erreur :", error);
  });
