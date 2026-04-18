import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  ActivityIndicator, RefreshControl, TouchableOpacity
} from 'react-native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { historyGet } from '../api/api';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await historyGet();
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('History error:', e.message);
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); load(); };

  const sc = (color) => {
  switch (color) {
    case 'GREEN':  return Colors.green;
    case 'ORANGE': return Colors.orange;
    case 'AMBER':  return Colors.amber;
    case 'RED':    return Colors.red;
    default:       return Colors.textGray;
  }
};

 const sbg = (color) => {
  switch (color) {
    case 'GREEN':  return Colors.greenLight;
    case 'ORANGE': return Colors.orangeLight;
    case 'AMBER':  return Colors.amberLight;
    case 'RED':    return Colors.redLight;
    default:       return Colors.card;
  }
};

  const emoji = (color) => {
  switch (color) {
    case 'GREEN':  return '✅';
    case 'ORANGE': return '⚠️';
    case 'AMBER':  return '⚠️';
    case 'RED':    return '🚫';
    default:       return '❓';
  }
};

  const label = (color) => {
  switch (color) {
    case 'GREEN':  return 'Sûr';
    case 'ORANGE': return 'Modéré';
    case 'AMBER':  return 'Risqué';
    case 'RED':    return 'Dangereux';
    default:       return 'Inconnu';
  }
};

  // Group by date
  const groupByDate = (items) => {
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    items.forEach(item => {
      const date = new Date(item.scannedAt);
      let lbl;
      if (date.toDateString() === today.toDateString()) {
        lbl = "Aujourd'hui";
      } else if (date.toDateString() === yesterday.toDateString()) {
        lbl = 'Hier';
      } else {
        lbl = date.toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long'
        });
        lbl = lbl.charAt(0).toUpperCase() + lbl.slice(1);
      }
      if (!groups[lbl]) groups[lbl] = [];
      groups[lbl].push(item);
    });
    return groups;
  };

  const greenCount = history.filter(h => h.scoreColor === 'GREEN').length;
  const orangeCount = history.filter(h => h.scoreColor === 'ORANGE').length;
  const redCount = history.filter(h => h.scoreColor === 'RED').length;

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const grouped = groupByDate(history);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique</Text>
        <Text style={styles.headerCount}>
          {history.length} scan{history.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Stats */}
        {history.length > 0 && (
          <View style={styles.stats}>
            <View style={[styles.statCard, { backgroundColor: Colors.greenLight }]}>
              <Text style={styles.statEmoji}>✅</Text>
              <Text style={[styles.statNum, { color: Colors.green }]}>{greenCount}</Text>
              <Text style={styles.statLbl}>Sûrs</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.orangeLight }]}>
              <Text style={styles.statEmoji}>⚠️</Text>
              <Text style={[styles.statNum, { color: Colors.orange }]}>{orangeCount}</Text>
              <Text style={styles.statLbl}>Modérés</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.redLight }]}>
              <Text style={styles.statEmoji}>🚫</Text>
              <Text style={[styles.statNum, { color: Colors.red }]}>{redCount}</Text>
              <Text style={styles.statLbl}>Dangereux</Text>
            </View>
          </View>
        )}

        {/* Empty */}
        {history.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={styles.emptyTitle}>Aucun scan</Text>
            <Text style={styles.emptyText}>
              Vos scans apparaîtront ici automatiquement.
            </Text>
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => navigation.navigate('ScanResult')}
            >
              <Text style={styles.scanBtnTxt}>Scanner un produit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.entries(grouped).map(([dateLabel, items]) => (
            <View key={dateLabel} style={styles.group}>
              <Text style={styles.dateLabel}>{dateLabel}</Text>
              {
                items.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.card, { backgroundColor: sbg(item.scoreColor) }]}
                    onPress={() => navigation.navigate('ScanResult', {
                      preloadedBarcode: item.barcode
                    })}
                    activeOpacity={0.8}
                  >
                  
                    <View style={styles.cardLeft}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.img} />
                      ) : (
                        <View style={styles.imgPlaceholder}>
                          <Text style={{ fontSize: 26 }}>🛒</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardMid}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {item.productName || 'Produit inconnu'}
                      </Text>
                      <Text style={styles.brand} numberOfLines={1}>
                        {item.brand || 'Marque inconnue'}
                      </Text>
                      <View style={styles.scoreLabelRow}>
                        <Text style={styles.scoreEmoji}>{emoji(item.scoreColor)}</Text>
                        <Text style={[styles.scoreLabelTxt, { color: sc(item.scoreColor) }]}>
                          {label(item.scoreColor)}
                        </Text>
                      </View>
                      <Text style={styles.time}>
                        {new Date(item.scannedAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </Text>
                    </View>

                    <View style={styles.cardRight}>
                      <View style={[styles.scoreBadge, { backgroundColor: sc(item.scoreColor) }]}>
                        <Text style={styles.scoreNum}>{item.scoreAtScan}</Text>
                        <Text style={styles.scoreMax}>/20</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              }
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  backTxt: { fontSize: 26, color: Colors.primary },
  headerTitle: { fontSize: 20, fontFamily: Fonts.bold, color: Colors.primary },
  headerCount: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textGray },
  stats: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statNum: { fontSize: 22, fontFamily: Fonts.bold, marginBottom: 2 },
  statLbl: { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textGray },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: Fonts.bold, color: Colors.primary, marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.textGray, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  scanBtn: { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  scanBtnTxt: { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.textLight },
  group: { paddingHorizontal: 16, marginBottom: 8 },
  dateLabel: { fontSize: 13, fontFamily: Fonts.semiBold, color: Colors.brown, marginBottom: 10, marginTop: 8 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardLeft: { marginRight: 12 },
  img: { width: 58, height: 58, borderRadius: 12, backgroundColor: Colors.card },
  imgPlaceholder: { width: 58, height: 58, borderRadius: 12, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  cardMid: { flex: 1 },
  productName: { fontSize: 14, fontFamily: Fonts.semiBold, color: Colors.textDark, marginBottom: 2 },
  brand: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textGray, marginBottom: 6 },
  scoreLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  scoreEmoji: { fontSize: 13 },
  scoreLabelTxt: { fontSize: 12, fontFamily: Fonts.medium },
  time: { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textGray },
  cardRight: { marginLeft: 8, alignItems: 'center' },
  scoreBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', flexDirection: 'row', gap: 2 },
  scoreNum: { fontSize: 16, fontFamily: Fonts.bold, color: Colors.textLight },
  scoreMax: { fontSize: 11, fontFamily: Fonts.regular, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
});