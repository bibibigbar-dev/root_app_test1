import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
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
      setAllTotalPages(1);
      setDepositTotalPages(1);
      setWithdrawTotalPages(1);
      setAllCurrentPage(1);
      setDepositCurrentPage(1);
      setWithdrawCurrentPage(1);
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
            <View style={styles.dateTitle}>
              <Text style={styles.dateText}>{formatDateTime(item.recordtime)}</Text>
              <Text style={styles.typeText}>{item.type_kr || '-'}</Text>
            </View>
          </View>
          
          <View style={[styles.txVolume, isDeposit ? null : styles.txVolumeMinus]}>
            <Text style={styles.txType}>{isDeposit ? '입금' : '출금'}</Text>
            <View style={styles.txVolumeRight}>
              <Text style={[styles.txAmount, isDeposit ? styles.txAmountPlus : styles.txAmountMinus]}>
                {isDeposit ? '+' : '-'}{formatCurrency(amount)}원
              </Text>
              <Text style={styles.balanceText}>
                잔액 {formatCurrency(item.balance)}원
              </Text>
            </View>
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
      {/* 헤더 */}
      <View style={styles.headCon}>
        <TouchableOpacity 
          style={styles.btnBack}
          onPress={() => navigation.goBack()}
        >
          <Image 
            source={require('../assets/images/ico_back.png')} 
            style={styles.backIcon} 
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headTitle}></Text>
      </View>

      <ScrollView style={styles.scrollView}>

        {/* 제목 */}
        <View style={styles.subTitleBox}>
          <Text style={styles.title}>입출금내역</Text>
        </View>

        {/* 탭 메뉴 */}
        <View style={styles.pl16}>
          <View style={styles.choiceChips}>
            <TouchableOpacity
              style={[styles.choiceChipItem, activeTab === 'all' && styles.choiceChipActive]}
              onPress={() => {
                setActiveTab('all');
                setAllCurrentPage(1);
              }}
            >
              <Text style={[styles.choiceChipText, activeTab === 'all' && styles.choiceChipTextActive]}>
                전체
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceChipItem, activeTab === 'deposit' && styles.choiceChipActive]}
              onPress={() => {
                setActiveTab('deposit');
                setDepositCurrentPage(1);
              }}
            >
              <Text style={[styles.choiceChipText, activeTab === 'deposit' && styles.choiceChipTextActive]}>
                입금
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceChipItem, activeTab === 'withdraw' && styles.choiceChipActive]}
              onPress={() => {
                setActiveTab('withdraw');
                setWithdrawCurrentPage(1);
              }}
            >
              <Text style={[styles.choiceChipText, activeTab === 'withdraw' && styles.choiceChipTextActive]}>
                출금
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 거래내역 리스트 */}
        <View style={styles.mytxList}>
          {currentDeals.length === 0 ? (
            <View style={styles.emptyItem}>
              <Text style={styles.emptyText}>거래내역이 없습니다.</Text>
            </View>
          ) : (
            <>
              {currentDeals.map((item, index) => renderDealItem(item, index))}
              
              {/* 더보기 버튼 */}
              {hasMore && (
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
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headCon: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 48,
    paddingHorizontal: 16,
  },
  btnBack: {
    width: 24,
    height: 24,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headTitle: {
    marginLeft: 12,
    paddingTop: 1,
    fontSize: 15,
    lineHeight: 19.5,
    fontWeight: '600',
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
  subTitleBox: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
  },
  pl16: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  choiceChips: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  choiceChipItem: {
    marginRight: 4,
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 10,
    minHeight: 32,
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
  },
  choiceChipTextActive: {
    color: '#2c3db8',
  },
  mytxList: {
    marginTop: 20,
    marginHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
    marginBottom: 40,
  },
  dealItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  dealInbox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  dateTitleRow: {
    flex: 1,
  },
  dateTitle: {
    flexDirection: 'column',
  },
  dateText: {
    color: '#bfc3c7',
    fontSize: 12,
    lineHeight: 15.6,
    fontWeight: '400',
  },
  typeText: {
    marginTop: 6,
    color: '#393F44',
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '600',
  },
  txVolume: {
    alignItems: 'flex-end',
  },
  txVolumeMinus: {
    // 출금 스타일
  },
  txType: {
    color: '#2c3db8',
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
  },
  txVolumeRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    marginTop: 6,
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '600',
  },
  txAmountPlus: {
    color: '#2c3db8',
  },
  txAmountMinus: {
    color: '#ff5042',
  },
  balanceText: {
    marginTop: 6,
    color: '#393f44',
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
  },
  emptyItem: {
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
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

export default BalanceHistoryScreen;

