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
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ApiService from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProductListScreen = ({ navigation, route }) => {
  const { user } = route.params || {};
  const [activeTab, setActiveTab] = useState('FUNDING');
  const [loading, setLoading] = useState(false);
  const [caseList, setCaseList] = useState([]);
  const [listShort, setListShort] = useState([]);
  const [listMiddle, setListMiddle] = useState([]);
  const [listLong, setListLong] = useState([]);
  const [promotionBanner, setPromotionBanner] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // 페이징 상태
  const [shortPage, setShortPage] = useState(1);
  const [middlePage, setMiddlePage] = useState(1);
  const [longPage, setLongPage] = useState(1);
  const itemsPerPage = 2;
  
  // 예치금 안내 표시 상태
  const [showNotif, setShowNotif] = useState(true);
  
  // 상환완료 탭 상태
  const [completeCategory, setCompleteCategory] = useState('climate'); // 'climate' or 'community'
  const [searchText, setSearchText] = useState('');
  const [completePage, setCompletePage] = useState(1);
  const completeItemsPerPage = 6;

  useEffect(() => {
    loadProductData();
    setCurrentSlideIndex(0); // 탭 변경 시 슬라이드 인덱스 초기화
    setShortPage(1); // 페이지 초기화
    setMiddlePage(1);
    setLongPage(1);
    setCompletePage(1); // 상환완료 페이지 초기화
    setSearchText(''); // 검색어 초기화
  }, [activeTab]);

  // 상환완료 탭에서 카테고리 변경 시 재조회
  useEffect(() => {
    if (activeTab === 'COMPLETE') {
      setCompletePage(1);
      loadProductData(); // 카테고리 변경 시 재조회
    }
  }, [completeCategory]);

  // 상환완료 목록 가져오기 (필터링된)
  const getCompleteList = () => {
    const sourceList = completeCategory === 'climate' ? listMiddle : listLong;
    
    // 검색어가 있으면 필터링
    if (searchText.trim()) {
      return sourceList.filter(item => 
        item.orderName?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    return sourceList;
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    if (index !== currentSlideIndex) {
      setCurrentSlideIndex(index);
    }
  };

  // idx 값에 따라 적절한 상세 화면으로 이동
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

    navigation.navigate(screenName, { 
      orderKey: item.orderKey || item.orderNumber,
      ordernumber: item.orderNumber || item.orderKey
    });
  };

  const loadProductData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'COMPLETE') {
        // 상환완료 탭: 선택된 카테고리에 따라 조회
        if (completeCategory === 'climate') {
          // 기후펀드 조회
          const response = await ApiService.api.get('/app/product/list', {
            params: {
              status: 'COMPLETE',
              sort: '',
              term: ''
            }
          });
          
          setCaseList([]);
          setListMiddle(response.data?.list || []); // 기후펀드는 list를 listMiddle에 저장
          setListLong([]);
          setListShort([]);
          setPromotionBanner([]);

        } else {
          // 커뮤니티펀드 조회
          const response = await ApiService.api.get('/app/product/list', {
            params: {
              status: 'COMPLETE',
              sort: 'innovation'
            }
          });
          
          setCaseList([]);
          setListMiddle([]);
          setListLong(response.data?.comlist || []); // 커뮤니티펀드는 comlist를 listLong에 저장
          setListShort([]);
          setPromotionBanner([]);
          
        }
      } else {
        // 모집중, 상환중 탭
        const response = await ApiService.api.get('/app/product/list', {
          params: {
            status: activeTab
          }
        });
        
        if (response.data) {
          const data = response.data;
          
          if (activeTab === 'REPAY') {
            // 상환중 탭 - 모집중과 동일한 구조
            setCaseList(data.case_list || []);
            setListShort(data.listShort || []);
            setListMiddle(data.listMiddle || []);
            setListLong(data.listLong || []);
            setPromotionBanner(data.promotion_banner || []);
          } else {
            // 모집중 탭
            setCaseList(data.case_list || []);
            setListShort(data.listShort || []);
            setListMiddle(data.listMiddle || []);
            setListLong(data.listLong || []);
            setPromotionBanner(data.promotion_banner || []);
          }
        }
      }
    } catch (error) {
      console.error('❌ 상품 리스트 조회 실패:', error);
      console.error('❌ 에러 상태 코드:', error.response?.status);
      
      // 에러 발생 시 빈 배열로 초기화
      setCaseList([]);
      setListShort([]);
      setListMiddle([]);
      setListLong([]);
      setPromotionBanner([]);
    } finally {
      setLoading(false);
    }
  };

  const renderFundTypeTag = (fundType) => {
    const tagStyles = {
      CLI: { bg: styles.userboxSkyblue, text: '기후' },
      COM: { bg: styles.userboxMint, text: '커뮤' },
      COR: { bg: styles.userboxGray, text: '법인' },
    };
    const tag = tagStyles[fundType] || { bg: styles.userboxSkyblue, text: '-' };
    
    return (
      <View style={[styles.userbox, tag.bg]}>
        <Text style={styles.userboxText}>{tag.text}</Text>
      </View>
    );
  };

  const renderStatusBg = (status) => {
    if (status === 'READY_F') return styles.statusBgWhite;
    if (status === 'FUNDING' || status === 'SUCCESS') return styles.statusBgRed;
    if (status === 'REPAY' || status === 'OVERDUE' || status === 'COLLECT') return styles.statusBgPink;
    return styles.statusBgWhite;
  };

  const renderStatusTextColor = (status) => {
    if (status === 'READY_F') return styles.statusTextRed;
    if (status === 'REPAY' || status === 'OVERDUE' || status === 'COLLECT') return styles.statusTextRed;
    return null; // 기본 흰색
  };

  const renderOrderTypeIcon = (orderType) => {
    const icons = {
      '태양광': require('../assets/images/ico_status01.png'),
      '풍력': require('../assets/images/ico_status02.png'),
      'ESS': require('../assets/images/ico_status04.png'),
      '전기차충전소': require('../assets/images/ico_status03.png'),
    };
    
    if (icons[orderType]) {
      return <Image source={icons[orderType]} style={styles.statusIco} />;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Back 버튼 - 고정 */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image 
            source={require('../assets/images/ico_back.png')} 
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 탭 메뉴 */}
        <View style={styles.tabSwiper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
            <TouchableOpacity 
              style={styles.tabItem}
              onPress={() => setActiveTab('FUNDING')}
            >
              <Text style={[styles.tabText, activeTab === 'FUNDING' && styles.tabTextActive]}>모집중</Text>
              {activeTab === 'FUNDING' && <View style={styles.tabActiveBar} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.tabItem}
              onPress={() => setActiveTab('REPAY')}
            >
              <Text style={[styles.tabText, activeTab === 'REPAY' && styles.tabTextActive]}>상환중</Text>
              {activeTab === 'REPAY' && <View style={styles.tabActiveBar} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabItem, styles.tabItemLast]}
              onPress={() => setActiveTab('COMPLETE')}
            >
              <Text style={[styles.tabText, activeTab === 'COMPLETE' && styles.tabTextActive]}>상환완료</Text>
              {activeTab === 'COMPLETE' && <View style={styles.tabActiveBar} />}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 로딩 인디케이터 */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2c3db8" />
          </View>
        )}

        {/* 투자자 후기 슬라이드 */}
        {!loading && activeTab !== 'COMPLETE' && (
          <View style={styles.subReviewSwiper}>
            {caseList.length > 0 ? (
              <>
                <ScrollView 
                  horizontal 
                  pagingEnabled={true}
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  contentContainerStyle={styles.reviewScrollContent}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  {caseList.map((item, index) => (
                    <View key={`review-${index}-${item.subject}`} style={styles.reviewSlide}>
                      <View style={styles.inbox}>
                        {renderFundTypeTag(item.fund_type)}
                        
                        {/* 페이지네이션 인디케이터 - 카드 내부 */}
                        {caseList.length > 1 && (
                          <View style={styles.paginationInCard}>
                            {caseList.map((_, dotIndex) => (
                              <View 
                                key={`pagination-${dotIndex}`} 
                                style={[
                                  styles.paginationDot,
                                  currentSlideIndex === dotIndex && styles.paginationDotActive
                                ]} 
                              />
                            ))}
                          </View>
                        )}
                        
                        <View style={styles.txtbox}>
                          <View style={styles.reviewTitContainer}>
                            <Text style={styles.reviewTit} numberOfLines={2}>
                              {String(item.subject || '')
                                .split('<br>')
                                .join('\n')
                                .split('<br/>')
                                .join('\n')
                                .split('<br />')
                                .join('\n')
                                .split('&lt;br&gt;')
                                .join('\n')
                                .split('&lt;br/&gt;')
                                .join('\n')
                                .split('&lt;br /&gt;')
                                .join('\n')
                                .replace(/<[^>]*>/g, '')
                                .replace(/&nbsp;/gi, ' ')
                                .replace(/&lt;/gi, '<')
                                .replace(/&gt;/gi, '>')
                                .replace(/&amp;/gi, '&')
                                .trim()}
                            </Text>
                          </View>
                          <View style={styles.infoName}>
                            <Text style={styles.info} numberOfLines={2}>
                              {String(item.summary || '')
                                .split('<br>')
                                .join('\n')
                                .split('<br/>')
                                .join('\n')
                                .split('<br />')
                                .join('\n')
                                .split('&lt;br&gt;')
                                .join('\n')
                                .split('&lt;br/&gt;')
                                .join('\n')
                                .split('&lt;br /&gt;')
                                .join('\n')
                                .replace(/<[^>]*>/g, '')
                                .replace(/&nbsp;/gi, ' ')
                                .replace(/&lt;/gi, '<')
                                .replace(/&gt;/gi, '>')
                                .replace(/&amp;/gi, '&')
                                .trim()}
                            </Text>
                            <Text style={styles.name}>{item.etc_text_1}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : (
              <View style={styles.emptyReview}>
                <Text style={styles.emptyText}>등록된 투자 후기가 없습니다.</Text>
              </View>
            )}
          </View>
        )}

        {/* 상환완료 탭 컨텐츠 */}
        {!loading && activeTab === 'COMPLETE' && (
          <View style={styles.completeContainer}>
            {/* 선택 칩과 검색 */}
            <View style={styles.choiceChips}>
              <TouchableOpacity
                style={[styles.chipButton, completeCategory === 'climate' && styles.chipButtonActive]}
                onPress={() => {
                  setCompleteCategory('climate');
                }}
              >
                <Text style={[styles.chipText, completeCategory === 'climate' && styles.chipTextActive]}>
                  기후펀드
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.chipButton, completeCategory === 'community' && styles.chipButtonActive]}
                onPress={() => {
                  setCompleteCategory('community');
                }}
              >
                <Text style={[styles.chipText, completeCategory === 'community' && styles.chipTextActive]}>
                  커뮤니티펀드
                </Text>
              </TouchableOpacity>

              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="예) 고성군 솔라발전소"
                  placeholderTextColor="#bfc3c7"
                  returnKeyType="search"
                  onSubmitEditing={() => {
                    setCompletePage(1);
                  }}
                />
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={() => {
                    setCompletePage(1);
                  }}
                >
                  <Image
                    source={require('../assets/images/ico_search.png')}
                    style={styles.searchIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 상환완료 상품 목록 */}
            {getCompleteList().length === 0 ? (
              <View style={styles.loadingWrapperProduct}>
                <Image 
                  source={require('../assets/images/loading1.png')}
                  style={styles.loadingIco}
                  resizeMode="contain"
                />
                <Text style={styles.loadingMsg}>조회된 상품이 없습니다.</Text>
              </View>
            ) : (
              <>
                <View style={[styles.productList, styles.mt20, styles.mb20]}>
                  {getCompleteList().slice(0, completePage * completeItemsPerPage).map((item) => (
                    <TouchableOpacity 
                      key={item.idx}
                      style={styles.productItemGray}
                      onPress={() => navigateToProductDetail(item)}
                    >
                      <View style={styles.imgboxGray}>
                        <Image 
                          source={item.filePath ? { uri: item.filePath } : require('../assets/images/re_bc5_custom.png')}
                          style={styles.productImageGray}
                          resizeMode="cover"
                        />
                        <View style={styles.statusBgGray}>
                          <Text style={styles.statusTextGray}>{item.f_status_kr}</Text>
                          <Text style={styles.splitGray}>|</Text>
                          {renderOrderTypeIcon(item.orderType)}
                        </View>
                      </View>
                      
                      <View style={styles.txtboxGray}>
                        <Text style={styles.productTitle2}>{item.orderName}</Text>
                        
                        <View style={styles.progressGroup}>
                          <View style={styles.txtInfo}>
                            <Text style={styles.rateText}>
                              연<Text style={styles.rateEm}>{item.rate}</Text><Text style={styles.rateSpan}>%</Text>
                            </Text>
                            <Text style={styles.periodText}>
                              <Text style={styles.periodEm}>{item.period_text}</Text>개월
                            </Text>
                          </View>
                          
                          <View style={styles.progressBarGray}>
                            {/* 진행율 바 - 100% */}
                          </View>
                          
                          <View style={styles.progressInfo}>
                            <Text style={styles.totalText}>
                              <Text style={styles.totalEm}>{parseInt(item.investment || 0).toLocaleString()}원</Text>
                              {' / '}
                              <Text style={styles.totalEm}>{parseInt(item.price || 0).toLocaleString()}원</Text>
                            </Text>
                            <Text style={styles.pctText}>100%</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 더보기 버튼 */}
                {getCompleteList().length > completePage * completeItemsPerPage && (
                  <View style={styles.loadMoreContainer}>
                  <TouchableOpacity 
                      style={styles.loadMoreButton}
                    onPress={() => setCompletePage(completePage + 1)}
                  >
                      <Text style={styles.loadMoreText}>
                      더보기 ({completePage}/{Math.ceil(getCompleteList().length / completeItemsPerPage)})
                    </Text>
                  </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* 상품 없음 메시지 */}
        {!loading && activeTab !== 'COMPLETE' && listShort.length === 0 && listMiddle.length === 0 && listLong.length === 0 && (
          <View style={styles.loadingWrapperProduct}>
            <Image 
              source={require('../assets/images/loading1.png')}
              style={styles.loadingIco}
              resizeMode="contain"
            />
            <Text style={styles.loadingMsg}>상품 준비중입니다.</Text>
            <Text style={styles.loadingDesc}>
              곧 상품이 등록 될 예정입니다.{'\n'}
              조금만 기다려주세요!
            </Text>
          </View>
        )}

        {/* 기후펀드 섹션 */}
        {!loading && activeTab !== 'COMPLETE' && (listShort.length > 0 || listMiddle.length > 0) && (
          <View style={styles.subTitleBox}>
            <Text style={styles.title}>기후펀드</Text>
            <Text style={styles.titleP}>
              모두의 투자로 온실가스를 감축하며 기후변화 대응에 일조합니다.
            </Text>
          </View>
        )}

        {/* 중기안정형 */}
        {!loading && activeTab !== 'COMPLETE' && listMiddle.length > 0 && (
          <>
            <View style={styles.subCTitleBox}>
              <Text style={styles.cTitle}>#중기안정형</Text>
            </View>
            <View style={styles.productList}>
              {listMiddle.slice(0, middlePage * itemsPerPage).map((item) => (
                <TouchableOpacity 
                  key={item.idx}
                  style={styles.productItem}
                  onPress={() => navigateToProductDetail(item)}
                >
                  <View style={styles.imgbox2}>
                    <Image 
                      source={item.filePath ? { uri: item.filePath } : require('../assets/images/re_bc5_custom.png')}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                    <View style={[styles.statusBg, renderStatusBg(item.status)]}>
                      <Text style={[styles.statusText, renderStatusTextColor(item.status)]}>{item.f_status_kr}</Text>
                      <Text style={[styles.split, renderStatusTextColor(item.status)]}>|</Text>
                      {renderOrderTypeIcon(item.orderType)}
                    </View>
                    <View style={[styles.tagBasic, styles.tagBlue]}>
                      <Text style={styles.tagBasicText}>안정추구</Text>
                    </View>
                  </View>
                  
                  <View style={styles.txtbox2}>
                    {item.product_ad_text && (
                      <View style={styles.adBgBlue}>
                        <Text style={styles.adText}>{item.product_ad_text}</Text>
                      </View>
                    )}
                    <Text style={[styles.productTitle, item.product_ad_text && styles.productTitleWithAd]}>{item.orderName}</Text>
                    
                    <View style={styles.progressGroup}>
                      <View style={styles.txtInfo}>
                        <Text style={styles.rateText}>
                          연 <Text style={styles.rateEm}>{item.rate}</Text>
                          <Text style={styles.rateSpan}>%</Text>
                        </Text>
                        <Text style={styles.periodText}>
                          <Text style={styles.periodEm}>{item.period_text}</Text> 개월
                        </Text>
                      </View>
                      
                      <View style={styles.progressBar}>
                        <LinearGradient
                          colors={['#8FC5FF', '#5DA7FF', '#2C7FE8', '#2c3db8']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.progressVal, { width: `${item.percent}%` }]}
                        />
                      </View>
                      
                      <View style={styles.progressInfo}>
                        <Text style={styles.totalText}>
                          <Text style={styles.totalEm}>{parseInt(item.investment || 0).toLocaleString()}원</Text>
                          {' / '}
                          <Text style={styles.totalEm}>{parseInt(item.price || 0).toLocaleString()}원</Text>
                        </Text>
                        <View style={styles.pctContainer}>
                          <Text style={styles.pctText}>{item.percent}%</Text>
                          {item.percent >= 80 && item.percent < 100 && (
                            <View style={styles.tipBgBlue}>
                              <View style={styles.tipArrow} />
                              <Text style={styles.tipText}>⏱ 곧 마감 서두르세요!</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* 더보기 버튼 */}
            {listMiddle.length > middlePage * itemsPerPage && (
              <View style={styles.loadMoreContainer}>
              <TouchableOpacity 
                  style={styles.loadMoreButton}
                onPress={() => setMiddlePage(middlePage + 1)}
              >
                  <Text style={styles.loadMoreText}>
                  더보기 ({middlePage}/{Math.ceil(listMiddle.length / itemsPerPage)})
                </Text>
              </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* 단기수익형 */}
        {!loading && activeTab !== 'COMPLETE' && listShort.length > 0 && (
          <>
            <View style={styles.subCTitleBox}>
              <Text style={styles.cTitle}>#단기수익형</Text>
            </View>
            <View style={styles.productList}>
              {listShort.slice(0, shortPage * itemsPerPage).map((item) => (
                <TouchableOpacity 
                  key={item.idx}
                  style={styles.productItem}
                  onPress={() => navigateToProductDetail(item)}
                >
                  <View style={styles.imgbox2}>
                    <Image 
                      source={item.filePath ? { uri: item.filePath } : require('../assets/images/re_bc5_custom.png')}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                    <View style={[styles.statusBg, renderStatusBg(item.status)]}>
                      <Text style={[styles.statusText, renderStatusTextColor(item.status)]}>{item.f_status_kr}</Text>
                      <Text style={[styles.split, renderStatusTextColor(item.status)]}>|</Text>
                      {renderOrderTypeIcon(item.orderType)}
                    </View>
                    <View style={[styles.tagBasic, styles.tagPink]}>
                      <Text style={styles.tagBasicText}>수익추구</Text>
                    </View>
                  </View>
                  
                  <View style={styles.txtbox2}>
                    {item.product_ad_text && (
                      <View style={styles.adBgBlue}>
                        <Text style={styles.adText}>{item.product_ad_text}</Text>
                      </View>
                    )}
                    <Text style={[styles.productTitle, item.product_ad_text && styles.productTitleWithAd]}>{item.orderName}</Text>
                    
                    <View style={styles.progressGroup}>
                      <View style={styles.txtInfo}>
                        <Text style={styles.rateText}>
                          연 <Text style={styles.rateEm}>{item.rate}</Text>
                          <Text style={styles.rateSpan}>%</Text>
                        </Text>
                        <Text style={styles.periodText}>
                          <Text style={styles.periodEm}>{item.period_text}</Text> 개월
                        </Text>
                      </View>
                      
                      <View style={styles.progressBar}>
                        <LinearGradient
                          colors={['#8FC5FF', '#5DA7FF', '#2C7FE8', '#2c3db8']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.progressVal, { width: `${item.percent}%` }]}
                        />
                      </View>
                      
                      <View style={styles.progressInfo}>
                        <Text style={styles.totalText}>
                          <Text style={styles.totalEm}>{parseInt(item.investment || 0).toLocaleString()}원</Text>
                          {' / '}
                          <Text style={styles.totalEm}>{parseInt(item.price || 0).toLocaleString()}원</Text>
                        </Text>
                        <View style={styles.pctContainer}>
                          <Text style={styles.pctText}>{item.percent}%</Text>
                          {item.percent >= 80 && item.percent < 100 && (
                            <View style={styles.tipBgBlue}>
                              <View style={styles.tipArrow} />
                              <Text style={styles.tipText}>⏱ 곧 마감 서두르세요!</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* 더보기 버튼 */}
            {listShort.length > shortPage * itemsPerPage && (
              <View style={styles.loadMoreContainer}>
              <TouchableOpacity 
                  style={styles.loadMoreButton}
                onPress={() => setShortPage(shortPage + 1)}
              >
                  <Text style={styles.loadMoreText}>
                  더보기 ({shortPage}/{Math.ceil(listShort.length / itemsPerPage)})
                </Text>
              </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* 커뮤니티펀드 섹션 */}
        {!loading && activeTab !== 'COMPLETE' && listLong.length > 0 && (
          <>
            <View style={[styles.subTitleBox]}>
              <Text style={styles.title}>커뮤니티펀드</Text>
              <Text style={styles.titleP}>
                지역 주민들이 투자자로 참여하는 대규모 발전사업 입니다.
              </Text>
            </View>

            <View style={[styles.productList, styles.mt20]}>
              {listLong.slice(0, longPage * itemsPerPage).map((item) => (
                <TouchableOpacity 
                  key={item.idx}
                  style={styles.productItem}
                  onPress={() => navigateToProductDetail(item)}
                >
                  <View style={styles.imgbox2}>
                    <Image 
                      source={item.filePath ? { uri: item.filePath } : require('../assets/images/re_bc5_custom.png')}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                    <View style={[styles.statusBg, renderStatusBg(item.status)]}>
                      <Text style={[styles.statusText, renderStatusTextColor(item.status)]}>{item.f_status_kr}</Text>
                      <Text style={[styles.split, renderStatusTextColor(item.status)]}>|</Text>
                      {renderOrderTypeIcon(item.orderType)}
                    </View>
                    <View style={[styles.tagBasic, styles.tagMint]}>
                      <Text style={styles.tagBasicText}>주민인증{'\n'}필수</Text>
                    </View>
                  </View>
                  
                  <View style={styles.txtbox2}>
                    {item.product_ad_text && (
                      <View style={styles.adBgBlue}>
                        <Text style={styles.adText}>{item.product_ad_text}</Text>
                      </View>
                    )}
                    <Text style={[styles.productTitle, item.product_ad_text && styles.productTitleWithAd]}>{item.orderName}</Text>
                    
                    <View style={styles.progressGroup}>
                      <View style={styles.txtInfo}>
                        <Text style={styles.rateText}>
                          연 <Text style={styles.rateEm}>{item.rate}</Text>
                          <Text style={styles.rateSpan}>%</Text>
                        </Text>
                        <Text style={styles.periodText}>
                          <Text style={styles.periodEm}>{item.period_text}</Text> 개월
                        </Text>
                      </View>
                      
                      <View style={styles.progressBar}>
                        <LinearGradient
                          colors={['#8FC5FF', '#5DA7FF', '#2C7FE8', '#2c3db8']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.progressVal, { width: `${item.percent}%` }]}
                        />
                      </View>
                      
                      <View style={styles.progressInfo}>
                        <Text style={styles.totalText}>
                          <Text style={styles.totalEm}>{parseInt(item.investment || 0).toLocaleString()}원</Text>
                          {' / '}
                          <Text style={styles.totalEm}>{parseInt(item.price || 0).toLocaleString()}원</Text>
                        </Text>
                        <View style={styles.pctContainer}>
                          <Text style={styles.pctText}>{item.percent}%</Text>
                          {item.percent >= 80 && item.percent < 100 && (
                            <View style={styles.tipBgBlue}>
                              <View style={styles.tipArrow} />
                              <Text style={styles.tipText}>⏱ 곧 마감 서두르세요!</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* 더보기 버튼 */}
            {listLong.length > longPage * itemsPerPage && (
              <View style={styles.loadMoreContainer}>
              <TouchableOpacity 
                  style={styles.loadMoreButton}
                onPress={() => setLongPage(longPage + 1)}
              >
                  <Text style={styles.loadMoreText}>
                  더보기 ({longPage}/{Math.ceil(listLong.length / itemsPerPage)})
                </Text>
              </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* 프로모션 배너 */}
        {!loading && activeTab !== 'COMPLETE' && promotionBanner.length > 0 && (
              <View style={styles.maImgBnSwiper}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  style={styles.bannerScrollView}
                >
                  {promotionBanner.map((banner, index) => (
                    <TouchableOpacity
                      key={`banner-${index}`}
                      style={styles.bannerSlide}
                      onPress={() => {
                        // navigation.navigate('PromotionDetail', { idx: banner.idx });
                      }}
                    >
                      <Image
                        source={{ uri: banner.product_banner_m }}
                        style={styles.bannerImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

      </ScrollView>

      {/* 예치금 안내 - 하단 고정 */}
      {!loading && activeTab !== 'COMPLETE' && showNotif && (
        <View style={styles.notifOrange}>
          <TouchableOpacity
            style={styles.btnClose}
            onPress={() => setShowNotif(false)}
          >
            <Text style={styles.btnCloseText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notifInbox}
            onPress={() => {
              // navigation.navigate('MyHome');
            }}
          >
            <View style={styles.notifTextContainer}>
              <Text style={styles.notifTxt}>투자전용계좌에 입금 후 투자 할 수 있습니다.</Text>
              {user?.session?.balance && parseInt(user.session.balance) > 0 && (
                <Text style={styles.notifAmount}>
                  예치금 {parseInt(user.session.balance).toLocaleString()}원
                </Text>
              )}
            </View>
            <Image
              source={require('../assets/images/ico_arrow_orange.png')}
              style={styles.notifArrow}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      )}
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
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  tabSwiper: {
    height: 48,
    marginTop: 0,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  tabScrollContent: {
    alignItems: 'center',
    height: '100%',
  },
  tabItem: {
    position: 'relative',
    height: '100%',
    paddingTop: 3,
    paddingHorizontal: 0,
    marginRight: 24,
    justifyContent: 'center',
  },
  tabItemLast: {
    marginRight: 0,
  },
  tabText: {
    fontSize: 17,
    lineHeight: 20,
    color: '#bfc3c7',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#2c3db8',
  },
  tabActiveBar: {
    position: 'absolute',
    right: 0,
    bottom: -1,
    left: 0,
    height: 3,
    borderRadius: 3,
    backgroundColor: '#2c3db8',
  },
  subReviewSwiper: {
    position: 'relative',
    marginTop: 16,
  },
  reviewScrollContent: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  reviewSlide: {
    width: SCREEN_WIDTH,
    height: 'auto',
    paddingLeft: 16,
    paddingRight: 16,
  },
  pagination: {
    position: 'absolute',
    top: 12,
    right: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationInCard: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
  },
  paginationDot: {
    width: 3,
    height: 3,
    borderRadius: 3,
    backgroundColor: '#d0d0d0',
  },
  paginationDotActive: {
    backgroundColor: '#2c3db8',
    width: 4,
    height: 4,
    borderRadius: 4,
  },
  emptyReview: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  inbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingRight: 36,
    paddingBottom: 16,
    paddingLeft: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  userbox: {
    flex: 0,
    width: 23,
    height: 23,
    marginTop: 2,
    marginRight: 10,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userboxSkyblue: {
    backgroundColor: '#197cff',
  },
  userboxMint: {
    backgroundColor: '#2ebab4',
  },
  userboxGray: {
    backgroundColor: '#666',
  },
  userboxText: {
    fontSize: 8,
    lineHeight: 16,
    fontWeight: '600',
    color: '#fff',
  },
  txtbox: {
    flex: 1,
  },
  reviewTitContainer: {
    height: 42,
    justifyContent: 'flex-start',
    marginBottom: 6,
  },
  reviewTit: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: '#000',
  },
  infoName: {
    display: 'flex',
    marginTop: 4,
    fontSize: 11,
    lineHeight: 13,
  },
  info: {
    fontSize: 11,
    lineHeight: 13,
    color: '#393f44',
    marginBottom: 4,
  },
  name: {
    fontSize: 11,
    lineHeight: 13,
    color: '#bfc3c7',
  },
  subTitleBox: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  titleP: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    lineHeight: 20,
  },
  mt20: {
    marginTop: 20,
  },
  subCTitleBox: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 16,
  },
  cTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  productList: {
    paddingHorizontal: 20,
    paddingTop: 0,
    marginBottom: 10,
    overflow: 'visible',
  },
  productItem: {
    flexDirection: 'row',
    marginBottom: 50,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'visible',
  },
  imgbox2: {
    position: 'relative',
    width: 80,
    height: 190,
    overflow: 'hidden',
    borderRightWidth: 1,
    borderRightColor: '#e0e1e2',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  statusBg: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 9,
  },
  statusBgWhite: {
    backgroundColor: '#f6f6f6',
    borderWidth: 1,
    borderColor: '#db2852',
  },
  statusBgRed: {
    backgroundColor: '#db2852',
  },
  statusBgPink: {
    backgroundColor: '#efe0e6',
  },
  statusBgGray: {
    backgroundColor: '#a3a7ab',
  },
  statusText: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '600',
    color: '#fff',
    paddingTop: 1,
  },
  statusTextRed: {
    color: '#db2852',
  },
  split: {
    marginHorizontal: 2,
    fontWeight: '400',
    opacity: 0.3,
    color: '#fff',
  },
  statusIco: {
    width: 9,
    height: 10,
  },
  tagBasic: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagBlue: {
    backgroundColor: '#197cff',
  },
  tagMint: {
    backgroundColor: '#2ebab4',
  },
  tagPink: {
    backgroundColor: '#db2852',
  },
  tagBasicText: {
    fontSize: 9,
    lineHeight: 10,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  txtbox2: {
    flex: 1,
    flexDirection: 'column',
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderLeftWidth: 0,
    overflow: 'visible',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  adBgBlue: {
    position: 'absolute',
    top: 20,
    left: 15,
    backgroundColor: '#2c3db8',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  adText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#f6f6f6',
  },
  productTitle: {
    marginTop: 0,
    marginBottom: 'auto',
    fontSize: 18,
    lineHeight: 23.4,
    fontWeight: '600',
    color: '#333',
  },
  productTitleWithAd: {
    marginTop: 32,
  },
  progressGroup: {
    marginTop: 0,
    overflow: 'visible',
  },
  txtInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rateText: {
    fontSize: 14,
    color: '#333',
  },
  rateEm: {
    fontSize: 35,
    fontWeight: '700',
    color: '#333',
  },
  rateSpan: {
    fontSize: 14,
    color: '#333',
  },
  periodText: {
    fontSize: 14,
    color: '#333',
  },
  periodEm: {
    fontSize: 35,
    fontWeight: '700',
    color: '#333',
  },
  progressBar: {
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressVal: {
    height: '100%',
    backgroundColor: '#2c3db8',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'visible',
  },
  totalText: {
    fontSize: 11,
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
  pctContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
  },
  tipBgBlue: {
    position: 'absolute',
    top: '100%',
    right: -12,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#197cff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#197cff',
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  tipArrow: {
    position: 'absolute',
    bottom: 27,
    right: 22,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#197cff',
  },
  tipText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
    color: '#fff',
    whiteSpace: 'nowrap',
  },
  notifOrange: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginHorizontal: 16,
    marginBottom: 30,
    paddingLeft: 38,
    borderRadius: 20,
    backgroundColor: '#f18827',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  btnClose: {
    position: 'absolute',
    top: 9,
    left: 15,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  btnCloseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
  },
  notifInbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 16,
    
  },
  notifTextContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  notifTxt: {
    fontSize: 13,
    lineHeight: 18.2,
    color: '#fff',
  },
  notifAmount: {
    fontSize: 13,
    lineHeight: 18.2,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
  },
  notifArrow: {
    width: 18,
    height: 18,
    marginLeft: 8,
    borderRadius: 20,
  },
  maImgBnSwiper: {
    position: 'relative',
    marginTop: 5,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  bannerScrollView: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  bannerSlide: {
    width: SCREEN_WIDTH - 32,
    borderRadius: 10,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: 190,
    borderRadius: 10,
  },
  backButtonContainer: {
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
  loadingWrapperProduct: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  loadingIco: {
    width: 64,
    height: 64,
  },
  loadingMsg: {
    marginTop: 26,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#333',
  },
  loadingDesc: {
    marginTop: 26,
    color: '#666',
    fontSize: 15,
    lineHeight: 22.5,
    textAlign: 'center',
  },
  loadMoreContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
  // 상환완료 탭 스타일
  completeContainer: {
    flex: 1,
  },
  choiceChips: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  chipButton: {
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginRight: 4,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(191, 195, 199, 0.5)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipButtonActive: {
    borderColor: '#2c3db8',
  },
  chipText: {
    fontSize: 13,
    lineHeight: 13,
    color: '#393f44',
    textAlign: 'center',
  },
  chipTextActive: {
    color: '#2c3db8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    marginTop: 4,
  },
  searchInput: {
    width: 130,
    height: 32,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    backgroundColor: '#fbfbfb',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: '#393f44',
  },
  searchButton: {
    padding: 0,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconText: {
    fontSize: 20,
  },
  mb40: {
    marginBottom: 40,
  },
  // 흑백 상품 카드 스타일
  productItemGray: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },
  imgboxGray: {
    position: 'relative',
    width: 80,
    height: 160,
    overflow: 'hidden',
  },
  productImageGray: {
    width: '100%',
    height: '100%',
  },
  statusBgGray: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 5,
    paddingTop: 1,
    paddingBottom: 0,
    borderRadius: 9,
    backgroundColor: '#a3a7ab',
  },
  statusTextGray: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '600',
    color: '#fff',
  },
  splitGray: {
    marginHorizontal: 2,
    fontWeight: '400',
    opacity: 0.3,
    color: '#fff',
  },
  txtboxGray: {
    flex: 1,
    padding: 15,
  },
  productTitle2: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
  },
  progressBarGray: {
    height: 5,
    backgroundColor: '#e0e1e2',
    borderRadius: 2.5,
    marginVertical: 8,
    overflow: 'hidden',
  },
  searchIcon: {
    width: 24,
    height: 24,
  },
});

export default ProductListScreen;

