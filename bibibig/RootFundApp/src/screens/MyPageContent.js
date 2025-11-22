import React, { useState, useEffect } from 'react';
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
} from 'react-native';
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
    if (initialMemberData) {
      setMemberData(initialMemberData);
      loadMemberData();
    } else {
      loadMemberData();
    }
  }, []);

  const loadMemberData = async () => {
    setLoading(true);
    try {
      const response = await ApiService.api.get('/app/my/info');
      console.log('회원정보 응답:', response.data);
      
      if (response.data && response.data.member) {
        const member = response.data.member;
        setMemberData(member);
        
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

  const handleSave = async () => {
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
      const requestData = {
        zipcode,
        address1,
        address2,
        job_code: jobCode,
      };
      
      // 법인정보 추가
      if (memberData?.sort === 'C' || memberData?.corp_yn === 'PC') {
        requestData.co_name = coName;
        requestData.co_name_eng = coNameEng;
        requestData.ceo_name = ceoName;
        requestData.co_cpno = coCpno;
        requestData.industry_code = industryCode;
        if (memberData?.sort === 'C') {
          requestData.coporation_code = coporationCode;
        }
      }
      
      // 비밀번호 변경 포함
      if (isPasswordChange) {
        requestData.password = currentPassword;
        requestData.new_password = newPassword;
      }
      
      const endpoint = isPasswordChange 
        ? '/app/member/updateAllInfo' 
        : '/app/member/updateAddressInfo';
      
      const response = await ApiService.api.post(endpoint, requestData);
      
      if (response.data.rtnvalue === '0' || response.data === '0') {
        Alert.alert('개인정보 변경', '정상적으로 변경되었습니다.', [
          { text: '확인', onPress: () => loadMemberData() }
        ]);
        // 비밀번호 필드 초기화
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('개인정보 변경', '처리도중 오류가 발생하였습니다.');
      }
    } catch (error) {
      console.error('정보 변경 실패:', error);
      Alert.alert('오류', '처리도중 오류가 발생하였습니다.');
    }
  };

  const handleApprovalChange = async (type, value) => {
    try {
      const response = await ApiService.api.post('/app/member/updateSendApproval', {
        type,
        status: value ? 'Y' : 'N',
      });
      
      if (response.data !== '0') {
        Alert.alert('마케팅 수신동의', '처리도중 오류가 발생하였습니다.');
        loadMemberData();
      }
    } catch (error) {
      console.error('수신동의 변경 실패:', error);
      Alert.alert('마케팅 수신동의', '처리도중 오류가 발생하였습니다.');
      loadMemberData();
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
        <Text>로딩중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        {/* 로그인 정보 */}
        <View style={styles.whitebox}>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>로그인 ID</Text>
            <View style={styles.formValue}>
              <Text style={styles.valueText}>{memberData?.web_id}</Text>
            </View>
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>추천인 코드</Text>
            <View style={styles.formValue}>
              <Text style={styles.valueText}>{memberData?.nomin_id || '-'}</Text>
            </View>
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>비밀번호</Text>
            <View style={styles.formValue}>
              <TextInput
                style={styles.input}
                placeholder="현재 비밀번호 입력"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TextInput
                style={[styles.input, styles.inputMargin]}
                placeholder="변경 비밀번호 입력"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={[styles.input, styles.inputMargin]}
                placeholder="변경 비밀번호 재입력"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 개인정보 */}
        <View style={styles.whitebox}>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>이름</Text>
            <View style={styles.formValue}>
              <Text style={styles.valueText}>{memberData?.r_name}</Text>
            </View>
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>생년월일</Text>
            <View style={styles.formValue}>
              <TextInput
                style={styles.input}
                value={birthdate}
                editable={false}
              />
            </View>
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>휴대폰번호</Text>
            <View style={styles.formValue}>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={phone}
                  editable={false}
                />
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>휴대전화 변경</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>주소</Text>
            <View style={styles.formValue}>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={zipcode}
                  editable={false}
                />
                <TouchableOpacity 
                  style={styles.button}
                  onPress={() => {
                    Alert.alert('알림', '주소 검색 기능은 추후 구현 예정입니다.');
                  }}
                >
                  <Text style={styles.buttonText}>주소찾기</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, styles.inputMargin]}
                value={address1}
                onChangeText={setAddress1}
              />
              <TextInput
                style={[styles.input, styles.inputMargin]}
                placeholder="상세주소"
                value={address2}
                onChangeText={setAddress2}
              />
            </View>
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>직업</Text>
            <View style={styles.formValue}>
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

        {/* 투자자 유형 */}
        <View style={[styles.whitebox, styles.whiteboxMargin]}>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>투자자 유형</Text>
            <View style={styles.formValue}>
              <Text style={styles.valueText}>{getMemberClassText()}</Text>
            </View>
          </View>
        </View>

        {/* 법인정보 (법인회원인 경우) */}
        {(memberData?.sort === 'C' || memberData?.corp_yn === 'PC') && (
          <View style={[styles.whitebox, styles.whiteboxMargin]}>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>
                {memberData?.sort === 'C' ? '법인번호' : '사업자번호'}
              </Text>
              <View style={styles.formValue}>
                <TextInput
                  style={styles.input}
                  value={coCpno}
                  onChangeText={setCoCpno}
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>
                {memberData?.sort === 'C' ? '법인명' : '사업장명'}
              </Text>
              <View style={styles.formValue}>
                <TextInput
                  style={styles.input}
                  value={coName}
                  onChangeText={setCoName}
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>
                {memberData?.sort === 'C' ? '법인 영문명' : '사업장 영문명'}
              </Text>
              <View style={styles.formValue}>
                <TextInput
                  style={styles.input}
                  value={coNameEng}
                  onChangeText={setCoNameEng}
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>
                {memberData?.sort === 'C' ? '대표명' : '사업장 대표명'}
              </Text>
              <View style={styles.formValue}>
                <TextInput
                  style={styles.input}
                  value={ceoName}
                  onChangeText={setCeoName}
                />
              </View>
            </View>
          </View>
        )}

        {/* 수신동의 */}
        <View style={[styles.whitebox, styles.whiteboxMargin]}>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>수신동의</Text>
            <View style={styles.formValue}>
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

        {/* 저장 버튼 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>변경사항 저장</Text>
        </TouchableOpacity>

        {/* 회원탈퇴 링크 */}
        <TouchableOpacity 
          style={styles.withdrawLink}
          onPress={() => navigation.navigate('Withdrawal', { user })}
        >
          <Text style={styles.withdrawText}>
            루트펀드를 더 이상 이용하지 않으려면{' '}
            <Text style={styles.withdrawTextLink}>회원탈퇴 바로가기</Text>
          </Text>
        </TouchableOpacity>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  whitebox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#516c89',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fff',
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
    height: 48,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
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
  saveButton: {
    marginTop: 40,
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
    fontSize: 14,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
    textAlign: 'center',
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
});

export default MyPageContent;

