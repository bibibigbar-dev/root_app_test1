import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import Header from '../components/Header';

const MainScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // 먼저 로그인 정보가 있는지 확인
      const userData = await AsyncStorage.getItem('userData');
      
      // 로그인 정보가 없으면 Skip 모드로 진행
      if (!userData) {
        console.log('로그인 정보 없음 - Skip 모드로 진행');
        setUser(null);
        setLoading(false);
        return;
      }

      // 로그인 정보가 있을 때만 세션 만료 확인
      const loginCheck = await ApiService.checkLoginExpiration();
      if (loginCheck.expired) {
        console.log('세션 만료:', loginCheck.reason);
        await ApiService.clearLoginData();
        // 세션 만료 시에만 로그인 화면으로 이동
        navigation.replace('Login');
        return;
      }

      // 현재 사용자 정보 조회
      const currentUser = await ApiService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        // 로그인 정보가 없어도 Skip 모드를 허용 (화면 유지)
        console.log('사용자 정보 조회 실패 - Skip 모드로 진행');
        setUser(null);
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
      // 에러 발생 시에도 Skip 모드 허용
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (user) {
        await ApiService.logout();
      } else {
        // Skip 모드에서 로그아웃 시 로그인 화면으로 이동
        await ApiService.clearLoginData();
      }
      navigation.replace('Login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      await ApiService.clearLoginData();
      navigation.replace('Login');
    }
  };

  const handleWithdrawal = () => {
    navigation.navigate('Withdrawal');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} user={user} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.userInfo}>
          <Text style={styles.welcomeText}>
            안녕하세요, {user?.session?.r_name || user?.name || '사용자'}님
          </Text>
          <Text style={styles.userInfoText}>
            출금 가능한 금액: {user?.session?.balance ? formatCurrency(user.session.balance) : '0'}원
          </Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={[styles.menuButton, !user && styles.menuButtonDisabled]} 
            onPress={handleWithdrawal}
            disabled={!user}
          >
            <Text style={styles.menuButtonText}>출금 신청</Text>
          </TouchableOpacity>
          {!user && (
            <Text style={styles.skipNoticeText}>
              로그인 후 출금 신청이 가능합니다.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const formatCurrency = (value) => {
  const stringValue = typeof value === 'string' ? value : String(value || '0');
  const numericValue = stringValue.replace(/[^0-9]/g, '');
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  content: {
    flex: 1,
  },
  userInfo: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  userInfoText: {
    fontSize: 16,
    color: '#333333',
  },
  menuContainer: {
    padding: 20,
  },
  menuButton: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  skipNoticeText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default MainScreen;

