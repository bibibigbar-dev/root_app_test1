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
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../components/Header';
import ApiService from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProductDetailScreen = ({ navigation, route }) => {
  const { orderKey } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [activeTab1, setActiveTab1] = useState(0); // 상품개요/사업개요
  const [activeTab2, setActiveTab2] = useState(0); // 차입자정보/담보사항
  const [activeTab3, setActiveTab3] = useState(0); // 투자 리스크/투자 유의사항
  const [expandedSections, setExpandedSections] = useState({
    invest: false,
    stability: false,
    caution: false,
  });
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [calcPrice, setCalcPrice] = useState('1000000');
  const [calcResult, setCalcResult] = useState({
    totalProfit: 0,
    totalInterest: 0,
    totalTax: 0,
    totalComm: 0,
    schedule: []
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
    // 화면이 포커스될 때마다 로그인 상태 확인 및 상품 정보 재로드
    const unsubscribe = navigation.addListener('focus', () => {
      checkLoginStatus();
      if (orderKey) {
        loadProductDetail();
      }
    });
    return unsubscribe;
  }, [navigation, orderKey]);

  useEffect(() => {
    if (productData && productData.prod && productData.option) {
      calculateEstimatedProfit();
    }
  }, [productData]);

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
      console.log('📦 상품 상세 조회 시작 - orderKey:', orderKey);
      
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleSchedule = (index) => {
    setExpandedSchedule(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // 날짜 계산 함수들
  const getCurrentDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDateString = (date) => {
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

  // 100만원 기준 예상 수익 계산
  const calculateEstimatedProfit = () => {
    if (!productData || !productData.prod || !productData.option) return;

    const prod = productData.prod;
    const option = productData.option;
    
    const price = 1000000; // 100만원 고정
    const rate = Number(prod.rate);
    const period = Number(prod.period);
    const comm = Number(option.i_comm_1 || 0);
    const iTaxPer = Number(option.i_tax || 0);
    
    // 총 이자 계산
    const totalInterest = Math.floor((price * rate * period) / 1200);
    
    // 세금 계산
    const tax = Math.floor(totalInterest * iTaxPer / 100);
    
    // 수수료 계산
    const commission = Math.floor((price * comm * period) / 1200);
    
    // 순수익 = 이자 - 세금 - 수수료
    const profit = totalInterest - tax - commission;
    
    setEstimatedProfit(profit);
  };

  // 수익 계산
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
    const dRate = (rate / 100) / 365;
    let price = calcPrice.replace(/,/g, '');
    price = Number(price);
    const period = Number(prod.period);
    const comm = Number(option.i_comm_1 || 0);
    const dComm = (comm / 100) / 365;
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
        // innovation 등
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

      const ri = (tBal * dRate) * diffDt;
      const rti = Math.floor((ri * (iTaxPer / 100)) / 10) * 10;
      const rtr = Math.floor((ri * (rTaxPer / 100)) / 10) * 10;
      const rc = (price * dComm) * diffDt;

      rp = Math.floor(rp);
      const riFloor = Math.floor(ri);
      const rcFloor = Math.floor(rc);

      const rrp = (rp + riFloor) - (rti + rtr + rcFloor);
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
        actualPayment: rrpFloor
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
      schedule: schedule
    });
  };

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleCalcPriceChange = (text) => {
    const numOnly = text.replace(/[^0-9]/g, '');
    setCalcPrice(numOnly);
  };

  const handleShareUrl = () => {
    // React Native에서는 실제 URL을 가져올 수 없으므로 orderKey를 기반으로 URL 생성
    const url = `https://rootenergy.co.kr/product/detail/${orderKey}`;
    Clipboard.setString(url);
    Alert.alert('알림', 'URL이 복사되었습니다.');
  };

  const handleInvestRequest = () => {
    console.log('투자하기 클릭');
    navigation.navigate('InvestRequest', {
      orderKey: orderKey,
      productData: productData
    });
  };

  const handleAreaProductRequest = () => {
    // TODO: 이웃신청하기 로직
    console.log('이웃신청하기 클릭');
  };

  const handleInvestCancelRequest = () => {
    // TODO: 투자 취소 로직
    console.log('투자 취소하기 클릭');
  };

  const handleGoToInvestList = () => {
    // TODO: 투자현황 페이지로 이동
    console.log('투자현황 바로가기 클릭');
    // navigation.navigate('InvestList');
  };

  const handleLogin = () => {
    console.log('로그인하기 클릭');
    navigation.navigate('Login', {
      returnTo: 'ProductDetail',
      returnParams: { orderKey }
    });
  };

  const renderOrderTypeIcon = (orderType) => {
    const iconMap = {
      '태양광': require('../assets/images/ico_status01.png'),
      '풍력': require('../assets/images/ico_status02.png'),
      'ESS': require('../assets/images/ico_status04.png'),
      '전기차충전소': require('../assets/images/ico_status03.png'),
    };
    
    const icon = iconMap[orderType];
    if (!icon) return null;
    
    return <Image source={icon} style={styles.statusIco} resizeMode="contain" />;
  };

  const renderSortTag = (sort) => {
    if (sort === 'bridge') {
      return (
        <View style={styles.overlapGroupWrapper}>
          <View style={styles.overlapGroup}>
            <Image source={require('../assets/images/ico_detail_infotab01.png')} style={styles.icoDetail} resizeMode="contain" />
            <Text style={styles.textWrapper}>수익집중</Text>
          </View>
        </View>
      );
    } else if (sort === 'pf') {
      return (
        <View style={styles.overlapGroupWrapper}>
          <View style={styles.overlapGroup}>
            <Image source={require('../assets/images/ico_detail_infotab02.png')} style={styles.icoDetail} resizeMode="contain" />
            <Text style={styles.textWrapper}>안정추구</Text>
          </View>
        </View>
      );
    } else if (sort === 'innovation') {
      return (
        <View style={styles.overlapGroupWrapper}>
          <View style={styles.overlapGroup}>
            <Image source={require('../assets/images/ico_detail_infotab03.png')} style={styles.icoDetail} resizeMode="contain" />
            <Text style={styles.textWrapper}>주민참여</Text>
          </View>
        </View>
      );
    }
    return null;
  };

  const renderInvestButton = () => {
    // 로그인하지 않은 경우
    if (!isLoggedIn) {
      return (
        <TouchableOpacity style={[styles.btnStyle, styles.btnBlue]} onPress={handleLogin}>
          <Text style={styles.btnText}>로그인하기</Text>
        </TouchableOpacity>
      );
    }

    // 로그인한 경우 checkInvest 값에 따라 버튼 변경
    const { checkInvest } = productData || {};
    
    switch (checkInvest) {
      case '0': // 투자 가능
        return (
          <TouchableOpacity style={[styles.btnStyle, styles.btnBlue]} onPress={handleInvestRequest}>
            <Text style={styles.btnText}>투자하기</Text>
          </TouchableOpacity>
        );
      case '22': // 이웃신청 필요
        return (
          <TouchableOpacity style={[styles.btnStyle, styles.btnBlue]} onPress={handleAreaProductRequest}>
            <Text style={styles.btnText}>이웃신청하기</Text>
          </TouchableOpacity>
        );
      case '4': // 투자대기
        return (
          <TouchableOpacity style={[styles.btnStyle, styles.btnGray]} disabled>
            <Text style={[styles.btnText, styles.btnTextGray]}>투자대기</Text>
          </TouchableOpacity>
        );
      case '8': // 투자 취소 가능
        return (
          <TouchableOpacity style={[styles.btnStyle, styles.btnBlue]} onPress={handleInvestCancelRequest}>
            <Text style={styles.btnText}>투자 취소 하기</Text>
          </TouchableOpacity>
        );
      default: // 그 외 (이미 투자한 경우)
        return (
          //<TouchableOpacity style={[styles.btnStyle, styles.btnBlue]} onPress={handleGoToInvestList}>
          //  <Text style={styles.btnText}>투자현황 바로가기</Text>
          //</TouchableOpacity>
          <TouchableOpacity style={[styles.btnStyle, styles.btnBlue]} onPress={handleInvestRequest}>
          <Text style={styles.btnText}>투자하기</Text>
        </TouchableOpacity>
        );
    }
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

  const { prod, option, contents, expertopinion, circle_thumbnail, file_thumbnail, summary, intro, borrower, invest, invest_file, risk, caution, checkInvest, ssoMemberId } = productData;
  const isNewDesign = prod.idx > 498;

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
        <View style={styles.productViewN}>
          {/* 상품 번호 */}
          <Text style={styles.prdNum}>{prod.orderType} {prod.orderNum}호 [{prod.orderCode}]</Text>
          
          {/* 상품명 */}
          <Text style={styles.prdName}>{prod.orderName}</Text>
          
          {/* 썸네일 박스 */}
          <View style={styles.box}>
            <View style={styles.group}>
              <View style={styles.thumbnail}>
                {circle_thumbnail && circle_thumbnail.length > 0 ? (
                  <>
                    <Image source={{ uri: circle_thumbnail[0].filePath }} style={styles.thumbnailImage} resizeMode="cover" />
                    <View style={styles.thumbnailOverlay} />
                  </>
                ) : file_thumbnail && file_thumbnail.length > 0 ? (
                  <>
                    <Image source={{ uri: file_thumbnail[0].filePath }} style={styles.thumbnailImage} resizeMode="cover" />
                    <View style={styles.thumbnailOverlay} />
                  </>
                ) : (
                  <>
                    <Image source={require('../assets/images/re_bc5_custom.png')} style={styles.thumbnailImage} resizeMode="cover" />
                    <View style={styles.thumbnailOverlay} />
                  </>
                )}
              </View>
              
              {/* 태그 */}
              {renderSortTag(prod.sort)}
              
              {/* 전문가 의견 */}
              {expertopinion && expertopinion.note && (
                <Text style={styles.div}>{expertopinion.note}</Text>
              )}
              
              {/* 모집기간 */}
              <Text style={styles.element}>
                모집기간 {prod.start_date}({prod.start_week}) ~ {prod.end_date}({prod.end_week})
              </Text>
            </View>
          </View>

          {/* 진행률 그룹 */}
          <View style={styles.progressGroup2}>
            {/* 첫 번째 줄: 라벨들 */}
            <View style={styles.flexDl}>
              <View style={styles.dl2}>
                <Text style={styles.dt2}>연 수익률</Text>
              </View>
              <View style={styles.dl2}>
                <Text style={styles.dt2}>투자기간</Text>
              </View>
              <View style={styles.dl2}>
                <Text style={styles.dt2}>상환방식</Text>
              </View>
            </View>
            
            {/* 두 번째 줄: 값들 */}
            <View style={styles.flexDl}>
              <View style={styles.dl2}>
                <Text style={styles.dd2}>{prod.rate}%</Text>
              </View>
              <View style={styles.dl2}>
                <Text style={styles.dd2}>{prod.period_text}개월</Text>
              </View>
              <View style={styles.dl2}>
                <Text style={[styles.dd3]}>
                  {prod.repay_type === '1' ? '원금균등상환' :
                   prod.repay_type === '2' ? '만기일시상환' :
                   prod.repay_type === '3' ? '원리금균등상환' : '-'}
                </Text>
              </View>
            </View>
          </View>

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
                <Text style={styles.totalEm}>{parseInt(prod.investment || 0).toLocaleString()}원</Text>
                {' / '}
                {parseInt(prod.price || 0).toLocaleString()}원
              </Text>
              <Text style={styles.pctText}>{prod.percent}%</Text>
            </View>
          </View>

          {/* 투자하기 버튼 */}
          <View style={styles.btnBox}>
            {renderInvestButton()}
          </View>

          {/* 수익 안내 박스 */}
          <View style={styles.detailIntrobox}>
            <View style={styles.detailIntro}>
              {/* 배경 이미지 */}
              <Image 
                source={require('../assets/images/bg_detail_intro.png')} 
                style={styles.detailIntroBg}
                resizeMode="contain"
              />
              
              <Text style={styles.title}>
                100만원 투자하면{'\n'}
                <Text style={styles.titleEm}>세후 {formatNumber(estimatedProfit)}원</Text>이 쌓여요
              </Text>
              
              <View style={styles.revenueDl}>
                <Text style={styles.revenueDt}>세전수익률</Text>
                <Text style={styles.revenueDd}>연 {prod.rate}%</Text>
                <Text style={styles.revenueDt}>순수익률</Text>
                <Text style={styles.revenueDd}>연 {prod.net_return || '-'}%</Text>
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
            {contents && contents.etxt_2 && contents.etxt_4 && contents.etxt_5 && (
              <View style={styles.detailEco}>
                <Text style={styles.titleEco}>환경적 성과까지 함께!</Text>
                <View style={styles.ecoList}>
                  <View style={styles.ecoItem}>
                    <View style={styles.ecoImgbox}>
                      <Image source={require('../assets/images/ico_detail_eco01.png')} style={styles.ecoIcon1} />
                    </View>
                    <Text style={styles.ecoTit}>연간 전력생산</Text>
                    <Text style={styles.ecoVal}>{contents.etxt_2}</Text>
                  </View>
                  <View style={styles.ecoItem}>
                    <View style={styles.ecoImgbox}>
                      <Image source={require('../assets/images/ico_detail_eco02.png')} style={styles.ecoIcon2} />
                    </View>
                    <Text style={styles.ecoTit}>화석 에너지</Text>
                    <Text style={styles.ecoVal}>{contents.etxt_4} 대체</Text>
                  </View>
                  <View style={styles.ecoItem}>
                    <View style={styles.ecoImgbox}>
                      <Image source={require('../assets/images/ico_detail_eco03.png')} style={styles.ecoIcon3} />
                    </View>
                    <Text style={styles.ecoTit}>대기 오염물질</Text>
                    <Text style={styles.ecoVal}>{contents.etxt_5} 감소</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* 상세 정보 박스 */}
          <View style={styles.detailBoxN}>
            <View style={styles.detailN}>
              <View style={styles.box1}>
                <View style={styles.group1}>
                  {/* 모집기간 */}
                  <View style={styles.overlapWrapper1}>
                    <View style={styles.overlapGroup1}>
                      <View style={styles.overlapGroup1Bg} />
                      <Image source={require('../assets/images/ic1.png')} style={styles.ic1} />
                      <Text style={styles.textWrapper1}>모집기간</Text>
                      <Text style={styles.div1}>{prod.start_date}{'\n'}~ {prod.end_date}</Text>
                    </View>
                  </View>
                  
                  {/* 투자기간 */}
                  <View style={styles.overlapWrapper1}>
                    <View style={styles.overlapGroup1}>
                      <View style={styles.overlapGroup1Bg} />
                      <Image source={require('../assets/images/ic2.png')} style={styles.ic1} />
                      <Text style={styles.textWrapper1}>투자기간</Text>
                      <Text style={styles.div1}>{prod.period_text}개월{'\n'}(365일)</Text>
                    </View>
                  </View>
                  
                  {/* 상환일자 */}
                  <View style={styles.overlapWrapper1}>
                    <View style={styles.overlapGroup1}>
                      <View style={styles.overlapGroup1Bg} />
                      <Image source={require('../assets/images/ic3.png')} style={styles.ic1} />
                      <Text style={styles.textWrapper1}>상환일자</Text>
                      <Text style={styles.div1}>{contents?.etxt_9 || '-'}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.note2}>* 상기일정은 변경될 수 있습니다.</Text>
              </View>
            </View>
          </View>

          {/* 투자 정보 토글박스 */}
          <View style={styles.detailTogglebox}>
            <TouchableOpacity 
              style={[styles.inTitle, expandedSections.invest && styles.inTitleOn]}
              onPress={() => toggleSection('invest')}
            >
              <Text style={styles.inTitleText}>투자 정보</Text>
              <Image 
                source={require('../assets/images/arrow_select.png')} 
                style={[styles.arrowIcon, expandedSections.invest && styles.arrowIconRotated]}
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            {expandedSections.invest && (
              <View style={styles.inCont}>
                {/* 탭 메뉴 */}
                <View style={styles.subTabWrapper}>
                  <View style={styles.subTabN}>
                    <TouchableOpacity 
                      style={[styles.subTabItem1, activeTab1 === 0 && styles.subTabItemActive1]}
                      onPress={() => setActiveTab1(0)}
                    >
                      <Text style={[styles.subTabText, activeTab1 === 0 && styles.subTabTextActive1]}>상품개요</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.subTabItem2, activeTab1 === 1 && styles.subTabItemActive2]}
                      onPress={() => setActiveTab1(1)}
                    >
                      <Text style={[styles.subTabText, activeTab1 === 1 && styles.subTabTextActive2]}>사업개요</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.subTabLine} />
                </View>
                
                {/* 상품개요 */}
                {activeTab1 === 0 && (
                  <View style={styles.contentWrapN}>
                    {summary && summary.map((item, index) => (
                      <View key={index}>
                        {item.text_type === 'TOP_TEXT' && item.top_text && (
                          <View style={styles.txts}>
                            <Text style={styles.txtsLi}>{item.top_text}</Text>
                          </View>
                        )}
                        {item.text_type === 'TITLE_CONTENTS' && (
                          <>
                            <Text style={styles.tit}>{item.title}</Text>
                            <View style={styles.txts}>
                              <Text style={styles.txtsLi}>{item.contents}</Text>
                            </View>
                          </>
                        )}
                        {item.text_type === 'BOTTOM_TEXT' && item.bottom_text && (
                          <View style={styles.txts}>
                            <Text style={styles.txtsLi}>{item.bottom_text}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
                
                {/* 사업개요 */}
                {activeTab1 === 1 && (
                  <View style={styles.contentWrapN}>
                    {intro && intro.map((item, index) => (
                      <View key={index}>
                        {item.text_type === 'TOP_TEXT' && item.top_text && (
                          <View style={styles.txts}>
                            <Text style={styles.txtsLi}>{item.top_text}</Text>
                          </View>
                        )}
                        {item.text_type === 'TITLE_CONTENTS' && (
                          <>
                            <Text style={styles.tit}>{item.title}</Text>
                            <View style={styles.txts}>
                              <Text style={styles.txtsLi}>{item.contents}</Text>
                            </View>
                          </>
                        )}
                        {item.text_type === 'BOTTOM_TEXT' && item.bottom_text && (
                          <View style={styles.txts}>
                            <Text style={styles.txtsLi}>{item.bottom_text}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 안정성 토글박스 */}
          <View style={styles.detailTogglebox}>
            <TouchableOpacity 
              style={[styles.inTitle, expandedSections.stability && styles.inTitleOn]}
              onPress={() => toggleSection('stability')}
            >
              <Text style={styles.inTitleText}>안정성</Text>
              <Image 
                source={require('../assets/images/arrow_select.png')} 
                style={[styles.arrowIcon, expandedSections.stability && styles.arrowIconRotated]}
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            {expandedSections.stability && (
              <View style={styles.inCont}>
                {/* 탭 메뉴 */}
                <View style={styles.subTabWrapper}>
                  <View style={styles.subTabN}>
                    <TouchableOpacity 
                      style={[styles.subTabItem1, activeTab2 === 0 && styles.subTabItemActive1]}
                      onPress={() => setActiveTab2(0)}
                    >
                      <Text style={[styles.subTabText1, activeTab2 === 0 && styles.subTabTextActive1]}>차입자정보</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.subTabItem2, activeTab2 === 1 && styles.subTabItemActive2]}
                      onPress={() => setActiveTab2(1)}
                    >
                      <Text style={[styles.subTabText2, activeTab2 === 1 && styles.subTabTextActive2]}>담보사항</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.subTabLine} />
                </View>
                
                {/* 차입자정보 */}
                {activeTab2 === 0 && (
                  <View style={styles.contentWrapN}>
                    {borrower && borrower.map((item, index) => (
                      <View key={index}>
                        {item.text_type === 'TOP_TEXT' && item.top_text && (
                          <View style={styles.txts}>
                            <Text style={styles.txtsLi}>{item.top_text}</Text>
                          </View>
                        )}
                        {item.text_type === 'TITLE_CONTENTS' && (
                          <>
                            <Text style={styles.tit}>{item.title}</Text>
                            <View style={styles.txts}>
                              <Text style={styles.txtsLi}>{item.contents}</Text>
                            </View>
                          </>
                        )}
                        {item.text_type === 'BOTTOM_TEXT' && item.bottom_text && (
                          <View style={styles.txts}>
                            <Text style={styles.txtsLi}>{item.bottom_text}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
                
                {/* 담보사항 */}
                {activeTab2 === 1 && (
                  <View style={styles.contentWrapN}>
                    {invest_file && invest_file.length > 0 && (
                      <View style={styles.imgbox}>
                        {invest_file.map((file, index) => (
                          <Image key={index} source={{ uri: file.filePath }} style={styles.imgboxImage} resizeMode="contain" />
                        ))}
                      </View>
                    )}
                    {invest && invest.map((item, index) => (
                      <View key={index}>
                        {item.text_type === 'TOP_TEXT' && item.top_text && (
                          <View style={styles.txts}>
                            <Text style={styles.txtsLi}>{item.top_text}</Text>
                          </View>
                        )}
                        {item.text_type === 'TITLE_CONTENTS' && (
                          <>
                            <Text style={styles.tit}>{item.title}</Text>
                            <View style={styles.txts}>
                              <Text style={styles.txtsLi}>{item.contents}</Text>
                            </View>
                          </>
                        )}
                        {item.text_type === 'BOTTOM_TEXT' && item.bottom_text && (
                          <View style={styles.txts}>
                            <Text style={styles.txtsLi}>{item.bottom_text}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 투자 유의사항 토글박스 */}
          <View style={[styles.detailTogglebox, styles.mb40]}>
            <TouchableOpacity 
              style={[styles.inTitle, expandedSections.caution && styles.inTitleOn]}
              onPress={() => toggleSection('caution')}
            >
              <Text style={styles.inTitleText}>투자 유의사항</Text>
              <Image 
                source={require('../assets/images/arrow_select.png')} 
                style={[styles.arrowIcon, expandedSections.caution && styles.arrowIconRotated]}
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            {expandedSections.caution && (
              <View style={styles.inCont}>
                {/* 탭 메뉴 */}
                <View style={styles.subTabWrapper}>
                  <View style={styles.subTabN}>
                    <TouchableOpacity 
                      style={[styles.subTabItem1, activeTab3 === 0 && styles.subTabItemActive1]}
                      onPress={() => setActiveTab3(0)}
                    >
                      <Text style={[styles.subTabTex1, activeTab3 === 0 && styles.subTabTextActive1]}>투자 리스크</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.subTabItem2, activeTab3 === 1 && styles.subTabItemActive2]}
                      onPress={() => setActiveTab3(1)}
                    >
                      <Text style={[styles.subTabText2, activeTab3 === 1 && styles.subTabTextActive2]}>투자 유의사항</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.subTabLine} />
                </View>
                
                {/* 투자 리스크 */}
                {activeTab3 === 0 && (
                  <View style={styles.contentWrapN}>
                    {risk && risk.map((item, index) => (
                      <View key={index}>
                        {item.text_type === 'TOP_TEXT' && item.top_text && (
                          <View style={styles.txts}>
                            <Text style={styles.txtsLi}>{item.top_text}</Text>
                          </View>
                        )}
                        {item.text_type === 'TITLE_CONTENTS' && (
                          <>
                            <Text style={styles.tit}>{item.title}</Text>
                            <View style={styles.txts}>
                              <Text style={styles.txtsLi}>{item.contents}</Text>
                            </View>
                          </>
                        )}
                        {item.text_type === 'BOTTOM_TEXT' && item.bottom_text && (
                          <View style={styles.txts}>
                            <Text style={styles.txtsLi}>{item.bottom_text}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
                
                {/* 투자 유의사항 */}
                {activeTab3 === 1 && (
                  <View style={styles.contentWrapN}>
                    {caution && caution.map((item, index) => (
                      <View key={index}>
                        {item.text_type === 'TOP_TEXT' && item.top_text && (
                          <View style={styles.txts}>
                            <Text style={styles.txtsLi}>{item.top_text}</Text>
                          </View>
                        )}
                        {item.text_type === 'TITLE_CONTENTS' && (
                          <>
                            <Text style={styles.tit}>{item.title}</Text>
                            <View style={styles.txts}>
                              <Text style={styles.txtsLi}>{item.contents}</Text>
                            </View>
                          </>
                        )}
                        {item.text_type === 'BOTTOM_TEXT' && item.bottom_text && (
                          <View style={styles.txts}>
                            <Text style={styles.txtsLi}>{item.bottom_text}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 수익 계산 모달 */}
      <Modal
        visible={showCalcModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalcModal(false)}
      >
        <View style={styles.popContainer}>
          <TouchableOpacity 
            style={styles.popMask} 
            activeOpacity={1}
            onPress={() => setShowCalcModal(false)}
          />
          <View style={styles.popWrapper}>
            <View style={styles.popBox}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.popTitle}>예상 수익계산</Text>
                
                {/* 투자예정 금액 입력 */}
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

                {/* 예상 투자수익 */}
                <View style={styles.boxCalc}>
                  <View style={styles.dlTotal}>
                    <Text style={styles.dtTotal}>예상 투자수익</Text>
                    <Text style={styles.ddTotal}>{formatNumber(calcResult.totalProfit)} 원</Text>
                  </View>
                  <View style={styles.dl}>
                    <Text style={styles.dt}>세전 총 수익</Text>
                    <Text style={styles.dd}>{formatNumber(calcResult.totalInterest)} 원</Text>
                  </View>
                  <View style={styles.dl}>
                    <Text style={styles.dt}>세금(이자소득세+주민세)</Text>
                    <Text style={styles.dd}>{formatNumber(calcResult.totalTax)} 원</Text>
                  </View>
                  <View style={styles.dl}>
                    <Text style={styles.dt}>플랫폼 수수료</Text>
                    <Text style={styles.dd}>{formatNumber(calcResult.totalComm)} 원</Text>
                  </View>
                </View>

                {/* 상환 스케줄 */}
                <Text style={styles.repayTit}>상환 스케줄</Text>
                <View style={styles.repayList}>
                  {calcResult.schedule.map((item, index) => (
                    <View key={index} style={styles.repayItem}>
                      <TouchableOpacity 
                        style={[styles.inHead, expandedSchedule[index] && styles.inHeadOn]}
                        onPress={() => toggleSchedule(index)}
                      >
                        <Text style={styles.inHeadDt}>{item.round}회차</Text>
                        <Text style={styles.inHeadDd}>
                          세후 <Text style={styles.cnt}>{formatNumber(item.afterTax)}</Text> 원
                        </Text>
                        <Image 
                          source={require('../assets/images/arrow_select.png')} 
                          style={[styles.scheduleArrow, expandedSchedule[index] && styles.scheduleArrowRotated]}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                      
                      {expandedSchedule[index] && (
                        <View style={styles.inCont}>
                          <View style={styles.dlRow}>
                            <Text style={styles.dtRow}>지급일</Text>
                            <Text style={styles.ddRow}>{item.paymentDate}</Text>
                          </View>
                          <View style={styles.dlRow}>
                            <Text style={styles.dtRow}>원금</Text>
                            <Text style={styles.ddRow}>{formatNumber(item.principal)} 원</Text>
                          </View>
                          <View style={styles.dlRow}>
                            <Text style={styles.dtRow}>이자</Text>
                            <Text style={styles.ddRow}>{formatNumber(item.interest)} 원</Text>
                          </View>
                          <View style={styles.dlRow}>
                            <Text style={styles.dtRow}>이자소득세</Text>
                            <Text style={styles.ddRow}>{formatNumber(item.incomeTax)} 원</Text>
                          </View>
                          <View style={styles.dlRow}>
                            <Text style={styles.dtRow}>주민세</Text>
                            <Text style={styles.ddRow}>{formatNumber(item.residentTax)} 원</Text>
                          </View>
                          <View style={styles.dlRow}>
                            <Text style={styles.dtRow}>플랫폼수수료</Text>
                            <Text style={styles.ddRow}>{formatNumber(item.commission)} 원</Text>
                          </View>
                          <View style={styles.dlRow}>
                            <Text style={styles.dtRow}>실지급액</Text>
                            <Text style={styles.ddRow}>{formatNumber(item.actualPayment)} 원</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                {/* 안내 문구 */}
                <View style={styles.flexText}>
                  <Text style={styles.excIcon}>ⓘ</Text>
                  <Text style={styles.txtNote}>
                    위 상환계획은 모집 완료시점과 대출 실행 일정에 따라서{'\n'}
                    변경될 수 있습니다. 또한 중도상환, 연체 등으로{'\n'}
                    지급일자와 지급액에 차이가 있을 수 있습니다.
                  </Text>
                </View>

                {/* 확인 버튼 */}
                <View style={styles.btnBoxModal}>
                  <TouchableOpacity 
                    style={styles.btnStyleModal}
                    onPress={() => setShowCalcModal(false)}
                  >
                    <Text style={styles.btnTextModal}>확인</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
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
  productViewN: {
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
    fontSize: 20,
    lineHeight: 28.6,
    fontWeight: '700',
    textAlign: 'center',
  },
  box: {
    marginTop: 20,
    marginHorizontal: 10,
    marginBottom: 20,
  },
  group: {
    position: 'relative',
    width: '100%',
  },
  thumbnail: {
    position: 'relative',
    width: '100%',
    height: 233,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#000',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  overlapGroupWrapper: {
    position: 'absolute',
    width: 70,
    height: 70,
    top: 15,
    left: 15,
  },
  overlapGroup: {
    position: 'relative',
    width: 70,
    height: 70,
    backgroundColor: '#fff',
    borderRadius: 45,
    borderWidth: 1,
    borderColor: '#2C3DB8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icoDetail: {
    position: 'absolute',
    width: 42,
    height: 37,
    top: 8,
  },
  textWrapper: {
    position: 'absolute',
    top: 36,
    fontSize: 13,
    fontWeight: '600',
    color: '#393F44',
    textAlign: 'center',
    letterSpacing: -0.32,
    lineHeight: 24,
  },
  div: {
    position: 'absolute',
    top: 10,
    right: 20,
    fontSize: 12,
    fontWeight: '400',
    color: '#fff',
    textAlign: 'right',
    letterSpacing: -0.42,
    lineHeight: 21,
  },
  element: {
    position: 'absolute',
    top: 196,
    right: 20,
    fontSize: 14,
    fontWeight: '400',
    color: '#fff',
    letterSpacing: -0.44,
    lineHeight: 27,
  },
  progressGroup: {
    marginHorizontal: 30,
  },
  progressGroup2: {
    marginTop: 5,
    marginLeft: 8,
    marginRight: 25,
  },
  flexDl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dl2: {
    flex: 1,
    alignItems: 'center',
  },
  dt2: {
    fontSize: 14,
    lineHeight: 18.2,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  dd2: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  dd3: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  progressBar: {
    height: 5,
    backgroundColor: '#e0e1e2',
    borderRadius: 2.5,
    marginTop: 5,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  btnTextGray: {
    color: '#999',
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
    height: 17,
  },
  ecoIcon2: {
    width: 26,
    height: 26,
  },
  ecoIcon3: {
    width: 30,
    height: 30,
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
  detailBoxN: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 15,
    paddingBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    backgroundColor: '#fff',
  },
  detailN: {
    position: 'relative',
    padding: 20,
  },
  box1: {
    marginBottom: -20,
  },
  group1: {
    flexDirection: 'row',
    gap: 12,
  },
  overlapWrapper1: {
    flex: 1,
  },
  overlapGroup1: {
    height: 180,
    borderWidth: 1,
    borderColor: '#2f52c7',
    borderRadius: 12,
    paddingTop: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  overlapGroup1Bg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: '#e8f4ff',
    zIndex: -1,
  },
  ic1: {
    width: 26,
    height: 26,
    marginBottom: 15,
  },
  textWrapper1: {
    marginHorizontal: 20,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: '#3b3f48',
  },
  div1: {
    marginTop: 30,
    fontSize: 15,
    lineHeight: 22.5,
    fontWeight: '400',
    color: '#3b3f48',
    textAlign: 'center',
  },
  note2: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
    color: '#9aa0a6',
  },
  detailTogglebox: {
    marginTop: 8,
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
    justifyContent: 'space-between',
    position: 'relative',
    height: 55,
    paddingHorizontal: 20,
  },
  inTitleOn: {
    // 확장 상태 스타일
  },
  inTitleText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  arrowIcon: {
    width: 14,
    height: 14,
    transition: '0.2s',
  },
  arrowIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  inCont: {
    // 컨텐츠 영역
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
    left: -15,
  },
  subTabItem2: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    right: -15,
  },
  subTabItemActive1: {
    borderBottomColor: '#2c3db8',
    left: -15,
  },
  subTabItemActive2: {
    borderBottomColor: '#2c3db8',
    right: -15,
  },
  subTabText1: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    left: -15,
  },
  subTabText2: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    right: -15,
  },
  subTabTextActive: {
    color: '#2c3db8',
    fontWeight: '600',
  },
  contentWrapN: {
    paddingTop: 10,
    paddingBottom: 36,
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
  mb40: {
    marginBottom: 40,
  },
  statusIco: {
    width: 9,
    height: 10,
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
    paddingVertical: 24,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  popTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
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
  dl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dt: {
    fontSize: 14,
    color: '#666',
  },
  dd: {
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
    position: 'relative',
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
  inCont: {
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
    marginTop: 24,
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

export default ProductDetailScreen;

