import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import ApiService from '../services/api';

const SignUpPrivateForeignerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { okname, kakaoCi, bc5jsencpublickey, marketing, f_joinType } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [verificationCompleted, setVerificationCompleted] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  
  // 폼 데이터
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [joinRoot, setJoinRoot] = useState('선택해주세요');
  const [joinRootEtc, setJoinRootEtc] = useState('');
  const [jobCode, setJobCode] = useState('00');
  const [foreignerUseCode, setForeignerUseCode] = useState('');
  
  // 에러 메시지
  const [errors, setErrors] = useState({});

  // 모달
  const [showJobModal, setShowJobModal] = useState(false);
  const [showForeignerModal, setShowForeignerModal] = useState(false);
  const [showJoinRootModal, setShowJoinRootModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const joinRootOptions = [
    '선택해주세요',
    '지인소개',
    '인터넷 검색',
    '구글 광고',
    '네이버 광고',
    'SNS(페이스북/인스타그램) 광고',
    '뉴스/기사',
    '인터넷 커뮤니티',
    '세미나/교육/포럼',
    '광고지/우편물',
    'ETC',
  ];

  const jobOptions = [
    { value: '00', label: '선택해주세요' },
    { value: '01', label: '회사원' },
    { value: '02', label: '자영업자' },
    { value: '03', label: '무직' },
    { value: '04', label: '학생' },
    { value: '05', label: '군인' },
    { value: '06', label: '주부' },
    { value: '07', label: '연금소득자' },
    { value: '08', label: '프리랜서' },
    { value: '09', label: '변호사' },
    { value: '10', label: '의사' },
    { value: '11', label: '회계사' },
    { value: '12', label: '세무사' },
    { value: '13', label: '법무사' },
    { value: '15', label: '기타 전문직' },
    { value: '16', label: '부동산중개업자' },
    { value: '18', label: '대부업 종사자' },
  ];

  const foreignerOptions = [
    { value: '', label: '선택해주세요' },
    { value: '122', label: '재외국민등록증 소유자' },
    { value: '131', label: '외국인등록증 소유자' },
    { value: '123', label: '주민등록증(재외국인) 소유자' },
    { value: '141', label: '국내거소신고증 소유자' },
    { value: '121', label: '기타' },
  ];

  useEffect(() => {
    console.log('SignUpPrivateForeigner params:', route.params);

    // Deep Link 처리 (KCB 본인인증 콜백)
    const handleDeepLink = ({ url }) => {
      console.log('📱 Deep Link received:', url);
      
      if (url && url.includes('kcb-callback')) {
        try {
          const params = new URLSearchParams(url.split('?')[1]);
          const rtnvalue = params.get('rtnvalue');
          const rtnmessage = params.get('rtnmessage');
          const authtype = params.get('authtype');
          const name = params.get('name');
          const birthdate = params.get('birthdate');
          const gender = params.get('gender');
          const mobile = params.get('mobile');
          const nationalInfo = params.get('nationalInfo');
          const di = params.get('di');
          const ci = params.get('ci');

          console.log('✅ KCB 콜백 데이터:', { rtnvalue, name, mobile });

          if (rtnvalue === '0') {
            setVerificationData({
              authtype,
              name,
              birthdate,
              gender,
              mobile,
              nationalInfo,
              di,
              ci,
            });
            setVerificationCompleted(true);
            Alert.alert('본인인증 완료', '본인인증이 완료되었습니다.\n회원가입을 계속 진행해주세요.');
          } else {
            Alert.alert('본인인증 실패', rtnmessage || '본인인증에 실패했습니다.');
          }
        } catch (error) {
          console.error('❌ Deep Link 파싱 오류:', error);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // 앱이 닫힌 상태에서 딥링크로 열린 경우
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // 영문, 숫자, 특수문자 최소 10자리 이상
    const passwordRegex = /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[a-z\d!@#$%^&*]{10,20}$/i;
    return passwordRegex.test(password);
  };

  const handleAddressSearch = () => {
    setShowAddressModal(true);
  };

  const handleAddressSelect = (data) => {
    try {
      const addressData = typeof data === 'string' ? JSON.parse(data) : data;
      setZipcode(addressData.zonecode || '');
      setAddress1(addressData.roadAddress || '');
      setShowAddressModal(false);
      setErrors({ ...errors, address: '' });
    } catch (error) {
      console.error('주소 데이터 파싱 오류:', error);
    }
  };

  // 회원가입 완료 처리 (본인인증 완료 후)
  const handleCompleteSignUp = async () => {
    if (!verificationCompleted || !verificationData) {
      Alert.alert('본인인증 필요', '먼저 휴대전화 본인인증을 완료해주세요.');
      return;
    }

    // 외국인 구분 검증
    if (!foreignerUseCode) {
      Alert.alert('외국인 구분', '외국인 구분을 선택해주세요.');
      return;
    }

    try {
      setLoading(true);

      const finalJoinRoot = joinRoot === 'ETC' ? joinRootEtc : joinRoot;

      const signUpData = {
        web_id: email,
        email: email,
        member_pwd: password,
        marketing: marketing || 'N',
        authType: verificationData.authtype,
        name: verificationData.name,
        birthDate: verificationData.birthdate,
        gender: verificationData.gender,
        mobile: verificationData.mobile,
        nationalInfo: verificationData.nationalInfo,
        di: verificationData.di,
        ci: verificationData.ci,
        join_root: finalJoinRoot,
        zipcode: zipcode,
        address1: address1,
        address2: address2,
        jobCode: jobCode,
        foreigner_use_code: foreignerUseCode,
      };

      console.log('📤 회원가입 요청 데이터:', signUpData);

      const response = await ApiService.api.post('/app/certJoinProcess', signUpData);

      console.log('📥 회원가입 응답:', response.data);

      const rtnvalue = String(response.data.rtnvalue).trim();

      if (rtnvalue === '0') {
        // 회원가입 성공 - 서비스 이용신청 화면으로 이동
        const member_id = response.data.member_id || '';
        
        navigation.replace('MyCert', {
          use_tf_join: 'Y',
          f_joinType: f_joinType || 'foreigner',
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
        Alert.alert('회원가입', '처리도중 오류가 발생하였습니다.');
      }
    } catch (error) {
      console.error('❌ 회원가입 오류:', error);
      console.error('❌ 오류 상세:', error.response?.data);
      Alert.alert('오류', '처리도중 오류가 발생하였습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const newErrors = {};

    // 이메일 검증
    if (!email) {
      newErrors.email = '* 이메일을 입력하세요.';
    } else if (!validateEmail(email)) {
      newErrors.email = '* 이메일 형식이 올바르지 않습니다.';
    }

    // 비밀번호 검증
    if (!password) {
      newErrors.password = '* 비밀번호를 입력해주세요.';
    } else if (!validatePassword(password)) {
      newErrors.password = '* 비밀번호는 영문,숫자,특수문자를 포함한 최소 10자, 최대 20자 입니다.';
    }

    if (!passwordConfirm) {
      newErrors.passwordConfirm = '* 비밀번호를 재입력해주세요.';
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = '* 비밀번호가 일치하지 않습니다.';
    }

    // 주소 검증
    if (!address1) {
      newErrors.address = '* 주소를 검색해주세요';
    } else if (!address2) {
      newErrors.address = '* 상세주소를 적어주세요';
    }

    // 직업 검증
    if (jobCode === '00') {
      Alert.alert('직업', '직업을 설정해주세요.');
      return;
    }

    // 외국인 실지 명의 구분 검증
    if (!foreignerUseCode) {
      Alert.alert('외국인 실지 명의 구분', '외국인 실지 명의 구분을 선택해주세요.');
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      
      // 이메일 중복 확인
      const emailCheckResponse = await ApiService.api.post('/app/check/email/use', {
        web_id: email,
        email: email,
      });

      console.log('✅ Email check response:', emailCheckResponse.data);
      console.log('✅ Response type:', typeof emailCheckResponse.data);
      console.log('✅ okname data:', okname);

      // 응답 데이터를 문자열로 변환하여 비교
      const responseValue = String(emailCheckResponse.data).trim();
      console.log('✅ Response value (string):', responseValue);

      if (responseValue === '0') {
        // 이메일 사용 가능 - 본인인증 진행
        setLoading(false);
        
        // okname 데이터 확인
        const oknameData = okname;
        
        if (!oknameData) {
          Alert.alert('오류', '본인인증 정보를 가져올 수 없습니다.\n관리자에게 문의해주세요.');
          return;
        }
        
        if (oknameData.okname === 'Y') {
          const okname_url = oknameData.okname_url;
          const cp_cd = oknameData.cp_cd;
          const token = oknameData.token;
          
          // Form 데이터를 URL 파라미터로 변환
          const formParams = new URLSearchParams({
            tc: 'kcb.oknm.online.safehscert.popup.cmd.P931_CertChoiceCmd',
            cp_cd: cp_cd || '',
            mdl_tkn: token || '',
          });
          
          const fullUrl = `${okname_url}?${formParams.toString()}`;
          
          // 외부 브라우저로 본인인증 페이지 열기
          Alert.alert(
            '휴대전화 본인인증',
            '본인인증을 위해 외부 브라우저로 이동합니다.\n\n본인인증 완료 후 앱으로 돌아와 화면을 새로고침해주세요.',
            [
              {
                text: '취소',
                style: 'cancel'
              },
              {
                text: '확인',
                onPress: async () => {
                  try {
                    const canOpen = await Linking.canOpenURL(fullUrl);
                    if (canOpen) {
                      await Linking.openURL(fullUrl);
                    } else {
                      Alert.alert('오류', 'URL을 열 수 없습니다.');
                    }
                  } catch (error) {
                    console.error('URL 열기 오류:', error);
                    Alert.alert('오류', '브라우저를 열 수 없습니다.');
                  }
                }
              }
            ]
          );
        } else {
          const rslt_cd = oknameData.rslt_cd || '';
          const rslt_msg = oknameData.rslt_msg || '본인인증 정보를 가져올 수 없습니다.';
          Alert.alert('휴대전화 본인인증', `[${rslt_cd}] ${rslt_msg}`);
        }
      } else if (responseValue === '1' || responseValue === '2') {
        console.log('❌ 이메일 중복:', responseValue);
        setErrors({ ...errors, email: '* 이미 사용중인 이메일입니다.' });
      } else {
        console.error('❌ 알 수 없는 응답:', responseValue);
        Alert.alert('회원가입', '처리도중 오류가 발생하였습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      Alert.alert('오류', '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getJobLabel = () => {
    const job = jobOptions.find(j => j.value === jobCode);
    return job ? job.label : '선택해주세요';
  };

  const getForeignerLabel = () => {
    const foreigner = foreignerOptions.find(f => f.value === foreignerUseCode);
    return foreigner ? foreigner.label : '선택해주세요';
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
        <Text style={styles.headerTitle}></Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.subTitleBox}>
          <Text style={styles.title}>외국인 회원가입</Text>
        </View>

        <View style={styles.formArea}>
          {/* 이메일 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일 (로그인 아이디)</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="이메일 입력"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: '' });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.notif}>* 이메일 주소는 변경이 불가합니다.</Text>
            <Text style={styles.notif}>* 실사용 이메일 주소로 기입해주시기 바랍니다.</Text>
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
          </View>

          {/* 비밀번호 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="비밀번호 입력"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: '' });
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={[styles.input, styles.mt8, errors.passwordConfirm && styles.inputError]}
              placeholder="비밀번호 재입력"
              value={passwordConfirm}
              onChangeText={(text) => {
                setPasswordConfirm(text);
                setErrors({ ...errors, passwordConfirm: '' });
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.notif}>
              * 영문, 숫자, 특수문자(숫자키 상단 특수문자만 가능) 최소 10자리 이상으로 입력해 주셔야 합니다.
            </Text>
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}
            {errors.passwordConfirm ? (
              <Text style={styles.errorText}>{errors.passwordConfirm}</Text>
            ) : null}
          </View>

          {/* 주소 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>주소</Text>
            <View style={styles.addressRow}>
              <TextInput
                style={[styles.addressInput, errors.address && styles.inputError]}
                placeholder="우편번호"
                value={zipcode}
                onChangeText={setZipcode}
                editable={true}
              />
              <TouchableOpacity
                style={styles.addressButton}
                onPress={handleAddressSearch}
              >
                <Text style={styles.addressButtonText}>주소찾기</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.mt8, errors.address && styles.inputError]}
              placeholder="기본주소"
              value={address1}
              onChangeText={setAddress1}
              editable={true}
            />
            <TextInput
              style={[styles.input, styles.mt8]}
              placeholder="상세주소"
              value={address2}
              onChangeText={(text) => {
                setAddress2(text);
                setErrors({ ...errors, address: '' });
              }}
            />
            <Text style={styles.notif}>* 이웃 우대 금리를 신청하시려면 등본상 주소를 입력하세요.</Text>
            <Text style={styles.notif}>* 인근지역 상품 오픈 시 이웃등록 사전등록 혜택을 알려드립니다.</Text>
            {errors.address ? (
              <Text style={styles.errorText}>{errors.address}</Text>
            ) : null}
          </View>

          {/* 가입 경로 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>가입 경로 (선택)</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setShowJoinRootModal(true)}
            >
              <Text style={styles.selectText}>{joinRoot}</Text>
              <Text style={styles.selectArrowText}>▼</Text>
            </TouchableOpacity>
            {joinRoot === 'ETC' && (
              <TextInput
                style={[styles.input, styles.mt8]}
                placeholder="기타입력"
                value={joinRootEtc}
                onChangeText={setJoinRootEtc}
              />
            )}
          </View>

          {/* 직업 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              직업 <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setShowJobModal(true)}
            >
              <Text style={styles.selectText}>{getJobLabel()}</Text>
              <Text style={styles.selectArrowText}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* 외국인 실지 명의 구분 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              외국인 실지 명의 구분 <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setShowForeignerModal(true)}
            >
              <Text style={styles.selectText}>{getForeignerLabel()}</Text>
              <Text style={styles.selectArrowText}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.fixBtnWrap}>
        <View style={styles.btnBox}>
          {!verificationCompleted ? (
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>휴대전화 본인인증</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, styles.submitButtonSuccess, loading && styles.submitButtonDisabled]}
              onPress={handleCompleteSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>회원가입 완료</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 직업 선택 모달 */}
      <Modal
        visible={showJobModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowJobModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>직업 선택</Text>
              <TouchableOpacity onPress={() => setShowJobModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {jobOptions.map((job) => (
                <TouchableOpacity
                  key={job.value}
                  style={styles.modalItem}
                  onPress={() => {
                    setJobCode(job.value);
                    setShowJobModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, jobCode === job.value && styles.modalItemTextSelected]}>
                    {job.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 외국인 실지 명의 구분 선택 모달 */}
      <Modal
        visible={showForeignerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowForeignerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>외국인 실지 명의 구분</Text>
              <TouchableOpacity onPress={() => setShowForeignerModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {foreignerOptions.map((foreigner) => (
                <TouchableOpacity
                  key={foreigner.value}
                  style={styles.modalItem}
                  onPress={() => {
                    setForeignerUseCode(foreigner.value);
                    setShowForeignerModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, foreignerUseCode === foreigner.value && styles.modalItemTextSelected]}>
                    {foreigner.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
              {joinRootOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => {
                    setJoinRoot(option);
                    setShowJoinRootModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, joinRoot === option && styles.modalItemTextSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 주소 검색 모달 */}
      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.addressModalOverlay}>
          <View style={styles.addressModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>주소검색</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.webViewContainer}>
              <WebView
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                        <style>
                          * { margin: 0; padding: 0; box-sizing: border-box; }
                          body { overflow: hidden; background-color: white; }
                          #layer { width: 100%; height: 460px; }
                        </style>
                      </head>
                      <body>
                        <div id="layer"></div>
                        <script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
                        <script>
                          function sendToReactNative(payload) {
                            var msg = typeof payload === 'string' ? payload : JSON.stringify(payload);
                            try {
                              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                window.ReactNativeWebView.postMessage(msg);
                              }
                            } catch (e) {
                              console.error('postMessage 실패:', e.message);
                            }
                          }
                          
                          new daum.Postcode({
                            oncomplete: function(data) {
                              var fullRoadAddr = data.roadAddress;
                              var extraRoadAddr = '';
                              
                              if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                                extraRoadAddr += data.bname;
                              }
                              if (data.buildingName !== '' && data.apartment === 'Y') {
                                extraRoadAddr += (extraRoadAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                              }
                              if (extraRoadAddr !== '') {
                                extraRoadAddr = ' (' + extraRoadAddr + ')';
                              }
                              if (fullRoadAddr !== '') {
                                fullRoadAddr += extraRoadAddr;
                              }
                              
                              var payload = {
                                zonecode: data.zonecode,
                                roadAddress: fullRoadAddr,
                                jibunAddress: data.jibunAddress
                              };

                              sendToReactNative(payload);
                            },
                            width: '100%',
                            height: '460px'
                          }).embed(document.getElementById('layer'));
                        </script>
                      </body>
                    </html>
                  `
                }}
                onMessage={(event) => handleAddressSelect(event.nativeEvent.data)}
                style={styles.webView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
    padding: 10,
    paddingLeft: 16,
  },
  backButtonImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#393f44',
  },
  content: {
    flex: 1,
  },
  subTitleBox: {
    marginTop: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    color: '#222',
  },
  formArea: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#393f44',
    marginBottom: 8,
  },
  required: {
    color: '#ff5042',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    lineHeight: 21,
    color: '#222',
    backgroundColor: '#fbfbfb',
  },
  inputError: {
    borderColor: '#ff5042',
  },
  notif: {
    fontSize: 12,
    lineHeight: 17,
    color: '#a3a7ab',
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#ff5042',
    marginTop: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    lineHeight: 21,
    color: '#222',
    backgroundColor: '#f9f9f9',
  },
  addressButton: {
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#e0e1e2',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addressButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#393f44',
  },
  mt8: {
    marginTop: 8,
  },
  selectBox: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#222',
  },
  selectArrowText: {
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
  btnBox: {
    flexDirection: 'row',
  },
  submitButton: {
    flex: 1,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#bfc3c7',
  },
  submitButtonSuccess: {
    backgroundColor: '#28a745',
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
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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
    lineHeight: 21,
    color: '#222',
  },
  modalItemTextSelected: {
    color: '#2c3db8',
    fontWeight: '600',
  },
  addressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  webViewContainer: {
    height: 460,
  },
  webView: {
    flex: 1,
  },
});

export default SignUpPrivateForeignerScreen;

