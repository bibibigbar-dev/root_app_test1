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
} from 'react-native';
import Header from '../components/Header';
import ApiService from '../services/api';

const RepaymentScheduleScreen = ({ navigation, route }) => {
  const { user, member_id } = route.params || {};
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
      
      const response = await ApiService.api.get('/app/my/invest/calendar', {
        params: {
          member_id: memberId,
          yyyy: currentYear,
          mm: currentMonth.toString().padStart(2, '0'),
        },
      });
      
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
              <Text style={styles.scheduleNotif}>
                이번 달 상환 예정: <Text style={styles.scheduleCount}>{calendarData.repay_count}</Text>건
              </Text>
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
                      <View style={styles.repaymentIndicator} />
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
    if (!calendarData) return null;

    const totalCount = calendarData.repay_count || 0;
    const totalAmount = calendarData.total_amount || 0;
    const totalPrincipal = calendarData.total_principal || 0;
    const totalInterest = calendarData.total_interest || 0;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>총 상환 건수</Text>
          <Text style={styles.summaryValue}>{totalCount}건</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>총 상환 금액</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}원</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>원금</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalPrincipal)}원</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>이자</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalInterest)}원</Text>
        </View>
      </View>
    );
  };

  const renderRepaymentList = () => {
    if (!calendarData || !calendarData.list || calendarData.list.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>이번 달 상환 예정 내역이 없습니다.</Text>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {calendarData.list.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.repaymentItem}
            onPress={() => {
              setSelectedRepayment(item);
              setShowDetailModal(true);
            }}
          >
            <View style={styles.repaymentItemHeader}>
              <Text style={styles.repaymentProductName}>
                {item.product_name || item.productName || '상품명 없음'}
              </Text>
              <Text style={[
                styles.repaymentStatus,
                item.status === 'Y' || item.status === '완료' ? styles.repaymentStatusComplete : styles.repaymentStatusPending
              ]}>
                {item.status === 'Y' || item.status === '완료' ? '완료' : '예정'}
              </Text>
            </View>
            <View style={styles.repaymentItemBody}>
              <View style={styles.repaymentItemRow}>
                <Text style={styles.repaymentItemLabel}>상환일</Text>
                <Text style={styles.repaymentItemValue}>
                  {item.repay_date || item.repayDate || '-'}
                </Text>
              </View>
              <View style={styles.repaymentItemRow}>
                <Text style={styles.repaymentItemLabel}>상환금액</Text>
                <Text style={styles.repaymentItemValue}>
                  {formatCurrency(item.repay_amount || item.repayAmount || 0)}원
                </Text>
              </View>
              <View style={styles.repaymentItemRow}>
                <Text style={styles.repaymentItemLabel}>원금</Text>
                <Text style={styles.repaymentItemValue}>
                  {formatCurrency(item.principal || 0)}원
                </Text>
              </View>
              <View style={styles.repaymentItemRow}>
                <Text style={styles.repaymentItemLabel}>이자</Text>
                <Text style={styles.repaymentItemValue}>
                  {formatCurrency(item.interest || 0)}원
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} user={user} />
      
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
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>상품명</Text>
                  <Text style={styles.modalValue}>
                    {selectedRepayment.product_name || selectedRepayment.productName || '-'}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>상환일</Text>
                  <Text style={styles.modalValue}>
                    {selectedRepayment.repay_date || selectedRepayment.repayDate || '-'}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>상환금액</Text>
                  <Text style={styles.modalValue}>
                    {formatCurrency(selectedRepayment.repay_amount || selectedRepayment.repayAmount || 0)}원
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>원금</Text>
                  <Text style={styles.modalValue}>
                    {formatCurrency(selectedRepayment.principal || 0)}원
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>이자</Text>
                  <Text style={styles.modalValue}>
                    {formatCurrency(selectedRepayment.interest || 0)}원
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>상태</Text>
                  <Text style={[
                    styles.modalValue,
                    selectedRepayment.status === 'Y' || selectedRepayment.status === '완료' 
                      ? styles.modalValueComplete 
                      : styles.modalValuePending
                  ]}>
                    {selectedRepayment.status === 'Y' || selectedRepayment.status === '완료' ? '완료' : '예정'}
                  </Text>
                </View>
              </ScrollView>
            )}
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    margin: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#2c3db8',
    borderRadius: 8,
    shadowColor: '#68738f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  calendarHeader: {
    position: 'relative',
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
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
    marginTop: 8,
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
    borderRadius: 8,
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
  repaymentIndicator: {
    position: 'absolute',
    top: 9,
    right: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#197cff',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: 16,
    gap: 8,
  },
  summaryBox: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#e0e1e2',
    borderRadius: 8,
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
    margin: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#a3a7ab',
    fontSize: 14,
  },
  repaymentItem: {
    marginBottom: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#e0e1e2',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  repaymentItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  repaymentProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    flex: 1,
  },
  repaymentStatus: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  repaymentStatusComplete: {
    color: '#197cff',
    backgroundColor: '#e8f4ff',
  },
  repaymentStatusPending: {
    color: '#ff6b6b',
    backgroundColor: '#ffe8e8',
  },
  repaymentItemBody: {
    gap: 8,
  },
  repaymentItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repaymentItemLabel: {
    color: '#666',
    fontSize: 13,
    fontWeight: '400',
  },
  repaymentItemValue: {
    color: '#222',
    fontSize: 13,
    fontWeight: '600',
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
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 24,
    color: '#666',
  },
  modalBody: {
    padding: 20,
  },
  modalRow: {
    marginBottom: 16,
  },
  modalLabel: {
    color: '#666',
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 4,
  },
  modalValue: {
    color: '#222',
    fontSize: 15,
    fontWeight: '600',
  },
  modalValueComplete: {
    color: '#197cff',
  },
  modalValuePending: {
    color: '#ff6b6b',
  },
});

export default RepaymentScheduleScreen;

