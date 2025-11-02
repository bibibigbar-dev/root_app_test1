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

const MainScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // 세션 만료 확인
      const loginCheck = await ApiService.checkLoginExpiration();
      if (loginCheck.expired) {
        console.log('세션 만료:', loginCheck.reason);
        await ApiService.clearLoginData();
        navigation.replace('Login');
        return;
      }

      // 현재 사용자 정보 조회
      const currentUser = await ApiService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        // 로그인 정보가 없으면 로그인 화면으로 이동
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
      navigation.replace('Login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../assets/images/thumbnail_logo_en.jpg')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

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
          <TouchableOpacity style={styles.menuButton} onPress={handleWithdrawal}>
            <Text style={styles.menuButtonText}>출금 신청</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  logo: {
    width: 120,
    height: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: '#F5F5F5',
  },
  logoutText: {
    color: '#666666',
    fontSize: 14,
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
});

export default MainScreen;

