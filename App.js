import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Switch,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Dynamically detect the computer's Local IP address running the Expo Metro Bundler
// This eliminates the need for manual API URL settings
const getLocalApiUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.developer?.toolConnection || Constants.manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return 'http://localhost:3000'; // Fallback for local simulators or web testing
};

const API_URL = getLocalApiUrl();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

function MainApp() {
  // Navigation & Setup states
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [myNumber, setMyNumber] = useState('');
  const [myName, setMyName] = useState('');
  const [activeTab, setActiveTab] = useState('search'); // search | mytags | spam | sync
  
  // Modals
  const [isAddTagVisible, setIsAddTagVisible] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isReportSpamVisible, setIsReportSpamVisible] = useState(false);
  const [spamReason, setSpamReason] = useState('');

  // Cari (Search) States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Tag Saya States
  const [myTags, setMyTags] = useState([]);
  const [myVisitors, setMyVisitors] = useState([]);
  const [isMyTagsLoading, setIsMyTagsLoading] = useState(false);

  // Proteksi States
  const [spamProtection, setSpamProtection] = useState(true);
  const [blockedCallsLog, setBlockedCallsLog] = useState([
    { id: '1', phone: '+628999000111', reason: 'Penipu Berkedok CS Bank', time: '1 jam yang lalu' },
    { id: '2', phone: '+62888777666', reason: 'Tawaran Pinjaman Online Ilegal', time: '5 jam yang lalu' }
  ]);

  // Sinkronisasi States
  const [localContacts, setLocalContacts] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  // Initial load
  useEffect(() => {
    loadAppState();
    checkContactsPermission();
  }, []);

  // Fetch own tags if setup completed
  useEffect(() => {
    if (isSetupComplete && myNumber) {
      fetchMyTags();
    }
  }, [isSetupComplete, myNumber]);

  // Load configuration from local storage
  const loadAppState = async () => {
    try {
      const storedNumber = await AsyncStorage.getItem('@getcontact_my_number');
      const storedName = await AsyncStorage.getItem('@getcontact_my_name');
      const storedSpamProtect = await AsyncStorage.getItem('@getcontact_spam_protect');
      const storedSyncedStatus = await AsyncStorage.getItem('@getcontact_is_synced');

      if (storedNumber) {
        setMyNumber(storedNumber);
        setIsSetupComplete(true);
      }
      if (storedName) setMyName(storedName);
      if (storedSpamProtect !== null) setSpamProtection(storedSpamProtect === 'true');
      if (storedSyncedStatus === 'true') setIsSynced(true);
    } catch (e) {
      console.log('Error loading app state', e);
    }
  };

  // Complete setup screen
  const handleSetupComplete = async () => {
    if (!myNumber.trim() || !myName.trim()) {
      Alert.alert('Formulir Belum Lengkap', 'Silakan isi nama dan nomor telepon Anda.');
      return;
    }

    let normalized = myNumber.trim().replace(/[\s-]/g, '');
    if (normalized.startsWith('0')) {
      normalized = '+62' + normalized.slice(1);
    } else if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }

    try {
      await AsyncStorage.setItem('@getcontact_my_number', normalized);
      await AsyncStorage.setItem('@getcontact_my_name', myName.trim());
      setMyNumber(normalized);
      setIsSetupComplete(true);
      Alert.alert('Selamat Datang!', 'Profil Anda berhasil disimpan di perangkat.');
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan profil.');
    }
  };

  // Reset Profile Data
  const handleResetProfile = async () => {
    Alert.alert(
      'Reset Profil',
      'Apakah Anda yakin ingin menghapus data profil Anda?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            setIsSetupComplete(false);
            setMyNumber('');
            setMyName('');
            setSearchResults(null);
            setHasSearched(false);
            setIsSynced(false);
          }
        }
      ]
    );
  };

  // Contact list permission check
  const checkContactsPermission = async () => {
    const { status } = await Contacts.getPermissionsAsync();
    setPermissionStatus(status);
    if (status === 'granted') {
      loadLocalContacts();
    }
  };

  const requestContactsPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    setPermissionStatus(status);
    if (status === 'granted') {
      loadLocalContacts();
    } else {
      Alert.alert(
        'Izin Kontak Ditolak',
        'Aplikasi membutuhkan izin untuk menyimulasikan fitur sinkronisasi kontak.'
      );
    }
  };

  const loadLocalContacts = async () => {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
      });

      if (data.length > 0) {
        setLocalContacts(data);
      } else {
        // Mock contacts fallback
        setLocalContacts([
          { name: 'Ronaldo King', phoneNumbers: [{ number: '08555444333' }] },
          { name: 'Messi Barcelona', phoneNumbers: [{ number: '08999888777' }] },
          { name: 'Toko Roti Enak', phoneNumbers: [{ number: '08123456789' }] },
          { name: 'Penipu Hadiah Palsu', phoneNumbers: [{ number: '08987654321' }] },
        ]);
      }
    } catch (e) {
      console.log('Error loading contacts', e);
    }
  };

  // Sync Phone book contacts with API
  const handleSyncContacts = async () => {
    if (localContacts.length === 0) {
      Alert.alert('Info', 'Tidak ada kontak di perangkat untuk diunggah.');
      return;
    }

    setIsSyncing(true);

    try {
      const response = await fetch(`${API_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: localContacts,
          uploaderName: myName || 'Anonim'
        })
      });

      if (!response.ok) throw new Error('API server error');
      const data = await response.json();

      setIsSynced(true);
      await AsyncStorage.setItem('@getcontact_is_synced', 'true');
      setIsSyncing(false);
      Alert.alert('Sinkronisasi Berhasil!', data.message);
    } catch (e) {
      setIsSyncing(false);
      Alert.alert(
        'Gagal Sinkronisasi',
        `Gagal terhubung ke server. Pastikan server backend aktif di ${API_URL}`
      );
    }
  };

  // Search Phone Number details
  const handleSearch = async (overrideNumber = null) => {
    const target = overrideNumber || searchQuery;
    if (!target.trim()) {
      Alert.alert('Error', 'Silakan masukkan nomor telepon terlebih dahulu.');
      return;
    }

    setIsSearchLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(`${API_URL}/api/search?phone=${encodeURIComponent(target.trim())}`);
      if (!response.ok) throw new Error('Gagal memuat data');
      const data = await response.json();
      setSearchResults(data);
      setIsSearchLoading(false);
    } catch (e) {
      setIsSearchLoading(false);
      Alert.alert(
        'Pencarian Gagal',
        `Koneksi gagal ke server backend di ${API_URL}`
      );
    }
  };

  // Add Tag
  const handleAddTag = async () => {
    if (!newTagName.trim() || !searchResults) return;

    try {
      const response = await fetch(`${API_URL}/api/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: searchResults.phone,
          name: newTagName.trim(),
          uploader: myName || 'Anonim'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Gagal Tambah Tag', data.error || 'Terjadi kesalahan.');
        return;
      }

      setIsAddTagVisible(false);
      setNewTagName('');
      Alert.alert('Tag Ditambahkan!', `Nama "${data.tag.name}" berhasil disimpan untuk nomor ini.`);
      handleSearch(searchResults.phone);
    } catch (e) {
      Alert.alert('Gagal', 'Terjadi kesalahan koneksi server.');
    }
  };

  // Report Spam
  const handleReportSpam = async () => {
    if (!spamReason.trim() || !searchResults) return;

    try {
      const response = await fetch(`${API_URL}/api/spam-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: searchResults.phone,
          reason: spamReason.trim(),
          reporter: myName || 'Anonim'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Gagal Lapor', data.error || 'Terjadi kesalahan.');
        return;
      }

      setIsReportSpamVisible(false);
      setSpamReason('');
      Alert.alert('Terima Kasih!', `Laporan spam berhasil disimpan.`);
      handleSearch(searchResults.phone);
    } catch (e) {
      Alert.alert('Gagal', 'Terjadi kesalahan koneksi server.');
    }
  };

  // Fetch Tags and visitors
  const fetchMyTags = async () => {
    if (!myNumber) return;
    setIsMyTagsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/my-tags?phone=${encodeURIComponent(myNumber)}`);
      if (!response.ok) throw new Error('API server error');
      const data = await response.json();
      setMyTags(data.tags || []);
      setMyVisitors(data.visitors || []);
      setIsMyTagsLoading(false);
    } catch (e) {
      setIsMyTagsLoading(false);
      console.log('Error fetching my tags', e);
    }
  };

  // Onboarding Setup Screen
  if (!isSetupComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.centerScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.brandContainer}>
              <Image source={require('./assets/icon.jpg')} style={styles.brandIconImage} />
              <Text style={styles.brandLogo}>ContactGuard</Text>
              <Text style={styles.brandSlogan}>Smart Caller ID & Spam Shield</Text>
            </View>
            
            <View style={styles.setupCard}>
              <Text style={styles.setupTitle}>Mulai Pengamanan</Text>
              <Text style={styles.setupSubtitle}>Masukkan nomor telepon untuk memverifikasi kontak Anda secara instan.</Text>

              <Text style={styles.inputLabel}>Nama Lengkap Anda</Text>
              <TextInput
                style={styles.setupInput}
                placeholder="Contoh: Budi Santoso"
                placeholderTextColor="#64748B"
                value={myName}
                onChangeText={setMyName}
              />

              <Text style={styles.inputLabel}>Nomor HP Anda</Text>
              <TextInput
                style={styles.setupInput}
                placeholder="Contoh: 081299998888"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                value={myNumber}
                onChangeText={setMyNumber}
              />

              <TouchableOpacity style={styles.setupButton} onPress={handleSetupComplete}>
                <Text style={styles.setupButtonText}>Mulai Lindungi</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.apiIndicator}>
              🔗 Terhubung ke API lokal: {API_URL}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Main Interface
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.appHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.appHeaderTitle}>ContactGuard</Text>
          <Text style={styles.appHeaderSubtitle}>Real-Time Shield • Active</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={handleResetProfile}>
          <Text style={styles.headerButtonText}>👤 Logout</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.tabContentContainer}>
          {activeTab === 'search' && renderSearchTab()}
          {activeTab === 'mytags' && renderMyTagsTab()}
          {activeTab === 'spam' && renderSpamTab()}
          {activeTab === 'sync' && renderSyncTab()}
        </View>
      </KeyboardAvoidingView>

      {/* Floating Modern Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'search' && styles.activeTabItem]} onPress={() => setActiveTab('search')}>
          <Ionicons 
            name={activeTab === 'search' ? 'search' : 'search-outline'} 
            size={22} 
            color={activeTab === 'search' ? '#3B82F6' : '#64748B'} 
            style={{ marginBottom: 2 }}
          />
          <Text style={[styles.tabLabel, activeTab === 'search' && styles.activeTabLabel]}>Cari</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === 'mytags' && styles.activeTabItem]} onPress={() => { setActiveTab('mytags'); fetchMyTags(); }}>
          <Ionicons 
            name={activeTab === 'mytags' ? 'person' : 'person-outline'} 
            size={22} 
            color={activeTab === 'mytags' ? '#3B82F6' : '#64748B'} 
            style={{ marginBottom: 2 }}
          />
          <Text style={[styles.tabLabel, activeTab === 'mytags' && styles.activeTabLabel]}>Tag Saya</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === 'spam' && styles.activeTabItem]} onPress={() => setActiveTab('spam')}>
          <Ionicons 
            name={activeTab === 'spam' ? 'shield' : 'shield-outline'} 
            size={22} 
            color={activeTab === 'spam' ? '#3B82F6' : '#64748B'} 
            style={{ marginBottom: 2 }}
          />
          <Text style={[styles.tabLabel, activeTab === 'spam' && styles.activeTabLabel]}>Proteksi</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === 'sync' && styles.activeTabItem]} onPress={() => setActiveTab('sync')}>
          <Ionicons 
            name={activeTab === 'sync' ? 'people' : 'people-outline'} 
            size={22} 
            color={activeTab === 'sync' ? '#3B82F6' : '#64748B'} 
            style={{ marginBottom: 2 }}
          />
          <Text style={[styles.tabLabel, activeTab === 'sync' && styles.activeTabLabel]}>Sinkron</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderAddTagModal()}
      {renderReportSpamModal()}
    </SafeAreaView>
  );

  // SCREEN RENDERING FUNCTIONS

  // Tab 1: Search Nomor
  function renderSearchTab() {
    let trustColor = '#10B981'; // Green
    if (searchResults) {
      if (searchResults.trustScore < 50) trustColor = '#EF4444'; // Red
      else if (searchResults.trustScore < 80) trustColor = '#F59E0B'; // Orange
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔍 Lacak Nomor HP</Text>
          <Text style={styles.cardSubtitle}>Periksa identitas dan skor keamanan nomor asing secara terpusat.</Text>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Masukkan nomor (misal: 08123456789)"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={() => handleSearch()}>
              <Text style={styles.searchBtnText}>Cari</Text>
            </TouchableOpacity>
          </View>

          {/* Presets */}
          <View style={styles.presetContainer}>
            <Text style={styles.presetLabel}>Nomor Demo (Ketuk untuk Menguji):</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity style={styles.presetBadge} onPress={() => { setSearchQuery('08123456789'); handleSearch('08123456789'); }}>
                <Text style={styles.presetText}>🟢 Budi (Aman)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBadge} onPress={() => { setSearchQuery('08987654321'); handleSearch('08987654321'); }}>
                <Text style={styles.presetText}>🔴 Penipu (Spam)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {isSearchLoading && (
          <View style={styles.loaderArea}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loaderLabel}>Menghubungkan ke database aman...</Text>
          </View>
        )}

        {!isSearchLoading && hasSearched && searchResults && (
          <View style={styles.card}>
            <View style={styles.resultsHeader}>
              <View style={styles.resultsDetails}>
                <Text style={styles.resultPhone}>{searchResults.phone}</Text>
                <View style={styles.tagBadgeOutline}>
                  <Text style={styles.resultDesc}>🏷️ {searchResults.tags.length} Tag Terdaftar</Text>
                </View>
              </View>
              
              <View style={[styles.trustBadge, { borderColor: trustColor, backgroundColor: `${trustColor}0D` }]}>
                <Text style={[styles.trustTitle, { color: trustColor }]}>{searchResults.trustScore}%</Text>
                <Text style={styles.trustLabel}>Aman</Text>
              </View>
            </View>

            {/* Trust Level gauge bar */}
            <View style={styles.trustGaugeContainer}>
              <View style={styles.gaugeHeader}>
                <Text style={styles.gaugeLabel}>Tingkat Kepercayaan Komunitas</Text>
                <Text style={[styles.gaugeVal, { color: trustColor }]}>
                  {searchResults.trustScore >= 80 ? 'Sangat Aman' : searchResults.trustScore >= 50 ? 'Netral / Kurang Info' : 'Bahaya / Spam'}
                </Text>
              </View>
              <View style={styles.gaugeBarBackground}>
                <View style={[styles.gaugeBarFill, { width: `${searchResults.trustScore}%`, backgroundColor: trustColor }]} />
              </View>
            </View>

            {/* Spam Alert Warnings */}
            {searchResults.spamReports.length > 0 && (
              <View style={styles.spamAlertBox}>
                <Text style={styles.spamAlertText}>⚠️ Laporan Aktivitas Mencurigakan:</Text>
                {searchResults.spamReports.map((r, i) => (
                  <Text key={i} style={styles.spamReasonText}>• "{r.reason}" (oleh {r.reporter})</Text>
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
                    <Text style={styles.tagUploaderText}>Diunggah oleh: {tag.uploader}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTagsBox}>
                  <Text style={styles.emptyTagsText}>Belum ada tag nama. Sinkronkan kontak untuk menyumbang nama.</Text>
                </View>
              )}
            </View>

            {/* Interactive action buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.outlineActionBtn} onPress={() => setIsAddTagVisible(true)}>
                <Text style={styles.outlineActionText}>➕ Tambah Tag</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.outlineActionBtn, styles.dangerBtn]} onPress={() => setIsReportSpamVisible(true)}>
                <Text style={[styles.outlineActionText, styles.dangerText]}>🚨 Laporkan Spam</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  // Tab 2: Tag Saya
  function renderMyTagsTab() {
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
        { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' }, // Blue
        { bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6' }, // Purple
        { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' }, // Emerald
        { bg: '#EEF2F6', border: '#E2E8F0', text: '#1E293B' }, // Slate
        { bg: '#FDF2F8', border: '#FBCFE8', text: '#9D174D' }, // Pink
        { bg: '#FFF7ED', border: '#FFEDD5', text: '#9A3412' }, // Orange
      ];
      return colors[index % colors.length];
    };

    const initials = getInitials(myName);

    return (
      <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName}>{myName || 'Pengguna Baru'}</Text>
            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" style={styles.verifiedBadge} />
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
              <Text style={[styles.statNum, { color: '#10B981' }]}>98%</Text>
              <Text style={styles.statLabel}>Skor Aman</Text>
            </View>
          </View>
        </View>

        {/* Tags Section */}
        <View style={styles.profileSectionCard}>
          <Text style={styles.tagSectionTitle}>🏷️ Nama Saya di Kontak Orang Lain</Text>
          <Text style={styles.tagSectionSubtitle}>
            Ini adalah kumpulan nama panggilan Anda yang disimpan di buku alamat pengguna lain.
          </Text>

          {isMyTagsLoading ? (
            <ActivityIndicator size="large" color="#3B82F6" style={{ marginVertical: 20 }} />
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
                          { backgroundColor: tagStyle.bg, borderColor: tagStyle.border }
                        ]}
                      >
                        <Ionicons name="pricetag-outline" size={14} color={tagStyle.text} style={styles.tagBadgeIcon} />
                        <Text style={[styles.tagBadgeText, { color: tagStyle.text }]}>{tag.name}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>Belum Ada Tag Nama ℹ️</Text>
                  <Text style={styles.emptySubtitle}>
                    Nomor Anda belum terdaftar di database komunitas. Coba sinkronkan kontak rekan Anda agar nama Anda muncul di sini.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Visitors Section */}
        <View style={styles.profileSectionCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.cardTitle}>👀 Pengunjung Profil</Text>
            <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: '#2563EB', fontSize: 10, fontWeight: '800' }}>REAL-TIME</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>Pengguna lain yang mencari nomor telepon Anda baru-baru ini.</Text>

          {myVisitors.length > 0 ? (
            <View style={{ marginTop: 10 }}>
              {myVisitors.map((visitor, idx) => (
                <View key={idx} style={styles.visitorRow}>
                  <View style={styles.visitorIconBox}>
                    <Text style={styles.visitorIcon}>👤</Text>
                  </View>
                  <View style={styles.visitorMeta}>
                    <Text style={styles.visitorName}>
                      {idx === 0 ? visitor.viewerName : 'Pengguna Terkunci (Premium)'}
                    </Text>
                    <Text style={styles.visitorDate}>Mencari Anda pada {visitor.date}</Text>
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
              <Text style={styles.emptySubtitle}>Belum ada riwayat kunjungan untuk nomor Anda hari ini.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // Tab 3: Proteksi Spam
  function renderSpamTab() {
    return (
      <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 15 }}>
              <Text style={styles.cardTitle}>🛡️ Proteksi Spam Aktif</Text>
              <Text style={styles.cardSubtitle}>
                Secara otomatis memblokir dan memberi peringatan untuk panggilan masuk dari nomor yang masuk daftar hitam.
              </Text>
            </View>
            <Switch
              value={spamProtection}
              onValueChange={async (value) => {
                setSpamProtection(value);
                await AsyncStorage.setItem('@getcontact_spam_protect', value ? 'true' : 'false');
              }}
              trackColor={{ false: '#1E293B', true: '#3B82F6' }}
              thumbColor={spamProtection ? '#06B6D4' : '#64748B'}
            />
          </View>
        </View>

        <View style={styles.card}>
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
              <Text style={styles.disabledSpamText}>⚠️ Proteksi Dinonaktifkan. Anda rentan menerima panggilan penipuan.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // Tab 4: Sinkronisasi
  function renderSyncTab() {
    return (
      <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.syncStatusHeader}>
            <Text style={styles.cardTitle}>📦 Database Buku Alamat</Text>
            <View style={[styles.statusBadge, { backgroundColor: isSynced ? '#10B981' : '#F59E0B' }]}>
              <Text style={styles.statusText}>{isSynced ? 'Sudah Sinkron' : 'Belum Sinkron'}</Text>
            </View>
          </View>

          <Text style={styles.cardSubtitle}>
            Unggah relasi nama di daftar kontak perangkat Anda ke database crowdsourcing untuk membangun sistem keamanan yang lebih kuat bagi sesama.
          </Text>

          {permissionStatus !== 'granted' ? (
            <TouchableOpacity style={styles.syncBtn} onPress={requestContactsPermission}>
              <Text style={styles.syncBtnText}>Berikan Izin Akses Kontak</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <Text style={styles.contactsCountText}>
                Ditemukan <Text style={styles.highlight}>{localContacts.length}</Text> kontak di buku telepon perangkat Anda.
              </Text>
              
              {/* Responsive horizontal preview scroll */}
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
                {localContacts.slice(0, 5).map((item, idx) => (
                  <View key={idx} style={styles.previewChip}>
                    <Text style={styles.previewName}>{item.name}</Text>
                    <Text style={styles.previewPhone}>{item.phoneNumbers?.[0]?.number || 'Tanpa Nomor'}</Text>
                  </View>
                ))}
                {localContacts.length > 5 && (
                  <View style={styles.previewChipMore}>
                    <Text style={styles.previewMoreText}>+{localContacts.length - 5} Lainnya</Text>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity style={[styles.syncBtn, isSynced && styles.syncedBtn]} onPress={handleSyncContacts} disabled={isSyncing}>
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.syncBtnText}>
                    {isSynced ? 'Sinkron Ulang Sekarang' : 'Unggah & Sinkronisasikan Sekarang'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // MODAL BUILDERS

  // 1. Add Tag Modal
  function renderAddTagModal() {
    return (
      <Modal visible={isAddTagVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Tambah Tag Baru</Text>
            <Text style={styles.modalSubtitle}>
              Berikan usulan nama panggilan untuk nomor: {searchResults?.phone}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Contoh: Budi Kerja, Agus Sopir"
              placeholderTextColor="#64748B"
              value={newTagName}
              onChangeText={setNewTagName}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsAddTagVisible(false)}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleAddTag}>
                <Text style={styles.modalConfirmText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // 2. Report Spam Modal
  function renderReportSpamModal() {
    return (
      <Modal visible={isReportSpamVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Laporkan Penipuan / Spam</Text>
            <Text style={styles.modalSubtitle}>
              Bantu lindungi orang lain dengan melaporkan nomor {searchResults?.phone}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Sebutkan jenis penipuan (misal: Robot Call / Hadiah Palsu)"
              placeholderTextColor="#64748B"
              value={spamReason}
              onChangeText={setSpamReason}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsReportSpamVisible(false)}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, styles.modalDangerBtn]} onPress={handleReportSpam}>
                <Text style={styles.modalConfirmText}>Kirim Laporan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure white background
  },
  centerScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_WIDTH > 600 ? '15%' : 20,
    paddingVertical: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 35,
  },
  brandLogo: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A', // Crisp dark slate
    letterSpacing: 0.5,
  },
  brandSlogan: {
    fontSize: 13,
    color: '#3B82F6', // Royal blue brand color
    marginTop: 6,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  setupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9', // Soft slate border
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  setupSubtitle: {
    color: '#475569', // Muted dark slate
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  setupInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  setupButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  apiIndicator: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 25,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH > 600 ? '10%' : 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  headerInfo: {
    flex: 1,
  },
  appHeaderTitle: {
    fontSize: 22,
    fontWeight: '950',
    color: '#0F172A',
  },
  appHeaderSubtitle: {
    fontSize: 11,
    color: '#0891B2',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerButtonText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  tabContentContainer: {
    flex: 1,
  },
  scrollPadding: {
    paddingHorizontal: SCREEN_WIDTH > 600 ? '10%' : 20,
    paddingTop: 20,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardSubtitle: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 10,
  },
  searchBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  presetContainer: {
    marginTop: 15,
  },
  presetLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  presetBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetText: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '800',
  },
  loaderArea: {
    alignItems: 'center',
    marginVertical: 30,
  },
  loaderLabel: {
    color: '#475569',
    marginTop: 10,
    fontSize: 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingBottom: 15,
    marginBottom: 15,
  },
  resultsDetails: {
    flex: 1,
  },
  resultPhone: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  tagBadgeOutline: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  resultDesc: {
    color: '#0891B2',
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 16,
    fontWeight: '900',
  },
  trustLabel: {
    fontSize: 8,
    color: '#64748B',
    fontWeight: '700',
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
    color: '#475569',
    fontSize: 11,
  },
  gaugeVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  gaugeBarBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  gaugeBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  spamAlertBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  spamAlertText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 4,
  },
  spamReasonText: {
    color: '#991B1B', // Darker red for clear readability on light alert box
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
  },
  tagsSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  tagListItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagNameText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  tagDateText: {
    color: '#64748B',
    fontSize: 10,
  },
  tagUploaderText: {
    color: '#475569',
    fontSize: 11,
  },
  emptyTagsBox: {
    padding: 15,
    alignItems: 'center',
  },
  emptyTagsText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  outlineActionBtn: {
    flex: 0.48,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
  },
  outlineActionText: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 12,
  },
  dangerBtn: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.02)',
  },
  dangerText: {
    color: '#EF4444',
  },
  myPhoneBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  myPhoneLabel: {
    color: '#475569',
    fontWeight: '700',
  },
  myPhoneValue: {
    color: '#0891B2',
    fontWeight: '800',
  },
  myTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  myTagBubble: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 4,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  myTagText: {
    color: '#1E3A8A', // Dark indigo/blue
    fontWeight: '700',
    fontSize: 12,
  },
  myTagMeta: {
    color: '#0891B2',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  visitorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  visitorIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  visitorIcon: {
    fontSize: 18,
  },
  visitorMeta: {
    flex: 1,
  },
  visitorName: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  visitorDate: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  lockBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
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
    borderColor: '#E2E8F0',
  },
  blockedWarningBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  blockedWarningIcon: {
    fontSize: 14,
  },
  blockedMeta: {
    flex: 1,
  },
  blockedPhone: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  blockedReason: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 2,
  },
  blockedTime: {
    color: '#64748B',
    fontSize: 11,
  },
  disabledSpamAlert: {
    padding: 15,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 14,
    alignItems: 'center',
  },
  disabledSpamText: {
    color: '#F59E0B',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
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
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  contactsCountText: {
    color: '#0F172A',
    fontSize: 13,
    marginBottom: 12,
  },
  highlight: {
    color: '#3B82F6',
    fontWeight: '800',
  },
  previewScroll: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  previewChip: {
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 100,
  },
  previewName: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 11,
  },
  previewPhone: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 2,
  },
  previewChipMore: {
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewMoreText: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '700',
  },
  syncBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  syncedBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Lighter overlay for light theme
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '850',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#0F172A',
    fontSize: 14,
    marginBottom: 20,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelBtn: {
    flex: 0.48,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalCancelText: {
    color: '#475569',
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 0.48,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalDangerBtn: {
    backgroundColor: '#EF4444',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTitle: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  bottomTabBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: SCREEN_WIDTH > 600 ? '15%' : 16,
    right: SCREEN_WIDTH > 600 ? '15%' : 16,
    height: 64,
    backgroundColor: '#FFFFFF', // White floating bar
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabItem: {
    borderTopWidth: 0,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    color: '#94A3B8', // Lighter gray for inactive state
    fontSize: 10,
    fontWeight: '600',
  },
  activeTabLabel: {
    color: '#3B82F6',
    fontWeight: '800',
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '950',
    color: '#0F172A',
    marginRight: 6,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    width: '100%',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  tagSectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  tagSectionSubtitle: {
    fontSize: 12,
    color: '#475569',
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
    borderRadius: 16,
    marginHorizontal: 6,
    marginVertical: 6,
    borderWidth: 1,
  },
  tagBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  tagBadgeIcon: {
    marginRight: 6,
  },
  brandIconImage: {
    width: 90,
    height: 90,
    borderRadius: 26,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}
