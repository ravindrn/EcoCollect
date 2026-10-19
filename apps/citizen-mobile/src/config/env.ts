import Constants from 'expo-constants';

type Extra = { apiBaseUrl?: string };

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const env = {
  // Default is Android emulator loopback (host = 10.0.2.2).
  // For web or iOS simulator: http://localhost:4000/api/v1
  // For a physical phone: http://<your-PC-LAN-IP>:4000/api/v1
  apiBaseUrl: extra.apiBaseUrl ?? 'http://10.245.149.220:4000/api/v1',
};