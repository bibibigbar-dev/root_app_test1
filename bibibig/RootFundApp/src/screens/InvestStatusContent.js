import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import ApiService from '../services/api';

const InvestStatusContent = ({ navigation, route, user, member_id }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [investList, setInvestList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showSellErrorModal, setShowSellErrorModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [bondSellPrice, setBondSellPrice] = useState('');
  const [hopeSellPrice, setHopeSellPrice] = useState('');
  const [scheduleData, setScheduleData] = useState([]);
  const [expandedScheduleIndex, setExpandedScheduleIndex] = useState(null);

  useEffect(() => {
    loadInvestData();
  }, []);

  const loadInvestData = async () => {
    setLoading(true);
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      
      // GET 요청으로 쿼리 파라미터 전송
      const params = {
        member_id: memberId,
      };
      
      // orderName이 있으면 추가
      if (searchText) {
        params.orderName = searchText;
      }
      
      const response = await ApiService.api.get('/app/my/invest/list', {
        params: params
      });

      if (response.data) {
        setSummary(response.data.summary || {});
        const list = response.data.list || [];
        setInvestList(list);
        
        // 페이지 계산 (2개씩 표시)
        const pages = Math.ceil(list.length / 2);
        setTotalPages(pages > 0 ? pages : 1);
      } else {
        setSummary(null);
        setInvestList([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('투자현황 조회 실패:', error);
      setSummary(null);
      setInvestList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadInvestData();
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '0';
    const stringValue = typeof value === 'string' ? value : String(value);
    const numericValue = stringValue.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // 시간 정보 제거 (공백이나 T로 구분된 시간 부분 제거)
    let dateOnly = dateString.split(' ')[0].split('T')[0];
    
    // YYYY-MM-DD 형식인 경우
    if (dateOnly.includes('-')) {
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        const year = parts[0].slice(-2); // 마지막 2자리
        const month = parts[1];
        const day = parts[2];
        return `${year}.${month}.${day}`;
      }
    }
    
    // YYYYMMDD 형식인 경우
    if (dateOnly.length === 8 && /^\d+$/.test(dateOnly)) {
      const year = dateOnly.slice(2, 4);
      const month = dateOnly.slice(4, 6);
      const day = dateOnly.slice(6, 8);
      return `${year}.${month}.${day}`;
    }
    
    // 기타 형식은 그대로 반환
    return dateOnly;
  };

  const formatDateFull = (dateString) => {
    if (!dateString) return '';
    
    let dateOnly = dateString.split(' ')[0].split('T')[0];
    
    if (dateOnly.includes('-')) {
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        return `${year}년 ${month}월 ${day}일`;
      }
    }
    
    if (dateOnly.length === 8 && /^\d+$/.test(dateOnly)) {
      const year = dateOnly.slice(0, 4);
      const month = dateOnly.slice(4, 6);
      const day = dateOnly.slice(6, 8);
      return `${year}년 ${month}월 ${day}일`;
    }
    
    return dateOnly;
  };

  const getRepayTypeText = (repayType) => {
    switch (repayType) {
      case '1':
        return '원금균등상환';
      case '2':
        return '만기일시상환';
      case '3':
        return '원리금균등상환';
      case '4':
        return '기간상환';
      default:
        return repayType || '-';
    }
  };

  const getInterestPayDate = (sort) => {
    switch (sort) {
      case 'bridge':
        return '매 1개월마다 말일';
      case 'pf':
        return '매 3개월마다 말일';
      default:
        return '매 3개월마다';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'FUNDING':
        return { text: '펀딩중', color: '#2c3db8' };
      case 'SUCCESS':
        return { text: '펀딩성공', color: '#2c3db8' };
      case 'REPAY':
      case 'OVERDUE':
        return { text: '상환중', color: '#2ebab4' };
      case 'CANCEL':
        return { text: '취소', color: '#666' };
      case 'COMPLETE':
        return { text: '상환완료', color: '#666' };
      case 'M_COMPLETE':
        return { text: '중도상환', color: '#666' };
      case 'COLLECT':
        return { text: '추심', color: '#666' };
      case 'C_COMPLETE':
        return { text: '추심완료', color: '#666' };
      case 'C_LOSS':
        return { text: '결손처리', color: '#666' };
      default:
        return { text: '펀딩중', color: '#2c3db8' };
    }
  };

  const getStatusBgColor = (status) => {
    if (status === 'FUNDING' || status === 'SUCCESS') return '#2c3db8';
    if (status === 'REPAY' || status === 'OVERDUE') return '#2ebab4';
    return '#666';
  };

  const getProductImage = (orderType) => {
    if (orderType === '태양광') {
      return require('../assets/images/img_product01_s.png');
    } else if (orderType === 'ESS') {
      return require('../assets/images/img_product02_s.png');
    } else if (orderType === '풍력') {
      return require('../assets/images/img_product03_s.png');
    } else if (orderType === '전기차충전소') {
      return require('../assets/images/img_product02_s.png');
    }
    return null;
  };

  const handleInvestCancel = async (orderNumber) => {
    Alert.alert(
      '투자취소',
      '정말 투자를 취소하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: async () => {
            try {
              const response = await ApiService.api.post('/app/product/invest/cancel', {
                orderNumber,
              });

              if (response.data === '0') {
                Alert.alert('알림', '투자가 취소되었습니다.', [
                  { text: '확인', onPress: () => loadInvestData() }
                ]);
              } else {
                Alert.alert('오류', '투자 취소 중 오류가 발생했습니다.');
              }
            } catch (error) {
              console.error('투자 취소 실패:', error);
              Alert.alert('오류', '투자 취소 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleShowInvestCertify = async (idx) => {
    try {
      // 투자 확인서는 새 창으로 열리므로 웹뷰나 외부 브라우저로 처리
      Alert.alert('알림', '투자 확인서는 웹에서 확인하실 수 있습니다.');
    } catch (error) {
      console.error('투자 확인서 조회 실패:', error);
    }
  };

  const handleShowInvestReceipt = async (idx) => {
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      
      if (!memberId) {
        Alert.alert('오류', '회원 정보를 찾을 수 없습니다.');
        return;
      }

      // 원리금수취권 증서 페이지로 이동
      navigation.navigate('InvestReceipt', {
        user: user,
        member_id: memberId,
        idx: idx,
      });
    } catch (error) {
      console.error('원리금수취권 증서 페이지 이동 실패:', error);
      Alert.alert('오류', '원리금수취권 증서 페이지로 이동하는 중 오류가 발생했습니다.');
    }
  };

  const handleOpenSellRequest = async (item) => {
    try {
      const response = await ApiService.api.post('/app/my/invest/receipt/sell', {
        idx: item.idx,
      });

      const data = typeof response.data === 'string' 
        ? JSON.parse(response.data) 
        : response.data;

      setSelectedItem(data.invest);
      
      if (data.bond_cnt === '0') {
        setShowSellModal(true);
      } else {
        setShowSellErrorModal(true);
      }
    } catch (error) {
      console.error('판매신청 정보 조회 실패:', error);
      Alert.alert('오류', '판매신청 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleRequestBondSell = async () => {
    if (!selectedItem) return;

    const bondSellPriceNum = bondSellPrice.replace(/[^0-9]/g, '');
    const hopeSellPriceNum = hopeSellPrice.replace(/[^0-9]/g, '');

    if (parseInt(bondSellPriceNum) < 10000) {
      Alert.alert('원리금수취권 판매신청', '양도 채권금액은 만원 이상 입력되어야 합니다.');
      return;
    }

    const lastFour = bondSellPriceNum.substring(bondSellPriceNum.length - 4);
    if (lastFour !== '0000') {
      Alert.alert('원리금수취권 판매신청', '양도 채권금액은 만원단위로 입력되어야 합니다.');
      return;
    }

    if (!bondSellPriceNum || bondSellPriceNum === '0') {
      Alert.alert('원리금수취권 판매신청', '양도 채권금액을 확인해 주세요.');
      return;
    }

    if (!hopeSellPriceNum || hopeSellPriceNum === '0') {
      Alert.alert('원리금수취권 판매신청', '희망 판매금액을 확인해 주세요.');
      return;
    }

    try {
      const response = await ApiService.api.post('/app/my/invest/receipt/sell/request', {
        idx: selectedItem.idx,
        bond_sell_price: bondSellPriceNum,
        hope_sell_price: hopeSellPriceNum,
      });

      if (response.data === '0') {
        Alert.alert('원리금수취권 판매신청', '정상적으로 신청되었습니다.', [
          {
            text: '확인',
            onPress: () => {
              setShowSellModal(false);
              setBondSellPrice('');
              setHopeSellPrice('');
              loadInvestData();
            },
          },
        ]);
      } else if (response.data === '1') {
        navigation.navigate('Login');
      } else if (response.data === '3') {
        Alert.alert('원리금수취권 판매신청', '양도 채권금액을 확인해 주세요.');
      } else if (response.data === '4') {
        Alert.alert('원리금수취권 판매신청', '희망 판매금액을 확인해 주세요.');
      } else if (response.data === '7') {
        Alert.alert('원리금수취권 판매신청', '양도 채권금액이 보유 채권금액보다 많습니다.');
      } else {
        Alert.alert('원리금수취권 판매신청', '처리도중 오류가 발생하였습니다.');
      }
    } catch (error) {
      console.error('판매신청 실패:', error);
      Alert.alert('원리금수취권 판매신청', '처리도중 오류가 발생하였습니다.');
    }
  };

  const handleOpenScheduleModal = async (orderNumber) => {
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      
      if (!memberId) {
        Alert.alert('오류', '회원 정보를 찾을 수 없습니다.');
        return;
      }

      const response = await ApiService.api.post('/app/market/getRepayList', {
        orderNumber,
        member_id: memberId,
      });

      if (response.data) {
        const rtnvalue = response.data.rtnvalue || response.data.rtnvalue;
        
        if (rtnvalue === '0' || rtnvalue === 0) {
          // 성공
          const repayData = response.data.repay;
          
          // repay.list 또는 repay 자체가 배열인지 확인
          let repayList = [];
          if (repayData) {
            if (Array.isArray(repayData.list)) {
              repayList = repayData.list;
            } else if (Array.isArray(repayData)) {
              repayList = repayData;
            } else if (repayData.list && typeof repayData.list === 'object') {
              // 객체인 경우 배열로 변환
              repayList = Object.values(repayData.list);
            }
          }
          
          if (repayList.length > 0) {
            setScheduleData(repayList);
            setSelectedItem({ orderNumber });
            setShowScheduleModal(true);
          } else {
            Alert.alert('알림', '상환 스케줄 정보가 없습니다.');
          }
        } else {
          // 에러 처리
          let errorMessage = '상환 스케줄을 불러올 수 없습니다.';
          switch (rtnvalue) {
            case '1':
              errorMessage = '회원 정보가 없습니다.';
              break;
            case '2':
              errorMessage = '상품 정보가 없습니다.';
              break;
            case '3':
              errorMessage = '상환 스케줄 조회에 실패했습니다.';
              break;
          }
          Alert.alert('오류', errorMessage);
        }
      }
    } catch (error) {
      console.error('상환 스케줄 조회 실패:', error);
      Alert.alert('오류', '상환 스케줄을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const toggleScheduleItem = (index) => {
    setExpandedScheduleIndex(expandedScheduleIndex === index ? null : index);
  };

  const visibleItems = investList.slice(0, currentPage * 2);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3db8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 투자 현황 요약 */}
        {summary && (
          <View style={styles.myStatusBox}>
            <View style={styles.myStatus}>
              <View style={styles.imgbox}>
                <Image
                  source={require('../assets/images/ico_my_status.png')}
                  style={styles.imgboxImg}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.myData}>
                <View style={styles.myDataDl}>
                  <Text style={[styles.myDataDt, styles.colorBlue]}>나의 투자</Text>
                  <Text style={[styles.myDataDd, styles.colorBlue]}>
                    <Text style={styles.colorBlue}>{summary.cnt || 0}</Text>건
                  </Text>
                </View>
                <View style={styles.myDataDl}>
                  <Text style={styles.myDataDt}>총 누적 투자금액</Text>
                  <Text style={styles.myDataDd}>
                    <Text>{formatCurrency(summary.price || 0)}</Text>원
                  </Text>
                </View>
                <View style={styles.myDataDl}>
                  <Text style={styles.myDataDt}>현재 투자금액</Text>
                  <Text style={styles.myDataDd}>
                    <Text>{formatCurrency(summary.remain_price || 0)}</Text>원
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 검색 영역 */}
        {investList.length > 0 && (
          <View style={styles.searchBox}>
            <View style={styles.searchInputWrapper}>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="예) 고성군 솔라발전소"
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Image
                source={require('../assets/images/ico_search.png')}
                style={styles.searchIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* 목록 영역 */}
        {investList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.loadingWrapperRepay}>
              <Image 
                source={require('../assets/images/loading2.png')} 
                style={styles.loadingIco}
                resizeMode="contain"
              />
              <Text style={styles.loadingMsg}>
                투자한 상품이 없습니다.{'\n'}지금 바로 투자해 주세요!
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.listContainer}>
              {visibleItems.map((item, index) => {
                const statusInfo = getStatusText(item.status);
                const bgColor = getStatusBgColor(item.status);
                const productIcon = getProductImage(item.orderType);

                return (
                  <View key={item.idx || index} style={styles.invItem}>
                    {/* 헤더 */}
                    <View style={[styles.inHead, { backgroundColor: bgColor }]}>
                      <Text style={styles.inHeadTitle}>
                        채권번호 <Text style={styles.inHeadTitleEm}>RB-{item.idx}</Text>
                      </Text>
                      {item.status === 'FUNDING' && item.iv_status === 'INVEST' && (
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => handleInvestCancel(item.orderNumber)}
                        >
                          <Text style={styles.cancelButtonText}>투자취소</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* 내용 */}
                    <View style={styles.inCont}>
                      <View style={styles.prdInfoBox}>
                        <View style={styles.prdInfo}>
                          <View style={styles.prdImgBox}>
                            <Image
                              source={getProductImage(item.orderType)}
                              style={styles.prdIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.prdTxtBox}>
                            <Text style={styles.prdTit} numberOfLines={1}>
                              {item.orderName}
                            </Text>
                            <Text style={styles.prdTxt}>
                              {item.orderType} {item.orderNum}호
                            </Text>
                          </View>
                        </View>
                        <View style={styles.prdPrice}>
                          <Text style={styles.prdPriceLabel}>투자금액</Text>
                          <Text style={styles.prdPriceValue}>
                            {formatCurrency(item.price)}원
                          </Text>
                        </View>
                      </View>

                      <View style={styles.prdDataBox}>
                        <View style={styles.prdDataItem}>
                          <Text style={styles.prdDataLabel}>연 수익률</Text>
                          <Text style={styles.prdDataValue}>{item.rate}%</Text>
                        </View>
                        <View style={styles.prdDataItem}>
                          <Text style={styles.prdDataLabel}>상환회차</Text>
                          <Text style={styles.prdDataValue}>
                            {item.instalment}/{item.period}
                          </Text>
                        </View>
                        <View style={styles.prdDataItem}>
                          <Text style={styles.prdDataLabel}>상환일</Text>
                          <Text style={styles.prdDataValue}>{formatDate(item.repay_date)}</Text>
                        </View>
                        <View style={styles.prdDataItem}>
                          <Text style={styles.prdDataLabel}>상태</Text>
                          <Text style={[styles.prdDataValue, { color: statusInfo.color }]}>
                            {statusInfo.text}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 버튼 영역 */}
                    <View style={styles.inBtnBox}>
                      {item.iv_status === 'INVEST' && (
                        <TouchableOpacity
                          style={styles.invBtn}
                          onPress={() => handleShowInvestCertify(item.idx)}
                        >
                          <Text style={styles.inBtn}>투자 확인서</Text>
                        </TouchableOpacity>
                      )}
                      {item.iv_status === 'TRANSFER' && (
                        <>
                          <TouchableOpacity
                            style={styles.invBtn}
                            onPress={() => handleShowInvestReceipt(item.idx)}
                          >
                            <Text style={styles.inBtn}>원리금수취권 증서</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.invBtn}
                            onPress={() => handleOpenScheduleModal(item.orderNumber)}
                          >
                            <Text style={styles.inBtn}>상환내역</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      {(item.status === 'REPAY' || item.status === 'OVERDUE') &&
                        item.iv_status === 'TRANSFER' &&
                        item.bond_yn === 'Y' && (
                          <TouchableOpacity
                            style={styles.invBtn}
                            onPress={() => handleOpenSellRequest(item)}
                          >
                            <Text style={styles.inBtn}>원리금수취권 신청</Text>
                          </TouchableOpacity>
                        )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* 더보기 버튼 */}
            {currentPage < totalPages && (
              <View style={styles.loadMoreContainer}>
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                >
                  <Text style={styles.loadMoreText}>더보기 ({currentPage}/{totalPages})</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* 원리금수취권 판매신청 모달 */}
      <Modal
        visible={showSellModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSellModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>원리금수취권 판매신청</Text>

            <View style={styles.modalBody}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>보유 채권금액</Text>
                <Text style={styles.modalValue}>
                  {formatCurrency(selectedItem?.bond_price || 0)} 원
                </Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>양도 채권금액</Text>
                <TextInput
                  style={styles.modalInput}
                  value={bondSellPrice}
                  onChangeText={(text) => {
                    const numeric = text.replace(/[^0-9]/g, '');
                    setBondSellPrice(formatCurrency(numeric));
                  }}
                  placeholder="기호('-')없이 숫자만 입력"
                  keyboardType="numeric"
                  maxLength={13}
                />
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>희망 판매금액</Text>
                <TextInput
                  style={styles.modalInput}
                  value={hopeSellPrice}
                  onChangeText={(text) => {
                    const numeric = text.replace(/[^0-9]/g, '');
                    setHopeSellPrice(formatCurrency(numeric));
                  }}
                  placeholder="기호('-')없이 숫자만 입력"
                  keyboardType="numeric"
                  maxLength={13}
                />
              </View>
            </View>

            <Text style={styles.modalNoticeText}>
              신청 후 판매를 취소하는 경우 고객센터로 문의 바랍니다.
            </Text>

            <Text style={styles.modalConfirmText}>
              원리금수취권 판매를{'\n'}신청하겠습니까?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowSellModal(false);
                  setBondSellPrice('');
                  setHopeSellPrice('');
                }}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleRequestBondSell}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                  신청하기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 판매신청 불가 모달 */}
      <Modal
        visible={showSellErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSellErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>원리금수취권 판매신청</Text>
            <Text style={styles.modalErrorText}>
              해당 채권에 대한 판매신청 내역이 존재합니다.{'\n'}
              판매 취소 및 판매금액 변경시 고객센터로 문의 바랍니다.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={() => setShowSellErrorModal(false)}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                확인
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 상환 스케줄 모달 */}
      <Modal
        visible={showScheduleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.scheduleModalContent]}>
            <View style={styles.modalBody}>
              <View style={styles.boxCalc}>
                <View style={styles.boxCalcTotal}>
                  <Text style={styles.boxCalcTotalDt}>
                    상환 스케줄
                  </Text>
                </View>
              </View>
            </View>
            <ScrollView style={styles.scheduleScroll}>
              {scheduleData.length === 0 ? (
                <View style={styles.emptyScheduleContainer}>
                  <Text style={styles.emptyScheduleText}>상환 스케줄 정보가 없습니다.</Text>
                </View>
              ) : (
                <View style={styles.repayList}>
                  {scheduleData.map((repay, index) => {
                    const isExpanded = expandedScheduleIndex === index;
                    const repayDate = repay.REAL_REPAY_DATE || repay.EX_RETURN_DATE || repay.repay_date || '';

                    return (
                      <View key={index} style={styles.repayListItem}>
                        <TouchableOpacity
                          style={styles.repayListHead}
                          onPress={() => toggleScheduleItem(index)}
                        >
                          <Text style={styles.repayListHeadDt}>
                            {index}회차
                          </Text>
                          <View style={styles.repayListHeadDd}>
                            <Text style={styles.repayListHeadDdText}>
                              세후 <Text style={styles.repayListHeadDdCnt}>
                                {formatCurrency(repay.R_RETURN_PRICE || repay.r_return_price || repay.repay_price || 0)}
                              </Text> 원
                            </Text>
                          </View>
                        </TouchableOpacity>
                        {isExpanded && (
                          <View style={styles.repayListCont}>
                            <View style={styles.boxCalc}>
                              <View style={styles.boxCalcDl}>
                                <Text style={styles.boxCalcDt}>지급일</Text>
                                <Text style={styles.boxCalcDd}>
                                  <Text style={styles.boxCalcDdCnt}>{formatDate(repayDate) || repayDate}</Text>
                                </Text>
                              </View>
                              <View style={styles.boxCalcDl}>
                                <Text style={styles.boxCalcDt}>원금</Text>
                                <Text style={styles.boxCalcDd}>
                                  <Text style={styles.boxCalcDdCnt}>{formatCurrency(repay.PRINCIPAL || repay.principal || 0)}</Text> 원
                                </Text>
                              </View>
                              <View style={styles.boxCalcDl}>
                                <Text style={styles.boxCalcDt}>이자</Text>
                                <Text style={styles.boxCalcDd}>
                                  <Text style={styles.boxCalcDdCnt}>{formatCurrency(repay.INTEREST || repay.interest || 0)}</Text> 원
                                </Text>
                              </View>
                              <View style={styles.boxCalcDl}>
                                <Text style={styles.boxCalcDt}>이자소득세</Text>
                                <Text style={styles.boxCalcDd}>
                                  <Text style={styles.boxCalcDdCnt}>{formatCurrency(repay.I_TAX || repay.i_tax || 0)}</Text> 원
                                </Text>
                              </View>
                              <View style={styles.boxCalcDl}>
                                <Text style={styles.boxCalcDt}>주민세</Text>
                                <Text style={styles.boxCalcDd}>
                                  <Text style={styles.boxCalcDdCnt}>{formatCurrency(repay.R_TAX || repay.r_tax || 0)}</Text> 원
                                </Text>
                              </View>
                              <View style={styles.boxCalcDl}>
                                <Text style={styles.boxCalcDt}>플랫폼수수료</Text>
                                <Text style={styles.boxCalcDd}>
                                  <Text style={styles.boxCalcDdCnt}>{formatCurrency(repay.I_COMMISSION || repay.i_commission || repay.commission || 0)}</Text> 원
                                </Text>
                              </View>
                              <View style={styles.boxCalcDl}>
                                <Text style={styles.boxCalcDt}>실지급액</Text>
                                <Text style={styles.boxCalcDd}>
                                  <Text style={styles.boxCalcDdCnt}>{formatCurrency(repay.R_RETURN_PRICE || repay.r_return_price || repay.repay_price || 0)}</Text> 원
                                </Text>
                              </View>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={() => {
                  setShowScheduleModal(false);
                  setExpandedScheduleIndex(null);
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                  확인
                </Text>
              </TouchableOpacity>
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
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  myStatusBox: {
    padding: 30,
    paddingHorizontal: 16,
    backgroundColor: '#f5f7fa',
  },
  myStatus: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: 'rgba(104, 111, 115, 0.15)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  imgbox: {
    flex: 0,
    marginRight: 12,
  },
  imgboxImg: {
    width: 46,
    height: 46,
  },
  myData: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  myDataDl: {
    marginRight: 12,
  },
  myDataDt: {
    color: '#666',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    //textAlign: 'right',
  },
  myDataDtEm: {
    color: '#a3a7ab',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  myDataDd: {
    marginTop: 4,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: '#222',
  },
  colorBlue: {
    color: '#2c3db8',
  },
  statusBox: {
    paddingVertical: 30,
    paddingHorizontal: 16,
    backgroundColor: '#f5f7fa',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#68738f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  statusImgBox: {
    width: 46,
    height: 46,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    width: 46,
    height: 46,
  },
  statusData: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  statusDataItem: {
    flex: 1,
  },
  statusDataLabel: {
    color: '#666',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  statusDataLabelBlue: {
    color: '#2c3db8',
  },
  statusDataLabelEm: {
    color: '#a3a7ab',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  statusDataValue: {
    marginTop: 4,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    color: '#222',
  },
  statusDataValueBlue: {
    color: '#2c3db8',
  },
  statusDataValueEm: {
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  statusSlash: {
    marginHorizontal: 5,
    color: '#e0e1e2',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '300',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginLeft: 160,
    marginRight: 16,
    gap: 5,
  },
  searchInputWrapper: {
    flex: 1,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    backgroundColor: '#fbfbfb',
  },
  searchInput: {
    flex: 1,
    height: 32,
    paddingVertical: 0,
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
    textAlignVertical: 'center',
  },
  searchButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    width: 24,
    height: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingWrapperRepay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  loadingIco: {
    width: 40,
    height: 40,
  },
  loadingMsg: {
    marginTop: 16,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyWrapper: {
    alignItems: 'center',
  },
  emptyIcon: {
    width: 40,
    height: 40,
    marginBottom: 16,
    backgroundColor: '#f6f6f6',
    borderRadius: 20,
  },
  emptyMsg: {
    marginTop: 16,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 5,
    marginTop: 15,
  },
  invItem: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: 'rgba(104, 111, 115, 0.15)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  inHead: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  inHeadTitleEm: {
    fontWeight: '600',
  },
  inHeadTxtRight: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 14,
  },
  inCont: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(224, 225, 226, 0.5)',
    borderTop: 0,
    borderBottom: 0,
  },
  inBtnBox: {
    display: 'flex',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f6f6f6',
  },
  inBtn: {
    flex: 1,
    color: '#666',
    fontSize: 13,
    lineHeight: 40,
    fontWeight: '500',
    textAlign: 'center',
  },
  invHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  invHeadTitle: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  invHeadTitleEm: {
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 7,
    paddingVertical: 0,
    height: 24,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(224, 225, 226, 0.5)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  invCont: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(224, 225, 226, 0.5)',
    borderTopWidth: 0,
  },
  prdInfoBox: {
    paddingVertical: 16,
  },
  prdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prdImgBox: {
    width: 28,
    height: 31,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prdIcon: {
    width: 28,
    height: 31,
  },
  prdTxtBox: {
    flex: 1,
    overflow: 'hidden',
  },
  prdTit: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    color: '#222',
  },
  prdTxt: {
    marginTop: 2,
    color: '#a3a7ab',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  prdPrice: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
  },
  prdPriceLabel: {
    marginRight: 8,
    color: '#666',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '400',
  },
  prdPriceValue: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#222',
  },
  prdDataBox: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(246, 246, 246, 0.5)',
  },
  prdDataItem: {
    flex: 1,
    paddingHorizontal: 10,
  },
  prdDataLabel: {
    color: '#a3a7ab',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  prdDataValue: {
    marginTop: 8,
    color: '#393f44',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    textAlign: 'right',
  },
  invBtnBox: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f6f6f6',
  },
  invBtn: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invBtnText: {
    color: '#666',
    fontSize: 13,
    lineHeight: 40,
    fontWeight: '500',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  scheduleModalContent: {
    maxHeight: '90%',
  },
  modalTitle: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  modalBody: {
    paddingHorizontal: 16,
  },
  modalRow: {
    marginTop: 20,
  },
  modalLabel: {
    marginBottom: 8,
    color: '#666',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '400',
  },
  modalValue: {
    flex: 1,
    minHeight: 44,
    paddingLeft: 8,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#222',
  },
  modalInput: {
    height: 44,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    fontSize: 15,
    backgroundColor: '#fbfbfb',
    color: '#222',
  },
  modalNoticeText: {
    marginTop: 8,
    paddingHorizontal: 16,
    color: '#666',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
    textAlign: 'center',
  },
  modalErrorText: {
    marginTop: 16,
    paddingHorizontal: 16,
    color: '#393f44',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalConfirmText: {
    marginTop: 24,
    color: '#393f44',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1,
    borderColor: '#e0e1e2',
    backgroundColor: '#fff',
  },
  modalButtonConfirm: {
    backgroundColor: '#2c3db8',
  },
  modalButtonText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#666',
  },
  modalButtonTextConfirm: {
    color: '#fff',
  },
  scheduleScroll: {
    maxHeight: 400,
    marginTop: 16,
  },
  scheduleItem: {
    marginBottom: 8,
    borderWidth: 0.1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    overflow: 'hidden',
  },
  scheduleHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  scheduleHeadLabel: {
    color: '#666',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '400',
  },
  scheduleHeadRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleHeadValue: {
    color: '#666',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '400',
  },
  scheduleArrow: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  scheduleCont: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderTopWidth: 0.1,
    borderTopColor: '#f6f6f6',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    lineHeight: 1,
  },
  scheduleLabel: {
    color: '#666',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  scheduleValue: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: '#222',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  boxCalcTotal: {
    marginBottom: 0,
    alignItems: 'center',
  },
  boxCalcTotalDt: {
    color: '#393f44',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  boxCalcTotalDtSpan: {
    fontWeight: '600',
  },
  repayList: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
  },
  repayListItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  repayListHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 12,
    paddingHorizontal: 28,
    paddingRight: 16,
  },
  repayListHeadDt: {
    color: '#666',
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
  },
  repayListHeadDd: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repayListHeadDdText: {
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
    color: '#222',
  },
  repayListHeadDdCnt: {
    fontWeight: '600',
  },
  repayListCont: {
    paddingHorizontal: 28,
    paddingVertical: 8,
    paddingBottom: 16,
  },
  repayListContRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  repayListContDt: {
    color: '#666',
    fontSize: 12,
    lineHeight: 15.6,
    fontWeight: '400',
  },
  repayListContDd: {
    fontSize: 12,
    lineHeight: 15.6,
    fontWeight: '400',
    color: '#222',
  },
  emptyScheduleContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyScheduleText: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  boxCalc: {
    paddingHorizontal: 4,
  },
  boxCalcDl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    lineHeight: 15,
  },
  boxCalcDt: {
    color: '#666',
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '400',
  },
  boxCalcDd: {
    fontSize: 16,
    lineHeight: 17,
    fontWeight: '400',
    color: '#222',
  },
  boxCalcDdCnt: {
    fontWeight: '600',
  },
});

export default InvestStatusContent;

