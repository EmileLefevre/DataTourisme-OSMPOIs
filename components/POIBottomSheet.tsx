import { POIBottomSheetProps } from "../services/interfaces/bottomSheetInterface";
import { extractPhotoURLs } from "@/services/specialPOIService";
import {
  startNavigation,
  setFollowMode as setThreeboxFollowMode,
} from "@/services/threeboxServiceDOM";
import { styles } from "@/styles/POIBottomSheet.styles";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { forwardRef, useMemo, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import POIDetailsModal from "./POIDetailsModal";

const POIBottomSheet = forwardRef<BottomSheet, POIBottomSheetProps>(
  ({ poi, index, onChange, onClose, onCloseRoute }, ref) => {
    const snapPoints = useMemo(() => ["35%", "50%", "90%"], []);
    const [showModal, setShowModal] = useState(false);

    if (!poi) return null;

    const isTour =
      poi.type.includes("WalkingTour") || poi.type.includes("CyclingTour");
    const isHikingPOI = poi.source === "hiking";

    const getFormattedAddress = () => {
      if (!poi.address) return null;

      const parts: string[] = [];

      if (poi.address.streetAddress) {
        parts.push(poi.address.streetAddress);
      }
      const cityParts: string[] = [];

      if (poi.address.postalCode) cityParts.push(poi.address.postalCode);
      if (poi.address.city) {
        cityParts.push(poi.address.city);
      } else if (poi.address.locality) {
        cityParts.push(poi.address.locality);
      }

      if (cityParts.length > 0) {
        parts.push(cityParts.join(" "));
      }

      return parts.length > 0 ? parts.join(", ") : null;
    };

    const formattedAddress = getFormattedAddress();
    const photos = extractPhotoURLs(poi);
    const firstPhoto = photos.length > 0 ? photos[0] : null;

    const handleNavigate = () => {
      console.log("[POIBottomSheet] Navigation vers:", poi.coordinates);
      startNavigation(poi.coordinates.lng, poi.coordinates.lat, true);
      setThreeboxFollowMode(true);
      onClose();
    };

    return (
      <BottomSheet
        ref={ref}
        index={index ?? -1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={onChange}
        onClose={onClose}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetScrollView style={styles.contentContainer}>
          <Text style={styles.title}>{poi.name}</Text>

          {(isTour || isHikingPOI) &&
            (poi.duration || poi.distance || poi.tourType) && (
              <View style={styles.tourBadges}>
                {poi.duration && (
                  <Text style={styles.badge}>⏱️ {poi.duration}</Text>
                )}
                {poi.distance && (
                  <Text style={styles.badge}>📏 {poi.distance}</Text>
                )}
                {poi.tourType && (
                  <Text style={styles.badge}>🔄 {poi.tourType}</Text>
                )}
              </View>
            )}

          {firstPhoto && (
            <Image
              source={{ uri: firstPhoto }}
              style={styles.photo}
              resizeMode="cover"
            />
          )}

          {poi.description && (
            <Text style={styles.description}>{poi.description}</Text>
          )}

          {formattedAddress && (
            <Text style={styles.address}>Adresse : {formattedAddress}</Text>
          )}

          {poi.paymentMethods && poi.paymentMethods.length > 0 && (
            <Text style={styles.payment}>
              Moyen de payement accepté : {poi.paymentMethods.join(", ")}
            </Text>
          )}

          {poi.lastUpdate && (
            <Text style={styles.update}>
              Mis à jour le{" "}
              {new Date(poi.lastUpdate).toLocaleDateString("fr-FR")}
            </Text>
          )}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.buttonText}>📖 En savoir plus</Text>
            </TouchableOpacity>
            {isHikingPOI && onCloseRoute && (
              <TouchableOpacity
                style={[styles.detailsButton, styles.closeRouteButton]}
                onPress={() => {
                  onCloseRoute();
                  onClose();
                }}
              >
                <Text style={styles.buttonText}>
                  ✖️ Fermer l&apos;itinéraire
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {showModal && (
            <POIDetailsModal
              poi={poi}
              onClose={() => setShowModal(false)}
              onNavigate={handleNavigate}
            />
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

POIBottomSheet.displayName = "POIBottomSheet";

export default POIBottomSheet;
