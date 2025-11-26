import ChatBubble from "@/components/ChatBubble";
import MapLibreDOM from "@/components/MapLibreDOM";
import POIBottomSheet from "@/components/POIBottomSheet";
import POISelectionModal from "@/components/POISelectionModal";
import { useUserLocation } from "@/hooks/useUserLocation";
import { POIData } from "../../services/interfaces/dataTourismeParserInterface";
import { styles } from "@/styles/HomeScreen.styles";
import BottomSheet from "@gorhom/bottom-sheet";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function HomeScreen() {
  const [selectedPOI, setSelectedPOI] = useState<POIData | null>(null);
  const [selectedPOIs, setSelectedPOIs] = useState<POIData[]>([]);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [sheetIndex, setSheetIndex] = useState(-1);
  const [shouldRemoveRoute, setShouldRemoveRoute] = useState(false);
  const { userLocation, locationError } = useUserLocation();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handlePOIClick = (poi: POIData) => {
    setSelectedPOI(poi);
    setSheetIndex(0);
  };

  const handlePOIGroupClick = (pois: POIData[]) => {
    setSelectedPOIs(pois);
    setShowSelectionModal(true);
  };

  const handleSelectFromGroup = (poi: POIData) => {
    setSelectedPOI(poi);
    setSheetIndex(0);
  };

  const handleCloseBottomSheet = () => {
    setSheetIndex(-1);
    setSelectedPOI(null);
  };

  const handleMapClick = () => {
    // Fermer le BottomSheet si ouvert
    if (sheetIndex !== -1) {
      handleCloseBottomSheet();
    }
  };

  const handleCloseRoute = () => {
    console.log("🗑️ Demande de fermeture de l'itinéraire");
    setShouldRemoveRoute(true);
  };

  const handleRouteRemoved = () => {
    console.log("✅ Itinéraire supprimé");
    setShouldRemoveRoute(false);
  };

  return (
    <View style={styles.container}>
      {!userLocation ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>
            {locationError || "Récupération de votre position..."}
          </Text>
        </View>
      ) : (
        <MapLibreDOM
          dom={{ matchContents: false }}
          centerLng={userLocation.longitude}
          centerLat={userLocation.latitude}
          //centerLng={1.53347168}
          //centerLat={49.0754815}
          zoom={15}
          enableClustering={true}
          maxPOIs={10000}
          radiusKm={10}
          onPOIClick={handlePOIClick}
          onPOIGroupClick={handlePOIGroupClick}
          onMapClick={handleMapClick}
          shouldRemoveRoute={shouldRemoveRoute}
          onRouteRemoved={handleRouteRemoved}
        />
      )}
      <POIBottomSheet
        ref={bottomSheetRef}
        poi={selectedPOI}
        index={sheetIndex}
        onChange={setSheetIndex}
        onClose={handleCloseBottomSheet}
        onCloseRoute={handleCloseRoute}
      />
      <POISelectionModal
        pois={selectedPOIs}
        visible={showSelectionModal}
        onSelect={handleSelectFromGroup}
        onClose={() => setShowSelectionModal(false)}
      />
      <ChatBubble />
    </View>
  );
}
