import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const WithdrawalLoginScreen = ({ navigation, route }) => {
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(true);
  const [withdrawalLoginLoading, setWithdrawalLoginLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const passwordRef = useRef(null);

  useEffect(() => {
    const updateDimensions = () => {
      setScreenHeight(Dimensions.get('window').height);
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    checkExistingLogin();
    loadRememberedEmail();
    // 로그인 화면 진입 시 공개키 선 요청
    ApiService.prefetchPublicKey();
  }, []);

  const checkExistingLogin = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (userData && userToken) {
        // 이미 로그인된 사용자가 있으면 출금 화면으로 바로 이동
        navigation.replace('Withdrawal');
      }
    } catch (error) {
      console.error('기존 로그인 확인 오류:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadRememberedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('rememberedEmail');
      const savedPassword = await AsyncStorage.getItem('rememberedPassword');
      const shouldRemember = await AsyncStorage.getItem('rememberEmailFlag');
      
      if (shouldRemember === 'true' && savedEmail) {
        setEmail(savedEmail);
        if (savedPassword) {
          setPassword(savedPassword);
        }
        setRememberEmail(true);
      }
    } catch (error) {
      console.error('저장된 이메일 로드 오류:', error);
    }
  };

  const saveRememberedEmail = async () => {
    try {
      if (rememberEmail) {
        await AsyncStorage.setItem('rememberedEmail', email);
        if (password) {
          await AsyncStorage.setItem('rememberedPassword', password);
        }
        await AsyncStorage.setItem('rememberEmailFlag', 'true');
      } else {
        await AsyncStorage.removeItem('rememberedEmail');
        await AsyncStorage.removeItem('rememberedPassword');
        await AsyncStorage.removeItem('rememberEmailFlag');
      }
    } catch (error) {
      console.error('이메일 저장 오류:', error);
    }
  };

  const handleWithdrawalLogin = async () => {
    
    if (!email || !password) {
      Alert.alert('로그인', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setWithdrawalLoginLoading(true);
    
    try {
      await saveRememberedEmail();
      
      const loginData = { email, password };
      
      const response = await ApiService.withdrawalLogin(loginData);
      
      if (response.success && response.user) {
        
        // 로그인 성공 시 사용자 정보 저장
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        await AsyncStorage.setItem('userToken', response.user.token);
        
        // 은행 목록 저장
        if (response.banks) {
          await AsyncStorage.setItem('bankList', JSON.stringify(response.banks));
        }
        
        // 출금 화면으로 이동
        navigation.replace('Withdrawal');
      } else {
        Alert.alert('로그인 실패', response.message || '계정 정보를 확인하여 주십시오.');
      }
    } catch (error) {
      console.error('출금 로그인 오류:', error);
      Alert.alert('오류', '처리도중 오류가 발생하였습니다.');
    } finally {
      setWithdrawalLoginLoading(false);
    }
  };

  const handleFindEmail = () => {
    navigation.navigate('FindEmail');
  };

  const handleFindPassword = () => {
    navigation.navigate('FindPassword');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUpType');
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3db8" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollContainer, { minHeight: screenHeight, flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 로고 섹션 */}
        <View style={styles.logoSection}>
          <View style={styles.logoSpacer} />
          <Text style={styles.subtitle}>출금신청 전용 로그인</Text>
          <View style={styles.logoImageContainer}>
            <Image 
              source={require('../assets/images/thumbnail_logo_en.jpg')} 
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* 로그인 폼 */}
        <View style={styles.loginForm}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="이메일을 입력해주세요"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              ref={(ref) => passwordRef.current = ref}
              style={styles.input}
              placeholder="비밀번호를 입력해주세요"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleWithdrawalLogin}
            />
          </View>

          {/* 이메일 저장 체크박스 */}
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setRememberEmail(!rememberEmail)}
          >
            <View style={[styles.checkbox, rememberEmail && styles.checkboxChecked]}>
              {rememberEmail && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>로그인 저장하기</Text>
          </TouchableOpacity>

          {/* 출금신청 로그인 버튼 */}
          <TouchableOpacity 
            style={[styles.loginButton, withdrawalLoginLoading && styles.disabledButton]} 
            onPress={handleWithdrawalLogin}
            disabled={withdrawalLoginLoading}
          >
            {withdrawalLoginLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>출금신청 로그인</Text>
            )}
          </TouchableOpacity>

          {/* 링크 섹션 */}
          <View style={styles.linksContainer}>
            <View style={styles.leftLinks}>
              <TouchableOpacity onPress={handleFindEmail}>
                <Text style={styles.linkText}>이메일 찾기</Text>
              </TouchableOpacity>
              <Text style={styles.separator}>|</Text>
              <TouchableOpacity onPress={handleFindPassword}>
                <Text style={styles.linkText}>비밀번호 찾기</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleSignUp} style={styles.signupButton}>
              <Text style={styles.signupButtonText}>
                <Text style={styles.signupEmphasis}>회원가입</Text> 바로가기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const passwordRef = React.createRef();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 130,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoSpacer: {
    height: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 10,
    fontWeight: '600',
  },
  logoImageContainer: {
    height: 40,
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  logoImage: {
    width: '80%',
    height: 160,
  },
  loginForm: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 3,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#666666',
  },
  loginButton: {
    height: 48,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666666',
  },
  separator: {
    fontSize: 14,
    color: '#CCCCCC',
    marginHorizontal: 10,
  },
  signupButton: {
    height: 24,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  signupButtonText: {
    fontSize: 13,
    lineHeight: 22,
    color: '#393f44',
  },
  signupEmphasis: {
    color: '#2c3db8',
  },
});

export default WithdrawalLoginScreen;

