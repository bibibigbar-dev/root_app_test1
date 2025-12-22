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
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import AppModal from '../components/AppModal';

const SCREEN_WIDTH = Dimensions.get('window').width;

const AccountChangeScreen = ({ navigation, route }) => {
  const [accountHolder, setAccountHolder] = useState('');
  const [banks, setBanks] = useState([]);
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [selectedBankName, setSelectedBankName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const bankList = await AsyncStorage.getItem('bankList');

      if (userData) {
        const parsed = JSON.parse(userData);
        const holder =
          parsed.session?.account_holder_name ||
          parsed.session?.r_name ||
          parsed.name ||
          '';
        setAccountHolder(holder);
      }

      if (bankList) {
        const parsedBanks = JSON.parse(bankList);
        setBanks(parsedBanks);
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
              // 출금 신청 화면으로 돌아가면서 새로고침 플래그 전달
              navigation.navigate('Withdrawal', { refresh: true });
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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>출금계좌 변경</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
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

        {/* 버튼 */}
        <View style={styles.buttonBox}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
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

      {/* 은행 선택 모달 - 일반 스크롤 목록 */}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
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
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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

export default AccountChangeScreen;
