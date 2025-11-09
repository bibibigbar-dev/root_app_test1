import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import ApiService from '../services/api';
import Header from '../components/Header';

const FindEmailScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFindEmail = async () => {
    if (!name || !phoneNumber) {
      Alert.alert('입력 오류', '이름과 휴대전화번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // ApiService를 통해 API 호출
      const data = await ApiService.findEmail({
        name: name,
        phone: phoneNumber,
      });

      console.log('아이디 찾기 응답:', data);

      if (data.rtnvalue === '1') {
        Alert.alert(
          '아이디 찾기 완료',
          `회원님의 아이디는 ${data.web_id} 입니다.`,
          [
            {
              text: '로그인',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('아이디 찾기 실패', '일치하는 정보가 없습니다.');
      }
    } catch (error) {
      console.error('아이디 찾기 오류:', error);
      Alert.alert('오류', '아이디 찾기 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header navigation={navigation} user={null} showBack={false} hideBorder={true} />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.findWrap}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Image 
              source={require('../assets/images/ico_back_gray_40.png')} 
              style={styles.backIcon} 
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.loginId}>
            <Text style={styles.title}>아이디 찾기</Text>
            <Text style={styles.txt}>가입 시 등록한 정보로 아이디를 찾을 수 있습니다.</Text>
          </View>

          <View style={styles.loginForm}>
            <View style={styles.flexInput}>
              <TextInput
                style={styles.textInput}
                placeholder="인증받은 이름을 입력해 주세요"
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => phoneNumberRef?.focus()}
              />
            </View>

            <View style={styles.flexInput}>
              <TextInput
                style={styles.textInput}
                placeholder="인증받은 휴대전화번호를 입력해 주세요"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={handleFindEmail}
                ref={(ref) => (phoneNumberRef = ref)}
              />
            </View>

            <View style={styles.btnBox}>
              <TouchableOpacity
                style={[styles.btnStyle, loading && styles.disabledButton]}
                onPress={handleFindEmail}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnText}>아이디 찾기</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.loginLinks}>
              <TouchableOpacity onPress={() => navigation.navigate('FindPassword')}>
                <Text style={styles.linkText}>비밀번호 찾기</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>로그인</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rightBtn}
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text style={styles.btnJoinText}>
                  <Text style={styles.emphasis}>회원가입</Text> 바로가기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

let phoneNumberRef = null;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  findWrap: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: 5,
    marginBottom: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  loginId: {
    marginVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  txt: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
    textAlign: 'left',
    marginTop: 20,
  },
  loginForm: {
    marginTop: 20,
  },
  flexInput: {
    marginBottom: 15,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  btnBox: {
    marginTop: 30,
  },
  btnStyle: {
    height: 48,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  linkText: {
    fontSize: 14,
    color: '#666666',
    marginRight: 15,
  },
  rightBtn: {
    marginLeft: 'auto',
  },
  btnJoinText: {
    fontSize: 14,
    color: '#666666',
  },
  emphasis: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default FindEmailScreen;
