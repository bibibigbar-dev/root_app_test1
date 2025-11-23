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
const width = Dimensions.get('window').width;

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
  const [currentSlide, setCurrentSlide] = useState(0);

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
          <View style={styles.productItem}>
            <View style={styles.productImgbox}>
              {circleThumbnail.length > 0 ? (
                <Image source={{ uri: circleThumbnail[0].filePath }} style={styles.productImg} resizeMode="cover" />
              ) : fileThumbnail.length > 0 ? (
                <Image source={{ uri: fileThumbnail[0].filePath }} style={styles.productImg} resizeMode="cover" />
              ) : (
                <Image source={require('../assets/images/re_bc5_custom.png')} style={styles.productImg} resizeMode="cover" />
              )}
              <Image 
                source={
                  prod.orderType === '태양광' ? require('../assets/images/img_product01_s.png') :
                  prod.orderType === '풍력' ? require('../assets/images/img_product02_s.png') :
                  prod.orderType === 'ESS' ? require('../assets/images/img_product04_s.png') :
                  prod.orderType === '전기차충전소' ? require('../assets/images/img_product03_s.png') :
                  require('../assets/images/img_product01_s.png')
                }
                style={styles.productSImg}
                resizeMode="contain"
              />
            </View>
            
            <View style={styles.productTxtbox}>
              <Text style={styles.productNum}>{prod.orderType} {prod.orderNum}호</Text>
              <Text style={styles.productName}>{prod.orderName}</Text>
              <Text style={styles.productDate}>
                모집기간 {prod.start_date}({prod.start_week}) ~ {prod.end_date}({prod.end_week})
              </Text>
            </View>
          </View>
        </View>

        {/* 투자 정보 */}
        <View style={styles.subWhitebox}>
          <View style={styles.dlFlexlist}>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>연 수익률</Text>
              <Text style={styles.dd}><Text style={styles.ddStrong}>{prod.rate}%</Text></Text>
            </View>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>투자기간</Text>
              <Text style={styles.dd}><Text style={styles.ddStrong}>{prod.period_text}개월</Text></Text>
            </View>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>상품번호</Text>
              <Text style={styles.dd}><Text style={styles.ddStrong}>{prod.orderNumber}</Text></Text>
            </View>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>상환방식</Text>
              <Text style={styles.dd}>
                <Text style={styles.ddStrong}>
                  {prod.repay_type === '1' ? '원금균등상환' :
                   prod.repay_type === '2' ? '만기일시상환' :
                   prod.repay_type === '3' ? '원리금균등상환' : '-'}
                </Text>
              </Text>
            </View>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>상품종류</Text>
              <Text style={styles.dd}><Text style={styles.ddStrong}>{prod.orderType}</Text></Text>
            </View>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>자금용도</Text>
              <Text style={styles.dd}>
                <Text style={styles.ddStrong}>
                  {(prod.sort === 'bridge' || prod.sort === 'innovation') ? '건설자금' : '운영 자금'}
                </Text>
              </Text>
            </View>
          </View>
          
          {/* 투자 진행률 */}
          <View style={styles.progressGroup}>
            <Text style={styles.txtStit}>투자 진행률</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressVal, { width: `${prod.percent}%` }]} />
              <View style={styles.progressTip}>
                <Text style={styles.progressTipText}>모집 잔액 {formatNumber(prod.left_price)}원</Text>
              </View>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTotal}>
                <Text style={styles.progressTotalEm}>{formatNumber(prod.investment)}원</Text>
                <Text style={styles.progressTotalGray}> / {formatNumber(prod.price)}원</Text>
              </Text>
              <Text style={styles.progressPct}>{prod.percent}%</Text>
            </View>
          </View>
        </View>

        {/* 투자 방법 슬라이더 */}
        <View style={styles.invMethodSwiper}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slideIndex = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
              setCurrentSlide(slideIndex);
            }}
            scrollEventThrottle={16}
          >
            {/* 슬라이드 1 */}
            <View style={[styles.swiperSlide, { width: width - 32 }]}>
              <View style={styles.inbox}>
                <View style={styles.imgbox}>
                  <Image 
                    source={require('../assets/images/re_bc5_custom.png')} 
                    style={styles.methodImg}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.txtbox}>
                  <Text style={styles.methodTit}>개인전용{'\n'}가상계좌번호 확인</Text>
                  <Text style={styles.methodTxt}>아래 가상계좌번호를{'\n'}확인해주세요</Text>
                </View>
              </View>
            </View>

            {/* 슬라이드 2 */}
            <View style={[styles.swiperSlide, { width: width - 32 }]}>
              <View style={styles.inbox}>
                <View style={styles.imgbox}>
                  <Image 
                    source={require('../assets/images/re_bc5_custom.png')} 
                    style={styles.methodImg}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.txtbox}>
                  <Text style={styles.methodTit}>예치금 입금</Text>
                  <Text style={styles.methodTxt}>*가입 시 등록한{'\n'}출금계좌에서만 입금가능</Text>
                </View>
              </View>
            </View>

            {/* 슬라이드 3 */}
            <View style={[styles.swiperSlide, { width: width - 32 }]}>
              <View style={styles.inbox}>
                <View style={styles.imgbox}>
                  <Image 
                    source={require('../assets/images/re_bc5_custom.png')} 
                    style={styles.methodImg}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.txtbox}>
                  <Text style={styles.methodTit}>투자 준비 완료</Text>
                  <Text style={styles.methodTxt}>이제 마음껏 투자하세요!</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Pagination */}
          <View style={styles.swiperPagination}>
            <View style={[styles.paginationBullet, currentSlide === 0 && styles.paginationBulletActive]} />
            <View style={[styles.paginationBullet, currentSlide === 1 && styles.paginationBulletActive]} />
            <View style={[styles.paginationBullet, currentSlide === 2 && styles.paginationBulletActive]} />
          </View>
        </View>

        {/* 예치금 카드 */}
        <View style={styles.bankCard}>
          <View style={styles.cntbox}>
            <Text style={styles.cardTit}>투자 가능 금액</Text>
            <View style={styles.cnt}>
              <Text style={styles.cntEm}>{formatNumber(availableBalance)}</Text>
              <Text style={styles.cntTxt}>원</Text>
            </View>
          </View>
          <View style={styles.bankInfo}>
            <View style={styles.bankInfoDl}>
              <Text style={styles.bankInfoDt}>예치금</Text>
              <Text style={styles.bankInfoDd}>{formatNumber(depositBalance)}원</Text>
            </View>
          </View>
        </View>

        {/* 투자 금액 입력 */}
        <View style={styles.bankAmount}>
          <Text style={styles.amountTitle}>투자 금액</Text>
          
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
            <Text style={styles.amountTxt}>원</Text>
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
    marginTop: 16,
  },
  productItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  productImgbox: {
    flex: 0,
    position: 'relative',
    marginRight: 16,
  },
  productImg: {
    width: 47,
    height: 47,
    borderRadius: 47 / 2,
  },
  productSImg: {
    position: 'absolute',
    right: -6,
    bottom: -5,
    width: 22,
    height: 24,
  },
  productTxtbox: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  productNum: {
    color: '#393f44',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  productName: {
    marginTop: 4,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#222',
  },
  productDate: {
    marginTop: 6,
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
  },
  // sub_whitebox
  subWhitebox: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    backgroundColor: '#fff',
    shadowColor: 'rgba(224, 225, 226, 0.50)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    elevation: 1,
  },
  // dl_flexlist
  dlFlexlist: {
    display: 'flex',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
  dlItem: {
    width: '50%',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  dt: {
    color: '#666',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
  },
  dd: {
    marginTop: 6,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: '#222',
  },
  ddStrong: {
    fontWeight: '600',
  },
  // progress_group
  progressGroup: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  txtStit: {
    marginBottom: 10,
    color: '#666',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
  },
  progressBar: {
    position: 'relative',
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e0e1e2',
    overflow: 'hidden',
  },
  progressVal: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#495ad8',
  },
  progressTip: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: '#197cff',
    backgroundColor: '#197cff',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
    borderRadius: 5,
  },
  progressTipText: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
  },
  progressInfo: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressTotal: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  progressTotalEm: {
    color: '#393f44',
  },
  progressTotalGray: {
    color: '#bfc3c7',
  },
  progressPct: {
    flex: 0,
    color: '#393f44',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  // inv_method_swiper
  invMethodSwiper: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 25,
    overflow: 'hidden',
  },
  swiperSlide: {
    height: 'auto',
  },
  inbox: {
    position: 'relative',
    height: '100%',
  },
  imgbox: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: 'rgba(104, 111, 115, 0.15)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  methodImg: {
    width: '100%',
    height: undefined,
    aspectRatio: 335 / 160,
  },
  txtbox: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    padding: 24,
    paddingHorizontal: 20,
  },
  methodTit: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: '#222',
  },
  methodTxt: {
    marginTop: 4,
    color: '#393f44',
    fontSize: 15,
    lineHeight: 22.5,
    fontWeight: '600',
  },
  swiperPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  paginationBullet: {
    width: 5,
    height: 5,
    marginHorizontal: 2,
    borderRadius: 2.5,
    backgroundColor: '#aab1bc',
  },
  paginationBulletActive: {
    width: 16,
    backgroundColor: '#2c3db8',
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
    shadowColor: 'rgba(104, 111, 115, 0.15)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  cntbox: {
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#2c3db8',
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cardTit: {
    color: '#393f44',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  cnt: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  cntEm: {
    marginRight: 2,
    fontSize: 30,
    lineHeight: 42,
    fontWeight: '700',
    color: '#393f44',
  },
  cntTxt: {
    color: '#393f44',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  bankInfo: {
    position: 'relative',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#2c3db8',
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#f8faff',
  },
  bankInfoDl: {
    display: 'flex',
  },
  bankInfoDt: {
    marginBottom: 12,
    color: '#666',
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '400',
  },
  bankInfoDd: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    color: '#333',
  },
  // bank_amount
  bankAmount: {
    marginHorizontal: 16,
    marginTop: 34,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
  },
  amountTitle: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  },
  dlAmount: {
    display: 'flex',
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
    borderWidth: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: 16,
    lineHeight: 36,
    fontWeight: '600',
  },
  amountTxt: {
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

