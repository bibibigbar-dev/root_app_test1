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
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const LoginScreen = ({ navigation, route }) => {
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(true);
  const [mainLoginLoading, setMainLoginLoading] = useState(false);
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
      
      // returnTo가 있으면 (특정 페이지에서 로그인 버튼을 눌러서 온 경우)
      // 자동 이동하지 않고 로그인 화면을 보여줌
      const { returnTo } = route.params || {};
      
      if (userData && userToken && !returnTo) {
        // returnTo가 없고 이미 로그인된 사용자가 있으면 메인 화면으로 이동
        navigation.replace('Main');
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

  const handleLogin = async (targetScreen = 'Main', targetParams = null, setLoadingState) => {
    console.log('🚀 로그인 시작');
    
    if (!email || !password) {
      console.log('❌ 입력값 검증 실패:', { email: !!email, password: !!password });
      Alert.alert('로그인', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoadingState(true);
    
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
        
        // 타겟 화면으로 이동
        if (targetParams) {
          navigation.replace(targetScreen, targetParams);
        } else {
          navigation.replace(targetScreen);
        }
      } else {
        Alert.alert('로그인 실패', response.message || '계정 정보를 확인하여 주십시오.');
      }
    } catch (error) {
      Alert.alert('오류', '처리도중 오류가 발생하였습니다.');
    } finally {
      setLoadingState(false);
    }
  };

  const handleMainLogin = () => {
    // route.params에서 returnTo와 returnParams 가져오기
    const { returnTo, returnParams } = route.params || {};
    const targetScreen = returnTo || 'Main';
    const targetParams = returnParams || null;
    
    handleLogin(targetScreen, targetParams, setMainLoginLoading);
  };

  const handleWithdrawalLogin = async () => {
    console.log('🚀 출금 신청 로그인 시작');
    
    if (!email || !password) {
      console.log('❌ 입력값 검증 실패:', { email: !!email, password: !!password });
      Alert.alert('로그인', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setWithdrawalLoginLoading(true);
    
    try {
      await saveRememberedEmail();
      
      const loginData = { email, password };
      console.log('📤 출금 로그인 API 호출 전 데이터:', { email, password: '***' });
      
      const response = await ApiService.withdrawalLogin(loginData);
      console.log('📥 출금 로그인 API 응답:', response);
      
      if (response.success && response.user) {
        console.log('✅ 출금 로그인 성공!');
        
        // 로그인 성공 시 사용자 정보 저장
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        await AsyncStorage.setItem('userToken', response.user.token);
        
        // 은행 목록 저장
        if (response.banks) {
          await AsyncStorage.setItem('bankList', JSON.stringify(response.banks));
          console.log('💾 은행 목록 저장 완료:', response.banks.length, '개');
        }
        
        console.log('💾 AsyncStorage에 저장 완료');
        
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

  const handleKakaoLogin = async () => {
    try {
      setMainLoginLoading(true);
      
      // 카카오 로그인 URL 가져오기
      const response = await ApiService.api.get('/app/auth/kakaoLogin');
      
      if (response.data) {
        const kakaoLoginUrl = response.data;
        console.log('📱 카카오 로그인 URL:', kakaoLoginUrl);
        
        // 카카오 로그인 URL로 이동
        const canOpen = await Linking.canOpenURL(kakaoLoginUrl);
        if (canOpen) {
          await Linking.openURL(kakaoLoginUrl);
        } else {
          Alert.alert('오류', '카카오 로그인 URL을 열 수 없습니다.');
        }
      } else {
        Alert.alert('오류', '카카오 로그인 URL을 가져오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 카카오 로그인 오류:', error);
      Alert.alert('오류', '카카오 로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setMainLoginLoading(false);
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
          <Text style={styles.subtitle}>환경을 생각하는 투자 플랫폼</Text>
          <TouchableOpacity 
            style={styles.logoImageContainer}
            onPress={() => navigation.navigate('Main')}
            activeOpacity={0.8}
          >
            <Image 
              source={require('../assets/images/thumbnail_logo_en.jpg')} 
              style={styles.logoImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
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
              onSubmitEditing={handleMainLogin}
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

          {/* 로그인 버튼 */}
          <TouchableOpacity 
            style={[styles.loginButton, (mainLoginLoading || withdrawalLoginLoading) && styles.disabledButton]} 
            onPress={handleMainLogin}
            disabled={mainLoginLoading || withdrawalLoginLoading}
          >
            <Text style={styles.loginButtonText}>로그인</Text>
          </TouchableOpacity>

          {/* 카카오 로그인 버튼 */}
          <TouchableOpacity 
            style={[styles.kakaoButton, (mainLoginLoading || withdrawalLoginLoading) && styles.disabledButton]}
            onPress={handleKakaoLogin}
            disabled={mainLoginLoading || withdrawalLoginLoading}
          >
            <View style={styles.kakaoIcon}>
              <Text style={styles.kakaoIconText}>K</Text>
            </View>
            <Text style={styles.kakaoButtonText}>카카오 로그인</Text>
          </TouchableOpacity>

          {/* 출금신청 로그인 버튼 */}
          <TouchableOpacity 
            style={[styles.withdrawalButton, (mainLoginLoading || withdrawalLoginLoading) && styles.disabledButton]} 
            onPress={handleWithdrawalLogin}
            disabled={mainLoginLoading || withdrawalLoginLoading}
          >
            {withdrawalLoginLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.withdrawalButtonText}>출금신청 로그인</Text>
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

          {/* 로그인 skip 버튼 */}
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => navigation.replace('Main')}
          >
            <Text style={styles.skipButtonText}>메인페이지로 이동</Text>
          </TouchableOpacity>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoSpacer: {
    height: 40,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 10,
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
    backgroundColor: '#2c3db8',
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
    marginBottom: 10,
  },
  withdrawalButton: {
    height: 48,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  withdrawalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
  skipButton: {
    marginTop: 30,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 18,
    color: '#999999',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
