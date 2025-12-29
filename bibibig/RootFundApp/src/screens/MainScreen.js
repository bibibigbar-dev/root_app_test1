import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Linking,
  Modal,
  FlatList,
  Clipboard,
  Alert,
} from 'react-native';
import Swiper from 'react-native-swiper';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import PushNotificationService from '../services/pushNotification';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MainScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState(null);
  const [mainData, setMainData] = useState({
    products: [],
    siteStats: null,
    reviews: [],
    news: [],
    faq: [],
    notice: [],
    topBanner: null,
    topPromotionBanner: [],
    popup: [],
    popup_cnt: 0,
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentReviewSlide, setCurrentReviewSlide] = useState(0);
  const [currentNewsSlide, setCurrentNewsSlide] = useState(0);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [dontShowFor24Hours, setDontShowFor24Hours] = useState(false);
  const [filteredPopups, setFilteredPopups] = useState([]);
  const flatListRef = useRef(null);
  const reviewScrollRef = useRef(null);
  const newsScrollRef = useRef(null);

  useEffect(() => {
    loadUserData();
    loadMainData();
    loadFCMToken(); // 푸시 알림 초기화 활성화
  }, []);

  useEffect(() => {
    checkAndShowPopup();
  }, [mainData.popup, mainData.popup_cnt, user]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');

      if (!userData) {
        setUser(null);
        return;
      }

      const loginCheck = await ApiService.checkLoginExpiration();
      if (loginCheck.expired) {
        await ApiService.clearLoginData();
        return;
      }

      const currentUser = await ApiService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
      setUser(null);
    }
  };

  const loadFCMToken = async () => {
    try {
      if (__DEV__) {
        console.log('🔍 FCM 토큰 로드 시도...');
      }
      
      // 1. AsyncStorage에서 직접 토큰 가져오기
      const token = await AsyncStorage.getItem('fcmToken');
      if (__DEV__) {
        console.log('📦 AsyncStorage 토큰:', token ? `${token.substring(0, 30)}...` : '없음');
      }
      
      if (token) {
        setFcmToken(token);
        if (__DEV__) {
          console.log('✅ FCM 토큰 로드 성공 (AsyncStorage)');
        }
        return;
      }
      
      // 2. PushNotificationService 초기화 진행 상태 확인
      const initStatus =
        typeof PushNotificationService.getInitStatus === 'function'
          ? PushNotificationService.getInitStatus()
          : (PushNotificationService.isInitialized() ? 'ready' : 'initializing');

      if (__DEV__) {
        console.log('🔧 PushNotificationService initStatus:', initStatus);
      }

      // 초기화 시도가 끝나지 않았으면 잠깐 대기 후 재시도
      if (initStatus === 'idle' || initStatus === 'initializing') {
        if (__DEV__) {
          console.log('⏳ App.js의 초기화 완료 대기 중... 잠시만 기다려주세요');
        }
        setTimeout(loadFCMToken, 2000);
        return;
      }

      // 초기화가 실패한 경우: 무한 재시도하지 않음
      if (initStatus === 'failed') {
        if (__DEV__) {
          const err =
            typeof PushNotificationService.getInitError === 'function'
              ? PushNotificationService.getInitError()
              : null;
          console.log('⚠️ PushNotificationService 초기화 실패 상태입니다. 재시도를 중단합니다.', err?.message || '');
        }
        return;
      }
      
      // 3. PushNotificationService에서 토큰 가져오기
      const serviceToken = PushNotificationService.getToken();
      if (__DEV__) {
        console.log('🎯 Service 토큰:', serviceToken ? `${serviceToken.substring(0, 30)}...` : '없음');
      }
      
      if (serviceToken) {
        setFcmToken(serviceToken);
        if (__DEV__) {
          console.log('✅ FCM 토큰 로드 성공 (Service)');
        }
      } else {
        // initStatus가 ready인데도 토큰이 없으면(시뮬레이터/권한/설정) 무한 재시도하지 않음
        if (__DEV__) {
          console.log('⚠️ PushNotificationService는 ready지만 토큰이 없습니다. 재시도를 중단합니다.');
        }
      }
    } catch (error) {
      // 조용히 재시도 (개발 모드에서만 에러 로그)
      if (__DEV__) {
        console.error('❌ FCM 토큰 로드 오류:', error);
      }
      setTimeout(loadFCMToken, 5000);
    }
  };

  const copyFCMToken = () => {
    if (fcmToken) {
      Clipboard.setString(fcmToken);
      Alert.alert('복사 완료', 'FCM 토큰이 클립보드에 복사되었습니다.');
    } else {
      Alert.alert(
        'FCM 토큰 없음',
        'FCM 토큰이 아직 생성되지 않았습니다.\n\n가능한 원인:\n1. Firebase 초기화 중\n2. 푸시 알림 권한 거부\n3. Firebase 설정 오류',
        [
          { text: '재시도', onPress: loadFCMToken },
          { text: '확인' }
        ]
      );
    }
  };

  const loadMainData = async () => {
    try {
      console.log('🔍 메인 데이터 로드 시작...');
      console.log('📡 API URL:', ApiService.baseURL);
      
      // 메인 페이지 데이터 로드
      const data = await ApiService.getMainData();
      console.log('✅ 메인 데이터 응답:', data);
      
      const result = data?.result ?? data;
      setMainData({
        products: result?.product || [],
        siteStats: result?.site || null,
        reviews: result?.case_list || [],
        news: result?.news || [],
        faq: result?.faq || [],
        notice: result?.notice || [],
        topBanner: result?.top_banner_m_filepath || null,
        topPromotionBanner: result?.top_promotion_banner || [],
        popup: result?.popup || [],
        popup_cnt: result?.popup_cnt || 0,
      });
      
      console.log('📊 상품 수:', result?.product?.length || 0);
    } catch (error) {
      console.error('❌ 메인 데이터 로드 오류:', error);
      console.error('❌ 오류 상세:', error.message);
      console.error('❌ 응답 상태:', error.response?.status);
      console.error('❌ 응답 데이터:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerPress = () => {
    // Header.js의 투자하기 메뉴와 동일하게 ProductList로 이동
    navigation.navigate('ProductList', { user });
  };

  const checkAndShowPopup = async () => {
    try {
      if (mainData.popup_cnt > 0 && mainData.popup.length > 0) {
        // 24시간 동안 보지 않기 체크
        const popupHideTime = await AsyncStorage.getItem('popupHideTime');
        if (popupHideTime) {
          const hideTime = parseInt(popupHideTime, 10);
          const now = Date.now();
          if (now < hideTime) {
            return;
          } else {
            // 시간이 지났으면 삭제
            await AsyncStorage.removeItem('popupHideTime');
          }
        }

        // 로그인 상태에 따라 팝업 필터링
        let popups = mainData.popup;
        if (!user) {
          // 비로그인 상태: member_open_yn이 없는 팝업만 표시
          popups = mainData.popup.filter(popup => !popup.member_open_yn);
        }
      
        if (popups.length > 0) {
          setFilteredPopups(popups);
          setShowPopup(true);
        }
      }
    } catch (error) {
      console.error('팝업 체크 오류:', error);
    }
  };

  const handleClosePopup = async () => {
    // 24시간 보지 않기 체크되어 있으면 저장
    if (dontShowFor24Hours) {
      const hideUntil = Date.now() + (24 * 60 * 60 * 1000);
      await AsyncStorage.setItem('popupHideTime', hideUntil.toString());
    }

    // 팝업 완전히 닫기
    setShowPopup(false);
    setDontShowFor24Hours(false);
    setFilteredPopups([]);
  };

  const handlePopupLinkPress = async (url) => {
    if (!url) return;

    // 먼저 팝업 닫기
    setShowPopup(false);

    try {
      // /board/promotion 포함 여부 확인
      if (url.includes('/board/promotion')) {
        const match = url.match(/\/board\/promotion\/(\d+)/);
        if (match && match[1]) {
          const promotionId = match[1];
          
          // 프로모션 상세 화면으로 이동 (idx를 promotionId로 전달)
          navigation.navigate('PromotionDetail', { 
            idx: promotionId,
            promotionId: promotionId
          });
          return;
        }
      }

      // /product/detail 포함 여부 확인
      if (url.includes('/product/detail')) {
        const match = url.match(/\/product\/detail\/([A-Z0-9]+)/);
        if (match && match[1]) {
          const orderKey = match[1];
          
          // API 호출하여 상품 정보 가져오기
          const apiService = new ApiService();
          const response = await apiService.get(`/app/product/detail/${orderKey}`);
          
          // idx에 따라 적절한 화면으로 이동
          const idx = response?.prod?.idx || 999;
          let screenName = 'ProductDetail'; // 기본값 (idx > 498)
          
          if (idx > 498) {
            screenName = 'ProductDetail';
          } else if (idx > 415) {
            screenName = 'ProductDetailOld4';
          } else if (idx > 309) {
            screenName = 'ProductDetailOld1';
          } else if (idx > 242) {
            screenName = 'ProductDetailOld2';
          } else if (idx <= 242) {
            screenName = 'ProductDetailOld3';
          }
          
          navigation.navigate(screenName, { orderKey: orderKey });
          return;
        }
      }

      // 그 외의 경우 외부 브라우저로 열기
      Linking.openURL(url).catch((err) =>
        console.error('팝업 링크 열기 실패:', err)
      );
    } catch (error) {
      console.error('팝업 링크 처리 오류:', error);
      // 오류 발생 시 외부 브라우저로 열기
      Linking.openURL(url).catch((err) =>
        console.error('팝업 링크 열기 실패:', err)
      );
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '0';
    const stringValue = typeof value === 'string' ? value : String(value);
    const numericValue = stringValue.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const navigateToProductDetail = (item) => {
    const idx = item.idx;
    let screenName = 'ProductDetail'; // 기본값 (idx > 498)

    if (idx > 498) {
      screenName = 'ProductDetail';
    } else if (idx > 415) {
      screenName = 'ProductDetailOld4';
    } else if (idx > 309) {
      screenName = 'ProductDetailOld1';
    } else if (idx > 242) {
      screenName = 'ProductDetailOld2';
    } else if (idx <= 242) {
      screenName = 'ProductDetailOld3';
    }

    navigation.navigate(screenName, { orderKey: item.orderKey });
  };

  // 배너 슬라이드 렌더링
  const renderBannerSlide = ({ item, index }) => {
    // 상품 슬라이드
    if (item.type === 'product') {
      const product = item.data;
      return (
        <TouchableOpacity
          style={styles.slideContainer}
          onPress={() => navigateToProductDetail(product)}
          activeOpacity={0.9}
        >
          <View style={styles.slideInbox}>
            <View style={styles.slideCont}>
              <LinearGradient
                colors={['#E5E7FF', '#F1F2FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.slideGradient}
              />
              <View style={styles.productBox}>
                <View style={styles.tagBox}>
                  {product.status && (
                    <View style={[
                      styles.statusBadge,
                      product.status === 'READY_F' && styles.statusWhite,
                      (product.status === 'FUNDING' || product.status === 'SUCCESS') && styles.statusRed,
                      (product.status === 'REPAY' || product.status === 'OVERDUE' || product.status === 'COLLECT') && styles.statusPink,
                    ]}>
                      <Text style={[
                        styles.statusText,
                        product.status === 'READY_F' && styles.statusWhiteText,
                        (product.status === 'REPAY' || product.status === 'OVERDUE' || product.status === 'COLLECT') && styles.statusPinkText,
                      ]}>{product.f_status_kr}</Text>
                    </View>
                  )}
                  <Text style={styles.tag}>#{product.term}</Text>
                  <Text style={styles.tag}>#{product.orderType}</Text>
                </View>
                <View style={styles.titImgFlex}>
                  <Text style={styles.productTitle} numberOfLines={1}>{product.orderName}</Text>
                </View>
              </View>
              <View style={styles.progressGroup}>
                <View style={styles.txtInfo}>
                  {product.orderType && (
                    <View style={styles.productTypeIcon}>
                      {product.orderType === '태양광' && (
                        <Image
                          source={require('../assets/images/img_product01_s.png')}
                          style={styles.productTypeImage}
                          resizeMode="contain"
                        />
                      )}
                      {product.orderType === '풍력' && (
                        <Image
                          source={require('../assets/images/img_product02_s.png')}
                          style={styles.productTypeImage}
                          resizeMode="contain"
                        />
                      )}
                      {product.orderType === 'ESS' && (
                        <Image
                          source={require('../assets/images/img_product03_s.png')}
                          style={styles.productTypeImage}
                          resizeMode="contain"
                        />
                      )}
                      {product.orderType === '전기차충전소' && (
                        <Image
                          source={require('../assets/images/img_product03_s.png')}
                          style={styles.productTypeImage}
                          resizeMode="contain"
                        />
                      )}
                    </View>
                  )}
                  <View style={styles.rateInfoContainer}>
                    <Text style={styles.rateText}>
                      연 <Text style={styles.rateValue}>{product.rate}</Text>%
                    </Text>
                    <Text style={styles.periodText}>
                      <Text style={styles.periodValue}>{product.period_text}</Text>개월
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={['#B8C5F2', '#5B7BE8', '#2c3db8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressVal, { width: `${product.percent}%` }]}
                  />
                </View>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressTotal}>
                    <Text style={styles.progressEmphasis}>{formatCurrency(product.investment)}원</Text>
                    {' / '}{formatCurrency(product.price)}원
                  </Text>
                  <Text style={styles.progressPct}>{product.percent}%</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.btnGo}
              onPress={(e) => {
                e.stopPropagation();
                navigateToProductDetail(product);
              }}
            >
              <Text style={styles.btnGoText}>상품 보러가기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }
    
    // 프로모션 배너 슬라이드
    if (item.type === 'promotion') {
      const promo = item.data;
      return (
        <TouchableOpacity
          style={styles.slideContainer}
          onPress={() => {
            navigation.navigate('PromotionDetail', {
              idx: promo.idx
            });
          }}
          activeOpacity={0.9}
        >
          <View style={styles.slideInbox}>
            <View style={[styles.slideCont, styles.promoCont]}>
              {promo.thumbnail && (
                <Image
                  source={{ uri: promo.thumbnail }}
                  style={styles.promoImage}
                  resizeMode="cover"
                />
              )}
            </View>
            <TouchableOpacity style={styles.btnGo}>
              <Text style={styles.btnGoText}>프로모션 보러가기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    // 고정 배너 (루트레터, 법인투자)
    if (item.type === 'fixed') {
      return (
        <TouchableOpacity
          style={styles.slideContainer}
          onPress={() => {
            if (item.data.url) {
              navigation.navigate('WebView', { url: item.data.url });
            }
          }}
          activeOpacity={0.9}
        >
          <View style={styles.slideInbox}>
            <View style={[styles.slideCont, { backgroundColor: item.data.bgColor || '#F1F2FF' }]}>
              <View style={styles.titBox}>
                <Text style={styles.fixedTitle}>{item.data.title}</Text>
                <Text style={styles.fixedSubtitle}>{item.data.subtitle}</Text>
              </View>
              {item.data.linkText && (
                <TouchableOpacity
                  style={styles.viewPast}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (item.data.linkUrl) {
                      navigation.navigate('WebView', { url: item.data.linkUrl });
                    }
                  }}
                >
                  <Text style={styles.viewPastText}>{item.data.linkText}</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.btnGo, item.data.btnStyle]}
              onPress={(e) => {
                e.stopPropagation();
                if (item.data.navigateTo) {
                  // 특정 화면으로 이동
                  navigation.navigate(item.data.navigateTo);
                } else if (item.data.url) {
                  // WebView로 이동
                  navigation.navigate('WebView', { url: item.data.url });
                }
              }}
            >
              <Text style={styles.btnGoText}>{item.data.btnText}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  // 배너 데이터 준비
  const prepareBannerData = () => {
    const bannerData = [];
    
    // 상품 추가
    mainData.products.forEach(product => {
      bannerData.push({ type: 'product', data: product });
    });
    
    // 프로모션 배너 추가
    mainData.topPromotionBanner.forEach(promo => {
      bannerData.push({ type: 'promotion', data: promo });
    });
    
    // 고정 배너 추가 (루트레터)
    bannerData.push({
      type: 'fixed',
      data: {
        title: '격주 월요일,\n루트레터를 받아보세요',
        subtitle: '다양한 환경뉴스를 전해드려요!',
        linkText: '지난 회차 보기',
        linkUrl: 'https://page.stibee.com/archives/107118',
        url: 'https://page.stibee.com/subscriptions/107118',
        btnText: '무료 구독하기',
        btnStyle: styles.btnGoPurple,
        bgColor: '#E8E5FF',
      }
    });
    
    // 고정 배너 추가 (법인투자 상담 신청)
    bannerData.push({
      type: 'fixed',
      data: {
        title: '녹색 금융,\n법인투자자와 함께 합니다',
        subtitle: '가입부터 투자까지 1:1 상담 진행',
        btnText: '상담 신청하기',
        btnStyle: styles.btnGoBlack,
        bgColor: '#F5F5F5',
        navigateTo: 'ConsultationRequest', // 1:1 상담 신청 페이지로 이동
      }
    });
    
    return bannerData;
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentSlide(viewableItems[0].index || 0);
    }
  }).current;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3db8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mainData.topBanner && (
          <View style={styles.bannerWrapper}>
            <TouchableOpacity 
              onPress={handleBannerPress} 
              activeOpacity={0.9}
              style={styles.bannerContainer}
            >
              <Image
                source={{ uri: mainData.topBanner }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Main Banner Swiper */}
        <View style={styles.maBnSwiper}>
          <FlatList
            ref={flatListRef}
            data={prepareBannerData()}
            renderItem={renderBannerSlide}
            keyExtractor={(item, index) => `banner-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_WIDTH}
            decelerationRate="fast"
            contentContainerStyle={styles.bannerListContent}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 50
            }}
          />
          {/* Pagination dots */}
          <View style={styles.swiperPagination}>
            {prepareBannerData().map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[
                  styles.paginationDot,
                  index === currentSlide && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        </View>

        {/* 환경과 함께 섹션 */}
        <View style={styles.environmentSection}>
          <View style={styles.titleBox}>
            <Text style={styles.sectionTitle}>환경과 함께,</Text>
          </View>
          <View style={styles.titleBoxRow}>
            <Text style={styles.sectionTitle}>믿을 수 있는 투자처</Text>
            {mainData.siteStats && (
              <Text style={styles.dateText}>
                *{new Date().toLocaleDateString('ko-KR')} 기준
              </Text>
            )}
          </View>

          {mainData.siteStats && (
            <View style={styles.dataList}>
              {/* 누적 대출액 */}
              <View style={styles.dataItem}>
                <View style={styles.dataInbox}>
                  <Image
                    source={require('../assets/images/ma_ico_environment01.png')}
                    style={styles.dataIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.dataTitle}>누적 대출액</Text>
                  <View style={styles.dataCon}>
                    <Text style={styles.dataText}>
                      {formatCurrency(mainData.siteStats.acc_loan_price)}억원
                    </Text>
                    <Text style={styles.dataCount}>
                      ▲ {formatCurrency(mainData.siteStats.gap_loan_price)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 누적 투자 건수 */}
              <View style={styles.dataItem}>
                <View style={styles.dataInbox}>
                  <Image
                    source={require('../assets/images/ma_ico_environment02.png')}
                    style={styles.dataIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.dataTitle}>누적 투자 건수</Text>
                  <View style={styles.dataCon}>
                    <Text style={styles.dataText}>
                      {formatCurrency(mainData.siteStats.acc_invest_count)}건
                    </Text>
                    <Text style={styles.dataCount}>
                      ▲ {mainData.siteStats.gap_invest_count}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 생산 발전량 박스 */}
              <View style={styles.dataBox}>
                <Image
                  source={require('../assets/images/ma_bg_environment01.png')}
                  style={styles.dataBoxBgImage}
                  resizeMode="cover"
                />
                <View style={styles.leftBox}>
                  <Text style={styles.dataBoxTitle}>생산 발전량</Text>
                  <View style={styles.dataBoxCon}>
                    <Text style={styles.dataBoxText}>
                      {formatCurrency(mainData.siteStats.production_power)}만
                    </Text>
                    <Text style={styles.dataBoxCount}>
                      ▲ {formatCurrency(mainData.siteStats.gap_production_power)}
                    </Text>
                  </View>
                </View>
                <View style={styles.rightBox}>
                  <Text style={styles.rightBoxText}>
                    대기오염 <Text style={styles.rightBoxEmphasis}>{formatCurrency(mainData.siteStats.air_pollution)}</Text> 감축{'\n'}
                    <Text style={styles.rightBoxEmphasis}>약 {formatCurrency(mainData.siteStats.tree_count)}그루🌲</Text>{'\n'}
                    이산화탄소 절감
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 투자자 후기 섹션 */}
        {mainData.reviews.length > 0 && (
          <View style={styles.reviewSwiper}>
            <View style={styles.titleBox}>
              <Text style={styles.sectionTitle}>투자자 후기</Text>
            </View>
            <ScrollView
              ref={reviewScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reviewScrollContent}
              style={styles.reviewScroll}
              snapToInterval={SCREEN_WIDTH - 64}
              snapToAlignment="start"
              decelerationRate="fast"
              onScroll={(event) => {
                const slideWidth = SCREEN_WIDTH - 64;
                const currentIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
                setCurrentReviewSlide(currentIndex);
              }}
              scrollEventThrottle={16}
            >
              {mainData.reviews.map((review, index) => (
                <View key={index} style={[
                  styles.reviewSlide,
                  index === mainData.reviews.length - 1 && { marginLeft: 'auto', marginRight: -15 }
                ]}>
                  <View style={styles.reviewInbox}>
                    <View style={[
                      styles.userBox,
                      review.fund_type === 'CLI' && styles.userBoxSkyblue,
                      review.fund_type === 'COM' && styles.userBoxMint,
                      review.fund_type === 'COR' && styles.userBoxGray,
                    ]}>
                      <Text style={styles.userBoxText}>
                        {review.fund_type === 'CLI' ? '기후' : 
                         review.fund_type === 'COM' ? '커뮤' : 
                         review.fund_type === 'COR' ? '법인' : '-'}
                      </Text>
                    </View>
                    <View style={styles.txtBox}>
                      <View style={styles.reviewTit}>
                        <Text style={styles.reviewTitText} numberOfLines={2}>
                          {review.subject.replace(/<br\s*\/?>/gi, '\n')}
                        </Text>
                      </View>
                      <View style={styles.reviewTxt}>
                        <Text style={styles.reviewTxtText} numberOfLines={5}>
                          {review.contents.replace(/<br\s*\/?>/gi, ' ')}
                        </Text>
                      </View>
                      <View style={styles.infoName}>
                        <Text style={styles.infoText}>{review.summary}</Text>
                        <Text style={styles.nameText}>{review.etc_text_1}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
            {/* Pagination dots */}
            <View style={styles.reviewPagination}>
              {mainData.reviews.map((_, index) => (
                <View
                  key={`review-dot-${index}`}
                  style={[
                    styles.paginationDot,
                    index === currentReviewSlide && styles.paginationDotActive
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* 펀드 소개 */}
        <View style={[styles.section, styles.introSection]}>
          <View style={styles.titleBox}>
            <Text style={styles.sectionTitle}>펀드가 처음이라면?{'\n'}부담없이 시작하세요</Text>
          </View>
          <View style={styles.introContainer}>
            <View style={styles.introRow}>
              <View style={styles.introBox}>
                <View style={styles.introIconWrapper}>
                  <Image 
                    source={require('../assets/images/ma_ico_intro01.png')} 
                    style={styles.introIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.introText}>
                  <Text style={styles.introEmphasis}>최소 1만원</Text>부터{'\n'}투자 가능
                </Text>
              </View>
              <View style={styles.introBox}>
                <View style={styles.introIconWrapper}>
                  <Image 
                    source={require('../assets/images/ma_ico_intro02.png')} 
                    style={styles.introIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.introText}>
                  <Text style={styles.introEmphasis}>빠르고 간편</Text>한{'\n'}회원가입
                </Text>
              </View>
            </View>
            <View style={styles.introRow}>
              <View style={styles.introBox}>
                <View style={styles.introIconWrapper}>
                  <Image 
                    source={require('../assets/images/ma_ico_intro03.png')} 
                    style={styles.introIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.introText}>
                  눈속임 없는{'\n'}<Text style={styles.introEmphasis}>세후 수익률</Text>
                </Text>
              </View>
              <View style={styles.introBox}>
                <View style={styles.introIconWrapper}>
                  <Image 
                    source={require('../assets/images/ma_ico_intro04.png')} 
                    style={styles.introIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.introText}>
                  <Text style={styles.introEmphasis}>분기별 이자</Text>로{'\n'}쏠쏠한 용돈
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 카카오 배너 */}
        <View style={styles.kakaoBannerWrapper}>
          <TouchableOpacity 
            style={styles.kakaoBanner}
            onPress={() => Linking.openURL('https://pf.kakao.com/_CxaYbd')}
          >
            <Image 
              source={require('../assets/images/ma_bannerkakao01.png')} 
              style={styles.kakaoBannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>

        {/* 최신 뉴스 */}
        {mainData.news.length > 0 && (
          <View style={[styles.section, { marginBottom: 0 }]}>
            <View style={[styles.titleBox, styles.titleBoxRow]}>
              <Text style={styles.sectionTitle}>최신뉴스</Text>
              <TouchableOpacity style={styles.moreButtonContainer}>
                <Text style={styles.moreButton}>전체보기</Text>
                <Image 
                  source={require('../assets/images/arrow_right.png')} 
                  style={styles.moreButtonArrow}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              ref={newsScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.newsScroll}
              contentContainerStyle={styles.newsScrollContent}
              snapToInterval={SCREEN_WIDTH - 64}
              snapToAlignment="start"
              decelerationRate="fast"
              onScroll={(event) => {
                const slideWidth = SCREEN_WIDTH - 64;
                const currentIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
                setCurrentNewsSlide(currentIndex);
              }}
              scrollEventThrottle={16}
            >
              {mainData.news.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.newsCard,
                    index === mainData.news.length - 1 && { marginLeft: 'auto', marginRight: -15 }
                  ]}
                >
                  <View style={styles.newsInbox}>
                    {item.thumbnail && (
                      <View style={styles.newsImgbox}>
                        <Image
                          source={{ uri: item.thumbnail }}
                          style={styles.newsImage}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    <View style={styles.newsTxtbox}>
                      <Text style={styles.newsTitle} numberOfLines={2}>
                        {item.subject}
                      </Text>
                      <View style={styles.newsSourceDate}>
                        <Text style={styles.newsSource}>{item.etc_text_1}</Text>
                        <Text style={styles.newsDateDivider}> | </Text>
                        <Text style={styles.newsDate}>
                          {item.recordtime?.substring(0, 10)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.newsPagination}>
              {mainData.news.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentNewsSlide === index && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* 루트소식 */}
        <View style={styles.rootNewsSection}>
          <View style={styles.titleBox}>
            <Text style={styles.sectionTitle}>루트소식</Text>
          </View>
          <View style={styles.rootNewsBox}>
            <View style={styles.rootNewsList}>
              <TouchableOpacity style={styles.rootNewsItem}>
                <View style={styles.rootNewsInbox}>
                  <Text style={styles.rootNewsCate}>채용</Text>
                  <Text style={styles.rootNewsTit}>기회/실무 파트 채용 중</Text>
                  <Image 
                    source={require('../assets/images/ico_rootnews01.png')} 
                    style={[styles.rootNewsIco, styles.rootNewsIco1]}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rootNewsItem}>
                <View style={styles.rootNewsInbox}>
                  <Text style={styles.rootNewsCate}>회사소개</Text>
                  <Text style={styles.rootNewsTit}>More for the future 저탄소 사회를 위해</Text>
                  <Image 
                    source={require('../assets/images/ico_rootnews02.png')} 
                    style={styles.rootNewsIco}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* 프로모션 이미지배너 */}
            <View style={styles.promotionBanner}>
              <TouchableOpacity style={styles.promotionInbox}>
                <Image 
                  source={require('../assets/images/main_banner_default.png')} 
                  style={styles.promotionImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 자주하는 질문 */}
        {mainData.faq.length > 0 && (
          <View style={styles.whiteBox}>
            <View style={styles.inHead}>
              <View style={styles.titleWithIcon}>
                <Image 
                  source={require('../assets/images/ico_whitebox_faq.png')} 
                  style={styles.titleIcon}
                  resizeMode="contain"
                />
                <Text style={styles.whiteBoxTitle}>자주하는질문</Text>
              </View>
              <TouchableOpacity style={styles.moreButtonContainer}>
                <Text style={styles.moreButton}>전체보기</Text>
                <Image 
                  source={require('../assets/images/arrow_right.png')} 
                  style={styles.moreButtonArrow}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.inCont}>
              {mainData.faq.slice(0, 3).map((item, index) => (
                <View key={index} style={styles.faqItem}>
                  <TouchableOpacity 
                    style={styles.faqTitbox}
                    onPress={() => setExpandedFaqIndex(expandedFaqIndex === index ? null : index)}
                  >
                    <Text style={styles.faqQ}>Q</Text>
                    <Text style={styles.faqTitle}>{item.subject}</Text>
                    <Image 
                      source={require('../assets/images/arrow_select.png')} 
                      style={[
                        styles.faqArrowImage,
                        expandedFaqIndex === index && styles.faqArrowImageUp
                      ]}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                  {expandedFaqIndex === index && (
                    <View style={styles.faqConbox}>
                      <Text style={styles.faqCon}>
                        {item.contents
                          .replace(/<br\s*\/?>/gi, '\n')
                          .replace(/&nbsp;/gi, ' ')
                          .replace(/&lt;/gi, '<')
                          .replace(/&gt;/gi, '>')
                          .replace(/&amp;/gi, '&')
                          .replace(/<[^>]*>/g, '')}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 공지사항 */}
        {mainData.notice.length > 0 && (
          <View style={styles.whiteBox}>
            <View style={styles.inHead}>
              <View style={styles.titleWithIcon}>
                <Image 
                    source={require('../assets/images/ico_whitebox_notice.png')} 
                    style={styles.titleIcon}
                    resizeMode="contain"
                />
                <Text style={styles.whiteBoxTitle}>공지사항</Text>
              </View>
              <TouchableOpacity 
                style={styles.moreButtonContainer}
                onPress={() => navigation.navigate('CustomerService', { user, initialTab: 0 })}
              >
                <Text style={styles.moreButton}>전체보기 ›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inCont}>
              {mainData.notice.slice(0, 3).map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.noticeItem}
                  onPress={() => navigation.navigate('CustomerService', { user, initialTab: 0 })}
                >
                  <Text style={styles.noticeItemTitle}>{item.subject}</Text>
                  <Text style={styles.noticeDate}>
                    {item.recordtime?.substring(0, 10)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 공시지표 */}
        {mainData.siteStats && (
          <View style={styles.whiteBox}>
            <View style={styles.inHead}>
              <View style={styles.titleWithIcon}>
                <Image 
                  source={require('../assets/images/ico_whitebox_graph.png')} 
                  style={styles.titleIcon}
                  resizeMode="contain"
                />
                <Text style={styles.whiteBoxTitle}>공시지표</Text>
              </View>
              <Text style={styles.indicatorDesc}>
                *{new Date().toLocaleDateString('ko-KR', {year: 'numeric', month: '2-digit', day: '2-digit'}).replace(/\. /g, '년 ').replace('.', '일')} 기준
              </Text>
            </View>
            <View style={styles.maIndicator}>
              <View style={styles.indicatorItembox}>
                <View style={styles.indicatorDl}>
                  <Text style={styles.indicatorDt}>누적대출액</Text>
                  <Text style={styles.indicatorDd}>
                    {formatCurrency(mainData.siteStats.loan_price)}원
                  </Text>
                </View>
                <View style={styles.indicatorPct}>
                  <Text style={styles.indicatorPctTit}>상환율</Text>
                  <Text style={styles.indicatorPctCnt}>
                    {mainData.siteStats.repay_per}%
                  </Text>
                </View>
              </View>
              <View style={styles.indicatorItembox}>
                <View style={styles.indicatorDl}>
                  <Text style={styles.indicatorDt}>대출잔액</Text>
                  <Text style={styles.indicatorDd}>
                    {formatCurrency(mainData.siteStats.balance)}원
                  </Text>
                </View>
                <View style={styles.indicatorPct}>
                  <Text style={styles.indicatorPctTit}>연체율</Text>
                  <Text style={styles.indicatorPctCnt}>
                    {mainData.siteStats.overdue}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footCs}>
            <View style={styles.footCsDt}>
              <Image 
                source={require('../assets/images/foot_cs.png')} 
                style={styles.footCsIcon}
                resizeMode="contain"
              />
              <Text style={styles.footCsTitle}>고객문의</Text>
            </View>
            <View style={styles.footCsDd}>
              <Text style={styles.footCsTel}>02) 792.8934</Text>
              <Text style={styles.footCsEmail}>cs@rootenergy.co.kr</Text>
              <Text style={styles.footCsTime}>평일 10시~17시 (점심 12시~13시)</Text>
            </View>
          </View>

          <View style={styles.footLogoSns}>
            <View style={styles.footSns}>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.youtube.com/channel/UCDG9mSh5Z-fQiNxvcFkimpQ')}>
                <Image source={require('../assets/images/sns_youtube.png')} style={styles.snsIcon} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.facebook.com/rootenergy')}>
                <Image source={require('../assets/images/sns_facebook.png')} style={styles.snsIcon} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://blog.naver.com/climatefintech')}>
                <Image source={require('../assets/images/sns_blog.png')} style={styles.snsIcon} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://pf.kakao.com/_CxaYbd')}>
                <Image source={require('../assets/images/sns_talk.png')} style={styles.snsIcon} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://rootenergy.channel.io')}>
                <Image source={require('../assets/images/sns_cntalk.png')} style={styles.snsIcon} resizeMode="contain" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footCon}>
            <View style={styles.footMenu}>
              <TouchableOpacity 
                style={styles.footMenuItem}
                onPress={() => navigation.navigate('CustomerService', { user, initialTab: 0 })}
              >
                <Text style={styles.footMenuText}>공지사항</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.footMenuItem}
                onPress={() => navigation.navigate('CustomerService', { user, initialTab: 1 })}
              >
                <Text style={styles.footMenuText}>자주하는 질문</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.footMenuItem}
                onPress={() => navigation.navigate('Recruit', { user })}
              >
                <Text style={styles.footMenuText}>채용</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footLinkBox}>
              <View style={styles.footLink}>
                <TouchableOpacity 
                  style={styles.footLinkItem}
                  onPress={() => navigation.navigate('Terms', { user, service: 'service' })}
                >
                  <Text style={styles.footLinkText}>서비스 이용약관</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.footLinkItem}
                  onPress={() => navigation.navigate('Terms', { user, service: 'deals' })}
                >
                  <Text style={styles.footLinkText}>전자금융거래약관</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.footLinkItem}
                  onPress={() => navigation.navigate('Terms', { user, service: 'private' })}
                >
                  <Text style={styles.footLinkText}>개인정보처리방침</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.footLinkItem}
                  onPress={() => navigation.navigate('Terms', { user, service: 'credit' })}
                >
                  <Text style={styles.footLinkText}>신용정보 활용체계</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.footLinkItem}
                  onPress={() => navigation.navigate('Terms', { user, service: 'invest' })}
                >
                  <Text style={styles.footLinkText}>연계투자계약 약관</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.footLinkItem}
                  onPress={() => navigation.navigate('Terms', { user, service: 'loan' })}
                >
                  <Text style={styles.footLinkText}>연계대출계약 약관</Text>
                </TouchableOpacity>
              </View>
              <Image 
                source={require('../assets/images/foot_certified.png')} 
                style={styles.footCertified}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.footDescBox}>
            <Text style={styles.footDesc1}>
              대표이사 윤태환 l 사업자 등록번호 106-87-04057{'\n'}
              온라인투자연계금융업 2024-20{'\n'}
              주소 서울특별시 성동구 뚝섬로1나길 5 l Tel. 02-792-8934{'\n'}
              대출금리는 플랫폼 이용료를 포함한 최대 연 19.90% 이내{'\n'}
              연체금리는 약정금리에 연 가산금리 3%로 법정금리 최고 연 20%{'\n'}
              이내입니다. 대출 실행 후 언제든지 조기 상환(전액)이 가능하며,{'\n'}
              중도상환 수수료는 면제됩니다.
            </Text>
            <Text style={styles.footDesc2}>
              루트인프라금융㈜는 투자원금과 수익을 보장하지 않으며,{'\n'}
              투자 손실에 대한 책임은 모두 투자자에게 있습니다.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 팝업 모달 */}
      {showPopup && filteredPopups.length > 0 && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={handleClosePopup}
        >
          <View style={styles.popupContainer}>
            <View style={styles.popupMask} />
            <View style={styles.popupWrapper}>
              <View style={styles.popupBox}>
                {/* 팝업 스와이퍼 */}
                <View style={styles.popupSwiperContainer}>
                  <Swiper
                    loop={true}
                    autoplay={true}
                    autoplayTimeout={3}
                    showsPagination={true}
                    paginationStyle={styles.popupPagination}
                    dot={<View style={styles.popupPaginationDot} />}
                    activeDot={<View style={styles.popupPaginationDotActive} />}
                  >
                    {filteredPopups.map((item, index) => (
                      <View key={index} style={styles.popupSlide}>
                        <TouchableOpacity
                          onPress={() => {
                            if (item?.link_url) {
                              handlePopupLinkPress(item.link_url);
                            }
                          }}
                          activeOpacity={0.9}
                        >
                          <Image
                            source={{ uri: item?.filePath }}
                            style={styles.popupImage}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </Swiper>
                </View>

                {/* 팝업 하단 */}
                <View style={styles.popupBottom}>
                  <TouchableOpacity
                    style={styles.popupCheckbox}
                    onPress={() => {
                      setDontShowFor24Hours(!dontShowFor24Hours);
                    }}
                  >
                    <Image
                      source={
                        dontShowFor24Hours
                          ? require('../assets/images/checkbox_on.png')
                          : require('../assets/images/checkbox_off.png')
                      }
                      style={styles.popupCheckboxIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.popupCheckboxText}>24시간 열지 않기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.popupCloseBtn}
                    onPress={handleClosePopup}
                  >
                    <Image
                      source={require('../assets/images/ico_close_gray.png')}
                      style={styles.popupCloseIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.popupCloseText}>닫기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  pushTestButton: {
    position: 'absolute',
    top: 60,
    right: 10,
    backgroundColor: '#2c3db8',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  bannerWrapper: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: '#F5F7FA',
  },
  bannerContainer: {
    width: '100%',
    height: 60,
    borderRadius: 15,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  // Main Banner Swiper Styles
  maBnSwiper: {
    position: 'relative',
    overflow: 'visible',
  },
  bannerListContent: {
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 5,
  },
  slideInbox: {
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  slideCont: {
    position: 'relative',
    width: '100%',
    paddingBottom: '63.1%',
    backgroundColor: 'transparent',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  slideGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  promoCont: {
    backgroundColor: '#FFFFFF',
  },
  promoImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  productBox: {
    position: 'absolute',
    top: 26,
    left: 24,
    right: 24,
  },
  tagBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    color: '#2c3db8',
    fontSize: 15,
    lineHeight: 19.5,
    marginRight: 6,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 15,
    backgroundColor: '#222',
    marginRight: 7,
    marginLeft: -5,
  },
  statusText: {
    color: '#F6F6F6',
    fontSize: 14,
    fontWeight: '600',
  },
  statusWhite: {
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#db2852',
  },
  statusWhiteText: {
    color: '#db2852',
  },
  statusRed: {
    backgroundColor: '#db2852',
  },
  statusPink: {
    backgroundColor: 'rgba(219, 40, 82, 0.1)',
  },
  statusPinkText: {
    color: '#db2852',
  },
  statusGray: {
    backgroundColor: '#a3a7ab',
  },
  titImgFlex: {
    position: 'relative',
    paddingRight: 56,
    marginTop: 2,
  },
  productTitle: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '800',
    color: '#333',
  },
  progressGroup: {
    position: 'absolute',
    bottom: 10,
    left: 24,
    right: 24,
  },
  txtInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productTypeIcon: {
    marginRight: 60,
  },
  rateInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  productTypeImage: {
    width: 60,
    height: 60,
  },
  productTypeText: {
    fontSize: 24,
  },
  rateText: {
    fontSize: 14,
    color: '#333',
    marginRight: 36,
  },
  rateValue: {
    fontSize: 38,
    fontWeight: '700',
    color: '#333',
  },
  periodText: {
    fontSize: 14,
    color: '#333',
  },
  periodValue: {
    fontSize: 38,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressVal: {
    height: '100%',
    backgroundColor: '#2c3db8',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTotal: {
    fontSize: 13,
    color: '#666',
  },
  progressEmphasis: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  progressPct: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  titBox: {
    position: 'absolute',
    top: 26,
    left: 24,
    right: 24,
  },
  fixedTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#333',
  },
  fixedSubtitle: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19.5,
    color: '#666',
  },
  viewPast: {
    position: 'absolute',
    bottom: 22,
    left: 24,
  },
  viewPastText: {
    color: '#666',
    fontSize: 12,
    textDecorationLine: 'underline',
    opacity: 0.7,
  },
  btnGo: {
    backgroundColor: '#2c3db8',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  btnGoText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
  },
  btnGoPurple: {
    backgroundColor: '#6d3ef2',
  },
  btnGoBlack: {
    backgroundColor: '#222',
  },
  swiperPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  paginationDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#aab1bc',
    marginHorizontal: 2,
  },
  paginationDotActive: {
    width: 16,
    backgroundColor: '#2c3db8',
  },
  section: {
    backgroundColor: 'transparent',
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  environmentSection: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 35,
    paddingBottom: 16,
  },
  titleBox: {
    marginBottom: 0,
  },
  titleBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    //marginBottom: ,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    lineHeight: 28,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 8,
    alignSelf: 'flex-end',
  },
  moreButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    marginBottom: 2,
  },
  moreButton: {
    fontSize: 13,
    lineHeight: 20,
    color: '#333',
    marginRight: 4,
  },
  moreButtonArrow: {
    width: 16,
    height: 16,
  },
  dataList: {
    marginTop: 10,
  },
  dataItem: {
    marginBottom: 8,
  },
  dataInbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  dataIcon: {
    width: 42,
    height: 42,
    marginRight: 12,
    borderRadius: 10,
  },
  dataTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#333',
  },
  dataCon: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  dataText: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
    color: '#333',
  },
  dataCount: {
    color: '#ff5042',
    fontSize: 10,
    lineHeight: 16,
  },
  dataBox: {
    position: 'relative',
    height: 192,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#e9faf4',
    overflow: 'hidden',
  },
  dataBoxBgImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    width: '100%',
  },
  leftBox: {
    position: 'absolute',
    top: 16,
    left: 24,
    alignItems: 'flex-end',
  },
  dataBoxTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#333',
  },
  dataBoxCon: {
    marginTop: 2,
    alignItems: 'flex-end',
  },
  dataBoxText: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
    color: '#333',
  },
  dataBoxCount: {
    color: '#2ebab4',
    fontSize: 10,
    lineHeight: 16,
  },
  rightBox: {
    position: 'absolute',
    top: 16,
    right: 24,
  },
  rightBoxText: {
    color: '#393f44',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'left',
  },
  rightBoxEmphasis: {
    color: '#2ebab4',
    fontWeight: '700',
  },
  reviewSwiper: {
    position: 'relative',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 25,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  reviewPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  reviewScrollContent: {
    paddingLeft: 0,
    paddingRight: 16,
  },
  reviewScroll: {
    marginTop: 10,
  },
  reviewSlide: {
    width: SCREEN_WIDTH - 80,
    marginRight: 16,
  },
  reviewInbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 22,
    paddingLeft: 20,
    paddingBottom: 24,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(104, 111, 115, 0.15)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  userBox: {
    width: 37,
    height: 37,
    marginTop: 2,
    marginRight: 12,
    borderRadius: 37,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userBoxSkyblue: {
    backgroundColor: '#197cff',
  },
  userBoxMint: {
    backgroundColor: '#2ebab4',
  },
  userBoxGray: {
    backgroundColor: '#666',
  },
  userBoxText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
  },
  txtBox: {
    flex: 1,
  },
  reviewTit: {
    minHeight: 39,
    maxHeight: 50,
    justifyContent: 'center',
  },
  reviewTitText: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    color: '#333',
  },
  reviewTxt: {
    height: 100,
    marginTop: 15,
  },
  reviewTxtText: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
  },
  infoName: {
    marginTop: 15,
  },
  infoText: {
    color: '#2c3db8',
    fontSize: 12,
    lineHeight: 16,
  },
  nameText: {
    color: '#bfc3c7',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  introContainer: {
    marginTop: 10,
    gap: 8,
  },
  introRow: {
    flexDirection: 'row',
    gap: 8,
  },
  introBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  introIconWrapper: {
    width: 37,
    height: 37,
    borderRadius: 32,
    backgroundColor: '#F1F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  introIcon: {
    width: 27,
    height: 27,
  },
  introText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 17,
  },
  introEmphasis: {
    color: '#2c3db8',
    fontWeight: 'bold',
  },
  introSection: {
    backgroundColor: 'transparent',
    paddingBottom: 0,
    marginBottom: 0,
  },
  kakaoBannerWrapper: {
    backgroundColor: 'transparent',
    paddingTop: 26,
    paddingBottom: 16,
  },
  kakaoBanner: {
    borderRadius: 15,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  kakaoBannerImage: {
    width: '100%',
    height: 130,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  newsScroll: {
    paddingTop: 5,
  },
  newsScrollContent: {
    paddingLeft: 0,
    paddingRight: 16,
  },
  newsPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  newsCard: {
    width: SCREEN_WIDTH - 80,
    marginRight: 16,
  },
  newsInbox: {
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(104, 111, 115, 0.15)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  newsImgbox: {
    width: '100%',
    height: (SCREEN_WIDTH - 80) * 0.503,
  },
  newsImage: {
    width: '100%',
    height: '100%',
  },
  newsTxtbox: {
    padding: 20,
  },
  newsTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: '#333',
    height: 44,
    marginTop: -5,
  },
  newsSourceDate: {
    flexDirection: 'row',
    marginTop: 16,
  },
  newsSource: {
    fontSize: 12,
    lineHeight: 14,
    color: '#666',
  },
  newsDateDivider: {
    fontSize: 12,
    lineHeight: 14,
    color: '#bfc3c7',
    marginHorizontal: 4,
  },
  newsDate: {
    fontSize: 12,
    lineHeight: 14,
    color: '#bfc3c7',
  },
  rootNewsSection: {
    marginTop: 16,
    marginBottom: 30,
    paddingHorizontal: 16,
  },
  rootNewsBox: {
  },
  rootNewsList: {
  },
  rootNewsItem: {
    marginTop: 8,
  },
  rootNewsInbox: {
    position: 'relative',
    paddingVertical: 20,
    paddingLeft: 20,
    paddingRight: 60,
    borderRadius: 10,
    backgroundColor: '#ebf0f8',
  },
  rootNewsCate: {
    color: '#197cff',
    fontSize: 12,
    lineHeight: 16,
  },
  rootNewsTit: {
    marginTop: 3,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  rootNewsIco: {
    position: 'absolute',
    top: '50%',
    right: 23,
    width: 28,
    height: 28,
    marginTop: 4,
  },
  rootNewsIco1: {
    right: 19,
    width: 29,
    marginTop: 4.5,
  },
  promotionBanner: {
    marginTop: 15,
  },
  promotionInbox: {
    borderRadius: 10,
    height: 250,
    overflow: 'hidden',
  },
  promotionImage: {
    width: '100%',
    height: '100%',
  },
  whiteBox: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(224, 225, 226, 0.50)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
  },
  inHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  whiteBoxTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },
  inCont: {
    marginTop: 12,
    paddingTop: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#f6f6f6',
  },
  faqItem: {
    paddingVertical: 8,
  },
  faqTitbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  faqQ: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3db8',
    marginRight: 8,
  },
  faqTitle: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  faqArrowImage: {
    width: 16,
    height: 16,
    marginLeft: 8,
  },
  faqArrowImageUp: {
    transform: [{ rotate: '180deg' }],
  },
  faqConbox: {
    marginTop: 12,
    paddingTop: 12,
    paddingLeft: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  faqCon: {
    fontSize: 15,
    color: '#666',
    lineHeight: 20,
  },
  noticeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  noticeItemTitle: {
    flex: 1,
    fontSize: 13,
    color: '#333333',
    marginRight: 12,
  },
  noticeDate: {
    fontSize: 12,
    color: '#999999',
  },
  indicatorDesc: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },
  maIndicator: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 12,
  },
  indicatorItembox: {
    width: '50%',
  },
  indicatorDl: {
    paddingHorizontal: 4,
  },
  indicatorDt: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    color: '#333',
  },
  indicatorDd: {
    marginTop: 6,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    color: '#333',
  },
  indicatorPct: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#f6f6f6',
  },
  indicatorPctTit: {
    marginRight: 8,
    fontSize: 12,
    color: '#a3a7ab',
    opacity: 0.7,
  },
  indicatorPctCnt: {
    fontSize: 12,
    color: '#a3a7ab',
  },
  // Footer styles
  footer: {
    paddingTop: 24,
    paddingBottom: 38,
    paddingHorizontal: 16,
    backgroundColor: '#222',
  },
  footCs: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  footCsDt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footCsIcon: {
    width: 24,
    height: 24,
    marginRight: 4,
  },
  footCsTitle: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 28,
    fontWeight: '600',
  },
  footCsDd: {
    flex: 1,
    alignItems: 'flex-end',
  },
  footCsTel: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 28,
    fontWeight: '700',
  },
  footCsEmail: {
    color: '#fff',
    marginTop: 2,
    fontSize: 14,
    lineHeight: 28,
    fontWeight: '700',
  },
  footCsTime: {
    marginTop: 10,
    color: '#fff',
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.7,
  },
  footLogoSns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 30,
    paddingTop: 24,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(224, 225, 226, 0.1)',
  },
  footSns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  snsIcon: {
    width: 28,
    height: 28,
    marginLeft: 14,
  },
  footCon: {
    paddingVertical: 24,
    paddingHorizontal: 4,
  },
  footMenu: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footMenuItem: {
    marginRight: 12,
  },
  footMenuText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 21,
  },
  footLinkBox: {
    position: 'relative',
    paddingTop: 16,
    paddingRight: 40,
  },
  footLink: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footLinkItem: {
    marginRight: 12,
  },
  footLinkText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 24,
  },
  footCertified: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 61,
  },
  footDescBox: {
    paddingTop: 22,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(224, 225, 226, 0.1)',
  },
  footDesc1: {
    color: '#a3a7ab',
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.7,
    fontWeight: '400',
  },
  footDesc2: {
    marginTop: 11,
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.7,
    fontWeight: '400',
  },
  // Popup styles
  popupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#222',
    opacity: 0.7,
  },
  popupWrapper: {
    width: '100%',
    paddingHorizontal: 15,
    zIndex: 1,
  },
  popupBox: {
    backgroundColor: '#fff',
    borderRadius: 0,
    overflow: 'hidden',
  },
  popupSwiperContainer: {
    position: 'relative',
    height: 470,
  },
  popupSlide: {
    width: SCREEN_WIDTH - 30,
    height: 470,
    flex: 1,
  },
  popupImage: {
    width: '100%',
    height: 470,
  },
  popupPagination: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'absolute',
    top: 15,
    right: 15,
    left: 'auto',
    bottom: 'auto',
  },
  popupPaginationDot: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#e0e1e2',
    marginLeft: 8,
  },
  popupPaginationDotActive: {
    backgroundColor: '#fff',
  },
  popupBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 10,
    backgroundColor: '#fff',
  },
  popupCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
  },
  popupCheckboxIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  popupCheckboxText: {
    fontSize: 15,
    color: '#393f44',
  },
  popupCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popupCloseIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  popupCloseText: {
    fontSize: 15,
    color: '#393f44',
  },
});

export default MainScreen;
