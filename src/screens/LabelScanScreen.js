import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  PanResponder, ActivityIndicator, Alert, ScrollView, Image, Animated
} from 'react-native';
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
import { productScanLabel } from '../api/api';

export default function LabelScanScreen({ navigation, route }) {
  const { barcode } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [product, setProduct] = useState(null);

  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(0);
  const lastZoom = useRef(0);
  const lastDistance = useRef(null);
  const cameraRef = useRef(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
    onMoveShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
    onPanResponderGrant: () => {
      lastDistance.current = null;
    },
    onPanResponderMove: (e) => {
      const touches = e.nativeEvent.touches;
      if (touches.length !== 2) return;

      const dx = touches[0].pageX - touches[1].pageX;
      const dy = touches[0].pageY - touches[1].pageY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (lastDistance.current !== null) {
        const delta = (distance - lastDistance.current) / 800;
        const newZoom = Math.min(1, Math.max(0, lastZoom.current + delta));
        setZoom(newZoom);
        lastZoom.current = newZoom;
      }
      lastDistance.current = distance;
    },
  });

  const captureAndScan = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      const result = await productScanLabel(barcode, photo.base64);
      setProduct(result);
    }  catch (err) {
      const code = err?.response?.data?.error;
      if (code === 'AI_UNAVAILABLE') {
        Alert.alert(
          'Aucun additif détecté',
          'L\'IA n\'a pas trouvé d\'additifs sur cette étiquette. Essayez de zoomer sur la liste des ingrédients.',
          [{ text: 'Réessayer', onPress: () => setCapturing(false) }]
        );
      } else {
        Alert.alert('Erreur', 'Impossible d\'analyser l\'étiquette. Réessayez.');
        setCapturing(false);
      }
    }
};

const scoreColor = (c) => {
  switch (c) {
    case 'GREEN': return Colors.green;
    case 'ORANGE': return Colors.orange;
    case 'RED': return Colors.red;
    default: return Colors.textGray;
  }
};



const riskLabel = (l) => {
  switch (l) {
    case 'HIGH': return 'Risque élevé';
    case 'MEDIUM': return 'Risque moyen';
    case 'LOW': return 'Risque faible';
    default: return 'Inconnu';
  }
};
const riskColor = (l) => {
  switch (l) {
    case 'HIGH': return Colors.red;
    case 'MEDIUM_HIGH': return Colors.amber;
    case 'MEDIUM': return Colors.orange;
    case 'LOW': return Colors.green;
    default: return Colors.textGray;
  }
};

const riskBg = (l) => {
  switch (l) {
    case 'HIGH': return Colors.redLight;
    case 'MEDIUM_HIGH': return Colors.amberLight;
    case 'MEDIUM': return Colors.orangeLight;
    case 'LOW': return Colors.greenLight;
    default: return Colors.card;
  }
};

if (!fontsLoaded) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

if (!permission?.granted) {
  return (
    <View style={styles.center}>
      <Text style={styles.permIcon}>📷</Text>
      <Text style={styles.permTitle}>Accès caméra requis</Text>
      <TouchableOpacity style={styles.btn} onPress={requestPermission}>
        <Text style={styles.btnText}>Autoriser</Text>
      </TouchableOpacity>
    </View>
  );
}

if (product) {
  const additives = product.additives || [];
  const sc = scoreColor(product.scoreColor);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={[styles.scoreHeader, { backgroundColor: sc }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnTxt}>← Retour</Text>
          </TouchableOpacity>

          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreNum, { color: sc }]}>
              {product.finalScore}
            </Text>
            <Text style={styles.scoreSlash}>/20</Text>
          </View>

          <Text style={styles.scoreLabel}>{product.scoreLabel}</Text>
          <Text style={styles.sourceLbl}>📷 Analysé via étiquette</Text>
        </View>

        <View style={styles.productCard}>
          <Text style={styles.productName}>
            {product.productName || 'Produit scanné'}
          </Text>
          <Text style={styles.productBarcode}>
            Code-barres : {product.barcode}
          </Text>
          {product.brand ? (
            <Text style={styles.productBrand}>{product.brand}</Text>
          ) : null}
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
                style={[styles.additiveCard, { borderLeftColor: riskColor(a.riskLevel), backgroundColor: riskBg(a.riskLevel) }]}
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

return (
  <View style={styles.cameraWrap} {...panResponder.panHandlers}>
    <CameraView
      ref={cameraRef}
      style={StyleSheet.absoluteFillObject}
      facing="back"
      enableTorch={torch}
      zoom={zoom}
    />

    {/* Top bar */}
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.closeTxt}>✕</Text>
      </TouchableOpacity>
      <Text style={styles.topTitle}>Scanner l'étiquette</Text>
      <TouchableOpacity
        style={[styles.torchBtn, torch && styles.torchBtnActive]}
        onPress={() => setTorch(prev => !prev)}
      >
        <Text style={styles.torchIcon}>🔦</Text>
      </TouchableOpacity>
    </View>

    {/* Center guide frame */}
    <View style={styles.frameContainer}>
      <View style={styles.guideFrame}>
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />
      </View>
      <Text style={styles.guideText}>
        Centrez la liste des ingrédients
      </Text>
    </View>

    {/* Bottom bar */}
    <View style={styles.bottomBar}>
      <Text style={styles.barcodeRef}>Code-barres : {barcode}</Text>
      <Text style={styles.zoomHint}>
        🤏 Pincez pour zoomer • {zoom === 0 ? '1×' : `${(1 + zoom * 9).toFixed(1)}×`}
      </Text>

      {capturing ? (
        <View style={styles.capturingBox}>
          <ActivityIndicator color={Colors.textLight} size="large" />
          <Text style={styles.capturingTxt}>Analyse IA en cours...</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.captureBtn} onPress={captureAndScan}>
          <View style={styles.captureBtnInner} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 40 },
  permIcon: { fontSize: 60, marginBottom: 20 },
  permTitle: { fontSize: 18, fontFamily: Fonts.bold, color: Colors.primary, marginBottom: 20 },
  btn: { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  btnText: { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.textLight },

  // Camera
  cameraWrap: { flex: 1, backgroundColor: '#000' },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeTxt: { color: Colors.textLight, fontSize: 18 },
  topTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.textLight,
  },
  torchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  torchBtnActive: {
    backgroundColor: Colors.brownLight,
  },
  torchIcon: { fontSize: 20 },

  // Center guide frame
  frameContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  guideFrame: {
    width: 280,
    height: 180,
    position: 'relative',
    marginBottom: 16,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.textLight,
    borderWidth: 3,
  },
  tl: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  tr: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bl: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  br: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
  guideText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
    paddingTop: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 10,
  },
  barcodeRef: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.7)',
  },
  zoomHint: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.6)',
  },
  capturingBox: {
    alignItems: 'center',
    gap: 12,
  },
  capturingTxt: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textLight,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.textLight,
  },
  captureBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.textLight,
  },

  // Result styles
  scoreHeader: { paddingTop: 60, paddingBottom: 30, alignItems: 'center', paddingHorizontal: 24 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  backBtnTxt: { color: 'rgba(255,255,255,0.85)', fontFamily: Fonts.medium, fontSize: 14 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.textLight, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', marginBottom: 12 },
  scoreNum: { fontSize: 44, fontFamily: Fonts.bold },
  scoreSlash: { fontSize: 18, fontFamily: Fonts.regular, color: Colors.textGray, marginTop: 8 },
  scoreLabel: { fontSize: 20, fontFamily: Fonts.bold, color: Colors.textLight, marginBottom: 4 },
  sourceLbl: { fontSize: 12, fontFamily: Fonts.regular, color: 'rgba(255,255,255,0.8)' },
  productCard: { backgroundColor: Colors.card, marginHorizontal: 16, marginTop: -16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  productName: { fontSize: 16, fontFamily: Fonts.bold, color: Colors.primary, marginBottom: 4 },
  productBarcode: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textGray },
  productBrand: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textGray, marginTop: 2 },
  additivesSection: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 17, fontFamily: Fonts.bold, color: Colors.primary, marginBottom: 12 },
  noAdditives: { alignItems: 'center', paddingVertical: 30, backgroundColor: Colors.greenLight, borderRadius: 16 },
  noAdditivesText: { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.green },
  additiveCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4 },
  additiveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  additiveCode: { fontSize: 14, fontFamily: Fonts.bold, color: Colors.textDark },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  riskBadgeTxt: { fontSize: 11, fontFamily: Fonts.semiBold, color: Colors.textLight },
  additiveName: { fontSize: 13, fontFamily: Fonts.semiBold, color: Colors.textDark, marginBottom: 4 },
  additiveDesc: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textGray, lineHeight: 18, marginBottom: 6 },
  additiveDeduct: { fontSize: 11, fontFamily: Fonts.medium, color: Colors.brown },
});