import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const sanitizeText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value).trim();
  if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') {
    return '';
  }

  return text;
};

const displayOrDash = (value) => {
  const sanitized = sanitizeText(value);
  return sanitized || '-';
};

const getSafeBalanceText = (value, formatCurrencyFn) => {
  const sanitized = sanitizeText(value);
  if (!sanitized) {
    return '-';
  }

  const numeric = Number(String(sanitized).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(numeric) || numeric < 0) {
    return '-';
  }

  return `${formatCurrencyFn(numeric)} 원`;
};

const WithdrawalScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // 직접 AsyncStorage에서 데이터 확인
      const rawUserData = await AsyncStorage.getItem('userData');
      const rawToken = await AsyncStorage.getItem('userToken');
      
      console.log('🔍 AsyncStorage 원본 데이터:');
      console.log('📋 userData:', rawUserData);
      console.log('📋 userToken:', rawToken);
      
      if (rawUserData) {
        const parsedData = JSON.parse(rawUserData);
        console.log('📋 파싱된 데이터:', JSON.stringify(parsedData, null, 2));
      }

      // 세션 만료 확인
      const loginCheck = await ApiService.checkLoginExpiration();
      if (loginCheck.expired) {
        console.log('세션 만료:', loginCheck.reason);
        await ApiService.clearLoginData();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      // 현재 사용자 정보 조회 (세션 데이터 포함)
      const currentUser = await ApiService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // 세션 데이터에서 r_name 사용
        setAccountHolder(sanitizeText(currentUser.session?.r_name) || sanitizeText(currentUser.name));
        
        // 백엔드에서 받은 은행 정보 자동 설정 (member 데이터 직접 접근)
        console.log('🏦 은행 정보 설정 시도:');
        console.log('member 데이터:', currentUser.member);
        console.log('member.bank_nm:', currentUser.member?.bank_nm);
        console.log('member.account:', currentUser.member?.account);
        
        // member 데이터에서 직접 가져오기
        setBankName(sanitizeText(currentUser.member?.bank_nm));
        setBankAccount(sanitizeText(currentUser.member?.account));
        
        console.log('🏦 은행 정보 설정 완료!');
        
        // 설정 후 state 값 확인
        setTimeout(() => {
          console.log('📝 현재 state 값들:');
          console.log('bankName state:', bankName);
          console.log('bankAccount state:', bankAccount);
          console.log('accountHolder state:', accountHolder);
        }, 100);
        
        console.log('✅ 사용자 데이터 로드 완료:');
        console.log('📋 getCurrentUser 결과:', JSON.stringify(currentUser, null, 2));
        console.log('📋 세션 데이터 존재 여부:', !!currentUser.session);
        console.log('📋 표시될 데이터:', {
          r_name: currentUser.session?.r_name,
          email: currentUser.email,
          balance: currentUser.session?.balance,
          name: currentUser.name,
          bank_nm: currentUser.session?.bank_nm,
          account: currentUser.session?.account,
          account_holder_name: currentUser.session?.account_holder_name
        });
        
        // 실제 값들 개별 확인
        console.log('🔍 개별 값 확인:');
        console.log('r_name:', currentUser.session?.r_name);
        console.log('balance:', currentUser.session?.balance);
        console.log('email:', currentUser.email);
        console.log('bank_nm:', currentUser.session?.bank_nm);
        console.log('account:', currentUser.session?.account);
        console.log('account_holder_name:', currentUser.session?.account_holder_name);
        console.log('formatCurrency 테스트:', formatCurrency(currentUser.session?.balance || '0'));
      } else {
        console.log('❌ getCurrentUser 결과가 null');
        Alert.alert('알림', '사용자 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
      Alert.alert('네트워크 오류', '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          onPress: async () => {
            try {
              // 새로운 로그아웃 API 사용 (백엔드 로그아웃 + 로컬 데이터 삭제)
              await ApiService.logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('로그아웃 오류:', error);
              // 오류가 발생해도 로컬 데이터는 삭제하고 로그인 화면으로 이동
              await ApiService.clearLoginData();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          },
        },
      ]
    );
  };

  const handleWithdrawal = async () => {
    // 필수 정보 확인
    if (!bankName || !bankAccount || !accountHolder) {
      Alert.alert('오류', '출금 계좌 정보를 확인할 수 없습니다.');
      return;
    }

    if (!user?.session?.member_id) {
      Alert.alert('오류', '사용자 정보를 확인할 수 없습니다.');
      return;
    }

    const balanceString = user?.session?.balance || '0';
    const numericAmount = parseFloat(String(balanceString).replace(/,/g, ''));
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('오류', '출금 가능한 금액이 없습니다.');
      return;
    }

    Alert.alert(
      '전액 출금 신청',
      `보유 금액 전액(${formatCurrency(numericAmount.toString())}원)을 출금 신청하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '확인', onPress: () => proceedWithdrawal(numericAmount) },
      ]
    );
  };

  const proceedWithdrawal = async (numericAmount) => {
    setLoading(true);

    try {
      const withdrawalData = {
        member_id: user.session.member_id,
        amount: numericAmount,
        bankName,
        bankAccount,
        accountHolder,
      };
      
      console.log('💰 출금 신청 데이터:', withdrawalData);

      const response = await ApiService.requestWithdrawal(withdrawalData);

      if (response.success) {
        // 출금 성공 시 잔액 차감
        const currentBalance = parseFloat(user.session?.balance || '0');
        const newBalance = Math.max(0, currentBalance - numericAmount);
        
        // 세션 데이터 업데이트
        await ApiService.updateSessionData('balance', newBalance.toString());
        
        // 사용자 정보 새로고침
        const updatedUser = await ApiService.getCurrentUser();
        if (updatedUser) {
          setUser(updatedUser);
        }
        
        Alert.alert(
          '출금 신청 완료',
          response.message || '출금 신청이 완료되었습니다.',
          [
            {
              text: '확인',
              onPress: () => {
                // 전액 출금이므로 초기화할 필요 없음
              },
            },
          ]
        );
      } else {
        Alert.alert('출금 신청 실패', response.message || '출금 신청에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    // 문자열이나 숫자 모두 처리
    const stringValue = typeof value === 'string' ? value : String(value || '0');
    const numericValue = stringValue.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 금액 입력은 제거하여 전액 출금만 지원

  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) {
      return '-';
    }
    if (accountNumber.length < 6) {
      return accountNumber;
    }
    
    // 앞 4자리 + 중간 * + 뒤 2자리
    const front = accountNumber.substring(0, 4);
    const back = accountNumber.substring(accountNumber.length - 2);
    const middle = '*'.repeat(Math.max(0, accountNumber.length - 6));
    
    return `${front}${middle}${back}`;
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>사용자 정보 로드 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 상단 뒤로가기/로그아웃 바 */}
      <View
        style={[
          styles.topBar,
          Platform.OS === 'android' && { paddingTop: (StatusBar.currentHeight || 16) },
          Platform.OS === 'ios' && { paddingTop: 16 },
        ]}
      >
        <Text style={styles.topTitle}>출금 요청</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>

          {/* 투자금 출금 계좌 정보 박스 */}
          <View style={styles.accountInfoBox}>
            <View style={styles.accountDisplayGroup}>
              <Text style={styles.accountLabel}>은행명</Text>
              <Text style={styles.accountValue}>{displayOrDash(bankName)}</Text>
            </View>

            <View style={styles.accountDisplayGroup}>
              <Text style={styles.accountLabel}>계좌번호</Text>
              <Text style={styles.accountNumberValue}>{maskAccountNumber(bankAccount)}</Text>
            </View>

            <View style={styles.accountDisplayGroup}>
              <Text style={styles.accountLabel}>예금주명</Text>
              <Text style={styles.accountValue}>{displayOrDash(accountHolder)}</Text>
            </View>
            
            <View style={styles.accountDisplayGroup}>
              <Text style={styles.accountLabel}>출금가능금액</Text>
              <Text style={styles.accountNumberValue}>
                {getSafeBalanceText(user?.session?.balance, formatCurrency)}
              </Text>
            </View>
          </View>


          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleWithdrawal}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>전액 출금 신청</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>출금 안내</Text>
          <Text style={styles.noticeText}>
            • 계좌변경은 본인명의 계좌로만 가능합니다.{'\n'}
            • 신한은행, 우리은행, 신협의 경우 (구)계좌는 이용이 불가능하며, 신 계좌번호(신한 110, 우리 1002, 신협 13 으로 시작)만 이용 가능 합니다.{'\n'}
            • 출금은 00:30 ~ 11:30 까지 가능합니다.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  content: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backIcon: {
    fontSize: 22,
    color: '#333333',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: '#F5F5F5',
  },
  logoutText: {
    color: '#666666',
    fontSize: 14,
  },
  userInfo: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF', // 파랑색으로 변경
    marginBottom: 5,
  },
  loginIdText: {
    fontSize: 14, // 같은 글자 크기
    color: '#333333', // 검정색으로 변경
    marginTop: 5,
    fontWeight: 'normal',
  },
  emailText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  balanceText: {
    fontSize: 18, // 크기 증가
    color: '#007AFF', // 파랑색으로 변경
    marginBottom: 15,
    fontWeight: 'bold', // 굵게 변경
    textAlign: 'center',
  },
  memberClassText: {
    fontSize: 14, // 같은 글자 크기 유지
    color: '#333333', // 검정색으로 변경
    marginTop: 5,
    fontWeight: 'normal',
  },
  formContainer: {
    padding: 20,
  },
  accountInfoBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  amountInfoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 10, // 20에서 15로 줄임
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  accountDisplayGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5, // 15에서 10으로 줄임
    paddingVertical: 5,
  },
  accountLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  accountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    flex: 2,
    textAlign: 'right',
  },
  accountNumberValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF', // 파랑색
    flex: 2,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amountInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    backgroundColor: '#FAFAFA',
  },
  balanceReadOnlyInput: {
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
    color: '#000000',
    fontSize: 18,
  },
  fullAmountButton: {
    height: 50,
    paddingHorizontal: 25,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullAmountButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    height: 50,
    backgroundColor: '#007AFF', // 파랑색으로 변경
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  notice: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF', // 파랑색 테두리
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF', // 파랑색으로 변경
    marginBottom: 10,
  },
  noticeText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});

export default WithdrawalScreen;
