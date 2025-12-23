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
  Image,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import AppModal from '../components/AppModal';

const LoanRequestScreen = ({ navigation, route }) => {
  const { user, returnScreen } = route.params || {};
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [loType, setLoType] = useState('태양광');
  const [loPeriod, setLoPeriod] = useState('1');
  const [loPrice, setLoPrice] = useState('');
  const [purpose, setPurpose] = useState('');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeMust1, setAgreeMust1] = useState(false);
  const [agreeMust2, setAgreeMust2] = useState(false);
  const [agreeMust3, setAgreeMust3] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [termsTitle, setTermsTitle] = useState('');
  const [loanTerms, setLoanTerms] = useState(''); // 대출 이용약관
  const [priv1Terms, setPriv1Terms] = useState(''); // 개인정보 수집 및 이용
  const [priv2Terms, setPriv2Terms] = useState(''); // 개인정보 제3자 제공

  const loTypeOptions = [
    { label: '태양광', value: '태양광' },
    { label: '풍력', value: '풍력' },
    { label: 'ESS', value: 'ESS' },
    { label: '전기차충전소', value: '전기차충전소' },
  ];

  const loPeriodOptions = [
    { label: '1개월', value: '1' },
    { label: '2개월', value: '2' },
    { label: '3개월', value: '3' },
    { label: '4개월', value: '4' },
    { label: '5개월', value: '5' },
    { label: '6개월', value: '6' },
    { label: '7개월', value: '7' },
    { label: '8개월', value: '8' },
    { label: '9개월', value: '9' },
    { label: '10개월', value: '10' },
    { label: '11개월', value: '11' },
    { label: '12개월', value: '12' },
    { label: '18개월', value: '18' },
    { label: '24개월', value: '24' },
  ];

  useEffect(() => {
    // 페이지 로드 시 약관 데이터 가져오기
    loadTermsData();
  }, []);

  useEffect(() => {
    // 전체 동의 체크박스 업데이트
    if (agreeMust1 && agreeMust2 && agreeMust3) {
      setAgreeAll(true);
    } else {
      setAgreeAll(false);
    }
  }, [agreeMust1, agreeMust2, agreeMust3]);

  const loadTermsData = async () => {
    try {
      const response = await ApiService.api.get('/app/loan/request', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.data) {
        setLoanTerms(response.data.loan?.contents || '');
        setPriv1Terms(response.data.priv1?.contents || '');
        setPriv2Terms(response.data.priv2?.contents || '');
      }
    } catch (error) {
      console.error('❌ 약관 데이터 로드 오류:', error);
    }
  };

  const handleAgreeAll = () => {
    const newValue = !agreeAll;
    setAgreeAll(newValue);
    setAgreeMust1(newValue);
    setAgreeMust2(newValue);
    setAgreeMust3(newValue);
  };

  const formatCurrency = value => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '') return '';
    return parseInt(numericValue, 10).toLocaleString('ko-KR');
  };

  const handlePriceChange = text => {
    const formatted = formatCurrency(text);
    setLoPrice(formatted);
  };

  const showTerms = type => {
    if (type === 'loan') {
      setTermsTitle('대출 이용약관');
      setTermsContent(loanTerms);
    } else if (type === 'priv1') {
      setTermsTitle('개인(신용)정보 수집 및 이용 동의');
      setTermsContent(priv1Terms);
    } else if (type === 'priv2') {
      setTermsTitle('개인(신용)정보 제3자 제공 동의');
      setTermsContent(priv2Terms);
    }
    setShowTermsModal(true);
  };

  const handleSubmit = async () => {
    try {
      // 유효성 검사
      const numericPrice = loPrice.replace(/[^0-9]/g, '');
      
      if (!numericPrice || parseInt(numericPrice, 10) <= 0) {
        Alert.alert('대출신청', '대출 신청금액을 확인해주세요.');
        return;
      }

      if (!agreeMust1) {
        Alert.alert('대출신청', '대출 이용약관에 동의하세요.');
        return;
      }

      if (!agreeMust2) {
        Alert.alert('대출신청', '개인(신용)정보 수집 및 이용에 동의하세요.');
        return;
      }

      if (!agreeMust3) {
        Alert.alert('대출신청', '개인(신용)정보 제3자 제공에 동의하세요.');
        return;
      }

      setLoading(true);

      // 사용자 ID 가져오기
      const memberId = user?.session?.member_id || user?.id;
      if (!memberId) {
        Alert.alert('대출신청', '사용자 정보를 확인할 수 없습니다.');
        setLoading(false);
        return;
      }

      // API 호출
      const requestData = {
        member_id: String(memberId),
        lo_price: numericPrice,
        lo_class: 'O',
        lo_type: loType,
        lo_period: loPeriod,
        text1: purpose.trim(),
      };

      const response = await ApiService.api.post(
        '/app/loan/proc/request',
        ApiService.convertToFormData(requestData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const rtnvalue = String(response.data.rtnvalue);

      if (rtnvalue === '0') {
        // 성공 - 완료 화면으로 이동
        setLoading(false);
        navigation.navigate('LoanRequestDone', { 
          orderNumber: response.data.orderNumber,
          returnScreen: returnScreen || 'Loan',
        });
      } else if (rtnvalue === '500') {
        Alert.alert('대출신청', '사용할 수 없는 내용 포함!');
      } else {
        Alert.alert('대출신청', '처리도중 오류가 발생하였습니다.');
      }
    } catch (error) {
      console.error('❌ 대출 신청 오류:', error);
      Alert.alert('대출신청', '처리도중 오류가 발생하였습니다.');
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
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 제목 */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>대출 상담 신청하기</Text>
        </View>

        {/* 대출 유형 선택 */}
        <View style={styles.flexTr}>
          <View style={styles.flexTd}>
            <View style={styles.flexInput}>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowTypeModal(true)}
              >
                <Text style={styles.selectButtonText}>{loType}</Text>
                <Image
                  source={require('../assets/images/arrow_select.png')}
                  style={styles.selectArrow}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.starNotif}>
              * 태양광 / 풍력 / ESS / 전기차충전소 선택
            </Text>
          </View>
        </View>

        {/* 대출 기간 선택 */}
        <View style={styles.flexTr}>
          <View style={styles.flexTd}>
            <View style={styles.flexInput}>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowPeriodModal(true)}
              >
                <Text style={styles.selectButtonText}>{loPeriod}개월</Text>
                <Image
                  source={require('../assets/images/arrow_select.png')}
                  style={styles.selectArrow}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.starNotif}>
              * 대출기간(1~12개월, 18개월, 24개월) 선택
            </Text>
          </View>
        </View>

        {/* 대출 신청금액 */}
        <View style={styles.flexTr}>
          <View style={styles.flexTh}>
            <Text style={styles.flexThText}>대출 신청금액</Text>
          </View>
          <View style={styles.flexTd}>
            <View style={styles.flexInput}>
              <TextInput
                style={styles.textInput}
                value={loPrice}
                onChangeText={handlePriceChange}
                placeholder="대출신청금액 입력"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* 대출목적 */}
        <View style={styles.flexTr}>
          <View style={styles.flexTh}>
            <Text style={styles.flexThText}>대출목적</Text>
          </View>
          <View style={styles.flexTd}>
            <View style={styles.flexInput}>
              <TextInput
                style={styles.textareaInput}
                value={purpose}
                onChangeText={setPurpose}
                placeholder="대출목적 입력"
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* 약관 동의 */}
        <View style={styles.termsArea}>
          {/* 전체 동의 */}
          <View style={styles.termsBox}>
            <TouchableOpacity 
              style={styles.termsBoxLabel}
              onPress={handleAgreeAll}
            >
              <Image
                source={
                  agreeAll 
                    ? require('../assets/images/checkbox_on.png')
                    : require('../assets/images/checkbox_off.png')
                }
                style={styles.checkboxIcon}
                resizeMode="contain"
              />
              <Text style={styles.termsBoxText}>약관 전체 동의</Text>
            </TouchableOpacity>
          </View>

          {/* 개별 약관 */}
          <View style={styles.termsList}>
            <View style={styles.termsListItem}>
              <TouchableOpacity 
                style={styles.termsItemRow}
                onPress={() => setAgreeMust1(!agreeMust1)}
              >
                <Image
                  source={
                    agreeMust1 
                      ? require('../assets/images/checkbox_on.png')
                      : require('../assets/images/checkbox_off.png')
                  }
                  style={styles.checkboxIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.termsLink}
                onPress={() => showTerms('loan')}
              >
                <Text style={styles.termsLinkText}>
                  <Text style={styles.colorBlue}>(필수)</Text> 대출 이용약관
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.termsListItem}>
              <TouchableOpacity 
                style={styles.termsItemRow}
                onPress={() => setAgreeMust2(!agreeMust2)}
              >
                <Image
                  source={
                    agreeMust2 
                      ? require('../assets/images/checkbox_on.png')
                      : require('../assets/images/checkbox_off.png')
                  }
                  style={styles.checkboxIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.termsLink}
                onPress={() => showTerms('priv1')}
              >
                <Text style={styles.termsLinkText}>
                  <Text style={styles.colorBlue}>(필수)</Text> 개인(신용)정보
                  수집 및 이용 동의
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.termsListItem}>
              <TouchableOpacity 
                style={styles.termsItemRow}
                onPress={() => setAgreeMust3(!agreeMust3)}
              >
                <Image
                  source={
                    agreeMust3 
                      ? require('../assets/images/checkbox_on.png')
                      : require('../assets/images/checkbox_off.png')
                  }
                  style={styles.checkboxIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.termsLink}
                onPress={() => showTerms('priv2')}
              >
                <Text style={styles.termsLinkText}>
                  <Text style={styles.colorBlue}>(필수)</Text> 개인(신용)정보
                  제3자 제공 동의
                </Text>
              </TouchableOpacity>
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

      {/* 대출 유형 선택 모달 */}
      <AppModal
        visible={showTypeModal}
        title="대출 유형 선택"
        onClose={() => setShowTypeModal(false)}
        primaryAction={{ text: '닫기', onPress: () => setShowTypeModal(false) }}
      >
        {loTypeOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
              loType === option.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setLoType(option.value);
                    setShowTypeModal(false);
                  }}
                >
            <Text
              style={[
                    styles.modalOptionText,
                loType === option.value && styles.modalOptionTextSelected,
              ]}
            >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
      </AppModal>

      {/* 대출 기간 선택 모달 */}
      <AppModal
        visible={showPeriodModal}
        title="대출 기간 선택"
        onClose={() => setShowPeriodModal(false)}
        primaryAction={{
          text: '닫기',
          onPress: () => setShowPeriodModal(false),
        }}
      >
        {loPeriodOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
              loPeriod === option.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setLoPeriod(option.value);
                    setShowPeriodModal(false);
                  }}
                >
            <Text
              style={[
                    styles.modalOptionText,
                loPeriod === option.value && styles.modalOptionTextSelected,
              ]}
            >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
      </AppModal>

      {/* 약관 상세 모달 */}
      <AppModal
        visible={showTermsModal}
        title={termsTitle}
        onClose={() => setShowTermsModal(false)}
        primaryAction={{
          text: '닫기',
          onPress: () => setShowTermsModal(false),
        }}
      >
                {termsContent ? (
                  <RenderHTML
                    contentWidth={width - 80}
                    source={{ html: termsContent }}
                    tagsStyles={{
                      body: {
                        color: '#666',
                        fontSize: 13,
                        lineHeight: 19.5,
                        fontWeight: '400',
                      },
                      p: {
                        marginTop: 8,
                        marginBottom: 8,
                      },
                      div: {
                        marginTop: 8,
                        marginBottom: 8,
                      },
                    }}
                  />
                ) : (
          <Text style={styles.popTermsText}>
            약관 내용을 불러오는 중입니다...
          </Text>
                )}
      </AppModal>
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
  scrollContent: {
    //paddingBottom: 10,
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
    width: 75,
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
  starNotif: {
    marginTop: 12,
    paddingLeft: 7,
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
    letterSpacing: -0.39,
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
  termsArea: {
    marginTop: 30,
    marginHorizontal: 20,
  },
  termsBox: {
    marginTop: 5,
  },
  termsBoxLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 55,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: 'rgba(81, 108, 137, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  termsBoxText: {
    fontSize: 15,
    lineHeight: 19.5,
    fontWeight: '600',
    color: '#222',
  },
  checkboxIcon: {
    width: 21,
    height: 21,
    marginRight: 12,
  },
  termsList: {
    marginTop: 16,
    marginHorizontal: 20,
  },
  termsListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  termsItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsLink: {
    flex: 1,
  },
  termsLinkText: {
    fontSize: 14,
    color: '#666',
  },
  colorBlue: {
    color: '#2c3db8',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    maxHeight: '60%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  termsModalContent: {
    maxHeight: '80%',
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
  // 약관 모달 (common.css pop_container 스타일)
  popContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 48,
    paddingBottom: 48,
  },
  popMask: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(34, 34, 34, 0.7)',
  },
  popWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popBox: {
    position: 'relative',
    width: '100%',
    maxHeight: '80%',
    padding: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  popTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 16,
  },
  popCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  popCloseText: {
    fontSize: 28,
    color: '#666',
    lineHeight: 32,
  },
  popTermsScroll: {
    maxHeight: '100%',
    paddingHorizontal: 4,
  },
  popTermsText: {
    marginTop: 8,
    color: '#666',
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
  },
});

export default LoanRequestScreen;
