import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotificationService from '../services/pushNotification';
import ApiService from '../services/api';
import { API_BASE_URL } from '../config/api';

const PushTestScreen = ({ navigation }) => {
  const [fcmToken, setFcmToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [testTitle, setTestTitle] = useState('테스트 알림');
  const [testBody, setTestBody] = useState('푸시 알림이 정상 작동합니다!');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadFCMToken();
    loadNotifications();
  }, []);

  const loadFCMToken = async () => {
    try {
      // AsyncStorage에서 토큰 가져오기
      const token = await AsyncStorage.getItem('fcmToken');
      if (token) {
        setFcmToken(token);
        return;
      }
      
      // PushNotificationService에서 가져오기
      const serviceToken = PushNotificationService.getToken();
      if (serviceToken) {
        setFcmToken(serviceToken);
        return;
      }
      
      // 토큰이 없으면 테스트용 Mock 토큰 생성 (개발 환경)
      if (__DEV__) {
        const mockToken = `TEST_FCM_TOKEN_${Platform.OS}_${Date.now()}`;
        console.log('🧪 테스트용 Mock FCM 토큰 생성:', mockToken);
        setFcmToken(mockToken);
        await AsyncStorage.setItem('fcmToken', mockToken);
      }
    } catch (error) {
      console.error('FCM 토큰 로드 오류:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const list = await PushNotificationService.getNotifications();
      setNotifications(list);
      const count = await PushNotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('알림 목록 로드 오류:', error);
    }
  };

  const handleCopyToken = () => {
    if (fcmToken) {
      Clipboard.setString(fcmToken);
      Alert.alert('복사 완료', 'FCM 토큰이 클립보드에 복사되었습니다.');
    } else {
      Alert.alert('오류', 'FCM 토큰이 없습니다.');
    }
  };

  const handleReinitialize = async () => {
    setLoading(true);
    try {
      const success = await PushNotificationService.initialize();
      if (success) {
        Alert.alert('성공', '푸시 알림 초기화 완료');
        await loadFCMToken();
      } else {
        Alert.alert('실패', '푸시 알림 초기화 실패. 콘솔을 확인하세요.');
      }
    } catch (error) {
      Alert.alert('오류', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 백엔드 DB 연결 테스트
  const handleTestDbConnection = async () => {
    setLoading(true);
    try {
      console.log('📤 DB 연결 테스트 요청');
      const response = await fetch(`${API_BASE_URL}/admin/fcm/db`);
      console.log('📥 응답 상태:', response.status);
      const result = await response.json();
      console.log('📥 응답 데이터:', result);
      
      if (result.success === true || result.rtnValue === '1') {
        Alert.alert(
          '✅ DB 연결 성공!',
          `데이터베이스: ${result.database}\nURL: ${result.url}\n사용자: ${result.username}`
        );
      } else {
        Alert.alert('❌ DB 연결 실패', result.message || result.errorMsg);
      }
    } catch (error) {
      Alert.alert('오류', `DB 연결 테스트 실패: ${error.message}`);
      console.error('❌ DB 연결 테스트 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // FCM 토큰 DB 저장 테스트
  const handleSaveFcmTokenToDb = async () => {
    if (!fcmToken) {
      Alert.alert('오류', 'FCM 토큰이 없습니다.');
      return;
    }

    setLoading(true);
    try {
      // 로그인된 사용자 정보 가져오기
      const currentUser = await ApiService.getCurrentUser();
      const memberId = currentUser?.session?.member_id || currentUser?.member_id;

      if (!memberId) {
        Alert.alert('오류', '로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      console.log('========================================');
      console.log('📤 FCM 토큰 DB 저장 요청 (User API)');
      console.log('   - member_id:', memberId);
      console.log('   - device_type:', Platform.OS);
      console.log('   - fcm_token:', fcmToken.substring(0, 30) + '...');
      console.log('========================================');

      // ApiService를 사용하여 User API 호출
      const response = await ApiService.api.post('/api/fcm/register', 
        ApiService.convertToFormData({
          member_id: memberId,
          fcm_token: fcmToken,
          device_type: Platform.OS
        })
      );

      console.log('📥 응답 상태:', response.status);
      console.log('📥 응답 데이터:', response.data);
      
      const result = response.data;
      
      // 백엔드 응답 형식에 맞춰 확인 (rtnValue)
      if (result.rtnValue === '1') {
        Alert.alert('✅ 성공', 'FCM 토큰이 DB에 저장되었습니다!');
      } else {
        Alert.alert('❌ 실패', result.errorMsg || '알 수 없는 오류');
      }
    } catch (error) {
      Alert.alert('오류', `토큰 저장 실패: ${error.message}`);
      console.error('❌ 토큰 저장 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // FCM 토큰 DB 조회 테스트
  const handleGetFcmTokenFromDb = async () => {
    setLoading(true);
    try {
      // 로그인된 사용자 정보 가져오기
      const currentUser = await ApiService.getCurrentUser();
      const memberId = currentUser?.session?.member_id || currentUser?.member_id;

      if (!memberId) {
        Alert.alert('오류', '로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      console.log('========================================');
      console.log('📤 FCM 토큰 DB 조회 요청 (User API)');
      console.log('   - member_id:', memberId);
      console.log('========================================');
      
      // ApiService를 사용하여 User API 호출 (member_id를 파라미터로 전달)
      const response = await ApiService.api.get('/api/fcm/token', {
        params: { member_id: memberId }
      });
      
      console.log('📥 응답 상태:', response.status);
      console.log('📥 응답 데이터:', response.data);
      
      const result = response.data;
      
      if (result.rtnValue === '1') {
        Alert.alert(
          '✅ 토큰 조회 성공',
          `회원ID: ${result.member_id}\n디바이스: ${result.device_type}\n토큰: ${result.fcm_token?.substring(0, 30)}...\n업데이트: ${result.updated_at || '정보 없음'}`
        );
      } else {
        Alert.alert('⚠️ 조회 실패', result.errorMsg || '등록된 FCM 토큰이 없습니다.');
      }
    } catch (error) {
      Alert.alert('오류', `토큰 조회 실패: ${error.message}`);
      console.error('❌ 토큰 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 테스트 알림 전송
  const handleSendTestNotification = async () => {
    if (!fcmToken) {
      Alert.alert('오류', 'FCM 토큰이 없습니다.');
      return;
    }

    setLoading(true);
    try {
      const targetUrl = `${API_BASE_URL}/api/fcm/test/send`;
      
      console.log('========================================');
      console.log('📤 테스트 알림 전송 요청 (User API)');
      console.log('   - URL:', targetUrl);
      console.log('   - fcm_token:', fcmToken.substring(0, 30) + '...');
      console.log('   - title:', testTitle);
      console.log('   - body:', testBody);
      console.log('========================================');

      const formData = new URLSearchParams();
      formData.append('fcm_token', fcmToken);
      formData.append('title', testTitle);
      formData.append('body', testBody);

      console.log('📦 전송 데이터:', formData.toString());

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      console.log('📥 응답 상태:', response.status);
      console.log('📥 응답 Content-Type:', response.headers.get('content-type'));

      // 404 에러 처리
      if (response.status === 404) {
        Alert.alert(
          '❌ 404 오류', 
          `백엔드 엔드포인트를 찾을 수 없습니다.\n\nURL: ${targetUrl}\n\n백엔드에 해당 API가 구현되어 있는지 확인해주세요.`
        );
        return;
      }

      // JSON 파싱 시도
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
        console.log('📥 응답 데이터:', result);
      } else {
        const text = await response.text();
        console.log('📥 응답 텍스트:', text.substring(0, 200));
        Alert.alert('❌ 오류', `서버가 JSON이 아닌 응답을 반환했습니다.\n\n상태 코드: ${response.status}`);
        return;
      }

      if (result.success === true) {
        Alert.alert('✅ 성공', '테스트 알림이 전송되었습니다!\n\n잠시 후 알림을 확인하세요.');
      } else {
        Alert.alert('❌ 실패', result.message || '알 수 없는 오류');
      }
    } catch (error) {
      Alert.alert('오류', `알림 전송 실패: ${error.message}`);
      console.error('❌ 알림 전송 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // Firebase 초기화 상태 확인
  const handleTestFirebase = async () => {
    setLoading(true);
    try {
      console.log('📤 Firebase 초기화 상태 확인 요청');
      const response = await fetch(`${API_BASE_URL}/admin/fcm/firebase`);
      console.log('📥 응답 상태:', response.status);
      const result = await response.json();
      console.log('📥 응답 데이터:', result);
      
      if (result.success === true || result.rtnValue === '1') {
        Alert.alert(
          '✅ Firebase 초기화됨',
          `프로젝트 ID: ${result.project_id}\n이름: ${result.name}`
        );
      } else {
        Alert.alert('❌ Firebase 오류', result.message || result.errorMsg);
      }
    } catch (error) {
      Alert.alert('오류', `Firebase 확인 실패: ${error.message}`);
      console.error('❌ Firebase 확인 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadNotifications();
    Alert.alert('새로고침', '알림 목록을 새로고침했습니다.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>푸시 알림 테스트</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* FCM 토큰 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. FCM 토큰 확인</Text>
          <View style={styles.tokenContainer}>
            <Text style={styles.tokenLabel}>현재 토큰:</Text>
            <Text style={styles.tokenText} numberOfLines={3}>
              {fcmToken || '토큰이 없습니다'}
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleCopyToken}
              disabled={!fcmToken}
            >
              <Text style={styles.buttonText}>토큰 복사</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleReinitialize}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>재초기화</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 테스트 알림 발송 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 테스트 알림 전송</Text>
          <Text style={styles.infoText}>
            백엔드 User API를 통해 실제 푸시 알림을 전송합니다.{'\n'}
            FCM 토큰: {fcmToken ? `${fcmToken.substring(0, 30)}...` : '없음'}
          </Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>제목</Text>
            <TextInput
              style={styles.input}
              value={testTitle}
              onChangeText={setTestTitle}
              placeholder="알림 제목"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>내용</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={testBody}
              onChangeText={setTestBody}
              placeholder="알림 내용"
              multiline
              numberOfLines={3}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.button, 
              styles.buttonPrimary,
              (!fcmToken && !loading) && styles.buttonDisabled
            ]}
            onPress={handleSendTestNotification}
            disabled={loading || !fcmToken}
          >
            <Text style={styles.buttonTextPrimary}>
              {loading ? '전송 중...' : '테스트 알림 전송'} {!fcmToken && '(토큰 없음)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 알림 목록 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>3. 수신된 알림 ({notifications.length}개)</Text>
            <TouchableOpacity onPress={handleRefresh}>
              <Text style={styles.refreshText}>새로고침</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.unreadText}>안읽은 알림: {unreadCount}개</Text>
          
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>받은 알림이 없습니다</Text>
            </View>
          ) : (
            notifications.slice(0, 5).map((item, index) => (
              <View key={index} style={styles.notificationItem}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationBody} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={styles.notificationDate}>
                  {new Date(item.receivedAt).toLocaleString('ko-KR')}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* 백엔드 DB 연동 테스트 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 백엔드 DB 연동 테스트</Text>
          <Text style={styles.infoText}>
            백엔드 서버: {API_BASE_URL}{'\n'}
            ⚠️ 로그인된 사용자의 세션으로 테스트됩니다.
          </Text>
          
          <TouchableOpacity
            style={[styles.button, styles.buttonTest]}
            onPress={handleTestDbConnection}
            disabled={loading}
          >
            <Text style={styles.buttonText}>① DB 연결 테스트</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonTest]}
            onPress={handleTestFirebase}
            disabled={loading}
          >
            <Text style={styles.buttonText}>② Firebase 초기화 확인</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button, 
              styles.buttonTest,
              (!fcmToken && !loading) && styles.buttonDisabled
            ]}
            onPress={handleSaveFcmTokenToDb}
            disabled={loading || !fcmToken}
          >
            <Text style={styles.buttonText}>
              ③ FCM 토큰 DB 저장 {!fcmToken && '(토큰 없음)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonTest]}
            onPress={handleGetFcmTokenFromDb}
            disabled={loading}
          >
            <Text style={styles.buttonText}>④ FCM 토큰 DB 조회</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button, 
              styles.buttonPrimary,
              (!fcmToken && !loading) && styles.buttonDisabled
            ]}
            onPress={handleSendTestNotification}
            disabled={loading || !fcmToken}
          >
            <Text style={styles.buttonText}>
              ⑤ 테스트 알림 전송 {!fcmToken && '(토큰 없음)'}
            </Text>
          </TouchableOpacity>

          <View style={styles.guideBox}>
            <Text style={styles.guideText}>
              📋 테스트 순서:{'\n\n'}
              1️⃣ DB 연결 테스트 → MySQL 연결 확인{'\n'}
              2️⃣ Firebase 초기화 확인 → Firebase SDK 상태{'\n'}
              3️⃣ FCM 토큰 DB 저장 → User API로 저장{'\n'}
              4️⃣ FCM 토큰 DB 조회 → User API로 조회{'\n'}
              5️⃣ 테스트 알림 전송 → User API로 푸시 발송{'\n\n'}
              
              ⚠️ 주의:{'\n'}
              - 백엔드 서버가 실행 중이어야 합니다{'\n'}
              - 로그인된 상태에서 테스트해야 합니다{'\n'}
              - 시뮬레이터에서는 실제 푸시 수신이 안 될 수 있습니다
            </Text>
          </View>
        </View>

        {/* 권한 상태 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. 체크리스트</Text>
          <Text style={styles.checklistText}>
            ✅ react-native-vector-icons 설치됨{'\n'}
            ✅ Firebase 설정 파일 존재 (google-services.json, GoogleService-Info.plist){'\n'}
            ✅ PushNotificationService 초기화 활성화됨{'\n'}
            ✅ 백그라운드 메시지 핸들러 등록됨 (index.js){'\n\n'}
            
            📝 테스트 순서:{'\n'}
            1. 앱 실행 후 위의 "FCM 토큰 복사" 버튼 클릭{'\n'}
            2. 토큰을 백엔드 개발자에게 전달{'\n'}
            3. 백엔드에서 FCM API로 푸시 발송{'\n'}
            4. 앱에서 알림 수신 확인
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#2c3db8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },
  refreshText: {
    fontSize: 14,
    color: '#2c3db8',
    fontWeight: '600',
  },
  tokenContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tokenLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  tokenText: {
    fontSize: 12,
    color: '#222',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#666',
  },
  buttonPrimary: {
    backgroundColor: '#2c3db8',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  inputMultiline: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  unreadText: {
    fontSize: 14,
    color: '#2c3db8',
    fontWeight: '600',
    marginBottom: 12,
  },
  notificationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
  guideBox: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2c3db8',
  },
  guideText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  checklistText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  buttonTest: {
    backgroundColor: '#4caf50',
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
});

export default PushTestScreen;

