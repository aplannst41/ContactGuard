import React from 'react';
import { StyleSheet, Text, View, Modal } from 'react-native';
import { COLORS, SHADOWS, LAYOUT, FONTS } from '../theme/theme';
import Button from './Button';
import Input from './Input';

/**
 * AddTagModal Component
 */
export function AddTagModal({
  visible,
  phone,
  tagName,
  setTagName,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Tambah Tag Baru</Text>
          <Text style={styles.modalSubtitle}>
            Berikan usulan nama panggilan untuk nomor: {phone}
          </Text>

          <Input
            placeholder="Contoh: Budi Kerja, Agus Sopir"
            value={tagName}
            onChangeText={setTagName}
          />

          <View style={styles.modalActionRow}>
            <Button
              title="Batal"
              type="outline"
              onPress={onCancel}
              style={styles.modalBtn}
            />
            <Button
              title="Simpan"
              type="primary"
              onPress={onConfirm}
              style={styles.modalBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * ReportSpamModal Component
 */
export function ReportSpamModal({
  visible,
  phone,
  reason,
  setReason,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Laporkan Penipuan / Spam</Text>
          <Text style={styles.modalSubtitle}>
            Bantu lindungi orang lain dengan melaporkan nomor {phone}
          </Text>

          <Input
            placeholder="Sebutkan jenis penipuan (misal: Robot Call / Hadiah Palsu)"
            value={reason}
            onChangeText={setReason}
          />

          <View style={styles.modalActionRow}>
            <Button
              title="Batal"
              type="outline"
              onPress={onCancel}
              style={styles.modalBtn}
            />
            <Button
              title="Kirim Laporan"
              type="danger"
              onPress={onConfirm}
              style={styles.modalBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: COLORS.background,
    borderRadius: LAYOUT.borderRadius.xxl,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  modalTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.extraBold,
    color: COLORS.darkText,
    marginBottom: 6,
  },
  modalSubtitle: {
    color: COLORS.subtitleText,
    fontSize: FONTS.size.base,
    lineHeight: 16,
    marginBottom: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalBtn: {
    flex: 0.48,
  },
});
