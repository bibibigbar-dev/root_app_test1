import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  FlatList,
  Linking,
  Image,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

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

const WithdrawalScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(null);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    
    // 계좌 변경 후 새로고침
    if (route?.params?.refresh) {
      console.log('🔄 계좌 변경 후 데이터 새로고침');
      // 파라미터 초기화
      navigation.setParams({ refresh: undefined });
    }
  }, [route?.params?.refresh]);

  const loadUserData = async () => {
    try {
      // 직접 AsyncStorage에서 데이터 확인
      const rawUserData = await AsyncStorage.getItem('userData');
      const rawToken = await AsyncStorage.getItem('userToken');
      
      console.log('🔍 AsyncStorage 원본 데이터:');
      console.log('📋 userData:', rawUserData);
      console.log('📋 userToken:', rawToken);
      
      // 로그인 상태 체크 - 로그인이 안 되어 있으면 WithdrawalLogin 화면으로 이동
      if (!rawUserData || !rawToken) {
        console.log('❌ 로그인 상태 아님 - WithdrawalLogin 화면으로 이동');
        setInitialLoading(false);
        navigation.replace('WithdrawalLogin');
        return;
      }
      
      if (rawUserData) {
        const parsedData = JSON.parse(rawUserData);
        console.log('📋 파싱된 데이터:', JSON.stringify(parsedData, null, 2));
      }

      // 세션 만료 확인
      const loginCheck = await ApiService.checkLoginExpiration();
      if (loginCheck.expired) {
        console.log('세션 만료:', loginCheck.reason);
        await ApiService.clearLoginData();
        navigation.replace('WithdrawalLogin');
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

  const loadBankList = async () => {
    try {
      // AsyncStorage에서 저장된 은행 목록 가져오기
      const savedBankList = await AsyncStorage.getItem('bankList');
      
      if (savedBankList) {
        const bankList = JSON.parse(savedBankList);
        console.log('💾 저장된 은행 목록 로드:', bankList.length, '개');
        setBanks(bankList);
      } else {
        // 저장된 은행 목록이 없으면 기본 목록 사용
        console.log('⚠️ 저장된 은행 목록 없음 - 기본 목록 사용');
        setBanks([
          { bank_cd: '001', bank_nm: 'KB국민은행' },
          { bank_cd: '002', bank_nm: '산업은행' },
          { bank_cd: '003', bank_nm: '기업은행' },
          { bank_cd: '004', bank_nm: '국민은행' },
          { bank_cd: '005', bank_nm: '외환은행' },
          { bank_cd: '007', bank_nm: '수협중앙회' },
          { bank_cd: '011', bank_nm: '농협은행' },
          { bank_cd: '020', bank_nm: '우리은행' },
          { bank_cd: '023', bank_nm: 'SC제일은행' },
          { bank_cd: '027', bank_nm: '한국씨티은행' },
          { bank_cd: '031', bank_nm: '대구은행' },
          { bank_cd: '032', bank_nm: '부산은행' },
          { bank_cd: '034', bank_nm: '광주은행' },
          { bank_cd: '035', bank_nm: '제주은행' },
          { bank_cd: '037', bank_nm: '전북은행' },
          { bank_cd: '039', bank_nm: '경남은행' },
          { bank_cd: '045', bank_nm: '새마을금고' },
          { bank_cd: '048', bank_nm: '신협' },
          { bank_cd: '050', bank_nm: '상호저축은행' },
          { bank_cd: '071', bank_nm: '우체국' },
          { bank_cd: '081', bank_nm: 'KEB하나은행' },
          { bank_cd: '088', bank_nm: '신한은행' },
          { bank_cd: '089', bank_nm: '케이뱅크' },
          { bank_cd: '090', bank_nm: '카카오뱅크' },
        ]);
      }
    } catch (error) {
      console.error('은행 목록 로드 오류:', error);
      // 오류 발생 시 기본 은행 목록 설정
      setBanks([
        { bank_cd: '001', bank_nm: 'KB국민은행' },
        { bank_cd: '002', bank_nm: '산업은행' },
        { bank_cd: '003', bank_nm: '기업은행' },
        { bank_cd: '004', bank_nm: '국민은행' },
        { bank_cd: '005', bank_nm: '외환은행' },
        { bank_cd: '007', bank_nm: '수협중앙회' },
        { bank_cd: '011', bank_nm: '농협은행' },
        { bank_cd: '020', bank_nm: '우리은행' },
        { bank_cd: '023', bank_nm: 'SC제일은행' },
        { bank_cd: '027', bank_nm: '한국씨티은행' },
        { bank_cd: '031', bank_nm: '대구은행' },
        { bank_cd: '032', bank_nm: '부산은행' },
        { bank_cd: '034', bank_nm: '광주은행' },
        { bank_cd: '035', bank_nm: '제주은행' },
        { bank_cd: '037', bank_nm: '전북은행' },
        { bank_cd: '039', bank_nm: '경남은행' },
        { bank_cd: '045', bank_nm: '새마을금고' },
        { bank_cd: '048', bank_nm: '신협' },
        { bank_cd: '050', bank_nm: '상호저축은행' },
        { bank_cd: '071', bank_nm: '우체국' },
        { bank_cd: '081', bank_nm: 'KEB하나은행' },
        { bank_cd: '088', bank_nm: '신한은행' },
        { bank_cd: '089', bank_nm: '케이뱅크' },
        { bank_cd: '090', bank_nm: '카카오뱅크' },
      ]);
    }
  };

  const handleCallCustomerService = () => {
    const phoneNumber = '02-792-8934';
    const phoneUrl = Platform.OS === 'ios' ? `tel:${phoneNumber}` : `tel:${phoneNumber}`;
    
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert('오류', '전화 연결이 지원되지 않는 기기입니다.');
        }
      })
      .catch((err) => {
        console.error('전화 연결 오류:', err);
        Alert.alert('오류', '전화 연결에 실패했습니다.');
      });
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
      const memberId = user?.session?.member_id || user?.id;
      
      if (!memberId) {
        Alert.alert('오류', '사용자 정보를 확인할 수 없습니다.');
        setLoading(false);
        return;
      }

      // 1. setReqModes 호출하여 보안 데이터 획득
      const reqModes = await ApiService.setReqModes({ reqdata: String(numericAmount) });
      
      console.log('💰 출금 신청 데이터:', {
        member_id: memberId,
        refund_price: numericAmount,
        _bcsrmd1: reqModes.data1,
        _bcsrmd2: reqModes.data2,
      });

      // 2. /app/member/process/refund API 호출
      const refundRequestData = {
        member_id: String(memberId),
        refund_price: String(numericAmount),
        _bcsrmd1: reqModes.data1,
        _bcsrmd2: reqModes.data2,
      };
      
      const formData = ApiService.convertToFormData(refundRequestData);
      console.log('📤 출금 신청 Form-data:', formData);
      
      const response = await ApiService.api.post('/app/member/process/refund', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('💰 출금 신청 응답:', response.data);

      const responseData = String(response.data);

      if (responseData === '0') {
        // 출금 성공
        Alert.alert(
          '출금신청하기',
          '출금신청이 완료되었습니다.',
          [
            {
              text: '확인',
              onPress: async () => {
                // 사용자 정보 새로고침
                const updatedUser = await ApiService.getCurrentUser();
                if (updatedUser) {
                  setUser(updatedUser);
                }
              },
            },
          ]
        );
      } else if (responseData === '1') {
        // 로그인 필요
        Alert.alert('오류', '로그인이 필요합니다.', [
          {
            text: '확인',
            onPress: () => {
              navigation.navigate('Login');
            },
          },
        ]);
      } else if (responseData === '2' || responseData === '3') {
        // 출금금액 확인 필요
        Alert.alert('예치금 출금', '출금금액을 확인하여 주세요.');
      } else if (responseData === '4' || responseData === '5') {
        // 출금금액이 예치금보다 많음
        Alert.alert('예치금 출금', '출금금액이 예치금보다 많습니다.');
      } else if (responseData === '10') {
        // 직전 출금신청 처리중
        Alert.alert('예치금 출금', '직전 출금신청에 대한 내용을 처리중입니다. 잠시후에 다시 요청하세요.');
      } else if (responseData === '99') {
        // 은행사 통신 오류
        Alert.alert('예치금 출금', '은행사와 통신이 원활하지 않습니다.\n잠시 후 다시 요청하세요.');
      } else {
        // 기타 오류
        Alert.alert('예치금 출금', `[${responseData}] 처리도중 오류가 발생하였습니다.`);
      }
    } catch (error) {
      console.error('출금 신청 오류:', error);
      Alert.alert('예치금 출금', '처리도중 오류가 발생하였습니다.');
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
        <Text style={styles.topTitle}>출금 신청</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>

          {/* 계좌변경 버튼 */}
          <View style={styles.accountChangeButtonContainer}>
            <TouchableOpacity 
              style={styles.accountChangeButton}
              onPress={() => navigation.navigate('AccountChange')}
            >
              <Text style={styles.accountChangeButtonText}>계좌변경</Text>
            </TouchableOpacity>
          </View>

          {/* 은행명 */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>은행명</Text>
            <Text style={styles.infoValue}>{displayOrDash(bankName)}</Text>
          </View>

          {/* 계좌번호 */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>계좌번호</Text>
            <Text style={styles.infoValueBlue}>{maskAccountNumber(bankAccount)}</Text>
          </View>

          {/* 예금주명 */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>예금주명</Text>
            <Text style={styles.infoValue}>{displayOrDash(accountHolder)}</Text>
          </View>

          {/* 출금가능금액 박스 */}
          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>출금가능금액</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(user?.session?.balance || '0')} 원
            </Text>
          </View>

          {/* 전액 출금 신청 버튼 */}
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

          {/* 고객센터 연결 버튼 */}
          <TouchableOpacity
            style={styles.customerServiceButton}
            onPress={handleCallCustomerService}
          >
            <Text style={styles.customerServiceButtonText}>고객센터 연결</Text>
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

        {/* 고객문의 */}
        <View style={styles.customerInfoBox}>
          <View style={styles.customerInfoHeader}>
            <Image 
              source={require('../assets/images/foot_cs.png')} 
              style={[styles.customerInfoIcon, { tintColor: '#007AFF' }]}
              resizeMode="contain"
            />
            <Text style={styles.customerInfoTitle}>고객문의</Text>
          </View>
          <TouchableOpacity onPress={handleCallCustomerService}>
            <Text style={styles.customerInfoPhone}>02) 792.8934</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:cs@rootenergy.co.kr')}>
            <Text style={styles.customerInfoEmail}>cs@rootenergy.co.kr</Text>
          </TouchableOpacity>
          <Text style={styles.customerInfoTime}>평일 10시~17시 (점심 12시~13시)</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
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
    paddingTop: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    backgroundColor: '#FFFFFF',
  },
  topTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
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
    fontWeight: '500',
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
  accountChangeButtonContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  accountChangeButton: {
    marginRight: 20,
    paddingHorizontal: 26,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  accountChangeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  infoLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
  },
  infoValue: {
    fontSize: 22,
    fontWeight: '600',
    color: '#222',
    textAlign: 'right',
  },
  infoValueBlue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#007AFF',
    textAlign: 'right',
  },
  balanceBox: {
    marginTop: 30,
    paddingHorizontal: 28,
    paddingVertical: 33,
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  balanceAmount: {
    fontSize: 30,
    fontWeight: '700',
    color: '#007AFF',
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
    height: 56,
    backgroundColor: '#007AFF',
    borderRadius: 12,
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
    fontWeight: '700',
  },
  customerServiceButton: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  customerServiceButtonText: {
    color: '#007AFF',
    fontSize: 20,
    fontWeight: '700',
  },
  notice: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  noticeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  noticeText: {
    fontSize: 18,
    color: '#666666',
    lineHeight: 23,
  },
  // 고객문의
  customerInfoBox: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    alignItems: 'center',
  },
  customerInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerInfoIcon: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  customerInfoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  customerInfoPhone: {
    fontSize: 20,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  customerInfoEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 12,
    textDecorationLine: 'underline',
  },
  customerInfoTime: {
    fontSize: 16,
    fontWeight: '400',
    color: '#555',
  },
  // 모달 스타일
  modalMask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWrapper: {
    width: '90%',
    maxWidth: 400,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  modalContent: {
    marginBottom: 24,
  },
  modalField: {
    marginBottom: 25,
  },
  modalLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  modalInputContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalTextValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  modalSelectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalSelectText: {
    fontSize: 16,
    color: '#222',
  },
  modalSelectArrow: {
    fontSize: 12,
    color: '#666',
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    color: '#222',
  },
  modalButtonBox: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalConfirmButton: {
    backgroundColor: '#007AFF',
  },
  modalConfirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalSelectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalSelectText: {
    fontSize: 16,
    color: '#222',
  },
  modalSelectArrow: {
    fontSize: 12,
    color: '#666',
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    color: '#222',
  },
  modalButtonBox: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalConfirmButton: {
    backgroundColor: '#007AFF',
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // 은행 선택 모달 스타일
  bankPickerModalMask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankPickerModalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  bankPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bankPickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  bankPickerCloseButton: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
  },
  bankPickerScrollView: {
    height: 360, // 3개 카드 높이 (120 * 3)
  },
  bankPickerScrollContent: {
    paddingVertical: 120, // 위아래 패딩으로 중앙 정렬 효과
  },
  bankPickerItem: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bankPickerCard: {
    width: '100%',
    height: 100,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  bankPickerCardActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    transform: [{ scale: 1.05 }],
  },
  bankPickerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  bankPickerNameActive: {
    color: '#FFFFFF',
    fontSize: 22,
  },
  emptyBankText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default WithdrawalScreen;
