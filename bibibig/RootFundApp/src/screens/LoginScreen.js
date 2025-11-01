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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const passwordRef = useRef(null);

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
        // 이미 로그인된 사용자가 있으면 출금 화면으로 이동
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
      const shouldRemember = await AsyncStorage.getItem('rememberEmailFlag');
      
      if (shouldRemember === 'true' && savedEmail) {
        setEmail(savedEmail);
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
        await AsyncStorage.setItem('rememberEmailFlag', 'true');
      } else {
        await AsyncStorage.removeItem('rememberedEmail');
        await AsyncStorage.removeItem('rememberEmailFlag');
      }
    } catch (error) {
      console.error('이메일 저장 오류:', error);
    }
  };

  const handleLogin = async () => {
    console.log('🚀 로그인 시작');
    
    if (!email || !password) {
      console.log('❌ 입력값 검증 실패:', { email: !!email, password: !!password });
      Alert.alert('로그인', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    
    try {
      await saveRememberedEmail();
      
      const loginData = { email, password };
      console.log('📤 API 호출 전 데이터:', { email, password: '***' });
      
      const response = await ApiService.login(loginData);
      console.log('📥 API 응답:', response);
      
      if (response.success && response.user) {
        console.log('✅ 로그인 성공! 저장할 사용자 데이터:');
        console.log('📋 response.user:', JSON.stringify(response.user, null, 2));
        console.log('📋 세션 데이터:', JSON.stringify(response.user.session, null, 2));
        
        // 로그인 성공 시 사용자 정보 저장
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        await AsyncStorage.setItem('userToken', response.user.token);
        
        console.log('💾 AsyncStorage에 저장 완료');
        
        // 출금 화면으로 바로 이동
        navigation.replace('Withdrawal');
      } else {
        Alert.alert('로그인 실패', response.message || '계정 정보를 확인하여 주십시오.');
      }
    } catch (error) {
      Alert.alert('오류', '처리도중 오류가 발생하였습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    Alert.alert('카카오 로그인', '카카오 로그인 기능은 준비 중입니다.');
    // TODO: 카카오 로그인 구현
  };

  const handleFindEmail = () => {
    Alert.alert('이메일 찾기', '이메일 찾기 기능은 준비 중입니다.');
    // TODO: 이메일 찾기 화면으로 이동
  };

  const handleFindPassword = () => {
    Alert.alert('비밀번호 찾기', '비밀번호 찾기 기능은 준비 중입니다.');
    // TODO: 비밀번호 찾기 화면으로 이동
  };

  const handleSignUp = () => {
    Alert.alert('회원가입', '회원가입 기능은 준비 중입니다.');
    // TODO: 회원가입 화면으로 이동
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>로그인 확인 중...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 로고 섹션 */}
        <View style={styles.logoSection}>
          <Text style={styles.subtitle}>환경을 생각하는 투자 플랫폼</Text>
          <Text style={styles.logoText}>ROOTFUND</Text>
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
              onSubmitEditing={handleLogin}
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
            <Text style={styles.checkboxLabel}>이메일 저장하기</Text>
          </TouchableOpacity>

          {/* 로그인 버튼 */}
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.disabledButton]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>로그인</Text>
            )}
          </TouchableOpacity>

          {/* 카카오 로그인 버튼 */}
          <TouchableOpacity 
            style={styles.kakaoButton}
            onPress={handleKakaoLogin}
          >
            <View style={styles.kakaoIcon}>
              <Text style={styles.kakaoIconText}>K</Text>
            </View>
            <Text style={styles.kakaoButtonText}>카카오 로그인</Text>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E7D32',
    letterSpacing: 2,
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
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  kakaoButton: {
    height: 48,
    backgroundColor: '#FEE500',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  kakaoIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#000000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  kakaoIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  kakaoButtonText: {
    color: '#000000',
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
    paddingVertical: 5,
  },
  signupButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  signupEmphasis: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default LoginScreen;
