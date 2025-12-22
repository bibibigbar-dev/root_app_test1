import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

const BondMarketScreen = ({ navigation, route }) => {
  const { user } = route.params || {};
  const [activeTab, setActiveTab] = useState(0); // 0: 거래중, 1: 거래완료
  const [loading, setLoading] = useState(true);
  const [bondList, setBondList] = useState([]);
  const [areaList, setAreaList] = useState([]); // classType 목록
  const [selectedArea, setSelectedArea] = useState('');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedBond, setSelectedBond] = useState(null);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
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
  const [calcBondData, setCalcBondData] = useState(null);

  useEffect(() => {
    loadBondData();
  }, [activeTab, selectedArea]);

  // 모달이 열릴 때 상세 데이터 로드
  useEffect(() => {
    if (showCalcModal && calcBondData && calcBondData.orderNumber) {
      loadInterestData();
    }
  }, [showCalcModal]);

  const loadInterestData = async () => {
    try {
      const response = await ApiService.api.post('/market/interest', {
        orderNumber: calcBondData.orderNumber,
      });

      if (response.data) {
        // 상세 데이터로 calcBondData 업데이트
        const prod = response.data.prod;
        const option = response.data.option;

        setCalcBondData({
          ...calcBondData,
          sort: prod.sort,
          repayType: prod.repay_type,
          rate: prod.rate,
          period: prod.period,
          orderNumber: prod.orderNumber,
          iComm1: option.i_comm_1,
          iTax: option.i_tax,
          rTax: option.r_tax,
        });

        // 판매금액으로 초기화
        const tradePrice =
          calcBondData.trade_price || calcBondData.price || '1000000';
        setCalcPrice(String(tradePrice));

        // 초기 계산 실행
        setTimeout(() => {
          calculateInterest();
        }, 100);
      }
    } catch (error) {
      console.error('이자 관련 데이터 호출 실패:', error);
    }
  };

  const loadBondData = async () => {
    setLoading(true);
    try {
      const memberId = user?.session?.member_id || user?.id;

      const params = {
        orderName: searchText || '',
        area: selectedArea || '',
      };

      // 거래완료 탭일 때만 status 추가
      if (activeTab === 1) {
        params.status = 'complete';
      }

      // 로그인 상태일 때만 member_id 추가
      if (memberId) {
        params.member_id = memberId;
      }

      const response = await ApiService.api.get('/app/market', {
        params: params,
      });

      // 백엔드 응답 처리
      if (response.data) {
        // list: 채권 목록
        if (response.data.list && Array.isArray(response.data.list)) {
          setBondList(response.data.list);
        } else {
          setBondList([]);
        }

        // classType: 지역 선택 목록
        if (response.data.classType && Array.isArray(response.data.classType)) {
          setAreaList(response.data.classType);
        }
      } else {
        setBondList([]);
      }
    } catch (error) {
      console.error('채권 목록 조회 실패:', error);
      setBondList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadBondData();
  };

  const handleLoadMore = () => {
    setCurrentPage(currentPage + 1);
  };

  const navigateToProductDetail = item => {
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

    navigation.navigate(screenName, { orderKey: item.orderNumber });
  };

  const getOrderTypeImage = orderType => {
    const iconMap = {
      태양광: require('../assets/images/img_product01_s.png'),
      풍력: require('../assets/images/img_product02_s.png'),
      ESS: require('../assets/images/img_product03_s.png'),
      전기차충전소: require('../assets/images/img_product03_s.png'),
    };

    return iconMap[orderType] || null;
  };

  const getStatusText = item => {
    if (!user) return '로그인';
    if (item.pseq) return '신청완료';
    if (item.status === 'N') return '진행중';
    if (item.status === 'P') return '구매불가';
    return '진행중';
  };

  const formatNumber = value => {
    return parseInt(value || 0).toLocaleString();
  };

  // 날짜 계산 함수들
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const addMonths = (dateStr, months) => {
    const date = new Date(dateStr);
    date.setMonth(date.getMonth() + months);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calcDateDiff = (startDate, endDate) => {
    const sdArr = startDate.split('-');
    const edArr = endDate.split('-');
    const sDate = new Date(sdArr[0], Number(sdArr[1]) - 1, sdArr[2]);
    const eDate = new Date(edArr[0], Number(edArr[1]) - 1, edArr[2]);
    const diffDt = (eDate.getTime() - sDate.getTime()) / 1000 / 60 / 60 / 24;
    return diffDt;
  };

  // 수익 계산
  const calculateInterest = () => {
    if (!calcBondData) return;

    let tBal = 0;
    let tRrp = 0;
    let tInt = 0;
    let tTax = 0;
    let tComm = 0;

    const sort = calcBondData.sort;
    const rpType = calcBondData.repayType;
    const rate = Number(calcBondData.rate);
    const dRate = rate / 100 / 365;
    let price = calcPrice.replace(/,/g, '');
    price = Number(price);
    const period = Number(calcBondData.period);
    const comm = Number(calcBondData.iComm1 || 0);
    const dComm = comm / 100 / 365;
    const iTaxPer = Number(calcBondData.iTax || 0);
    const rTaxPer = Number(calcBondData.rTax || 0);
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
        // innovation 등 - 특정 상품은 6개월
        const orderNumber = calcBondData.orderNumber;
        if (
          orderNumber === 'R000278' ||
          orderNumber === 'R000280' ||
          orderNumber === 'R000281' ||
          orderNumber === 'R000282' ||
          orderNumber === 'R000286' ||
          orderNumber === 'R000287' ||
          orderNumber === 'R000288'
        ) {
          endDate = addMonths(startDate, 6);
        } else {
          endDate = addMonths(startDate, 3);
        }
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

  const handleCalcPriceChange = text => {
    const numOnly = text.replace(/[^0-9]/g, '');
    setCalcPrice(numOnly);
  };

  const handleBuyRequest = async () => {
    if (!user) {
      setShowBuyModal(false);
      setSelectedBond(null);
      navigation.navigate('Login');
      return;
    }

    if (!selectedBond) return;

    try {
      const memberId = user?.session?.member_id || user?.id;

      const response = await ApiService.api.post('/app/market/process/buy', {
        member_id: memberId,
        _mknum: selectedBond.seq.toString(),
      });

      setShowBuyModal(false);
      setSelectedBond(null);

      if (response.data === '0' || response.data === 0) {
        // 성공
        Alert.alert(
          '원리금수취권 구매신청',
          '정상적으로 구매신청이 완료되었습니다.',
          [
            {
              text: '확인',
              onPress: () => {
                loadBondData(); // 데이터 새로고침
              },
            },
          ],
        );
      } else if (response.data === '1' || response.data === 1) {
        // 로그인 필요
        navigation.navigate('Login');
      } else if (response.data === '2' || response.data === 2) {
        // 새로고침
        loadBondData();
      } else if (response.data === '4' || response.data === 4) {
        // 본인 판매 채권
        Alert.alert('원리금수취권 구매신청', '본인 판매 채권입니다.', [
          { text: '확인' },
        ]);
      } else if (response.data === '5' || response.data === 5) {
        // 이미 구매신청한 채권
        Alert.alert('원리금수취권 구매신청', '이미 구매신청한 채권입니다.', [
          { text: '확인' },
        ]);
      } else {
        // 기타 오류
        Alert.alert('오류', '처리도중 오류가 발생하였습니다.', [
          {
            text: '확인',
            onPress: () => {
              loadBondData();
            },
          },
        ]);
      }
    } catch (error) {
      console.error('구매 신청 오류:', error);
      setShowBuyModal(false);
      setSelectedBond(null);
      Alert.alert('오류', '처리도중 오류가 발생하였습니다.', [
        {
          text: '확인',
          onPress: () => {
            loadBondData();
          },
        },
      ]);
    }
  };

  const visibleItems = bondList.slice(0, currentPage * itemsPerPage);
  const totalPages = Math.ceil(bondList.length / itemsPerPage);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* 제목 */}
        <View style={styles.subTitleBox}>
          <Text style={styles.title}>채권거래소</Text>
        </View>

        {/* 이용방법 링크 */}
        <TouchableOpacity
          style={styles.linkTip}
          onPress={() => {
            navigation.navigate('BondMarketHowToUse', { user });
          }}
        >
          <View style={styles.linkTipDt}>
            <Text style={styles.linkTipDtText}>이용방법</Text>
          </View>
          <Text style={styles.linkTipDd}>
            내 지역 원리금수취권 거래하는 방법!
          </Text>
          <Image
            source={require('../assets/images/arrow_right_white.png')}
            style={styles.linkTipArrow}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* 탭 메뉴 */}
        <View style={styles.tabSwiper}>
          <View style={styles.tabSwiperWrapper}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 0 && styles.tabItemActive]}
              onPress={() => {
                setActiveTab(0);
                setCurrentPage(1);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 0 && styles.tabTextActive,
                ]}
              >
                거래중
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 1 && styles.tabItemActive]}
              onPress={() => {
                setActiveTab(1);
                setCurrentPage(1);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 1 && styles.tabTextActive,
                ]}
              >
                거래완료
              </Text>
            </TouchableOpacity>
          </View>
          {activeTab === 0 && <View style={styles.tabActiveBar} />}
          {activeTab === 1 && (
            <View style={[styles.tabActiveBar, { left: '50%' }]} />
          )}
        </View>

        {/* 검색 필터 */}
        <View style={styles.choiceChips}>
          {/* 지역 선택 */}
          <TouchableOpacity
            style={styles.selectArea}
            onPress={() => setShowAreaPicker(true)}
          >
            <Image
              source={require('../assets/images/ico_local.png')}
              style={styles.areaIconLeft}
              resizeMode="contain"
            />
            <Text style={styles.areaSelectText}>{selectedArea || '전체'}</Text>
            <Image
              source={require('../assets/images/ico_select.png')}
              style={styles.areaIconRight}
              resizeMode="contain"
            />
            {/* 구분선 */}
            <View style={styles.areaDivider} />
          </TouchableOpacity>

          {/* 검색 박스 */}
          <View style={styles.rightBtn}>
            <TextInput
              style={styles.searchInput}
              placeholder="예) 고성군 솔라발전소"
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              onPress={handleSearch}
              style={styles.searchButton}
            >
              <Image
                source={require('../assets/images/ico_search.png')}
                style={styles.searchIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 로딩 또는 목록 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2c3db8" />
          </View>
        ) : bondList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image
              source={require('../assets/images/loading1.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyMsg}>상품 준비중입니다.</Text>
            <Text style={styles.emptyDesc}>
              곧 상품이 등록 될 예정입니다.{'\n'}조금만 기다려주세요!
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.bondList}>
              {visibleItems.map((item, index) => (
                <View key={index} style={styles.invItemWrap}>
                  <View style={styles.invItem}>
                    {/* 헤더: 거래중은 파란색, 거래완료는 회색 */}
                    <View
                      style={[
                        styles.inHead,
                        activeTab === 0 ? styles.bgBlue : styles.bgGray,
                      ]}
                    >
                      <Text style={styles.inHeadTitle}>
                        채권번호 <Text style={styles.inHeadEm}>{item.seq}</Text>
                      </Text>
                      <Text style={styles.txtRight}>
                        {item.area} 인근 주민 구매가능
                      </Text>
                    </View>

                    <View style={styles.inCont}>
                      <View style={styles.prdInfobox}>
                        <View style={styles.prdInfo}>
                          <View style={styles.imgbox}>
                            <Image
                              source={getOrderTypeImage(item.orderType)}
                              style={styles.prdImg}
                              resizeMode="contain"
                            />
                          </View>
                          <TouchableOpacity
                            style={styles.txtbox}
                            onPress={() => navigateToProductDetail(item)}
                          >
                            <Text
                              style={styles.tit}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {item.orderName}
                            </Text>
                            <Text style={styles.txt}>
                              {item.orderType} {item.orderNum}호
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* 가격 표시: 거래중과 거래완료 다른 레이아웃 */}
                        {activeTab === 0 ? (
                          // 거래중: 한 줄로 표시
                          <View style={styles.prdPrice}>
                            <Text style={styles.prdPriceDt}>
                              채권금액 / 판매금액
                            </Text>
                            <Text style={styles.prdPriceDd}>
                              <Text style={styles.colorBlue}>
                                {formatNumber(item.price)}원
                              </Text>{' '}
                              / {formatNumber(item.trade_price)}원
                            </Text>
                          </View>
                        ) : (
                          // 거래완료: 두 줄로 표시
                          <View style={styles.prdPrice2}>
                            <View style={styles.prdPrice2Item}>
                              <Text style={styles.prdPrice2Dt}>채권금액</Text>
                              <Text style={styles.prdPrice2Dd}>
                                {formatNumber(item.price)}원
                              </Text>
                            </View>
                            <View style={styles.prdPrice2Item}>
                              <Text style={styles.prdPrice2Dt}>판매금액</Text>
                              <Text style={styles.prdPrice2Dd}>
                                {formatNumber(item.trade_price)}원
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>

                      <View style={styles.prdDatabox}>
                        <View style={[styles.prdDataDl, styles.prdDataDlFirst]}>
                          <Text style={styles.prdDataDt}>연 수익률</Text>
                          <Text style={styles.prdDataDd}>{item.rate}%</Text>
                        </View>
                        <View style={styles.prdDataDl}>
                          <Text style={styles.prdDataDt}>상환회차</Text>
                          <Text style={styles.prdDataDd}>
                            {item.instalment}/{item.period}
                          </Text>
                        </View>
                        <View style={styles.prdDataDl}>
                          <Text style={styles.prdDataDt}>상환일</Text>
                          <Text style={styles.prdDataDd}>
                            {item.repay_date}
                          </Text>
                        </View>
                        <View style={styles.prdDataDl}>
                          <Text style={styles.prdDataDt}>상태</Text>
                          <Text style={styles.prdDataDd}>
                            {activeTab === 1 ? '거래완료' : getStatusText(item)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 버튼: 거래중일 때만 표시 */}
                    {activeTab === 0 && (
                      <View style={styles.inBtnbox}>
                        <TouchableOpacity
                          style={styles.btn}
                          onPress={() => {
                            setCalcBondData(item);
                            setShowCalcModal(true);
                            setTimeout(() => calculateInterest(), 100);
                          }}
                        >
                          <Text style={styles.btnText}>수익금 지급 예정표</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.btn, styles.btnColorBlue]}
                          onPress={() => {
                            // 모달을 먼저 열고, 신청하기 버튼에서 로그인 체크
                            setSelectedBond(item);
                            setShowBuyModal(true);
                          }}
                        >
                          <Text style={[styles.btnText, styles.btnTextBlue]}>
                            원리금수취권 구매
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* 더보기 버튼 */}
            {currentPage < totalPages && (
              <View style={styles.loadMoreContainer}>
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                >
                  <Text style={styles.loadMoreText}>
                    더보기 ({currentPage}/{totalPages})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* 원리금수취권 구매 모달 */}
      <Modal
        visible={showBuyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBuyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>원리금수취권 구매신청</Text>

              <View style={styles.modalContent}>
                <Text style={styles.modalSubTitle}>투자위험 안내고지</Text>
                <Text style={styles.modalWarningText}>
                  이 투자상품은 '온라인투자연계금융업법'에 따라{'\n'}
                  원금과투자수익을 보장할 수 없습니다.{'\n'}
                  또한 차입자가 원금의 전부{'\n'}
                  또는 일부를 상환하지 못할 경우{'\n'}
                  원금손실의 위험성이 있으며,{'\n'}
                  결국 그 손실은 투자자가 부담하게 됩니다.
                </Text>
              </View>

              <View style={styles.hrLine} />

              <View style={styles.modalNotice}>
                <Image
                  source={require('../assets/images/ico_exc.png')}
                  style={styles.modalNoticeIcon}
                  resizeMode="contain"
                />
                <Text style={styles.modalNoticeText}>
                  해당 신청은 구매 확정이 아니며,{'\n'}
                  신청 후 관리자 승인에 의하여 구매{'\n'}
                  또는 취소될 수 있습니다.{'\n'}
                  구매대상자 선정시 고객센터를 통하여 유선상으로{'\n'}
                  자세한 안내를 전달드립니다.
                </Text>
              </View>

              <View style={styles.modalGrayBox}>
                <Text style={styles.modalProductName}>
                  {selectedBond?.orderName}
                </Text>
              </View>

              <Text style={styles.modalConfirmText}>
                상품에 대한 원리금수취권 구매{'\n'}신청하겠습니까?
              </Text>

              <View style={styles.modalButtonBox}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonGray]}
                  onPress={() => {
                    setShowBuyModal(false);
                    setSelectedBond(null);
                  }}
                >
                  <Text style={styles.modalButtonTextGray}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonBlue]}
                  onPress={handleBuyRequest}
                >
                  <Text style={styles.modalButtonTextWhite}>신청하기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 지역 선택 모달 */}
      <Modal
        visible={showAreaPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAreaPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.areaModalContainer}>
            <View style={styles.areaModalBox}>
              <Text style={styles.areaModalTitle}>지역 선택</Text>

              <ScrollView style={styles.areaModalList}>
                <TouchableOpacity
                  style={styles.areaModalItem}
                  onPress={() => {
                    setSelectedArea('');
                    setShowAreaPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.areaModalItemText,
                      selectedArea === '' && styles.areaModalItemTextActive,
                    ]}
                  >
                    전체
                  </Text>
                  {selectedArea === '' && (
                    <Image
                      source={require('../assets/images/icon_check.png')}
                      style={styles.areaModalCheckIcon}
                      resizeMode="contain"
                    />
                  )}
                </TouchableOpacity>

                {areaList &&
                  areaList.map((area, index) => {
                    const areaName = area.name || area.type;
                    const areaValue = area.type || area.name;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.areaModalItem}
                        onPress={() => {
                          setSelectedArea(areaValue);
                          setShowAreaPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.areaModalItemText,
                            selectedArea === areaValue &&
                              styles.areaModalItemTextActive,
                          ]}
                        >
                          {areaName}
                        </Text>
                        {selectedArea === areaValue && (
                          <Image
                            source={require('../assets/images/icon_check.png')}
                            style={styles.areaModalCheckIcon}
                            resizeMode="contain"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>

              <View style={styles.areaModalButtonBox}>
                <TouchableOpacity
                  style={[styles.areaModalButton, styles.areaModalButtonGray]}
                  onPress={() => setShowAreaPicker(false)}
                >
                  <Text style={styles.areaModalButtonTextGray}>닫기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 수익금 계산 모달 */}
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
              <Text style={styles.popTitle}>예상 수익계산</Text>
              <View style={styles.popTitleBorder} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.popScrollView}
                contentContainerStyle={styles.popScrollContent}
              >
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
                    <Text style={styles.ddTotal}>
                      {formatNumber(calcResult.totalProfit)} 원
                    </Text>
                  </View>
                  <View style={styles.dl}>
                    <Text style={styles.dt}>세전 총 수익</Text>
                    <Text style={styles.dd}>
                      {formatNumber(calcResult.totalInterest)} 원
                    </Text>
                  </View>
                  <View style={styles.dl}>
                    <Text style={styles.dt}>세금(이자소득세+주민세)</Text>
                    <Text style={styles.dd}>
                      {formatNumber(calcResult.totalTax)} 원
                    </Text>
                  </View>
                  <View style={styles.dl}>
                    <Text style={styles.dt}>플랫폼 수수료</Text>
                    <Text style={styles.dd}>
                      {formatNumber(calcResult.totalComm)} 원
                    </Text>
                  </View>
                </View>

                {/* 상환 스케줄 */}
                <Text style={styles.repayTit}>상환 스케줄</Text>
                <View style={styles.repayList}>
                  {calcResult.schedule.map((item, index) => (
                    <View key={index} style={styles.repayItem}>
                      <TouchableOpacity
                        style={[
                          styles.repayHead,
                          expandedSchedule[index] && styles.repayHeadOn,
                        ]}
                        onPress={() => {
                          setExpandedSchedule(prev => ({
                            ...prev,
                            [index]: !prev[index],
                          }));
                        }}
                      >
                        <Text style={styles.repayHeadDt}>{item.round}회차</Text>
                        <Text style={styles.repayHeadDd}>
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
                        <View style={styles.repayCont}>
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

                {/* 안내 문구 */}
                <View style={styles.flexText}>
                  <Text style={styles.excIcon}>ⓘ</Text>
                  <Text style={styles.txtNote}>
                    위 상환계획은 모집 완료시점과 대출 실행 일정에 따라서{'\n'}
                    변경될 수 있습니다. 또한 중도상환, 연체 등으로{'\n'}
                    지급일자와 지급액에 차이가 있을 수 있습니다.
                  </Text>
                </View>
              </ScrollView>

              {/* 확인 버튼 (고정) */}
              <View style={styles.btnBoxModal}>
                <TouchableOpacity
                  style={styles.btnStyleModal}
                  onPress={() => setShowCalcModal(false)}
                >
                  <Text style={styles.btnTextModal}>확인</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  subTitleBox: {
    paddingTop: 40,
    paddingBottom: 5,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#222',
  },
  linkTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 40,
    borderRadius: 10,
    backgroundColor: '#393f44',
    position: 'relative',
  },
  linkTipDt: {
    paddingHorizontal: 4,
    paddingVertical: 0,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#77abf8',
  },
  linkTipDtText: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '600',
    color: '#fff',
  },
  linkTipDd: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: '#fff',
  },
  linkTipArrow: {
    position: 'absolute',
    right: 16,
    width: 12,
    height: 12,
    tintColor: '#fff',
  },
  tabSwiper: {
    position: 'relative',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  tabSwiperWrapper: {
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 0,
  },
  tabText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#2c3db8',
  },
  tabActiveBar: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    width: '50%',
    height: 2,
    backgroundColor: '#2c3db8',
  },
  choiceChips: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  selectArea: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingLeft: 28,
    paddingRight: 30,
    borderWidth: 1,
    borderColor: 'rgba(191, 195, 199, 0.5)',
    borderRadius: 16,
    backgroundColor: '#fff',
    minWidth: 130,
    marginRight: 8,
  },
  areaIconLeft: {
    position: 'absolute',
    left: 10,
    width: 16,
    height: 16,
  },
  areaPicker: {
    flex: 1,
    height: 32,
    fontSize: 13,
    color: '#393f44',
  },
  areaPickerItem: {
    fontSize: 13,
  },
  areaIconRight: {
    position: 'absolute',
    right: 10,
    width: 12,
    height: 12,
    pointerEvents: 'none',
  },
  areaDivider: {
    position: 'absolute',
    top: '50%',
    right: -9,
    width: 1,
    height: 28,
    backgroundColor: 'rgba(224, 225, 226, 0.5)',
    transform: [{ translateY: -14 }],
  },
  rightBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  searchInput: {
    flex: 1,
    height: 32,
    paddingHorizontal: 15,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: '#fbfbfb',
    color: '#222',
    marginLeft: 10,
    textAlignVertical: 'center',
  },
  searchButton: {
    marginLeft: 2,
    padding: 4,
  },
  searchIcon: {
    width: 24,
    height: 24,
  },
  loadingContainer: {
    flex: 1,
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  emptyImage: {
    width: 120,
    height: 120,
  },
  emptyMsg: {
    marginTop: 20,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: '#222',
  },
  emptyDesc: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
  },
  bondList: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  invItemWrap: {
    marginTop: 20,
    borderRadius: 10,
    shadowColor: 'rgba(104, 111, 115, 0.15)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    backgroundColor: 'transparent',
  },
  invItem: {
    flexDirection: 'column',
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  inHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#222',
  },
  bgBlue: {
    backgroundColor: '#2c3db8',
  },
  bgMint: {
    backgroundColor: '#2ebab4',
  },
  bgGray: {
    backgroundColor: '#666',
  },
  inHeadTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: '#fff',
  },
  inHeadEm: {
    fontWeight: '600',
  },
  txtRight: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '400',
    color: '#fff',
  },
  inCont: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(224, 225, 226, 0.5)',
  },
  prdInfobox: {
    paddingVertical: 16,
  },
  prdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imgbox: {
    marginRight: 12,
    flexShrink: 0,
  },
  prdImg: {
    width: 28,
    height: 31,
    objectFit: 'contain',
  },
  txtbox: {
    flex: 1,
    overflow: 'hidden',
  },
  tit: {
    fontSize: 16,
    lineHeight: 23.4, // 1.3 * 18
    fontWeight: '600',
    color: '#222',
  },
  txt: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 15.6, // 1.3 * 12
    fontWeight: '400',
    color: '#a3a7ab',
  },
  prdPrice: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
  },
  prdPriceDt: {
    marginRight: 8,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '400',
    color: '#666',
  },
  prdPriceDd: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#222',
  },
  colorBlue: {
    color: '#2c3db8',
  },
  prdPrice2: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
  },
  prdPrice2Item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  prdPrice2Dt: {
    marginRight: 8,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '400',
    color: '#666',
  },
  prdPrice2Dd: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#222',
  },
  prdDatabox: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(246, 246, 246, 0.5)',
  },
  prdDataDl: {
    flex: 1,
    paddingHorizontal: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#f2f2f2',
  },
  prdDataDlFirst: {
    borderLeftWidth: 0,
  },
  prdDataDt: {
    fontSize: 12,
    lineHeight: 15.6, // 1.3 * 12
    fontWeight: '400',
    color: '#a3a7ab',
  },
  prdDataDd: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: '#393f44',
    textAlign: 'right',
  },
  inBtnbox: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f6f6f6',
    backgroundColor: '#fff',
  },
  btn: {
    flex: 1,
    paddingVertical: 0,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  btnColorBlue: {
    backgroundColor: 'transparent',
  },
  btnText: {
    fontSize: 13,
    lineHeight: 40,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  btnTextBlue: {
    color: '#2c3db8',
  },
  loadMoreContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#e0e1e2',
    backgroundColor: '#fff',
  },
  loadMoreText: {
    marginRight: 8,
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
    color: '#666',
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SCREEN_WIDTH - 32,
    maxWidth: 400,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalTitle: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  modalContent: {
    paddingHorizontal: 40,
    paddingTop: 20,
  },
  modalSubTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalWarningText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
  },
  hrLine: {
    height: 1,
    backgroundColor: '#f6f6f6',
    marginTop: 16,
  },
  modalNotice: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'flex-start',
  },
  modalNoticeIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    marginTop: 2,
  },
  modalNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: '#666',
  },
  modalGrayBox: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f6f6f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalProductName: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#2c3db8',
    textAlign: 'center',
  },
  modalConfirmText: {
    marginTop: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: '#222',
    textAlign: 'center',
  },
  modalButtonBox: {
    flexDirection: 'row',
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  modalButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  modalButtonGray: {
    borderWidth: 1,
    borderColor: '#e0e1e2',
    backgroundColor: '#fff',
  },
  modalButtonBlue: {
    backgroundColor: '#2c3db8',
  },
  modalButtonTextGray: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonTextWhite: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#fff',
  },
  // 지역 선택 모달 스타일
  areaModalContainer: {
    width: SCREEN_WIDTH - 64,
    maxWidth: 320,
    maxHeight: '70%',
  },
  areaModalBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  areaModalTitle: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  areaModalList: {
    maxHeight: 400,
  },
  areaModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  areaModalItemText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    color: '#666',
  },
  areaModalItemTextActive: {
    fontWeight: '600',
    color: '#2c3db8',
  },
  areaModalCheckIcon: {
    width: 20,
    height: 20,
    tintColor: '#2c3db8',
  },
  areaModalButtonBox: {
    marginTop: 0,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  areaModalButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  areaModalButtonGray: {
    borderWidth: 1,
    borderColor: '#e0e1e2',
    backgroundColor: '#fff',
  },
  areaModalButtonTextGray: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#666',
  },
  // 지역 선택 버튼 텍스트 스타일
  areaSelectText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '400',
    color: '#393f44',
    paddingHorizontal: 8,
  },
  // 수익금 계산 모달 스타일
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
  repayHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f6f6f6',
    position: 'relative',
  },
  repayHeadOn: {
    backgroundColor: '#e8eeff',
  },
  repayHeadDt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  repayHeadDd: {
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
  repayCont: {
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

export default BondMarketScreen;
