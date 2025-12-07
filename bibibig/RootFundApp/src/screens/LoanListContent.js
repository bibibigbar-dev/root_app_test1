import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import ApiService from '../services/api';

const LoanListContent = ({ navigation, route, user, member_id }) => {
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('list'); // 'list' or 'request'
  const [loanData, setLoanData] = useState(null);
  const [loanList, setLoanList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [displayedCount, setDisplayedCount] = useState(3); // 대출내역 초기 표시 개수

  useEffect(() => {
    setCurrentPage(1);
    setDisplayedCount(3); // 탭 변경 시 초기화
    loadLoanData();
  }, [activeSubTab]);

  const loadLoanData = async () => {
    setLoading(true);
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      
      // 대출내역과 대출신청내역에 따라 다른 API 호출
      const apiEndpoint = activeSubTab === 'request' 
        ? '/app/my/loan/request' 
        : '/app/my/loan';
      
      // GET 요청으로 쿼리 파라미터 전송
      const response = await ApiService.api.get(apiEndpoint, {
        params: {
          member_id: memberId,
        }
      });

      console.log(`${activeSubTab === 'request' ? '대출신청내역' : '대출내역'} 응답:`, response.data);

      if (response.data) {
        // 대출신청내역일 때는 requestlist와 requestavg 사용
        if (activeSubTab === 'request') {
          setLoanData(response.data.requestavg || response.data.avg || {});
          const list = response.data.requestlist || response.data.list || [];
          setLoanList(Array.isArray(list) ? list : []);
        } else {
          setLoanData(response.data.avg || {});
          const list = response.data.list || [];
          setLoanList(Array.isArray(list) ? list : []);
        }
        
        // 페이지 계산
        const listLength = activeSubTab === 'request' 
          ? (response.data.requestlist || response.data.list || []).length
          : (response.data.list || []).length;
        const pages = Math.ceil((response.data.total || listLength) / 10);
        setTotalPages(pages > 0 ? pages : 1);
      } else {
        setLoanData(null);
        setLoanList([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error(`${activeSubTab === 'request' ? '대출신청내역' : '대출내역'} 조회 실패:`, error);
      setLoanData(null);
      setLoanList([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '0';
    const stringValue = typeof value === 'string' ? value : String(value);
    const numericValue = stringValue.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'FUNDING':
      case 'SUCCESS':
        return { text: '펀딩중', color: '#2c3db8' };
      case 'REPAY':
      case 'OVERDUE':
        return { text: '상환중', color: '#2ebab4' };
      case 'CANCEL':
      case 'COMPLETE':
      case 'M_COMPLETE':
      case 'COLLECT':
      case 'C_COMPLETE':
      case 'C_LOSS':
        return { text: status === 'COMPLETE' ? '상환완료' : status === 'OVERDUE' ? '연체' : '결손', color: '#666' };
      default:
        return { text: '대기중', color: '#2c3db8' };
    }
  };

  const getStatusBgColor = (status) => {
    if (status === 'FUNDING' || status === 'SUCCESS') return '#2c3db8';
    if (status === 'REPAY' || status === 'OVERDUE') return '#2ebab4';
    return '#666';
  };

  const getProductImage = (orderType, isRequest = false) => {
    if (isRequest) {
      // 대출신청내역용 이미지
      if (orderType === '태양광') {
        return require('../assets/images/img_my_prd01.png');
      } else if (orderType === 'ESS') {
        return require('../assets/images/img_my_prd02.png');
      } else if (orderType === '풍력') {
        return require('../assets/images/img_my_prd03.png');
      } else if (orderType === '전기차충전소') {
        return require('../assets/images/img_my_prd02.png');
      }
    } else {
      // 대출내역용 이미지
      if (orderType === '태양광') {
        return require('../assets/images/img_product01_s.png');
      } else if (orderType === 'ESS') {
        return require('../assets/images/img_product02_s.png');
      } else if (orderType === '풍력') {
        return require('../assets/images/img_product03_s.png');
      } else if (orderType === '전기차충전소') {
        return require('../assets/images/img_product02_s.png');
      }
    }
    return null;
  };

  const handleLoanDetail = (orderNumber) => {
    // 대출 상세 화면으로 이동
    navigation.navigate('LoanDetail', { orderNumber, user, member_id });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 서브 탭 메뉴 */}
        <View style={styles.choiceChipsWrap}>
          <View style={styles.choiceChips}>
            <TouchableOpacity
              style={[styles.choiceChip, activeSubTab === 'list' && styles.choiceChipActive]}
              onPress={() => setActiveSubTab('list')}
            >
              <Text style={[styles.choiceChipText, activeSubTab === 'list' && styles.choiceChipTextActive]}>
                대출내역
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceChip, activeSubTab === 'request' && styles.choiceChipActive]}
              onPress={() => setActiveSubTab('request')}
            >
              <Text style={[styles.choiceChipText, activeSubTab === 'request' && styles.choiceChipTextActive]}>
                대출신청내역
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 로딩 중 표시 */}
        {loading && (
          <View style={styles.loadingContainerBelow}>
            <ActivityIndicator size="large" color="#2c3db8" />
          </View>
        )}

        {!loading && (
          <>

        {/* 대출신청 통계 - 대출신청내역일 때만 표시 */}
        {activeSubTab === 'request' && (
          <>
            <View style={styles.subLTitleBox}>
              <Text style={styles.subLTitle}>대출정보</Text>
            </View>
            <View style={styles.myStatusLBox}>
              <View style={styles.myStatusL}>
                <View style={styles.myData2}>
                  <View style={[styles.myData2Item, styles.myData2ItemFirst]}>
                    <Text style={[styles.myData2Label, styles.colorBlue]}>총 신청건수</Text>
                    <Text style={[styles.myData2Value, styles.colorBlue]}>
                      {formatCurrency(loanData?.total_loan || 0)}건
                    </Text>
                  </View>
                  <View style={styles.myData2Item}>
                    <Text style={styles.myData2Label}>심사중</Text>
                    <Text style={styles.myData2Value}>
                      {formatCurrency((loanData?.loan_eval || 0) + (loanData?.loan_sub || 0))}건
                    </Text>
                  </View>
                  <View style={styles.myData2Item}>
                    <Text style={styles.myData2Label}>대출거절</Text>
                    <Text style={styles.myData2Value}>
                      {formatCurrency(loanData?.loan_impossible || 0)}건
                    </Text>
                  </View>
                  <View style={styles.myData2Item}>
                    <Text style={styles.myData2Label}>심사통과</Text>
                    <Text style={styles.myData2Value}>
                      {formatCurrency(loanData?.loan_ready || 0)}건
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* 대출정보 - 대출내역일 때만 표시 */}
        {activeSubTab === 'list' && (
          <>
            <View style={styles.subCTitleBox}>
              <Text style={styles.title}>대출정보</Text>
            </View>
            <View style={styles.myStatusLBox}>
              <View style={styles.myStatusL}>
                <View style={styles.myData}>
                  <View style={styles.myDataItem}>
                    <Text style={styles.myDataLabel}>상환중</Text>
                    <Text style={styles.myDataValue}>
                      {formatCurrency(loanData?.loan_repay || 0)}건
                    </Text>
                  </View>
                  <View style={styles.myDataItem}>
                    <Text style={styles.myDataLabel}>대기중</Text>
                    <Text style={styles.myDataValue}>
                      {formatCurrency(loanData?.loan_funding || 0)}건
                    </Text>
                  </View>
                  <View style={styles.myDataItem}>
                    <Text style={styles.myDataLabel}>상환완료</Text>
                    <Text style={styles.myDataValue}>
                      {formatCurrency(loanData?.loan_complete || 0)}건
                    </Text>
                  </View>
                  <View style={styles.myDataItem}>
                    <Text style={styles.myDataLabel}>연체</Text>
                    <Text style={styles.myDataValue}>
                      {formatCurrency(loanData?.loan_overdue || 0)}건
                    </Text>
                  </View>
                  <View style={styles.myDataItem}>
                    <Text style={styles.myDataLabel}>결손</Text>
                    <Text style={styles.myDataValue}>
                      {formatCurrency(loanData?.loan_loss || 0)}건
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 대출현황 */}
            <View style={styles.subCTitleBox}>
              <Text style={styles.title}>대출현황</Text>
            </View>
            <View style={styles.myStatusLBox}>
              <View style={styles.myStatusL}>
                <View style={styles.myDataL}>
                  <View style={styles.myDataItem}>
                    <Text style={[styles.myDataLabel, styles.colorBlue]}>누적 대출 건</Text>
                    <Text style={[styles.myDataValue, styles.colorBlue]}>
                      {formatCurrency(loanData?.loan_cnt || 0)}건
                    </Text>
                  </View>
                </View>
                <View style={styles.myDataR}>
                  <View style={styles.myDataRow}>
                    <Text style={styles.myDataLabel}>총 대출금액</Text>
                    <Text style={styles.myDataValue}>
                      {formatCurrency(loanData?.loan_price || 0)}원
                    </Text>
                  </View>
                  <View style={styles.myDataRow}>
                    <Text style={styles.myDataLabel}>원금 잔액</Text>
                    <Text style={styles.myDataValue}>
                      {formatCurrency(loanData?.principal || 0)}원
                    </Text>
                  </View>
                  <View style={styles.myDataRow}>
                    <Text style={styles.myDataLabel}>상환 원금</Text>
                    <Text style={styles.myDataValue}>
                      {formatCurrency(loanData?.repay_principal || 0)}원
                    </Text>
                  </View>
                  <View style={styles.myDataRow}>
                    <Text style={styles.myDataLabel}>상환 이자금</Text>
                    <Text style={styles.myDataValue}>
                      {formatCurrency(loanData?.repay_interest || 0)}원
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* 대출 리스트 */}
        {loanList.length === 0 ? (
          <View style={[styles.loadingContainer, styles.loadingContainerRequest]}>
            <View style={styles.loadingWrapper}>
              <Image
                source={require('../assets/images/loading.png')}
                style={styles.loadingIco}
                resizeMode="contain"
              />
              <Text style={styles.loadingMsg}>
                조회된 목록이 없습니다.
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={[styles.listContainer, activeSubTab === 'request' && styles.listContainerRequest]}>
              {loanList.slice(0, displayedCount).map((item, index) => {
              const statusInfo = getStatusText(item.status);
              const bgColor = getStatusBgColor(item.status);
              const isRequest = activeSubTab === 'request';
              const productImage = getProductImage(item.orderType, isRequest);

              // 대출신청내역일 때와 대출내역일 때 다른 필드 사용
              const itemTitle = isRequest ? (item.lo_type || item.orderName) : item.orderName;
              const itemPrice = isRequest ? item.lo_price : (item.status === 'READY' || item.status === 'FUNDING' ? item.price : item.investment);
              const itemDate = isRequest ? item.recordtime : item.r_loan_date;
              const itemPeriod = isRequest ? item.lo_period : `${item.instalment}/${item.period}`;
              const itemType = isRequest ? item.lo_class_kr : `${item.rate}%`;
              const itemTypeLabel = isRequest ? '대출형태' : '대출이율';
              const itemPeriodLabel = isRequest ? '대출기간' : '상환회차';
              const itemDateLabel = isRequest ? '신청일자' : '대출일자';
              const priceLabel = isRequest ? '신청금액' : '대출금액';

              return (
                <View key={item.orderNumber || index} style={[styles.invItem, isRequest && styles.invItemRequest]}>
                  {/* 헤더 */}
                  <View style={[styles.inHead, { backgroundColor: bgColor }]}>
                    <Text style={styles.inHeadTitle}>
                      대출번호 <Text style={styles.inHeadTitleEm}>{item.orderNumber}</Text>
                    </Text>
                  </View>

                  {/* 내용 */}
                  <View style={styles.inCont}>
                    <View style={styles.prdInfoBox}>
                      <View style={styles.prdInfo}>
                        <View style={styles.prdImgBox}>
                          {productImage ? (
                            <Image
                              source={productImage}
                              style={styles.prdIcon}
                              resizeMode="contain"
                            />
                          ) : (
                            <View style={styles.prdIcon} />
                          )}
                        </View>
                        <View style={styles.prdTxtBox}>
                          <Text style={styles.prdTit} numberOfLines={1}>
                            {itemTitle}
                          </Text>
                        </View>
                      </View>
                      <View style={isRequest ? styles.prdPrice2 : styles.prdPrice}>
                        <Text style={styles.prdPriceLabel}>{priceLabel}</Text>
                        <Text style={styles.prdPriceValue}>
                          {formatCurrency(itemPrice || 0)}원
                        </Text>
                      </View>
                    </View>

                    <View style={styles.prdDataBox}>
                      <View style={styles.prdDataItem}>
                        <Text style={styles.prdDataLabel}>{itemDateLabel}</Text>
                        <Text style={styles.prdDataValue}>
                          {itemDate || '-'}
                        </Text>
                      </View>
                      <View style={styles.prdDataItem}>
                        <Text style={styles.prdDataLabel}>{itemPeriodLabel}</Text>
                        <Text style={styles.prdDataValue}>
                          {isRequest ? `${itemPeriod}개월` : itemPeriod}
                        </Text>
                      </View>
                      <View style={styles.prdDataItem}>
                        <Text style={styles.prdDataLabel}>{itemTypeLabel}</Text>
                        <Text style={styles.prdDataValue}>
                          {itemType || '-'}
                        </Text>
                      </View>
                      <View style={styles.prdDataItem}>
                        <Text style={styles.prdDataLabel}>상태</Text>
                        <Text style={[styles.prdDataValue, { color: statusInfo.color }]}>
                          {item.f_status_kr || statusInfo.text}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
              })}
            </View>
            {/* 더보기 버튼 */}
            {loanList.length > displayedCount && (
              <View style={styles.loadMoreContainer}>
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={() => setDisplayedCount(Math.min(displayedCount + 3, loanList.length))}
                >
                  <Text style={styles.loadMoreText}>
                    더보기 ({Math.ceil(displayedCount / 3)}/{Math.ceil(loanList.length / 3)})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
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
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f7fa',
    minHeight: '100%',
  },
  loadingContainerBelow: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    backgroundColor: '#f5f7fa',
    minHeight: 600,
  },
  choiceChipsWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#f5f7fa',
  },
  choiceChips: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  choiceChip: {
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginRight: 4,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(191, 195, 199, 0.5)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceChipActive: {
    borderColor: '#2c3db8',
  },
  choiceChipText: {
    fontSize: 13,
    lineHeight: 13,
    color: '#393f44',
    textAlign: 'center',
  },
  choiceChipTextActive: {
    color: '#2c3db8',
  },
  subCTitleBox: {
    marginTop: 24,
    paddingHorizontal: 20,
    backgroundColor: '#f5f7fa',
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  subLTitleBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
    backgroundColor: '#f5f7fa',
  },
  subLTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  myStatusLBox: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f5f7fa',
  },
  myStatusL: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    borderWidth: 1,
    borderColor: '#2c3db8',
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#68738f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  myData: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  myDataItem: {
    flexDirection: 'column',
    minWidth: '15%',
  },
  myDataLabel: {
    color: '#666',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  myDataValue: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
  },
  colorBlue: {
    color: '#2c3db8',
  },
  myDataL: {
    width: '32%',
  },
  myDataR: {
    flex: 1,
    flexDirection: 'column',
  },
  myDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#f5f7fa',
  },
  listContainerRequest: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  invItemRequest: {
    marginTop: 20,
  },
  loadingContainerRequest: {
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: '#f5f7fa',
    minHeight: 400,
  },
  invItem: {
    flexDirection: 'column',
    position: 'relative',
    marginTop: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#68738f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
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
  inCont: {
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
  prdPrice: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
  },
  prdPrice2: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
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
  myData2: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  myData2Item: {
    flexDirection: 'column',
    marginLeft: 42,
  },
  myData2ItemFirst: {
    marginLeft: 0,
  },
  myData2Label: {
    color: '#666',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  myData2Value: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  loadingIco: {
    width: 40,
    height: 40,
    marginBottom: 16,
  },
  loadingMsg: {
    marginTop: 16,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
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
});

export default LoanListContent;

