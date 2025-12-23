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
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import Header from '../components/Header';
import AppModal from '../components/AppModal';

const SCREEN_WIDTH = Dimensions.get('window').width;

const AccountChangeWithHeaderScreen = ({ navigation, route }) => {
  const [accountHolder, setAccountHolder] = useState('');
  const [banks, setBanks] = useState([]);
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [selectedBankName, setSelectedBankName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        const holder =
          parsed.session?.account_holder_name ||
          parsed.session?.r_name ||
          parsed.name ||
          '';
        setAccountHolder(holder);
      }

      // 은행 목록 API 호출
      try {
        const banksResponse = await ApiService.api.get('/member/get/banks');
        if (banksResponse.data) {
          setBanks(banksResponse.data);
        }
      } catch (bankError) {
        // AsyncStorage에서 fallback (조용히 무시)
        const bankList = await AsyncStorage.getItem('bankList');
        if (bankList) {
          const parsedBanks = JSON.parse(bankList);
          setBanks(parsedBanks);
        }
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  const handleChangeAccount = async () => {
    // 은행 선택 확인
    if (!selectedBankCode || selectedBankCode === '') {
      Alert.alert('계좌 변경', '은행을 선택하여 주십시오.');
      return;
    }

    // 계좌번호 입력 확인
    if (!newAccountNumber || newAccountNumber.trim() === '') {
      Alert.alert('계좌 변경', '계좌번호를 입력해주세요.');
      return;
    }

    // 숫자만 입력되었는지 확인
    if (isNaN(newAccountNumber) || !/^\d+$/.test(newAccountNumber)) {
      Alert.alert('계좌 변경', '가상계좌 번호를 확인하여 주십시오.');
      return;
    }

    setLoading(true);

    try {
      const userData = await AsyncStorage.getItem('userData');
      const user = userData ? JSON.parse(userData) : null;

      if (!user || !user.session || !user.session.member_id) {
        Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      const response = await ApiService.changeAccount({
        member_id: user.session.member_id,
        bank_cd: selectedBankCode,
        bank_nm: selectedBankName,
        account: newAccountNumber,
      });

      if (
        response.success &&
        (response.data.rtnvalue === '0' || response.data.rtnvalue === 0)
      ) {
        // 사용자 데이터 업데이트
        if (user.session) {
          user.session.bank_nm = selectedBankName;
          user.session.account = newAccountNumber;
        }
        if (user.member) {
          user.member.bank_nm = selectedBankName;
          user.member.account = newAccountNumber;
        }
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        
        Alert.alert('계좌 변경', '계좌가 정상적으로 변경되었습니다.', [
          {
            text: '확인',
            onPress: () => {
              // 자산관리 화면으로 돌아가면서 출금 탭으로 전환하고 리프레시
              const memberId = user?.session?.member_id || user?.member_id || user?.id;
              navigation.navigate('MyPage', {
                user: user,
                member_id: memberId,
                initialTab: 'assets',
                refresh: true,
                activeWithdrawTab: true, // 출금 탭 활성화
              });
            },
          },
        ]);
      } else {
        const rtnvalue = response.data?.rtnvalue;
        let errorMessage = '처리도중 오류가 발생하였습니다.';
        let errorTitle = '계좌인증';

        if (
          rtnvalue === '1' ||
          rtnvalue === 1 ||
          rtnvalue === '2' ||
          rtnvalue === 2 ||
          rtnvalue === '3' ||
          rtnvalue === 3
        ) {
          errorTitle = '계좌 등록';
          errorMessage = '잘못된 데이터 입니다.';
        } else if (rtnvalue === '5' || rtnvalue === 5) {
          errorTitle = '계좌인증';
          errorMessage =
            '확인할 수 없는 계좌입니다.\n계좌를 확인하여 주십시오.';
        } else if (rtnvalue === '6' || rtnvalue === 6) {
          errorTitle = '계좌인증';
          errorMessage =
            '인증받은 정보와 계좌주가 일치하지 않습니다.\n타인의 명의를 도용시 법적 책임을 받을 수 있습니다.';
        } else if (rtnvalue === '8' || rtnvalue === 8) {
          errorTitle = 'NHOPENAPI 오류';
          errorMessage =
            '현재 농협과의 통신이 원활하지 않습니다.\n잠시후에 다시 시도하여 주십시오.';
        }

        Alert.alert(errorTitle, errorMessage);
      }
    } catch (error) {
      console.error('계좌 변경 실패:', error);
      Alert.alert('오류', '처리도중 오류가 발생하였습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Back 버튼 */}
        <View style={styles.headCon}>
          <TouchableOpacity
            style={styles.btnBack}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={require('../assets/images/ico_back.png')}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* 제목 */}
          <View style={styles.titleBox}>
            <Text style={styles.title}>출금계좌 변경</Text>
          </View>
          <View style={styles.formContainer}>
            {/* 예금주 */}
            <View style={styles.field}>
              <Text style={styles.label}>예금주</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.textValue}>{accountHolder}</Text>
              </View>
            </View>

            {/* 은행선택 */}
            <View style={styles.field}>
              <Text style={styles.label}>은행선택</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowBankPicker(true)}
              >
                <Text style={styles.selectText}>
                  {selectedBankName || '은행을 선택하세요'}
                </Text>
                <Text style={styles.selectArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* 계좌번호 */}
            <View style={styles.field}>
              <Text style={styles.label}>계좌번호</Text>
              <TextInput
                style={styles.input}
                placeholder="기호('-')없이 숫자만 입력"
                placeholderTextColor="#999"
                value={newAccountNumber}
                onChangeText={setNewAccountNumber}
                keyboardType="numeric"
              />
            </View>
          </View>
        </ScrollView>

        {/* 버튼 - 화면 하단 고정 */}
        <View style={styles.buttonBox}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleChangeAccount}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>변경</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 은행 선택 모달 */}
      <AppModal
        visible={showBankPicker}
        title="은행 선택"
        onClose={() => setShowBankPicker(false)}
        primaryAction={{
          text: '닫기',
          onPress: () => setShowBankPicker(false),
        }}
            >
              {banks.length > 0 ? (
          banks.map(bank => (
                  <TouchableOpacity
                    key={bank.bank_cd}
                    style={[
                      styles.bankItem,
                selectedBankCode === bank.bank_cd && styles.bankItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedBankCode(bank.bank_cd);
                      setSelectedBankName(bank.bank_nm);
                      setShowBankPicker(false);
                    }}
                  >
              <Text
                style={[
                      styles.bankItemText,
                  selectedBankCode === bank.bank_cd &&
                    styles.bankItemTextSelected,
                ]}
              >
                      {bank.bank_nm}
                    </Text>
                    {selectedBankCode === bank.bank_cd && (
                      <Text style={styles.bankItemCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>은행 목록이 없습니다</Text>
                </View>
              )}
      </AppModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  headCon: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  btnBack: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  scrollView: {
    flex: 1,
  },
  titleBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    color: '#222',
  },
  formContainer: {
    padding: 24,
  },
  field: {
    marginBottom: 25,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  inputContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  selectButton: {
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
  selectText: {
    fontSize: 16,
    color: '#222',
  },
  selectArrow: {
    fontSize: 12,
    color: '#666',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    color: '#222',
  },
  buttonBox: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  confirmButton: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2c3db8',
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  // 모달 스타일
  modalMask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  modalCloseButton: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
  },
  bankListScroll: {
    maxHeight: 400,
  },
  bankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bankItemSelected: {
    backgroundColor: '#F0F7FF',
  },
  bankItemText: {
    fontSize: 16,
    color: '#333',
  },
  bankItemTextSelected: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  bankItemCheck: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default AccountChangeWithHeaderScreen;
