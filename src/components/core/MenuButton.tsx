import AppIcon from '@icons/AppIcon';
import StyleContext from '@styles/StyleContext';
import React, { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import space from '@styles/space';

interface Props {
  icon?: string;
  title: string;
  description?: string;
  onPress: () => void;
  disabled?: boolean;
  last?: boolean;
}

export default function MenuButton({ icon, title, description, onPress, disabled, last }: Props) {
  const { borderStyle, colors, typography } = useContext(StyleContext);
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <View style={[styles.row, space.paddingTopS, space.paddingBottomS, borderStyle, !last ? styles.border : undefined]}>
        { !!icon && (
          <View style={[styles.icon, space.marginRightXs]}>
            <AppIcon name={icon} size={28} color={colors.M} />
          </View>
        ) }
        <View style={styles.column}>
          <Text style={typography.menuText}>
            { title }
          </Text>
          <Text style={[typography.smallLabel, typography.italic, { color: colors.M}]}>
            { description }
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  icon: {
    width: 32,
    height: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});
