export function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const earth_radius = 6371;
  const delta_lat = ((lat2 - lat1) * Math.PI) / 180;
  const delta_lng = ((lng2 - lng1) * Math.PI) / 180;
  const haversineValue =
    Math.sin(delta_lat / 2) * Math.sin(delta_lat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(delta_lng / 2) *
      Math.sin(delta_lng / 2);
  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));
  const distance = earth_radius * centralAngle;
  return distance;
}
