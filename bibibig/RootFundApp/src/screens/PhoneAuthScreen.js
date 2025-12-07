import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import ApiService from '../services/api';

const PhoneAuthScreen = ({ navigation, route }) => {
  const { authType, webId, onAuthSuccess } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [authUrl, setAuthUrl] = useState(null);
  const [error, setError] = useState(null);
  const webViewRef = useRef(null);

  // 개발 모드 플래그 (테스트용)
  const DEV_MODE = __DEV__; // React Native의 개발 모드 체크
  const USE_MOCK_AUTH = false; // true로 설정하면 Mock 데이터 사용

  useEffect(() => {
    if (USE_MOCK_AUTH && DEV_MODE) {
      // Mock 인증 데이터로 바로 성공 처리
      setTimeout(() => {
        handleMockAuth();
      }, 1500);
    } else {
      initPhoneAuth();
    }
  }, []);

  // Mock 인증 처리 (개발/테스트용)
  const handleMockAuth = () => {
    console.log('🧪 Mock 인증 사용 (개발 모드)');
    
    Alert.alert(
      '개발 모드',
      'Mock 인증 데이터를 사용합니다. 실제 인증을 건너뜁니다.',
      [
        {
          text: '취소',
          style: 'cancel',
          onPress: () => navigation.goBack(),
        },
        {
          text: '인증 성공 시뮬레이션',
          onPress: () => {
            const mockAuthData = {
              type: 'authResult',
              rtnvalue: '0',
              rtnmessage: '인증 성공 (Mock)',
              authType: 'M',
              name: '홍길동',
              birthDate: '19900101',
              gender: 'M',
              mobile: '01012345678',
              nationalInfo: '0',
              di: 'mock_di_' + Date.now(),
              ci: 'mock_ci_' + Date.now(),
            };
            
            console.log('🧪 Mock 인증 완료:', mockAuthData);
            
            if (onAuthSuccess) {
              onAuthSuccess(mockAuthData);
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  // 백엔드에서 본인인증 URL 받아오기
  const initPhoneAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📱 본인인증 초기화:', { authType, webId });

      // 백엔드에서 KCB 본인인증 정보 요청
      const response = await ApiService.api.get('/app/find/password');

      console.log('📱 본인인증 초기화 응답:', response.data);

      if (response.data && response.data.okname) {
        const okname = response.data.okname;
        
        // okname 검증
        if (okname.okname === 'Y' && okname.okname_url) {
          // 본인인증 URL로 POST 요청을 위한 form data 준비
          const formData = {
            tc: 'kcb.oknm.online.safehscert.popup.cmd.P931_CertChoiceCmd',
            cp_cd: okname.cp_cd,
            mdl_tkn: okname.token,
          };
          
          // POST 요청을 위한 HTML form 생성
          const formHtml = createFormHtml(okname.okname_url, formData);
          setAuthUrl(formHtml);
        } else {
          throw new Error(okname.rslt_msg || '본인인증 정보를 가져올 수 없습니다.');
        }
      } else {
        throw new Error('본인인증 URL을 받아올 수 없습니다.');
      }
    } catch (error) {
      console.error('❌ 본인인증 초기화 오류:', error);
      const errorMessage = error.response?.data?.message || error.message || '본인인증 서비스를 불러올 수 없습니다.';
      setError(errorMessage);
      Alert.alert(
        '본인인증 오류',
        errorMessage + '\n잠시 후 다시 시도해주세요.',
        [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // POST 요청을 위한 HTML form 생성
  const createFormHtml = (url, formData) => {
    const formFields = Object.entries(formData)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}" />`)
      .join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <form id="authForm" method="post" action="${url}">
          ${formFields}
        </form>
        <script>
          document.getElementById('authForm').submit();
        </script>
      </body>
      </html>
    `;
  };

  const handleNavigationStateChange = (navState) => {
    console.log('📱 WebView URL:', navState.url);

    // 인증 완료 후 콜백 URL 감지
    if (navState.url.includes('openkc') || navState.url.includes('P931_Result')) {
      console.log('📱 KCB 인증 결과 페이지 감지');
      
      // URL에서 파라미터 추출 시도
      try {
        const urlParams = new URLSearchParams(navState.url.split('?')[1]);
        
        // 인증 결과 파라미터 추출
        const rtnvalue = urlParams.get('rtnvalue') || urlParams.get('result') || '1';
        
        if (rtnvalue === '0') {
          const authData = {
            rtnvalue: '0',
            rtnmessage: urlParams.get('rtnmessage') || '인증 성공',
            authType: urlParams.get('authType') || 'M',
            name: urlParams.get('name') || '',
            birthDate: urlParams.get('birthDate') || urlParams.get('birth') || '',
            gender: urlParams.get('gender') || urlParams.get('sex') || '',
            mobile: urlParams.get('mobile') || urlParams.get('phone') || '',
            nationalInfo: urlParams.get('nationalInfo') || urlParams.get('nation') || '',
            di: urlParams.get('di') || '',
            ci: urlParams.get('ci') || '',
          };

          console.log('✅ 인증 완료 데이터:', authData);

          // 성공 콜백 호출
          if (onAuthSuccess) {
            onAuthSuccess(authData);
          }

          // 화면 닫기
          navigation.goBack();
        } else {
          console.log('❌ 인증 실패:', rtnvalue);
        }
      } catch (e) {
        console.error('URL 파라미터 파싱 오류:', e);
      }
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 WebView Message:', data);

      if (data.type === 'authResult') {
        // fnKCBOkNameProcess 호출 결과
        console.log('✅ KCB 인증 결과 수신:', data);
        
        // rtnvalue가 "0"이면 성공
        if (data.rtnvalue === '0') {
          // 성공 콜백 호출
          if (onAuthSuccess) {
            onAuthSuccess(data);
          }
          // 이전 화면으로 복귀
          navigation.goBack();
        } else {
          // 인증 실패
          Alert.alert('휴대전화 본인인증', data.rtnmessage || '인증에 실패했습니다.', [
            {
              text: '확인',
              onPress: () => navigation.goBack(),
            },
          ]);
        }
      } else if (data.type === 'authComplete') {
        // 메시지로 인증 데이터 전달받는 경우
        if (onAuthSuccess) {
          onAuthSuccess(data.authData || data);
        }
        navigation.goBack();
      } else if (data.type === 'authCancel') {
        // 인증 취소
        Alert.alert('알림', '본인인증이 취소되었습니다.', [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      // JSON 파싱 실패 시 문자열로 처리
      console.log('📨 WebView Message (raw):', event.nativeEvent.data);
    }
  };

  const injectedJavaScript = `
    (function() {
      console.log('🔧 PhoneAuth injected script loaded');
      
      // 원본 함수 백업
      var originalFnKCBOkNameProcess = window.fnKCBOkNameProcess;
      
      // fnKCBOkNameProcess 함수 오버라이드 (웹에서 호출하는 함수)
      window.fnKCBOkNameProcess = function(rtnvalue, rtnmessage, authtype, name, birthdate, gender, mobile, nationalInfo, di, ci) {
        console.log('✅ fnKCBOkNameProcess 호출됨:', {
          rtnvalue, rtnmessage, authtype, name, birthdate, gender, mobile, nationalInfo, di, ci
        });
        
        const authData = {
          type: 'authResult',
          rtnvalue: String(rtnvalue),
          rtnmessage: String(rtnmessage || ''),
          authType: String(authtype || 'M'),
          name: String(name || ''),
          birthDate: String(birthdate || ''),
          gender: String(gender || ''),
          mobile: String(mobile || ''),
          nationalInfo: String(nationalInfo || ''),
          di: String(di || ''),
          ci: String(ci || '')
        };
        
        console.log('📤 React Native로 전송:', authData);
        
        // React Native로 데이터 전송
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(authData));
        }
        
        // 원본 함수도 호출 (있다면)
        if (originalFnKCBOkNameProcess && typeof originalFnKCBOkNameProcess === 'function') {
          originalFnKCBOkNameProcess.apply(this, arguments);
        }
      };

      // opener가 없는 경우를 대비한 설정
      if (!window.opener) {
        window.opener = {
          fnKCBOkNameProcess: window.fnKCBOkNameProcess
        };
      } else if (window.opener && !window.opener.fnKCBOkNameProcess) {
        window.opener.fnKCBOkNameProcess = window.fnKCBOkNameProcess;
      }

      // window.open 오버라이드 (팝업 방지)
      const originalOpen = window.open;
      window.open = function(url, name, specs) {
        console.log('🔗 window.open 호출:', url);
        
        // 팝업으로 열리는 URL을 현재 창에서 처리
        if (url && url !== 'about:blank') {
          // KCB 관련 URL은 현재 창에서 열기
          if (url.includes('kcb') || url.includes('cert') || url.includes('auth')) {
            window.location.href = url;
            return window;
          }
        }
        
        return originalOpen.call(window, url, name, specs);
      };

      // 메시지 리스너
      window.addEventListener('message', function(event) {
        console.log('📬 Message received:', event.data);
        
        if (event.data && event.data.type === 'authComplete') {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
          }
        }
      });

      console.log('✅ PhoneAuth script setup complete');
      console.log('- window.fnKCBOkNameProcess:', typeof window.fnKCBOkNameProcess);
      console.log('- window.opener:', !!window.opener);
      console.log('- window.ReactNativeWebView:', !!window.ReactNativeWebView);
    })();
    true;
  `;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>휴대전화 본인인증</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            Alert.alert(
              '본인인증 취소',
              '본인인증을 취소하시겠습니까?',
              [
                { text: '아니오', style: 'cancel' },
                { text: '예', onPress: () => navigation.goBack() },
              ]
            );
          }}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* 에러 표시 */}
      {error && !authUrl && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={initPhoneAuth}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView */}
      {authUrl && !error && (
        <WebView
          ref={webViewRef}
          source={{ html: authUrl }}
          originWhitelist={['*']}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleWebViewMessage}
          injectedJavaScript={injectedJavaScript}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView 오류:', nativeEvent);
            setError('페이지를 불러올 수 없습니다.');
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
        />
      )}

      {/* 로딩 인디케이터 */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3db8" />
          <Text style={styles.loadingText}>
            {authUrl ? '본인인증 화면을 불러오는 중...' : '준비 중...'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    backgroundColor: '#fff',
    position: 'relative',
    marginTop: 50,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 18,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 28,
    color: '#222',
    fontWeight: '300',
  },
  placeholder: {
    width: 40,
  },
  webview: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2c3db8',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
});

export default PhoneAuthScreen;

