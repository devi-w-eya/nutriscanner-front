import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { historyGet } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isGuest } = useAuth();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (!isGuest) loadRecentScans();
    else setLoading(false);
  }, []);

  const loadRecentScans = async () => {
    try {
      const data = await historyGet();
      setRecentScans(Array.isArray(data) ? data.slice(0, 3) : []);
    } catch (error) {
      console.log('Error loading history:', error);
      setRecentScans([]);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (color) => {
    switch (color) {
      case 'GREEN':  return Colors.green;
      case 'ORANGE': return Colors.orange;
      case 'AMBER':  return Colors.amber;
      case 'RED':    return Colors.red;
      default:       return Colors.textGray;
    }
  };

  const getScoreBackground = (color) => {
    switch (color) {
      case 'GREEN':  return Colors.greenLight;
      case 'ORANGE': return Colors.orangeLight;
      case 'AMBER':  return Colors.amberLight;
      case 'RED':    return Colors.redLight;
      default:       return Colors.card;
    }
  };

  const getScoreEmoji = (color) => {
    switch (color) {
      case 'GREEN':  return '✅';
      case 'ORANGE': return '⚠️';
      case 'AMBER':  return '⚠️';
      case 'RED':    return '🚫';
      default:       return '❓';
    }
  };

  const guestAlert = (feature) => {
    Alert.alert(
      'Compte requis',
      `Créez un compte pour accéder ${feature}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: "S'inscrire", onPress: () => navigation.navigate('Login') }
      ]
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.userName}>
              {isGuest ? 'Invité' : user?.fullName?.split(' ')[0]} 👋
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Guest banner */}
        {isGuest && (
          <View style={styles.guestBanner}>
            <Text style={styles.guestBannerText}>
              🔒 Créez un compte pour sauvegarder vos scans
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.guestBannerLink}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Hero scan button */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Que voulez-vous scanner ?</Text>
          <Text style={styles.heroSubtitle}>
            Scannez un code-barres pour analyser les additifs alimentaires
          </Text>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('ScanResult')}
            activeOpacity={0.85}
          >
            <View style={styles.scanButtonInner}>
              <Text style={styles.scanIcon}>📷</Text>
              <Text style={styles.scanButtonText}>Scanner un produit</Text>
              <Text style={styles.scanButtonSubtext}>Pointez vers un code-barres</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => isGuest
              ? guestAlert("à l'historique")
              : navigation.navigate('History')
            }
          >
            <Text style={styles.quickActionIcon}>{isGuest ? '🔒' : '📜'}</Text>
            <Text style={styles.quickActionText}>Historique</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => isGuest
              ? guestAlert('aux favoris')
              : navigation.navigate('Favourites')
            }
          >
            <Text style={styles.quickActionIcon}>{isGuest ? '🔒' : '❤️'}</Text>
            <Text style={styles.quickActionText}>Favoris</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => isGuest
              ? guestAlert("à l'assistant IA")
              : navigation.navigate('AIAssistant', { barcode: null })
            }
          >
            <Text style={styles.quickActionIcon}>{isGuest ? '🔒' : '🤖'}</Text>
            <Text style={styles.quickActionText}>Assistant</Text>
          </TouchableOpacity>
        </View>

        {/* Recent scans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scans récents</Text>

          {isGuest ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔒</Text>
              <Text style={styles.emptyText}>Historique non disponible</Text>
              <Text style={styles.emptySubtext}>Créez un compte pour sauvegarder vos scans</Text>
            </View>
          ) : loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
          ) : recentScans.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>Aucun scan pour l'instant</Text>
              <Text style={styles.emptySubtext}>Scannez votre premier produit !</Text>
            </View>
          ) : (
            recentScans.map((scan, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.scanCard, { backgroundColor: getScoreBackground(scan.scoreColor) }]}
                onPress={() => navigation.navigate('ScanResult', { preloadedBarcode: scan.barcode })}
                activeOpacity={0.8}
              >
                <View style={styles.scanCardLeft}>
                  {scan.imageUrl ? (
                    <Image source={{ uri: scan.imageUrl }} style={styles.productImage} />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Text style={{ fontSize: 24 }}>🛒</Text>
                    </View>
                  )}
                </View>
                <View style={styles.scanCardMiddle}>
                  <Text style={styles.scanProductName} numberOfLines={1}>
                    {scan.productName || 'Produit inconnu'}
                  </Text>
                  <Text style={styles.scanBrand} numberOfLines={1}>
                    {scan.brand || ''}
                  </Text>
                  <Text style={styles.scanDate}>
                    {new Date(scan.scannedAt).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View style={styles.scanCardRight}>
                  <Text style={styles.scanEmoji}>{getScoreEmoji(scan.scoreColor)}</Text>
                  <Text style={[styles.scanScore, { color: getScoreColor(scan.scoreColor) }]}>
                    {scan.scoreAtScan}/20
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.textGray },
  userName: { fontSize: 22, fontFamily: Fonts.bold, color: Colors.primary },
  profileButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  profileIcon: { fontSize: 20 },
  guestBanner: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guestBannerText: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textGray, flex: 1 },
  guestBannerLink: { fontSize: 12, fontFamily: Fonts.semiBold, color: Colors.brown, marginLeft: 8 },
  heroSection: { paddingHorizontal: 24, paddingBottom: 24 },
  heroTitle: { fontSize: 20, fontFamily: Fonts.bold, color: Colors.primary, marginBottom: 6 },
  heroSubtitle: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textGray, marginBottom: 20, lineHeight: 20 },
  scanButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20, padding: 24, alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  scanButtonInner: { alignItems: 'center' },
  scanIcon: { fontSize: 48, marginBottom: 12 },
  scanButtonText: { fontSize: 18, fontFamily: Fonts.bold, color: Colors.textLight, marginBottom: 4 },
  scanButtonSubtext: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.mint },
  quickActions: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 24 },
  quickActionCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 16,
    padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  quickActionIcon: { fontSize: 24, marginBottom: 6 },
  quickActionText: { fontSize: 12, fontFamily: Fonts.medium, color: Colors.primary },
  section: { paddingHorizontal: 24 },
  sectionTitle: { fontSize: 17, fontFamily: Fonts.bold, color: Colors.primary, marginBottom: 14 },
  emptyState: {
    alignItems: 'center', paddingVertical: 40,
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.primary, marginBottom: 4 },
  emptySubtext: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textGray },
  scanCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  scanCardLeft: { marginRight: 12 },
  productImage: { width: 52, height: 52, borderRadius: 10, backgroundColor: Colors.card },
  productImagePlaceholder: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center',
  },
  scanCardMiddle: { flex: 1 },
  scanProductName: { fontSize: 14, fontFamily: Fonts.semiBold, color: Colors.textDark, marginBottom: 2 },
  scanBrand: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textGray, marginBottom: 2 },
  scanDate: { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textGray },
  scanCardRight: { alignItems: 'center', marginLeft: 8 },
  scanEmoji: { fontSize: 18, marginBottom: 2 },
  scanScore: { fontSize: 13, fontFamily: Fonts.bold },
});