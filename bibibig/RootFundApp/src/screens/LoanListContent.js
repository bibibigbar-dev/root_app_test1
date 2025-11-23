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

  useEffect(() => {
    loadLoanData();
  }, [activeSubTab]);

  const loadLoanData = async () => {
    setLoading(true);
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      
      // GET 요청으로 쿼리 파라미터 전송
      const response = await ApiService.api.get('/app/my/loan', {
        params: {
          member_id: memberId,
        }
      });

      console.log('대출내역 응답:', response.data);

      if (response.data) {
        setLoanData(response.data.avg || {});
        const list = response.data.list || [];
        setLoanList(list);
        
        // 페이지 계산
        const pages = Math.ceil((response.data.total || list.length) / 10);
        setTotalPages(pages > 0 ? pages : 1);
      } else {
        setLoanData({});
        setLoanList([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('대출내역 조회 실패:', error);
      setLoanData({});
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

  const getProductImage = (orderType) => {
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

  const handleLoanDetail = (orderNumber) => {
    // 대출 상세 화면으로 이동
    navigation.navigate('LoanDetail', { orderNumber, user, member_id });
  };

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

        {/* 대출정보 */}
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

        {/* 대출 리스트 */}
        {loanList.length === 0 ? (
          <View style={styles.loadingContainer}>
            <View style={styles.emptyWrapper}>
              <View style={styles.emptyIcon} />
              <Text style={styles.emptyMsg}>
                조회된 목록이 없습니다.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {loanList.map((item, index) => {
              const statusInfo = getStatusText(item.status);
              const bgColor = getStatusBgColor(item.status);
              const productImage = getProductImage(item.orderType);

              return (
                <View key={item.orderNumber || index} style={styles.invItem}>
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
                          <Image
                            source={productImage}
                            style={styles.prdIcon}
                            resizeMode="contain"
                          />
                        </View>
                        <TouchableOpacity
                          style={styles.prdTxtBox}
                          onPress={() => handleLoanDetail(item.orderNumber)}
                        >
                          <Text style={styles.prdTit} numberOfLines={1}>
                            {item.orderName}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.prdPrice}>
                        <Text style={styles.prdPriceLabel}>대출금액</Text>
                        <Text style={styles.prdPriceValue}>
                          {formatCurrency(
                            item.status === 'READY' || item.status === 'FUNDING'
                              ? item.price
                              : item.investment
                          )}원
                        </Text>
                      </View>
                    </View>

                    <View style={styles.prdDataBox}>
                      <View style={styles.prdDataItem}>
                        <Text style={styles.prdDataLabel}>대출이율</Text>
                        <Text style={styles.prdDataValue}>{item.rate}%</Text>
                      </View>
                      <View style={styles.prdDataItem}>
                        <Text style={styles.prdDataLabel}>상환회차</Text>
                        <Text style={styles.prdDataValue}>
                          {item.instalment}/{item.period}
                        </Text>
                      </View>
                      <View style={styles.prdDataItem}>
                        <Text style={styles.prdDataLabel}>대출일자</Text>
                        <Text style={styles.prdDataValue}>
                          {item.r_loan_date || '-'}
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
        )}
      </ScrollView>
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
  choiceChipsWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
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
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  myStatusLBox: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f5f7fa',
  },
  myStatusL: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
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
  },
  myDataItem: {
    flexDirection: 'column',
    marginRight: 36,
    marginBottom: 8,
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
    paddingBottom: 40,
    marginTop: 0,
  },
  invItem: {
    flexDirection: 'column',
    position: 'relative',
    marginTop: 30,
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
    paddingHorizontal: 12,
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
});

export default LoanListContent;

