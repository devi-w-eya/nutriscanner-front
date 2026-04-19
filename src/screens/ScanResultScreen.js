import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { productScan, favouriteAdd, favouriteRemove, favouritesGet } from '../api/api';

export default function ScanResultScreen({ navigation, route }) {
  const { preloadedBarcode } = route?.params || {};

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned]           = useState(false);
  const [scanning, setScanning]         = useState(false);
  const [product, setProduct]           = useState(null);
  const [isFavourite, setIsFavourite]   = useState(false);
  const [notFound, setNotFound]         = useState(false);
  const [currentBarcode, setCurrentBarcode] = useState(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (preloadedBarcode) loadProduct(preloadedBarcode);
  }, []);

  useEffect(() => {
    if (product) checkFavourite();
  }, [product]);

  const updateStreak = async () => {
    try {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const lastScanDate = await AsyncStorage.getItem('lastScanDate');
      const currentStreak = parseInt(await AsyncStorage.getItem('scanStreak') || '0');

      if (lastScanDate === today) {
        // Already scanned today — no change
      } else if (lastScanDate === yesterday) {
        await AsyncStorage.setItem('scanStreak', String(currentStreak + 1));
        await AsyncStorage.setItem('lastScanDate', today);
      } else {
        await AsyncStorage.setItem('scanStreak', '1');
        await AsyncStorage.setItem('lastScanDate', today);
      }
    } catch (e) {}
  };

  const loadProduct = async (barcode) => {
    setScanning(true);
    setScanned(true);
    setCurrentBarcode(barcode);
    try {
      const result = await productScan(barcode);
      setProduct(result);
      await updateStreak();
    } catch (err) {
      const code = err?.response?.data?.error;
      if (code === 'PRODUCT_NOT_FOUND' || code === 'PRODUCT_INSUFFICIENT_DATA') {
        setNotFound(true);
      } else {
        Alert.alert('Erreur', 'Produit introuvable', [
          { text: 'Retour', onPress: () => navigation.goBack() }
        ]);
      }
    } finally {
      setScanning(false);
    }
  };

  const checkFavourite = async () => {
    try {
      const favs = await favouritesGet();
      const list = Array.isArray(favs) ? favs : [];
      setIsFavourite(list.some(f => f.barcode === product.barcode));
    } catch (e) {}
  };

  const resetScanner = () => {
    if (preloadedBarcode) {
      navigation.goBack();
      return;
    }
    setScanned(false);
    setScanning(false);
    setNotFound(false);
    setCurrentBarcode(null);
    setProduct(null);
  };

  const handleBarcodeScan = async ({ data }) => {
    if (scanned || scanning) return;
    setScanned(true);
    setScanning(true);
    setCurrentBarcode(data);
    try {
      const result = await productScan(data);
      setProduct(result);
      await updateStreak();
    } catch (err) {
      const code = err?.response?.data?.error;
      if (code === 'PRODUCT_NOT_FOUND' || code === 'PRODUCT_INSUFFICIENT_DATA') {
        setNotFound(true);
        setScanning(false);
      } else if (code === 'INVALID_BARCODE') {
        Alert.alert('Code-barres invalide', "Ce code-barres n'est pas valide.", [
          { text: 'Réessayer', onPress: resetScanner }
        ]);
      } else {
        Alert.alert('Erreur', 'Impossible de scanner ce produit.', [
          { text: 'Réessayer', onPress: resetScanner }
        ]);
      }
    } finally {
      setScanning(false);
    }
  };

  const handleFavourite = async () => {
    try {
      if (isFavourite) {
        await favouriteRemove(product.barcode);
        setIsFavourite(false);
      } else {
        await favouriteAdd(product.barcode);
        setIsFavourite(true);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Action impossible');
    }
  };

  const scoreColor = (c) => {
    switch (c) {
      case 'GREEN':  return Colors.green;
      case 'ORANGE': return Colors.orange;
      case 'AMBER':  return Colors.amber;
      case 'RED':    return Colors.red;
      default:       return Colors.textGray;
    }
  };

  const riskBg = (l) => {
    switch (l) {
      case 'HIGH':        return Colors.redLight;
      case 'MEDIUM_HIGH': return Colors.amberLight;
      case 'MEDIUM':      return Colors.orangeLight;
      case 'LOW':         return Colors.greenLight;
      default:            return Colors.card;
    }
  };

  const riskColor = (l) => {
    switch (l) {
      case 'HIGH':        return Colors.red;
      case 'MEDIUM_HIGH': return Colors.amber;
      case 'MEDIUM':      return Colors.orange;
      case 'LOW':         return Colors.green;
      default:            return Colors.textGray;
    }
  };

  const riskLabel = (l) => {
    switch (l) {
      case 'HIGH':        return '🔴 Dangereux';
      case 'MEDIUM_HIGH': return '🟠 Préoccupant';
      case 'MEDIUM':      return '🟡 Modéré';
      case 'LOW':         return '🟢 Sûr';
      default:            return '❓ Inconnu';
    }
  };

  if (scanning && preloadedBarcode && !product) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingTxt}>Chargement du produit...</Text>
      </View>
    );
  }

  if (!fontsLoaded || !permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Accès caméra requis</Text>
        <Text style={styles.permText}>
          NutriScanner a besoin de votre caméra pour scanner les codes-barres.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Autoriser</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
          <Text style={styles.brownLink}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={styles.notFoundContainer}>
        <View style={styles.notFoundCard}>
          <Text style={styles.notFoundIcon}>🔍</Text>
          <Text style={styles.notFoundTitle}>Produit non analysable</Text>
          <Text style={styles.notFoundText}>
            Ce produit n'a pas assez de données disponibles.{'\n'}
            Photographiez son étiquette pour l'analyser.
          </Text>
          <Text style={styles.notFoundBarcode}>Code-barres : {currentBarcode}</Text>
          <TouchableOpacity
            style={styles.labelBtn}
            onPress={() => navigation.navigate('LabelScan', { barcode: currentBarcode })}
          >
            <Text style={styles.labelBtnIcon}>📷</Text>
            <Text style={styles.labelBtnText}>Scanner l'étiquette</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryBtn} onPress={resetScanner}>
            <Text style={styles.brownLink}>← Scanner un autre produit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr']
          }}
        />
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
          {scanning ? (
            <View style={styles.scanningBox}>
              <ActivityIndicator color={Colors.textLight} size="small" />
              <Text style={styles.scanningTxt}>Analyse en cours...</Text>
            </View>
          ) : (
            <Text style={styles.hint}>Pointez vers un code-barres</Text>
          )}
        </View>
      </View>
    );
  }

  const additives = product.additives || [];
  const sc = scoreColor(product.scoreColor);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={[styles.scoreHeader, { backgroundColor: sc }]}>
          <TouchableOpacity style={styles.backBtn} onPress={resetScanner}>
            <Text style={styles.backBtnTxt}>
              {preloadedBarcode ? '← Retour' : '← Scanner à nouveau'}
            </Text>
          </TouchableOpacity>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreNum, { color: sc }]}>{product.finalScore}</Text>
            <Text style={styles.scoreSlash}>/20</Text>
          </View>
          <Text style={styles.scoreLabel}>{product.scoreLabel}</Text>
          <Text style={styles.novaLbl}>Groupe NOVA {product.novaGroup || 'N/A'}</Text>
        </View>

        <View style={styles.productCard}>
          <View style={styles.productRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.productName}>
                {product.productName || 'Produit inconnu'}
              </Text>
              <Text style={styles.productBrand}>{product.brand || 'Marque inconnue'}</Text>
              <Text style={styles.productBarcode}>{product.barcode}</Text>
            </View>
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={styles.productImg} />
            ) : (
              <View style={styles.productImgPlaceholder}>
                <Text style={{ fontSize: 30 }}>🛒</Text>
              </View>
            )}
          </View>

          <View style={styles.breakdown}>
            <View style={styles.bdItem}>
              <Text style={styles.bdEmoji}>🌿</Text>
              <Text style={styles.bdLabel}>Groupe NOVA</Text>
              <Text style={styles.bdVal}>
                {product.novaGroup ? `Niveau ${product.novaGroup}` : 'Inconnu'}
              </Text>
            </View>
            <View style={styles.bdDivider} />
            <View style={styles.bdItem}>
              <Text style={styles.bdEmoji}>⚗️</Text>
              <Text style={styles.bdLabel}>Additifs</Text>
              <Text style={styles.bdVal}>
                {additives.length} détecté{additives.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.bdDivider} />
            <View style={styles.bdItem}>
              <Text style={styles.bdEmoji}>📊</Text>
              <Text style={styles.bdLabel}>Score</Text>
              <Text style={[styles.bdVal, { color: sc }]}>
                {product.finalScore}/20
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isFavourite ? Colors.redLight : Colors.background }]}
              onPress={handleFavourite}
            >
              <Text style={styles.actionIcon}>{isFavourite ? '❤️' : '🤍'}</Text>
              <Text style={[styles.actionTxt, { color: isFavourite ? Colors.red : Colors.textGray }]}>
                {isFavourite ? 'Favori' : 'Ajouter'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.background }]}
              onPress={() => navigation.navigate('AIAssistant', {
                barcode: product.barcode,
                productName: product.productName
              })}
            >
              <Text style={styles.actionIcon}>🤖</Text>
              <Text style={styles.actionTxt}>Assistant IA</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.additivesSection}>
          <Text style={styles.sectionTitle}>
            Additifs détectés ({additives.length})
          </Text>
          {additives.length === 0 ? (
            <View style={styles.noAdditives}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>✅</Text>
              <Text style={styles.noAdditivesText}>Aucun additif détecté</Text>
            </View>
          ) : (
            additives.map((a, i) => (
              <View
                key={i}
                style={[styles.additiveCard, { backgroundColor: riskBg(a.riskLevel) }]}
              >
                <View style={styles.additiveHeader}>
                  <Text style={styles.additiveCode}>{a.code}</Text>
                  <View style={[styles.riskBadge, { backgroundColor: riskColor(a.riskLevel) }]}>
                    <Text style={styles.riskBadgeTxt}>{riskLabel(a.riskLevel)}</Text>
                  </View>
                </View>
                <Text style={styles.additiveName}>{a.nameFr}</Text>
                <Text style={styles.additiveDesc}>{a.description}</Text>
                <Text style={styles.additiveDeduct}>Déduction : -{a.deduction} pts</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, paddingHorizontal: 40 },
  loadingTxt: { marginTop: 16, fontSize: 14, fontFamily: Fonts.regular, color: Colors.textGray },
  permIcon: { fontSize: 60, marginBottom: 20 },
  permTitle: { fontSize: 20, fontFamily: Fonts.bold, color: Colors.primary, marginBottom: 12, textAlign: 'center' },
  permText: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.textGray, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  btnText: { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.textLight },
  brownLink: { fontSize: 14, fontFamily: Fonts.medium, color: Colors.brown },
  notFoundContainer: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', padding: 24 },
  notFoundCard: { backgroundColor: Colors.card, borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  notFoundIcon: { fontSize: 56, marginBottom: 16 },
  notFoundTitle: { fontSize: 20, fontFamily: Fonts.bold, color: Colors.primary, marginBottom: 10 },
  notFoundText: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.textGray, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  notFoundBarcode: { fontSize: 12, fontFamily: Fonts.medium, color: Colors.brown, marginBottom: 24 },
  labelBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14, marginBottom: 16, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  labelBtnIcon: { fontSize: 20 },
  labelBtnText: { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.textLight },
  retryBtn: { padding: 10 },
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 60, right: 24, backgroundColor: 'rgba(0,0,0,0.5)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  closeTxt: { color: Colors.textLight, fontSize: 18 },
  frame: { width: 260, height: 260, position: 'relative', marginBottom: 40 },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: Colors.textLight, borderWidth: 3 },
  tl: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  tr: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bl: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  br: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
  scanningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, gap: 10 },
  scanningTxt: { color: Colors.textLight, fontFamily: Fonts.medium, fontSize: 14 },
  hint: { color: Colors.textLight, fontFamily: Fonts.medium, fontSize: 15, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  scoreHeader: { paddingTop: 60, paddingBottom: 30, alignItems: 'center', paddingHorizontal: 24 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  backBtnTxt: { color: 'rgba(255,255,255,0.85)', fontFamily: Fonts.medium, fontSize: 14 },
  scoreCircle: { width: 130, height: 130, borderRadius: 65, backgroundColor: Colors.textLight, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  scoreNum: { fontSize: 48, fontFamily: Fonts.bold },
  scoreSlash: { fontSize: 20, fontFamily: Fonts.regular, color: Colors.textGray, marginTop: 10 },
  scoreLabel: { fontSize: 22, fontFamily: Fonts.bold, color: Colors.textLight, marginBottom: 6 },
  novaLbl: { fontSize: 13, fontFamily: Fonts.regular, color: 'rgba(255,255,255,0.8)' },
  productCard: { backgroundColor: Colors.card, marginHorizontal: 16, marginTop: -20, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  productName: { fontSize: 16, fontFamily: Fonts.bold, color: Colors.primary, marginBottom: 4 },
  productBrand: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textGray, marginBottom: 4 },
  productBarcode: { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textGray },
  productImg: { width: 80, height: 80, borderRadius: 12 },
  productImgPlaceholder: { width: 80, height: 80, borderRadius: 12, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  breakdown: { flexDirection: 'row', backgroundColor: Colors.background, borderRadius: 12, padding: 12, marginBottom: 14 },
  bdItem: { flex: 1, alignItems: 'center' },
  bdEmoji: { fontSize: 18, marginBottom: 4 },
  bdLabel: { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textGray, marginBottom: 4, textAlign: 'center' },
  bdVal: { fontSize: 14, fontFamily: Fonts.bold, color: Colors.textDark, textAlign: 'center' },
  bdDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 8 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  actionIcon: { fontSize: 18 },
  actionTxt: { fontSize: 13, fontFamily: Fonts.medium, color: Colors.textGray },
  additivesSection: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 17, fontFamily: Fonts.bold, color: Colors.primary, marginBottom: 12 },
  noAdditives: { alignItems: 'center', paddingVertical: 36, backgroundColor: Colors.greenLight, borderRadius: 16 },
  noAdditivesText: { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.green },
  additiveCard: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  additiveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  additiveCode: { fontSize: 15, fontFamily: Fonts.bold, color: Colors.textDark },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  riskBadgeTxt: { fontSize: 11, fontFamily: Fonts.semiBold, color: Colors.textLight },
  additiveName: { fontSize: 13, fontFamily: Fonts.semiBold, color: Colors.textDark, marginBottom: 4 },
  additiveDesc: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textGray, lineHeight: 18, marginBottom: 6 },
  additiveDeduct: { fontSize: 11, fontFamily: Fonts.medium, color: Colors.brown },
});