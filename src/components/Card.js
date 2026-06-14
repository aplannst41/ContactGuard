import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS, SHADOWS, LAYOUT } from '../theme/theme';

export default function Card({ children, style, ...props }) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: LAYOUT.borderRadius.xxl,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...SHADOWS.medium,
  },
});
