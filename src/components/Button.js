import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, SHADOWS, LAYOUT, FONTS } from '../theme/theme';

export default function Button({ 
  onPress, 
  title, 
  type = 'primary', 
  loading = false, 
  disabled = false, 
  style, 
  textStyle, 
  children,
  ...props 
}) {
  const isPrimary = type === 'primary';
  const isDanger = type === 'danger';
  const isOutline = type === 'outline';
  const isOutlineDanger = type === 'outlineDanger';

  const buttonStyles = [
    styles.button,
    isPrimary && styles.primaryButton,
    isDanger && styles.dangerButton,
    isOutline && styles.outlineButton,
    isOutlineDanger && styles.outlineDangerButton,
    (disabled || loading) && styles.disabledButton,
    style
  ];

  const labelStyles = [
    styles.text,
    isPrimary && styles.primaryText,
    isDanger && styles.dangerText,
    isOutline && styles.outlineText,
    isOutlineDanger && styles.outlineDangerText,
    disabled && styles.disabledText,
    textStyle
  ];

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled || loading} 
      style={buttonStyles} 
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={isOutline || isOutlineDanger ? COLORS.primary : '#FFFFFF'} 
        />
      ) : children ? (
        children
      ) : (
        <Text style={labelStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: LAYOUT.borderRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  dangerButton: {
    backgroundColor: COLORS.danger,
    ...SHADOWS.small,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
  },
  outlineDangerButton: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.02)',
  },
  disabledButton: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.extraBold,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: COLORS.primary,
  },
  outlineDangerText: {
    color: COLORS.danger,
  },
  disabledText: {
    color: COLORS.disabledText,
  },
});
