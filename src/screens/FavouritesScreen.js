import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert
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
import { favouritesGet, favouriteRemove } from '../api/api';

export default function FavouritesScreen({ navigation }) {
  const [favourites, setFavourites] = useState([]);
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
      const data = await favouritesGet();
      setFavourites(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Favourites error:', e.message);
      setFavourites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleRemove = (barcode, name) => {
    Alert.alert(
      'Supprimer le favori',
      `Supprimer "${name}" de vos favoris ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            try {
              await favouriteRemove(barcode);
              setFavourites(prev => prev.filter(f => f.barcode !== barcode));
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          }
        }
      ]
    );
  };

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

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes favoris</Text>
        <Text style={styles.headerCount}>
          {favourites.length} produit{favourites.length !== 1 ? 's' : ''}
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
        {favourites.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={styles.emptyTitle}>Aucun favori</Text>
            <Text style={styles.emptyText}>
              Ajoutez des produits à vos favoris lors d'un scan.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {favourites.map((item, i) => (
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
                      <Text style={{ fontSize: 28 }}>🛒</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardMid}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.productName || 'Produit inconnu'}
                  </Text>
                  <Text style={styles.brand} numberOfLines={1}>
                    {item.brand || ''}
                  </Text>
                  <Text style={styles.savedDate}>
                    Ajouté le {new Date(item.savedAt).toLocaleDateString('fr-FR')}
                  </Text>
                </View>

                <View style={styles.cardRight}>
                  <Text style={[styles.score, { color: sc(item.scoreColor) }]}>
                    {item.finalScore}/20
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemove(item.barcode, item.productName)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              
              </TouchableOpacity>
        ))}
    </View>
  )
}
<View style={{ height: 40 }} />
      </ScrollView >
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  backTxt: { fontSize: 24, color: Colors.primary },
  headerTitle: { fontSize: 18, fontFamily: Fonts.bold, color: Colors.primary },
  headerCount: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textGray },
  empty: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: Fonts.bold, color: Colors.primary, marginBottom: 6 },
  emptyText: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.textGray, textAlign: 'center' },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  cardLeft: { marginRight: 12 },
  img: { width: 56, height: 56, borderRadius: 10 },
  imgPlaceholder: { width: 56, height: 56, borderRadius: 10, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center' },
  cardMid: { flex: 1 },
  productName: { fontSize: 14, fontFamily: Fonts.semiBold, color: Colors.textDark, marginBottom: 2 },
  brand: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textGray, marginBottom: 4 },
  savedDate: { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textGray },
  cardRight: { alignItems: 'center', gap: 8 },
  score: { fontSize: 14, fontFamily: Fonts.bold },
  removeBtn: { padding: 4 },
  removeIcon: { fontSize: 16 },
});