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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ApiService from '../services/api';

const SignUpPrivateAdultScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { okname, kakaoCi, bc5jsencpublickey, marketing, f_joinType } = route.params || {};

  const [loading, setLoading] = useState(false);
  
  // 폼 데이터
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [jobCode, setJobCode] = useState('00');
  
  // 에러 메시지
  const [errors, setErrors] = useState({});

  useEffect(() => {
    console.log('SignUpPrivateAdult params:', route.params);
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // 8자 이상, 영문+숫자+특수문자 조합
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^01[0-9]{8,9}$/;
    return phoneRegex.test(phone.replace(/-/g, ''));
  };

  const handleSubmit = async () => {
    const newErrors = {};

    // 이메일 검증
    if (!email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!validateEmail(email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    // 비밀번호 검증
    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (!validatePassword(password)) {
      newErrors.password = '비밀번호는 8자 이상, 영문+숫자+특수문자 조합이어야 합니다.';
    }

    if (!passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요.';
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }

    // 이름 검증
    if (!name) {
      newErrors.name = '이름을 입력해주세요.';
    }

    // 휴대폰 검증
    if (!phone) {
      newErrors.phone = '휴대폰 번호를 입력해주세요.';
    } else if (!validatePhone(phone)) {
      newErrors.phone = '올바른 휴대폰 번호 형식이 아닙니다.';
    }

    // 생년월일 검증
    if (!birthYear || !birthMonth || !birthDay) {
      newErrors.birth = '생년월일을 입력해주세요.';
    }

    // 주소 검증
    if (!zipcode || !address1) {
      newErrors.address = '주소를 입력해주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      
      // TODO: 회원가입 API 호출
      const response = await ApiService.api.post('/app/join/process', {
        email,
        password,
        name,
        phone: phone.replace(/-/g, ''),
        birthdate_yyyy: birthYear,
        birthdate_mm: birthMonth,
        birthdate_dd: birthDay,
        zipcode,
        address1,
        address2,
        job_code: jobCode,
        marketing,
        f_joinType,
        kakaoCi,
      });

      console.log('회원가입 응답:', response.data);

      if (response.data.status === 'success') {
        Alert.alert(
          '회원가입 완료',
          '회원가입이 완료되었습니다.',
          [
            {
              text: '확인',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('오류', response.data.message || '회원가입 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      Alert.alert('오류', '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSearch = () => {
    // TODO: 주소 검색 기능 구현
    Alert.alert('주소 검색', '주소 검색 기능은 준비 중입니다.');
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
        <Text style={styles.headerTitle}>회원가입</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.subTitleBox}>
          <Text style={styles.title}>계정정보를 입력해주세요</Text>
          <Text style={styles.subtitle}>만 18세 이상</Text>
        </View>

        <View style={styles.formArea}>
          {/* 이메일 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              이메일 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="이메일을 입력하세요"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: '' });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
          </View>

          {/* 비밀번호 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              비밀번호 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="비밀번호 (8자 이상, 영문+숫자+특수문자)"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: '' });
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}
          </View>

          {/* 비밀번호 확인 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              비밀번호 확인 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.passwordConfirm && styles.inputError]}
              placeholder="비밀번호를 다시 입력하세요"
              value={passwordConfirm}
              onChangeText={(text) => {
                setPasswordConfirm(text);
                setErrors({ ...errors, passwordConfirm: '' });
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.passwordConfirm ? (
              <Text style={styles.errorText}>{errors.passwordConfirm}</Text>
            ) : null}
          </View>

          {/* 이름 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              이름 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="이름을 입력하세요"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setErrors({ ...errors, name: '' });
              }}
            />
            {errors.name ? (
              <Text style={styles.errorText}>{errors.name}</Text>
            ) : null}
          </View>

          {/* 휴대폰 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              휴대폰 번호 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="휴대폰 번호 (- 없이 입력)"
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/[^0-9]/g, ''));
                setErrors({ ...errors, phone: '' });
              }}
              keyboardType="phone-pad"
            />
            {errors.phone ? (
              <Text style={styles.errorText}>{errors.phone}</Text>
            ) : null}
          </View>

          {/* 생년월일 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              생년월일 <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.birthContainer}>
              <TextInput
                style={[styles.birthInput, errors.birth && styles.inputError]}
                placeholder="년(4자)"
                value={birthYear}
                onChangeText={(text) => {
                  setBirthYear(text.replace(/[^0-9]/g, ''));
                  setErrors({ ...errors, birth: '' });
                }}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text style={styles.birthSeparator}>.</Text>
              <TextInput
                style={[styles.birthInput, errors.birth && styles.inputError]}
                placeholder="월"
                value={birthMonth}
                onChangeText={(text) => {
                  setBirthMonth(text.replace(/[^0-9]/g, ''));
                  setErrors({ ...errors, birth: '' });
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.birthSeparator}>.</Text>
              <TextInput
                style={[styles.birthInput, errors.birth && styles.inputError]}
                placeholder="일"
                value={birthDay}
                onChangeText={(text) => {
                  setBirthDay(text.replace(/[^0-9]/g, ''));
                  setErrors({ ...errors, birth: '' });
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            {errors.birth ? (
              <Text style={styles.errorText}>{errors.birth}</Text>
            ) : null}
          </View>

          {/* 주소 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              주소 <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.addressRow}>
              <TextInput
                style={[styles.addressInput, errors.address && styles.inputError]}
                placeholder="우편번호"
                value={zipcode}
                editable={false}
              />
              <TouchableOpacity
                style={styles.addressButton}
                onPress={handleAddressSearch}
              >
                <Text style={styles.addressButtonText}>주소검색</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.mt8, errors.address && styles.inputError]}
              placeholder="기본주소"
              value={address1}
              editable={false}
            />
            <TextInput
              style={[styles.input, styles.mt8]}
              placeholder="상세주소"
              value={address2}
              onChangeText={setAddress2}
            />
            {errors.address ? (
              <Text style={styles.errorText}>{errors.address}</Text>
            ) : null}
          </View>

          {/* 직업 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>직업</Text>
            <View style={styles.selectBox}>
              <Text style={styles.selectText}>
                {jobCode === '00' ? '선택하세요' : '직업 선택됨'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.fixBtnWrap}>
        <View style={styles.btnBox}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>가입하기</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 10,
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
    marginBottom: 30,
  },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: '#666',
  },
  formArea: {
    paddingHorizontal: 16,
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
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff5042',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#ff5042',
    marginTop: 4,
  },
  birthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  birthInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    lineHeight: 21,
    color: '#222',
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  birthSeparator: {
    fontSize: 15,
    color: '#666',
    marginHorizontal: 8,
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
    backgroundColor: '#2c3db8',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addressButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
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
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  selectText: {
    fontSize: 15,
    lineHeight: 21,
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
    borderTopWidth: 1,
    borderTopColor: '#e0e1e2',
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
  submitButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
});

export default SignUpPrivateAdultScreen;

