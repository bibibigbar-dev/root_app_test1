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
} from 'react-native';
import Header from '../components/Header';
import ApiService from '../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

const BondMarketScreen = ({ navigation, route }) => {
  const { user } = route.params || {};
  const [activeTab, setActiveTab] = useState(0); // 0: 거래중, 1: 거래완료
  const [loading, setLoading] = useState(true);
  const [bondList, setBondList] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    loadBondData();
  }, [activeTab, selectedArea]);

  const loadBondData = async () => {
    setLoading(true);
    try {
      const memberId = user?.session?.member_id || user?.id;
      
      const params = {
        member_id: memberId || '-1',
      };
      
      // 거래중/거래완료에 따라 다른 엔드포인트 사용
      let endpoint = '/app/market';
      if (activeTab === 1) {
        // 거래완료 탭
        endpoint = '/market/comlist';
      } else {
        // 거래중 탭 - status, area, orderName 추가
        if (selectedArea) {
          params.area = selectedArea;
        }
        if (searchText) {
          params.orderName = searchText;
        }
      }
      
      const response = await ApiService.api.get(endpoint, {
        params: params
      });
      
      console.log('채권거래소 응답:', response.data);
      
      // 백엔드 응답 처리
      if (response.data) {
        // list가 있으면 사용
        if (response.data.list && Array.isArray(response.data.list)) {
        setBondList(response.data.list);
        } else if (response.data.classType && Array.isArray(response.data.classType)) {
          // classType이 배열이면 채권 목록으로 사용 (거래중 탭의 경우)
          setBondList(response.data.classType);
        } else {
          setBondList([]);
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

  const getOrderTypeImage = (orderType) => {
    switch (orderType) {
      case '태양광':
        return require('../assets/images/ico_status01.png');
      case 'ESS':
        return require('../assets/images/ico_status04.png');
      case '풍력':
        return require('../assets/images/ico_status03.png');
      case '전기차충전소':
        return require('../assets/images/ico_status02.png');
      default:
        return require('../assets/images/ico_status01.png');
    }
  };

  const getStatusText = (item) => {
    if (!user) return '로그인';
    if (item.pseq) return '신청완료';
    if (item.status === 'N') return '진행중';
    if (item.status === 'P') return '구매불가';
    return '진행중';
  };

  const formatNumber = (value) => {
    return parseInt(value || 0).toLocaleString();
  };

  const visibleItems = bondList.slice(0, currentPage * itemsPerPage);
  const totalPages = Math.ceil(bondList.length / itemsPerPage);

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title="채권거래소" />
      
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
          <Text style={styles.linkTipDt}>이용방법</Text>
          <Text style={styles.linkTipDd}>내 지역 원리금수취권 거래하는 방법!</Text>
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
              <Text style={[styles.tabText, activeTab === 0 && styles.tabTextActive]}>거래중</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 1 && styles.tabItemActive]}
              onPress={() => {
                setActiveTab(1);
                setCurrentPage(1);
              }}
            >
              <Text style={[styles.tabText, activeTab === 1 && styles.tabTextActive]}>거래완료</Text>
            </TouchableOpacity>
          </View>
          {activeTab === 0 && <View style={styles.tabActiveBar} />}
          {activeTab === 1 && <View style={[styles.tabActiveBar, { left: '50%' }]} />}
        </View>

        {/* 검색 필터 */}
        <View style={styles.choiceChips}>
          {/* TODO: 지역 선택 드롭다운 구현 */}
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="예) 고성군 솔라발전소"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity onPress={handleSearch}>
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
          <View style={styles.loadingWrapperProduct}>
            <Image 
              source={require('../assets/images/loading1.png')} 
              style={styles.loadingImage}
              resizeMode="contain"
            />
            <Text style={styles.loadingMsg}>상품 준비중입니다.</Text>
            <Text style={styles.loadingDesc}>
              곧 상품이 등록 될 예정입니다.{'\n'}조금만 기다려주세요!
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.bondList}>
              {visibleItems.map((item, index) => (
                <View key={index} style={styles.invItem}>
                  <View style={styles.inHead}>
                    <Text style={styles.inHeadTitle}>
                      채권번호 <Text style={styles.inHeadEm}>{item.seq}</Text>
                    </Text>
                    <Text style={styles.txtRight}>{item.area} 인근 주민 구매가능</Text>
                  </View>
                  
                  <View style={styles.inCont}>
                    <View style={styles.prdInfobox}>
                      <View style={styles.prdInfo}>
                        <View style={styles.prdImgbox}>
                          <Image 
                            source={getOrderTypeImage(item.orderType)} 
                            style={styles.prdImg}
                            resizeMode="contain"
                          />
                        </View>
                        <TouchableOpacity 
                          style={styles.prdTxtbox}
                          onPress={() => {
                            navigation.navigate('ProductDetail', { orderKey: item.orderNumber });
                          }}
                        >
                          <Text style={styles.prdTit}>{item.orderName}</Text>
                          <Text style={styles.prdTxt}>{item.orderType} {item.orderNum}호</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.prdPrice}>
                        <Text style={styles.prdPriceDt}>채권금액 / 판매금액</Text>
                        <Text style={styles.prdPriceDd}>
                          <Text style={styles.colorBlue}>{formatNumber(item.price)}원</Text> / {formatNumber(item.trade_price)}원
                        </Text>
                      </View>
                    </View>

                    <View style={styles.prdDatabox}>
                      <View style={styles.prdDataItem}>
                        <Text style={styles.prdDataDt}>연 수익률</Text>
                        <Text style={styles.prdDataDd}>{item.rate}%</Text>
                      </View>
                      <View style={styles.prdDataItem}>
                        <Text style={styles.prdDataDt}>상환회차</Text>
                        <Text style={styles.prdDataDd}>{item.instalment}/{item.period}</Text>
                      </View>
                      <View style={styles.prdDataItem}>
                        <Text style={styles.prdDataDt}>상환일</Text>
                        <Text style={styles.prdDataDd}>{item.repay_date}</Text>
                      </View>
                      <View style={styles.prdDataItem}>
                        <Text style={styles.prdDataDt}>상태</Text>
                        <Text style={styles.prdDataDd}>{getStatusText(item)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.inBtnbox}>
                    <TouchableOpacity 
                      style={styles.btn}
                      onPress={() => {
                        // TODO: 수익금 지급 예정표 모달
                        console.log('수익금 지급 예정표', item.orderNumber);
                      }}
                    >
                      <Text style={styles.btnText}>수익금 지급 예정표</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.btn, styles.btnBlue]}
                      onPress={() => {
                        if (!user) {
                          navigation.navigate('Login');
                          return;
                        }
                        // TODO: 원리금수취권 구매 팝업
                        console.log('원리금수취권 구매', item.seq, item.orderName);
                      }}
                    >
                      <Text style={[styles.btnText, styles.btnTextBlue]}>원리금수취권 구매</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* 더보기 버튼 */}
            {currentPage < totalPages && (
              <View style={styles.listMore}>
                <TouchableOpacity style={styles.moreButton} onPress={handleLoadMore}>
                  <Text style={styles.moreButtonText}>더보기</Text>
                  <Text style={styles.moreButtonCurrent}>{currentPage}/{totalPages}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#222',
  },
  linkTip: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#f8faff',
    borderWidth: 1,
    borderColor: '#e0e1e2',
  },
  linkTipDt: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#2c3db8',
  },
  linkTipDd: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: '#666',
  },
  tabSwiper: {
    position: 'relative',
    marginTop: 24,
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
    marginTop: 24,
    paddingHorizontal: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#222',
  },
  searchIcon: {
    width: 20,
    height: 20,
  },
  loadingContainer: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  loadingWrapperProduct: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingImage: {
    width: 120,
    height: 120,
  },
  loadingMsg: {
    marginTop: 20,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: '#222',
  },
  loadingDesc: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
  },
  bondList: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  invItem: {
    marginTop: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#516c89',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  inHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2c3db8',
  },
  inHeadTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#fff',
  },
  inHeadEm: {
    fontWeight: '700',
  },
  txtRight: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
    color: '#fff',
  },
  inCont: {
    padding: 16,
  },
  prdInfobox: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  prdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prdImgbox: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  prdImg: {
    width: '100%',
    height: '100%',
  },
  prdTxtbox: {
    flex: 1,
  },
  prdTit: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#222',
  },
  prdTxt: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: '#666',
  },
  prdPrice: {
    marginTop: 12,
  },
  prdPriceDt: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: '#666',
  },
  prdPriceDd: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#222',
  },
  colorBlue: {
    color: '#2c3db8',
  },
  prdDatabox: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  prdDataItem: {
    width: '50%',
    marginBottom: 12,
  },
  prdDataDt: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: '#666',
  },
  prdDataDd: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#222',
  },
  inBtnbox: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  btnBlue: {
    borderColor: '#2c3db8',
    backgroundColor: '#2c3db8',
  },
  btnText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#222',
  },
  btnTextBlue: {
    color: '#fff',
  },
  listMore: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  moreButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    backgroundColor: '#fff',
  },
  moreButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#222',
    marginRight: 8,
  },
  moreButtonCurrent: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: '#666',
  },
});

export default BondMarketScreen;

