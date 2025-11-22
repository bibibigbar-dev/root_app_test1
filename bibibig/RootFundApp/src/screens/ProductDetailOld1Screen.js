import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Clipboard,
  Alert,
} from 'react-native';
import Header from '../components/Header';
import ApiService from '../services/api';

const ProductDetailOld1Screen = ({ navigation, route }) => {
  const { orderKey } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);

  useEffect(() => {
    if (orderKey) {
      loadProductDetail();
    }
  }, [orderKey]);

  const loadProductDetail = async () => {
    try {
      setLoading(true);
      console.log('📦 상품 상세 조회 시작 (Old1) - orderKey:', orderKey);
      
      const response = await ApiService.api.get(`/app/product/detail/${orderKey}`);
      
      console.log('✅ 상품 상세 응답:', response.data);
      
      if (response.data) {
        setProductData(response.data);
      }
    } catch (error) {
      console.error('❌ 상품 상세 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareUrl = () => {
    const url = `https://rootenergy.co.kr/product/detail/${orderKey}`;
    Clipboard.setString(url);
    Alert.alert('알림', 'URL이 복사되었습니다.');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title="상품 상세" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3db8" />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </View>
    );
  }

  if (!productData) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title="상품 상세" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>상품 정보를 불러올 수 없습니다.</Text>
        </View>
      </View>
    );
  }

  const { prod } = productData;

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title="상품 상세" />
      
      {/* Back 버튼과 공유 버튼 */}
      <View style={styles.topButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShareUrl}
        >
          <Image 
            source={require('../assets/images/ico_share_m.png')}
            style={styles.shareIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.tempContainer}>
          <Text style={styles.tempTitle}>ProductDetailOld1Screen</Text>
          <Text style={styles.tempSubtitle}>idx: 310 ~ 415</Text>
          <Text style={styles.tempText}>상품명: {prod?.orderName}</Text>
          <Text style={styles.tempText}>orderKey: {orderKey}</Text>
          <Text style={styles.tempText}>idx: {prod?.idx}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  // Top 버튼 스타일
  topButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F5F7FA',
  },
  backButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
    fontWeight: '300',
  },
  shareButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    width: 24,
    height: 24,
  },
  tempContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  tempTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  tempSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 40,
  },
  tempText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

export default ProductDetailOld1Screen;

