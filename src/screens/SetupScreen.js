import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, LAYOUT, FONTS } from '../theme/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

export default function SetupScreen({
  myName,
  setMyName,
  myNumber,
  setMyNumber,
  onSetupComplete,
}) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.centerScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandContainer}>
            <Image
              source={require('../../assets/icon.jpg')}
              style={styles.brandIconImage}
            />
            <Text style={styles.brandLogo}>ContactGuard</Text>
            <Text style={styles.brandSlogan}>Smart Caller ID & Spam Shield</Text>
          </View>

          <Card style={styles.setupCard}>
            <Text style={styles.setupTitle}>Mulai Pengamanan</Text>
            <Text style={styles.setupSubtitle}>
              Masukkan nomor telepon untuk memverifikasi kontak Anda secara instan.
            </Text>

            <Input
              label="Nama Lengkap Anda"
              placeholder="Contoh: Budi Santoso"
              value={myName}
              onChangeText={setMyName}
            />

            <Input
              label="Nomor HP Anda"
              placeholder="Contoh: 081299998888"
              value={myNumber}
              onChangeText={setMyNumber}
              keyboardType="phone-pad"
            />

            <Button
              title="Mulai Lindungi"
              type="primary"
              onPress={onSetupComplete}
              style={{ marginTop: 10 }}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.isLargeScreen ? '15%' : 20,
    paddingVertical: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 35,
  },
  brandIconImage: {
    width: 90,
    height: 90,
    borderRadius: 26,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  brandLogo: {
    fontSize: FONTS.size.logo,
    fontWeight: FONTS.weight.black,
    color: COLORS.darkText,
    letterSpacing: 0.5,
  },
  brandSlogan: {
    fontSize: FONTS.size.md,
    color: COLORS.primary,
    marginTop: 6,
    fontWeight: FONTS.weight.extraBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  setupCard: {
    elevation: 4,
  },
  setupTitle: {
    fontSize: FONTS.size.title,
    fontWeight: FONTS.weight.black,
    color: COLORS.darkText,
    marginBottom: 8,
  },
  setupSubtitle: {
    color: COLORS.subtitleText,
    fontSize: FONTS.size.md,
    lineHeight: 18,
    marginBottom: 20,
  },
});
