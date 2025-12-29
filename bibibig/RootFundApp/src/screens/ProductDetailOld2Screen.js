import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Clipboard,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import { getWebViewPretendardCss } from '../utils/webviewPretendard';
import AppModal from '../components/AppModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// HTML을 WebView에서 렌더링하기 위한 래퍼 함수
const createHtmlContent = htmlContent => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
      <style>
        ${getWebViewPretendardCss()}
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-size: 15px;
          line-height: 1.5;
          color: #666;
          padding: 16px;
          background-color: transparent;
          overflow-x: hidden;
        }
        p {
          margin-bottom: 10px;
          font-size: 15px;
          line-height: 22.5px;
        }
        strong {
          font-weight: 600;
          color: #333;
        }
        h1 {
          font-size: 20px;
          font-weight: 700;
          color: #333;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        h2 {
          font-size: 18px;
          font-weight: 700;
          color: #333;
          margin-top: 16px;
          margin-bottom: 8px;
        }
        h3 {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-top: 12px;
          margin-bottom: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 10px;
          border: 1px solid #f6f6f6;
        }
        th {
          padding: 10px;
          background-color: rgba(246, 246, 246, 0.5);
          color: #393f44;
          font-size: 15px;
          font-weight: 400;
          text-align: center;
          border: 1px solid #f6f6f6;
        }
        td {
          padding: 10px;
          color: #393f44;
          font-size: 15px;
          font-weight: 400;
          text-align: center;
          border: 1px solid #f6f6f6;
        }
        ul {
          padding-left: 20px;
          margin-top: 10px;
          margin-bottom: 10px;
        }
        li {
          font-size: 15px;
          line-height: 22.5px;
          color: #666;
          margin-bottom: 5px;
        }
        /* 탭 스타일 */
        .sub_tab {
          display: flex;
          border-bottom: 1px solid #e0e1e2;
          margin-bottom: 10px;
          list-style: none;
          padding: 0;
        }
        .sub_tab li {
          flex: 1;
          list-style: none;
          text-align: center;
          padding: 10px 0;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          color: #999;
          border-bottom: 3px solid transparent;
          margin-bottom: -1px;
          -webkit-tap-highlight-color: transparent;
        }
        .sub_tab li.on {
          color: #2c3db8;
          font-weight: 600;
          border-bottom-color: #2c3db8;
        }
        .tab_content {
          display: none;
          padding: 10px 0;
        }
        .tab_content.on {
          display: block;
        }
        /* re__product-content 탭 스타일 */
        .re__product-content__tab {
          display: flex;
          border-bottom: 1px solid #e0e1e2;
          margin-bottom: 10px;
          list-style: none;
          padding: 0;
        }
        .re__product-content__tab-item {
          flex: 1;
          text-align: center;
          padding: 10px 0;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          color: #999;
          border-bottom: 3px solid transparent;
          margin-bottom: -1px;
          -webkit-tap-highlight-color: transparent;
        }
        .re__product-content__tab-item.active {
          color: #2c3db8;
          font-weight: 600;
          border-bottom-color: #2c3db8;
        }
        .re__product-content__item {
          display: none;
          padding: 10px 0;
        }
        .re__product-content__item.visible {
          display: block;
        }
      </style>
      <script>
        function updateHeight() {
          const height = document.body.scrollHeight;
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: height }));
          }
        }
        
        $(function(){
          // re__product-content 탭 처리
          $(".re__product-content__tab-item").click(function(){
            var rte_pcb = $(this).closest(".re__product-content__tab");
            $(rte_pcb).children(".re__product-content__tab-item").removeClass("active");
            $(this).addClass("active");
            
            var rte_chindex = $(this).data("index");
            $(this).closest(".re__product-content__box").children(".re__product-content__item").removeClass("visible");
            $(this).closest(".re__product-content__box").children(".re__product-content__item").eq(rte_chindex).addClass("visible");
            
            // 높이 업데이트
            setTimeout(updateHeight, 100);
          });
          
          // 첫 번째 탭 활성화
          $(".re__product-content__tab").each(function() {
            $(this).children(".re__product-content__tab-item").first().click();
          });
          
          // 기존 sub_tab 처리
          $(".sub_tab li").click(function(e) {
            e.preventDefault();
            
            var $parent = $(this).closest('.sub_tab');
            $parent.find('li').removeClass('on');
            $(this).addClass('on');
            
            var index = $(this).index();
            var $contentParent = $parent.parent();
            $contentParent.find('.tab_content').removeClass('on');
            $contentParent.find('.tab_content').eq(index).addClass('on');
            
            setTimeout(updateHeight, 100);
          });
          
          // 첫 번째 sub_tab 활성화
          $(".sub_tab").each(function() {
            $(this).find('li').first().click();
          });
          
          // 초기 높이 설정
          setTimeout(updateHeight, 300);
        });
        
        // 이미지 로드 후 높이 재계산
        $(window).on('load', function() {
          setTimeout(updateHeight, 500);
        });
      </script>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;
};

const ProductDetailOld2Screen = ({ navigation, route }) => {
  const { orderKey } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    status: true,
    evidence: true,
    protect: true,
  });

  // WebView 높이 상태
  const [webViewHeights, setWebViewHeights] = useState({
    contents1: 300,
    contents2: 300,
    contents3: 300,
  });

  // 수익 계산 모달 상태
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [calcPrice, setCalcPrice] = useState('1000000');
  const [calcResult, setCalcResult] = useState({
    totalProfit: 0,
    totalInterest: 0,
    totalTax: 0,
    totalComm: 0,
    schedule: [],
  });
  const [expandedSchedule, setExpandedSchedule] = useState({});
  const [estimatedProfit, setEstimatedProfit] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (orderKey) {
      loadProductDetail();
    }
    checkLoginStatus();
  }, [orderKey]);

  useEffect(() => {
    // 화면이 포커스될 때 로그인 상태만 확인 (상품 정보는 재로드하지 않음)
    const unsubscribe = navigation.addListener('focus', () => {
      checkLoginStatus();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (productData && productData.prod && productData.option) {
      calculateEstimatedProfit();
    }
  }, [productData]);

  // 100만원 기준 예상 수익 계산 (calculateInterest와 동일한 로직)
  const calculateEstimatedProfit = () => {
    if (!productData || !productData.prod || !productData.option) return;

    const prod = productData.prod;
    const option = productData.option;

    let tBal = 0;
    let tInt = 0;
    let tTax = 0;
    let tComm = 0;

    const sort = prod.sort;
    const rpType = prod.repay_type;
    const rate = Number(prod.rate);
    const dRate = rate / 100 / 365;
    const price = 1000000; // 100만원 고정
    const period = Number(prod.period);
    const comm = Number(option.i_comm_1 || 0);
    const dComm = comm / 100 / 365;
    const iTaxPer = Number(option.i_tax || 0);
    const rTaxPer = Number(option.r_tax || 0);
    let startDate = getCurrentDate();

    tBal = price;
    const rp1Rp = Math.floor(tBal / period);

    for (let i = 1; i <= period; i++) {
      let endDate;

      if (sort === 'BRIDGE' || sort === 'bridge') {
        endDate = addMonths(startDate, 1);
      } else if (sort === 'PF' || sort === 'pf') {
        endDate = addMonths(startDate, 3);
      } else {
        endDate = addMonths(startDate, 3);
      }

      const diffDt = calcDateDiff(startDate, endDate) - 1;

      let rp = 0;
      if (i === period) {
        rp = tBal;
      } else {
        if (rpType === '1') {
          rp = rp1Rp;
        }
      }

      const ri = tBal * dRate * diffDt;
      const rti = Math.floor((ri * (iTaxPer / 100)) / 10) * 10;
      const rtr = Math.floor((ri * (rTaxPer / 100)) / 10) * 10;
      const rc = price * dComm * diffDt;

      rp = Math.floor(rp);
      const riFloor = Math.floor(ri);
      const rcFloor = Math.floor(rc);

      startDate = endDate;
      tInt += riFloor;
      tTax += rti + rtr;
      tComm += rcFloor;
      tBal = tBal - rp;
    }

    const rsInterestTotal = Number(tInt) - Number(tTax) - Number(tComm);
    setEstimatedProfit(rsInterestTotal);
  };

  const checkLoginStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const userToken = await AsyncStorage.getItem('userToken');
      setIsLoggedIn(!!(userData && userToken));
      console.log('로그인 상태:', !!(userData && userToken));
    } catch (error) {
      console.error('로그인 상태 확인 오류:', error);
      setIsLoggedIn(false);
    }
  };

  const loadProductDetail = async () => {
    try {
      setLoading(true);
      console.log('📦 상품 상세 조회 시작 (Old2) - orderKey:', orderKey);

      const response = await ApiService.api.get(
        `/app/product/detail/${orderKey}`,
      );

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

  const toggleSection = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleSchedule = index => {
    setExpandedSchedule(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // 날짜 계산 함수들 (ProductDetailScreen과 동일)
  const getCurrentDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDateString = date => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const addMonths = (targetDate, months) => {
    const dArr = targetDate.split('-');
    const tDate = new Date(dArr[0], Number(dArr[1]) - 1, dArr[2]);
    tDate.setMonth(tDate.getMonth() + months);
    return getDateString(tDate);
  };

  const calcDateDiff = (startDt, endDt) => {
    const sdArr = startDt.split('-');
    const edArr = endDt.split('-');
    const sDate = new Date(sdArr[0], Number(sdArr[1]) - 1, sdArr[2]);
    const eDate = new Date(edArr[0], Number(edArr[1]) - 1, edArr[2]);
    const diffDt = (eDate.getTime() - sDate.getTime()) / 1000 / 60 / 60 / 24;
    return diffDt;
  };

  const calculateInterest = () => {
    if (!productData || !prod || !option) return;

    let tBal = 0;
    let tRrp = 0;
    let tInt = 0;
    let tTax = 0;
    let tComm = 0;

    const sort = prod.sort;
    const rpType = prod.repay_type;
    const rate = Number(prod.rate);
    const dRate = rate / 100 / 365;
    let price = calcPrice.replace(/,/g, '');
    price = Number(price);
    const period = Number(prod.period);
    const comm = Number(option.i_comm_1 || 0);
    const dComm = comm / 100 / 365;
    const iTaxPer = Number(option.i_tax || 0);
    const rTaxPer = Number(option.r_tax || 0);
    let startDate = getCurrentDate();

    tBal = price;
    const rp1Rp = Math.floor(tBal / period);
    const schedule = [];

    for (let i = 1; i <= period; i++) {
      let endDate;

      if (sort === 'BRIDGE' || sort === 'bridge') {
        endDate = addMonths(startDate, 1);
      } else if (sort === 'PF' || sort === 'pf') {
        endDate = addMonths(startDate, 3);
      } else {
        endDate = addMonths(startDate, 3);
      }

      const diffDt = calcDateDiff(startDate, endDate) - 1;

      let rp = 0;
      if (i === period) {
        rp = tBal;
      } else {
        if (rpType === '1') {
          rp = rp1Rp;
        }
      }

      const ri = tBal * dRate * diffDt;
      const rti = Math.floor((ri * (iTaxPer / 100)) / 10) * 10;
      const rtr = Math.floor((ri * (rTaxPer / 100)) / 10) * 10;
      const rc = price * dComm * diffDt;

      rp = Math.floor(rp);
      const riFloor = Math.floor(ri);
      const rcFloor = Math.floor(rc);

      const rrp = rp + riFloor - (rti + rtr + rcFloor);
      const rrpFloor = Math.floor(rrp);

      schedule.push({
        round: i,
        afterTax: rrpFloor,
        paymentDate: endDate,
        principal: rp,
        interest: riFloor,
        incomeTax: rti,
        residentTax: rtr,
        commission: rcFloor,
        actualPayment: rrpFloor,
      });

      startDate = endDate;
      tRrp += rrpFloor;
      tInt += riFloor;
      tTax += rti + rtr;
      tComm += rcFloor;
      tBal = tBal - rp;
    }

    const rsInterestTotal = Number(tInt) - Number(tTax) - Number(tComm);

    setCalcResult({
      totalProfit: rsInterestTotal,
      totalInterest: tInt,
      totalTax: tTax,
      totalComm: tComm,
      schedule: schedule,
    });
  };

  const formatNumber = num => {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleCalcPriceChange = text => {
    const numOnly = text.replace(/[^0-9]/g, '');
    setCalcPrice(numOnly);
  };

  const handleShareUrl = () => {
    // 커스텀 스킴 사용 - 앱이 설치된 기기에서만 작동
    const url = `rootfund://product/${orderKey}`;
    Clipboard.setString(url);
    Alert.alert(
      '알림',
      'URL이 복사되었습니다.\n앱이 설치된 기기에서만 열립니다.',
    );
  };

  const handleGoToInvestList = async () => {
    const currentUser = await ApiService.getCurrentUser();
    const memberId = currentUser?.session?.member_id || currentUser?.id;

    navigation.navigate('MyPage', {
      user: currentUser,
      member_id: memberId,
      initialTab: 'invest',
    });
  };

  const handleLogin = () => {
    console.log('로그인하기 클릭');
    navigation.navigate('Login', {
      returnTo: 'ProductDetailOld2',
      returnParams: { orderKey },
    });
  };

  const renderInvestButton = () => {
    // 로그인하지 않은 경우
    if (!isLoggedIn) {
      return (
        <TouchableOpacity
          style={[styles.btnStyle, styles.btnBlue]}
          onPress={handleLogin}
        >
          <Text style={styles.btnText}>로그인하기</Text>
        </TouchableOpacity>
      );
    }

    // 로그인한 경우 - 투자현황 바로가기만 표시
    return (
      <TouchableOpacity
        style={[styles.btnStyle, styles.btnBlue]}
        onPress={handleGoToInvestList}
      >
        <Text style={styles.btnText}>투자현황 바로가기</Text>
      </TouchableOpacity>
    );
  };

  const renderOrderTypeIcon = orderType => {
    const iconMap = {
      태양광: require('../assets/images/img_product01_s.png'),
      풍력: require('../assets/images/img_product02_s.png'),
      ESS: require('../assets/images/img_product03_s.png'),
      전기차충전소: require('../assets/images/img_product03_s.png'),
    };

    const icon = iconMap[orderType];
    if (!icon) return null;

    return <Image source={icon} style={styles.sImg} resizeMode="contain" />;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3db8" />
        </View>
      </View>
    );
  }

  if (!productData) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            상품 정보를 불러올 수 없습니다.
          </Text>
        </View>
      </View>
    );
  }

  const {
    prod,
    option,
    contents,
    expertopinion,
    expert_file,
    circle_thumbnail,
    file_thumbnail,
    completion,
    summary,
    schedule,
    intro,
    structure,
    structure_file,
    place,
    place_file,
    borrower,
    invest,
    invest_file,
    protect,
    risk,
    caution,
    file_attachment,
  } = productData;

  return (
    <View style={styles.container}>
      {/* Back 버튼과 공유 버튼 */}
      <View style={styles.topButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require('../assets/images/ico_back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={handleShareUrl}>
          <Image
            source={require('../assets/images/ico_share_m.png')}
            style={styles.shareIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.productView}>
          {/* 상품 번호 */}
          <Text style={styles.prdNum}>
            {prod.orderType} {prod.orderNum}호 [{prod.orderCode}]
          </Text>

          {/* 상품명 */}
          <Text style={styles.prdName}>{prod.orderName}</Text>

          {/* 모집기간 */}
          <Text style={styles.prdDate}>
            모집기간 {prod.start_date}({prod.start_week}) ~ {prod.end_date}(
            {prod.end_week})
          </Text>

          {/* 이미지 박스 */}
          <View style={styles.prdImgboxWrap}>
            <View style={styles.prdImgbox}>
              {circle_thumbnail && circle_thumbnail.length > 0 ? (
                <>
                  <Image
                    source={{ uri: circle_thumbnail[0].filePath }}
                    style={styles.img}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay} />
                </>
              ) : file_thumbnail && file_thumbnail.length > 0 ? (
                <>
                  <Image
                    source={{ uri: file_thumbnail[0].filePath }}
                    style={styles.img}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay} />
                </>
              ) : (
                <>
                  <Image
                    source={require('../assets/images/re_bc5_custom.png')}
                    style={styles.img}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay} />
                </>
              )}
            </View>
            {renderOrderTypeIcon(prod.orderType)}
          </View>

          {/* 진행률 그룹 */}
          <View style={styles.progressGroup}>
            <View style={styles.flexDl}>
              <View style={styles.dl}>
                <Text style={styles.dt}>연 수익률</Text>
                <Text style={styles.dd}>{prod.rate}%</Text>
              </View>
              <View style={styles.dl}>
                <Text style={styles.dt}>투자기간</Text>
                <Text style={styles.dd}>{prod.period_text}개월</Text>
              </View>
              <View style={styles.dl}>
                <Text style={styles.dt}>상환방식</Text>
                <Text style={[styles.dd, styles.small]}>
                  {prod.repay_type === '1'
                    ? '원금균등상환'
                    : prod.repay_type === '2'
                    ? '만기일시상환'
                    : prod.repay_type === '3'
                    ? '원리금균등상환'
                    : '-'}
                </Text>
              </View>
            </View>

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
                <Text style={styles.totalEm}>
                  {parseInt(prod.investment || 0).toLocaleString()}원
                </Text>
                {' / '}
                {parseInt(prod.price || 0).toLocaleString()}원
              </Text>
              <Text style={styles.pctText}>{prod.percent}%</Text>
            </View>
          </View>

          {/* 투자하기 버튼 */}
          <View style={styles.btnBox}>{renderInvestButton()}</View>

          {/* 전문가 의견 */}
          {expertopinion && expertopinion.note && (
            <Text style={styles.prdExpert}>
              {expertopinion.note.replace(/\n/g, '\n')}
            </Text>
          )}

          {/* 수익 안내 박스 */}
          <View style={styles.detailIntrobox}>
            <View style={styles.detailIntro}>
              <Image
                source={require('../assets/images/bg_detail_intro.png')}
                style={styles.detailIntroBg}
                resizeMode="contain"
              />
              <Text style={styles.title}>
                100만원 투자하면{'\n'}
                <Text style={styles.titleEm}>
                  세후 {formatNumber(estimatedProfit)}원
                </Text>
                이 쌓여요
              </Text>

              <View style={styles.revenueDl}>
                <Text style={styles.revenueDt}>세전 수익률</Text>
                <Text style={styles.revenueDd}>{prod.rate || '-'}%</Text>
                <Text style={styles.revenueDt}>순수 수익률</Text>
                <Text style={styles.revenueDd}>{contents?.etxt_7 || '-'}</Text>
              </View>

              <TouchableOpacity
                style={styles.btnStyleSmall}
                onPress={() => {
                  setShowCalcModal(true);
                  calculateInterest();
                }}
              >
                <Text style={styles.btnTextSmall}>수익금 지급 예정표</Text>
              </TouchableOpacity>
            </View>

            {/* 환경적 성과 */}
            {contents &&
              contents.etxt_2 &&
              contents.etxt_4 &&
              contents.etxt_5 && (
                <View style={styles.detailEco}>
                  <Text style={styles.titleEco}>환경적 성과까지 함께!</Text>
                  <View style={styles.ecoList}>
                    <View style={styles.ecoItem}>
                      <View style={styles.ecoImgbox}>
                        <Image
                          source={require('../assets/images/ico_detail_eco01.png')}
                          style={styles.ecoIcon1}
                          resizeMode="contain"
                        />
                      </View>
                      <Text style={styles.ecoTit}>연간 전력생산</Text>
                      <Text style={styles.ecoVal}>{contents.etxt_2}</Text>
                    </View>
                    <View style={styles.ecoItem}>
                      <View style={styles.ecoImgbox}>
                        <Image
                          source={require('../assets/images/ico_detail_eco02.png')}
                          style={styles.ecoIcon2}
                          resizeMode="contain"
                        />
                      </View>
                      <Text style={styles.ecoTit}>화석 에너지</Text>
                      <Text style={styles.ecoVal}>{contents.etxt_4} 대체</Text>
                    </View>
                    <View style={styles.ecoItem}>
                      <View style={styles.ecoImgbox}>
                        <Image
                          source={require('../assets/images/ico_detail_eco03.png')}
                          style={styles.ecoIcon3}
                        />
                      </View>
                      <Text style={styles.ecoTit}>대기 오염물질</Text>
                      <Text style={styles.ecoVal}>{contents.etxt_5} 감소</Text>
                    </View>
                  </View>
                </View>
              )}
          </View>

          {/* 안내 문구 */}
          <View style={styles.mt16pr20pl20}>
            <Text style={styles.starNotif}>
              * 플랫폼 이용료(월 0.1%), 세금(개인15.4% 기준) 제외한 순 수익금
            </Text>
            <Text style={styles.starNotif}>
              * 위 상환계획은 모집 완료시점과 대출 실행 일정에 따라서 변경될 수
              있습니다.
            </Text>
            <Text style={styles.starNotif}>
              * 또한 중도상환, 연체 등으로 지급일자와 지급액에 차이가 있을 수
              있습니다.
            </Text>
          </View>

          {/* 투자 개요 토글박스 */}
          <View style={styles.detailTogglebox}>
            <TouchableOpacity
              style={[
                styles.inTitle,
                expandedSections.overview && styles.inTitleOn,
              ]}
              onPress={() => toggleSection('overview')}
            >
              <Text style={styles.inTitleText}>투자 개요</Text>
            </TouchableOpacity>

            {expandedSections.overview && (
              <View style={styles.inCont}>
                {contents?.contents_1 ? (
                  <WebView
                    originWhitelist={['*']}
                    source={{ html: createHtmlContent(contents.contents_1) }}
                    style={[
                      styles.webView,
                      { height: webViewHeights.contents1 },
                    ]}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    onMessage={event => {
                      try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'height' && data.height) {
                          setWebViewHeights(prev => ({
                            ...prev,
                            contents1: data.height + 20,
                          }));
                        }
                      } catch (e) {
                        console.log('WebView message parse error:', e);
                      }
                    }}
                  />
                ) : null}
              </View>
            )}
          </View>

          {/* 사업 현황 토글박스 */}
          <View style={styles.detailTogglebox}>
            <TouchableOpacity
              style={[
                styles.inTitle,
                expandedSections.status && styles.inTitleOn,
              ]}
              onPress={() => toggleSection('status')}
            >
              <Text style={styles.inTitleText}>사업 현황</Text>
            </TouchableOpacity>

            {expandedSections.status && (
              <View style={styles.inCont}>
                {contents?.contents_2 ? (
                  <WebView
                    originWhitelist={['*']}
                    source={{ html: createHtmlContent(contents.contents_2) }}
                    style={[
                      styles.webView,
                      { height: webViewHeights.contents2 },
                    ]}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    onMessage={event => {
                      try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'height' && data.height) {
                          setWebViewHeights(prev => ({
                            ...prev,
                            contents2: data.height + 20,
                          }));
                        }
                      } catch (e) {
                        console.log('WebView message parse error:', e);
                      }
                    }}
                  />
                ) : null}
              </View>
            )}
          </View>

          {/* 증빙서류 토글박스 */}
          <View style={styles.detailTogglebox}>
            <TouchableOpacity
              style={[
                styles.inTitle,
                expandedSections.evidence && styles.inTitleOn,
              ]}
              onPress={() => toggleSection('evidence')}
            >
              <Text style={styles.inTitleText}>증빙서류</Text>
            </TouchableOpacity>

            {expandedSections.evidence && (
              <View style={styles.inCont}>
                <View style={styles.docEvidence}>
                  {file_attachment &&
                    file_attachment.map((file, index) => (
                      <TouchableOpacity key={index} style={styles.fileLink}>
                        <Text style={styles.fileLinkText}>{file.fileName}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}
          </View>

          {/* 강화된 투자자 보호 방안 토글박스 */}
          <View style={[styles.detailTogglebox, styles.mb40]}>
            <TouchableOpacity
              style={[
                styles.inTitle,
                expandedSections.protect && styles.inTitleOn,
              ]}
              onPress={() => toggleSection('protect')}
            >
              <Text style={styles.inTitleText}>강화된 투자자 보호 방안</Text>
            </TouchableOpacity>

            {expandedSections.protect && (
              <View style={styles.inCont}>
                {contents?.contents_3 ? (
                  <WebView
                    originWhitelist={['*']}
                    source={{ html: createHtmlContent(contents.contents_3) }}
                    style={[
                      styles.webView,
                      { height: webViewHeights.contents3 },
                    ]}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    onMessage={event => {
                      try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'height' && data.height) {
                          setWebViewHeights(prev => ({
                            ...prev,
                            contents3: data.height + 20,
                          }));
                        }
                      } catch (e) {
                        console.log('WebView message parse error:', e);
                      }
                    }}
                  />
                ) : null}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 수익 계산 모달 (ProductDetailScreen과 동일) */}
      <AppModal
        visible={showCalcModal}
        title="예상 수익계산"
        onClose={() => setShowCalcModal(false)}
        primaryAction={{
          text: '확인',
          onPress: () => setShowCalcModal(false),
        }}
      >
        <View style={styles.pr4pl4}>
                  <View style={styles.flexTit}>
                    <Text style={styles.titText}>투자예정 금액</Text>
                  </View>
                  <View style={styles.flexInput}>
                    <TextInput
                      style={styles.textInput}
                      value={formatNumber(calcPrice)}
                      onChangeText={handleCalcPriceChange}
                      keyboardType="numeric"
                    />
                    <Text style={styles.txtUnit}>원</Text>
                    <TouchableOpacity
                      style={styles.btnCalc}
                      onPress={calculateInterest}
                    >
                      <Text style={styles.btnCalcText}>계산하기</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.hrLine} />

                <View style={styles.boxCalc}>
                  <View style={styles.dlTotal}>
                    <Text style={styles.dtTotal}>예상 투자수익</Text>
                    <Text style={styles.ddTotal}>
                      {formatNumber(calcResult.totalProfit)} 원
                    </Text>
                  </View>
                  <View style={styles.dlModal}>
                    <Text style={styles.dtModal}>세전 총 수익</Text>
                    <Text style={styles.ddModal}>
                      {formatNumber(calcResult.totalInterest)} 원
                    </Text>
                  </View>
                  <View style={styles.dlModal}>
                    <Text style={styles.dtModal}>세금(이자소득세+주민세)</Text>
                    <Text style={styles.ddModal}>
                      {formatNumber(calcResult.totalTax)} 원
                    </Text>
                  </View>
                  <View style={styles.dlModal}>
                    <Text style={styles.dtModal}>플랫폼 수수료</Text>
                    <Text style={styles.ddModal}>
                      {formatNumber(calcResult.totalComm)} 원
                    </Text>
                  </View>
                </View>

                <Text style={styles.repayTit}>상환 스케줄</Text>
                <View style={styles.repayList}>
                  {calcResult.schedule.map((item, index) => (
                    <View key={index} style={styles.repayItem}>
                      <TouchableOpacity
                        style={[
                          styles.inHead,
                          expandedSchedule[index] && styles.inHeadOn,
                        ]}
                        onPress={() => toggleSchedule(index)}
                      >
                        <Text style={styles.inHeadDt}>{item.round}회차</Text>
                        <Text style={styles.inHeadDd}>
                          세후{' '}
                          <Text style={styles.cnt}>
                            {formatNumber(item.afterTax)}
                          </Text>{' '}
                          원
                        </Text>
                        <Image
                          source={require('../assets/images/arrow_select.png')}
                          style={[
                            styles.scheduleArrow,
                            expandedSchedule[index] &&
                              styles.scheduleArrowRotated,
                          ]}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>

                      {expandedSchedule[index] && (
                        <View style={styles.inContModal}>
                          <View style={styles.dlRow}>
                            <Text style={styles.dtRow}>지급일</Text>
                            <Text style={styles.ddRow}>{item.paymentDate}</Text>
                          </View>
                          <View style={styles.dlRow}>
                            <Text style={styles.dtRow}>원금</Text>
                            <Text style={styles.ddRow}>
                              {formatNumber(item.principal)} 원
                            </Text>
                          </View>
                          <View style={styles.dlRow}>
                            <Text style={styles.dtRow}>이자</Text>
                            <Text style={styles.ddRow}>
                              {formatNumber(item.interest)} 원
                            </Text>
                          </View>
                          <View style={styles.dlRow}>
                            <Text style={styles.dtRow}>이자소득세</Text>
                            <Text style={styles.ddRow}>
                              {formatNumber(item.incomeTax)} 원
                            </Text>
                          </View>
                          <View style={styles.dlRow}>
                            <Text style={styles.dtRow}>주민세</Text>
                            <Text style={styles.ddRow}>
                              {formatNumber(item.residentTax)} 원
                            </Text>
                          </View>
                          <View style={styles.dlRow}>
                            <Text style={styles.dtRow}>플랫폼수수료</Text>
                            <Text style={styles.ddRow}>
                              {formatNumber(item.commission)} 원
                            </Text>
                          </View>
                          <View style={styles.dlRow}>
                            <Text style={styles.dtRow}>실지급액</Text>
                            <Text style={styles.ddRow}>
                              {formatNumber(item.actualPayment)} 원
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
        </View>

        <View style={styles.flexText}>
          <Text style={styles.excIcon}>ⓘ</Text>
          <Text style={styles.txtNote}>
            위 상환계획은 모집 완료시점과 대출 실행 일정에 따라서{'\n'}
            변경될 수 있습니다. 또한 중도상환, 연체 등으로 지급일자와
            {'\n'}
            지급액에 차이가 있을 수 있습니다.
          </Text>
        </View>
      </AppModal>
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
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
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
  productView: {
    flex: 1,
  },
  prdNum: {
    marginTop: 12,
    paddingHorizontal: 16,
    color: '#393f44',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    textAlign: 'center',
  },
  prdName: {
    marginTop: 8,
    paddingHorizontal: 16,
    fontSize: 26,
    lineHeight: 33.8,
    fontWeight: '700',
    textAlign: 'center',
    color: '#222',
  },
  prdDate: {
    marginTop: 10,
    paddingHorizontal: 16,
    color: '#a3a7ab',
    fontSize: 14,
    lineHeight: 16.6,
    fontWeight: '400',
    textAlign: 'center',
  },
  prdImgboxWrap: {
    position: 'relative',
    width: 102,
    height: 102,
    marginTop: 24,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  prdImgbox: {
    position: 'relative',
    width: 102,
    height: 102,
    overflow: 'hidden',
    borderRadius: 51,
  },
  img: {
    width: 102,
    height: 102,
    borderRadius: 51,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 51,
    zIndex: 1,
  },
  sImg: {
    position: 'absolute',
    right: -20,
    bottom: 2,
    height: 50,
    zIndex: 10,
  },
  progressGroup: {
    marginHorizontal: 30,
    marginTop: 30,
  },
  flexDl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dl: {
    flex: 1,
    alignItems: 'center',
  },
  dt: {
    fontSize: 13,
    lineHeight: 16.9,
    color: '#666',
    fontWeight: '400',
  },
  dd: {
    marginTop: 4,
    fontSize: 24,
    lineHeight: 27.8,
    fontWeight: '700',
    color: '#333',
  },
  small: {
    fontSize: 20,
  },
  progressBar: {
    height: 5,
    backgroundColor: '#e0e1e2',
    borderRadius: 2.5,
    marginTop: 16,
    marginBottom: 8,
    overflow: 'hidden',
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
  totalText: {
    fontSize: 12,
    color: '#666',
  },
  totalEm: {
    fontWeight: '600',
    color: '#333',
  },
  pctText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  btnBox: {
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  btnStyle: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnBlue: {
    backgroundColor: '#2c3db8',
  },
  btnGray: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  btnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  btnTextGray: {
    color: '#999',
  },
  prdExpert: {
    marginLeft: 5,
    paddingHorizontal: 16,
    color: '#393f44',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    textAlign: 'left',
  },
  detailIntrobox: {
    marginHorizontal: 16,
    marginTop: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    backgroundColor: '#fff',
  },
  detailIntro: {
    position: 'relative',
    padding: 20,
    overflow: 'hidden',
  },
  detailIntroBg: {
    position: 'absolute',
    right: 5,
    top: 0,
    width: 260,
    height: 260,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  titleEm: {
    color: '#197cff',
  },
  revenueDl: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  revenueDt: {
    width: 84,
    marginTop: 8,
    color: '#666',
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
  },
  revenueDd: {
    width: SCREEN_WIDTH - 32 - 40 - 84,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '600',
  },
  btnStyleSmall: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 15,
    backgroundColor: 'transparent',
  },
  btnTextSmall: {
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
    color: '#222',
  },
  detailEco: {
    padding: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f6f6f6',
  },
  titleEco: {
    fontSize: 17,
    lineHeight: 22.1,
    fontWeight: '600',
  },
  ecoList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  ecoItem: {
    alignItems: 'center',
  },
  ecoImgbox: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ecoIcon1: {
    width: 17,
  },
  ecoIcon2: {
    width: 26,
  },
  ecoIcon3: {
    width: 30,
  },
  ecoTit: {
    marginTop: 10,
    color: '#666',
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
  },
  ecoVal: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '600',
  },
  mt16pr20pl20: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  starNotif: {
    position: 'relative',
    paddingLeft: 7,
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
    letterSpacing: -0.39,
    textIndent: -7,
    marginTop: 2,
  },
  detailInfobox: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 30,
    padding: 20,
    paddingBottom: 100,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    backgroundColor: '#fff',
    height: 300,
  },
  infoTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  detailInfotab: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20,
    paddingBottom: 10,
  },
  infotabItem: {
    flex: 1,
    opacity: 0.5,
    paddingHorizontal: 4,
  },
  infotabItemActive: {
    opacity: 1,
  },
  infotabInbox: {
    position: 'relative',
    minHeight: 80,
    paddingTop: 20,
    paddingHorizontal: 5,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 10,
    alignItems: 'center',
  },
  infotabInboxActive: {
    borderColor: '#2c3db8',
  },
  diType: {
    position: 'absolute',
    top: -10,
    left: '60%',
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: '#2c3db8',
    color: '#fff',
    fontSize: 11,
    lineHeight: 18,
    fontWeight: '500',
    transform: [{ translateX: -30 }],
  },
  infotabImgbox: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infotabImg: {
    width: 42,
  },
  infotabTit: {
    marginTop: 5,
    fontSize: 17,
    lineHeight: 23.8,
    fontWeight: '900',
  },
  infotabTag: {
    marginTop: 4,
    marginBottom: 10,
    color: '#666',
    fontSize: 11,
    lineHeight: 15.4,
    fontWeight: '400',
  },
  detailInfotabCon: {
    marginTop: 12,
    maxHeight: 800,
  },
  numtit: {
    position: 'relative',
    marginTop: 20,
    paddingLeft: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  num: {
    position: 'absolute',
    top: 3,
    left: 0,
    minWidth: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#2c3db8',
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  numtitText: {
    color: '#2c3db8',
    fontSize: 17,
    lineHeight: 22.1,
    fontWeight: '700',
  },
  txt: {
    marginTop: 10,
    color: '#393f44',
    fontSize: 15,
    lineHeight: 22.5,
    fontWeight: '600',
  },
  detailTogglebox: {
    marginTop: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 0,
    elevation: 1,
  },
  inTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 55,
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  inTitleOn: {
    // 확장 상태
  },
  inTitleText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  inCont: {
    // 컨텐츠 영역
  },
  expertBox: {
    padding: 20,
    paddingBottom: 24,
  },
  expertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expertImgbox: {
    marginRight: 8,
  },
  expertImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  expertTxtbox: {
    flex: 1,
  },
  expertName: {
    color: '#393f44',
    fontSize: 12,
    lineHeight: 15.6,
  },
  expertPos: {
    color: '#bfc3c7',
    fontSize: 12,
    lineHeight: 15.6,
  },
  expertTxt: {
    marginTop: 16,
    color: '#666',
    fontSize: 15,
    lineHeight: 22.5,
  },
  contentWrap: {
    padding: 10,
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  webView: {
    width: SCREEN_WIDTH,
    minHeight: 300,
    backgroundColor: 'transparent',
  },
  imgbox: {
    paddingBottom: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imgboxImage: {
    width: '100%',
    height: 200,
  },
  tit: {
    paddingHorizontal: 4,
    marginTop: 20,
    color: '#393f44',
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '700',
  },
  txts: {
    paddingHorizontal: 4,
    marginTop: 8,
  },
  txtsLi: {
    position: 'relative',
    paddingLeft: 9,
    color: '#666',
    fontSize: 15,
    lineHeight: 22.5,
  },
  subTab: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  subTab1: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabItemActive: {
    borderBottomColor: '#2c3db8',
  },
  subTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
  },
  subTabTextActive: {
    color: '#2c3db8',
    fontWeight: '600',
  },
  subTabWrapper: {
    position: 'relative',
    marginTop: -8,
  },
  subTabN: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    position: 'relative',
    zIndex: 1,
  },
  subTabLine: {
    position: 'absolute',
    bottom: 0,
    left: -15,
    right: -15,
    height: 1,
    backgroundColor: '#e0e1e2',
  },
  subTabItem1: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  subTabItemActive1: {
    borderBottomColor: '#2c3db8',
  },
  subTabText1: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
  },
  contentWrapN: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  docEvidence: {
    padding: 20,
  },
  fileLink: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  fileLinkText: {
    fontSize: 15,
    color: '#2c3db8',
    textDecorationLine: 'underline',
  },
  mb40: {
    marginBottom: 40,
  },
  // 모달 스타일
  popContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  popMask: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(34, 34, 34, 0.7)',
  },
  popWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  popBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  popTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  popTitleBorder: {
    height: 1,
    backgroundColor: '#f6f6f6',
    marginBottom: 20,
    marginHorizontal: -20,
  },
  popScrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  popScrollContent: {
    paddingBottom: 8,
  },
  pr4pl4: {
    paddingHorizontal: 4,
  },
  flexTit: {
    marginBottom: 8,
  },
  titText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  flexInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#333',
  },
  txtUnit: {
    marginLeft: 8,
    fontSize: 15,
    color: '#666',
  },
  btnCalc: {
    height: 44,
    paddingHorizontal: 16,
    marginLeft: 20,
    backgroundColor: '#2c3db8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCalcText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  hrLine: {
    height: 1,
    backgroundColor: '#e0e1e2',
    marginVertical: 20,
  },
  boxCalc: {
    paddingVertical: 16,
  },
  dlTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
    marginBottom: 12,
  },
  dtTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  ddTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#197cff',
  },
  dlModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dtModal: {
    fontSize: 14,
    color: '#666',
  },
  ddModal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  repayTit: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  repayList: {
    marginBottom: 20,
  },
  repayItem: {
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  inHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f6f6f6',
  },
  inHeadOn: {
    backgroundColor: '#e8eeff',
  },
  inHeadDt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  inHeadDd: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginLeft: 12,
  },
  scheduleArrow: {
    width: 12,
    height: 12,
    marginLeft: 8,
  },
  scheduleArrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
  cnt: {
    fontWeight: '700',
    color: '#2c3db8',
  },
  inContModal: {
    padding: 16,
    backgroundColor: '#fff',
  },
  dlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dtRow: {
    fontSize: 13,
    color: '#666',
  },
  ddRow: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  flexText: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  excIcon: {
    fontSize: 16,
    color: '#197cff',
    marginRight: 8,
    marginTop: 2,
  },
  txtNote: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#666',
  },
  btnBoxModal: {
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  btnStyleModal: {
    height: 48,
    backgroundColor: '#2c3db8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnTextModal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ProductDetailOld2Screen;
