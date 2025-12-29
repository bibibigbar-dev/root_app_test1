import { Platform } from 'react-native';

// ========================================
// 🔧 API 서버 설정 (여기서만 관리)
// ========================================

// 개발 환경 - 플랫폼별 로컬 서버 주소
const IOS_LOCAL_URL = 'http://127.0.0.1:8080';           // iOS 시뮬레이터: 127.0.0.1 사용
const ANDROID_LOCAL_URL = 'http://10.0.2.2:8080';        // Android 에뮬레이터: 특수 주소

// 현재 사용할 API URL (개발/운영 전환은 여기서만!)
export const API_BASE_URL = Platform.OS === 'ios' ? IOS_LOCAL_URL : ANDROID_LOCAL_URL;

// 운영 서버로 전환
//export const API_BASE_URL = 'https://app.rootenergy.co.kr';

// 개발 서버로 전환
//export const API_BASE_URL = 'http://10.0.4.10:8181';

export default {
  BASE_URL: API_BASE_URL,
};
