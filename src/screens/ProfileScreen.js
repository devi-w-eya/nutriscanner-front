import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView
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
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.9:1882/api/v1';

export default function ProfileScreen({ navigation }) {
  const { user, isGuest, logout } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const userId = await AsyncStorage.getItem('userId');
              await axios.delete(`${BASE_URL}/auth/account`, {
                headers: { 'X-User-Id': userId }
              });
              await logout();
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de supprimer le compte');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  // Guest profile
  if (isGuest) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backTxt}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.guestCard}>
          <Text style={styles.guestAvatar}>👤</Text>
          <Text style={styles.guestTitle}>Mode invité</Text>
          <Text style={styles.guestText}>
            Créez un compte pour sauvegarder vos scans, accéder à l'historique et utiliser l'assistant IA.
          </Text>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerBtnTxt}>Créer un compte</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginBtnTxt}>Déjà un compte ? Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnTxt}>Quitter le mode invité</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Logged in profile
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.fullName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Info cards */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Nom complet</Text>
            <Text style={styles.infoValue}>{user?.fullName}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Adresse email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Type de compte</Text>
            <Text style={styles.infoValue}>Compte standard</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutBtnTxt}>Se déconnecter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color={Colors.red} size="small" />
            ) : (
              <>
                <Text style={styles.deleteIcon}>🗑️</Text>
                <Text style={styles.deleteBtnTxt}>Supprimer mon compte</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backTxt: { fontSize: 26, color: Colors.primary },
  headerTitle: { fontSize: 20, fontFamily: Fonts.bold, color: Colors.primary },
  avatarSection: { alignItems: 'center', paddingVertical: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { fontSize: 32, fontFamily: Fonts.bold, color: Colors.textLight },
  userName: { fontSize: 20, fontFamily: Fonts.bold, color: Colors.primary, marginBottom: 4 },
  userEmail: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.textGray },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoLabel: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textGray, marginBottom: 4 },
  infoValue: { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.textDark },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutIcon: { fontSize: 20 },
  logoutBtnTxt: { fontSize: 15, fontFamily: Fonts.medium, color: Colors.textDark },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.redLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.red,
  },
  deleteIcon: { fontSize: 20 },
  deleteBtnTxt: { fontSize: 15, fontFamily: Fonts.medium, color: Colors.red },
  guestCard: {
    margin: 24,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guestAvatar: { fontSize: 56, marginBottom: 16 },
  guestTitle: { fontSize: 20, fontFamily: Fonts.bold, color: Colors.primary, marginBottom: 10 },
  guestText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  registerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  registerBtnTxt: { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.textLight },
  loginBtn: {
    paddingVertical: 10,
    marginBottom: 20,
  },
  loginBtnTxt: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.brown },
  logoutBtnGuest: { padding: 10 },
});