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
import ReactNativeBiometrics from 'react-native-biometrics';
import ApiService from '../services/api';

const LoginScreen = ({ navigation, route }) => {
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(true);
  const [mainLoginLoading, setMainLoginLoading] = useState(false);
  const [withdrawalLoginLoading, setWithdrawalLoginLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const passwordRef = useRef(null);

  useEffect(() => {
    const updateDimensions = () => {
      setScreenHeight(Dimensions.get('window').height);
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    loadRememberedEmail();
    checkBiometrics();
    // 로그인 화면 진입 시 공개키 선 요청
    ApiService.prefetchPublicKey();
    setInitialLoading(false);
    
    // 저장된 로그인 정보가 있으면 자동으로 Face ID 실행
    checkAndAutoTriggerBiometric();
    
    // Deep Link 리스너 설정
    const subscription = setupDeepLinkListener();
    return () => subscription?.remove();
  }, []);

  const checkAndAutoTriggerBiometric = async () => {
    try {
      // 잠시 대기 (화면이 완전히 로드된 후)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 저장된 이메일/비밀번호 확인
      const savedEmail = await AsyncStorage.getItem('rememberedEmail');
      const savedPassword = await AsyncStorage.getItem('rememberedPassword');
      
      if (savedEmail && savedPassword) {
        // 생체 인증 가능 여부 확인
        const rnBiometrics = new ReactNativeBiometrics();
        const { available } = await rnBiometrics.isSensorAvailable();
        
        if (available) {
          console.log('🔐 자동 Face ID 실행');
          handleBiometricLogin();
        }
      }
    } catch (error) {
      console.log('자동 Face ID 실행 실패:', error);
      // 에러 발생 시 조용히 무시 (수동 로그인 가능)
    }
  };

  const setupDeepLinkListener = () => {
    // Deep Link 리스너 설정
    const handleDeepLink = (event) => {
      const url = event.url;
      console.log('🔗 Deep Link 수신:', url);
      
      // rootfundapp://kakao/callback?code=xxx
      if (url.includes('rootfundapp://kakao/callback')) {
        const code = url.split('code=')[1]?.split('&')[0];
        if (code) {
          console.log('✅ 카카오 인증 코드 수신:', code);
          handleKakaoCallback(code);
        }
      }
    };
    
    // 앱이 실행 중일 때 Deep Link 수신
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // 앱이 종료된 상태에서 Deep Link로 실행된 경우
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial Deep Link:', url);
        handleDeepLink({ url });
      }
    });
    
    return subscription;
  };

  const handleKakaoCallback = async (code) => {
    try {
      setMainLoginLoading(true);
      console.log('🔄 카카오 로그인 처리 중...');
      
      // 1. 백엔드 콜백 엔드포인트 호출 (kakaoCi와 access_token 받기)
      const response = await ApiService.api.get('/app/auth/kakaoCallbackForApp', {
        params: { code }
      });
      
      console.log('✅ 카카오 콜백 응답:', response.data);
      
      if (response.data && response.data.success) {
        const { kakaoCi, access_token } = response.data;
        
        if (kakaoCi && access_token) {
          console.log('🔑 카카오 CI 및 토큰 수신 완료');
          
          // 2. 기존 로그인 API 호출 (kakaoCi로 로그인)
          const loginResult = await ApiService.kakaoLogin({
            kakaoCi: kakaoCi,
            access_token: access_token
          });
          
          console.log('✅ 카카오 로그인 결과:', loginResult);
          
          if (loginResult.success) {
            // 로그인 성공 - 메인 화면으로 이동
            navigation.replace('Main');
          } else {
            // 로그인 실패 (회원가입 필요 등)
            Alert.alert(
              '회원가입 필요',
              '카카오 계정으로 회원가입을 진행하시겠습니까?',
              [
                {
                  text: '취소',
                  style: 'cancel'
                },
                {
                  text: '회원가입',
                  onPress: () => {
                    navigation.navigate('SignUpType', {
                      kakaoData: {
                        kakaoCi: kakaoCi,
                        access_token: access_token
                      }
                    });
                  }
                }
              ]
            );
          }
        } else {
          Alert.alert('오류', '카카오 인증 정보를 받지 못했습니다.');
        }
      } else {
        Alert.alert('로그인 실패', response.data?.message || '카카오 로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 카카오 로그인 처리 오류:', error);
      Alert.alert('오류', '카카오 로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setMainLoginLoading(false);
    }
  };

  const checkBiometrics = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      
      console.log('🔍 생체 인증 체크:', { available, biometryType });
      
      if (available) {
        setBiometricsAvailable(true);
        setBiometricType(biometryType);
        console.log('✅ 생체 인증 가능:', biometryType);
      } else {
        console.log('❌ 생체 인증 불가능');
        // 개발 중에는 강제로 활성화 (테스트용)
        setBiometricsAvailable(true);
        setBiometricType('FaceID');
        console.log('⚠️ 개발 모드: 생체 인증 버튼 강제 표시');
      }
    } catch (error) {
      console.error('❌ 생체 인증 확인 오류:', error);
      // 에러 발생 시에도 버튼 표시 (테스트용)
      setBiometricsAvailable(true);
      setBiometricType('FaceID');
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

  const handleBiometricLogin = async () => {
    try {
      // 저장된 이메일과 비밀번호 확인
      const savedEmail = await AsyncStorage.getItem('rememberedEmail');
      const savedPassword = await AsyncStorage.getItem('rememberedPassword');
      
      if (!savedEmail || !savedPassword) {
        Alert.alert('생체 인증 로그인', '먼저 이메일과 비밀번호로 로그인하고 "이메일 저장"을 활성화해주세요.');
        return;
      }

      const rnBiometrics = new ReactNativeBiometrics();
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: '로그인하려면 인증하세요',
        cancelButtonText: '취소',
      });

      if (success) {
        console.log('✅ 생체 인증 성공');
        // 저장된 이메일/비밀번호로 자동 로그인
        setEmail(savedEmail);
        setPassword(savedPassword);
        
        setMainLoginLoading(true);
        try {
          const loginData = { email: savedEmail, password: savedPassword };
          const response = await ApiService.login(loginData);
          
          if (response.success && response.user) {
            await AsyncStorage.setItem('userData', JSON.stringify(response.user));
            await AsyncStorage.setItem('userToken', response.user.token);
            
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          } else {
            Alert.alert('로그인 실패', response.message || '로그인에 실패했습니다.');
          }
        } catch (error) {
          console.error('로그인 오류:', error);
          Alert.alert('로그인 오류', '로그인 중 오류가 발생했습니다.');
        } finally {
          setMainLoginLoading(false);
        }
      } else {
        console.log('❌ 생체 인증 취소');
      }
    } catch (error) {
      console.error('생체 인증 오류:', error);
      Alert.alert('오류', '생체 인증 중 오류가 발생했습니다.');
    }
  };

  const handleLogin = async (targetScreen = 'Main', targetParams = null, setLoadingState) => {
    if (!email || !password) {
      Alert.alert('로그인', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoadingState(true);
    
    try {
      await saveRememberedEmail();
      
      const loginData = { email, password };
      const response = await ApiService.login(loginData);
      
      if (response.success && response.user) {
        // 로그인 성공 시 사용자 정보 저장
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        await AsyncStorage.setItem('userToken', response.user.token);
        
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

  const handleKakaoLogin = async () => {
    try {
      setMainLoginLoading(true);
      
      // 앱 전용 카카오 로그인 URL 가져오기
      const response = await ApiService.api.get('/app/auth/kakaoLoginForApp');
      
      if (response.data) {
        const kakaoLoginUrl = response.data;
        console.log('🔗 카카오 로그인 URL:', kakaoLoginUrl);
        
        // 카카오 로그인 URL로 이동 (외부 브라우저)
        const canOpen = await Linking.canOpenURL(kakaoLoginUrl);
        if (canOpen) {
          await Linking.openURL(kakaoLoginUrl);
          // Deep Link로 돌아올 때까지 대기
        } else {
          Alert.alert('오류', '카카오 로그인 URL을 열 수 없습니다.');
          setMainLoginLoading(false);
        }
      } else {
        Alert.alert('오류', '카카오 로그인 URL을 가져오는데 실패했습니다.');
        setMainLoginLoading(false);
      }
    } catch (error) {
      console.error('❌ 카카오 로그인 오류:', error);
      Alert.alert('오류', '카카오 로그인 처리 중 오류가 발생했습니다.');
      setMainLoginLoading(false);
    }
    // 로딩은 handleKakaoCallback에서 해제
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
              onChangeText={(text) => {
                setEmail(text);
                // 이메일이 변경되면 비밀번호 입력값은 초기화
                if (password) setPassword('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => {
                // 이메일이 비어있을 때는 자동으로 다음 인풋으로 이동하지 않음
                if (email?.trim()) {
                  passwordRef.current?.focus();
                }
              }}
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
          <View style={styles.loginButtonContainer}>
          <TouchableOpacity 
            style={[styles.loginButton, (mainLoginLoading || withdrawalLoginLoading) && styles.disabledButton]} 
            onPress={handleMainLogin}
            disabled={mainLoginLoading || withdrawalLoginLoading}
          >
            <Text style={styles.loginButtonText}>로그인</Text>
          </TouchableOpacity>

            {/* Face ID/Touch ID 버튼 */}
            {biometricsAvailable && (
              <TouchableOpacity 
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={mainLoginLoading || withdrawalLoginLoading}
              >
                <Text style={styles.biometricIcon}>
                  {biometricType === 'FaceID' ? '👤' : '👆'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

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
                <Text style={styles.signupEmphasis}>회원가입</Text>
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
    paddingVertical: 80,
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
    height: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '400',
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
  loginButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  loginButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#2c3db8',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricIcon: {
    fontSize: 24,
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
    fontWeight: '500',
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
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    color: '#393f44',
  },
  signupEmphasis: {
    color: '#2c3db8',
  },
});

export default LoginScreen;
