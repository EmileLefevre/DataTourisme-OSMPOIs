import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: 8,
    color: COLORS.textSecondary,
  },
  spacer: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  navigateButton: {
    backgroundColor: COLORS.primary,
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navigateButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    padding: 16,
  },
  identifier: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  typesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  typeBadge: {
    backgroundColor: COLORS.badgeBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeBadgeText: {
    fontSize: 12,
    color: COLORS.badgeBlueDark,
    fontWeight: "500",
  },
  langSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  langButtons: {
    flexDirection: "row",
    gap: 8,
  },
  langButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  langButtonActive: {
    backgroundColor: COLORS.info,
    borderColor: COLORS.info,
  },
  langButtonText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  langButtonTextActive: {
    color: COLORS.background,
  },
  tourInfo: {
    backgroundColor: COLORS.backgroundTertiary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  tourItem: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    lineHeight: 20,
  },
  photosSection: {
    marginBottom: 16,
  },
  carouselContainer: {
    paddingVertical: 8,
  },
  photo: {
    height: 200,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundTertiary,
    marginHorizontal: 0,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textMuted,
    opacity: 0.3,
  },
  dotActive: {
    backgroundColor: COLORS.info,
    opacity: 1,
    width: 24,
  },
  contactSection: {
    marginBottom: 16,
  },
  contactItem: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginBottom: 8,
  },
  bold: {
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  link: {
    color: COLORS.info,
    textDecorationLine: "underline",
  },
  addressSection: {
    marginBottom: 16,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
  gpsSection: {
    marginBottom: 16,
  },
  gpsText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontFamily: "monospace",
  },
  paymentSection: {
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paymentBadge: {
    backgroundColor: COLORS.badgeOrange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ffb74d",
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.badgeOrangeDark,
  },
  featuresSection: {
    marginBottom: 16,
  },
  featureBadge: {
    backgroundColor: COLORS.badgeGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#81c784",
  },
  datesSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    marginBottom: 32,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
});
