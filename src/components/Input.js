import React, { useState } from 'react';
import { StyleSheet, TextInput, View, Text } from 'react-native';
import { COLORS, LAYOUT, FONTS } from '../theme/theme';

export default function Input({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  style, 
  containerStyle,
  ...props 
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          style
        ]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.mutedText}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    color: COLORS.mutedText,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: LAYOUT.borderRadius.xl,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.darkText,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.medium,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
});
