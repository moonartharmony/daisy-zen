import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moonartharmony.daisyzen',
  appName: 'Daisy Zen',
  webDir: 'dist/capacitor',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#F6F3EE',
    },
    Haptics: {
      // Haptics plugin initializes automatically; no config needed
    },
  },
};

export default config;
