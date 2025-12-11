import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from 'react-native';
import ApiService from '../services/api';

const WithdrawalSurveyScreen = ({ navigation, route }) => {
  const { user } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [etcReason, setEtcReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [isEtcDisabled, setIsEtcDisabled] = useState(true);

  const reasonOptions = [
    { value: '1', label: '낮은 투자 수익' },
    { value: '2', label: '불확실한 안정성' },
    { value: '3', label: '투자 방법이 어렵고 불편해서' },
    { value: '0', label: '기타(주관식)' },
  ];

  // 탈퇴사유 선택에 따라 텍스트 박스 활성화/비활성화
  useEffect(() => {
    if (selectedReason === '0') {
      setIsEtcDisabled(false);
    } else {
      setEtcReason('');
      setIsEtcDisabled(true);
    }
  }, [selectedReason]);

  const handleWithdraw = async () => {
    if (!password) {
      Alert.alert('회원탈퇴', '비밀번호를 입력해주세요.');
      return;
    }

    if (!selectedReason) {
      Alert.alert('탈퇴사유', '탈퇴사유를 선택해주세요.');
      return;
    }

    if (selectedReason === '0' && !etcReason.trim()) {
      Alert.alert('탈퇴사유', '탈퇴사유를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const memberId = user?.session?.member_id || user?.id;

      const response = await ApiService.api.post('/app/my/process/withdraw', {
        member_pwd: password,
        withdraw_sel: selectedReason,
        withdraw_etc: etcReason,
        member_id: memberId,
      });

      if (response.data === '0') {
        // 탈퇴 완료 - 로그인 데이터 삭제 후 완료 화면으로 이동
        await ApiService.clearLoginData();
        navigation.replace('WithdrawalDone');
      } else if (response.data === '1') {
        Alert.alert('회원탈퇴', '비밀번호를 확인해 주세요.');
      } else if (response.data === '2' || response.data === '3') {
        Alert.alert(
          '회원탈퇴',
          '탈퇴가 불가능합니다. 진행중인 대출, 상환, 투자 내역 및 예치금을 확인하여 주십시오.'
        );
      } else {
        Alert.alert('회원탈퇴', '처리도중 오류가 발생하였습니다.');
      }
    } catch (error) {
      console.error('회원탈퇴 처리 실패:', error);
      Alert.alert('회원탈퇴', '처리도중 오류가 발생하였습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedReasonLabel = () => {
    const option = reasonOptions.find(opt => opt.value === selectedReason);
    return option ? option.label : '탈퇴 사유를 알려주세요.';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3db8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Back 버튼 헤더 */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Image 
              source={require('../assets/images/ico_back.png')} 
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}></Text>
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successWrapper}>
            <Image 
              source={require('../assets/images/ico_success.png')}
              style={styles.successIco}
              resizeMode="contain"
            />
            <Text style={styles.successMsg}>설문조사</Text>
            <Text style={styles.successDesc}>
              탈퇴 시 연 수익률 10%를 얻을 수 없게 됩니다.{'\n'}
              탈퇴 하시겠습니까?
            </Text>
          </View>

          <View style={styles.dataView}>
            {/* 비밀번호 */}
            <View style={styles.flexTr}>
              <View style={styles.flexTh}>
                <Text style={styles.flexThText}>비밀번호</Text>
              </View>
              <View style={styles.flexTd}>
                <View style={styles.flexInput}>
                  <TextInput
                    style={styles.input}
                    placeholder="비밀번호를 입력해주세요."
                    placeholderTextColor="#a3a7ab"
                    secureTextEntry={true}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            </View>

            {/* 탈퇴사유 선택 */}
            <View style={styles.flexTr}>
              <View style={styles.flexTh}>
                <Text style={styles.flexThText}>탈퇴사유</Text>
              </View>
              <View style={styles.flexTd}>
                <View style={styles.flexInput}>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowReasonModal(true)}
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        !selectedReason && styles.selectButtonPlaceholder,
                      ]}
                    >
                      {getSelectedReasonLabel()}
                    </Text>
                    <Text style={styles.selectArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* 기타 사유 입력 */}
            <View style={styles.flexTr}>
              <View style={styles.flexTh}>
                <Text style={styles.flexThText}></Text>
              </View>
              <View style={styles.flexTd}>
                <View style={styles.flexInput}>
                  <TextInput
                    style={[
                      styles.textarea,
                      isEtcDisabled && styles.textareaDisabled,
                    ]}
                    placeholder="탈퇴사유를 입력해주세요."
                    placeholderTextColor="#a3a7ab"
                    multiline={true}
                    numberOfLines={4}
                    maxLength={200}
                    value={etcReason}
                    onChangeText={setEtcReason}
                    textAlignVertical="top"
                    editable={!isEtcDisabled}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.btnBox}>
            <TouchableOpacity style={styles.btnStyle} onPress={handleWithdraw}>
              <Text style={styles.btnText}>탈퇴완료하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 탈퇴사유 선택 모달 */}
      <Modal
        visible={showReasonModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReasonModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReasonModal(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <Text style={styles.modalTitle}>탈퇴사유 선택</Text>

              <View style={styles.modalList}>
                {reasonOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedReason(option.value);
                      if (option.value !== '0') {
                        setEtcReason('');
                      }
                      setShowReasonModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedReason === option.value && styles.modalItemTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selectedReason === option.value && (
                      <Text style={styles.modalItemCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowReasonModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>닫기</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#f5f7fa',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    marginRight: 40,
  },
  successContainer: {
    paddingTop: 12,
  },
  successWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 24,
  },
  successIco: {
    width: 40,
    height: 40,
  },
  successMsg: {
    marginTop: 16,
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    textAlign: 'center',
  },
  successDesc: {
    marginTop: 16,
    color: '#666',
    fontSize: 15,
    lineHeight: 22.5,
    textAlign: 'center',
  },
  dataView: {
    marginTop: 24,
    marginHorizontal: 16,
    paddingBottom: 20,
    borderWidth: 0.5,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: 'rgba(81, 108, 137, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  flexTr: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    marginHorizontal: 20,
  },
  flexTh: {
    flex: 0,
    width: 69,
    minHeight: 44,
    marginRight: 12,
    display: 'flex',
    alignItems: 'center',
  },
  flexThText: {
    color: '#666',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '400',
  },
  flexTd: {
    flex: 1,
    fontSize: 13,
    lineHeight: 22.5,
    fontWeight: '400',
  },
  flexInput: {
    marginTop: 0,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fbfbfb',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fbfbfb',
  },
  selectButtonText: {
    flex: 1,
    fontSize: 13,
    color: '#222',
    fontWeight: '400',
  },
  selectButtonPlaceholder: {
    color: '#a3a7ab',
  },
  selectArrow: {
    fontSize: 10,
    color: '#a3a7ab',
    marginLeft: 8,
  },
  textarea: {
    height: 120,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    padding: 12,
    paddingTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: '#222',
    backgroundColor: '#fbfbfb',
  },
  textareaDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#a3a7ab',
  },
  btnBox: {
    paddingHorizontal: 16,
    paddingRight: 16,
    paddingBottom: 40,
    paddingLeft: 16,
    marginTop: 30,
  },
  btnStyle: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2c3db8',
  },
  btnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(34, 34, 34, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalList: {
    marginBottom: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  modalItemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 19.5,
    color: '#393f44',
    fontWeight: '400',
  },
  modalItemTextSelected: {
    color: '#2c3db8',
    fontWeight: '600',
  },
  modalItemCheck: {
    fontSize: 18,
    color: '#2c3db8',
    marginLeft: 8,
  },
  modalCloseButton: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
});

export default WithdrawalSurveyScreen;

