import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import Header from '../components/Header';

const MyHomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');

      if (!userData) {
        console.log('로그인 정보 없음');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      const loginCheck = await ApiService.checkLoginExpiration();
      if (loginCheck.expired) {
        console.log('세션 만료:', loginCheck.reason);
        await ApiService.clearLoginData();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      const currentUser = await ApiService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        console.log('사용자 정보 조회 실패');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
      Alert.alert('오류', '사용자 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
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
            style={styles.menuButton}
            onPress={handleWithdrawal}
          >
            <Text style={styles.menuButtonText}>출금 신청</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonSecondary]}
            onPress={() => {
              console.log('투자 현황');
            }}
          >
            <Text style={styles.menuButtonText}>투자 현황</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonSecondary]}
            onPress={() => {
              console.log('마이페이지');
            }}
          >
            <Text style={styles.menuButtonText}>마이페이지</Text>
          </TouchableOpacity>
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
    fontSize: 20,
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
  menuButtonSecondary: {
    backgroundColor: '#5AC8FA',
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyHomeScreen;

