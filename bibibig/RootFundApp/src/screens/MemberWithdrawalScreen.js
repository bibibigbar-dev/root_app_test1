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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ApiService from '../services/api';
import { HEADER_HEIGHT } from '../components/Header';

const MemberWithdrawalScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [withdrawData, setWithdrawData] = useState(null);
  const [agreeDelete, setAgreeDelete] = useState(false);

  useEffect(() => {
    loadWithdrawData();
  }, []);

  const loadWithdrawData = async () => {
    try {
      const memberId = user?.session?.member_id || user?.id;
      
      if (!memberId) {
        Alert.alert('오류', '사용자 정보를 확인할 수 없습니다.');
        navigation.goBack();
        return;
      }

      const response = await ApiService.api.get('/app/my/withdraw', {
        params: { member_id: memberId }
      });

      if (response.data && response.data.rtnvalue === '0') {
        // 백엔드 응답 구조: { rtnvalue, member, withdraw, mh_num }
        const withdrawInfo = response.data.withdraw || {};
        const data = {
          ...withdrawInfo,
          member_name: response.data.member?.r_name || response.data.member?.name,
          recordtime: response.data.member?.recordtime,
        };
        setWithdrawData(data);
      } else {
        Alert.alert('오류', '회원탈퇴 정보를 불러오지 못했습니다.');
      }
    } catch (error) {
      console.error('회원탈퇴 정보 조회 실패:', error);
      Alert.alert('오류', '회원탈퇴 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '0';
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return dateString.substring(0, 16);
  };

  const canWithdraw = () => {
    if (!withdrawData) return false;
    
    // 백엔드 조건과 동일하게 체크
    // 하나라도 0보다 크면 탈퇴 불가
    if (withdrawData.cur_invest_cnt > 0) return false;
    if (withdrawData.total_invest_cnt > 0) return false;
    if (withdrawData.cur_loan_cnt > 0) return false;
    if (withdrawData.total_loan_cnt > 0) return false;
    if (withdrawData.balance > 0) return false;
    
    // 모든 조건이 0이면 탈퇴 가능
    return true;
  };

  const handleWithdraw = () => {
    if (!agreeDelete) {
      Alert.alert('회원탈퇴', '회원탈퇴 안내 확인에 동의해주세요.');
      return;
    }

    // 설문조사 화면으로 이동
    navigation.navigate('WithdrawalSurvey', { user });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3db8" />
      </View>
    );
  }

  if (!withdrawData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>회원탈퇴 정보를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back 버튼 헤더 - 고정 */}
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
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* 성공 아이콘 및 메시지 */}
        <View style={styles.successContainer}>
          <View style={styles.successWrapper}>
            <Image 
              source={require('../assets/images/ico_success.png')}
              style={styles.successIco}
              resizeMode="contain"
            />
            <Text style={styles.successMsg}>
              회원탈퇴{'\n'}
              아래 정보를 확인해주세요
            </Text>
          </View>

          {/* 회원 정보 */}
          <View style={styles.dataView}>
            <View style={styles.inCont}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>회원명</Text>
                <Text style={styles.dataValue}>
                  {withdrawData.member_name || '-'}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>가입일자</Text>
                <Text style={styles.dataValue}>{formatDate(withdrawData.recordtime)}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>예치금</Text>
                <Text style={styles.dataValue}>{formatCurrency(withdrawData.balance || 0)} 원</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>투자진행(건)</Text>
                <Text style={styles.dataValue}>{withdrawData.cur_invest_cnt || 0} 건</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>상환진행(건)</Text>
                <Text style={styles.dataValue}>{withdrawData.total_invest_cnt || 0} 건</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>대출심사/상품등록(건)</Text>
                <Text style={styles.dataValue}>{withdrawData.cur_loan_cnt || 0} 건</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>대출상환(건)</Text>
                <Text style={styles.dataValue}>{withdrawData.total_loan_cnt || 0} 건</Text>
              </View>
            </View>
          </View>

          {/* 탈퇴 가능 여부에 따른 안내 */}
          {/* 
            JSP 조건문 변환:
            - withdraw_yn 은 Y/N로, 하위 건건 조건이 하나라도 만족하면 N.
            - canWithdraw()는 아래 5가지가 모두 0 이면 true: cur_invest_cnt, total_invest_cnt, cur_loan_cnt, total_loan_cnt, balance
            - 조건 로직은 동일함
          */}
          {canWithdraw() ? (
            <>
              <View style={styles.redNotif}>
                <Text style={styles.redNotifTit}>회원 탈퇴 진행</Text>
                <Text style={styles.redNotifTxt}>
                  아래 탈퇴정보를 입력한 후 '회원탈퇴'를 클릭하면 탈퇴처리가 진행합니다.{'\n'}
                  탈퇴 이후 이용중인 모든 정보가 삭제되며, 복구가 불가합니다.{'\n'}
                  약관에 의거하여 보존기간내 필요정보는 유지됩니다.
                </Text>
              </View>

              <View style={styles.termsArea}>
                {/* 체크박스 대신 TouchableOpacity와 커스텀 체크 스타일로 대체 */}
                <TouchableOpacity
                  style={styles.termsBox}
                  activeOpacity={0.8}
                  onPress={() => setAgreeDelete(!agreeDelete)}
                >
                  <View style={styles.checkbox}>
                    {agreeDelete && <View style={styles.checkboxChecked} />}
                  </View>
                  <Text style={styles.termsText}>
                    탈퇴로 인해 이용 중인 모든 정보가 삭제됨을{'\n'}확인하였습니다.
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.btnBox}>
                <TouchableOpacity
                  style={[styles.btnStyle, styles.bgBlue]}
                  onPress={handleWithdraw}
                >
                  <Text style={styles.btnText}>탈퇴하기</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.redNotif}>
                <Text style={styles.redNotifTit}>회원 탈퇴 불가</Text>
                <Text style={styles.redNotifTxt}>
                  투자/대출/상환중인 투자/상환중인 대출이 있는 경우 탈퇴가 불가능합니다.{'\n'}
                  예치금이 남아 있는 경우 탈퇴가 불가능합니다.
                </Text>
              </View>

              <View style={styles.btnBox}>
                <TouchableOpacity style={[styles.btnStyle, styles.bdGray]} disabled>
                  <Text style={[styles.btnText, styles.btnTextGray]}>탈퇴하기</Text>
                </TouchableOpacity>
              </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  errorText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#f5f7fa',
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
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    marginRight: 40,
  },
  scrollView: {
    flex: 1,
  },
  successContainer: {
    paddingTop: 0,
  },
  successWrapper: {
    flexDirection: 'column',
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
  },
  inCont: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    paddingBottom: 24,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  dataLabel: {
    flex: 0,
    width: 130,
    paddingVertical: 3,
    color: '#666',
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '400',
  },
  dataValue: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  redNotif: {
    marginTop: 20,
    marginHorizontal: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  redNotifTit: {
    color: '#ff5042',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  redNotifTxt: {
    marginTop: 4,
    color: '#ff5042',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  termsArea: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 55,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: 'rgba(81, 108, 137, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  checkbox: {
    width: 21,
    height: 21,
    borderWidth: 2,
    borderColor: '#e0e1e2',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 13,
    height: 13,
    backgroundColor: '#2c3db8',
    borderRadius: 2,
  },
  termsText: {
    flex: 1,
    marginTop: 1,
    fontSize: 15,
    lineHeight: 19.5,
    fontWeight: '600',
  },
  btnBox: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  btnStyle: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  bgBlue: {
    borderColor: '#2c3db8',
    backgroundColor: '#2c3db8',
  },
  bdGray: {
    borderColor: '#e0e1e2',
    backgroundColor: '#fff',
  },
  btnText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#fff',
  },
  btnTextGray: {
    color: '#a3a7ab',
  },
});

export default MemberWithdrawalScreen;

