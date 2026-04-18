import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { restoreSession(); }, []);

  const restoreSession = async () => {
    try {
      const userId   = await AsyncStorage.getItem('userId');
      const token    = await AsyncStorage.getItem('token');
      const email    = await AsyncStorage.getItem('email');
      const fullName = await AsyncStorage.getItem('fullName');
      const guest    = await AsyncStorage.getItem('isGuest');

      if (guest === 'true') {
        setIsGuest(true);
        setUser({ userId: 'guest', fullName: 'Invité', email: null, token: null });
      } else if (userId && token) {
        setUser({ userId, token, email, fullName });
      }
    } catch (e) {
      console.log('restoreSession error:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveUser = async (authResponse) => {
    try {
      const { token, userId, email, fullName } = authResponse;
      await AsyncStorage.setItem('userId',   String(userId));
      await AsyncStorage.setItem('token',    String(token));
      await AsyncStorage.setItem('email',    String(email   || ''));
      await AsyncStorage.setItem('fullName', String(fullName || ''));
      await AsyncStorage.removeItem('isGuest');
      setIsGuest(false);
      setUser({ userId, token, email, fullName });
    } catch (e) {
      console.log('saveUser error:', e);
    }
  };

  const continueAsGuest = async () => {
    try {
      await AsyncStorage.setItem('isGuest', 'true');
      setIsGuest(true);
      setUser({ userId: 'guest', fullName: 'Invité', email: null, token: null });
    } catch (e) {
      console.log('guest error:', e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['userId', 'token', 'email', 'fullName', 'isGuest']);
      setIsGuest(false);
      setUser(null);
    } catch (e) {
      console.log('logout error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, saveUser, logout, continueAsGuest, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}