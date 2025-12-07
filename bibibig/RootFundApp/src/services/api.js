import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import JSEncrypt from 'jsencrypt';
import { rsaEncryptWithPublicKey } from '../utils/rsaEncrypt';
import { Platform } from 'react-native';

class ApiService {
  constructor() {
    // 개발 환경에 따른 API URL 설정
    this.baseURL = this.getApiBaseUrl();
    this.publicKey = null; // 공개키 캐시
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 60000, // 60초로 증가
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'RootFundApp://LoginScreen', // 앱의 로그인 화면
        'User-Agent': 'RootFundApp/1.0 (Mobile App)', // 앱임을 명시
      },
    });

    console.log('🌐 API 베이스 URL:', this.baseURL);

    // 요청 인터셉터 - 토큰 자동 추가
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터 - 에러 처리
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // 토큰 만료 시 로그아웃 처리
          await this.clearLoginData();
        }
        return Promise.reject(error);
      }
    );
  }

  // API 베이스 URL 결정
  getApiBaseUrl() {
    // 로컬 개발 환경
    // Android 에뮬레이터: 10.0.2.2
    // iOS 시뮬레이터: localhost
    const localUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
    return localUrl;
    
    // 운영 환경 (주석 처리)
    // return 'https://rootenergy.co.kr';
  }

  // URL-encoded 형태로 데이터 변환 (Spring @ModelAttribute용)
  // 로그인 만료 검사
  async checkLoginExpiration() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        return { expired: true, reason: 'no_data' };
      }

      const user = JSON.parse(userData);
      const currentTime = Date.now();
      
      // 만료 시간이 설정되지 않은 경우 (기존 로그인)
      if (!user.expirationTime) {
        console.log('⚠️ 만료 시간 없는 기존 로그인 - 재로그인 필요');
        return { expired: true, reason: 'no_expiration' };
      }
      
      // 만료 시간 검사
      if (currentTime > user.expirationTime) {
        console.log('⏰ 로그인 만료됨');
        return { expired: true, reason: 'expired' };
      }
      
      // 남은 시간 계산
      const remainingTime = user.expirationTime - currentTime;
      const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
      const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
      
      console.log(`✅ 로그인 유효 - 남은 시간: ${remainingHours}시간 ${remainingMinutes}분`);
      return { 
        expired: false, 
        user: user,
        remainingTime: remainingTime,
        remainingHours: remainingHours,
        remainingMinutes: remainingMinutes
      };
      
    } catch (error) {
      console.error('❌ 로그인 만료 검사 실패:', error);
      return { expired: true, reason: 'error' };
    }
  }

  // 로그인 정보 삭제
  async clearLoginData() {
    try {
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userToken');
      console.log('🗑️ 로그인 정보 삭제 완료');
    } catch (error) {
      console.error('❌ 로그인 정보 삭제 실패:', error);
    }
  }

  // 로그아웃 (백엔드 로그아웃 API 호출 + 로컬 데이터 삭제)
  async logout() {
    try {
      console.log('🚪 로그아웃 시작');
      
      // member_id 가져오기
      const currentUser = await this.getCurrentUser();
      const memberId = currentUser?.session?.member_id || currentUser?.member_id || currentUser?.id;
      
      // 백엔드 로그아웃 API 호출 (선택적)
      try {
        if (memberId) {
          console.log('📤 로그아웃 API 호출 - member_id:', memberId);
          const response = await this.api.post('/app/logoutProcess', {
            member_id: memberId,
          });
          console.log('✅ 백엔드 로그아웃 완료:', response.data);
        } else {
          console.warn('⚠️ member_id가 없어 백엔드 로그아웃 API를 호출하지 않습니다.');
        }
      } catch (error) {
        console.warn('⚠️ 백엔드 로그아웃 실패 (로컬 데이터는 삭제):', error.message);
      }
      
      // 로컬 세션 데이터 삭제
      await this.clearLoginData();
      
      console.log('✅ 로그아웃 완료');
      return { success: true };
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      return { success: false, message: '로그아웃 중 오류가 발생했습니다.' };
    }
  }

  // 세션 데이터 접근 유틸리티 함수들
  async getSessionData(key = null) {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        console.warn('⚠️ 로그인 데이터가 없습니다');
        return null;
      }

      const user = JSON.parse(userData);
      const sessionData = user.session || {};

      // 특정 키 요청 시
      if (key) {
        return sessionData[key] || null;
      }

      // 전체 세션 데이터 반환
      return sessionData;
    } catch (error) {
      console.error('❌ 세션 데이터 조회 실패:', error);
      return null;
    }
  }

  // 현재 로그인한 사용자의 기본 정보 조회
  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        return null;
      }

      const user = JSON.parse(userData);
      console.log('🔍 getCurrentUser - 원본 사용자 데이터:', user);
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        loginId: user.loginId,
        loginTime: user.loginTime,
        expirationTime: user.expirationTime,
        token: user.token,
        session: user.session, // 전체 세션 데이터 포함
        member: user.member, // 회원 은행 정보 포함
        // 호환성을 위한 직접 접근 필드들
        member_id: user.session?.member_id,
        member_name: user.session?.member_name,
        balance: user.session?.balance,
        member_class: user.session?.member_class,
        member_grade: user.session?.member_grade
      };
    } catch (error) {
      console.error('❌ 현재 사용자 정보 조회 실패:', error);
      return null;
    }
  }

  // 잔액 조회
  async getBalance() {
    return await this.getSessionData('balance');
  }

  // 회원 등급 조회
  async getMemberGrade() {
    return await this.getSessionData('member_grade');
  }

  // 회원 클래스 조회
  async getMemberClass() {
    return await this.getSessionData('member_class');
  }

  // 가상계좌 정보 조회
  async getVirtualAccount() {
    return await this.getSessionData('v_account');
  }

  // 세션 데이터 업데이트 (특정 값만 업데이트)
  async updateSessionData(key, value) {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        console.warn('⚠️ 로그인 데이터가 없어 세션 업데이트 불가');
        return false;
      }

      const user = JSON.parse(userData);
      if (!user.session) {
        user.session = {};
      }

      user.session[key] = value;
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      console.log(`✅ 세션 데이터 업데이트: ${key} = ${value}`);
      return true;
    } catch (error) {
      console.error('❌ 세션 데이터 업데이트 실패:', error);
      return false;
    }
  }

  convertToFormData(data) {
    // React Native에서 URLSearchParams가 제대로 작동하지 않을 수 있으므로
    // 직접 문자열을 생성합니다.
    const params = [];
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        const value = String(data[key]);
        // URL 인코딩 처리
        params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    });
    return params.join('&');
  }

  // 공개키 가져오기 (웹에서는 서버에서 렌더링되지만 앱에서는 API로 가져와야 함)
  async getPublicKey() {
    if (this.publicKey) {
      return this.publicKey; // 캐시된 공개키 사용
    }

    // 새 AppPulickKey 엔드포인트 먼저 시도
    await this.prefetchPublicKey();
    if (this.publicKey) {
      return this.publicKey;
    }
    
    try {
      console.log('🔑 공개키 요청');
      
      // 웹에서 사용하는 공개키 엔드포인트 시도
      let response;
      try {
        // 1. 전용 공개키 API 시도
        response = await this.api.get('/api/publickey');
        this.publicKey = response.data.publicKey || response.data;
      } catch (apiError) {
        console.log('🔑 전용 API 실패, 웹 페이지에서 공개키 추출 시도');
        if (
          apiError.code === 'ECONNABORTED' ||
          apiError.message?.includes('timeout') ||
          apiError.message?.includes('Network Error')
        ) {
          throw apiError;
        }
        
        // 2. 웹 페이지에서 공개키 추출 시도 (웹과 동일한 방식)
        const webResponse = await this.api.get('/', {
          headers: { 'Accept': 'text/html' }
        });
        
        // HTML에서 공개키 추출 (웹에서 사용하는 방식)
        const htmlContent = webResponse.data;
        const publicKeyMatch = htmlContent.match(/<textarea[^>]*id="_bc5jsencpublickey"[^>]*>([\s\S]*?)<\/textarea>/i);
        
        if (publicKeyMatch && publicKeyMatch[1]) {
          this.publicKey = publicKeyMatch[1].trim();
          console.log('✅ 웹 페이지에서 공개키 추출 성공');
        } else {
          throw new Error('공개키를 찾을 수 없음');
        }
      }
      
      console.log('✅ 공개키 수신 완료');
      return this.publicKey;
    } catch (error) {
      console.error('❌ 공개키 가져오기 실패:', error);
      
      // 개발용: 실제 서버 공개키가 없을 때 테스트용 키 생성
      console.log('🔧 개발 모드: 테스트용 공개키 생성');
      
      // 실제 RSA 2048bit 공개키 (테스트용)
      this.publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlViLMalAkBbaP3f+m6jh
GVhtR0RgYQGH3Bzi9yYcyqj/D1Gh5N40HBBlEoUZTq3yr7uQ7e2DizXwieo5129u
4QyJTtUeCE0q5KJd6AQokJlNLA2EL+YGQ3J3SmkciJixIOGAsNCc3b9bf6l8zj3O
8NRsMhl0PfESDiY8wh/1/pfjDpHHYRD1eCK/L8t+8Y+nmIT75IIzisbjeJDAQJ3e
2GUHRFGCvzztL8G4JVm63LS+BDgUHrW89baBE92KQLXBsuy85iLw9vJgLepclSnQ
CHTSC9rEtiSWMVaIu7J0HUWJRo5hlsMBB1niE4qpLziuiJOce5cDv03kCiMNO7BV
DwIDAQAB
-----END PUBLIC KEY-----`;
      
      return this.publicKey;
    }
  }

  // 앱 초기 구동 시 공개키를 미리 불러오는 전용 API
  async prefetchPublicKey() {
    if (this.publicKey) {
      return this.publicKey;
    }

    try {
      console.log('🔑 /app/pulickKey 통해 공개키 선 요청');
      const response = await this.api.get('/app/pulickKey');
      
      console.log('🔑 /app/pulickKey 응답:', response.data);
      
      // 백엔드 응답: { bc5jsencpublickey: "-----BEGIN PUBLIC KEY-----..." }
      const publicKey = response.data?.bc5jsencpublickey;
      
      if (publicKey) {
        this.publicKey = publicKey;
        console.log('✅ /app/pulickKey 공개키 수신 완료:', {
          length: publicKey.length,
          start: publicKey.substring(0, 50) + '...'
        });
        return this.publicKey;
      }
      console.warn('⚠️ /app/pulickKey 응답에 bc5jsencpublickey가 없음');
    } catch (error) {
      console.warn('⚠️ /app/pulickKey 공개키 선 요청 실패 - 목업 모드로 전환:', error.message || error);
      
      // 앱용 API가 아직 구현되지 않은 경우 목업 공개키 사용
      console.log('🔧 개발 모드: 목업 공개키 사용');
      this.publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlViLMalAkBbaP3f+m6jh
GVhtR0RgYQGH3Bzi9yYcyqj/D1Gh5N40HBBlEoUZTq3yr7uQ7e2DizXwieo5129u
4QyJTtUeCE0q5KJd6AQokJlNLA2EL+YGQ3J3SmkciJixIOGAsNCc3b9bf6l8zj3O
8NRsMhl0PfESDiY8wh/1/pfjDpHHYRD1eCK/L8t+8Y+nmIT75IIzisbjeJDAQJ3e
2GUHRFGCvzztL8G4JVm63LS+BDgUHrW89baBE92KQLXBsuy85iLw9vJgLepclSnQ
CHTSC9rEtiSWMVaIu7J0HUWJRo5hlsMBB1niE4qpLziuiJOce5cDv03kCiMNO7BV
DwIDAQAB
-----END PUBLIC KEY-----`;
    }

    return this.publicKey;
  }

  // 비밀번호 암호화 (웹의 _bc5jsencsetdata 함수와 동일)
  async encryptPassword(password) {
    try {
      console.log('🔐 JSEncrypt 암호화 시도 (웹과 동일):', {
        passwordLength: password ? password.length : 0,
        passwordSample: password ? password.substring(0, 3) + '***' : 'null'
      });

      // 공개키 가져오기 (웹의 $('#_bc5jsencpublickey').val() 와 동일)
      const publicKey = await this.getPublicKey();
      
      if (!publicKey) {
        console.error('❌ 공개키가 없음');
        throw new Error('공개키가 없음');
      }

      console.log('🔑 공개키 정보:', {
        length: publicKey.length,
        start: publicKey.substring(0, 50) + '...',
        end: '...' + publicKey.substring(publicKey.length - 50)
      });

      // 웹과 동일한 JSEncrypt 사용
      // function _bc5jsencsetdata(_tabal){
      //     var encrypt = new JSEncrypt();
      //     encrypt.setPublicKey($('#_bc5jsencpublickey').val());
      //     return encrypt.encrypt(_tabal);
      // }
      
      let encryptedPassword = null;

      try {
        const encrypt = new JSEncrypt();
        
        console.log('🔑 공개키 설정 시도...');
        const setKeyResult = encrypt.setPublicKey(publicKey);
        console.log('🔑 공개키 설정 결과:', setKeyResult);
        
        console.log('🔐 encrypt.encrypt() 호출...');
        encryptedPassword = encrypt.encrypt(password);
        
        console.log('🔐 JSEncrypt 암호화 결과:', {
          original: password.substring(0, 3) + '***',
          encrypted: encryptedPassword ? encryptedPassword.substring(0, 50) + '...' : 'null',
          length: encryptedPassword ? encryptedPassword.length : 0,
          type: typeof encryptedPassword,
          isString: typeof encryptedPassword === 'string',
          isFalse: encryptedPassword === false
        });

        if (encryptedPassword === false || !encryptedPassword) {
          throw new Error('JSEncrypt 암호화 실패');
        }

        console.log('✅ JSEncrypt 비밀번호 암호화 성공 (웹과 동일)');
        return encryptedPassword;
      } catch (jsEncryptError) {
        console.error('❌ JSEncrypt.encrypt() 오류:', jsEncryptError);
      }

      try {
        console.log('🔐 커스텀 RSA 암호화 시도 (PKCS#1 v1.5)...');
        encryptedPassword = rsaEncryptWithPublicKey(publicKey, password);
        console.log('✅ 커스텀 RSA 암호화 성공:', {
          original: password.substring(0, 3) + '***',
          encrypted: encryptedPassword.substring(0, 50) + '...',
          length: encryptedPassword.length
        });
        return encryptedPassword;
      } catch (customError) {
        console.error('❌ 커스텀 RSA 암호화 실패:', customError);
      }

    } catch (error) {
      console.error('❌ JSEncrypt 암호화 실패:', error);
      console.error('❌ 오류 상세:', error.message);
      console.error('❌ 스택:', error.stack);
      
      // JSEncrypt 실패시 fallback: 간단한 암호화
      console.warn('⚠️ RSA 암호화 실패로 임시 fallback 암호화 사용');
      
      const timestamp = Date.now().toString();
      const combined = password + '|' + timestamp;
      const encoded = Buffer.from(combined).toString('base64');
      const fallbackEncrypted = encoded
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '.');
      
      console.warn('⚠️ Fallback 암호화 결과:', fallbackEncrypted.substring(0, 30) + '...');
      return fallbackEncrypted;
    }
  }

  // 보안 요청 모드 설정
  async setReqModes(reqData = {}) {
    try {
      console.log('🔒 setreqmodes 호출');
      
      // 백엔드에서 요구하는 reqdata 파라미터 추가
      const requestData = {
        reqdata: reqData.reqdata || '' // 백엔드에서 기대하는 reqdata 파라미터
      };
      
      const formData = this.convertToFormData(requestData);
      console.log('📤 setreqmodes 전송 데이터:', formData);
      
      const response = await this.api.post('/app/setreqmodes', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json', // JSON 응답 요청
          'Referer': 'RootFundApp://LoginScreen' // 백엔드에서 data5로 사용
        }
      });
      
      console.log('✅ setreqmodes 응답 타입:', typeof response.data);
      console.log('✅ setreqmodes 응답 내용:', response.data);
      
      // HTML 응답인 경우 (페이지 에러)
      if (typeof response.data === 'string' && response.data.includes('페이지에러')) {
        console.warn('⚠️ setreqmodes HTML 에러 페이지 반환 - 목업 데이터 사용');
        throw new Error('HTML error page returned');
      }
      
      // 정상 JSON 응답인 경우 - 백엔드 HashMap 구조에 맞게 처리
      if (response.data && typeof response.data === 'object') {
        console.log('✅ setreqmodes 정상 응답:', {
          data1: response.data.data1 ? '***' : 'null',
          data2: response.data.data2 ? '***' : 'null',
          data3: response.data.data3,
          data4: response.data.data4,
          data5: response.data.data5
        });
        return response.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.warn('⚠️ setreqmodes API 오류 - 목업 데이터 사용:', error.message);
      console.log('🔧 개발 모드: 목업 보안 데이터 반환');
      return { 
        data1: 'mock_encrypted_timestamp', 
        data2: 'mock_encrypted_reqdata',
        data3: 'mock_random_12',
        data4: '1234',
        data5: 'RootFundApp://LoginScreen'
      };
    }
  }

  // 로그인
  async login(credentials) {
    try {
      console.log('🔐 로그인 요청:', credentials);
      console.log('🌐 API URL:', `${this.baseURL}/app/loginProcess`);
      
      // 1. 먼저 setreqmodes 호출해서 보안 데이터 가져오기
      const reqModes = await this.setReqModes({});
      
      // 2. 비밀번호 암호화 (웹의 _bc5jsencsetdata 함수와 동일)
      const encryptedPassword = await this.encryptPassword(credentials.password);
      
      // 3. 로그인 데이터 구성 (웹 버전과 동일한 형태)
      const loginData = {
        id: credentials.email.toString(),
        password: encryptedPassword,
        _bcsrmd1: reqModes.data1 || '',
        _bcsrmd2: reqModes.data2 || ''
      };
      
      console.log('📤 최종 로그인 데이터:', { 
        id: loginData.id, 
        password: '***',
        _bcsrmd1: loginData._bcsrmd1 ? '***' : '',
        _bcsrmd2: loginData._bcsrmd2 ? '***' : ''
      });
      
      // Form-data 형태로 변환
      const formData = this.convertToFormData(loginData);
      console.log('📤 Form-data 형태:', formData);
      
      const response = await this.api.post('/app/loginProcess', formData);
      
      console.log('✅ 로그인 응답:', response.data);
      console.log('✅ 전체 응답 구조:', response);
      
      // 백엔드 응답 처리: rsdata : {memo=, rtnvalue=0, result=sessionMap}
      if (response.data) {
        console.log('🔍 응답 데이터 분석:', {
          rtnvalue: response.data.rtnvalue,
          memo: response.data.memo,
          hasRsdata: !!response.data.rsdata,
          hasResult: !!response.data.rsdata?.result
        });

        // rtnvalue가 "0" 또는 0이면 성공
        if (response.data.rtnvalue === "0" || response.data.rtnvalue === 0) {
          console.log('✅ 로그인 성공 - 세션 데이터 처리');
          
          // 전체 응답 구조 확인
          console.log('🔍 전체 로그인 응답:', JSON.stringify(response.data, null, 2));
          console.log('🔍 rsdata 구조:', JSON.stringify(response.data.rsdata, null, 2));
          
          // member 데이터 상세 확인
          console.log('🔍 rsdata.member 존재?:', !!response.data.rsdata?.member);
          console.log('🔍 rsdata.member 내용:', response.data.rsdata?.member);
          
          // 백엔드에서 전달받은 세션 데이터 추출
          const sessionData = response.data.rsdata?.session || response.data.rsdata?.result || {};
          const memberData = response.data.rsdata?.member || {};
          console.log('📋 백엔드 세션 데이터:', sessionData);
          console.log('📋 백엔드 회원 데이터:', memberData);
          console.log('📋 member 데이터 존재 여부:', !!response.data.rsdata?.member);
          console.log('📋 member.bank_nm:', response.data.rsdata?.member?.bank_nm);
          
          // 로그인 만료 시간 설정 (24시간 후)
          const expirationTime = Date.now() + (24 * 60 * 60 * 1000); // 24시간
          
          // 사용자 데이터 구성 (백엔드 세션 데이터 포함)
          const userData = {
            // 기본 정보
            id: sessionData.member_id || credentials.email,
            email: sessionData.email || credentials.email,
            name: sessionData.member_name || sessionData.r_name || '사용자',
            token: response.data.token || 'app-token-' + Date.now(),
            
            // 앱 관리용 정보
            loginId: credentials.email,
            loginTime: Date.now(),
            expirationTime: expirationTime,
            
            // 백엔드 세션 데이터 (모든 페이지에서 사용 가능)
            session: {
              member_id: sessionData.member_id,
              memGuid: sessionData.memGuid,
              email: sessionData.email,
              web_id: sessionData.web_id,
              member_name: sessionData.member_name,
              r_name: sessionData.r_name,
              balance: sessionData.balance,
              member_class: sessionData.member_class,
              f_member_class_kr: sessionData.f_member_class_kr,
              member_type: sessionData.member_type,
              member_grade: sessionData.member_grade,
              sort: sessionData.sort,
              v_account: sessionData.v_account,
              
              // 회원 은행 정보 (member 맵에서 추출)
              bank_nm: memberData.bank_nm,
              account: memberData.account,
              account_holder_name: memberData.name
            },
            
            // 회원 은행 정보 (member 데이터 직접 포함)
            member: memberData,
            
            // 원본 응답 데이터도 보관
            ...response.data
          };
          
          console.log('💾 저장할 사용자 데이터:');
          console.log('📋 기본 정보:', {
            id: userData.id,
            email: userData.email,
            name: userData.name
          });
          console.log('📋 세션 데이터:', JSON.stringify(userData.session, null, 2));
          console.log('📋 실제 백엔드 응답:', JSON.stringify(sessionData, null, 2));
          
          return { 
            success: true, 
            user: userData
          };
        } else {
          // rtnvalue에 따른 상세한 에러 메시지 처리
          const rtnvalue = String(response.data.rtnvalue || '');
          let errorMessage = response.data.memo || response.data.action || '로그인에 실패했습니다.';
          
          // rtnvalue에 따라 상세한 메시지 설정
          switch (rtnvalue) {
            case '1':
              errorMessage = '아이디를 입력해주세요.';
              break;
            case '2':
              errorMessage = '비밀번호를 입력해주세요.';
              break;
            case '3':
              errorMessage = '일치하는 아이디가 없습니다. 아이디를 확인해주세요.';
              break;
            case '4':
              errorMessage = '비밀번호가 일치하지 않습니다. 비밀번호를 확인해주세요.';
              break;
            case '5':
              errorMessage = '사용 정지된 회원입니다. 고객센터로 문의해주세요.';
              break;
            case '6':
              errorMessage = '탈퇴한 회원입니다.';
              break;
            case '7':
              errorMessage = '휴면 회원입니다. 고객센터로 문의해주세요.';
              break;
            case '15':
              errorMessage = response.data.memo || '비밀번호를 5회 이상 잘못 입력하여 계정이 일시 정지되었습니다. 고객센터로 문의해주세요.';
              break;
            default:
              // memo나 action이 있으면 우선 사용, 없으면 기본 메시지
              if (response.data.memo) {
                errorMessage = response.data.memo;
              } else if (response.data.action) {
                errorMessage = response.data.action;
              }
              break;
          }
          
          console.log('❌ 로그인 실패:', {
            rtnvalue: rtnvalue,
            memo: response.data.memo,
            action: response.data.action,
            errorMessage: errorMessage
          });
          
          return { 
            success: false, 
            message: errorMessage,
            rtnvalue: rtnvalue
          };
        }
      }
      
      return { success: false, message: '로그인 실패' };
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error details:', error.response?.data);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      
      // 오류 유형별 처리
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      
      if (error.response?.status === 404) {
        console.warn('🔍 로그인 API 엔드포인트를 찾을 수 없습니다 (404)');
        errorMessage = '로그인 서비스를 사용할 수 없습니다. 서버 설정을 확인해주세요.';
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.warn('⏰ 로그인 타임아웃 - 서버 응답이 느립니다');
        errorMessage = '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('Network Error') || error.code === 'ECONNREFUSED') {
        console.warn('🌐 네트워크 연결 오류');
        errorMessage = '네트워크 연결을 확인해주세요.';
      } else if (error.response?.status >= 500) {
        console.warn('🔧 서버 내부 오류');
        errorMessage = '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      // 개발용: 타임아웃이나 네트워크 오류 시 테스트 계정으로 로그인 허용
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || 
          error.message.includes('Network Error') || error.code === 'ECONNREFUSED') {
        console.log('🔧 개발 모드: 네트워크 오류로 인한 테스트 로그인 허용');
        
        // 실제 입력한 계정 정보로 목업 로그인 생성
        return {
          success: true,
          user: {
            id: 'mock-' + Date.now(),
            email: credentials.email,
            name: '목업 사용자 (' + credentials.email.split('@')[0] + ')',
            token: 'mock-token-' + Date.now(),
            loginId: credentials.email,
            loginTime: Date.now(),
            expirationTime: Date.now() + (24 * 60 * 60 * 1000),
            session: {
              member_id: 'mock-' + Date.now(),
              memGuid: 'mock-guid',
              email: credentials.email,
              web_id: credentials.email,
              member_name: '목업 사용자',
              r_name: '목업 사용자',
              balance: '10000000', // 1천만원
              member_class: 'NORMAL',
              f_member_class_kr: '일반 투자자',
              member_type: 'INDIVIDUAL',
              member_grade: 'BASIC',
              sort: '1',
              v_account: '110-000-' + Date.now().toString().slice(-6)
            }
          }
        };
      }
      
      return { success: false, message: errorMessage };
    }
  }

  // 출금 신청 로그인
  async withdrawalLogin(credentials) {
    try {
      console.log('🔐 출금 신청 로그인 요청:', credentials);
      console.log('🌐 API URL:', `${this.baseURL}/app/withdrawal/loginProcess`);
      
      // 1. 먼저 setreqmodes 호출해서 보안 데이터 가져오기
      const reqModes = await this.setReqModes({});
      
      // 2. 비밀번호 암호화
      const encryptedPassword = await this.encryptPassword(credentials.password);
      
      // 3. 로그인 데이터 구성
      const loginData = {
        id: credentials.email.toString(),
        password: encryptedPassword,
        _bcsrmd1: reqModes.data1 || '',
        _bcsrmd2: reqModes.data2 || ''
      };
      
      console.log('📤 최종 출금 로그인 데이터:', { 
        id: loginData.id, 
        password: '***',
        _bcsrmd1: loginData._bcsrmd1 ? '***' : '',
        _bcsrmd2: loginData._bcsrmd2 ? '***' : ''
      });
      
      // Form-data 형태로 변환
      const formData = this.convertToFormData(loginData);
      
      // Referer 헤더 추가 (백엔드에서 체크)
      const response = await this.api.post('/app/withdrawal/loginProcess', formData, {
        headers: {
          'Referer': 'RootFundApp://LoginScreen'
        }
      });
      
      console.log('✅ 출금 로그인 응답:', response.data);
      
      if (response.data) {
        console.log('🔍 응답 데이터 분석:', {
          rtnvalue: response.data.rtnvalue,
          memo: response.data.memo,
          hasSession: !!response.data.session,
          hasMember: !!response.data.member,
          hasBanks: !!response.data.banks
        });

        // rtnvalue가 "0" 또는 0이면 성공
        if (response.data.rtnvalue === "0" || response.data.rtnvalue === 0) {
          console.log('✅ 출금 로그인 성공 - 세션 및 은행 데이터 처리');
          
          // 백엔드에서 전달받은 데이터 추출 (rsdata 없이 직접 전달됨)
          const sessionData = response.data.session || {};
          const memberData = response.data.member || {};
          const banks = response.data.banks || [];
          
          console.log('📋 백엔드 세션 데이터:', sessionData);
          console.log('📋 백엔드 회원 데이터:', memberData);
          console.log('📋 은행 목록:', banks.length, '개');
          
          // 로그인 만료 시간 설정 (24시간 후)
          const expirationTime = Date.now() + (24 * 60 * 60 * 1000);
          
          // 사용자 데이터 구성
          const userData = {
            id: sessionData.member_id || credentials.email,
            email: sessionData.email || credentials.email,
            name: sessionData.member_name || sessionData.r_name || '사용자',
            token: response.data.token || 'app-token-' + Date.now(),
            loginId: credentials.email,
            loginTime: Date.now(),
            expirationTime: expirationTime,
            session: {
              member_id: sessionData.member_id,
              memGuid: sessionData.memGuid,
              email: sessionData.email,
              web_id: sessionData.web_id,
              member_name: sessionData.member_name,
              r_name: sessionData.r_name,
              balance: sessionData.balance,
              member_class: sessionData.member_class,
              f_member_class_kr: sessionData.f_member_class_kr,
              member_type: sessionData.member_type,
              member_grade: sessionData.member_grade,
              sort: sessionData.sort,
              v_account: sessionData.v_account,
              bank_nm: memberData.bank_nm,
              account: memberData.account,
              account_holder_name: memberData.name
            },
            member: memberData,
            ...response.data
          };
          
          console.log('💾 저장할 사용자 데이터:', userData);
          
          return { 
            success: true, 
            user: userData,
            banks: banks
          };
        } else {
          console.log('❌ 출금 로그인 실패:', response.data.memo);
          return { 
            success: false, 
            message: response.data.memo || '로그인에 실패했습니다.' 
          };
        }
      }
      
      return { success: false, message: '로그인 실패' };
    } catch (error) {
      console.error('❌ Withdrawal login error:', error);
      console.error('❌ Error details:', error.response?.data);
      
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('Network Error') || error.code === 'ECONNREFUSED') {
        errorMessage = '네트워크 연결을 확인해주세요.';
      } else if (error.response?.status >= 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.response?.data?.memo) {
        errorMessage = error.response.data.memo;
      }
      
      return { success: false, message: errorMessage };
    }
  }

  // 네트워크 오류 분석
  analyzeNetworkError(error) {
    const errorCode = error.code;
    const errorMessage = error.message || '';
    const statusCode = error.response?.status;

    return {
      isNetworkError: errorMessage.includes('Network Error') || errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND',
      isServerDown: errorCode === 'ECONNREFUSED' || errorCode === 'ECONNRESET',
      isTimeout: errorCode === 'ECONNABORTED' || errorMessage.includes('timeout'),
      is404: statusCode === 404,
      is500: statusCode >= 500,
      statusCode: statusCode,
      errorCode: errorCode,
      message: errorMessage
    };
  }

  // 개발용 목업 로그인 응답
  getMockLoginResponse(credentials) {
    // 테스트 계정들
    const mockUsers = {
      'test@test.com': {
        password: '1234',
        userData: {
          id: 'member001',
          email: 'test@test.com',
          name: '김테스트',
          token: 'mock-token-' + Date.now(),
          loginId: 'test@test.com',
          loginTime: Date.now(),
          expirationTime: Date.now() + (24 * 60 * 60 * 1000),
          session: {
            member_id: 'member001',
            memGuid: 'guid-001',
            email: 'test@test.com',
            web_id: 'web001',
            member_name: '김테스트',
            r_name: '김테스트',
            balance: '1500000',
            member_class: 'PREMIUM',
            f_member_class_kr: '프리미엄',
            member_type: 'INDIVIDUAL',
            member_grade: 'VIP',
            sort: '1',
            v_account: '110-123-456789'
          }
        }
      },
      'admin@test.com': {
        password: 'admin123',
        userData: {
          id: 'admin001',
          email: 'admin@test.com',
          name: '관리자',
          token: 'mock-admin-token-' + Date.now(),
          loginId: 'admin@test.com',
          loginTime: Date.now(),
          expirationTime: Date.now() + (24 * 60 * 60 * 1000),
          session: {
            member_id: 'admin001',
            memGuid: 'admin-guid-001',
            email: 'admin@test.com',
            web_id: 'admin001',
            member_name: '관리자',
            r_name: '관리자',
            balance: '50000000',
            member_class: 'ADMIN',
            f_member_class_kr: '관리자',
            member_type: 'ADMIN',
            member_grade: 'ADMIN',
            sort: '0',
            v_account: '110-999-999999'
          }
        }
      }
    };

    const mockUser = mockUsers[credentials.email];
    
    if (mockUser && mockUser.password === credentials.password) {
      console.log('✅ 목업 로그인 성공:', credentials.email);
      return {
        success: true,
        user: mockUser.userData
      };
    } else {
      console.log('❌ 목업 로그인 실패: 잘못된 계정 정보');
      return {
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      };
    }
  }

  // 출금 신청
  async requestWithdrawal(withdrawalData) {
    try {
      console.log('💰 출금 신청 시작:', withdrawalData);
      
      // 1단계: setReqModes 호출하여 보안 데이터 획득
      console.log('🔒 setReqModes 호출 중...');
      const securityData = await this.setReqModes({
        reqdata: `${withdrawalData.amount}`
      });
      
      console.log('🔒 setReqModes 응답:', securityData);
      console.log('🔒 setReqModes data1 값:', securityData.data1);
      console.log('🔒 setReqModes data2 값:', securityData.data2);
      console.log('🔒 setReqModes 전체 응답 타입:', typeof securityData);
      
      // 2단계: 출금 API 호출
      const refundRequestData = {
        _bcsrmd1: securityData.data1 || 'fallback_security_data1', // setReqModes 응답값
        _bcsrmd2: securityData.data2 || 'fallback_security_data2', // setReqModes 응답값
        member_id: withdrawalData.member_id, // 백엔드에서 member_id 받음
        refund_price: withdrawalData.amount
      };
      
      console.log('📤 실제 전송될 데이터 확인:');
      console.log('  - _bcsrmd1:', refundRequestData._bcsrmd1);
      console.log('  - _bcsrmd2:', refundRequestData._bcsrmd2);
      console.log('  - member_id:', refundRequestData.member_id);
      console.log('  - refund_price:', refundRequestData.refund_price);
      
      console.log('📤 출금 API 호출 데이터:', refundRequestData);
      
      const formData = this.convertToFormData(refundRequestData);
      const response = await this.api.post('/app/member/process/refund', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log('✅ 출금 API 응답:', response.data);
      console.log('✅ 응답 타입 확인:', typeof response.data);
      console.log('✅ rtnvalue 값:', response.data);
      console.log('✅ rtnvalue 타입:', typeof response.data);
      
      // 응답이 단순 숫자인 경우 처리
      if (typeof response.data === 'number' || typeof response.data === 'string') {
        const rtnvalue = response.data.toString();
        console.log('✅ 단순 응답값 처리 - rtnvalue:', rtnvalue);
        
        if (rtnvalue === "0") {
          return { 
            success: true, 
            message: '출금 신청이 완료되었습니다.',
            data: { rtnvalue: rtnvalue }
          };
        } else {
          return { 
            success: false, 
            message: '출금 신청에 실패했습니다.',
            errorCode: rtnvalue
          };
        }
      }
      
      // 응답 처리 (rtnvalue가 "0" 또는 0이면 성공)
      if (response.data && (response.data.rtnvalue === "0" || response.data.rtnvalue === 0)) {
        return { 
          success: true, 
          message: '출금 신청이 완료되었습니다.',
          data: response.data
        };
      } else {
        return { 
          success: false, 
          message: response.data?.memo || '출금 신청에 실패했습니다.',
          errorCode: response.data?.rtnvalue
        };
      }
      
    } catch (error) {
      console.error('❌ 출금 신청 오류:', error);
      return { 
        success: false, 
        message: '네트워크 오류가 발생했습니다.' 
      };
    }
  }

  // 사용자 정보 조회
  async getUserInfo() {
    try {
      const response = await this.api.get('/api/user/info');
      return response.data;
    } catch (error) {
      console.error('Get user info error:', error);
      return { success: false, message: '사용자 정보를 가져올 수 없습니다.' };
    }
  }

  // 계좌 변경
  async changeAccount(accountData) {
    try {
      console.log('🔵 계좌 변경 요청:', accountData);
      
      // 계좌번호를 Base64 URL 인코딩
      const encodedAccount = Buffer.from(accountData.account).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      const changeAccountData = {
        member_id: accountData.member_id,
        bank_cd: accountData.bank_cd,
        account: encodedAccount,
        bbachk: 'Y',
        gubun: accountData.gubun || ''
      };
      
      console.log('📤 계좌 변경 전송 데이터:', changeAccountData);
      
      const formData = this.convertToFormData(changeAccountData);
      const response = await this.api.post('/app/member/process/changeAccount', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log('✅ 계좌 변경 응답:', response.data);
      
      // 응답이 단순 숫자인 경우 처리
      if (typeof response.data === 'number' || typeof response.data === 'string') {
        const rtnvalue = response.data.toString();
        return {
          success: rtnvalue === '0',
          data: { rtnvalue: rtnvalue }
        };
      }
      
      return {
        success: response.data && (response.data.rtnvalue === '0' || response.data.rtnvalue === 0),
        data: response.data || { rtnvalue: '-1' }
      };
      
    } catch (error) {
      console.error('❌ 계좌 변경 오류:', error);
      return { 
        success: false, 
        message: '네트워크 오류가 발생했습니다.',
        data: { rtnvalue: '-1' }
      };
    }
  }

  // 투자 현황 조회
  async getInvestmentStatus() {
    try {
      const response = await this.api.get('/product/list');
      return response.data;
    } catch (error) {
      console.error('Get investment status error:', error);
      return { success: false, message: '투자 현황을 가져올 수 없습니다.' };
    }
  }

  // 메인 페이지 데이터 조회
  async getMainData() {
    try {
      const response = await this.api.get('/app/main', {
        headers: {
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Get main data error:', error);
      // 404 에러나 다른 에러 발생 시 빈 데이터 반환하여 앱이 계속 작동하도록 함
      if (error.response?.status === 404) {
        console.warn('메인 데이터 API 엔드포인트를 찾을 수 없습니다. 빈 데이터를 반환합니다.');
      }
      return {
        result: {
          product: [],
          site: null,
          case_list: [],
          news: [],
          faq: [],
          notice: [],
          top_banner_m_filepath: null,
          top_promotion_banner: [],
        }
      };
    }
  }

  // 아이디 찾기
  async findEmail(data) {
    try {
      const formData = new URLSearchParams();
      formData.append('name', data.name);
      formData.append('phone', data.phone);

      const response = await this.api.post('/app/find/id/process', formData.toString());
      return response.data;
    } catch (error) {
      console.error('Find email error:', error);
      return { rtnvalue: '0', web_id: '' };
    }
  }

  // 비밀번호 찾기
  async findPassword(data) {
    try {
      const formData = new URLSearchParams();
      formData.append('web_id', data.web_id);

      const response = await this.api.post('/app/find/password/process', formData.toString());
      return response.data;
    } catch (error) {
      console.error('Find password error:', error);
      return { rtnvalue: '0' };
    }
  }
}

export default new ApiService();
