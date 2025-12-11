import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import ApiService from '../services/api';

const FindPasswordScreen = ({ navigation }) => {
  const [webId, setWebId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckId = async () => {
    // 입력 검증
    if (!webId.trim()) {
      Alert.alert('비밀번호 찾기', '이메일 계정을 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);

      // Step 1: 아이디 확인
      const checkResponse = await ApiService.api.post(
        '/app/find/password/check',
        ApiService.convertToFormData({
          web_id: webId.trim(),
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      console.log('🔍 비밀번호 찾기 - 아이디 확인 응답:', checkResponse.data);

      const checkResult = String(checkResponse.data);

      if (checkResult === '0') {
        // 휴대전화 본인인증 화면으로 이동
        navigation.navigate('PhoneAuth', {
          authType: 'findPassword',
          webId: webId.trim(),
          onAuthSuccess: (authData) => handleAuthSuccess(authData),
        });
      } else if (checkResult === '1') {
        Alert.alert('비밀번호 찾기', '해당 아이디를 확인할 수 없습니다.');
      } else if (checkResult === '2') {
        Alert.alert('비밀번호 찾기', '탈퇴한 아이디 입니다.');
      } else if (checkResult === '3') {
        Alert.alert('비밀번호 찾기', '비밀번호를 찾을 수 없는 계정입니다. 계속 진행을 원하시는 경우 고객센터로 문의 바랍니다.');
      } else if (checkResult === '4') {
        Alert.alert('비밀번호 찾기', '법인회원의 경우 고객센터로 문의주시면 임시 비밀번호를 가입하신 이메일로 발급해드립니다.');
      } else {
        Alert.alert('비밀번호 찾기', '아이디 정보를 확인하여 주세요.');
      }
    } catch (error) {
      console.error('❌ 비밀번호 찾기 오류:', error);
      Alert.alert('비밀번호 찾기', '처리도중 오류가 발생하였습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (authData) => {
    console.log('📱 본인인증 완료:', authData);

    if (authData.rtnvalue !== '0') {
      Alert.alert('휴대전화 본인인증', authData.rtnmessage || '인증에 실패했습니다.');
      return;
    }

    try {
      setLoading(true);

      // Step 2: 본인인증 및 임시 비밀번호 발송
      const response = await ApiService.api.post(
        '/app/find/password/process',
        ApiService.convertToFormData({
          web_id: webId.trim(),
          name: authData.name,
          mobile: authData.mobile,
          authType: authData.authType,
          birthDate: authData.birthDate,
          gender: authData.gender,
          nationalInfo: authData.nationalInfo,
          di: authData.di,
          ci: authData.ci,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      console.log('🔑 비밀번호 찾기 - 처리 응답:', response.data);

      const result = String(response.data);

      if (result === '0') {
        Alert.alert(
          '비밀번호 찾기',
          '입력하신 이메일으로 임시 비밀번호를 발송하였습니다. 로그인 후 비밀번호 변경을 진행하여 주세요.',
          [
            {
              text: '확인',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else if (result === '1') {
        Alert.alert('비밀번호 찾기', '정상적인 접근이 아닙니다. 다시 진행하여 주세요.');
      } else if (result === '2') {
        Alert.alert('비밀번호 찾기', '탈퇴한 아이디 입니다.');
      } else if (result === '3') {
        Alert.alert('비밀번호 찾기', '최초인증정보와 동일하지 않은 인증정보 입니다. 타인의 명의를 도용시 법적 책임을 물을 수 있습니다. 현 사용중인 휴대전화가 본인 명의가 아닌 경우 고객센터로 문의 바랍니다.');
      } else if (result === '4') {
        Alert.alert('비밀번호 찾기', '법인회원의 경우 고객센터로 문의주시면 임시 비밀번호를 가입하신 이메일로 발급해드립니다.');
      } else if (result === '5') {
        Alert.alert('비밀번호 찾기', '이메일 발송에 실패했습니다. 고객센터로 문의해주세요.');
      } else {
        Alert.alert('비밀번호 찾기', '처리도중 오류가 발생하였습니다.');
      }
    } catch (error) {
      console.error('❌ 비밀번호 찾기 처리 오류:', error);
      Alert.alert('비밀번호 찾기', '처리도중 오류가 발생하였습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header with Back Button */}
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.findWrap}>
          <View style={styles.loginId}>
            <Text style={styles.title}>비밀번호 찾기</Text>
            <Text style={styles.txt}>가입 시 등록한 정보로 비밀번호를 찾을 수 있습니다.</Text>
          </View>

          <View style={styles.loginForm}>
            <View style={styles.flexInput}>
              <TextInput
                style={styles.textInput}
                value={webId}
                onChangeText={setWebId}
                placeholder="이메일 계정을 입력해 주세요"
                placeholderTextColor="#a3a7ab"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleCheckId}
                editable={!loading}
              />
            </View>

            <View style={styles.btnBox}>
              <TouchableOpacity
                style={[styles.btnStyle, loading && styles.btnDisabled]}
                onPress={handleCheckId}
                disabled={loading}
              >
                <Text style={styles.btnText}>
                  {loading ? '처리 중...' : '비밀번호 찾기'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.loginLinks}>
              <TouchableOpacity onPress={() => navigation.navigate('FindEmail')}>
                <Text style={styles.linkText}>아이디 찾기</Text>
              </TouchableOpacity>
              <View style={styles.linkDivider} />
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>로그인</Text>
              </TouchableOpacity>
              <View style={styles.rightBtn}>
                <TouchableOpacity
                  style={styles.btnJoin}
                  onPress={() => navigation.navigate('SignUpType')}
                >
                  <Text style={styles.btnJoinText}>
                    <Text style={styles.btnJoinEmphasis}>회원가입</Text> 바로가기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
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
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headTitle: {
    marginLeft: 12,
    paddingTop: 1,
    fontSize: 15,
    lineHeight: 19.5,
    fontWeight: '600',
  },
  findWrap: {
    flex: 1,
    padding: 20,
  },
  loginId: {
    marginTop: 12,
    marginBottom: 0,
  },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    color: '#222',
  },
  txt: {
    marginTop: 20,
    color: '#666',
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
  },
  loginForm: {
    marginTop: 20,
  },
  flexInput: {
    marginTop: 12,
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
  btnBox: {
    marginTop: 30,
  },
  btnStyle: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#2c3db8',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '500',
  },
  loginLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  linkText: {
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 24,
  },
  linkDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#f2f2f2',
    marginHorizontal: 13,
  },
  rightBtn: {
    marginLeft: 'auto',
  },
  btnJoin: {
    height: 24,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnJoinText: {
    color: '#393f44',
    fontSize: 13,
    lineHeight: 22,
  },
  btnJoinEmphasis: {
    color: '#2c3db8',
  },
});

export default FindPasswordScreen;
