import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
  Linking,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import ApiService from '../services/api';
import AppModal from '../components/AppModal';

const CustomerServiceScreen = ({ navigation, route }) => {
  const { user, initialTab } = route.params || {};
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState(initialTab || 0); // 0: 공지사항, 1: 자주하는질문, 2: 언론보도, 3: 공시안내
  const [loading, setLoading] = useState(true);
  const [topList, setTopList] = useState([]); // 중요 공지
  const [noticeList, setNoticeList] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [displayCount, setDisplayCount] = useState({
    notice: 5, // 공지사항 (일반 목록만 5개)
    faq: 10, // 자주하는 질문
    news: 10, // 언론보도
  });
  const [selectedYear, setSelectedYear] = useState(null); // 최대주주 정보용
  const [showYearModal, setShowYearModal] = useState(false); // 연도 선택 모달
  const [productYear, setProductYear] = useState(null); // 상품정보용
  const [productMonth, setProductMonth] = useState(null); // 상품정보용
  const [showProductYearModal, setShowProductYearModal] = useState(false); // 상품정보 연도 선택 모달
  const [showProductMonthModal, setShowProductMonthModal] = useState(false); // 상품정보 월 선택 모달

  // FAQ 카테고리
  const [faqCategory, setFaqCategory] = useState(0); // 0: 투자, 1: 일반계정, 2: 대출, 3: 커뮤니티펀드
  const [faqMenus, setFaqMenus] = useState([]);
  const [faqData, setFaqData] = useState({
    investlist: [],
    defaultlist: [],
    loanlist: [],
    solarlist: [],
  });

  // 공시안내 카테고리 및 데이터
  const [disclosureCategory, setDisclosureCategory] = useState(0); // 0: 경영현황, 1: 상품정보
  const [disclosureData, setDisclosureData] = useState({
    cur_yyyy: '',
    cur_mm: '',
    dt_yyyy: '',
    dt_mm: '',
    lossRateStatus: {},
    linkInvestData: {},
    operateData: {},
    productData: {},
  });
  const [shareholderData, setShareholderData] = useState(null); // 최대주주 정보

  useEffect(() => {
    loadNoticeData();
    // 탭 변경 시 표시 개수 초기화
    setDisplayCount({
      notice: 5, // 일반 목록만 5개
      faq: 10,
      news: 10,
    });
    setExpandedItems({});
  }, [activeTab]);

  // 연도 변경 시 최대주주 정보 조회
  useEffect(() => {
    if (selectedYear && activeTab === 3) {
      fetchYearData(selectedYear);
    }
  }, [selectedYear]);

  // 상품정보 년도/월 변경 시 또는 상품정보 탭 전환 시 데이터 조회
  useEffect(() => {
    if (
      productYear &&
      productMonth &&
      activeTab === 3 &&
      disclosureCategory === 1
    ) {
      fetchProductData(productYear, productMonth);
    }
  }, [productYear, productMonth, disclosureCategory]);

  // 최대주주 정보 조회 함수
  const fetchYearData = async yyyy => {
    try {
      const response = await ApiService.api.get('/app/operate/get/datas', {
        params: {
          type: 'year',
          yyyy: yyyy.toString(),
          mm: '01',
        },
      });

      if (response.data) {
        // 백엔드에서 op, msh, fs, soa, closs 객체로 반환
        setShareholderData(response.data);
      }
    } catch (error) {
      console.error('최대주주 정보 조회 실패:', error);
    }
  };

  // 상품정보 데이터 조회 함수
  const fetchProductData = async (yyyy, mm) => {
    try {
      const mmStr = mm < 10 ? `0${mm}` : mm.toString();
      const response = await ApiService.api.get('/app/operate/get/datas', {
        params: {
          type: 'osdata',
          yyyy: yyyy.toString(),
          mm: mmStr,
        },
      });

      if (response.data) {
        setDisclosureData(prev => ({
          ...prev,
          productData: response.data,
        }));
      }
    } catch (error) {
      console.error('상품정보 조회 실패:', error);
    }
  };

  const loadNoticeData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 0: // 공지사항
          endpoint = '/app/board/notice';
          break;
        case 1: // 자주하는질문
          endpoint = '/app/board/faq';
          break;
        case 2: // 언론보도
          endpoint = '/app/board/news';
          break;
        case 3: // 공시안내
          endpoint = '/app/operate/info';
          break;
        default:
          endpoint = '/app/board/notice';
      }

      const response = await ApiService.api.get(endpoint);

      if (response.data) {
        // FAQ 탭인 경우
        if (activeTab === 1) {
          setFaqMenus(response.data.menus || []);
          setFaqData({
            investlist: response.data.investlist || [],
            defaultlist: response.data.defaultlist || [],
            loanlist: response.data.loanlist || [],
            solarlist: response.data.solarlist || [],
          });
          setFaqCategory(0); // 기본 투자 탭
        } else if (activeTab === 3) {
          // 공시안내 탭인 경우
          setDisclosureData({
            cur_yyyy: response.data.cur_yyyy || '',
            cur_mm: response.data.cur_mm || '',
            dt_yyyy: response.data.dt_yyyy || '',
            dt_mm: response.data.dt_mm || '',
            lossRateStatus: response.data.lossRateStatus || {},
            linkInvestData: response.data.linkInvestData || {},
            operateData: response.data.operateData || {},
            productData: response.data.productData || {},
          });
          // 초기 년도 설정
          if (response.data.cur_yyyy && !selectedYear) {
            setSelectedYear(parseInt(response.data.cur_yyyy));
          }
          // 상품정보용 년도/월 초기화
          if (response.data.dt_yyyy && !productYear) {
            setProductYear(parseInt(response.data.dt_yyyy));
          }
          if (response.data.dt_mm && !productMonth) {
            setProductMonth(parseInt(response.data.dt_mm));
          }
          setDisclosureCategory(0); // 기본 경영현황 탭
        } else {
          setTopList(response.data.topList || []);
          setNoticeList(response.data.list || []);
        }
      } else {
        setTopList([]);
        setNoticeList([]);
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      setTopList([]);
      setNoticeList([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = idx => {
    setExpandedItems(prev => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 0:
        return '공지사항';
      case 1:
        return '자주하는질문';
      case 2:
        return '언론보도';
      case 3:
        return '공시안내';
      default:
        return '공지사항';
    }
  };

  const getCurrentFaqList = () => {
    switch (faqCategory) {
      case 0:
        return faqData.investlist;
      case 1:
        return faqData.defaultlist;
      case 2:
        return faqData.loanlist;
      case 3:
        return faqData.solarlist;
      default:
        return faqData.investlist;
    }
  };

  const getVisibleItems = () => {
    if (activeTab === 1) {
      // 자주하는 질문
      const faqList = getCurrentFaqList();
      return faqList.slice(0, displayCount.faq);
    } else if (activeTab === 2) {
      // 언론보도
      return noticeList.slice(0, displayCount.news);
    } else {
      // 공지사항
      return noticeList.slice(0, displayCount.notice);
    }
  };

  const getAllItems = () => {
    if (activeTab === 1) {
      return getCurrentFaqList();
    } else {
      return noticeList;
    }
  };

  const visibleItems = getVisibleItems();
  const allItems = getAllItems();
  // 공지사항 탭일 때는 일반 목록만 체크 (중요 목록은 모두 표시되므로)
  const hasMore =
    activeTab === 0
      ? visibleItems.length < noticeList.length
      : visibleItems.length < allItems.length;

  const getPageInfo = () => {
    let currentCount, totalCount;
    if (activeTab === 1) {
      currentCount = displayCount.faq;
      totalCount = allItems.length;
    } else if (activeTab === 2) {
      currentCount = displayCount.news;
      totalCount = allItems.length;
    } else {
      // 공지사항: 일반 목록만 계산 (중요 목록은 모두 표시되므로)
      currentCount = displayCount.notice;
      totalCount = noticeList.length;
    }
    const pageSize = activeTab === 0 ? 5 : 10; // 공지사항은 5개씩, 나머지는 10개씩
    const currentPage = Math.ceil(currentCount / pageSize);
    const totalPages = Math.ceil(totalCount / pageSize);
    return { currentPage, totalPages };
  };

  const handleLoadMore = () => {
    if (activeTab === 1) {
      setDisplayCount(prev => ({ ...prev, faq: prev.faq + 10 }));
    } else if (activeTab === 2) {
      setDisplayCount(prev => ({ ...prev, news: prev.news + 10 }));
    } else {
      // 공지사항: 일반 목록만 5개씩 추가
      setDisplayCount(prev => ({ ...prev, notice: prev.notice + 5 }));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 헤더 */}
        <View style={styles.subHead}>
          <ImageBackground
            source={require('../assets/images/bg_sub_cscenter.png')}
            style={styles.bgbox}
            resizeMode="cover"
          >
            <Text style={styles.headTitle}>고객센터</Text>
          </ImageBackground>
        </View>

        {/* 탭 메뉴 */}
        <View style={styles.tabSwiper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabScrollView}
          >
            <TouchableOpacity
              style={styles.tabSlide}
              onPress={() => {
                setActiveTab(0);
                setExpandedItems({});
              }}
            >
              <Text
                style={[
                  styles.tabLink,
                  activeTab === 0 && styles.tabLinkActive,
                ]}
              >
                공지사항
              </Text>
              {activeTab === 0 && <View style={styles.tabActiveBar} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tabSlide}
              onPress={() => {
                setActiveTab(1);
                setExpandedItems({});
              }}
            >
              <Text
                style={[
                  styles.tabLink,
                  activeTab === 1 && styles.tabLinkActive,
                ]}
              >
                자주하는질문
              </Text>
              {activeTab === 1 && <View style={styles.tabActiveBar} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tabSlide}
              onPress={() => {
                setActiveTab(2);
                setExpandedItems({});
              }}
            >
              <Text
                style={[
                  styles.tabLink,
                  activeTab === 2 && styles.tabLinkActive,
                ]}
              >
                언론보도
              </Text>
              {activeTab === 2 && <View style={styles.tabActiveBar} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tabSlide}
              onPress={() => {
                setActiveTab(3);
                setExpandedItems({});
              }}
            >
              <Text
                style={[
                  styles.tabLink,
                  activeTab === 3 && styles.tabLinkActive,
                ]}
              >
                공시안내
              </Text>
              {activeTab === 3 && <View style={styles.tabActiveBar} />}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* FAQ 카테고리 칩 (자주하는질문 탭일 때만 표시) */}
        {activeTab === 1 && !loading && (
          <View style={styles.choiceChips}>
            {faqMenus.map((menu, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.chipItem,
                  faqCategory === index && styles.chipItemActive,
                ]}
                onPress={() => {
                  setFaqCategory(index);
                  setExpandedItems({});
                  setDisplayCount(prev => ({ ...prev, faq: 10 }));
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    faqCategory === index && styles.chipTextActive,
                  ]}
                >
                  {menu.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 공시안내 카테고리 칩 (공시안내 탭일 때만 표시) */}
        {activeTab === 3 && !loading && (
          <View style={styles.choiceChips}>
            <TouchableOpacity
              style={[
                styles.chipItem,
                disclosureCategory === 0 && styles.chipItemActive,
              ]}
              onPress={() => setDisclosureCategory(0)}
            >
              <Text
                style={[
                  styles.chipText,
                  disclosureCategory === 0 && styles.chipTextActive,
                ]}
              >
                경영현황
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.chipItem,
                disclosureCategory === 1 && styles.chipItemActive,
              ]}
              onPress={() => setDisclosureCategory(1)}
            >
              <Text
                style={[
                  styles.chipText,
                  disclosureCategory === 1 && styles.chipTextActive,
                ]}
              >
                상품정보
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 로딩 또는 목록 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2c3db8" />
          </View>
        ) : (
          <>
            {/* 공시안내 */}
            {activeTab === 3 ? (
              <View style={styles.disclosureContainer}>
                {disclosureCategory === 0 ? (
                  /* 경영현황 */
                  <ScrollView style={styles.disclosureContent}>
                    {/* 회사정보 */}
                    <View style={[styles.subWhitebox, styles.mt20]}>
                      <View style={styles.subSTitleBox}>
                        <Text style={styles.subSTitle}>회사정보</Text>
                      </View>
                      <View style={styles.dlBetweenBox}>
                        <View style={styles.dlBetween}>
                          <Text style={styles.dlDt}>회사명</Text>
                          <Text style={styles.dlDd}>
                            루트인프라금융주식회사
                          </Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>소재지</Text>
                          <Text style={styles.dlDd}>
                            서울특별시 성동구 뚝섬로1나길 5
                          </Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>사업자 등록번호</Text>
                          <Text style={styles.dlDd}>106-87-04057</Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>온투업 등록번호</Text>
                          <Text style={styles.dlDd}>2024-20</Text>
                        </View>
                      </View>
                      <View style={styles.dlBetweenBox}>
                        <View style={styles.dlBetween}>
                          <Text style={styles.dlDt}>대표이사</Text>
                          <Text style={styles.dlDd}>윤태환</Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>전화번호</Text>
                          <Text style={styles.dlDd}>02-792-8934</Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>홈페이지 주소</Text>
                          <Text style={styles.dlDd}>
                            https://rootenergy.co.kr
                          </Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>회사 설립일</Text>
                          <Text style={styles.dlDd}>2013년 12월 31일</Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>온투업 등록일</Text>
                          <Text style={styles.dlDd}>2021년 8월 27일</Text>
                        </View>
                      </View>
                    </View>

                    {/* 주 정보 */}
                    <View style={[styles.subWhitebox, styles.mt8]}>
                      <View style={styles.subSTitleBox}>
                        <Text style={styles.subSTitle}>최대주주 정보</Text>
                        {disclosureData.cur_yyyy && (
                          <TouchableOpacity
                            style={styles.yearSelector}
                            onPress={() => setShowYearModal(true)}
                          >
                            <Text style={styles.yearSelectorText}>
                              {selectedYear}년 ▼
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <View style={styles.dlBetweenBox}>
                        <View style={styles.dlBetween}>
                          <Text style={styles.dlDt}>대주주</Text>
                          <Text style={styles.dlDd}>
                            {shareholderData?.op?.shareholder || '윤태환'}
                          </Text>
                        </View>
                        {shareholderData?.op?.shareholder_rate && (
                          <View
                            style={[styles.dlBetween, styles.dlBetweenMargin]}
                          >
                            <Text style={styles.dlDt}>지분율</Text>
                            <Text style={styles.dlDd}>
                              {shareholderData.op.shareholder_rate}%
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={[styles.subSTitleBox, styles.mt8]}>
                        <Text style={styles.subSTitle}>임직원 현황</Text>
                      </View>
                      <View style={styles.dlBetweenBox}>
                        <View style={styles.dlBetween}>
                          <Text style={styles.dlDt}>임직원</Text>
                          <Text style={styles.dlDd}>
                            {disclosureData.operateData?.mem_1 || '0'} 명
                          </Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>여신심사역</Text>
                          <Text style={styles.dlDd}>
                            {disclosureData.operateData?.mem_2 || '0'} 명
                          </Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>전문가</Text>
                          <Text style={styles.dlDd}>
                            {disclosureData.operateData?.mem_3 || '0'} 명
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.subSTitleBox, styles.mt8]}>
                        <Text style={styles.subSTitle}>재무 현황</Text>
                      </View>
                      {disclosureData.operateData?.fsFileName ? (
                        <TouchableOpacity
                          style={styles.docEvidence}
                          onPress={() => {
                            if (disclosureData.operateData?.fsFilePath) {
                              Linking.openURL(
                                disclosureData.operateData.fsFilePath,
                              );
                            }
                          }}
                        >
                          <Text style={styles.docEvidenceText}>PDF 보기</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.dlBetweenBox}>
                          <View style={styles.dlBetween}>
                            <Text style={styles.dlDt}>-</Text>
                            <Text style={styles.dlDd}></Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* 청산업무처리절차 */}
                    <View style={[styles.subWhitebox, styles.mt8, styles.pb36]}>
                      <View style={styles.subSTitleBox}>
                        <Text style={styles.subSTitle}>청산업무처리절차</Text>
                      </View>
                      <View style={[styles.pr20, styles.pl20, styles.mt20]}>
                        <Image
                          source={require('../assets/images/img_sub_step.png')}
                          style={styles.stepImage}
                          resizeMode="contain"
                        />
                        <Text style={styles.disclosureText}>
                          루트인프라금융㈜가 온투법 제27조에 따라 등록취소,
                          해산결의 파산선고 등으로 영업을 지속할 수 없는 경우,
                          법무법인 에너지에 원리금 상환·배분업무, 연계대출채권
                          관리계획, 투자금 및 상환금 관리계획, 연계투자 및
                          대출계약 관리계획 업무 등을 위탁합니다.
                        </Text>
                        <Text style={styles.starNotif}>
                          * 당사와 법무법인 에너지는 2020.8.25{' '}
                          {'<청산업무위임계약>'}을 체결하여 이용자 보호에 만전을
                          기하고 있습니다.
                        </Text>
                      </View>
                    </View>

                    {/* 이해상충 방지체계 */}
                    <View
                      style={[
                        styles.subWhitebox,
                        styles.mt8,
                        styles.pb36,
                        styles.mb20,
                      ]}
                    >
                      <View style={styles.subSTitleBox}>
                        <Text style={styles.subSTitle}>이해상충 방지체계</Text>
                      </View>
                      <View style={[styles.pr20, styles.pl20]}>
                        <Text
                          style={[
                            styles.disclosureText,
                            styles.disclosureSubTitle,
                          ]}
                        >
                          하나
                        </Text>
                        <Text style={styles.disclosureText}>
                          루트인프라금융㈜는 이용자의 이익을 최우선으로 하여
                          이용자의 자산에 대해 신의 성실의무를 지니며, 이용자
                          이익보호 책임을 이행함에 있어 주요 이해관계자간
                          이해상충이 될 가능성을 인지하고 있습니다.
                        </Text>
                        <Text
                          style={[
                            styles.disclosureText,
                            styles.disclosureSubTitle,
                          ]}
                        >
                          둘
                        </Text>
                        <Text style={styles.disclosureText}>
                          온투법 제5조 제18조에 의거, 당사는{' '}
                          {'<이해상충방지체계에 관한 기준>'}을 제정 운영하고
                          있으며 효과적인 내부통제체계 및 시스템을 구축하여
                          이해상충 문제를 엄격하게 관리하고 있습니다.
                        </Text>
                      </View>
                    </View>
                  </ScrollView>
                ) : (
                  /* 상품정보 */
                  <ScrollView style={styles.disclosureContent}>
                    {/* 상품유형별 취급 현황 - 테이블 1 */}
                    <View style={[styles.subWhitebox, styles.mt20]}>
                      <View style={styles.subSTitleBox}>
                        <Text style={styles.subSTitle}>
                          상품유형별 취급 현황
                        </Text>
                        {disclosureData.cur_yyyy && (
                          <View
                            style={{ flexDirection: 'row', marginLeft: 'auto' }}
                          >
                            <TouchableOpacity
                              style={[styles.yearSelector, { marginRight: 8 }]}
                              onPress={() => setShowProductYearModal(true)}
                            >
                              <Text style={styles.yearSelectorText}>
                                {productYear}년 ▼
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.yearSelector}
                              onPress={() => setShowProductMonthModal(true)}
                            >
                              <Text style={styles.yearSelectorText}>
                                {productMonth < 10 ? '0' : ''}
                                {productMonth}월 ▼
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>

                      {/* 첫 번째 테이블 */}
                      <View style={styles.tableContainer}>
                        <View style={styles.tableHeader}>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.tableHeaderCell,
                              { flex: 1.5 },
                            ]}
                          >
                            상품유형
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.tableHeaderCell,
                              { flex: 2 },
                            ]}
                          >
                            누적대출액(원)
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.tableHeaderCell,
                              { flex: 2 },
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                          >
                            대출잔액(원)
                          </Text>
                        </View>
                        {[
                          { name: '부동산PF', key: '1' },
                          { name: '부동산담보', key: '2' },
                          { name: '신용(개인)', key: '3' },
                          { name: '신용(법인)', key: '4' },
                          { name: '어음/매출채권\n담보', key: '5' },
                          { name: '기타 담보', key: '6' },
                          { name: '합계', key: '7', isTotal: true },
                        ].map(item => (
                          <View
                            key={item.key}
                            style={[
                              styles.tableRow,
                              item.isTotal && styles.tableRowTotal,
                            ]}
                          >
                            <Text
                              style={[
                                styles.tableCell,
                                item.isTotal && styles.tableCellBold,
                                { flex: 1.5 },
                              ]}
                            >
                              {item.name}
                            </Text>
                            <Text
                              style={[
                                styles.tableCell,
                                styles.tableCellNum,
                                item.isTotal && styles.tableCellBold,
                                { flex: 2 },
                              ]}
                            >
                              {parseInt(
                                disclosureData.productData?.[
                                  `DATA${item.key}1`
                                ] || 0,
                              ).toLocaleString()}
                            </Text>
                            <Text
                              style={[
                                styles.tableCell,
                                styles.tableCellNum,
                                item.isTotal && styles.tableCellBold,
                                { flex: 2 },
                              ]}
                            >
                              {parseInt(
                                disclosureData.productData?.[
                                  `DATA${item.key}2`
                                ] || 0,
                              ).toLocaleString()}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* 두 번째 테이블 */}
                      <View style={[styles.tableContainer, { marginTop: 16 }]}>
                        <View style={styles.tableHeader}>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.tableHeaderCell,
                              { flex: 1.5 },
                            ]}
                          >
                            상품유형
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.tableHeaderCell,
                              { flex: 2 },
                            ]}
                          >
                            연체잔액(원)
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.tableHeaderCell,
                              { flex: 1.5 },
                            ]}
                          >
                            연체율(%)
                          </Text>
                        </View>
                        {[
                          { name: '부동산PF', key: '1' },
                          { name: '부동산담보', key: '2' },
                          { name: '신용(개인)', key: '3' },
                          { name: '신용(법인)', key: '4' },
                          { name: '어음/매출채권\n담보', key: '5' },
                          { name: '기타 담보', key: '6' },
                          { name: '합계', key: '7', isTotal: true },
                        ].map(item => (
                          <View
                            key={item.key}
                            style={[
                              styles.tableRow,
                              item.isTotal && styles.tableRowTotal,
                            ]}
                          >
                            <Text
                              style={[
                                styles.tableCell,
                                item.isTotal && styles.tableCellBold,
                                { flex: 1.5 },
                              ]}
                            >
                              {item.name}
                            </Text>
                            <Text
                              style={[
                                styles.tableCell,
                                styles.tableCellNum,
                                item.isTotal && styles.tableCellBold,
                                { flex: 2 },
                              ]}
                            >
                              {parseInt(
                                disclosureData.productData?.[
                                  `DATA${item.key}5`
                                ] || 0,
                              ).toLocaleString()}
                            </Text>
                            <Text
                              style={[
                                styles.tableCell,
                                styles.tableCellNum,
                                item.isTotal && styles.tableCellBold,
                                { flex: 1.5 },
                              ]}
                            >
                              {parseFloat(
                                disclosureData.productData?.[
                                  `DATA${item.key}3`
                                ] || 0,
                              ).toFixed(1)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* 취급 현황 */}
                    <View style={[styles.subWhitebox, styles.mt8]}>
                      <View style={styles.subSTitleBox}>
                        <Text style={styles.subSTitle}>취급 현황</Text>
                      </View>
                      <View style={styles.dlBetweenBox}>
                        <View style={styles.dlBetween}>
                          <Text style={styles.dlDt}>누적대출액</Text>
                          <Text style={styles.dlDd}>
                            {parseInt(
                              disclosureData.productData?.DATA61 || 0,
                            ).toLocaleString()}
                            원
                          </Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>대출잔액</Text>
                          <Text style={styles.dlDd}>
                            {parseInt(
                              disclosureData.productData?.DATA62 || 0,
                            ).toLocaleString()}
                            원
                          </Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>연체율</Text>
                          <Text style={styles.dlDd}>
                            {parseFloat(
                              disclosureData.productData?.DATA63 || 0,
                            ).toFixed(1)}
                            %
                          </Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>연체건수</Text>
                          <Text style={styles.dlDd}>
                            {parseInt(
                              disclosureData.productData?.DATA64 || 0,
                            ).toLocaleString()}
                            건
                          </Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>연체잔액</Text>
                          <Text style={styles.dlDd}>
                            {parseInt(
                              disclosureData.productData?.DATA65 || 0,
                            ).toLocaleString()}
                            원
                          </Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>상품수</Text>
                          <Text style={styles.dlDd}>
                            {parseInt(
                              disclosureData.productData?.DATA66 || 0,
                            ).toLocaleString()}
                            건
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 채권 매각 내역 */}
                    <View style={[styles.subWhitebox, styles.mt8, styles.pb36]}>
                      <View style={styles.subSTitleBox}>
                        <Text style={styles.subSTitle}>채권 매각 내역</Text>
                      </View>
                      <View style={styles.dlBetweenBox}>
                        <View style={styles.dlBetween}>
                          <Text style={styles.dlDt}>매각일자</Text>
                          <Text style={styles.dlDd}>-</Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>상품유형</Text>
                          <Text style={styles.dlDd}>-</Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>매각채권 잔액</Text>
                          <Text style={styles.dlDd}>-</Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>매각 대금</Text>
                          <Text style={styles.dlDd}>-</Text>
                        </View>
                        <View
                          style={[styles.dlBetween, styles.dlBetweenMargin]}
                        >
                          <Text style={styles.dlDt}>매각처</Text>
                          <Text style={styles.dlDd}>-</Text>
                        </View>
                      </View>
                    </View>

                    {/* 손실률 현황 (상품정보 탭에도 표시) */}
                    {disclosureData.lossRateStatus &&
                      Object.keys(disclosureData.lossRateStatus).length > 0 && (
                        <View
                          style={[styles.subWhitebox, styles.mt8, styles.pb36]}
                        >
                          <View style={styles.subSTitleBox}>
                            <Text style={styles.subSTitle}>손실률 현황</Text>
                          </View>
                          <View style={styles.tableContainer}>
                            <View style={styles.tableHeader}>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableHeaderCell,
                                  { flex: 1 },
                                ]}
                              >
                                연도
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableHeaderCell,
                                  { flex: 2 },
                                ]}
                              >
                                대출취급액(원)
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableHeaderCell,
                                  { flex: 2 },
                                ]}
                              >
                                손실확정액(원)
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableHeaderCell,
                                  { flex: 1 },
                                ]}
                              >
                                손실률(%)
                              </Text>
                            </View>
                            {[1, 2, 3, 4, 5].map(
                              num =>
                                disclosureData.lossRateStatus[
                                  `YEAR_${num}`
                                ] && (
                                  <View key={num} style={styles.tableRow}>
                                    <Text
                                      style={[styles.tableCell, { flex: 1 }]}
                                    >
                                      {
                                        disclosureData.lossRateStatus[
                                          `YEAR_${num}`
                                        ]
                                      }
                                    </Text>
                                    <Text
                                      style={[
                                        styles.tableCell,
                                        styles.tableCellNum,
                                        { flex: 2 },
                                      ]}
                                    >
                                      {parseInt(
                                        disclosureData.lossRateStatus[
                                          `LOAN_AMOUNT_${num}`
                                        ] || 0,
                                      ).toLocaleString()}
                                    </Text>
                                    <Text
                                      style={[
                                        styles.tableCell,
                                        styles.tableCellNum,
                                        { flex: 2 },
                                      ]}
                                    >
                                      {parseInt(
                                        disclosureData.lossRateStatus[
                                          `C_LOSS_AMOUNT_${num}`
                                        ] || 0,
                                      ).toLocaleString()}
                                    </Text>
                                    <Text
                                      style={[
                                        styles.tableCell,
                                        styles.tableCellNum,
                                        { flex: 1 },
                                      ]}
                                    >
                                      {disclosureData.lossRateStatus[
                                        `LOSS_RATE_${num}`
                                      ] || '0.0'}
                                    </Text>
                                  </View>
                                ),
                            )}
                          </View>
                          <Text style={styles.starNotif}>
                            * 각 연도별 대출취급액(대출원금) 대비
                            손실확정금액(투자자에게 미지급 확정된 투자원금)의
                            비율
                          </Text>
                        </View>
                      )}

                    {/* 자기계산 연계투자 현황 (상품정보 탭에도 표시) */}
                    {disclosureData.linkInvestData &&
                      Object.keys(disclosureData.linkInvestData).length > 0 && (
                        <View
                          style={[styles.subWhitebox, styles.mt8, styles.pb36]}
                        >
                          <View style={styles.subSTitleBox}>
                            <Text style={styles.subSTitle}>
                              자기계산 연계투자 현황
                            </Text>
                          </View>
                          <View style={styles.tableContainer}>
                            <View style={styles.tableHeader}>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableHeaderCell,
                                  { flex: 1 },
                                ]}
                              >
                                상품유형
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableHeaderCell,
                                  { flex: 1.5 },
                                ]}
                              >
                                누적자기계산{'\n'}연계투자금액(원)
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableHeaderCell,
                                  { flex: 1.5 },
                                ]}
                              >
                                자기계산{'\n'}연계투자금액(원)
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableHeaderCell,
                                  { flex: 1.5 },
                                ]}
                              >
                                자기자본대비{'\n'}자기계산투자{'\n'}잔액 비율(%)
                              </Text>
                            </View>
                            <View style={styles.tableRow}>
                              <Text style={[styles.tableCell, { flex: 1 }]}>
                                부동산/{'\n'}신용 등
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableCellNum,
                                  { flex: 1.5 },
                                ]}
                              >
                                {parseInt(
                                  disclosureData.linkInvestData
                                    .R_ESTATE_CUM_SELF_CAL || 0,
                                ).toLocaleString()}
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableCellNum,
                                  { flex: 1.5 },
                                ]}
                              >
                                {parseInt(
                                  disclosureData.linkInvestData
                                    .R_ESTATE_SELF_CAL || 0,
                                ).toLocaleString()}
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableCellNum,
                                  { flex: 1.5 },
                                ]}
                              >
                                {disclosureData.linkInvestData
                                  .R_ESTATE_SELF_RATE || '0'}
                              </Text>
                            </View>
                            <View style={styles.tableRow}>
                              <Text style={[styles.tableCell, { flex: 1 }]}>
                                기타담보
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableCellNum,
                                  { flex: 1.5 },
                                ]}
                              >
                                {parseInt(
                                  disclosureData.linkInvestData
                                    .ETC_CUM_SELF_CAL || 0,
                                ).toLocaleString()}
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableCellNum,
                                  { flex: 1.5 },
                                ]}
                              >
                                {parseInt(
                                  disclosureData.linkInvestData.ETC_SELF_CAL ||
                                    0,
                                ).toLocaleString()}
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableCellNum,
                                  { flex: 1.5 },
                                ]}
                              >
                                {disclosureData.linkInvestData.ETC_SELF_RATE ||
                                  '0'}
                              </Text>
                            </View>
                            <View
                              style={[styles.tableRow, styles.tableRowTotal]}
                            >
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableCellBold,
                                  { flex: 1 },
                                ]}
                              >
                                계
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableCellNum,
                                  styles.tableCellBold,
                                  { flex: 1.5 },
                                ]}
                              >
                                {(
                                  parseInt(
                                    disclosureData.linkInvestData
                                      .R_ESTATE_CUM_SELF_CAL || 0,
                                  ) +
                                  parseInt(
                                    disclosureData.linkInvestData
                                      .ETC_CUM_SELF_CAL || 0,
                                  )
                                ).toLocaleString()}
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableCellNum,
                                  styles.tableCellBold,
                                  { flex: 1.5 },
                                ]}
                              >
                                {(
                                  parseInt(
                                    disclosureData.linkInvestData
                                      .R_ESTATE_SELF_CAL || 0,
                                  ) +
                                  parseInt(
                                    disclosureData.linkInvestData
                                      .ETC_SELF_CAL || 0,
                                  )
                                ).toLocaleString()}
                              </Text>
                              <Text
                                style={[
                                  styles.tableCell,
                                  styles.tableCellNum,
                                  styles.tableCellBold,
                                  { flex: 1.5 },
                                ]}
                              >
                                {(
                                  parseFloat(
                                    disclosureData.linkInvestData
                                      .R_ESTATE_SELF_RATE || 0,
                                  ) +
                                  parseFloat(
                                    disclosureData.linkInvestData
                                      .ETC_SELF_RATE || 0,
                                  )
                                ).toFixed(1)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                    {/* 거래구조 및 영업방식 */}
                    <View style={[styles.subWhitebox, styles.mt8, styles.pb36]}>
                      <View style={styles.subSTitleBox}>
                        <Text style={styles.subSTitle}>
                          거래구조 및 영업방식
                        </Text>
                      </View>
                      <View style={styles.dotTextList}>
                        <View style={styles.dotTextItem}>
                          <Text style={styles.dotTextBullet}>•</Text>
                          <Text style={styles.dotTextContent}>
                            루트인프라금융㈜는 차입자로부터 대출신청을,
                            투자자로부터 투자신청을 받습니다.
                          </Text>
                        </View>
                        <View style={styles.dotTextItem}>
                          <Text style={styles.dotTextBullet}>•</Text>
                          <Text style={styles.dotTextContent}>
                            투자자는 농협은행이 관리하는 계좌(예치기관 계좌)로
                            투자금을 입금하고, 농협은행은 루트인프라금융㈜
                            지시에 따라 차입자에게 대출금을 지급합니다.
                          </Text>
                        </View>
                        <View style={styles.dotTextItem}>
                          <Text style={styles.dotTextBullet}>•</Text>
                          <Text style={styles.dotTextContent}>
                            차입자는 예치기관 계좌로 상환금을 납부하고,
                            농협은행은 루트인프라금융㈜ 지시에 따라 상환금을
                            투자자에게 정산합니다.
                          </Text>
                        </View>
                        <View style={styles.dotTextItem}>
                          <Text style={styles.dotTextBullet}>•</Text>
                          <Text style={styles.dotTextContent}>
                            위 과정에서 루트인프라금융㈜는 차입자와 투자자로부터
                            소정의 플랫폼이용료를 지급받습니다.
                          </Text>
                        </View>
                      </View>
                      <View style={styles.subConImgbox}>
                        <Image
                          source={require('../assets/images/img_business_method.png')}
                          style={styles.businessMethodImg}
                          resizeMode="contain"
                        />
                      </View>
                    </View>

                    {/* 차입자의 상환능력 평가체계 등 */}
                    <View
                      style={[
                        styles.subWhitebox,
                        styles.mt8,
                        styles.pb36,
                        styles.mb40,
                      ]}
                    >
                      <View style={styles.subSTitleBox}>
                        <Text style={styles.subSTitle}>
                          차입자의 상환능력 평가체계
                        </Text>
                      </View>
                      <View style={[styles.pr20, styles.pl20]}>
                        <Text style={styles.infoText}>
                          당사는 재생에너지 발전사업자에 대한 특화된 p2p 금융을
                          제공하기 위하여 전문적인 심사역이{' '}
                          {'<신용평가업무기준>'}에 따라 차입자의 상환능력,
                          담보의 적정성 평가 등을 종합적으로 평가하여 대출이
                          실행됩니다. 특히 차입자의 신용등급을 10등급으로
                          분류하여 6등급 이상의 경우에만 대출함을 원칙으로
                          합니다.{'\n'}
                          재생에너지 발전사업자에 대하여 자체 개발한
                          신용평가시스템(Credit Scoring System)을 기반으로
                          정량적 평가기준인 사업의 안정성, 연체 위험성. 원금회수
                          가능성(만기상환) 등과 정성적 평가기준인 정책당국의
                          평가 요인 등을 고려하여 차입자의 상환능력을 종합적으로
                          평가합니다. 구체적인 내용은 프로그램화되어 있습니다.
                        </Text>
                      </View>

                      <View style={styles.subSTitleBox}>
                        <Text style={styles.subSTitle}>
                          대출이자에 관한 사항
                        </Text>
                      </View>
                      <View style={[styles.pr20, styles.pl20]}>
                        <Text style={styles.infoText}>
                          대출금리는 연 15% 이하로 상품 유형과 조건에 따라
                          개별적으로 산정됩니다(연체금리 : 대출금리+연 3% 이내)
                        </Text>
                      </View>

                      <View style={styles.subSTitleBox}>
                        <Text style={styles.subSTitle}>플랫폼 이용수수료</Text>
                      </View>
                      <View style={[styles.pr20, styles.pl20]}>
                        <Text style={styles.infoText}>
                          대출자의 경우, 대출금액에 따라 4.0% 이내에서
                          개별상품별로 수수료를 부과하고 있습니다. 수수료의
                          부과는 모집금액에 대한 자금집행 시점에 선취하여
                          공제합니다.{'\n'}
                          투자자의 경우, 투자금액에 대해 월 0.1% 매월 이자지급시
                          공제됩니다.{'\n'}
                          플랫폼이용수수료에는 담보권 설정비용, 신용조회비용,
                          연계대출의 만기 전에 차입자가 조기상환함에 따라
                          발생하는 비용 등은 포함되지 않습니다.
                        </Text>
                      </View>

                      <View style={styles.subSTitleBox}>
                        <Text style={styles.subSTitle}>
                          상환방식에 관한 사항
                        </Text>
                      </View>
                      <View style={[styles.pr20, styles.pl20]}>
                        <Text style={styles.infoText}>
                          원금상환방식의 유형은 만기일시상환, 원금균등상환,
                          원리금균등상환 방식이 있습니다. 개별 상품에서
                          원금상환방식을 안내하고 있습니다.{'\n'}- 만기일시상환:
                          투자기간 종료일에 원금과 마지막 회차 이자가 상환되는
                          방식{'\n'}- 원금균등상환: 투자원금을 투자기간으로 나눈
                          금액에 월별이자를 합산하여 상환하는 방식{'\n'}-
                          원리금균등상환: 투자원금과 이자를 투자기간동안
                          고정이자율로 산정하여 매월 같은 금액으로 나누어
                          상환하는 방식
                        </Text>
                      </View>

                      <View style={styles.subSTitleBox}>
                        <Text style={styles.subSTitle}>
                          투자금 예치기관에 관한 사항
                        </Text>
                      </View>
                      <View style={[styles.pr20, styles.pl20]}>
                        <Text style={styles.infoText}>
                          루트인프라금융㈜는 이용자의 자산을 보호하기 위해
                          농협은행과 투자예치금 및 투자 채권에 대한 신탁관리
                          시스템을 구축하여 운영하고 있습니다.
                        </Text>
                        <View style={styles.nhTextBox}>
                          <Text style={styles.nhText}>NH농협은행</Text>
                        </View>
                        <Text style={[styles.starNotif, styles.mt20]}>
                          ※ NH농협은행은 투자금 보관 등 계좌개설, 투자금 및
                          대출금 지급대행, 원리금 수납대행 업무 등을 수행합니다.
                        </Text>
                      </View>

                      <View style={styles.subSTitleBox}>
                        <Text style={styles.subSTitle}>
                          채무불이행시 채권추심 등 원리금 회수방식에 관한 사항
                        </Text>
                      </View>
                      <View style={[styles.pr20, styles.pl20]}>
                        <Text style={styles.infoText}>
                          투자자 보호를 위하여 연체 중인 채권을 회수하는
                          방식으로 별도의 법무법인 또는 신용정보회사에 채권
                          추심을 위임하거나. 채권매입추심업자에게 채권을
                          매각하여 원리금 회수 절차를 진행합니다.{'\n'}
                          연체채권 추심과정에서 발생하는 수수료 및 법적조치
                          비용은 채무자 등으로부터 상환된 원리금에서 공제될 수
                          있으며, 투자자의 투자금 및 수익금이 일부 감소될 수
                          있습니다. 추심관리 비용으로는 재산조사 및 민사소송
                          진행비용, 가압류 등 관련비용. 매각자문사 보수.
                          신용정보회사 업무 착수비용 및 회수성공수수료 등이
                          포함됩니다.
                        </Text>
                      </View>

                      <View style={styles.subSTitleBox}>
                        <Text style={styles.subSTitle}>
                          계약의 해제·해지에 관한 사항
                        </Text>
                      </View>
                      <View style={[styles.pr20, styles.pl20]}>
                        <Text style={styles.infoText}>
                          투자자는 투자금 모집 완료 전에 투자 철회 가능하며
                          회사는 투자금 반환 의무가 있습니다. 다만 자금모집
                          완료된 이후에는 투자 철회할 수 없습니다.{'\n'}
                          회사는 ① 차입자 정보에 변동이 있는 경우, ② 파산,
                          개인회생 등 채무불이행 위험이 의심되는 경우, ③
                          연계대출 신청이 취소되는 경우 해당 사유를 통지하고
                          투자 취소와 함께 투자금 반환합니다.
                        </Text>
                      </View>
                    </View>
                  </ScrollView>
                )}
              </View>
            ) : activeTab === 2 ? (
              /* 언론보도 갤러리 리스트 */
              noticeList.length === 0 ? (
                <View style={styles.loadingWrapperEmpty}>
                  <View style={styles.emptyIcon} />
                  <Text style={styles.emptyMsg}>조회된 목록이 없습니다.</Text>
                </View>
              ) : (
                <>
                  <View style={styles.galleryList}>
                    {visibleItems.map((item, index) => (
                      <TouchableOpacity
                        key={item.idx}
                        style={styles.galleryItem}
                        onPress={() => {
                          if (item.link_url) {
                            Linking.openURL(item.link_url);
                          }
                        }}
                      >
                        <View style={styles.galleryImgbox}>
                          {item.thumbnail ? (
                            <Image
                              source={{ uri: item.thumbnail }}
                              style={styles.galleryImg}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.galleryImgPlaceholder} />
                          )}
                        </View>
                        <View style={styles.galleryTxtbox}>
                          <Text style={styles.gallerySource}>
                            {item.etc_text_1}
                          </Text>
                          <Text style={styles.galleryTit} numberOfLines={2}>
                            {item.subject}
                          </Text>
                          <Text style={styles.galleryDate}>
                            {item.recordtime?.substring(0, 10)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {/* 언론보도 더보기 버튼 */}
                  {activeTab === 2 &&
                    hasMore &&
                    (() => {
                      const { currentPage, totalPages } = getPageInfo();
                      return (
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
                      );
                    })()}
                </>
              )
            ) : activeTab === 0 ? (
              /* 공지사항 목록 */
              <>
                <View style={styles.subNotice}>
                  {/* 중요 공지 */}
                  {topList.map((item, index) => (
                    <View
                      key={`top-${item.idx}`}
                      style={[
                        styles.noticeItem,
                        index > 0 && styles.noticeItemMargin,
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.inHead,
                          styles.inHeadImportant,
                          expandedItems[`top-${item.idx}`] && styles.inHeadOn,
                        ]}
                        onPress={() => toggleItem(`top-${item.idx}`)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.typeBlue}>중요</Text>
                        <Text style={styles.titIm}>{item.subject}</Text>
                        <Text style={styles.date}>
                          {item.recordtime?.substring(0, 10)}
                        </Text>
                        <Image
                          source={require('../assets/images/ico_toggle.png')}
                          style={[
                            styles.toggleIcon,
                            expandedItems[`top-${item.idx}`] &&
                              styles.toggleIconRotated,
                          ]}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                      {expandedItems[`top-${item.idx}`] && (
                        <View style={styles.inCont}>
                          <RenderHTML
                            contentWidth={width - 40}
                            source={{ html: item.contents || '' }}
                            baseStyle={styles.contText}
                          />
                        </View>
                      )}
                    </View>
                  ))}

                  {/* 일반 공지 */}
                  {visibleItems.map((item, index) => (
                    <View
                      key={item.idx}
                      style={[
                        styles.noticeItem,
                        (index > 0 || topList.length > 0) &&
                          styles.noticeItemMargin,
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.inHead,
                          expandedItems[item.idx] && styles.inHeadOn,
                        ]}
                        onPress={() => toggleItem(item.idx)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.tit}>{item.subject}</Text>
                        <Text style={styles.date}>
                          {item.recordtime?.substring(0, 10)}
                        </Text>
                        <Image
                          source={require('../assets/images/ico_toggle.png')}
                          style={[
                            styles.toggleIconGeneral,
                            expandedItems[item.idx] && styles.toggleIconRotated,
                          ]}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                      {expandedItems[item.idx] && (
                        <View style={styles.inCont}>
                          <RenderHTML
                            contentWidth={width - 40}
                            source={{ html: item.contents || '' }}
                            baseStyle={styles.contText}
                          />
                          {item.files && item.files.length > 0 && (
                            <View style={styles.fileBox}>
                              <Text style={styles.fileTitle}>첨부자료</Text>
                              {item.files.map((file, fileIndex) => (
                                <TouchableOpacity
                                  key={fileIndex}
                                  onPress={() => {
                                    if (file.filePath) {
                                      Linking.openURL(file.filePath);
                                    }
                                  }}
                                >
                                  <Text style={styles.fileLink}>
                                    {file.fileName}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
                {/* 공지사항 더보기 버튼 */}
                {hasMore &&
                  (() => {
                    const { currentPage, totalPages } = getPageInfo();
                    return (
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
                    );
                  })()}
              </>
            ) : activeTab === 1 ? (
              /* 자주하는 질문 목록 */
              <>
                <View style={styles.subNotice}>
                  {visibleItems.map((item, index) => (
                    <View
                      key={item.idx}
                      style={[
                        styles.faqItem,
                        index > 0 && styles.noticeItemMargin,
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.faqHead,
                          expandedItems[item.idx] && styles.inHeadOn,
                        ]}
                        onPress={() => toggleItem(item.idx)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.faqTit}>{item.subject}</Text>
                        <Image
                          source={require('../assets/images/ico_toggle.png')}
                          style={[
                            styles.toggleIcon,
                            expandedItems[item.idx] && styles.toggleIconRotated,
                          ]}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                      {expandedItems[item.idx] && (
                        <View style={styles.inCont}>
                          <RenderHTML
                            contentWidth={width - 40}
                            source={{ html: item.contents || '' }}
                            baseStyle={styles.contText}
                          />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
                {/* FAQ 더보기 버튼 */}
                {hasMore &&
                  (() => {
                    const { currentPage, totalPages } = getPageInfo();
                    return (
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
                    );
                  })()}
              </>
            ) : (
              /* 공시안내 목록 (activeTab === 3) */
              <>
                <View style={styles.subNotice}>
                  {visibleItems.map((item, index) => (
                    <View
                      key={item.idx}
                      style={[
                        styles.noticeItem,
                        index > 0 && styles.noticeItemMargin,
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.inHead,
                          expandedItems[item.idx] && styles.inHeadOn,
                        ]}
                        onPress={() => toggleItem(item.idx)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.type}></Text>
                        <Text style={styles.tit}>{item.subject}</Text>
                        <Text style={styles.date}>
                          {item.recordtime?.substring(0, 10)}
                        </Text>
                        <Image
                          source={require('../assets/images/ico_toggle.png')}
                          style={[
                            styles.toggleIconGeneral,
                            expandedItems[item.idx] && styles.toggleIconRotated,
                          ]}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                      {expandedItems[item.idx] && (
                        <View style={styles.inCont}>
                          <RenderHTML
                            contentWidth={width - 40}
                            source={{ html: item.contents || '' }}
                            baseStyle={styles.contText}
                          />
                          {item.files && item.files.length > 0 && (
                            <View style={styles.fileBox}>
                              <Text style={styles.fileTitle}>첨부자료</Text>
                              {item.files.map((file, fileIndex) => (
                                <TouchableOpacity
                                  key={fileIndex}
                                  onPress={() => {
                                    if (file.filePath) {
                                      Linking.openURL(file.filePath);
                                    }
                                  }}
                                >
                                  <Text style={styles.fileLink}>
                                    {file.fileName}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
                {/* 공시안내 더보기 버튼 */}
                {hasMore &&
                  (() => {
                    const { currentPage, totalPages } = getPageInfo();
                    return (
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
                    );
                  })()}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* 최대주주 정보 연도 선택 모달 */}
      <AppModal
        visible={showYearModal}
        title="연도 선택"
        onClose={() => setShowYearModal(false)}
        primaryAction={{ text: '닫기', onPress: () => setShowYearModal(false) }}
      >
        {Array.from(
          { length: parseInt(disclosureData.cur_yyyy || 2024) - 2019 + 1 },
          (_, i) => 2019 + i,
        ).map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.yearItem,
              selectedYear === item && styles.yearItemSelected,
            ]}
            onPress={() => {
              setSelectedYear(item);
              setShowYearModal(false);
            }}
          >
            <Text
              style={[
                styles.yearItemText,
                selectedYear === item && styles.yearItemTextSelected,
              ]}
            >
              {item}년
            </Text>
          </TouchableOpacity>
        ))}
      </AppModal>

      {/* 상품정보 연도 선택 모달 */}
      <AppModal
        visible={showProductYearModal}
        title="연도 선택"
        onClose={() => setShowProductYearModal(false)}
        primaryAction={{
          text: '닫기',
          onPress: () => setShowProductYearModal(false),
        }}
      >
        {Array.from(
          { length: parseInt(disclosureData.cur_yyyy || 2024) - 2019 + 1 },
          (_, i) => 2019 + i,
        ).map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.yearItem,
              productYear === item && styles.yearItemSelected,
            ]}
            onPress={() => {
              setProductYear(item);
              setShowProductYearModal(false);
            }}
          >
            <Text
              style={[
                styles.yearItemText,
                productYear === item && styles.yearItemTextSelected,
              ]}
            >
              {item}년
            </Text>
          </TouchableOpacity>
        ))}
      </AppModal>

      {/* 상품정보 월 선택 모달 */}
      <AppModal
        visible={showProductMonthModal}
        title="월 선택"
        onClose={() => setShowProductMonthModal(false)}
        primaryAction={{
          text: '닫기',
          onPress: () => setShowProductMonthModal(false),
        }}
      >
        {Array.from(
          {
            length:
              productYear === parseInt(disclosureData.cur_yyyy)
                ? parseInt(disclosureData.cur_mm)
                : 12,
          },
          (_, i) => i + 1,
        ).map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.yearItem,
              productMonth === item && styles.yearItemSelected,
            ]}
            onPress={() => {
              setProductMonth(item);
              setShowProductMonthModal(false);
            }}
          >
            <Text
              style={[
                styles.yearItemText,
                productMonth === item && styles.yearItemTextSelected,
              ]}
            >
              {item < 10 ? '0' : ''}
              {item}월
            </Text>
          </TouchableOpacity>
        ))}
      </AppModal>
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
    backgroundColor: '#f5f7fa', // 연한 회색 배경
  },
  scrollContent: {
    flexGrow: 1,
  },
  subHead: {
    position: 'relative',
    marginTop: 0, // -4.8rem
    marginBottom: 16, // 1.6rem
    height: 130, // 더 아래까지 내려오도록 높이 증가
    overflow: 'hidden',
    borderBottomLeftRadius: 20, // 2rem - 하단만 둥글게
    borderBottomRightRadius: 20, // 2rem - 하단만 둥글게
  },
  bgbox: {
    width: '105%',
    height: 130,
    justifyContent: 'flex-end',
    paddingBottom: 20, // 3rem
    paddingLeft: 20, // 2rem
  },
  headTitle: {
    fontSize: 20, // 2rem
    lineHeight: 28, // 1.4 * 20
    fontWeight: '700',
    color: '#fff',
  },
  tabSwiper: {
    height: 30, // 3rem
    marginTop: 8, // 0.8rem
    paddingHorizontal: 20, // 2rem
    borderBottomWidth: 1, // 0.1rem
    borderBottomColor: '#e0e1e2',
  },
  tabScrollView: {
    flex: 1,
  },
  tabSlide: {
    marginRight: 24,
    position: 'relative',
  },
  tabLink: {
    display: 'flex',
    position: 'relative',
    paddingTop: 3, // 0.3rem
    paddingBottom: 7, // 0.7rem
    fontSize: 17, // 1.7rem
    lineHeight: 20, // 2rem
    fontWeight: '600',
    color: '#bfc3c7',
  },
  tabLinkActive: {
    color: '#2c3db8',
  },
  tabActiveBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 3, // 0.3rem
    borderRadius: 3, // 0.3rem
    backgroundColor: '#2c3db8',
  },
  loadingContainer: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  loadingWrapperEmpty: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f7fa',
  },
  emptyMsg: {
    marginTop: 20,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    color: '#666',
  },
  choiceChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 24, // 1.2rem
    paddingHorizontal: 16,
    marginBottom: -10,
  },
  chipItem: {
    minHeight: 32, // 3.2rem
    paddingVertical: 2, // 0.2rem
    paddingHorizontal: 10, // 1rem
    marginRight: 4, // 0.4rem
    marginTop: 4, // 0.4rem
    borderRadius: 16, // 1.6rem
    borderWidth: 1, // 0.1rem
    borderColor: 'rgba(191, 195, 199, 0.5)',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipItemActive: {
    borderColor: '#2c3db8',
    backgroundColor: '#fff',
  },
  chipText: {
    fontSize: 13, // 1.3rem
    lineHeight: 13,
    fontWeight: '400',
    color: '#393f44',
    textAlign: 'center',
  },
  chipTextActive: {
    color: '#2c3db8',
  },
  galleryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8, // 0.8rem
  },
  galleryItem: {
    width: '50%',
    marginTop: 30, // 3rem
    marginBottom: -4, // -0.4rem
    paddingHorizontal: 8, // 0.8rem
  },
  galleryImgbox: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9, // 적절한 비율
    borderRadius: 10, // 1rem
    overflow: 'hidden',
    backgroundColor: '#f5f7fa',
  },
  galleryImg: {
    width: '100%',
    height: '100%',
    borderRadius: 10, // 1rem
  },
  galleryImgPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e1e2',
  },
  galleryTxtbox: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 12, // 1.2rem
    paddingHorizontal: 4, // 0.4rem
  },
  gallerySource: {
    fontSize: 13, // 1.3rem
    lineHeight: 17, // 1.3 * 13
    fontWeight: '400',
    color: '#666',
  },
  galleryTit: {
    marginTop: 4, // 0.4rem
    fontSize: 18, // 1.8rem
    lineHeight: 23, // 1.3 * 18
    fontWeight: '600',
    color: '#222',
  },
  galleryDate: {
    marginTop: 8, // 0.8rem
    fontSize: 12, // 1.2rem
    lineHeight: 16, // 1.3 * 12
    fontWeight: '400',
    color: '#bfc3c7',
  },
  subNotice: {
    marginTop: 30, // 3rem
    marginBottom: 10,
    backgroundColor: 'transparent', // 투명 배경
  },
  noticeItem: {
    position: 'relative',
    backgroundColor: '#fff', // 흰색 배경
    shadowColor: '#e0e1e2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 1,
    overflow: 'hidden', // 자식 요소가 배경색을 덮지 않도록
  },
  noticeItemMargin: {
    marginTop: 10, // 0.8rem (CSS 기준 li + li)
  },
  faqItem: {
    position: 'relative',
    backgroundColor: '#fff',
    shadowColor: '#e0e1e2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 1,
    overflow: 'hidden',
  },
  faqHead: {
    position: 'relative',
    paddingTop: 16,
    paddingBottom: 14,
    paddingLeft: 16,
    paddingRight: 54,
  },
  faqTit: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    color: '#222',
  },
  inHead: {
    position: 'relative',
    paddingTop: 10, // 일반 목록 높이 줄임
    paddingBottom: 10, // 일반 목록 높이 줄임
    paddingLeft: 16, // 1.6rem
    paddingRight: 54, // 5.4rem (토글 아이콘 공간)
  },
  inHeadImportant: {
    paddingTop: 12, // 중요 공지는 높이를 더 높게
    paddingBottom: 12,
  },
  inHeadOn: {
    // 열렸을 때 스타일 (필요시 추가)
  },
  toggleIcon: {
    position: 'absolute',
    top: 20, // 2rem (CSS 기준) - 중요 목록용
    right: 20, // 2rem
    width: 18, // 1.8rem
    height: 18, // 1.8rem
  },
  toggleIconGeneral: {
    position: 'absolute',
    top: 10, // 일반 목록용 - 높이 줄임
    right: 20, // 2rem
    width: 18, // 1.8rem
    height: 15, // 1.8rem
  },
  toggleIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  type: {
    fontSize: 13, // 1.3rem
    lineHeight: 17, // 1.3 * 13
    fontWeight: '400',
    color: '#666',
  },
  typeBlue: {
    fontSize: 13, // 1.3rem
    lineHeight: 17, // 1.3 * 13
    fontWeight: '400',
    color: '#2c3db8',
  },
  typeRed: {
    fontSize: 13, // 1.3rem
    lineHeight: 17, // 1.3 * 13
    fontWeight: '400',
    color: '#ff0000',
  },
  tit: {
    marginTop: 4, // 일반 목록 타이틀 위 공백 줄임
    fontSize: 18, // 1.8rem
    lineHeight: 23, // 1.3 * 18
    fontWeight: '600',
    color: '#222',
  },
  titIm: {
    marginTop: 8, // 0.8rem
    fontSize: 18, // 1.8rem
    lineHeight: 23, // 1.3 * 18
    fontWeight: '600',
    color: '#222',
  },
  date: {
    marginTop: 8, // 0.8rem
    fontSize: 12, // 1.2rem
    lineHeight: 16, // 1.3 * 12
    fontWeight: '400',
    color: '#bfc3c7',
  },
  inCont: {
    paddingTop: 24, // 2.4rem
    paddingBottom: 32, // 3.2rem
    paddingHorizontal: 20, // 2rem
    borderTopWidth: 1, // 0.1rem
    borderTopColor: 'rgba(224, 225, 226, 0.5)',
  },
  contText: {
    fontSize: 15, // 1.5rem
    lineHeight: 22.5, // 1.5 * 15
    fontWeight: '400',
    color: '#666',
    padding: 0,
    margin: 0,
  },
  fileBox: {
    marginTop: 16,
  },
  fileTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  fileLink: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: '#2c3db8',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  disclosureContainer: {
    flex: 1,
    marginTop: 10,
    marginBottom: 40,
  },
  disclosureContent: {
    flex: 1,
    //paddingHorizontal: 16,
  },
  subWhitebox: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    backgroundColor: '#fff',
    shadowColor: 'rgba(224, 225, 226, 0.5)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
  },
  mt8: {
    marginTop: 8, // 0.8rem
  },
  mt20: {
    marginTop: 20, // 2rem
  },
  pb24: {
    paddingBottom: 24, // 2.4rem
  },
  pb36: {
    paddingBottom: 36, // 3.6rem
  },
  mb40: {
    marginBottom: 40, // 4rem
  },
  mb20: {
    marginBottom: 20, // 2rem
  },
  subSTitleBox: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24, // 2.4rem
    paddingHorizontal: 20, // 2rem
  },
  subSTitle: {
    fontSize: 20, // 2rem
    lineHeight: 26, // 1.3 * 20
    fontWeight: '700',
    color: '#222',
  },
  dlBetweenBox: {
    paddingTop: 24, // 2.4rem
    paddingBottom: 24,
    paddingHorizontal: 20, // 2rem
  },
  dlBetween: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dlBetweenMargin: {
    marginTop: 16, // 1.6rem - .dl_between + .dl_between
  },
  dlDt: {
    color: '#666',
    fontSize: 14, // 1.4rem
    lineHeight: 18.2, // 1.3 * 14
    fontWeight: '400',
  },
  dlDd: {
    fontSize: 17, // 1.7rem
    lineHeight: 25.5, // 1.5 * 17
    fontWeight: '600',
    color: '#222',
    textAlign: 'right',
  },
  pr20: {
    paddingRight: 20, // 2rem
  },
  pl20: {
    paddingLeft: 20, // 2rem
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 75,
    height: 33,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 30,
    backgroundColor: '#fff',
    marginLeft: 'auto',
  },
  yearSelectorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#222',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  modalTitle: {
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
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  yearItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f7fa',
  },
  yearItemSelected: {
    backgroundColor: '#f5f7fa',
  },
  yearItemText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#222',
  },
  yearItemTextSelected: {
    fontWeight: '600',
    color: '#2c3db8',
  },
  disclosureText: {
    marginTop: 15,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
    color: '#666',
  },
  starNotif: {
    marginTop: 12,
    paddingHorizontal: 15, // 2rem
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
    color: '#999',
  },
  disclosureSubTitle: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  tableContainer: {
    marginTop: 16, // 1.6rem
    width: '100%',
    borderWidth: 0,
    borderRadius: 0,
    overflow: 'hidden',
    paddingHorizontal: 15, // 2rem
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(246, 246, 246, 0.5)', // common.css의 배경색
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0,
  },
  tableRowTotal: {
    backgroundColor: 'transparent',
  },
  tableCell: {
    paddingVertical: 10, // 1rem
    paddingHorizontal: 6, // 0.6rem
    fontSize: 15, // 1.5rem
    lineHeight: 19.5, // 1.5 * 1.3
    fontWeight: '400',
    color: '#393f44',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  tableHeaderCell: {
    fontWeight: '400',
    color: '#393f44',
    borderBottomWidth: 0,
  },
  tableCellNum: {
    textAlign: 'right',
  },
  tableCellBold: {
    fontWeight: '600',
  },
  docEvidence: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2c3db8',
    alignSelf: 'flex-start',
  },
  docEvidenceText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#fff',
  },
  stepImage: {
    width: '100%',
    height: 60,
  },
  dotTextList: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  dotTextItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dotTextBullet: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
    marginRight: 8,
    marginTop: 0,
  },
  dotTextContent: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
    color: '#666',
  },
  subConImgbox: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  businessMethodImg: {
    width: '100%',
    height: undefined,
    aspectRatio: 335 / 200,
  },
  infoText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
    color: '#666',
  },
  nhTextBox: {
    marginTop: 10,
    marginHorizontal: 10,
    backgroundColor: '#f1f4f6',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nhText: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '700',
    color: '#666',
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
    paddingVertical: 10, // 1rem
    paddingHorizontal: 40, // 4rem
    borderRadius: 20, // 2rem
    borderWidth: 0.5, // 0.05rem
    borderColor: '#e0e1e2',
    backgroundColor: '#fff',
  },
  loadMoreText: {
    marginRight: 8, // 0.8rem
    fontSize: 13, // 1.3rem
    lineHeight: 19.5, // 1.5 * 13
    fontWeight: '400',
    color: '#666',
  },
});

export default CustomerServiceScreen;
