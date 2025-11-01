/**
 * 세션 데이터 사용 예시 및 헬퍼 함수들
 * 
 * 백엔드에서 전달받은 세션 데이터를 쉽게 사용할 수 있도록 도와주는 유틸리티
 */

import ApiService from '../services/api';

// 세션 데이터 사용 예시
export const SessionExamples = {
  
  // 1. 현재 사용자 기본 정보 조회
  async getCurrentUserInfo() {
    const user = await ApiService.getCurrentUser();
    if (user) {
      console.log('현재 사용자:', user.name);
      console.log('이메일:', user.email);
      console.log('회원ID:', user.member_id);
      console.log('잔액:', user.balance);
    }
    return user;
  },

  // 2. 잔액 확인
  async checkBalance() {
    const balance = await ApiService.getBalance();
    console.log('현재 잔액:', balance);
    return balance;
  },

  // 3. 회원 등급 확인
  async checkMemberGrade() {
    const grade = await ApiService.getMemberGrade();
    console.log('회원 등급:', grade);
    return grade;
  },

  // 4. 전체 세션 데이터 조회
  async getAllSessionData() {
    const sessionData = await ApiService.getSessionData();
    console.log('전체 세션 데이터:', sessionData);
    return sessionData;
  },

  // 5. 특정 세션 값 조회
  async getSpecificSessionValue(key) {
    const value = await ApiService.getSessionData(key);
    console.log(`${key}:`, value);
    return value;
  },

  // 6. 세션 데이터 업데이트 (예: 잔액 변경 시)
  async updateBalance(newBalance) {
    const success = await ApiService.updateSessionData('balance', newBalance);
    if (success) {
      console.log('잔액 업데이트 완료:', newBalance);
    }
    return success;
  }
};

// 컴포넌트에서 사용할 수 있는 커스텀 훅 스타일 함수들
export const useSession = {
  
  // 사용자 정보가 필요한 컴포넌트에서 사용
  async getUserData() {
    try {
      const user = await ApiService.getCurrentUser();
      return {
        isLoggedIn: !!user,
        userData: user,
        error: null
      };
    } catch (error) {
      return {
        isLoggedIn: false,
        userData: null,
        error: error.message
      };
    }
  },

  // 잔액 정보가 필요한 컴포넌트에서 사용
  async getBalanceData() {
    try {
      const balance = await ApiService.getBalance();
      return {
        balance: balance || '0',
        hasBalance: !!balance && parseFloat(balance) > 0,
        error: null
      };
    } catch (error) {
      return {
        balance: '0',
        hasBalance: false,
        error: error.message
      };
    }
  },

  // 권한 체크가 필요한 컴포넌트에서 사용
  async checkPermissions() {
    try {
      const memberClass = await ApiService.getMemberClass();
      const memberGrade = await ApiService.getMemberGrade();
      
      return {
        memberClass,
        memberGrade,
        isVip: memberClass === 'VIP' || memberGrade === 'PREMIUM',
        canWithdraw: !!memberClass, // 회원 클래스가 있으면 출금 가능
        error: null
      };
    } catch (error) {
      return {
        memberClass: null,
        memberGrade: null,
        isVip: false,
        canWithdraw: false,
        error: error.message
      };
    }
  }
};

// 세션 데이터 검증 함수들
export const SessionValidators = {
  
  // 로그인 상태 확인
  async isLoggedIn() {
    const user = await ApiService.getCurrentUser();
    return !!user;
  },

  // 세션 만료 확인
  async isSessionValid() {
    const result = await ApiService.checkLoginExpiration();
    return !result.expired;
  },

  // 특정 권한 확인
  async hasPermission(requiredClass) {
    const memberClass = await ApiService.getMemberClass();
    return memberClass === requiredClass;
  },

  // 잔액 충분 여부 확인
  async hasSufficientBalance(requiredAmount) {
    const balance = await ApiService.getBalance();
    return parseFloat(balance || '0') >= parseFloat(requiredAmount);
  }
};

export default {
  SessionExamples,
  useSession,
  SessionValidators
};
