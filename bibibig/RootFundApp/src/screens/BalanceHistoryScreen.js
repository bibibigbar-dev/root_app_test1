import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ApiService from '../services/api';

const ITEMS_PER_PAGE = 6;

const BalanceHistoryScreen = ({ navigation, route }) => {
  const { user, member_id } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'deposit', 'withdraw'
  const [currentUser, setCurrentUser] = useState(user);
  
  // 전체 데이터
  const [allDeals, setAllDeals] = useState([]);
  const [allCurrentPage, setAllCurrentPage] = useState(1);
  const [allTotalPages, setAllTotalPages] = useState(1);
  
  // 입금 데이터
  const [depositDeals, setDepositDeals] = useState([]);
  const [depositCurrentPage, setDepositCurrentPage] = useState(1);
  const [depositTotalPages, setDepositTotalPages] = useState(1);
  
  // 출금 데이터
  const [withdrawDeals, setWithdrawDeals] = useState([]);
  const [withdrawCurrentPage, setWithdrawCurrentPage] = useState(1);
  const [withdrawTotalPages, setWithdrawTotalPages] = useState(1);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadBalanceData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      if (!user) {
        const userData = await ApiService.getCurrentUser();
        if (userData) {
          setCurrentUser(userData);
        }
      } else {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
    }
  };

  const loadBalanceData = async () => {
    setLoading(true);
    try {
      const memberId = member_id || currentUser?.session?.member_id || currentUser?.id;
      
      const response = await ApiService.api.get('/app/my/balance', {
        params: { member_id: memberId }
      });

      console.log('입출금내역 응답:', response.data);

      // 응답 데이터 처리
      const data = response.data || {};
      
      // 전체 거래내역
      const deals = data.deals || [];
      const allPages = Math.ceil(deals.length / ITEMS_PER_PAGE);
      setAllDeals(deals);
      setAllTotalPages(allPages);
      setAllCurrentPage(1);
      
      // 입금 거래내역
      const dealsPlus = data.deals_plus || [];
      const depositPages = Math.ceil(dealsPlus.length / ITEMS_PER_PAGE);
      setDepositDeals(dealsPlus);
      setDepositTotalPages(depositPages);
      setDepositCurrentPage(1);
      
      // 출금 거래내역
      const dealsMinus = data.deals_minus || [];
      const withdrawPages = Math.ceil(dealsMinus.length / ITEMS_PER_PAGE);
      setWithdrawDeals(dealsMinus);
      setWithdrawTotalPages(withdrawPages);
      setWithdrawCurrentPage(1);
      
    } catch (error) {
      console.error('입출금내역 조회 실패:', error);
      Alert.alert('오류', '입출금내역을 불러오는 중 오류가 발생했습니다.');
      setAllDeals([]);
      setDepositDeals([]);
      setWithdrawDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0';
    const stringValue = typeof value === 'string' ? value : String(value);
    const numericValue = stringValue.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return dateString.substring(0, 16);
  };

  const getCurrentDeals = () => {
    if (activeTab === 'all') {
      return allDeals.slice(0, allCurrentPage * ITEMS_PER_PAGE);
    } else if (activeTab === 'deposit') {
      return depositDeals.slice(0, depositCurrentPage * ITEMS_PER_PAGE);
    } else {
      return withdrawDeals.slice(0, withdrawCurrentPage * ITEMS_PER_PAGE);
    }
  };

  const getCurrentPage = () => {
    if (activeTab === 'all') return allCurrentPage;
    if (activeTab === 'deposit') return depositCurrentPage;
    return withdrawCurrentPage;
  };

  const getTotalPages = () => {
    if (activeTab === 'all') return allTotalPages;
    if (activeTab === 'deposit') return depositTotalPages;
    return withdrawTotalPages;
  };

  const handleLoadMore = () => {
    if (activeTab === 'all') {
      if (allCurrentPage < allTotalPages) {
        setAllCurrentPage(allCurrentPage + 1);
      }
    } else if (activeTab === 'deposit') {
      if (depositCurrentPage < depositTotalPages) {
        setDepositCurrentPage(depositCurrentPage + 1);
      }
    } else {
      if (withdrawCurrentPage < withdrawTotalPages) {
        setWithdrawCurrentPage(withdrawCurrentPage + 1);
      }
    }
  };

  const renderDealItem = (item, index) => {
    const isDeposit = item.plus_price > 0;
    const amount = Math.abs((item.plus_price || 0) + (item.minus_price || 0));
    
    return (
      <View key={index} style={styles.dealItem}>
        <View style={styles.dealInbox}>
          <View style={styles.dateTitleRow}>
            <Text style={styles.dateText}>{formatDateTime(item.recordtime)}</Text>
            <Text style={styles.typeText}>{item.type_kr || '-'}</Text>
          </View>
          
          <View style={[styles.txVolume, isDeposit ? null : styles.txVolumeMinus]}>
            <Text style={styles.txType}>{isDeposit ? '입금' : '출금'}</Text>
            <Text style={[styles.txAmount, isDeposit ? styles.txAmountPlus : styles.txAmountMinus]}>
              {isDeposit ? '+' : '-'}{formatCurrency(amount)}원
            </Text>
            <Text style={styles.balanceText}>
              잔액 {formatCurrency(item.balance)}원
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
      <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3db8" />
        </View>
      </View>
    );
  }

  const currentDeals = getCurrentDeals();
  const currentPage = getCurrentPage();
  const totalPages = getTotalPages();
  const hasMore = currentPage < totalPages;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 제목 */}
        <View style={styles.titleBox}>
          <Text style={styles.title}>입출금내역</Text>
        </View>

        {/* 탭 메뉴 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'all' && styles.tabItemActive]}
            onPress={() => {
              setActiveTab('all');
              setAllCurrentPage(1);
            }}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              전체
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'deposit' && styles.tabItemActive]}
            onPress={() => {
              setActiveTab('deposit');
              setDepositCurrentPage(1);
            }}
          >
            <Text style={[styles.tabText, activeTab === 'deposit' && styles.tabTextActive]}>
              입금
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'withdraw' && styles.tabItemActive]}
            onPress={() => {
              setActiveTab('withdraw');
              setWithdrawCurrentPage(1);
            }}
          >
            <Text style={[styles.tabText, activeTab === 'withdraw' && styles.tabTextActive]}>
              출금
            </Text>
          </TouchableOpacity>
        </View>

        {/* 거래내역 리스트 */}
        <View style={styles.listContainer}>
          {currentDeals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>거래내역이 없습니다.</Text>
            </View>
          ) : (
            <>
              {currentDeals.map((item, index) => renderDealItem(item, index))}
              
              {/* 더보기 버튼 */}
              {hasMore && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                >
                  <Text style={styles.loadMoreText}>더보기</Text>
                  <Text style={styles.pageInfo}>
                    {currentPage}/{totalPages}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  titleBox: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#2c3db8',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#2c3db8',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  dealItem: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#516c89',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dealInbox: {
    padding: 16,
  },
  dateTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  typeText: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
  },
  txVolume: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txVolumeMinus: {
    // 출금 스타일 (필요시 추가)
  },
  txType: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  txAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  txAmountPlus: {
    color: '#2c3db8',
  },
  txAmountMinus: {
    color: '#e74c3c',
  },
  balanceText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '400',
  },
  loadMoreButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e1e2',
  },
  loadMoreText: {
    fontSize: 15,
    color: '#222',
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
  },
});

export default BalanceHistoryScreen;

