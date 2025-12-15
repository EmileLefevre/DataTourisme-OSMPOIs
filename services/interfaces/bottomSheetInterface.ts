import { POIData } from "./dataTourismeParserInterface";

export interface POIBottomSheetProps {
  poi: POIData | null;
  index?: number;
  onChange?: (index: number) => void;
  onClose: () => void;
  onCloseRoute?: () => void;
}
