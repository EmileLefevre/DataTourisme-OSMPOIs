import { POIData } from "../services/interfaces/dataTourismeParserInterface";
import { POISelectionModalProps } from "../services/interfaces/modaleInterface";
import { styles } from "@/styles/POISelectionModal.styles";
import React from "react";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";

export default function POISelectionModal({
  pois,
  visible,
  onSelect,
  onClose,
}: POISelectionModalProps) {
  const renderPOI = ({ item }: { item: POIData }) => (
    <TouchableOpacity
      style={styles.poiItem}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      <Text style={styles.poiName}>{item.name}</Text>
      {item.description && (
        <Text style={styles.poiDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      {item.lastUpdate && (
        <Text style={styles.poiDate}>
          {new Date(item.lastUpdate).toLocaleDateString("fr-FR")}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.container}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {pois.length} événements au même endroit
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={pois}
            renderItem={renderPOI}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
