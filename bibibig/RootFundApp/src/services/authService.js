// 인증 관련 서비스
import ApiService from './api';

class AuthService {
  // 로그인
  async login(credentials) {
    return await ApiService.login(credentials);
  }

  // 로그아웃
  async logout() {
    return await ApiService.logout();
  }

  // 로그인 상태 확인
  async checkLoginStatus() {
    return await ApiService.checkLoginExpiration();
  }

  // 현재 사용자 정보
  async getCurrentUser() {
    return await ApiService.getCurrentUser();
  }

  // 세션 데이터 조회
  async getSessionData(key) {
    return await ApiService.getSessionData(key);
  }
}

export default new AuthService();
