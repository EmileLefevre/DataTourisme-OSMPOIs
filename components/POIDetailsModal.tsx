import { POIData } from "@/services/interfaces/dataTourismeParserInterface";
import { extractPhotoURLs } from "@/services/specialPOIService";
import { styles } from "@/styles/POIDetailsModal.styles";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const WINDOW_WIDTH = Dimensions.get("window").width;

interface POIDetailsModalProps {
  poi: POIData;
  onClose: () => void;
  onNavigate?: () => void;
}

export default function POIDetailsModal({
  poi,
  onClose,
}: POIDetailsModalProps) {
  const [selectedLang, setSelectedLang] = useState("fr");
  const isTour =
    poi.type.includes("WalkingTour") || poi.type.includes("CyclingTour");

  const availableLanguages =
    poi.descriptions && Object.keys(poi.descriptions).length > 0
      ? Object.keys(poi.descriptions)
      : ["fr"];

  // Extraire les photos si disponibles
  const photos = extractPhotoURLs(poi);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handlePhotoScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (WINDOW_WIDTH - 32));
    setCurrentPhotoIndex(index);
  };

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
  const contacts = poi.rawData?.hasContact?.[0];
  const email = contacts?.["schema:email"]?.[0];
  const telephone = contacts?.["schema:telephone"]?.[0];
  const website = contacts?.["foaf:homepage"]?.[0];

  // Extraire les features/équipements et filtrer celles sans label
  const features = poi.rawData?.hasFeature
    ?.map((feature: any) => ({
      label: feature["rdfs:label"]?.fr?.[0] || feature["rdfs:label"]?.en?.[0],
      value: feature["schema:value"],
    }))
    .filter((feature: any) => feature.label); // Ne garder que les features avec un label

  const identifier = poi.rawData?.["dc:identifier"];

  return (
    <Modal
      visible={true}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      transparent={false}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{poi.name}</Text>
            <View style={styles.spacer} />
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            bounces={true}
          >
            <View style={styles.section}>
              {identifier && (
                <Text style={styles.identifier}>ID: {identifier}</Text>
              )}

              <View style={styles.typesContainer}>
                {poi.type.map((type: string, index: number) => (
                  <View key={index} style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{type}</Text>
                  </View>
                ))}
              </View>

              {availableLanguages.length > 1 && (
                <View style={styles.langSection}>
                  <Text style={styles.sectionTitle}>🌐 Langue</Text>
                  <View style={styles.langButtons}>
                    {availableLanguages.map((lang) => (
                      <TouchableOpacity
                        key={lang}
                        onPress={() => setSelectedLang(lang)}
                        style={[
                          styles.langButton,
                          selectedLang === lang && styles.langButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.langButtonText,
                            selectedLang === lang &&
                              styles.langButtonTextActive,
                          ]}
                        >
                          {lang.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {isTour && (
                <View style={styles.tourInfo}>
                  {poi.duration && (
                    <Text style={styles.tourItem}>
                      ⏱️ Durée : {poi.duration}
                    </Text>
                  )}
                  {poi.distance && (
                    <Text style={styles.tourItem}>
                      📏 Distance : {poi.distance}
                    </Text>
                  )}
                  {poi.tourType && (
                    <Text style={styles.tourItem}>
                      🔄 Type : {poi.tourType}
                    </Text>
                  )}
                </View>
              )}

              {poi.descriptions && poi.descriptions[selectedLang] && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.sectionTitle}>📝 Description</Text>
                  <Text style={styles.descriptionText}>
                    {poi.descriptions[selectedLang]}
                  </Text>
                </View>
              )}

              {photos.length > 0 && (
                <View style={styles.photosSection}>
                  <Text style={styles.sectionTitle}>
                    📷 Photos ({Math.min(photos.length, 5)})
                  </Text>
                  <FlatList
                    data={photos.slice(0, 5)}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handlePhotoScroll}
                    scrollEventThrottle={16}
                    decelerationRate="fast"
                    snapToAlignment="center"
                    snapToInterval={WINDOW_WIDTH - 32}
                    contentContainerStyle={styles.carouselContainer}
                    keyExtractor={(item, index) => `photo-${index}`}
                    renderItem={({ item }) => (
                      <Image
                        source={{ uri: item }}
                        style={[styles.photo, { width: WINDOW_WIDTH - 32 }]}
                        resizeMode="cover"
                      />
                    )}
                  />
                  {photos.length > 1 && (
                    <View style={styles.dotsContainer}>
                      {photos.slice(0, 5).map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.dot,
                            index === currentPhotoIndex && styles.dotActive,
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}

              {(email || telephone || website) && (
                <View style={styles.contactSection}>
                  <Text style={styles.sectionTitle}>📞 Contact</Text>
                  {telephone && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${telephone}`)}
                    >
                      <Text style={styles.contactItem}>
                        <Text style={styles.bold}>Téléphone : </Text>
                        <Text style={styles.link}>{telephone}</Text>
                      </Text>
                    </TouchableOpacity>
                  )}
                  {email && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`mailto:${email}`)}
                    >
                      <Text style={styles.contactItem}>
                        <Text style={styles.bold}>Email : </Text>
                        <Text style={styles.link}>{email}</Text>
                      </Text>
                    </TouchableOpacity>
                  )}
                  {website && (
                    <TouchableOpacity onPress={() => Linking.openURL(website)}>
                      <Text style={styles.contactItem}>
                        <Text style={styles.bold}>Site web : </Text>
                        <Text style={styles.link}>{website}</Text>
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {formattedAddress && (
                <View style={styles.addressSection}>
                  <Text style={styles.sectionTitle}>📍 Adresse</Text>
                  <Text style={styles.addressText}>{formattedAddress}</Text>
                </View>
              )}

              <View style={styles.gpsSection}>
                <Text style={styles.sectionTitle}>🌍 Coordonnées GPS</Text>
                <Text style={styles.gpsText}>
                  Latitude: {poi.coordinates.lat.toFixed(6)} / Longitude:{" "}
                  {poi.coordinates.lng.toFixed(6)}
                </Text>
              </View>

              {poi.paymentMethods && poi.paymentMethods.length > 0 && (
                <View style={styles.paymentSection}>
                  <Text style={styles.sectionTitle}>
                    💳 Moyens de paiement acceptés
                  </Text>
                  <View style={styles.badgesContainer}>
                    {poi.paymentMethods.map((method: string, index: number) => (
                      <View key={index} style={styles.paymentBadge}>
                        <Text style={styles.badgeText}>{method}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {features && features.length > 0 && (
                <View style={styles.featuresSection}>
                  <Text style={styles.sectionTitle}>
                    ⚙️ Équipements & Services
                  </Text>
                  <View style={styles.badgesContainer}>
                    {features.map((feature: any, index: number) => (
                      <View key={index} style={styles.featureBadge}>
                        <Text style={styles.badgeText}>
                          {feature.label}
                          {feature.value && ` (${feature.value})`}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.datesSection}>
                {poi.creationDate && (
                  <Text style={styles.dateText}>
                    <Text style={styles.bold}>Créé le : </Text>
                    {new Date(poi.creationDate).toLocaleDateString("fr-FR")}
                  </Text>
                )}
                {poi.lastUpdate && (
                  <Text style={styles.dateText}>
                    <Text style={styles.bold}>Mis à jour le : </Text>
                    {new Date(poi.lastUpdate).toLocaleDateString("fr-FR")}
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
