import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

// 가입 경로 옵션
const joinRootOptions = [
  { label: '선택해주세요', value: '선택해주세요' },
  { label: '지인소개', value: '지인소개' },
  { label: '인터넷 검색', value: '인터넷 검색' },
  { label: '구글 광고', value: '구글 광고' },
  { label: '네이버 광고', value: '네이버 광고' },
  { label: 'SNS(페이스북·인스타그램) 광고', value: 'SNS(페이스북/인스타그램) 광고' },
  { label: '뉴스/기사', value: '뉴스/기사' },
  { label: '인터넷 커뮤니티', value: '인터넷 커뮤니티' },
  { label: '세미나/교육/포럼', value: '세미나/교육/포럼' },
  { label: '광고지/우편물', value: '광고지/우편물' },
  { label: '기타', value: 'ETC' },
];

const SignUpCorpFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { marketing, bc5jsencpublickey } = route.params || {};

  const [corpName, setCorpName] = useState('');
  const [corpNo, setCorpNo] = useState('');
  const [corpNoTemp, setCorpNoTemp] = useState('');
  const [corpNoVerified, setCorpNoVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [joinRoot, setJoinRoot] = useState('선택해주세요');
  const [joinRootEtc, setJoinRootEtc] = useState('');
  const [showJoinRootModal, setShowJoinRootModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingCorpNo, setCheckingCorpNo] = useState(false);

  // 사업자번호 조회 (국세청 API 직접 호출)
  const handleCheckCorpNo = async () => {
    if (!corpNoTemp || corpNoTemp.length < 10) {
      Alert.alert('사업자번호 조회', '사업자번호를 정확하게 입력해주세요.');
      return;
    }

    try {
      setCheckingCorpNo(true);
      
      console.log('🔍 사업자번호 조회 시작:', corpNoTemp);
      
      const data = {
        b_no: [corpNoTemp]
      };
      
      const serviceKey = 'R8wLA%2BjGmUyPNyjHuPQsIzCQlZg1Qkvq6pIITuiz6TtCEGMJ1ALzuvvd8%2BoL6TXo3YoTmC3ZR0RN04yB%2BSxzVA%3D%3D';
      
      const response = await fetch(
        `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${serviceKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();
      console.log('✅ 사업자번호 조회 결과:', JSON.stringify(result, null, 2));

      // status_code 확인
      if (result.status_code === 'OK' && result.data && result.data.length > 0) {
        const bizData = result.data[0];
        console.log('📋 사업자 상태 코드:', bizData.b_stt_cd);
        console.log('📋 사업자 상태:', bizData.b_stt);
        
        let checkNextStep = false;
        
        if (bizData.b_stt_cd === '01') {
          // 계속사업자
          Alert.alert('사업자번호 조회', '조회가 완료되었습니다.');
          checkNextStep = true;
        } else if (bizData.b_stt_cd === '02') {
          // 휴업자
          Alert.alert(
            '사업자번호 조회',
            '휴업자 등록번호 입니다. 계속 진행하시겠습니까?',
            [
              { text: '취소', style: 'cancel' },
              { 
                text: '확인', 
                onPress: () => {
                  setCorpNo(corpNoTemp);
                  setCorpNoVerified(true);
                }
              }
            ]
          );
          return;
        } else if (bizData.b_stt_cd === '03') {
          // 폐업자
          Alert.alert(
            '사업자번호 조회',
            '폐업자 등록번호 입니다. 계속 진행하시겠습니까?',
            [
              { text: '취소', style: 'cancel' },
              { 
                text: '확인', 
                onPress: () => {
                  setCorpNo(corpNoTemp);
                  setCorpNoVerified(true);
                }
              }
            ]
          );
          return;
        } else {
          // 기타 상태 코드
          console.warn('⚠️ 알 수 없는 사업자 상태:', bizData.b_stt_cd, bizData.b_stt);
          Alert.alert(
            '사업자번호 조회',
            `사업자 상태: ${bizData.b_stt || '알 수 없음'}\n계속 진행하시겠습니까?`,
            [
              { text: '취소', style: 'cancel' },
              { 
                text: '확인', 
                onPress: () => {
                  setCorpNo(corpNoTemp);
                  setCorpNoVerified(true);
                }
              }
            ]
          );
          return;
        }
        
        if (checkNextStep) {
          setCorpNo(corpNoTemp);
          setCorpNoVerified(true);
        }
      } else if (result.status_code === 'NO_DATA') {
        // 데이터 없음
        console.warn('⚠️ 사업자번호 조회 결과 없음');
        Alert.alert(
          '사업자번호 조회',
          '등록되지 않은 사업자번호입니다.'
        );
      } else {
        // 기타 오류
        console.error('❌ API 응답 오류:', result);
        Alert.alert(
          '사업자번호 조회',
          `확인할 수 없습니다. (${result.status_code || 'UNKNOWN'})\n사업자번호를 확인하여 주세요.`
        );
      }
    } catch (error) {
      console.error('❌ 사업자번호 조회 오류:', error);
      Alert.alert(
        '사업자번호 조회',
        error.message || '처리도중 오류가 발생하였습니다.'
      );
    } finally {
      setCheckingCorpNo(false);
    }
  };

  const handleChangeCorpNo = () => {
    setCorpNo('');
    setCorpNoTemp('');
    setCorpNoVerified(false);
  };

  // 회원가입 처리
  const handleSubmit = async () => {
    // 사업자번호 확인
    if (!corpNo) {
      Alert.alert('회원가입', '사업자번호 입력 후 조회하기를 클릭해주세요.');
      return;
    }

    // 법인명 체크
    if (!corpName.trim()) {
      Alert.alert('회원가입', '법인명(상호명)을 입력하세요');
      return;
    }

    // 이메일 체크
    const validationEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email.trim()) {
      Alert.alert('회원가입', '이메일을 입력하세요');
      return;
    }
    if (!validationEmail.test(email)) {
      Alert.alert('회원가입', '이메일 형식이 올바르지 않습니다.');
      return;
    }

    // 비밀번호 체크
    const validationPwd = /^((?=.*[0-9])(?=.*[a-z])(?=.*[!@#$%^&*]).{10,20})/;
    if (!password) {
      Alert.alert('회원가입', '비밀번호를 입력하여 주십시오.');
      return;
    }
    if (!passwordConfirm) {
      Alert.alert('회원가입', '비밀번호를 재입력하여 주십시오.');
      return;
    }
    if (password.length < 10) {
      Alert.alert('회원가입', '비밀번호 형식에 맞지 않습니다.(10자리 이상 영문/숫자/특수문자 조합)');
      return;
    }
    if (!validationPwd.test(password)) {
      Alert.alert('회원가입', '비밀번호 형식에 맞지 않습니다.(10자리 이상 영문/숫자/특수문자 조합)');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('회원가입', '비밀번호를 다시 확인하여 주십시오.');
      return;
    }

    try {
      setLoading(true);

      const finalJoinRoot = joinRoot === 'ETC' ? joinRootEtc : joinRoot;

      // TODO: 비밀번호 암호화 필요 (_bc5jsencsetdata)
      const encryptedPassword = password; // 임시로 평문 사용

      const signUpData = {
        cpno: corpNo,
        web_id: email,
        email: email,
        member_name: corpName,
        member_pwd: encryptedPassword,
        nomin_id: '',
        join_root: finalJoinRoot,
        marketing: marketing || 'N',
      };

      console.log('📤 법인 회원가입 요청 데이터:', signUpData);

      const response = await ApiService.api.post('/app/corpJoinProcess', signUpData);

      console.log('📥 법인 회원가입 응답:', response.data);

      const rtnvalue = String(response.data.rtnvalue || response.data).trim();
      const member_id = response.data.member_id || '';

      if (rtnvalue === '0') {
        // 회원가입 성공
        console.log('✅ 회원가입 성공, member_id:', member_id);
        
        // 자동 로그인 처리
        if (member_id) {
          try {
            console.log('🔐 자동 로그인 시작...');
            
            const loginData = {
              web_id: email,
              member_pwd: password, // 사용자가 입력한 평문 비밀번호
            };
            
            const loginResponse = await ApiService.api.post('/app/loginProcess', loginData);
            console.log('📥 자동 로그인 응답:', loginResponse.data);
            
            if (loginResponse.data.rtnvalue === '0' && loginResponse.data.member) {
              // 로그인 성공 - 세션 저장
              const userData = {
                id: loginResponse.data.member.member_id,
                email: loginResponse.data.member.email,
                name: loginResponse.data.member.member_name,
                loginId: loginResponse.data.member.web_id,
                loginTime: Date.now(),
                expirationTime: Date.now() + (24 * 60 * 60 * 1000), // 24시간
                session: loginResponse.data.member,
                member: loginResponse.data.member,
              };
              
              await AsyncStorage.setItem('userData', JSON.stringify(userData));
              console.log('✅ 자동 로그인 완료 및 세션 저장');
            } else {
              console.warn('⚠️ 자동 로그인 실패, 수동 로그인 필요');
            }
          } catch (loginError) {
            console.error('❌ 자동 로그인 오류:', loginError);
            console.log('⚠️ 자동 로그인 실패했지만 인증 화면으로 이동');
          }
        }
        
        // 서비스 이용신청 화면으로 이동
        navigation.replace('MyCert', {
          use_tf_join: 'Y',
          f_joinType: 'corp',
          member_id: member_id,
        });
      } else if (rtnvalue === '1') {
        Alert.alert('회원가입', '입력정보를 확인해주세요.');
      } else if (rtnvalue === '2') {
        Alert.alert('회원가입', '인증정보가 올바르지 않습니다.\n(법인휴대전화의 경우 실 사용자 등록이 되어야 합니다.)');
      } else if (rtnvalue === '3') {
        Alert.alert('회원가입', '이미 가입된 이메일 입니다.');
      } else if (rtnvalue === '4') {
        Alert.alert('회원가입', '이미 가입된 회원입니다.');
      } else if (rtnvalue === '5') {
        Alert.alert('회원가입', '이미 가입된 아이디입니다.');
      } else {
        Alert.alert('회원가입', '계정 정보를 확인하여 주십시오.');
      }
    } catch (error) {
      console.error('❌ 법인 회원가입 오류:', error);
      console.error('❌ 오류 상세:', error.response?.data);
      Alert.alert('오류', '처리도중 오류가 발생하였습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Image
            source={require('../assets/images/ico_back.png')}
            style={styles.backButtonImage}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.titleBox}>
          <Text style={styles.title}>
            법인계정으로 사용할{'\n'}정보를 입력해주세요
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* 법인명 */}
          <View style={styles.flexTit}>
            <Text style={styles.tit}>법인명 (상호명)</Text>
          </View>
          <View style={styles.flexInput}>
            <TextInput
              style={styles.input}
              value={corpName}
              onChangeText={setCorpName}
              placeholder="법인명 입력"
              placeholderTextColor="#bfc3c7"
            />
          </View>

          {/* 사업자번호 */}
          <View style={styles.flexTit}>
            <Text style={styles.tit}>사업자번호</Text>
          </View>
          <View style={styles.flexInputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex, corpNoVerified && styles.inputDisabled]}
              value={corpNoTemp}
              onChangeText={setCorpNoTemp}
              placeholder="사업자번호 입력"
              placeholderTextColor="#bfc3c7"
              keyboardType="number-pad"
              editable={!corpNoVerified}
            />
            {!corpNoVerified ? (
              <TouchableOpacity
                style={[styles.btnCheck, checkingCorpNo && styles.btnCheckDisabled]}
                onPress={handleCheckCorpNo}
                disabled={checkingCorpNo}
              >
                {checkingCorpNo ? (
                  <ActivityIndicator size="small" color="#393f44" />
                ) : (
                  <Text style={styles.btnCheckText}>조회하기</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btnCheck} onPress={handleChangeCorpNo}>
                <Text style={styles.btnCheckText}>변경하기</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 이메일 */}
          <View style={styles.flexTit}>
            <Text style={styles.tit}>이메일 (로그인 아이디)</Text>
          </View>
          <View style={styles.flexInput}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일 입력"
              placeholderTextColor="#bfc3c7"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.noticeText}>* 이메일 주소는 변경이 불가합니다.</Text>
          <Text style={styles.noticeText}>* 실사용 이메일 주소로 기입해주시기 바랍니다.</Text>

          {/* 비밀번호 */}
          <View style={styles.flexTit}>
            <Text style={styles.tit}>비밀번호</Text>
          </View>
          <View style={styles.flexInput}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호 입력"
              placeholderTextColor="#bfc3c7"
              secureTextEntry={true}
              textContentType="oneTimeCode"
              autoComplete="off"
            />
          </View>
          <View style={styles.flexInput}>
            <TextInput
              style={styles.input}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder="비밀번호 재입력"
              placeholderTextColor="#bfc3c7"
              secureTextEntry={true}
              textContentType="oneTimeCode"
              autoComplete="off"
            />
          </View>
          <Text style={styles.noticeText}>
            * 영문, 숫자, 특수문자(숫자키 상단 특수문자만 가능) 최소 10자리 이상으로 입력해 주셔야 합니다.
          </Text>

          {/* 가입 경로 */}
          <View style={styles.flexTit}>
            <Text style={styles.tit}>가입 경로 (선택)</Text>
          </View>
          <View style={styles.flexInput}>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setShowJoinRootModal(true)}
            >
              <Text style={styles.selectText}>
                {joinRootOptions.find(opt => opt.value === joinRoot)?.label || '선택해주세요'}
              </Text>
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
          </View>
          {joinRoot === 'ETC' && (
            <View style={styles.flexInput}>
              <TextInput
                style={styles.input}
                value={joinRootEtc}
                onChangeText={setJoinRootEtc}
                placeholder="기타입력"
                placeholderTextColor="#bfc3c7"
              />
            </View>
          )}
        </View>

        <View style={{ height: 150 }} />
      </ScrollView>

      {/* 가입 경로 선택 모달 */}
      <Modal
        visible={showJoinRootModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowJoinRootModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>가입 경로 선택</Text>
              <TouchableOpacity onPress={() => setShowJoinRootModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {joinRootOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalItem}
                  onPress={() => {
                    setJoinRoot(option.value);
                    setShowJoinRootModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    joinRoot === option.value && styles.modalItemTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 다음 버튼 */}
      <View style={styles.fixBtnWrap}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>다음</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  content: {
    flex: 1,
  },
  titleBox: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    color: '#222222',
  },
  formContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  flexTit: {
    marginTop: 20,
    marginBottom: 8,
  },
  tit: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#393f44',
  },
  flexInput: {
    marginBottom: 8,
  },
  flexInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    lineHeight: 21,
    color: '#222',
    backgroundColor: '#fbfbfb',
  },
  inputFlex: {
    flex: 1,
    marginRight: 8,
  },
  inputDisabled: {
    backgroundColor: '#fbfbfb',
    color: '#a3a7ab',
  },
  btnCheck: {
    height: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    minWidth: 90,
  },
  btnCheckDisabled: {
    backgroundColor: '#f5f5f5',
  },
  btnCheckText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#393f44',
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 16,
    color: '#a3a7ab',
    marginBottom: 4,
  },
  selectBox: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fbfbfb',
  },
  selectText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#222',
  },
  selectArrow: {
    fontSize: 12,
    color: '#666',
  },
  fixBtnWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  submitButton: {
    height: 54,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#bfc3c7',
  },
  submitButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  modalItemText: {
    fontSize: 15,
    color: '#393f44',
  },
  modalItemTextSelected: {
    color: '#2c3db8',
    fontWeight: '600',
  },
});

export default SignUpCorpFormScreen;

