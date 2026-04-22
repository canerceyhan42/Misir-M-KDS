import React from 'react';
import { Ionicons } from '@expo/vector-icons';

// ─── Disease Icon Map ─────────────────────────────────────────────────────────

const DISEASE_ICON_MAP: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  asfalt_lekesi:    { icon: 'water-outline',           color: '#795548' },
  gri_leke:         { icon: 'cloud-outline',            color: '#607D8B' },
  pas:              { icon: 'alert-circle-outline',     color: '#F57C00' },
  saglikli:         { icon: 'checkmark-circle-outline', color: '#2E7D32' },
  yaprak_kararmasi: { icon: 'flame-outline',            color: '#D32F2F' },
};

const DEFAULT_ICON: { icon: keyof typeof Ionicons.glyphMap; color: string } = {
  icon: 'help-circle-outline',
  color: '#9E9E9E',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface DiseaseIconProps {
  diseaseId: string;
  size: number;
  style?: any;
  accessibilityLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const DiseaseIcon = React.memo(function DiseaseIcon({
  diseaseId,
  size,
  style,
  accessibilityLabel,
}: DiseaseIconProps) {
  const mapping = DISEASE_ICON_MAP[diseaseId] ?? DEFAULT_ICON;

  return (
    <Ionicons
      name={mapping.icon}
      size={size}
      color={mapping.color}
      style={style}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Hastalık ikonu"
      accessible={!!accessibilityLabel}
    />
  );
});

export default DiseaseIcon;
export { DISEASE_ICON_MAP };
