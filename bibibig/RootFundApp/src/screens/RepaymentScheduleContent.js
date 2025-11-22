import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import ApiService from '../services/api';

const RepaymentScheduleContent = ({ navigation, route, user, member_id }) => {
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRepayment, setSelectedRepayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // 현재 날짜
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const today = new Date();
  const todayDate = today.getDate();

  useEffect(() => {
    loadCalendarData();
  }, [currentYear, currentMonth]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      console.log('상환스케줄 조회 - member_id:', memberId, 'yyyy:', currentYear, 'mm:', currentMonth);
      
      // GET 요청으로 쿼리 파라미터 전송
      const response = await ApiService.api.get('/app/my/invest/calendar', {
        params: {
          member_id: memberId,
          yyyy: currentYear,
          mm: currentMonth.toString().padStart(2, '0'),
        }
      });
      
      console.log('상환스케줄 응답:', response.data);
      
      if (response.data) {
        setCalendarData(response.data);
      } else {
        setCalendarData(null);
      }
    } catch (error) {
      console.error('상환스케줄 조회 실패:', error);
      Alert.alert('오류', '상환스케줄을 불러오는데 실패했습니다.');
      setCalendarData(null);
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

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDatePress = (date) => {
    if (!calendarData || !calendarData.list) return;
    
    const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;
    const repayments = calendarData.list.filter(item => {
      const itemDate = item.repay_date || item.repayDate;
      if (!itemDate) return false;
      return itemDate.startsWith(dateStr);
    });
    
    if (repayments.length > 0) {
      setSelectedDate(date);
      setSelectedRepayment(repayments[0]);
      setShowDetailModal(true);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const renderCalendar = () => {
    if (!calendarData) return null;

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const calendarDays = [];

    // 빈 칸 추가
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(null);
    }

    // 날짜 추가
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const hasRepayment = calendarData.list?.some(item => {
        const itemDate = item.repay_date || item.repayDate;
        if (!itemDate) return false;
        return itemDate.startsWith(dateStr);
      });
      
      const isToday = currentYear === today.getFullYear() && 
                      currentMonth === today.getMonth() + 1 && 
                      day === todayDate;

      calendarDays.push({
        day,
        hasRepayment,
        isToday,
      });
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity style={styles.monthButton} onPress={handlePrevMonth}>
            <Text style={styles.monthButtonText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.monthTitleContainer}>
            <Text style={styles.monthTitle}>{currentYear}년 {currentMonth}월</Text>
            {calendarData.repay_count > 0 && (
              <View style={styles.scheduleNotif}>
                <Image 
                  source={require('../assets/images/ico_schedule_notif.png')} 
                  style={styles.scheduleNotifIco}
                  resizeMode="contain"
                />
                <Text style={styles.scheduleNotifText}>
                  {currentMonth}월 상환 상품이 <Text style={styles.scheduleCount}>{calendarData.repay_count}</Text>건 있습니다.
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.monthButton} onPress={handleNextMonth}>
            <Text style={styles.monthButtonText}>›</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.calendarContent}>
          {/* 요일 헤더 */}
          <View style={styles.weekRow}>
            {days.map((day, index) => (
              <View key={index} style={styles.weekDay}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>
          
          {/* 날짜 그리드 */}
          <View style={styles.dateGrid}>
            {calendarDays.map((dateItem, index) => {
              if (dateItem === null) {
                return <View key={index} style={styles.dateCell} />;
              }
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCell,
                    dateItem.isToday && styles.dateCellToday,
                  ]}
                  onPress={() => handleDatePress(dateItem.day)}
                >
                  <View style={[
                    styles.dateBox,
                    dateItem.hasRepayment && styles.dateBoxHasRepayment,
                  ]}>
                    <Text style={[
                      styles.dateText,
                      dateItem.isToday && styles.dateTextToday,
                    ]}>
                      {dateItem.day}
                    </Text>
                    {dateItem.hasRepayment && (
                      <View style={[
                        styles.repaymentIndicator,
                        dateItem.isToday && styles.repaymentIndicatorToday
                      ]} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderSummary = () => {
    if (!calendarData || !calendarData.list) return null;

    // 리스트에서 통계 계산
    let totalCount = 0;
    let totalPrice = 0;
    let totalPrincipal = 0;
    let totalInterest = 0;

    calendarData.list.forEach(item => {
      totalCount++;
      totalPrice += parseFloat(item.r_return_price || item.repay_amount || 0);
      totalPrincipal += parseFloat(item.principal || 0);
      totalInterest += parseFloat(item.interest || 0);
    });

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>총 상환건수</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalCount)}건</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>총 상환금액 (세후)</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalPrice)}원</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>상환원금</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalPrincipal)}원</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>세전 수익금</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalInterest)}원</Text>
        </View>
      </View>
    );
  };

  const getProductImage = (orderType) => {
    if (orderType === '태양광') {
      return require('../assets/images/ico_status01.png');
    } else if (orderType === 'ESS') {
      return require('../assets/images/ico_status04.png');
    } else if (orderType === '풍력') {
      return require('../assets/images/ico_status03.png');
    } else if (orderType === '전기차충전소') {
      return require('../assets/images/ico_status02.png');
    }
    return null;
  };

  const getStatusBgColor = (o_status) => {
    if (o_status === 'FUNDING' || o_status === 'SUCCESS') {
      return '#2c3db8'; // bg_blue
    } else if (o_status === 'REPAY' || o_status === 'OVERDUE') {
      return '#2ebab4'; // bg_mint
    }
    return '#666'; // bg_gray
  };

  const renderRepaymentList = () => {
    if (!calendarData || !calendarData.list || calendarData.list.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.loadingWrapperRepay}>
            <View style={styles.loadingIco} />
            <Text style={styles.emptyMsg}>상환 상품이 없습니다.</Text>
            <Text style={styles.emptyDesc}></Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        <View style={styles.subTitleBox}>
          <Text style={styles.subTitle}>상환 상품</Text>
        </View>
        {calendarData.list.map((item, index) => {
          const orderType = item.orderType || item.order_type || '';
          const productImage = getProductImage(orderType);
          const statusBg = getStatusBgColor(item.o_status || item.oStatus);
          
          return (
            <View key={index} style={styles.invItem}>
              <View style={[styles.invItemHead, { backgroundColor: statusBg }]}>
                <Text style={styles.invItemHeadTitle}>
                  채권번호 <Text style={styles.invItemHeadTitleEm}>RB-{item.idx || item.orderNumber || index + 1}</Text>
                </Text>
              </View>
              
              <View style={styles.invItemCont}>
                <View style={styles.prdInfoBox}>
                  <View style={styles.prdInfo}>
                    {productImage && (
                      <View style={styles.prdInfoImgBox}>
                        <Image source={productImage} style={styles.prdInfoImg} resizeMode="contain" />
                      </View>
                    )}
                    <View style={styles.prdInfoTxtBox}>
                      <Text style={styles.prdInfoTit} numberOfLines={1}>
                        {item.orderName || item.order_name || item.product_name || '상품명 없음'}
                      </Text>
                      <Text style={styles.prdInfoTxt}>
                        {orderType} {item.orderNum || item.order_num || ''}호
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.prdPrice}>
                    <Text style={styles.prdPriceDt}>투자금액</Text>
                    <Text style={styles.prdPriceDd}>{formatCurrency(item.price || 0)}원</Text>
                  </View>
                  
                  <View style={styles.prdPrice}>
                    <Text style={styles.prdPriceDt}>실지급액</Text>
                    <Text style={styles.prdPriceDd}>{formatCurrency(item.r_return_price || item.repay_amount || 0)}원</Text>
                  </View>
                </View>
                
                <View style={styles.prdDataBox}>
                  <View style={styles.prdDataBoxDl}>
                    <Text style={styles.prdDataBoxDt}>연 수익률</Text>
                    <Text style={styles.prdDataBoxDd}>{item.rate || 0}%</Text>
                  </View>
                  <View style={styles.prdDataBoxDl}>
                    <Text style={styles.prdDataBoxDt}>상환회차</Text>
                    <Text style={styles.prdDataBoxDd}>{item.repay_num || 0}/{item.period || 0}</Text>
                  </View>
                  <View style={styles.prdDataBoxDl}>
                    <Text style={styles.prdDataBoxDt}>상환일</Text>
                    <Text style={styles.prdDataBoxDd}>{item.repay_date || item.repayDate || '-'}</Text>
                  </View>
                  <View style={styles.prdDataBoxDl}>
                    <Text style={styles.prdDataBoxDt}>상태</Text>
                    <Text style={[
                      styles.prdDataBoxDd,
                      (item.status === 'N' || item.status === '예정') ? styles.colorBlue : {}
                    ]}>
                      {(item.status === 'N' || item.status === '예정') ? '지급 예정' : '지급 완료'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.invItemBtnBox}>
                <TouchableOpacity
                  style={styles.invItemBtn}
                  onPress={() => {
                    setSelectedRepayment(item);
                    setShowDetailModal(true);
                  }}
                >
                  <Text style={styles.invItemBtnText}>상세정보</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3db8" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {renderCalendar()}
          {renderSummary()}
          {renderRepaymentList()}
        </ScrollView>
      )}

      {/* 상세 정보 모달 */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>상환 상세 정보</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedRepayment && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.boxCalc}>
                  <View style={styles.boxCalcTotal}>
                    <Text style={styles.boxCalcTotalDt}>
                      상환 스케줄(<Text style={styles.boxCalcTotalDtSpan}>{selectedRepayment.repay_num || 0}회차</Text>)
                    </Text>
                  </View>
                  
                  <View style={styles.boxCalcDl}>
                    <Text style={styles.boxCalcDt}>지급일</Text>
                    <Text style={styles.boxCalcDd}>
                      <Text style={styles.boxCalcDdCnt}>{selectedRepayment.repay_date || selectedRepayment.repayDate || '-'}</Text>
                    </Text>
                  </View>
                  
                  <View style={styles.boxCalcDl}>
                    <Text style={styles.boxCalcDt}>원금</Text>
                    <Text style={styles.boxCalcDd}>
                      <Text style={styles.boxCalcDdCnt}>{formatCurrency(selectedRepayment.principal || 0)}</Text> 원
                    </Text>
                  </View>
                  
                  <View style={styles.boxCalcDl}>
                    <Text style={styles.boxCalcDt}>이자</Text>
                    <Text style={styles.boxCalcDd}>
                      <Text style={styles.boxCalcDdCnt}>{formatCurrency(selectedRepayment.interest || 0)}</Text> 원
                    </Text>
                  </View>
                  
                  <View style={styles.boxCalcDl}>
                    <Text style={styles.boxCalcDt}>이자소득세</Text>
                    <Text style={styles.boxCalcDd}>
                      <Text style={styles.boxCalcDdCnt}>{formatCurrency(selectedRepayment.i_tax || selectedRepayment.iTax || 0)}</Text> 원
                    </Text>
                  </View>
                  
                  <View style={styles.boxCalcDl}>
                    <Text style={styles.boxCalcDt}>주민세</Text>
                    <Text style={styles.boxCalcDd}>
                      <Text style={styles.boxCalcDdCnt}>{formatCurrency(selectedRepayment.r_tax || selectedRepayment.rTax || 0)}</Text> 원
                    </Text>
                  </View>
                  
                  <View style={styles.boxCalcDl}>
                    <Text style={styles.boxCalcDt}>플랫폼수수료</Text>
                    <Text style={styles.boxCalcDd}>
                      <Text style={styles.boxCalcDdCnt}>{formatCurrency(selectedRepayment.i_commission || selectedRepayment.iCommission || 0)}</Text> 원
                    </Text>
                  </View>
                  
                  <View style={styles.boxCalcDl}>
                    <Text style={styles.boxCalcDt}>실지급액</Text>
                    <Text style={styles.boxCalcDd}>
                      <Text style={styles.boxCalcDdCnt}>{formatCurrency(selectedRepayment.r_return_price || selectedRepayment.repay_amount || 0)}</Text> 원
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
            
            <View style={styles.modalBtnBox}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setShowDetailModal(false)}
              >
                <Text style={styles.modalBtnText}>확인</Text>
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
  calendarContainer: {
    marginTop: 30,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2c3db8',
    borderRadius: 10,
    shadowColor: '#68738f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  calendarHeader: {
    position: 'relative',
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#f8faff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthButtonText: {
    fontSize: 24,
    color: '#2c3db8',
    fontWeight: 'bold',
  },
  monthTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 23,
    lineHeight: 32,
    fontWeight: '700',
    color: '#222',
  },
  scheduleNotif: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  scheduleNotifIco: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  scheduleNotifText: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  scheduleCount: {
    color: '#222',
    fontWeight: '600',
  },
  calendarContent: {
    padding: 8,
  },
  weekRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
    paddingBottom: 4,
  },
  weekDay: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDayText: {
    color: '#bfc3c7',
    fontSize: 13,
    fontWeight: '400',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateCell: {
    width: '14.28%',
    height: 40,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCellToday: {
    // 오늘 날짜 스타일은 dateBox에서 처리
  },
  dateBox: {
    width: 36,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    position: 'relative',
  },
  dateBoxHasRepayment: {
    // 상환일 있는 날짜 스타일
  },
  dateText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '400',
  },
  dateTextToday: {
    color: '#222',
    fontWeight: '600',
  },
  dateCellToday: {
    borderWidth: 0.5,
    borderColor: 'rgba(119, 171, 248, 0.30)',
    backgroundColor: 'rgba(119, 171, 248, 0.05)',
  },
  repaymentIndicator: {
    position: 'absolute',
    top: 9,
    right: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#197cff',
  },
  repaymentIndicatorToday: {
    backgroundColor: '#ff5042',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: 20,
    marginTop: 20,
    gap: 8,
  },
  summaryBox: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    shadowColor: '#516c89',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLabel: {
    color: '#666',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    color: '#222',
  },
  listContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  subTitleBox: {
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    color: '#222',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  loadingWrapperRepay: {
    alignItems: 'center',
  },
  loadingIco: {
    width: 40,
    height: 40,
    backgroundColor: '#e0e1e2',
    borderRadius: 20,
  },
  emptyMsg: {
    marginTop: 16,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#222',
  },
  emptyDesc: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
  },
  invItem: {
    flexDirection: 'column',
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#68738f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  invItemHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  invItemHeadTitle: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '400',
  },
  invItemHeadTitleEm: {
    fontWeight: '600',
  },
  invItemCont: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderWidth: 0.5,
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
  prdInfoImgBox: {
    marginRight: 12,
  },
  prdInfoImg: {
    width: 28,
    height: 31,
  },
  prdInfoTxtBox: {
    flex: 1,
    overflow: 'hidden',
  },
  prdInfoTit: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    color: '#222',
  },
  prdInfoTxt: {
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
  prdPriceDt: {
    marginRight: 8,
    color: '#666',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400',
  },
  prdPriceDd: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#222',
  },
  prdDataBox: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(246, 246, 246, 0.50)',
  },
  prdDataBoxDl: {
    flex: 1,
    paddingHorizontal: 12,
  },
  prdDataBoxDt: {
    color: '#a3a7ab',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  prdDataBoxDd: {
    marginTop: 8,
    color: '#393f44',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    textAlign: 'right',
  },
  colorBlue: {
    color: '#2c3db8',
  },
  invItemBtnBox: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f6f6f6',
  },
  invItemBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  invItemBtnText: {
    color: '#666',
    fontSize: 13,
    lineHeight: 40,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(34, 34, 34, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    flex: 1,
  },
  modalCloseButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 24,
    color: '#666',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  boxCalc: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  boxCalcTotal: {
    marginBottom: 0,
  },
  boxCalcTotalDt: {
    color: '#393f44',
    fontSize: 15,
    fontWeight: '600',
  },
  boxCalcTotalDtSpan: {
    fontWeight: '600',
  },
  boxCalcDl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    lineHeight: 13,
  },
  boxCalcDt: {
    color: '#666',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
  },
  boxCalcDd: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
    color: '#222',
  },
  boxCalcDdCnt: {
    fontWeight: '600',
  },
  modalBtnBox: {
    flexDirection: 'row',
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 48,
    fontWeight: '500',
  },
});

export default RepaymentScheduleContent;

