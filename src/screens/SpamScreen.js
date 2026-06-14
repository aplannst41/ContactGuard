import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, LAYOUT, FONTS } from '../theme/theme';
import Card from '../components/Card';

export default function SpamScreen() {
  const [spamProtection, setSpamProtection] = useState(true);
  const [blockedCallsLog] = useState([
    { id: '1', phone: '+628999000111', reason: 'Penipu Berkedok CS Bank', time: '1 jam yang lalu' },
    { id: '2', phone: '+62888777666', reason: 'Tawaran Pinjaman Online Ilegal', time: '5 jam yang lalu' }
  ]);

  useEffect(() => {
    loadSpamProtectState();
  }, []);

  const loadSpamProtectState = async () => {
    try {
      const storedSpamProtect = await AsyncStorage.getItem('@getcontact_spam_protect');
      if (storedSpamProtect !== null) {
        setSpamProtection(storedSpamProtect === 'true');
      }
    } catch (e) {
      console.log('Error loading spam protect state:', e);
    }
  };

  const handleToggleSpamProtection = async (value) => {
    setSpamProtection(value);
    try {
      await AsyncStorage.setItem('@getcontact_spam_protect', value ? 'true' : 'false');
    } catch (e) {
      console.log('Error saving spam protect state:', e);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollPadding}
      showsVerticalScrollIndicator={false}
    >
      <Card>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1, marginRight: 15 }}>
            <Text style={styles.cardTitle}>🛡️ Proteksi Spam Aktif</Text>
            <Text style={styles.cardSubtitle}>
              Secara otomatis memblokir dan memberi peringatan untuk panggilan masuk dari nomor yang masuk daftar hitam.
            </Text>
          </View>
          <Switch
            value={spamProtection}
            onValueChange={handleToggleSpamProtection}
            trackColor={{ false: COLORS.darkText, true: COLORS.primary }}
            thumbColor={spamProtection ? COLORS.secondary : COLORS.mutedText}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>🚫 Log Panggilan Terblokir (Hari Ini)</Text>
        <Text style={styles.cardSubtitle}>Daftar panggilan penipuan yang otomatis dibungkam.</Text>

        {spamProtection ? (
          <FlatList
            data={blockedCallsLog}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.blockedRow}>
                <View style={styles.blockedWarningBox}>
                  <Text style={styles.blockedWarningIcon}>🚫</Text>
                </View>
                <View style={styles.blockedMeta}>
                  <Text style={styles.blockedPhone}>{item.phone}</Text>
                  <Text style={styles.blockedReason}>{item.reason}</Text>
                </View>
                <Text style={styles.blockedTime}>{item.time}</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.disabledSpamAlert}>
            <Text style={styles.disabledSpamText}>
              ⚠️ Proteksi Dinonaktifkan. Anda rentan menerima panggilan penipuan.
            </Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollPadding: {
    paddingHorizontal: LAYOUT.padding,
    paddingTop: 20,
    paddingBottom: 110,
  },
  cardTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.black,
    color: COLORS.darkText,
    marginBottom: 6,
  },
  cardSubtitle: {
    color: COLORS.subtitleText,
    fontSize: FONTS.size.base,
    lineHeight: 18,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  blockedWarningBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  blockedWarningIcon: {
    fontSize: FONTS.size.lg,
  },
  blockedMeta: {
    flex: 1,
  },
  blockedPhone: {
    color: COLORS.darkText,
    fontWeight: FONTS.weight.bold,
    fontSize: FONTS.size.md,
  },
  blockedReason: {
    color: COLORS.danger,
    fontSize: FONTS.size.sm,
    marginTop: 2,
  },
  blockedTime: {
    color: COLORS.mutedText,
    fontSize: FONTS.size.sm,
  },
  disabledSpamAlert: {
    padding: 15,
    backgroundColor: COLORS.warningBg,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    borderRadius: LAYOUT.borderRadius.lg,
    alignItems: 'center',
  },
  disabledSpamText: {
    color: COLORS.warningTextDark,
    fontSize: FONTS.size.base,
    textAlign: 'center',
    fontWeight: FONTS.weight.semibold,
  },
});
