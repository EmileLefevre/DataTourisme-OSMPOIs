import { POIData } from "./dataTourismeParserInterface";

export interface POIDetailsModalProps {
  poi: POIData;
  onClose: () => void;
  onNavigate?: () => void;
}

export interface POISelectionModalProps {
  pois: POIData[];
  visible: boolean;
  onSelect: (poi: POIData) => void;
  onClose: () => void;
}
