import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.9:1882/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (userId) config.headers['X-User-Id'] = userId;
  } catch (e) {}
  return config;
});

// ── AUTH ──────────────────────────────────────────────────────
export const authRegister = async (fullName, email, password) => {
  const res = await api.post('/auth/register', { fullName, email, password });
  return res.data;
};

export const authLogin = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

// ── PRODUCTS ──────────────────────────────────────────────────
export const productScan = async (barcode) => {
  const res = await api.get(`/product/${barcode}`);
  return res.data;
};

export const productScanLabel = async (barcode, image) => {
  const res = await api.post('/product/scan-label', { barcode, image });
  return res.data;
};

// ── HISTORY ───────────────────────────────────────────────────
export const historyGet = async () => {
  const res = await api.get('/history');
  return res.data;
};

// ── FAVOURITES ────────────────────────────────────────────────
export const favouritesGet = async () => {
  const res = await api.get('/favorites');
  return res.data;
};

export const favouriteAdd = async (barcode) => {
  const res = await api.post(`/favorites/${barcode}`);
  return res.data;
};

export const favouriteRemove = async (barcode) => {
  const res = await api.delete(`/favorites/${barcode}`);
  return res.data;
};

// ── AI ASSISTANT ──────────────────────────────────────────────
export const assistantAsk = async (barcode, question) => {
  const res = await api.post('/assistant/ask', { barcode, question });
  return res.data;
};