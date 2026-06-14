import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, LAYOUT, FONTS } from '../theme/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import { syncContacts } from '../services/api';
import {
  getContactsPermissionStatus,
  requestContactsPermission as requestOSContactsPermission,
  getLocalContacts,
} from '../services/contacts';

export default function SyncScreen({ myName }) {
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [localContacts, setLocalContacts] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    checkPermissionAndLoad();
  }, []);

  const checkPermissionAndLoad = async () => {
    try {
      const status = await getContactsPermissionStatus();
      setPermissionStatus(status);

      const storedSyncedStatus = await AsyncStorage.getItem('@getcontact_is_synced');
      if (storedSyncedStatus === 'true') {
        setIsSynced(true);
      }

      if (status === 'granted') {
        const contacts = await getLocalContacts();
        setLocalContacts(contacts);
      }
    } catch (e) {
      console.log('Error checking contacts permission:', e);
    }
  };

  const handleRequestPermission = async () => {
    try {
      const status = await requestOSContactsPermission();
      setPermissionStatus(status);
      if (status === 'granted') {
        const contacts = await getLocalContacts();
        setLocalContacts(contacts);
      } else {
        Alert.alert(
          'Izin Kontak Ditolak',
          'Aplikasi membutuhkan izin untuk menyimulasikan fitur sinkronisasi kontak.'
        );
      }
    } catch (e) {
      console.log('Error requesting contacts permission:', e);
    }
  };

  const handleSync = async () => {
    if (localContacts.length === 0) {
      Alert.alert('Info', 'Tidak ada kontak di perangkat untuk diunggah.');
      return;
    }

    setIsSyncing(true);

    try {
      const data = await syncContacts({
        contacts: localContacts,
        uploaderName: myName || 'Anonim',
      });

      setIsSynced(true);
      await AsyncStorage.setItem('@getcontact_is_synced', 'true');
      Alert.alert('Sinkronisasi Berhasil!', data.message);
    } catch (e) {
      Alert.alert('Gagal Sinkronisasi', e.message || 'Gagal terhubung ke server.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollPadding}
      showsVerticalScrollIndicator={false}
    >
      <Card>
        <View style={styles.syncStatusHeader}>
          <Text style={styles.cardTitle}>📦 Database Buku Alamat</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isSynced ? COLORS.success : COLORS.warning },
            ]}
          >
            <Text style={styles.statusText}>
              {isSynced ? 'Sudah Sinkron' : 'Belum Sinkron'}
            </Text>
          </View>
        </View>

        <Text style={styles.cardSubtitle}>
          Unggah relasi nama di daftar kontak perangkat Anda ke database crowdsourcing
          untuk membangun sistem keamanan yang lebih kuat bagi sesama.
        </Text>

        {permissionStatus !== 'granted' ? (
          <Button
            title="Berikan Izin Akses Kontak"
            type="primary"
            onPress={handleRequestPermission}
            style={styles.syncBtn}
          />
        ) : (
          <View>
            <Text style={styles.contactsCountText}>
              Ditemukan <Text style={styles.highlight}>{localContacts.length}</Text>{' '}
              kontak di buku telepon perangkat Anda.
            </Text>

            {/* Responsive horizontal preview scroll */}
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              style={styles.previewScroll}
            >
              {localContacts.slice(0, 5).map((item, idx) => (
                <View key={idx} style={styles.previewChip}>
                  <Text style={styles.previewName}>{item.name}</Text>
                  <Text style={styles.previewPhone}>
                    {item.phoneNumbers?.[0]?.number || 'Tanpa Nomor'}
                  </Text>
                </View>
              ))}
              {localContacts.length > 5 && (
                <View style={styles.previewChipMore}>
                  <Text style={styles.previewMoreText}>
                    +{localContacts.length - 5} Lainnya
                  </Text>
                </View>
              )}
            </ScrollView>

            <Button
              title={
                isSynced
                  ? 'Sinkron Ulang Sekarang'
                  : 'Unggah & Sinkronisasikan Sekarang'
              }
              type={isSynced ? 'outline' : 'primary'}
              onPress={handleSync}
              loading={isSyncing}
              style={styles.syncBtn}
            />
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
  syncStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.black,
    textTransform: 'uppercase',
  },
  contactsCountText: {
    color: COLORS.darkText,
    fontSize: FONTS.size.md,
    marginBottom: 12,
  },
  highlight: {
    color: COLORS.primary,
    fontWeight: FONTS.weight.extraBold,
  },
  previewScroll: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  previewChip: {
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: LAYOUT.borderRadius.md,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 100,
  },
  previewName: {
    color: COLORS.darkText,
    fontWeight: FONTS.weight.bold,
    fontSize: FONTS.size.sm,
  },
  previewPhone: {
    color: COLORS.mutedText,
    fontSize: 9,
    marginTop: 2,
  },
  previewChipMore: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewMoreText: {
    color: COLORS.primary,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
  },
  syncBtn: {
    marginTop: 10,
  },
});
