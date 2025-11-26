import * as Location from "expo-location";
import { useEffect, useState } from "react";

const DEFAULT_LOCATION = {
  latitude: 49.44223209259255,
  longitude: 1.0964442584504468,
};

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Permission de géolocalisation refusée");
          setUserLocation(DEFAULT_LOCATION);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        console.log("[React Native] Position GPS récupérée:", location.coords);
      } catch (error) {
        console.error("[React Native] Erreur géolocalisation:", error);
        setLocationError("Erreur lors de la récupération de la position");
        setUserLocation(DEFAULT_LOCATION);
      }
    })();
  }, []);

  return { userLocation, locationError };
}
