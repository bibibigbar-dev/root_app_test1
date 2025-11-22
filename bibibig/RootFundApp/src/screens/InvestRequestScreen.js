import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../components/Header';
import ApiService from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const InvestRequestScreen = ({ navigation, route }) => {
  const { orderKey, productData } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [prod, setProd] = useState(null);
  const [option, setOption] = useState(null);
  const [circleThumbnail, setCircleThumbnail] = useState([]);
  const [fileThumbnail, setFileThumbnail] = useState([]);
  const [investAmount, setInvestAmount] = useState('');
  const [availableBalance, setAvailableBalance] = useState(0);
  const [depositBalance, setDepositBalance] = useState(0);

  useEffect(() => {
    loadInvestData();
  }, []);

  const loadInvestData = async () => {
    try {
      setLoading(true);
      
      // 상품 정보 설정
      if (productData) {
        setProd(productData.prod);
        setOption(productData.option);
        setCircleThumbnail(productData.circle_thumbnail || []);
        setFileThumbnail(productData.file_thumbnail || []);
      }

      // 사용자 예치금 정보 조회
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        // TODO: API로 예치금 정보 조회
        setAvailableBalance(0);
        setDepositBalance(0);
      }
    } catch (error) {
      console.error('투자 정보 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (text) => {
    const numOnly = text.replace(/[^0-9]/g, '');
    setInvestAmount(numOnly);
  };

  const handleInvestSubmit = () => {
    if (!investAmount || Number(investAmount) === 0) {
      Alert.alert('알림', '투자 금액을 입력해주세요.');
      return;
    }

    // TODO: 투자 신청 API 호출
    Alert.alert('알림', '투자 신청 기능은 준비 중입니다.');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title="투자하기" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3db8" />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </View>
    );
  }

  if (!prod) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title="투자하기" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>상품 정보를 불러올 수 없습니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title="투자하기" />
      
      <ScrollView style={styles.content}>
        {/* 상품 정보 카드 */}
        <View style={styles.blBox}>
          <View style={styles.blBoxBefore} />
          <View style={styles.productItem}>
            <View style={styles.imgbox}>
              {circleThumbnail.length > 0 ? (
                <Image source={{ uri: circleThumbnail[0].filePath }} style={styles.img} resizeMode="cover" />
              ) : fileThumbnail.length > 0 ? (
                <Image source={{ uri: fileThumbnail[0].filePath }} style={styles.img} resizeMode="cover" />
              ) : (
                <Image source={require('../assets/images/re_bc5_custom.png')} style={styles.img} resizeMode="cover" />
              )}
            </View>
            
            <View style={styles.inbox}>
              <Text style={styles.prdNum}>{prod.orderType} {prod.orderNum}호</Text>
              <Text style={styles.prdName}>{prod.orderName}</Text>
              
              <View style={styles.progressGroup}>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={['#8FC5FF', '#5DA7FF', '#2C7FE8', '#2c3db8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressVal, { width: `${prod.percent}%` }]}
                  />
                </View>
                
                <View style={styles.progressInfo}>
                  <Text style={styles.totalText}>
                    <Text style={styles.totalEm}>{formatNumber(prod.investment)}원</Text>
                    {' / '}
                    {formatNumber(prod.price)}원
                  </Text>
                  <Text style={styles.pctText}>{prod.percent}%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 투자 정보 */}
        <View style={styles.subWhitebox}>
          <View style={styles.dlFlexlist}>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>연 수익률</Text>
              <Text style={styles.dd}>{prod.rate}%</Text>
            </View>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>투자기간</Text>
              <Text style={styles.dd}>{prod.period_text}개월</Text>
            </View>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>상환방식</Text>
              <Text style={styles.dd}>
                {prod.repay_type === '1' ? '원금균등상환' :
                 prod.repay_type === '2' ? '만기일시상환' :
                 prod.repay_type === '3' ? '원리금균등상환' : '-'}
              </Text>
            </View>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>최소 투자금액</Text>
              <Text style={styles.dd}>{formatNumber(prod.min_price)}원</Text>
            </View>
          </View>
        </View>

        {/* 예치금 카드 */}
        <View style={styles.bankCard}>
          <View style={styles.cntbox}>
            <Text style={styles.tit}>투자 가능 금액</Text>
            <View style={styles.cnt}>
              <Text style={styles.cntEm}>{formatNumber(availableBalance)}</Text>
              <Text>원</Text>
            </View>
          </View>
          <View style={styles.bankInfo}>
            <Text style={styles.bankInfoDt}>예치금</Text>
            <Text style={styles.bankInfoDd}>{formatNumber(depositBalance)}원</Text>
          </View>
        </View>

        {/* 투자 금액 입력 */}
        <View style={styles.bankAmount}>
          <Text style={styles.title}>투자 금액</Text>
          
          <View style={styles.dlAmount}>
            <View style={styles.dlAmountItem}>
              <Text style={styles.dlAmountDt}>최소 투자금액</Text>
              <Text style={styles.dlAmountDd}>{formatNumber(prod.min_price)}원</Text>
            </View>
            <View style={styles.dlAmountItem}>
              <Text style={styles.dlAmountDt}>최대 투자금액</Text>
              <Text style={styles.dlAmountDd}>{formatNumber(prod.max_price)}원</Text>
            </View>
          </View>

          <View style={styles.wrAmount}>
            <TextInput
              style={styles.inputAmount}
              placeholder="투자 금액을 입력하세요"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={formatNumber(investAmount)}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
            />
            <Text style={styles.txt}>원</Text>
          </View>
        </View>

        {/* 투자하기 버튼 */}
        <View style={styles.btnBox}>
          <TouchableOpacity 
            style={styles.btnStyle}
            onPress={handleInvestSubmit}
          >
            <Text style={styles.btnText}>투자하기</Text>
          </TouchableOpacity>
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
  // bl_box
  blBox: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  blBoxBefore: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: '#2c3db8',
    zIndex: 1,
  },
  productItem: {
    flexDirection: 'row',
    padding: 16,
  },
  imgbox: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 12,
  },
  img: {
    width: '100%',
    height: '100%',
  },
  inbox: {
    flex: 1,
  },
  prdNum: {
    color: '#666',
    fontSize: 12,
    lineHeight: 15.6,
    fontWeight: '400',
  },
  prdName: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 19.5,
    fontWeight: '600',
    color: '#333',
  },
  progressGroup: {
    marginTop: 8,
  },
  progressBar: {
    height: 5,
    backgroundColor: '#e0e1e2',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressVal: {
    height: '100%',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  totalText: {
    fontSize: 12,
    color: '#bfc3c7',
    fontWeight: '600',
  },
  totalEm: {
    color: '#393f44',
  },
  pctText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#393f44',
  },
  // sub_whitebox
  subWhitebox: {
    position: 'relative',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 0,
    elevation: 1,
  },
  dlFlexlist: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
  dlItem: {
    width: '50%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dt: {
    color: '#666',
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
  },
  dd: {
    marginTop: 6,
    fontSize: 18,
    lineHeight: 23.4,
    fontWeight: '600',
    color: '#333',
  },
  // bank_card
  bankCard: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 40,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  cntbox: {
    padding: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#2c3db8',
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  tit: {
    color: '#393f44',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  cnt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    color: '#393f44',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  cntEm: {
    marginRight: 2,
    fontSize: 30,
    fontWeight: '700',
    color: '#393f44',
  },
  bankInfo: {
    position: 'relative',
    padding: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#2c3db8',
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#f8faff',
  },
  bankInfoDt: {
    marginBottom: 12,
    color: '#666',
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '400',
  },
  bankInfoDd: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    color: '#333',
  },
  // bank_amount
  bankAmount: {
    marginHorizontal: 16,
    marginTop: 34,
    padding: 20,
    paddingBottom: 30,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  },
  dlAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
  dlAmountItem: {
    color: '#fff',
  },
  dlAmountDt: {
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
    color: '#fff',
  },
  dlAmountDd: {
    fontSize: 23,
    lineHeight: 29.9,
    fontWeight: '600',
    color: '#fff',
  },
  wrAmount: {
    position: 'relative',
    marginTop: 24,
  },
  inputAmount: {
    width: '100%',
    height: 38,
    paddingRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: 16,
    lineHeight: 36,
    fontWeight: '600',
  },
  txt: {
    position: 'absolute',
    top: 0,
    right: 0,
    color: '#fff',
    fontSize: 20,
    lineHeight: 36,
    fontWeight: '500',
  },
  // 버튼
  btnBox: {
    marginTop: 40,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  btnStyle: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default InvestRequestScreen;

