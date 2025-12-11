import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import ApiService from '../services/api';

const MyPageContent = ({ navigation, route, user, member_id, memberData: initialMemberData }) => {
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState(initialMemberData || null);
  
  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 개인정보
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [jobCode, setJobCode] = useState('00');
  
  // 법인정보
  const [coCpno, setCoCpno] = useState('');
  const [coName, setCoName] = useState('');
  const [coNameEng, setCoNameEng] = useState('');
  const [ceoName, setCeoName] = useState('');
  const [industryCode, setIndustryCode] = useState('');
  const [coporationCode, setCoporationCode] = useState('');
  
  // 수신동의
  const [emailApproval, setEmailApproval] = useState(false);
  const [smsApproval, setSmsApproval] = useState(false);
  
  // 모달
  const [showJobModal, setShowJobModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [showCoporationModal, setShowCoporationModal] = useState(false);

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

  useEffect(() => {
    // 회원정보 로드
    if (initialMemberData) {
      setMemberData(initialMemberData);
      loadMemberData();
    } else {
      loadMemberData();
    }

    // 글로벌 함수 노출 (웹 콜백용)
    if (typeof window !== 'undefined') {
      window.fnKCBOkNameProcess = handleCertifyCallback;
    }

    return () => {
      // 클린업: 글로벌 함수 제거
      if (typeof window !== 'undefined') {
        delete window.fnKCBOkNameProcess;
      }
    };
  }, []);

  const loadMemberData = async () => {
    setLoading(true);
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      
      const response = await ApiService.api.get('/app/my/info', {
        params: { member_id: memberId }
      });
      
      if (response.data && response.data.member) {
        const member = response.data.member;
        // 전체 응답 데이터를 저장 (okname 포함)
        setMemberData({
          ...member,
          okname: response.data.okname,
          bc5jsencpublickey: response.data.bc5jsencpublickey,
          marketing: response.data.marketing,
          industry: response.data.industry,
          coporation: response.data.coporation,
        });
        
        // 데이터 설정
        if (member.birthdate_yyyy && member.birthdate_mm && member.birthdate_dd) {
          setBirthdate(`${member.birthdate_yyyy}.${member.birthdate_mm}.${member.birthdate_dd}`);
        }
        setPhone(member.phone || '');
        setZipcode(member.zipcode || '');
        setAddress1(member.address1 || '');
        setAddress2(member.address2 || '');
        setJobCode(member.job_code || '00');
        
        // 법인정보
        if (member.sort === 'C' || member.corp_yn === 'PC') {
          setCoCpno(member.co_cpno || '');
          setCoName(member.co_name || '');
          setCoNameEng(member.co_name_eng || '');
          setCeoName(member.ceo_name || '');
          setIndustryCode(member.industry_code || '');
          setCoporationCode(member.coporation_code || '');
        }
        
        // 수신동의
        setEmailApproval(member.email_approval === 'Y');
        setSmsApproval(member.sms_approval === 'Y');
      }
    } catch (error) {
      console.error('회원정보 조회 실패:', error);
      Alert.alert('오류', '회원정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password) => {
    const validationPwd = /^((?=.*[0-9])(?=.*[a-z])(?=.*[!@#$%^&*]).{10,20})/;
    return validationPwd.test(password);
  };

  const lastAddressPayloadRef = useRef(null);

  const handleAddressSelect = (payload) => {
    if (!payload) return;
    try {
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      if (lastAddressPayloadRef.current === payloadString) {
        return;
      }
      lastAddressPayloadRef.current = payloadString;

      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
      if (data?.zonecode || data?.roadAddress || data?.jibunAddress) {
        setZipcode(data.zonecode || '');
        setAddress1(data.roadAddress || data.jibunAddress || '');
        setShowAddressModal(false);
        setTimeout(() => {
          Alert.alert('주소 선택 완료', '상세주소를 입력해주세요.');
          lastAddressPayloadRef.current = null;
        }, 100);
      }
    } catch (error) {
      console.error('주소 데이터 파싱 오류:', error, payload);
      lastAddressPayloadRef.current = null;
    }
  };

  const handleSave = async () => {
    const memberId = member_id || user?.session?.member_id || user?.id;
    
    // 비밀번호 변경 여부 확인
    const isPasswordChange = currentPassword || newPassword || confirmPassword;
    
    if (isPasswordChange) {
      // 비밀번호 유효성 검사
      if (!currentPassword) {
        Alert.alert('개인정보 변경', '현재 비밀번호를 입력하여 주십시오.');
        return;
      }
      if (!newPassword) {
        Alert.alert('개인정보 변경', '신규 비밀번호를 입력하여 주십시오.');
        return;
      }
      if (!confirmPassword) {
        Alert.alert('개인정보 변경', '비밀번호를 재입력하여 주십시오.');
        return;
      }
      if (newPassword.length < 10) {
        Alert.alert('개인정보 변경', '비밀번호 형식에 맞지 않습니다.(10자리 이상 영문,숫자,특수문자 조합)');
        return;
      }
      if (!validatePassword(newPassword)) {
        Alert.alert('개인정보 변경', '비밀번호 형식에 맞지 않습니다.(영문,숫자,특수문자를 포함한 최소 10자, 최대 20자)');
        return;
      }
      if (/(\w)\1\1\1/.test(newPassword)) {
        Alert.alert('개인정보 변경', '비밀번호에 동일한 문자를 연속적으로 4회 이상 사용할 수 없습니다.');
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert('개인정보 변경', '비밀번호를 다시 확인하여 주십시오.');
        return;
      }
      if (!address1) {
        Alert.alert('개인정보 변경', '주소를 검색해주세요.');
        return;
      }
      if (jobCode === '00') {
        Alert.alert('개인정보 변경', '직업을 선택해주세요.');
        return;
      }
      
      try {
        // 비밀번호 RSA 암호화
        const encryptedPassword = await ApiService.encryptPassword(currentPassword);
        const encryptedNewPassword = await ApiService.encryptPassword(newPassword);
        
        const requestData = {
          member_id: memberId,
          password: encryptedPassword,
          new_password: encryptedNewPassword,
          zipcode: zipcode.toString(),
          address1: address1.toString(),
          address2: address2.toString(),
          jobCode: jobCode.toString(),
        };
        
        // 법인정보 추가
        const isCorpOrBiz = memberData?.sort === 'C' || memberData?.corp_yn === 'PC';
        if (isCorpOrBiz) {
          requestData.co_name = (coName || '').toString();
          requestData.co_name_eng = (coNameEng || '').toString();
          requestData.ceo_name = (ceoName || '').toString();
          requestData.co_cpno = (coCpno || '').toString();
          requestData.industry_code = (industryCode || '').toString();
        }
        if (memberData?.sort === 'C') {
          requestData.coporation_code = (coporationCode || '').toString();
        }
        
        const response = await ApiService.api.post('/app/member/proc/updateMemberAllInfo', requestData);
        
        if (response.data === '0') {
          Alert.alert('개인정보 변경', '정상적으로 변경되었습니다.', [
            { text: '확인', onPress: () => loadMemberData() }
          ]);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else if (response.data === '1' || response.data === '3' || response.data === '5') {
          Alert.alert('개인정보 변경', '기존 비밀번호가 일치하지 않습니다.\n비밀번호 5회 오류시 자동 로그아웃됩니다.\n5회 입력오류시 일시적으로 계정을 사용할 수 없습니다.');
        } else if (response.data === '11') {
          Alert.alert('개인정보 변경', '비밀번호 형식에 맞지 않습니다.(10자리 이상 영문/숫자/특수문자 조합)');
        } else if (response.data === '13') {
          Alert.alert('개인정보 변경', '사용할 수 없는 신규 비밀번호입니다.(개인정보 포함)');
        } else if (response.data === '100') {
          Alert.alert('개인정보 변경', '비밀번호 형식에 맞지 않습니다.(동일/연속된 4자리 글자 사용 불가)');
        } else if (response.data === '111' || response.data === '112' || response.data === '113') {
          Alert.alert('개인정보 변경', '비밀번호에 개인정보가 포함되어 있습니다');
        } else {
          Alert.alert('개인정보 변경', '처리도중 오류가 발생하였습니다.');
        }
      } catch (error) {
        console.error('정보 변경 실패:', error);
        Alert.alert('개인정보 변경', '처리도중 오류가 발생하였습니다.');
      }
    } else {
      // 주소 및 직업 정보만 변경
      if (!address1) {
        Alert.alert('개인정보 변경', '주소를 검색해주세요.');
        return;
      }
      if (jobCode === '00') {
        Alert.alert('개인정보 변경', '직업을 선택해주세요.');
        return;
      }
      
      try {
        const requestData = {
          member_id: memberId,
          zipcode: zipcode.toString(),
          address1: address1.toString(),
          address2: address2.toString(),
          job_code: jobCode.toString(),
        };
        
        // 법인정보 추가
        const isCorpOrBiz = memberData?.sort === 'C' || memberData?.corp_yn === 'PC';
        if (isCorpOrBiz) {
          requestData.co_name = (coName || '').toString();
          requestData.co_name_eng = (coNameEng || '').toString();
          requestData.ceo_name = (ceoName || '').toString();
          requestData.co_cpno = (coCpno || '').toString();
          requestData.industry_code = (industryCode || '').toString();
        }
        if (memberData?.sort === 'C') {
          requestData.coporation_code = (coporationCode || '').toString();
        }
        
        const response = await ApiService.api.post('/app/member/proc/updateMemberAddressInfo', requestData);
        
        if (response.data.rtnvalue === '0') {
          Alert.alert('개인정보 변경', '정상적으로 변경되었습니다.', [
            { text: '확인', onPress: () => loadMemberData() }
          ]);
        } else {
          Alert.alert('개인정보 변경', '처리도중 오류가 발생하였습니다.');
        }
      } catch (error) {
        console.error('정보 변경 실패:', error);
        Alert.alert('개인정보 변경', '처리도중 오류가 발생하였습니다.');
      }
    }
  };

  const handleApprovalChange = async (type, value) => {
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      const response = await ApiService.api.post('/app/member/process/updateSendApproval', {
        member_id: memberId,
        type: type.toString(),
        status: value ? 'Y' : 'N',
      });
      // 응답이 '0'이 아닌 경우에만 에러 처리
      if (response.data != '0') {
        Alert.alert('개인정보 변경', '처리도중 오류가 발생하였습니다.');
        loadMemberData();
      }
    } catch (error) {
      Alert.alert('개인정보 변경', '처리도중 오류가 발생하였습니다.');
      loadMemberData();
    }
  };

  const handleAddressSearch = () => {
    setShowAddressModal(true);
  };

  const handlePhoneChange = async () => {
    try {
      // 회원정보 조회 시 받아온 okname 데이터 사용
      const oknameData = memberData?.okname;
      
      if (!oknameData) {
        console.error('❌ okname 데이터가 없습니다!');
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
                  console.error('❌ URL 열기 오류:', error);
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
    } catch (error) {
      console.error('❌ 휴대전화 변경 오류:', error);
      Alert.alert('오류', '휴대전화 변경 중 오류가 발생했습니다.');
    }
  };

  // 본인인증 완료 후 콜백 처리
  // 웹 페이지에서 fnKCBOkNameProcess(rtnvalue, rtnmessage, authtype, name, birthdate, gender, mobile, nationalInfo, di, ci) 형태로 호출
  const handleCertifyCallback = async (rtnvalue, rtnmessage, authtype, name, birthdate, gender, mobile, nationalInfo, di, ci) => {
    if (rtnvalue === '0') {
      try {
        const response = await ApiService.api.post('/app/member/update/certify', {
          authType: authtype,
          name: name,
          birthDate: birthdate,
          gender: gender,
          mobile: mobile,
          nationalInfo: nationalInfo,
          di: di,
          ci: ci,
        });
        
        if (response.data === '0') {
          Alert.alert('본인인증', '인증이 완료되었습니다.', [
            { text: '확인', onPress: () => loadMemberData() }
          ]);
        } else if (response.data === '2') {
          Alert.alert('본인인증', '인증정보가 올바르지 않습니다.\n(법인휴대전화의 경우 실 사용자 등록이 되어야 합니다.)');
        } else if (response.data === '3') {
          Alert.alert('본인인증', '이미 가입된 회원의 정보입니다');
        } else if (response.data === '4') {
          Alert.alert('본인인증', '최초 인증정보와 다른 명의의 정보입니다.');
        } else {
          Alert.alert('본인인증', '처리도중 오류가 발생하였습니다.');
        }
      } catch (error) {
        console.error('❌ 본인인증 API 오류:', error);
        Alert.alert('본인인증', '처리도중 오류가 발생하였습니다.');
      }
    } else {
      Alert.alert('휴대전화 본인인증', rtnmessage);
    }
  };

  const getMemberClassText = () => {
    if (!memberData) return '개인투자자';
    switch (memberData.member_class) {
      case '10': return '소득적격투자자';
      case '20': return '전문투자자';
      case '30': return '법인투자자';
      case '40': return '여신금융기관';
      default: return '개인투자자';
    }
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
      <View style={styles.formContainer}>
        {/* 로그인 정보 */}
        <View style={[styles.subWhitebox, styles.pb10]}>
          <View style={styles.flexTr}>
            <Text style={styles.flexTh}>로그인 ID</Text>
            <View style={styles.flexTd}>
              <View style={styles.flexInput}>
                <Text style={styles.txtVal}>{memberData?.web_id}</Text>
              </View>
            </View>
          </View>
          <View style={styles.flexTr}>
            <Text style={styles.flexTh}>추천인 코드</Text>
            <View style={styles.flexTd}>
              <View style={styles.flexInput}>
                <Text style={styles.txtVal}>{memberData?.nomin_id || '-'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.flexTr}>
            <Text style={styles.flexTh}>비밀번호</Text>
            <View style={styles.flexTd}>
              <View style={styles.flexInput}>
                <TextInput
                  style={styles.flexInputText}
                  placeholder="현재 비밀번호 입력"
                  placeholderTextColor="#999999"
                  secureTextEntry={true}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.flexInput}>
                <TextInput
                  style={styles.flexInputText}
                  placeholder="변경 비밀번호 입력"
                  placeholderTextColor="#999999"
                  secureTextEntry={true}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.flexInput}>
                <TextInput
                  style={styles.flexInputText}
                  placeholder="변경 비밀번호 재입력"
                  placeholderTextColor="#999999"
                  secureTextEntry={true}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          </View>
          <View style={[styles.hrLine, styles.mt20, styles.mr16, styles.ml16]} />
          <View style={styles.flexTr}>
            <Text style={styles.flexTh}>이름</Text>
            <View style={styles.flexTd}>
              <View style={styles.flexInput}>
                <Text style={styles.txtVal}>{memberData?.r_name}</Text>
              </View>
            </View>
          </View>
          <View style={styles.flexTr}>
            <Text style={styles.flexTh}>생년월일</Text>
            <View style={styles.flexTd}>
              <View style={styles.flexInput}>
                <TextInput
                  style={styles.flexInputText}
                  value={birthdate}
                  editable={false}
                />
              </View>
            </View>
          </View>
          <View style={styles.flexTr}>
            <Text style={styles.flexTh}>휴대폰번호</Text>
            <View style={styles.flexTd}>
              <View style={styles.flexInputRow}>
                <TextInput
                  style={styles.flexInputText}
                  value={phone}
                  editable={false}
                />
                <TouchableOpacity 
                  style={styles.btnStyle}
                  onPress={handlePhoneChange}
                >
                  <Text style={styles.btnStyleText}>휴대전화 변경</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.flexTr}>
            <Text style={styles.flexTh}>주소</Text>
            <View style={styles.flexTd}>
              <View style={styles.flexInputRow}>
                <TextInput
                  style={styles.flexInputText}
                  value={zipcode}
                  editable={false}
                />
                <TouchableOpacity 
                  style={styles.btnStyle}
                  onPress={handleAddressSearch}
                >
                  <Text style={styles.btnStyleText}>주소찾기</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.flexInput}>
                <TextInput
                  style={styles.flexInputText}
                  value={address1}
                  onChangeText={setAddress1}
                />
              </View>
              <View style={styles.flexInput}>
                <TextInput
                  style={styles.flexInputText}
                  placeholder="상세주소"
                  value={address2}
                  onChangeText={setAddress2}
                />
              </View>
            </View>
          </View>
          <View style={styles.flexTr}>
            <Text style={styles.flexTh}>직업</Text>
            <View style={styles.flexTd}>
              <View style={styles.flexInput}>
                <TouchableOpacity 
                  style={styles.selectButton}
                  onPress={() => setShowJobModal(true)}
                >
                  <Text style={styles.selectButtonText}>
                    {jobOptions.find(opt => opt.value === jobCode)?.label || '선택해주세요'}
                  </Text>
                  <Text style={styles.selectArrow}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* 회색 공백 */}
        <View style={styles.graySpace} />

        {/* 투자자 유형 */}
        <View style={styles.subWhitebox}>
          <View style={styles.flexTr_not_bottom}>
            <Text style={styles.flexTh}>투자자 유형</Text>
            <View style={styles.flexTd}>
              <View style={styles.flexInput}>
                <Text style={styles.txtVal}>{getMemberClassText()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 회색 공백 */}
        <View style={styles.graySpace} />

        {/* 법인정보 (법인회원인 경우) */}
        {memberData?.sort === 'C' && (
          <View style={[styles.subWhitebox, styles.whiteboxMargin, styles.pb10]}>
            <View style={styles.flexTr}>
              <Text style={styles.flexTh}>법인번호</Text>
              <View style={styles.flexTd}>
                <View style={styles.flexInput}>
                  <TextInput
                    style={styles.input}
                    value={coCpno}
                    onChangeText={setCoCpno}
                  />
                </View>
              </View>
            </View>
            <View style={styles.flexTr}>
              <Text style={styles.flexTh}>법인명</Text>
              <View style={styles.flexTd}>
                <View style={styles.flexInput}>
                  <TextInput
                    style={styles.input}
                    value={coName}
                    onChangeText={setCoName}
                  />
                </View>
              </View>
            </View>
            <View style={styles.flexTr}>
              <Text style={styles.flexTh}>법인 영문명</Text>
              <View style={styles.flexTd}>
                <View style={styles.flexInput}>
                  <TextInput
                    style={styles.input}
                    value={coNameEng}
                    onChangeText={setCoNameEng}
                  />
                </View>
              </View>
            </View>
            <View style={styles.flexTr}>
              <Text style={styles.flexTh}>대표명</Text>
              <View style={styles.flexTd}>
                <View style={styles.flexInput}>
                  <TextInput
                    style={styles.input}
                    value={ceoName}
                    onChangeText={setCeoName}
                  />
                </View>
              </View>
            </View>
            <View style={styles.flexTr}>
            <Text style={styles.flexTh}>업종구분</Text>
              <View style={styles.flexTd}>
                <View style={styles.flexInput}>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowIndustryModal(true)}
                  >
                    <Text style={styles.selectButtonText}>
                      {memberData?.industry?.find(item => item.code === industryCode)?.code_name || '선택해주세요'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.flexTr}>
              <Text style={styles.flexTh}>기업구분</Text>
              <View style={styles.flexTd}>
                <View style={styles.flexInput}>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowCoporationModal(true)}
                  >
                    <Text style={styles.selectButtonText}>
                      {memberData?.coporation?.find(item => item.code === coporationCode)?.code_name || '선택해주세요'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 개인사업자 정보 */}
        {memberData?.corp_yn === 'PC' && (
          <View style={[styles.subWhitebox, styles.whiteboxMargin, styles.pb10]}>
            <View style={styles.flexTr}>
            <Text style={styles.flexTh}>사업자번호</Text>
              <View style={styles.flexTd}>
                <View style={styles.flexInput}>
                  <TextInput
                    style={styles.input}
                    value={coCpno}
                    onChangeText={setCoCpno}
                  />
                </View>
              </View>
            </View>
            <View style={styles.flexTr}>
              <Text style={styles.flexTh}>사업장명</Text>
              <View style={styles.flexTd}>
                <View style={styles.flexInput}>
                  <TextInput
                    style={styles.input}
                    value={coName}
                    onChangeText={setCoName}
                  />
                </View>
              </View>
            </View>
            <View style={styles.flexTr}>
              <Text style={styles.flexTh}>사업장 영문명</Text>
              <View style={styles.flexTd}>
                <View style={styles.flexInput}>
                  <TextInput
                    style={styles.input}
                    value={coNameEng}
                    onChangeText={setCoNameEng}
                  />
                </View>
              </View>
            </View>
            <View style={styles.flexTr}>
              <Text style={styles.flexTh}>사업장 대표명</Text>
              <View style={styles.flexTd}>
                <View style={styles.flexInput}>
                  <TextInput
                    style={styles.input}
                    value={ceoName}
                    onChangeText={setCeoName}
                  />
                </View>
              </View>
            </View>
            <View style={styles.flexTr}>
              <Text style={styles.flexTh}>업종구분</Text>
              <View style={styles.flexTd}>
                <View style={styles.flexInput}>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowIndustryModal(true)}
                  >
                    <Text style={styles.selectButtonText}>
                      {memberData?.industry?.find(item => item.code === industryCode)?.code_name || '선택해주세요'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 회색 공백 */}
        <View style={styles.graySpace} />

        {/* 수신동의 */}
        <View style={[styles.subWhitebox, styles.mt20]}>
          <View style={styles.flexTr}>
            <Text style={styles.flexTh}>수신동의</Text>
            <View style={styles.flexTd}>
              <View style={styles.flexInput}>
                <View style={styles.approvalContent}>
                  <Text style={styles.infoText}>
                    발전소 정보와 신규 상품 안내를 제공받습니다.
                  </Text>
                  <TouchableOpacity onPress={() => setShowMarketingModal(true)}>
                    <Text style={styles.linkText}>마케팅 정보 수집 및 활용</Text>
                  </TouchableOpacity>
                  <View style={styles.switchContainer}>
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>이메일</Text>
                      <Switch
                        value={emailApproval}
                        onValueChange={(value) => {
                          setEmailApproval(value);
                          handleApprovalChange('EMAIL', value);
                        }}
                        trackColor={{ false: '#e0e1e2', true: '#2c3db8' }}
                        thumbColor="#fff"
                      />
                    </View>
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>문자</Text>
                      <Switch
                        value={smsApproval}
                        onValueChange={(value) => {
                          setSmsApproval(value);
                          handleApprovalChange('SMS', value);
                        }}
                        trackColor={{ false: '#e0e1e2', true: '#2c3db8' }}
                        thumbColor="#fff"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 저장 버튼 영역 */}
        <View style={styles.saveButtonArea}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>변경사항 저장</Text>
          </TouchableOpacity>

          {/* 회원탈퇴 링크 */}
          <TouchableOpacity 
            style={styles.withdrawLink}
            onPress={() => navigation.navigate('MemberWithdrawal', { user })}
          >
            <Text style={styles.withdrawText}>
              루트펀드를 더 이상 이용하지 않으려면{' '}
              <Text style={styles.withdrawTextLink}>회원탈퇴 바로가기</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 직업 선택 모달 */}
      <Modal
        visible={showJobModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowJobModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>직업 선택</Text>
            <ScrollView style={styles.modalScroll}>
              {jobOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                    jobCode === option.value && styles.modalOptionActive
                  ]}
                  onPress={() => {
                    setJobCode(option.value);
                    setShowJobModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    jobCode === option.value && styles.modalOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowJobModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 마케팅 정보 모달 */}
      <Modal
        visible={showMarketingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMarketingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>마케팅 정보 수집 및 활용</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalText}>
                서비스 제공 및 이용과 관련하여 루트인프라금융㈜가 취득한 개인정보는 "개인정보처리방침"에 의하여 엄격하게 관리되며, 발송되는 마케팅 정보는 회원님에게 유익한 상품 정보, 신규 서비스 안내, 각종 이벤트 등 광고성 정보로 관련법의 규정을 준수하여 발송됩니다. 단, 광고성 정보 이외 의무적으로 안내되어야 하는 정보성 내용은 수신동의 여부와 무관하게 제공됩니다.
                {'\n\n'}
                수신 동의 이후에도 의사에 따라 동의를 철회할 수 있으며, 수신을 동의하지 않아도 루트인프라금융㈜가 제공하는 서비스를 이용할 수 있으나, 당사의 마케팅 정보를 수신하지 못할 수 있습니다.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowMarketingModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 업종구분 선택 모달 */}
      <Modal
        visible={showIndustryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowIndustryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>업종구분 선택</Text>
            <ScrollView style={styles.modalScroll}>
              {memberData?.industry?.map((option) => (
                <TouchableOpacity
                  key={option.code}
                  style={[
                    styles.modalOption,
                    industryCode === option.code && styles.modalOptionActive
                  ]}
                  onPress={() => {
                    setIndustryCode(option.code);
                    setShowIndustryModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    industryCode === option.code && styles.modalOptionTextActive
                  ]}>
                    {option.code_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowIndustryModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 기업구분 선택 모달 */}
      <Modal
        visible={showCoporationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCoporationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>기업구분 선택</Text>
            <ScrollView style={styles.modalScroll}>
              {memberData?.coporation?.map((option) => (
                <TouchableOpacity
                  key={option.code}
                  style={[
                    styles.modalOption,
                    coporationCode === option.code && styles.modalOptionActive
                  ]}
                  onPress={() => {
                    setCoporationCode(option.code);
                    setShowCoporationModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    coporationCode === option.code && styles.modalOptionTextActive
                  ]}>
                    {option.code_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCoporationModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 주소 검색 모달 - Daum Postcode */}
      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.addressModalLarge]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>주소검색</Text>
              <TouchableOpacity
                style={styles.modalCloseIcon}
                onPress={() => setShowAddressModal(false)}
              >
                <Text style={styles.modalCloseIconText}>✕</Text>
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
                          #loading { 
                            position: absolute; 
                            top: 50%; 
                            left: 50%; 
                            transform: translate(-50%, -50%);
                            font-size: 16px;
                            color: #666;
                          }
                        </style>
                      </head>
                      <body>
                        <div id="loading">주소 검색 로딩중...</div>
                        <div id="layer"></div>
                        <script>
                          // Daum Postcode 스크립트 동적 로드
                          var script = document.createElement('script');
                          script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
                          script.onload = function() {
                          document.getElementById('loading').style.display = 'none';
                          
                          var daunaddrlayer = document.getElementById('layer');

                          // React Native 전달 헬퍼
                          function sendToReactNative(payload) {
                            var msg = typeof payload === 'string' ? payload : JSON.stringify(payload);
                            try {
                              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                window.ReactNativeWebView.postMessage(msg);
                              }
                            } catch (e) {
                              console.error('postMessage 실패:', e.message);
                            }
                            try {
                              window.location.href = 'postcode://' + encodeURIComponent(msg);
                            } catch (err) {
                              console.error('fallback 전송 실패: ' + err.message);
                            }
                          }
                          
                          function execDaumPostcode() {
                            new daum.Postcode({
                              oncomplete: function(data) {
                                  var fullRoadAddr = data.roadAddress; // 도로명 주소 변수
                                  var extraRoadAddr = ''; // 도로명 조합형 주소 변수
                                  
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
                                height: '460px',
                                maxSuggestItems: 5,
                                shorthand: false
                              }).embed(daunaddrlayer);
                            }
                            
                            // 초기 실행
                            execDaumPostcode();
                          };
                          script.onerror = function() {
                            document.getElementById('loading').innerHTML = '주소 검색 로드 실패<br>인터넷 연결을 확인해주세요';
                            console.error('Daum Postcode 스크립트 로드 실패');
                          };
                          document.head.appendChild(script);
                        </script>
                      </body>
                    </html>
                  `
                }}
                onMessage={(event) => {
                  handleAddressSelect(event.nativeEvent.data);
                }}
                onNavigationStateChange={(navState) => {
                  if (navState.url && navState.url.startsWith('postcode://')) {
                    const payload = decodeURIComponent(navState.url.replace('postcode://', ''));
                    handleAddressSelect(payload);
                  }
                }}
                onShouldStartLoadWithRequest={(request) => {
                  if (request.url.startsWith('postcode://')) {
                    const payload = decodeURIComponent(request.url.replace('postcode://', ''));
                    handleAddressSelect(payload);
                    return false;
                  }
                  return true;
                }}
                onLoadStart={() => console.log('WebView 로딩 시작')}
                onLoad={() => console.log('WebView 로딩 완료')}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView 오류:', nativeEvent);
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mixedContentMode="always"
                originWhitelist={['*']}
                style={styles.webView}
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
  },
  graySpace: {
    height: 10,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  formContainer: {
    //paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 40,
  },
  whitebox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  subWhitebox: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    backgroundColor: '#fff',
    shadowColor: 'rgba(224, 225, 226, 0.50)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
  },
  flexTr: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  flexTr_not_bottom: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
  },
  flexTh: {
    flex: 0,
    width: 69,
    minHeight: 44,
    marginRight: 12,
    color: '#666',
    fontSize: 13,
    lineHeight: 44,
    fontWeight: '400',
    textAlignVertical: 'center',
  },
  flexTd: {
    flex: 1,
    fontSize: 13,
    lineHeight: 1.5,
    fontWeight: '400',
  },
  flexInput: {
    marginTop: 0,
  },
  flexInputRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    marginTop: 0,
  },
  selectButton: {
    height: 44,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    backgroundColor: '#fbfbfb',
    justifyContent: 'center',
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  flexInputText: {
    flex: 1,
    height: 44,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: '#fbfbfb',
    color: '#222',
    marginTop: 5,
  },
  txtVal: {
    flex: 1,
    minHeight: 44,
    paddingLeft: 8,
    fontSize: 15,
    lineHeight: 44,
    fontWeight: '600',
    color: '#222',
  },
  pb10: {
    paddingBottom: 10,
  },
  pb30: {
    paddingBottom: 30,
  },
  pt15: {
    paddingTop: 15,
  },
  hrLine: {
    height: 1,
    backgroundColor: '#f6f6f6',
    marginBottom: 20,
  },
  mt20: {
    marginTop: 20,
  },
  mr16: {
    marginRight: 16,
  },
  ml16: {
    marginLeft: 16,
  },
  btnStyle: {
    height: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginLeft: 8,
  },
  btnStyleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222',
  },
  whiteboxMargin: {
    marginTop: 20,
  },
  divider: {
    height: 8,
    backgroundColor: '#f5f7fa',
    marginVertical: 20,
    marginHorizontal: -20,
  },
  formRow: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  formValue: {
    flex: 1,
  },
  valueText: {
    fontSize: 15,
    color: '#666',
    paddingVertical: 12,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    backgroundColor: '#fbfbfb',
  },
  inputMargin: {
    marginTop: 8,
  },
  inputFlex: {
    flex: 1,
  },
  inputWithButton: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    height: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  selectButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fbfbfb',
  },
  selectButtonText: {
    fontSize: 15,
    color: '#222',
  },
  selectArrow: {
    fontSize: 12,
    color: '#999',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3db8',
    textDecorationLine: 'underline',
    marginBottom: 16,
  },
  approvalContent: {
    flex: 1,
    paddingLeft: 8,
  },
  switchContainer: {
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  saveButtonArea: {
    backgroundColor: '#f8f9fa',
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  saveButton: {
    height: 56,
    borderRadius: 8,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  withdrawLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  withdrawText: {
    fontSize: 12,
    color: '#999',
  },
  withdrawTextLink: {
    color: '#2c3db8',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  addressModalLarge: {
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    paddingHorizontal: 16,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  modalOptionActive: {
    backgroundColor: '#f5f7fa',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#222',
  },
  modalOptionTextActive: {
    fontWeight: '600',
    color: '#2c3db8',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  modalCloseButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  addressModalContent: {
    paddingVertical: 16,
  },
  addressInputContainer: {
    marginTop: 16,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  addressInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fff',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f5f7fa',
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  modalConfirmButton: {
    backgroundColor: '#2c3db8',
  },
  modalConfirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCloseIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIconText: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  webViewContainer: {
    width: '100%',
    height: 460,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e1e2',
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default MyPageContent;
