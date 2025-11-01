// 거래 관련 서비스
import ApiService from './api';

class TransactionService {
  // 출금 신청
  async requestWithdrawal(withdrawalData) {
    return await ApiService.requestWithdrawal(withdrawalData);
  }

  // 잔액 조회
  async getBalance() {
    return await ApiService.getBalance();
  }

  // 거래 내역 조회 (향후 추가)
  async getTransactionHistory() {
    // TODO: 구현 예정
    return [];
  }

  // 출금 가능 금액 조회 (향후 추가)
  async getWithdrawableAmount() {
    // TODO: 구현 예정
    return 0;
  }
}

export default new TransactionService();
