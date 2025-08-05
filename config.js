  import { Platform } from 'react-native';

  // Replace 'YOUR_COMPUTER_IP' with your actual local IP address
  const API_BASE_URL = Platform.OS === 'android' 
      ? 'http://10.211.0.209:5000' // Android emulator loopback
      : 'http://localhost:5000'; // iOS simulator/physical device on same network0000
      
  // For physical devices, use your computer's network Ip dsdsdsdsd  // const API_BASE_URL = 'http://YOUR_COMPUTER_IP:5000';
  export const API_KEYS = {
    OPENCAGE_API_KEY: '6e034188954747d1bf2e45bb148f6b57', // Isko nahi badalns
    OPENWEATHERMAP_API_KEY: 'ccf92a0071c62cd803973c2dc9b1953e',
  };

  export const config = {
      API_BASE_URL,
      endpoints: {
          recommend: '/recommend',
      },
  };
  // --- Centralized API Configuration ---
  // Use your machine's local IP address.
  // To find it, run 'ipconfig' (Windows) or 'ifconfig' (macOS/Linux) in your terminal.
  const IP_ADDRESS = '10.211.0.209'; // <-- This is your computer's current IP address
  const PORT = 5000;
  const API_URL = Platform.OS === 'web'
    ? `http://localhost:${PORT}`
    : `http://${IP_ADDRESS}:${PORT}`;
  
  export default API_URL;