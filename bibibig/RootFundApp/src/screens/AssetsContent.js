import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Clipboard,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import ApiService from '../services/api';
import AppModal from '../components/AppModal';

const AssetsContent = ({ navigation, route, user, member_id }) => {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState('0');
  const [assetData, setAssetData] = useState(null);
  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' or 'withdraw'
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showLimitTooltip, setShowLimitTooltip] = useState(false);
  const [showInvestTooltip, setShowInvestTooltip] = useState(false);
  const [banks, setBanks] = useState([]);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    loadAssetData();
    // 계좌 변경 후 출금 탭으로 전환
    if (route.params?.activeWithdrawTab) {
      setActiveTab('withdraw');
    }
  }, []);

  // route params 처리 (계좌 변경 후 리프레시)
  useEffect(() => {
    if (route.params?.refresh) {
      loadAssetData();
      // 출금 탭으로 전환
      if (route.params?.activeWithdrawTab) {
        setActiveTab('withdraw');
      }
      // params 초기화
      navigation.setParams({ refresh: undefined, scrollToWithdraw: undefined, activeWithdrawTab: undefined });
    }
  }, [route.params?.refresh]);

  // 스크롤 위치 조정 (투자금출금 탭으로)
  useEffect(() => {
    if (route.params?.scrollToWithdraw && !loading) {
      setTimeout(() => {
        // 고정 위치로 스크롤 (출금 섹션 대략적인 위치)
        scrollViewRef.current?.scrollTo({ y: 500, animated: true });
      }, 500);
    }
  }, [route.params?.scrollToWithdraw, loading]);

  const loadAssetData = async () => {
    setLoading(true);
    try {
      const memberId = member_id || user?.session?.member_id || user?.member_id || user?.id;

      if (!memberId) {
        console.warn('⚠️ member_id가 없습니다. 로그인이 필요합니다.');
        setBalance(user?.session?.balance || '0');
        setLoading(false);
        return;
      }

      // 자산 정보 조회 API 호출
      const response = await ApiService.api.get('/app/my/home', {
        params: { member_id: memberId },
      });

      // 투자자 여부 확인 (useBalancePage)
      if (response.data && response.data.useBalancePage === false) {
        // 투자자가 아니면 인증 페이지로 리다이렉트
        setLoading(false);
        navigation.replace('MyCert', {
          member_id: memberId,
        });
        return;
      }

      if (response.data) {
        setAssetData(response.data);
        // balance 값 우선순위: refund_bal > balance > session.balance
        const balanceValue =
          response.data.refund_bal ||
          response.data.balance ||
          user?.session?.balance ||
          '0';
        setBalance(balanceValue);
      } else {
        setBalance(user?.session?.balance || '0');
      }

      // 은행 목록 조회 (실패해도 계속 진행)
      try {
        const banksResponse = await ApiService.api.get('/member/get/banks');
        if (banksResponse.data) {
          setBanks(banksResponse.data);
        }
      } catch (bankError) {
        // 은행 목록이 없어도 앱은 계속 작동 (조용히 무시)
      }
    } catch (error) {
      // 에러 상세 로깅
      console.error('❌ 자산 정보 조회 실패:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        params: error.config?.params,
        message: error.message,
      });

      // 404는 API 엔드포인트가 없거나 데이터가 없는 경우
      if (error.response?.status === 404) {
        console.warn(
          '⚠️ 자산 정보를 찾을 수 없습니다. (404) - 백엔드 API 확인 필요',
        );
      }
      setBalance(user?.session?.balance || '0');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = value => {
    if (!value) return '0';
    const stringValue = typeof value === 'string' ? value : String(value);
    const numericValue = stringValue.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleRefreshBalance = async () => {
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;

      if (!memberId) {
        Alert.alert('오류', '회원 정보를 찾을 수 없습니다.');
        return;
      }

      const response = await ApiService.api.post(
        '/app/product/balance/refresh',
        { member_id: memberId },
      );

      if (response.data) {
        // balance 값을 직접 받는 경우
        if (
          typeof response.data === 'string' ||
          typeof response.data === 'number'
        ) {
          setBalance(String(response.data));
        }
        // rtnvalue가 0이면 성공
        else if (
          response.data.rtnvalue === '0' ||
          response.data.rtnvalue === 0
        ) {
          const newBalance =
            response.data.balance || response.data.data?.balance || '0';
          setBalance(newBalance);
        } else {
          // 실패 시 메시지 표시
          const errorMessage =
            response.data.msg ||
            response.data.message ||
            '예치금 잔액 확인 처리도중 오류가 발생하였습니다.';
          Alert.alert('알림', errorMessage);
        }
      }
    } catch (error) {
      console.error('잔액 갱신 실패:', error);
      Alert.alert('예치금 잔액 확인 처리도중 오류가 발생하였습니다.', '');
    }
  };

  const handleCopyAccount = async account => {
    try {
      await Clipboard.setString(account);
      Alert.alert('알림', '계좌를 복사했습니다.');
    } catch (error) {
      console.error('복사 실패:', error);
      Alert.alert('오류', '계좌 복사에 실패했습니다.');
    }
  };

  const handleAddAmount = amount => {
    const currentAmount = withdrawAmount.replace(/[^0-9]/g, '') || '0';
    const currentNumeric = parseInt(currentAmount, 10);
    const addAmount =
      amount === 'all'
        ? assetData?.refund_bal || parseInt(balance.replace(/[^0-9]/g, ''), 10)
        : amount;
    const newAmount = currentNumeric + addAmount;
    const refundBal =
      assetData?.refund_bal || parseInt(balance.replace(/[^0-9]/g, ''), 10);
    const finalAmount = Math.min(newAmount, refundBal); // 출금 가능 금액을 초과하지 않도록
    setWithdrawAmount(formatCurrency(finalAmount));
  };

  const handleWithdraw = async () => {
    const amount = withdrawAmount.replace(/[^0-9]/g, '');
    if (!amount || amount === '0') {
      Alert.alert('예치금 출금', '출금금액을 확인하여 주세요.');
      return;
    }

    Alert.alert(
      '출금신청',
      `(${formatCurrency(amount)}원)을 출금 신청하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '실행',
          onPress: () => proceedWithdraw(amount),
        },
      ],
    );
  };

  const proceedWithdraw = async (amount) => {
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      if (!memberId) {
        Alert.alert('오류', '사용자 ID를 확인할 수 없습니다.');
        return;
      }

      // Alert 확인 후 setReqModes 호출 (토큰 만료 방지)
      const reqModes = await ApiService.setReqModes({ reqdata: amount });

      const refundRequestData = {
        member_id: String(memberId),
        refund_price: String(amount),
        _bcsrmd1: reqModes.data1,
        _bcsrmd2: reqModes.data2,
      };

      console.log('💰 출금 신청 요청:', {
        member_id: String(memberId),
        refund_price: String(amount),
        _bcsrmd1: reqModes.data1,
        _bcsrmd2_length: reqModes.data2?.length,
      });

      const formData = ApiService.convertToFormData(refundRequestData);

      const response = await ApiService.api.post(
        '/app/member/process/refund',
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      console.log('✅ 출금 신청 응답:', response.data);
      const responseData = String(response.data);

      if (responseData === '0') {
        Alert.alert('출금신청하기', '출금신청이 완료되었습니다.', [
          { text: '확인', onPress: () => loadAssetData() },
        ]);
      } else if (responseData === '1') {
        navigation.navigate('Login');
      } else if (responseData === '2' || responseData === '3') {
        Alert.alert('예치금 출금', '출금금액을 확인하여 주세요.');
      } else if (responseData === '4' || responseData === '5') {
        Alert.alert('예치금 출금', '출금금액이 예치금보다 많습니다.');
      } else if (responseData === '10') {
        Alert.alert(
          '예치금 출금',
          '직전 출금신청에 대한 내용을 처리중입니다. 잠시후에 다시 요청하세요.',
        );
      } else if (responseData === '99') {
        Alert.alert(
          '예치금 출금',
          '은행사와 통신이 원활하지 않습니다.\n잠시 후 다시 요청하세요.',
        );
      } else if (responseData === '10001') {
        Alert.alert(
          '예치금 출금',
          '보안 검증에 실패했습니다. 다시 시도해주세요.',
        );
      } else if (responseData === '10002') {
        Alert.alert(
          '예치금 출금',
          '금액 검증에 실패했습니다. 다시 시도해주세요.',
        );
      } else {
        Alert.alert(
          '예치금 출금',
          `[${responseData}] 처리도중 오류가 발생하였습니다.`,
        );
      }
    } catch (error) {
      console.error('❌ 출금 신청 오류:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      let errorMessage = '처리도중 오류가 발생하였습니다.';
      if (error.response?.data) {
        errorMessage += `\n(오류코드: ${error.response.data})`;
      }

      Alert.alert('예치금 출금', errorMessage);
    }
  };

  const getLimitPrice = () => {
    const memberClass = user?.session?.member_class || '0';
    const ocli = assetData?.ocli || {};

    let limitPrice = 0;
    if (memberClass === '10') limitPrice = ocli.class_10 || 0;
    else if (memberClass === '20') limitPrice = ocli.class_20 || 0;
    else if (memberClass === '30' || memberClass === '40')
      limitPrice = ocli.class_30 || 0;
    else limitPrice = ocli.class_0 || 0;

    return limitPrice;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3db8" />
      </View>
    );
  }

  const limitPrice = getLimitPrice();
  const refundBal = assetData?.refund_bal || balance;
  const vAccount =
    user?.session?.v_account || assetData?.member?.v_account || '';

  // 은행명 가져오기: 우선 bank_nm 직접 사용, 없으면 BANK_CD로 banks 목록에서 찾기
  let bankNm = assetData?.member?.bank_nm || user?.session?.bank_nm || '';
  
  // bank_nm이 없으면 bank_cd로 찾기
  if (!bankNm) {
    const bankCd = assetData?.member?.bank_cd || user?.session?.bank_cd || '';
    if (bankCd && banks.length > 0) {
      const foundBank = banks.find(b => b.bank_cd === bankCd);
      bankNm = foundBank?.bank_nm || '';
    }
  }

  const accountDec = assetData?.member?.account_dec || '';
  const seyfertNm =
    assetData?.member?.seyfert_nm || user?.session?.r_name || '';
  const totalInvestPrice = assetData?.rpa?.total_invest_price || 0;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView ref={scrollViewRef} style={styles.scrollView}>
        {/* 나의자산 */}
        <View style={styles.subWhitebox}>
          <View style={styles.subTitleBox}>
            <Text style={styles.title}>나의자산</Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                navigation.navigate('RepaymentHistory', { user, member_id })
              }
            >
              <Text style={styles.linkButtonText}>연도별 지급액 확인</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.blBox}>
            <View style={styles.blBoxLeftBorder} />
            <View style={styles.assetsList}>
              {/* 예치금 */}
              <View style={[styles.assetItem, styles.assetItemFirst]}>
                <View style={styles.assetInbox}>
                  <View style={styles.assetImgbox}>
                    <Image
                      source={require('../assets/images/ico_my_assets01.png')}
                      style={styles.assetIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.assetTxtbox}>
                    <View style={styles.assetTitleRow}>
                      <Text style={styles.assetTitle}>예치금</Text>
                      <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={handleRefreshBalance}
                      >
                        <Image
                          source={require('../assets/images/ico_refresh.png')}
                          style={styles.refreshIcon}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.assetValue}>
                      {formatCurrency(balance)}
                      <Text style={styles.assetUnit}>원</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* 총 누적 투자금액 */}
              <View style={styles.assetItem}>
                <View style={styles.assetInbox}>
                  <View style={styles.assetImgbox}>
                    <Image
                      source={require('../assets/images/ico_my_assets02.png')}
                      style={styles.assetIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.assetTxtbox}>
                    <View style={styles.assetTitleRow}>
                      <Text style={styles.assetTitle}>총 누적 투자금액</Text>
                      <View style={styles.tipButtonContainer}>
                        <TouchableOpacity
                          style={styles.tipButton}
                          onPress={() =>
                            setShowInvestTooltip(!showInvestTooltip)
                          }
                        >
                          <Image
                            source={require('../assets/images/ico_tip.png')}
                            style={styles.tipIcon}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                        {showInvestTooltip && (
                          <View style={styles.tooltip}>
                            <Text style={styles.tooltipText} numberOfLines={1}>
                              루트펀드에 투자한 총 투자 원금
                            </Text>
                            <View style={styles.tooltipArrow} />
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.assetValue}>
                      {formatCurrency(totalInvestPrice)}
                      <Text style={styles.assetUnit}>원</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* 이용가능한도 */}
              <View style={styles.assetItem}>
                <View style={styles.assetInbox}>
                  <View style={styles.assetImgbox}>
                    <Image
                      source={require('../assets/images/ico_my_assets03.png')}
                      style={styles.assetIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.assetTxtbox}>
                    <View style={styles.assetTitleRow}>
                      <Text style={styles.assetTitle}>이용가능한도</Text>
                      <View style={styles.tipButtonContainer}>
                        <TouchableOpacity
                          style={styles.tipButton}
                          onPress={() => setShowLimitTooltip(!showLimitTooltip)}
                        >
                          <Image
                            source={require('../assets/images/ico_tip.png')}
                            style={styles.tipIcon}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                        {showLimitTooltip && (
                          <View style={styles.tooltip}>
                            <Text style={styles.tooltipText} numberOfLines={1}>
                              온투업권 전체 한도 중 투자 가능한 잔여 한도
                            </Text>
                            <View style={styles.tooltipArrow} />
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.assetValue}>
                      {limitPrice > 0 ? (
                        <>
                          {formatCurrency(limitPrice)}
                          <Text style={styles.assetUnit}>원</Text>
                          <Text style={styles.assetTotal}> / 20,000,000원</Text>
                        </>
                      ) : (
                        '제한없음'
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 투자방법 */}
        <View style={styles.methodSection}>
          <View style={styles.subSTitleBox}>
            <Text style={styles.sectionTitle}>투자방법</Text>
          </View>
          <View style={styles.methodList}>
            <View style={styles.methodItem}>
              <View style={styles.methodInbox}>
                <View style={styles.methodImgbox}>
                  <Image
                    source={require('../assets/images/img_my_inv_method01.png')}
                    style={styles.methodImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.methodTxtbox}>
                  <Text style={styles.methodTit}>
                    개인전용{'\n'}가상계좌번호 확인
                  </Text>
                  <Text style={styles.methodTxt}>
                    아래 가상계좌번호를{'\n'}확인해주세요
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.methodItem}>
              <View style={styles.methodInbox}>
                <View style={styles.methodImgbox}>
                  <Image
                    source={require('../assets/images/img_my_inv_method02.png')}
                    style={styles.methodImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.methodTxtbox}>
                  <Text style={styles.methodTit}>예치금 입금</Text>
                  <Text style={styles.methodTxt}>
                    *가입 시 등록한{'\n'}출금계좌에서만 입금가능
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.methodItem}>
              <View style={styles.methodInbox}>
                <View style={styles.methodImgbox}>
                  <Image
                    source={require('../assets/images/img_my_inv_method03.png')}
                    style={styles.methodImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.methodTxtbox}>
                  <Text style={styles.methodTit}>투자 준비 완료</Text>
                  <Text style={styles.methodTxt}>이제 마음껏 투자하세요!</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 입출금 관리 */}
        <View style={styles.subTitleBoxStandalone}>
          <Text style={styles.title}>입출금 관리</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() =>
              navigation.navigate('BalanceHistory', { user, member_id })
            }
          >
            <Text style={styles.linkButtonText}>입출금내역</Text>
          </TouchableOpacity>
        </View>

        {/* 탭 메뉴 */}
        <View style={styles.subTab}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'deposit' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('deposit')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'deposit' && styles.tabTextActive,
              ]}
            >
              투자금 입금
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'withdraw' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('withdraw')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'withdraw' && styles.tabTextActive,
              ]}
            >
              투자금 출금
            </Text>
          </TouchableOpacity>
        </View>

        {/* 투자금 입금 탭 */}
        {activeTab === 'deposit' && (
          <View style={styles.tabContent}>
            <View style={styles.myMgmt}>
              <View style={styles.myBank}>
                <View style={styles.bankImgbox}>
                  <Image
                    source={require('../assets/images/img_my_rootenergy.png')}
                    style={styles.bankImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.bankTxtbox}>
                  <View style={[styles.bankRow, styles.bankRowFirst]}>
                    <Text style={styles.bankLabel}>은행명</Text>
                    <View style={styles.bankValueContainer}>
                      <Image
                        source={require('../assets/images/logo_bank_nh.png')}
                        style={styles.bankIcon}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>예금주</Text>
                    <View style={styles.bankValueContainer}>
                      <Text style={styles.bankValue}>{seyfertNm}</Text>
                    </View>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>투자금 입금 계좌</Text>
                    <View style={styles.bankValueContainer}>
                      <View style={styles.accountRow}>
                        <Text style={styles.accountValue}>
                          {vAccount || '-'}
                        </Text>
                        {vAccount && (
                          <TouchableOpacity
                            style={styles.copyButton}
                            onPress={() => handleCopyAccount(vAccount)}
                          >
                            <Image
                              source={require('../assets/images/ico_copy.png')}
                              style={styles.copyIcon}
                              resizeMode="contain"
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.flexText}>
                <Image
                  source={require('../assets/images/bg_method.png')}
                  style={styles.flexTextImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.flexText}>
                <Text style={styles.flexTextNone}>*</Text>
                <Text style={styles.flexTextContent}>
                  <Text style={styles.flexTextStrong}>
                    본인명의 타행계좌 :{' '}
                  </Text>
                  본인명의 타행계좌로는 입금할 수 없습니다.{'\n'}
                  루트펀드에 등록된 출금계좌가 주거래 은행이 아닌 경우
                  출금계좌를 변경하여 이용할 수 있습니다.
                </Text>
              </View>
              <View style={styles.flexText}>
                <Text style={styles.flexTextNone}>*</Text>
                <Text style={styles.flexTextContent}>
                  <Text style={styles.flexTextStrong}>간편송금 : </Text>
                  토스, 카카오페이 등 간편송금을 통한 입금이 불가능 합니다.
                </Text>
              </View>
              <View style={styles.flexText}>
                <Text style={styles.flexTextNone}>*</Text>
                <Text style={styles.flexTextContent}>
                  <Text style={styles.flexTextStrong}>오픈뱅킹 : </Text>
                  타행 은행 인터넷 뱅킹 혹은 모바일 뱅킹에서 오픈뱅킹을 통한
                  입금이 불가능 합니다.
                </Text>
              </View>
              <View style={styles.flexText}>
                <Text style={styles.flexTextNone}>*</Text>
                <Text style={styles.flexTextContent}>
                  <Text style={styles.flexTextStrong}>은행 방문 이용 : </Text>
                  등록된 투자금 출금 계좌가 농협이 아닌 경우 창구, ATM에서
                  입금이 불가능합니다.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 투자금 출금 탭 */}
        {activeTab === 'withdraw' && (
          <View style={styles.tabContent}>
            <View style={styles.myMgmt}>
              <View style={styles.myBank}>
                <View style={styles.bankImgbox}>
                  <Image
                    source={require('../assets/images/img_my_rootenergy.png')}
                    style={styles.bankImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.bankTxtbox}>
                  <View style={[styles.bankRow, styles.bankRowFirst]}>
                    <Text style={styles.bankLabel}>은행명</Text>
                    <View style={styles.bankValueContainer}>
                      <Text style={styles.bankValue}>{bankNm || '-'}</Text>
                    </View>
                    <View style={styles.widFull}>
                      <TouchableOpacity
                        style={styles.changeButton}
                        onPress={() =>
                          navigation.navigate('AccountChangeWithHeader', {
                            banks: banks,
                            user: user,
                            member_id: member_id,
                          })
                        }
                      >
                        <Text style={styles.changeButtonText}>계좌변경</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>예금주</Text>
                    <View style={styles.bankValueContainer}>
                      <Text style={styles.bankValue}>
                        {user?.session?.r_name || '-'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>투자금 출금 계좌</Text>
                    <View style={styles.bankValueContainer}>
                      <Text style={styles.bankValue}>{accountDec || '-'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.myAmount}>
                <Text style={styles.amountLabel}>출금 가능 금액</Text>
                <Text style={styles.amountValue}>
                  {formatCurrency(refundBal)}원
                </Text>
              </View>

              <View style={styles.flexInput}>
                <TextInput
                  style={styles.amountInput}
                  value={withdrawAmount}
                  onChangeText={text => {
                    const numeric = text.replace(/[^0-9]/g, '');
                    setWithdrawAmount(formatCurrency(numeric));
                  }}
                  placeholder="출금금액 입력"
                  keyboardType="numeric"
                  onFocus={() => {
                    setTimeout(() => {
                      // 출금 섹션으로 스크롤 (고정 위치)
                      scrollViewRef.current?.scrollTo({
                        y: 500, // 출금 섹션 대략적인 위치
                        animated: true,
                      });
                    }, 300);
                  }}
                />
                <Text style={styles.unitText}>원</Text>
              </View>

              <View style={styles.amountButtonContainer}>
                <TouchableOpacity
                  style={styles.amountButton}
                  onPress={() => handleAddAmount(10000)}
                >
                  <Text style={styles.amountButtonText}>+1만</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.amountButton}
                  onPress={() => handleAddAmount(50000)}
                >
                  <Text style={styles.amountButtonText}>+5만</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.amountButton}
                  onPress={() => handleAddAmount(100000)}
                >
                  <Text style={styles.amountButtonText}>+10만</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.amountButton}
                  onPress={() => handleAddAmount(1000000)}
                >
                  <Text style={styles.amountButtonText}>+100만</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.amountButton}
                  onPress={() => handleAddAmount('all')}
                >
                  <Text style={styles.amountButtonText}>전액</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.btnBox}>
                <TouchableOpacity
                  style={styles.withdrawButton}
                  onPress={handleWithdraw}
                >
                  <Text style={styles.withdrawButtonText}>출금신청</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.flexText}>
                <Text style={styles.flexTextNone}>*</Text>
                <Text style={styles.flexTextContent}>
                  계좌변경은 본인명의 계좌로만 가능합니다.
                </Text>
              </View>
              <View style={styles.flexText}>
                <Text style={styles.flexTextNone}>*</Text>
                <Text style={styles.flexTextContent}>
                  신한은행, 우리은행, 신협의 경우 (구)계좌는 이용이 불가능하며,
                  신 계좌번호(신한 110, 우리 1002, 신협 13 으로 시작)만 이용
                  가능 합니다.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {(showInvestTooltip || showLimitTooltip) && (
        <TouchableOpacity
          style={styles.tooltipOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowInvestTooltip(false);
            setShowLimitTooltip(false);
          }}
        />
      )}
    </KeyboardAvoidingView>
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
    padding: 40,
  },
  subWhitebox: {
    paddingBottom: 30,
  },
  subTitleBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  subTitleBoxStandalone: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    color: '#222',
  },
  linkButton: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    height: 24,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
  },
  blBox: {
    position: 'relative',
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#516c89',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  blBoxLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#2c3db8',
    zIndex: 1,
  },
  assetsList: {
    paddingRight: 20,
    paddingLeft: 24,
    borderWidth: 1,
    borderColor: '#2c3db8',
    borderRadius: 10,
    overflow: 'hidden',
  },
  assetItem: {
    borderTopWidth: 1,
    borderTopColor: '#f6f6f6',
  },
  assetItemFirst: {
    borderTopWidth: 0,
  },
  assetInbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  assetImgbox: {
    width: 46,
    height: 46,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetIcon: {
    width: 46,
    height: 46,
  },
  assetTxtbox: {
    flex: 1,
  },
  assetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetTitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
    lineHeight: 17,
  },
  refreshButton: {
    width: 20,
    height: 20,
    marginLeft: 4,
    marginTop: -4,
    marginBottom: -2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    width: 14,
    height: 14,
  },
  tipButtonContainer: {
    position: 'relative',
    marginLeft: 4,
  },
  tipButton: {
    width: 16,
    height: 16,
    marginTop: -2,
    marginBottom: -1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipIcon: {
    width: 13,
    height: 13,
  },
  tooltip: {
    position: 'absolute',
    bottom: 22,
    left: -110,
    backgroundColor: '#393f44',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 250,
    maxWidth: 280,
    zIndex: 200,
    elevation: 10,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    left: 110,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#393f44',
  },
  tooltipOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
  },
  assetValue: {
    marginTop: 4,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    color: '#222',
  },
  assetUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
  },
  assetTotal: {
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  methodSection: {
    paddingTop: 36,
    paddingBottom: 40,
    backgroundColor: '#f5f7fa',
  },
  subSTitleBox: {
    paddingHorizontal: 16,
    marginTop: 0,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: '#222',
  },
  methodList: {
    paddingTop: 2,
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  methodItem: {
    marginTop: 10,
  },
  methodInbox: {
    position: 'relative',
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
    minHeight: 175,
  },
  methodImgbox: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  methodImage: {
    width: '100%',
    height: '100%',
  },
  methodTxtbox: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    paddingVertical: 20,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    zIndex: 1,
  },
  methodTit: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: '#222',
  },
  methodTxt: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#222',
  },
  subTab: {
    flexDirection: 'row',
    height: 30,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#393f44',
  },
  tabText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#bfc3c7',
  },
  tabTextActive: {
    color: '#393f44',
  },
  tabContent: {
    // 탭 콘텐츠는 별도 스타일 없음
  },
  myMgmt: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  myBank: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f8faff',
  },
  bankImgbox: {
    flex: 0,
    width: 95,
    marginRight: 30,
    marginTop: 34,
    alignItems: 'center',
  },
  bankImage: {
    width: 95,
    height: undefined,
    aspectRatio: 1,
  },
  bankTxtbox: {
    flex: 1,
  },
  bankRow: {
    marginTop: 10,
  },
  bankRowFirst: {
    marginTop: 0,
  },
  bankLabel: {
    fontSize: 13,
    lineHeight: 17,
    color: '#666',
    fontWeight: '400',
  },
  bankValueContainer: {
    marginTop: 2,
  },
  bankIcon: {
    height: 20,
    width: 85,
  },
  bankValue: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    color: '#222',
  },
  widFull: {
    width: 'auto',
    marginTop: 6,
    marginBottom: 2,
  },
  bankValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountValue: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    color: '#2c3db8',
  },
  copyButton: {
    width: 20,
    height: 20,
    marginLeft: 8,
    marginTop: -5,
    marginBottom: -3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyIcon: {
    width: 13,
    height: 13,
  },
  changeButton: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    height: 24,
    borderWidth: 1,
    borderColor: '#2c3db8',
    borderRadius: 13,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  changeButtonText: {
    fontSize: 13,
    color: '#2c3db8',
    fontWeight: '400',
  },
  myAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
    marginTop: 20,
    marginBottom: 0,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
  },
  amountLabel: {
    fontSize: 14,
    lineHeight: 17,
    color: '#666',
    fontWeight: '400',
  },
  amountValue: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    color: '#222',
  },
  flexInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  amountInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    fontSize: 15,
    lineHeight: 15,
    fontWeight: '600',
    backgroundColor: '#fbfbfb',
  },
  unitText: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '500',
    marginLeft: 4,
  },
  amountButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  amountButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 36,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  amountButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  btnBox: {
    marginTop: 30,
    marginBottom: 20,
  },
  withdrawButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
    borderWidth: 1,
    borderColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  withdrawButtonText: {
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '500',
    color: '#fff',
  },
  flexText: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flexTextImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 3,
  },
  flexTextNone: {
    flex: 0,
    marginRight: 2,
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  flexTextContent: {
    flex: 1,
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  flexTextStrong: {
    color: '#666',
    fontWeight: '400',
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
  modalBody: {
    padding: 20,
  },
  modalScroll: {
    maxHeight: 400,
    padding: 20,
  },
  modalRow: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  modalValue: {
    fontSize: 15,
    color: '#666',
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  selectContainer: {
    maxHeight: 200,
  },
  selectScroll: {
    maxHeight: 200,
  },
  selectOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  selectOptionActive: {
    backgroundColor: '#f5f7fa',
  },
  selectOptionText: {
    fontSize: 15,
    color: '#222',
  },
  selectOptionTextActive: {
    fontWeight: '600',
    color: '#2c3db8',
  },
  selectPlaceholder: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonTextConfirm: {
    color: '#fff',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
});

export default AssetsContent;
