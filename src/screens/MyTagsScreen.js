import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, LAYOUT, FONTS, SHADOWS } from '../theme/theme';
import Card from '../components/Card';
import { fetchMyTagsAndVisitors } from '../services/api';

export default function MyTagsScreen({ myName, myNumber }) {
  const [myTags, setMyTags] = useState([]);
  const [myVisitors, setMyVisitors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (myNumber) {
      loadProfileData();
    }
  }, [myNumber]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMyTagsAndVisitors(myNumber);
      setMyTags(data.tags || []);
      setMyVisitors(data.visitors || []);
    } catch (e) {
      console.log('Error loading tags & visitors:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'CG';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getTagStyles = (index) => {
    const colors = [
      { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
      { bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6' },
      { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
      { bg: '#EEF2F6', border: '#E2E8F0', text: '#1E293B' },
      { bg: '#FDF2F8', border: '#FBCFE8', text: '#9D174D' },
      { bg: '#FFF7ED', border: '#FFEDD5', text: '#9A3412' },
    ];
    return colors[index % colors.length];
  };

  const initials = getInitials(myName);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollPadding}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Card */}
      <Card style={styles.profileHeaderCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.profileNameRow}>
          <Text style={styles.profileName}>{myName || 'Pengguna Baru'}</Text>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={COLORS.primary}
            style={styles.verifiedBadge}
          />
        </View>

        <Text style={styles.profilePhone}>{myNumber || 'Tidak Ada Nomor'}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{myTags.length}</Text>
            <Text style={styles.statLabel}>Tag Anda</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{myVisitors.length}</Text>
            <Text style={styles.statLabel}>Pengunjung</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: COLORS.success }]}>98%</Text>
            <Text style={styles.statLabel}>Skor Aman</Text>
          </View>
        </View>
      </Card>

      {/* Tags Section */}
      <Card>
        <Text style={styles.tagSectionTitle}>🏷️ Nama Saya di Kontak Orang Lain</Text>
        <Text style={styles.tagSectionSubtitle}>
          Ini adalah kumpulan nama panggilan Anda yang disimpan di buku alamat pengguna lain.
        </Text>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginVertical: 20 }}
          />
        ) : (
          <View>
            {myTags.length > 0 ? (
              <View style={styles.myTagListGrid}>
                {myTags.map((tag, idx) => {
                  const tagStyle = getTagStyles(idx);
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.tagBadgeStyle,
                        {
                          backgroundColor: tagStyle.bg,
                          borderColor: tagStyle.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="pricetag-outline"
                        size={14}
                        color={tagStyle.text}
                        style={styles.tagBadgeIcon}
                      />
                      <Text style={[styles.tagBadgeText, { color: tagStyle.text }]}>
                        {tag.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Belum Ada Tag Nama ℹ️</Text>
                <Text style={styles.emptySubtitle}>
                  Nomor Anda belum terdaftar di database komunitas. Coba sinkronkan
                  kontak rekan Anda agar nama Anda muncul di sini.
                </Text>
              </View>
            )}
          </View>
        )}
      </Card>

      {/* Visitors Section */}
      <Card>
        <View style={styles.visitorsHeader}>
          <Text style={styles.cardTitle}>👀 Pengunjung Profil</Text>
          <View style={styles.realtimeBadge}>
            <Text style={styles.realtimeText}>REAL-TIME</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>
          Pengguna lain yang mencari nomor telepon Anda baru-baru ini.
        </Text>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginVertical: 20 }}
          />
        ) : myVisitors.length > 0 ? (
          <View style={{ marginTop: 10 }}>
            {myVisitors.map((visitor, idx) => (
              <View key={idx} style={styles.visitorRow}>
                <View style={styles.visitorIconBox}>
                  <Text style={styles.visitorIcon}>👤</Text>
                </View>
                <View style={styles.visitorMeta}>
                  <Text style={styles.visitorName}>
                    {idx === 0
                      ? visitor.viewerName
                      : 'Pengguna Terkunci (Premium)'}
                  </Text>
                  <Text style={styles.visitorDate}>
                    Mencari Anda pada {visitor.date}
                  </Text>
                </View>
                {idx > 0 && (
                  <View style={styles.lockBadge}>
                    <Text style={styles.lockText}>Buka Kunci 🔒</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptySubtitle}>
              Belum ada riwayat kunjungan untuk nomor Anda hari ini.
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
  profileHeaderCard: {
    alignItems: 'center',
    elevation: 3,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.avatar,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: FONTS.weight.black,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  profileName: {
    fontSize: FONTS.size.title,
    fontWeight: FONTS.weight.heavy,
    color: COLORS.darkText,
    marginRight: 6,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  profilePhone: {
    fontSize: FONTS.size.lg,
    color: COLORS.mutedText,
    fontWeight: FONTS.weight.bold,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    width: '100%',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.black,
    color: COLORS.darkText,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.disabledText,
    fontWeight: FONTS.weight.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagSectionTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.black,
    color: COLORS.darkText,
    marginBottom: 6,
  },
  tagSectionSubtitle: {
    fontSize: FONTS.size.base,
    color: COLORS.subtitleText,
    lineHeight: 18,
    marginBottom: 20,
  },
  myTagListGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  tagBadgeStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: LAYOUT.borderRadius.xl,
    marginHorizontal: 6,
    marginVertical: 6,
    borderWidth: 1,
  },
  tagBadgeText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.extraBold,
  },
  tagBadgeIcon: {
    marginRight: 6,
  },
  visitorsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  realtimeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  realtimeText: {
    color: COLORS.primary,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.extraBold,
  },
  visitorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: LAYOUT.borderRadius.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  visitorIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  visitorIcon: {
    fontSize: FONTS.size.xxl,
  },
  visitorMeta: {
    flex: 1,
  },
  visitorName: {
    color: COLORS.darkText,
    fontWeight: FONTS.weight.bold,
    fontSize: FONTS.size.md,
  },
  visitorDate: {
    color: COLORS.mutedText,
    fontSize: FONTS.size.xs,
    marginTop: 2,
  },
  lockBadge: {
    backgroundColor: COLORS.warningBg,
    borderWidth: 1,
    borderColor: COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  lockText: {
    color: COLORS.warning,
    fontSize: 9,
    fontWeight: FONTS.weight.extraBold,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTitle: {
    color: COLORS.warning,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.extraBold,
    marginBottom: 4,
  },
  emptySubtitle: {
    color: COLORS.mutedText,
    fontSize: FONTS.size.base,
    textAlign: 'center',
    lineHeight: 16,
  },
});
