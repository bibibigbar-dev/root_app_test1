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

const FindEmailScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFindEmail = async () => {
    // 입력 검증
    if (!name.trim()) {
      Alert.alert('아이디 찾기', '인증받은 이름을 입력해 주세요.');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('아이디 찾기', '인증받은 휴대전화번호를 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);

      const response = await ApiService.api.post(
        '/app/find/id/process',
        ApiService.convertToFormData({
          name: name.trim(),
          phone: phone.trim(),
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      console.log('📧 아이디 찾기 응답:', response.data);

      const rtnvalue = String(response.data.rtnvalue);

      if (rtnvalue === '0') {
        Alert.alert(
          '아이디 찾기',
          `회원님의 아이디는 "${response.data.web_id}" 입니다.`,
          [
            {
              text: '확인',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else if (rtnvalue === '1') {
        Alert.alert('아이디 찾기', '이름과 휴대전화번호를 모두 입력해 주세요.');
      } else if (rtnvalue === '2') {
        Alert.alert('아이디 찾기', '찾으시는 정보가 없습니다.');
      } else {
        Alert.alert('아이디 찾기', '처리도중 오류가 발생하였습니다.');
      }
    } catch (error) {
      console.error('❌ 아이디 찾기 오류:', error);
      Alert.alert('아이디 찾기', '처리도중 오류가 발생하였습니다.');
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
            <Text style={styles.title}>아이디 찾기</Text>
            <Text style={styles.txt}>가입 시 등록한 정보로 아이디를 찾을 수 있습니다.</Text>
          </View>

          <View style={styles.loginForm}>
            <View style={styles.flexInput}>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="인증받은 이름을 입력해 주세요"
                placeholderTextColor="#a3a7ab"
                returnKeyType="next"
                onSubmitEditing={() => {}}
              />
            </View>

            <View style={styles.flexInput}>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="인증받은 휴대전화번호를 입력해 주세요"
                placeholderTextColor="#a3a7ab"
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={handleFindEmail}
              />
            </View>

            <View style={styles.btnBox}>
              <TouchableOpacity
                style={[styles.btnStyle, loading && styles.btnDisabled]}
                onPress={handleFindEmail}
                disabled={loading}
              >
                <Text style={styles.btnText}>
                  {loading ? '처리 중...' : '아이디 찾기'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.loginLinks}>
              <TouchableOpacity onPress={() => navigation.navigate('FindPassword')}>
                <Text style={styles.linkText}>비밀번호 찾기</Text>
              </TouchableOpacity>
              <View style={styles.linkDivider} />
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>로그인</Text>
              </TouchableOpacity>
              <View style={styles.rightBtn}>
                <TouchableOpacity
                  style={styles.btnJoin}
                  onPress={() => navigation.navigate('SignUp')}
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

export default FindEmailScreen;
