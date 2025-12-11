import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';

const InvestSuccessScreen = ({ navigation, route }) => {
  const { orderNumber, investment, tid } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    prod: {},
    iv: {},
  });
  const [memberId, setMemberId] = useState(null);

  useEffect(() => {
    loadSuccessData();
  }, []);

  const loadSuccessData = async () => {
    try {
      setLoading(true);

      // 현재 로그인한 사용자 정보 가져오기
      const currentUser = await api.getCurrentUser();
      const userId = currentUser?.session?.member_id || currentUser?.member_id;
      setMemberId(userId);

      const formData = api.convertToFormData({
        orderNumber: orderNumber?.toString() || '',
        tid: tid?.toString() || '',
      });

      const response = await api.api.post('/app/product/ivsuccess', formData);

      if (response.data && response.data.status === 'success') {
        setData({
          prod: response.data.prod || {},
          iv: response.data.iv || {},
        });
      }
    } catch (error) {
      console.error('❌ 투자 성공 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const getRepayDate = () => {
    const { sort, repay_date } = data.prod;
    
    if (sort === 'pf') {
      return '매 3개월 말일에 해당하는 일자';
    } else if (repay_date === '99') {
      return '대출실행일 +1개월에 해당하는 일자';
    } else if (repay_date === '0') {
      return '매월 말일에 해당하는 일자';
    } else {
      return `매월 ${repay_date}일`;
    }
  };

  const getPeriodText = () => {
    const { period_text, period } = data.prod;
    return period_text || `${period}개월`;
  };

  const formatInvestDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.substring(0, 16);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3db8" />
        <Text style={styles.loadingText}>투자 정보를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headCon}>
        <TouchableOpacity onPress={() => navigation.navigate('ProductList')}>
          <Image
            source={require('../assets/images/ico_back.png')}
            style={styles.btnBack}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.successContainer}>
          <View style={styles.successWrapper}>
            <Image
              source={require('../assets/images/ico_success.png')}
              style={styles.successIco}
            />
            <Text style={styles.successMsg}>
              투자가 성공적으로{'\n'}
              완료되었습니다!
            </Text>
          </View>

          {/* Data View */}
          <View style={styles.dataView}>
            <View style={styles.inHead}>
              <View style={styles.dlRow}>
                <Text style={styles.dt}>상품명</Text>
                <Text style={styles.dd}>{data.prod.orderName}</Text>
              </View>
            </View>

            <View style={styles.inCont}>
              <View style={styles.dlRow}>
                <Text style={styles.dt}>상환 기간</Text>
                <Text style={styles.dd}>{getPeriodText()}</Text>
              </View>

              <View style={styles.dlRow}>
                <Text style={styles.dt}>상환일</Text>
                <Text style={styles.dd}>{getRepayDate()}</Text>
              </View>

              <View style={styles.dlRow}>
                <Text style={styles.dt}>투자 확정일자</Text>
                <Text style={styles.dd}>{formatInvestDate(data.iv.investdate)}</Text>
              </View>

              <View style={styles.dlRow}>
                <Text style={styles.dt}>연 수익률</Text>
                <Text style={[styles.dd, styles.colorBlue]}>{data.prod.rate}%</Text>
              </View>

              <View style={styles.dlRow}>
                <Text style={styles.dt}>투자금액</Text>
                <Text style={[styles.dd, styles.colorBlue]}>
                  {formatNumber(data.iv.price)}원
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Button */}
      <View style={styles.btnBox}>
        <TouchableOpacity
          style={styles.btnStyleH48}
          onPress={() => navigation.navigate('MyPage', { 
            initialTab: 'invest',
            member_id: memberId 
          })}
        >
          <Text style={styles.btnText}>투자관리</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#666',
  },
  headCon: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
  },
  btnBack: {
    width: 24,
    height: 24,
  },
  scrollView: {
    flex: 1,
  },
  successContainer: {
    flex: 1,
    paddingTop: 35,
  },
  successWrapper: {
    alignItems: 'center',
    textAlign: 'center',
  },
  successIco: {
    width: 40,
    height: 40,
  },
  successMsg: {
    marginTop: 16,
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    textAlign: 'center',
    color: '#222',
  },
  dataView: {
    marginTop: 24,
    marginBottom: 15,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: 'rgba(81, 108, 137, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  inHead: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  inCont: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },
  dlRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  dt: {
    flex: 0,
    width: 130,
    paddingVertical: 3,
    color: '#666',
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '400',
  },
  dd: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: '#222',
  },
  colorBlue: {
    color: '#2c3db8',
  },
  btnBox: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  btnStyleH48: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2c3db8',
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default InvestSuccessScreen;

