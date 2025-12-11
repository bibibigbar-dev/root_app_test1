import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  Image,
} from 'react-native';
import ApiService from '../services/api';

const ConsultationRequestScreen = ({ navigation, route }) => {
  const { user } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [csType, setCsType] = useState('C'); // C: 법인회원, B: 여신금융기관, S: 전문투자자
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [csCompany, setCsCompany] = useState('');
  const [csName, setCsName] = useState('');
  const [csTel, setCsTel] = useState('');
  const [csEmail, setCsEmail] = useState('');
  const [csContents, setCsContents] = useState('');

  const csTypeOptions = [
    { label: '법인회원', value: 'C' },
    { label: '여신금융기관', value: 'B' },
    { label: '전문투자자', value: 'S' },
  ];

  const getCsTypeKr = (type) => {
    const option = csTypeOptions.find(opt => opt.value === type);
    return option ? option.label : '';
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return regex.test(email);
  };

  const handleSubmit = async () => {
    try {
      // 유효성 검사
      if (csType === 'C' || csType === 'B') {
        if (csCompany.trim() === '') {
          Alert.alert('상담 신청하기', '법인명(회사명)을 입력해주세요.');
          return;
        }
        if (csName.trim() === '') {
          Alert.alert('상담 신청하기', '담당자를 입력해주세요.');
          return;
        }
      }

      if (csType === 'S') {
        if (csName.trim() === '') {
          Alert.alert('상담 신청하기', '이름을 입력해주세요.');
          return;
        }
      }

      if (csTel.trim() === '' || csTel.length < 8) {
        Alert.alert('상담 신청하기', '연락처를 입력해주세요.');
        return;
      }

      if (csEmail.trim() === '') {
        Alert.alert('상담 신청하기', '이메일을 입력해주세요.');
        return;
      }

      if (!validateEmail(csEmail)) {
        Alert.alert('상담 신청하기', '이메일 형식이 올바르지 않습니다.');
        return;
      }

      if (csContents.trim() === '') {
        Alert.alert('상담 신청하기', '문의사항을 입력해주세요.');
        return;
      }

      setLoading(true);

      // API 호출 - 백엔드 파라미터와 정확히 일치
      const csTypeKr = getCsTypeKr(csType);
      const requestData = {
        cs_type: csTypeKr,
        cs_company: csCompany.trim(),
        cs_name: csName.trim(),
        cs_tel: csTel.trim(),
        cs_email: csEmail.trim(),
        cs_contents: csContents.trim(),
      };

      const response = await ApiService.api.post('/app/insertCsRequest', 
        ApiService.convertToFormData(requestData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      const rtnvalue = String(response.data);

      if (rtnvalue === '0') {
        // 성공 - 완료 화면으로 이동
        setLoading(false);
        navigation.navigate('ConsultationRequestDone');
      } else if (rtnvalue === '1') {
        // 입력정보 오류
        Alert.alert('상담 신청하기', '입력정보를 확인해주세요.');
      } else if (rtnvalue === '2') {
        // XSS 검증 실패
        Alert.alert('상담 신청하기', '문의사항에 허용되지 않는 문자가 포함되어 있습니다.');
      } else {
        // 기타 오류
        Alert.alert('상담 신청하기', '처리도중 오류가 발생하였습니다.');
      }
    } catch (error) {
      console.error('❌ 상담 신청 오류:', error);
      Alert.alert('상담 신청하기', '처리도중 오류가 발생하였습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
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
        <Text style={styles.headTitle}></Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* 제목 */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>1:1 상담 신청하기</Text>
        </View>

        {/* 회원 유형 선택 */}
        <View style={styles.flexTr}>
          <View style={styles.flexTd}>
            <View style={styles.flexInput}>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowTypeModal(true)}
              >
                <Text style={styles.selectButtonText}>{getCsTypeKr(csType)}</Text>
                <Image
                  source={require('../assets/images/arrow_select.png')}
                  style={styles.selectArrow}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.starNotif}>
              * 법인회원 / 여신금융기관 / 전문투자자 선택
            </Text>
          </View>
        </View>

        {/* 유형 선택 모달 */}
        <Modal
          visible={showTypeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTypeModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowTypeModal(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>회원 유형 선택</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowTypeModal(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                {csTypeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalOption,
                      csType === option.value && styles.modalOptionSelected
                    ]}
                    onPress={() => {
                      setCsType(option.value);
                      setShowTypeModal(false);
                    }}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      csType === option.value && styles.modalOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 법인명 */}
        {(csType === 'C' || csType === 'B') && (
          <View style={styles.flexTr}>
            <View style={styles.flexTh}>
              <Text style={styles.flexThText}>법인명</Text>
            </View>
            <View style={styles.flexTd}>
              <View style={styles.flexInput}>
                <TextInput
                  style={styles.textInput}
                  value={csCompany}
                  onChangeText={setCsCompany}
                  placeholder="법인명 입력"
                  placeholderTextColor="#a3a7ab"
                />
              </View>
            </View>
          </View>
        )}

        {/* 담당자 / 이름 */}
        <View style={styles.flexTr}>
          <View style={styles.flexTh}>
            <Text style={styles.flexThText}>
              {csType === 'S' ? '이름' : '담당자'}
            </Text>
          </View>
          <View style={styles.flexTd}>
            <View style={styles.flexInput}>
              <TextInput
                style={styles.textInput}
                value={csName}
                onChangeText={setCsName}
                placeholder={csType === 'S' ? '이름 입력' : '담당자 입력'}
                placeholderTextColor="#a3a7ab"
              />
            </View>
          </View>
        </View>

        {/* 연락처 */}
        <View style={styles.flexTr}>
          <View style={styles.flexTh}>
            <Text style={styles.flexThText}>연락처</Text>
          </View>
          <View style={styles.flexTd}>
            <View style={styles.flexInput}>
              <TextInput
                style={styles.textInput}
                value={csTel}
                onChangeText={setCsTel}
                placeholder="연락처 입력"
                placeholderTextColor="#a3a7ab"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* 이메일 */}
        <View style={styles.flexTr}>
          <View style={styles.flexTh}>
            <Text style={styles.flexThText}>이메일</Text>
          </View>
          <View style={styles.flexTd}>
            <View style={styles.flexInput}>
              <TextInput
                style={styles.textInput}
                value={csEmail}
                onChangeText={setCsEmail}
                placeholder="이메일 입력"
                placeholderTextColor="#a3a7ab"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* 문의사항 */}
        <View style={styles.flexTr}>
          <View style={styles.flexTh}>
            <Text style={styles.flexThText}>문의사항</Text>
          </View>
          <View style={styles.flexTd}>
            <View style={styles.flexInput}>
              <TextInput
                style={styles.textareaInput}
                value={csContents}
                onChangeText={setCsContents}
                placeholder="문의사항을 입력해주세요"
                placeholderTextColor="#a3a7ab"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* 신청 버튼 */}
        <View style={styles.btnBox}>
          <TouchableOpacity
            style={styles.btnStyle}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>신청하기</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headCon: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    //backgroundColor: '#fff',
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
  headTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    marginRight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    textAlign: 'left',
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
    justifyContent: 'center',
  },
  flexThText: {
    color: '#666',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '400',
  },
  flexTd: {
    flex: 1,
  },
  flexInput: {
    marginTop: 0,
  },
  selectButton: {
    height: 44,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    backgroundColor: '#fbfbfb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonText: {
    color: '#222',
    fontSize: 15,
    fontWeight: '600',
  },
  selectArrow: {
    width: 14,
    height: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 24,
    color: '#666',
  },
  modalBody: {
    padding: 10,
  },
  modalOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 5,
  },
  modalOptionSelected: {
    backgroundColor: '#ebf0f8',
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  modalOptionTextSelected: {
    color: '#2c3db8',
  },
  textInput: {
    height: 44,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    fontSize: 15,
    lineHeight: 22.5,
    fontWeight: '600',
    backgroundColor: '#fbfbfb',
    color: '#222',
  },
  textareaInput: {
    height: 120,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    backgroundColor: '#fbfbfb',
    color: '#222',
    textAlignVertical: 'top',
  },
  starNotif: {
    marginTop: 12,
    paddingLeft: 7,
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
    letterSpacing: -0.39,
  },
  btnBox: {
    marginTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  btnStyle: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2c3db8',
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ConsultationRequestScreen;

