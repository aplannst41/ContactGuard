import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS, LAYOUT, FONTS } from '../theme/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { AddTagModal, ReportSpamModal } from '../components/Modals';
import { searchPhoneNumber, addTagName, reportSpam } from '../services/api';

export default function SearchScreen({ myName }) {
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Modal states
  const [isAddTagVisible, setIsAddTagVisible] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isReportSpamVisible, setIsReportSpamVisible] = useState(false);
  const [spamReason, setSpamReason] = useState('');

  // Search execution
  const executeSearch = async (overrideNumber = null) => {
    const target = overrideNumber || searchQuery;
    if (!target.trim()) {
      Alert.alert('Error', 'Silakan masukkan nomor telepon terlebih dahulu.');
      return;
    }

    setIsSearchLoading(true);
    setHasSearched(true);

    try {
      const data = await searchPhoneNumber(target.trim());
      setSearchResults(data);
    } catch (e) {
      Alert.alert('Pencarian Gagal', e.message || 'Koneksi gagal ke server.');
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Add tag tag handler
  const executeAddTag = async () => {
    if (!newTagName.trim() || !searchResults) return;

    try {
      const data = await addTagName({
        phone: searchResults.phone,
        name: newTagName.trim(),
        uploader: myName || 'Anonim',
      });

      setIsAddTagVisible(false);
      setNewTagName('');
      Alert.alert(
        'Tag Ditambahkan!',
        `Nama "${data.tag.name}" berhasil disimpan untuk nomor ini.`
      );
      executeSearch(searchResults.phone);
    } catch (e) {
      Alert.alert('Gagal', e.message || 'Terjadi kesalahan koneksi server.');
    }
  };

  // Report spam handler
  const executeReportSpam = async () => {
    if (!spamReason.trim() || !searchResults) return;

    try {
      await reportSpam({
        phone: searchResults.phone,
        reason: spamReason.trim(),
        reporter: myName || 'Anonim',
      });

      setIsReportSpamVisible(false);
      setSpamReason('');
      Alert.alert('Terima Kasih!', `Laporan spam berhasil disimpan.`);
      executeSearch(searchResults.phone);
    } catch (e) {
      Alert.alert('Gagal', e.message || 'Terjadi kesalahan koneksi server.');
    }
  };

  // Trust score coloring
  let trustColor = COLORS.success;
  if (searchResults) {
    if (searchResults.trustScore < 50) trustColor = COLORS.danger;
    else if (searchResults.trustScore < 80) trustColor = COLORS.warning;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollPadding}
      showsVerticalScrollIndicator={false}
    >
      <Card>
        <Text style={styles.cardTitle}>🔍 Lacak Nomor HP</Text>
        <Text style={styles.cardSubtitle}>
          Periksa identitas dan skor keamanan nomor asing secara terpusat.
        </Text>

        <View style={styles.searchRow}>
          <Input
            placeholder="Masukkan nomor (misal: 08123456789)"
            keyboardType="phone-pad"
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={{ flex: 1, marginBottom: 0, marginRight: 10 }}
          />
          <Button
            title="Cari"
            type="primary"
            onPress={() => executeSearch()}
            style={styles.searchBtn}
          />
        </View>

        {/* Presets */}
        <View style={styles.presetContainer}>
          <Text style={styles.presetLabel}>Nomor Demo (Ketuk untuk Menguji):</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={styles.presetBadge}
              onPress={() => {
                setSearchQuery('08123456789');
                executeSearch('08123456789');
              }}
            >
              <Text style={styles.presetText}>🟢 Budi (Aman)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetBadge}
              onPress={() => {
                setSearchQuery('08987654321');
                executeSearch('08987654321');
              }}
            >
              <Text style={styles.presetText}>🔴 Penipu (Spam)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {isSearchLoading && (
        <View style={styles.loaderArea}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderLabel}>Menghubungkan ke database aman...</Text>
        </View>
      )}

      {!isSearchLoading && hasSearched && searchResults && (
        <Card>
          <View style={styles.resultsHeader}>
            <View style={styles.resultsDetails}>
              <Text style={styles.resultPhone}>{searchResults.phone}</Text>
              <View style={styles.tagBadgeOutline}>
                <Text style={styles.resultDesc}>
                  🏷️ {searchResults.tags.length} Tag Terdaftar
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.trustBadge,
                { borderColor: trustColor, backgroundColor: `${trustColor}0D` },
              ]}
            >
              <Text style={[styles.trustTitle, { color: trustColor }]}>
                {searchResults.trustScore}%
              </Text>
              <Text style={styles.trustLabel}>Aman</Text>
            </View>
          </View>

          {/* Trust Level gauge bar */}
          <View style={styles.trustGaugeContainer}>
            <View style={styles.gaugeHeader}>
              <Text style={styles.gaugeLabel}>Tingkat Kepercayaan Komunitas</Text>
              <Text style={[styles.gaugeVal, { color: trustColor }]}>
                {searchResults.trustScore >= 80
                  ? 'Sangat Aman'
                  : searchResults.trustScore >= 50
                  ? 'Netral / Kurang Info'
                  : 'Bahaya / Spam'}
              </Text>
            </View>
            <View style={styles.gaugeBarBackground}>
              <View
                style={[
                  styles.gaugeBarFill,
                  {
                    width: `${searchResults.trustScore}%`,
                    backgroundColor: trustColor,
                  },
                ]}
              />
            </View>
          </View>

          {/* Spam Alert Warnings */}
          {searchResults.spamReports.length > 0 && (
            <View style={styles.spamAlertBox}>
              <Text style={styles.spamAlertText}>
                ⚠️ Laporan Aktivitas Mencurigakan:
              </Text>
              {searchResults.spamReports.map((r, i) => (
                <Text key={i} style={styles.spamReasonText}>
                  • "{r.reason}" (oleh {r.reporter})
                </Text>
              ))}
            </View>
          )}

          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Nama Terdaftar di Database:</Text>
            {searchResults.tags.length > 0 ? (
              searchResults.tags.map((tag, idx) => (
                <View key={idx} style={styles.tagListItem}>
                  <View style={styles.tagItemHeader}>
                    <Text style={styles.tagNameText}>{tag.name}</Text>
                    <Text style={styles.tagDateText}>{tag.date}</Text>
                  </View>
                  <Text style={styles.tagUploaderText}>
                    Diunggah oleh: {tag.uploader}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyTagsBox}>
                <Text style={styles.emptyTagsText}>
                  Belum ada tag nama. Sinkronkan kontak untuk menyumbang nama.
                </Text>
              </View>
            )}
          </View>

          {/* Interactive action buttons */}
          <View style={styles.actionRow}>
            <Button
              title="➕ Tambah Tag"
              type="outline"
              onPress={() => setIsAddTagVisible(true)}
              style={styles.outlineActionBtn}
            />
            <Button
              title="🚨 Laporkan Spam"
              type="outlineDanger"
              onPress={() => setIsReportSpamVisible(true)}
              style={styles.outlineActionBtn}
            />
          </View>
        </Card>
      )}

      {/* Modals */}
      <AddTagModal
        visible={isAddTagVisible}
        phone={searchResults?.phone}
        tagName={newTagName}
        setTagName={setNewTagName}
        onCancel={() => setIsAddTagVisible(false)}
        onConfirm={executeAddTag}
      />

      <ReportSpamModal
        visible={isReportSpamVisible}
        phone={searchResults?.phone}
        reason={spamReason}
        setReason={setSpamReason}
        onCancel={() => setIsReportSpamVisible(false)}
        onConfirm={executeReportSpam}
      />
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBtn: {
    height: 48,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetContainer: {
    marginTop: 15,
  },
  presetLabel: {
    color: COLORS.disabledText,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  presetBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: LAYOUT.borderRadius.md,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetText: {
    color: COLORS.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.extraBold,
  },
  loaderArea: {
    alignItems: 'center',
    marginVertical: 30,
  },
  loaderLabel: {
    color: COLORS.subtitleText,
    marginTop: 10,
    fontSize: FONTS.size.base,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: 15,
    marginBottom: 15,
  },
  resultsDetails: {
    flex: 1,
  },
  resultPhone: {
    fontSize: FONTS.size.title,
    fontWeight: FONTS.weight.extraBold,
    color: COLORS.darkText,
  },
  tagBadgeOutline: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: LAYOUT.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  resultDesc: {
    color: COLORS.secondary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  trustBadge: {
    borderWidth: 2,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.black,
  },
  trustLabel: {
    fontSize: 8,
    color: COLORS.mutedText,
    fontWeight: FONTS.weight.bold,
    textTransform: 'uppercase',
  },
  trustGaugeContainer: {
    marginBottom: 15,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  gaugeLabel: {
    color: COLORS.subtitleText,
    fontSize: FONTS.size.sm,
  },
  gaugeVal: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  gaugeBarBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  gaugeBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  spamAlertBox: {
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: 12,
    marginBottom: 16,
  },
  spamAlertText: {
    color: COLORS.danger,
    fontWeight: FONTS.weight.extraBold,
    fontSize: FONTS.size.base,
    marginBottom: 4,
  },
  spamReasonText: {
    color: COLORS.dangerTextDark,
    fontSize: FONTS.size.sm,
    lineHeight: 15,
    fontStyle: 'italic',
  },
  tagsSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    color: COLORS.darkText,
    fontSize: FONTS.size.base,
    fontWeight: FONTS.weight.bold,
    marginBottom: 10,
  },
  tagListItem: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagNameText: {
    color: COLORS.darkText,
    fontWeight: FONTS.weight.bold,
    fontSize: FONTS.size.md,
  },
  tagDateText: {
    color: COLORS.mutedText,
    fontSize: FONTS.size.xs,
  },
  tagMutedText: {
    color: COLORS.mutedText,
    fontSize: FONTS.size.sm,
  },
  tagUploaderText: {
    color: COLORS.subtitleText,
    fontSize: FONTS.size.sm,
  },
  emptyTagsBox: {
    padding: 15,
    alignItems: 'center',
  },
  emptyTagsText: {
    color: COLORS.mutedText,
    fontSize: FONTS.size.base,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  outlineActionBtn: {
    flex: 0.48,
  },
});
