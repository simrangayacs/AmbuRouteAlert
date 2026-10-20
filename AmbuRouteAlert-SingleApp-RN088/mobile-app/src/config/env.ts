import {Platform} from 'react-native';

/**
 * For Android emulator, 10.0.2.2 points to the development computer.
 * For iOS simulator, 127.0.0.1 points to the development computer.
 *
 * For a PHYSICAL PHONE on Wi-Fi, put the laptop's LAN IP below, for example:
 * const PHYSICAL_DEVICE_HOST = '192.168.1.20';
 *
 * Keep it empty when using an emulator/simulator.
 */
const PHYSICAL_DEVICE_HOST = '';

const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const host = PHYSICAL_DEVICE_HOST || defaultHost;

export const API_BASE_URL = `http://${host}:4000`;
export const SOCKET_URL = API_BASE_URL;
