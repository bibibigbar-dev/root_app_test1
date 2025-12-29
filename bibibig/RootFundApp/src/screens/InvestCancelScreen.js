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

const InvestCancelScreen = ({ navigation, route }) => {
  const { orderNumber, member_id } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [cancelData, setCancelData] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadCancelData();
  }, []);

  const loadCancelData = async () => {
    try {
      setLoading(true);
      
      const response = await ApiService.api.get('/app/product/invest/cancel', {
        params: {
          orderNumber: orderNumber,
          member_id: member_id,
        }
      });

      if (response.data && response.data.status === 'success') {
        setCancelData(response.data);
      } else {
        Alert.alert('오류', '투자 정보를 불러올 수 없습니다.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('투자 취소 정보 로드 오류:', error);
      Alert.alert('오류', '투자 정보를 불러오는 중 오류가 발생했습니다.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvest = async () => {
    if (!agreed) {
      Alert.alert('알림', '투자취소 내용을 확인하여 주십시오.');
      return;
    }

    if (!cancelData || !cancelData.ivinfo) {
      Alert.alert('오류', '투자 정보가 없습니다.');
      return;
    }

    try {
      setProcessing(true);

      const response = await ApiService.api.post('/app/product/invest/cancel/process', {
        member_id: member_id,
        orderNumber: orderNumber,
        tid: cancelData.ivinfo.tid,
        idx: cancelData.ivinfo.idx,
      });

      const result = String(response.data);

      if (result === '0') {
        // 취소 성공 - InvestCancelDone 화면으로 이동 (member_id 전달)
        navigation.replace('InvestCancelDone', { member_id });
      } else if (result === '2' || result === '3') {
        Alert.alert('투자취소', '잘못된 취소 요청입니다.');
      } else if (result === '4') {
        Alert.alert('투자취소', '취소 가능한 투자 내역이 아닙니다.');
      } else if (result === '10000') {
        Alert.alert('투자취소', '현재 금결원 전산망 및 은행점검 중입니다.');
      } else {
        Alert.alert('오류', '처리도중 오류가 발생하였습니다.');
      }
    } catch (error) {
      console.error('투자 취소 처리 오류:', error);
      Alert.alert('오류', '투자 취소 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.substring(0, 10);
  };

  const formatNumber = (num) => {
    return parseInt(num || 0).toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3db8" />
      </View>
    );
  }

  const { prod, option, member, ivinfo } = cancelData || {};

  return (
    <View style={styles.container}>
      {/* Back 버튼 */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require('../assets/images/ico_back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}></Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.successContainer}>
          <View style={styles.successWrapper}>
            <View style={styles.successIco}>
              <Text style={styles.successIcoText}>!</
              Text>
            </View>
            <Text style={styles.successMsg}>
              투자취소{'\n'}
              아래 정보를 확인해주세요
            </Text>
          </View>

          <View style={styles.dataView}>
            <View style={styles.inHead}>
              <View style={styles.dl}>
                <Text style={styles.dt}>상품명</Text>
                <Text style={styles.dd}>{prod?.orderName}</Text>
              </View>
            </View>
            <View style={styles.inCont}>
              <View style={styles.dl}>
                <Text style={styles.dt}>상환 기간</Text>
                <Text style={styles.dd}>
                  {formatDate(option?.n_start_date)} ~ {formatDate(option?.n_end_date)}
                </Text>
              </View>
              <View style={styles.dl}>
                <Text style={styles.dt}>상환일</Text>
                <Text style={styles.dd}>{formatDate(option?.n_end_date)}</Text>
              </View>
              <View style={styles.dl}>
                <Text style={styles.dt}>투자 확정일자</Text>
                <Text style={styles.dd}>{formatDate(ivinfo?.investdate)}</Text>
              </View>
              <View style={styles.dl}>
                <Text style={styles.dt}>연 수익률</Text>
                <Text style={[styles.dd, styles.colorBlue]}>{prod?.rate}%</Text>
              </View>
              <View style={styles.dl}>
                <Text style={styles.dt}>투자금액</Text>
                <Text style={[styles.dd, styles.colorBlue]}>{formatNumber(ivinfo?.price)}원</Text>
              </View>
            </View>
          </View>

          <View style={styles.termsArea}>
            <Text style={styles.termsTxt}>모집이 완료된 상품에 대해서는 취소할 수 없습니다.</Text>
            <TouchableOpacity
              style={styles.termsBox}
              onPress={() => setAgreed(!agreed)}
            >
              <Image
                source={
                  agreed
                    ? require('../assets/images/checkbox_on.png')
                    : require('../assets/images/checkbox_off.png')
                }
                style={styles.checkbox}
                resizeMode="contain"
              />
              <Text style={styles.termsTxtLabel}>본인은 투자취소 내용을 확인하였습니다.</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.btnBox}>
        <TouchableOpacity
          style={[styles.btnStyle, processing && styles.btnDisabled]}
          onPress={handleCancelInvest}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.btnText}>투자취소</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#f6f6f6',
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
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  content: {
    flex: 1,
  },
  successContainer: {
    paddingTop: 40,
    paddingBottom: 40,
  },
  successWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successIco: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  successMsg: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
  },
  dataView: {
    marginTop: 24,
    marginHorizontal: 16,
    borderWidth: 0.5,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: 'rgba(81, 108, 137, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  inHead: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  inCont: {
    paddingTop: 4,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  dl: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  dt: {
    flex: 0,
    width: 100,
    paddingVertical: 3,
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '400',
    color: '#666',
  },
  dd: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#222',
  },
  colorBlue: {
    color: '#2c3db8',
  },
  termsArea: {
    paddingHorizontal: 16,
  },
  termsTxt: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: '#666',
    marginBottom: 16,
  },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  termsTxtLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: '#222',
  },
  btnBox: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: 'transparent',
  },
  btnStyle: {
    height: 48,
    backgroundColor: '#2c3db8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

export default InvestCancelScreen;
