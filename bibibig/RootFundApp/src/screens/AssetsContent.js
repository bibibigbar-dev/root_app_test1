import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import ApiService from '../services/api';

const AssetsContent = ({ navigation, route, user, member_id }) => {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState('0');
  const [assetData, setAssetData] = useState(null);
  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' or 'withdraw'
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [banks, setBanks] = useState([]);

  useEffect(() => {
    loadAssetData();
  }, []);

  const loadAssetData = async () => {
    setLoading(true);
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      
      // 자산 정보 조회 API 호출
      const response = await ApiService.api.get('/app/my/home', {
        params: { member_id: memberId }
      });
      
      console.log('자산 정보 응답:', response.data);
      
      if (response.data) {
        setAssetData(response.data);
        setBalance(response.data.balance || user?.session?.balance || '0');
      } else {
        setBalance(user?.session?.balance || '0');
      }
      
      // 은행 목록 조회
      const banksResponse = await ApiService.api.get('/app/banks');
      if (banksResponse.data) {
        setBanks(banksResponse.data);
      }
    } catch (error) {
      console.error('자산 정보 조회 실패:', error);
      setBalance(user?.session?.balance || '0');
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

  const handleRefreshBalance = async () => {
    try {
      const response = await ApiService.api.post('/app/product/balance/refresh');
      if (response.data) {
        const newBalance = typeof response.data === 'string' 
          ? response.data 
          : response.data.balance || response.data;
        setBalance(newBalance);
        Alert.alert('알림', '예치금 잔액이 갱신되었습니다.');
      }
    } catch (error) {
      console.error('잔액 갱신 실패:', error);
      Alert.alert('오류', '예치금 잔액 갱신에 실패했습니다.');
    }
  };

  const handleCopyAccount = async (account) => {
    try {
      await Clipboard.setString(account);
      Alert.alert('알림', '계좌를 복사했습니다.');
    } catch (error) {
      console.error('복사 실패:', error);
      Alert.alert('오류', '계좌 복사에 실패했습니다.');
    }
  };

  const handleSetAllAmount = () => {
    const refundBal = assetData?.refund_bal || balance;
    setWithdrawAmount(formatCurrency(refundBal));
  };

  const handleWithdraw = async () => {
    const amount = withdrawAmount.replace(/[^0-9]/g, '');
    if (!amount || amount === '0') {
      Alert.alert('예치금 출금', '출금금액을 확인하여 주세요.');
      return;
    }

    try {
      const reqModes = await ApiService.setReqModes({ reqdata: amount });
      
      Alert.alert(
        `${formatCurrency(amount)} 출금신청`,
        '출금을 신청하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '실행',
            onPress: async () => {
              try {
                const response = await ApiService.api.post('/app/member/process/refund', {
                  refund_price: amount,
                  _bcsrmd1: reqModes.data1,
                  _bcsrmd2: reqModes.data2,
                });

                if (response.data === '0') {
                  Alert.alert('출금신청하기', '출금신청이 완료되었습니다.', [
                    { text: '확인', onPress: () => loadAssetData() }
                  ]);
                } else if (response.data === '1') {
                  navigation.navigate('Login');
                } else if (response.data === '2' || response.data === '3') {
                  Alert.alert('예치금 출금', '출금금액을 확인하여 주세요.');
                } else if (response.data === '4' || response.data === '5') {
                  Alert.alert('예치금 출금', '출금금액이 예치금보다 많습니다.');
                } else {
                  Alert.alert('예치금 출금', `[${response.data}] 처리도중 오류가 발생하였습니다.`);
                }
              } catch (error) {
                Alert.alert('예치금 출금', '처리도중 오류가 발생하였습니다.');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('오류', '처리도중 오류가 발생하였습니다.');
    }
  };

  const handleChangeAccount = async () => {
    if (!selectedBank) {
      Alert.alert('계좌 변경', '은행을 선택하여 주십시오');
      return;
    }
    if (!accountNumber || isNaN(accountNumber)) {
      Alert.alert('계좌 변경', '계좌번호를 확인하여 주십시오.');
      return;
    }

    try {
      const selectedBankData = banks.find(b => b.bank_cd === selectedBank);
      const response = await ApiService.api.post('/app/member/process/changeAccount', {
        bank_cd: selectedBank,
        bank_nm: selectedBankData?.bank_nm || '',
        account: accountNumber,
        bbachk: 'Y',
      });

      if (response.data === '0') {
        Alert.alert('알림', '계좌가 변경되었습니다.', [
          { text: '확인', onPress: () => {
            setShowAccountModal(false);
            loadAssetData();
          }}
        ]);
      } else if (response.data === '1' || response.data === '2' || response.data === '3') {
        Alert.alert('계좌 등록', '잘못된 데이터 입니다.');
      } else if (response.data === '5') {
        Alert.alert('계좌인증', '확인할 수 없는 계좌입니다.\n계좌를 확인하여 주십시오.');
      } else if (response.data === '6') {
        Alert.alert('계좌인증', '인증받은 정보와 계좌주가 일치하지 않습니다.');
      } else {
        Alert.alert('계좌인증', '처리도중 오류가 발생하였습니다.');
      }
    } catch (error) {
      Alert.alert('계좌 등록', '처리도중 오류가 발생하였습니다.');
    }
  };

  const getLimitPrice = () => {
    const memberClass = user?.session?.member_class || '0';
    const ocli = assetData?.ocli || {};
    
    let limitPrice = 0;
    if (memberClass === '10') limitPrice = ocli.class_10 || 0;
    else if (memberClass === '20') limitPrice = ocli.class_20 || 0;
    else if (memberClass === '30' || memberClass === '40') limitPrice = ocli.class_30 || 0;
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
  const vAccount = user?.session?.v_account || assetData?.member?.v_account || '';
  const bankNm = user?.session?.bank_nm || assetData?.member?.bank_nm || '';
  const accountDec = assetData?.member?.account_dec || '';
  const seyfertNm = assetData?.member?.seyfert_nm || user?.session?.r_name || '';
  const totalInvestPrice = assetData?.rpa?.total_invest_price || 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 나의자산 */}
        <View style={styles.subWhitebox}>
          <View style={styles.subTitleBox}>
            <Text style={styles.title}>나의자산</Text>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => navigation.navigate('RepaymentHistory', { user, member_id })}
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
                  <Text style={styles.assetIcon}>💰</Text>
                </View>
                <View style={styles.assetTxtbox}>
                  <View style={styles.assetTitleRow}>
                    <Text style={styles.assetTitle}>예치금</Text>
                    <TouchableOpacity 
                      style={styles.refreshButton}
                      onPress={handleRefreshBalance}
                    >
                      <Text style={styles.refreshIcon}>🔄</Text>
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
                  <Text style={styles.assetIcon}>📊</Text>
                </View>
                <View style={styles.assetTxtbox}>
                  <View style={styles.assetTitleRow}>
                    <Text style={styles.assetTitle}>총 누적 투자금액</Text>
                    <TouchableOpacity 
                      style={styles.tipButton}
                      onPress={() => setShowInvestModal(true)}
                    >
                      <Text style={styles.tipIcon}>ℹ️</Text>
                    </TouchableOpacity>
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
                  <Text style={styles.assetIcon}>💳</Text>
                </View>
                <View style={styles.assetTxtbox}>
                  <View style={styles.assetTitleRow}>
                    <Text style={styles.assetTitle}>이용가능한도</Text>
                    <TouchableOpacity 
                      style={styles.tipButton}
                      onPress={() => setShowLimitModal(true)}
                    >
                      <Text style={styles.tipIcon}>ℹ️</Text>
                    </TouchableOpacity>
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
                  <Text style={styles.methodIcon}>1️⃣</Text>
                </View>
                <View style={styles.methodTxtbox}>
                  <Text style={styles.methodTit}>개인전용{'\n'}가상계좌번호 확인</Text>
                  <Text style={styles.methodTxt}>아래 가상계좌번호를{'\n'}확인해주세요</Text>
                </View>
              </View>
            </View>
            <View style={styles.methodItem}>
              <View style={styles.methodInbox}>
                <View style={styles.methodImgbox}>
                  <Text style={styles.methodIcon}>2️⃣</Text>
                </View>
                <View style={styles.methodTxtbox}>
                  <Text style={styles.methodTit}>예치금 입금</Text>
                  <Text style={styles.methodTxt}>*가입 시 등록한{'\n'}출금계좌에서만 입금가능</Text>
                </View>
              </View>
            </View>
            <View style={styles.methodItem}>
              <View style={styles.methodInbox}>
                <View style={styles.methodImgbox}>
                  <Text style={styles.methodIcon}>3️⃣</Text>
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
            onPress={() => navigation.navigate('BalanceHistory', { user, member_id })}
          >
            <Text style={styles.linkButtonText}>입출금내역</Text>
          </TouchableOpacity>
        </View>

        {/* 탭 메뉴 */}
        <View style={styles.subTab}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'deposit' && styles.tabItemActive]}
            onPress={() => setActiveTab('deposit')}
          >
            <Text style={[styles.tabText, activeTab === 'deposit' && styles.tabTextActive]}>
              투자금 입금
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'withdraw' && styles.tabItemActive]}
            onPress={() => setActiveTab('withdraw')}
          >
            <Text style={[styles.tabText, activeTab === 'withdraw' && styles.tabTextActive]}>
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
                <Text style={styles.bankLogo}>🏦</Text>
              </View>
              <View style={styles.bankTxtbox}>
                  <View style={[styles.bankRow, styles.bankRowFirst]}>
                  <Text style={styles.bankLabel}>은행명</Text>
                    <View style={styles.bankValueContainer}>
                  <Text style={styles.bankValue}>농협은행</Text>
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
                    <Text style={styles.accountValue}>{vAccount || '-'}</Text>
                    {vAccount && (
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => handleCopyAccount(vAccount)}
                      >
                        <Text style={styles.copyIcon}>📋</Text>
                      </TouchableOpacity>
                    )}
                      </View>
                  </View>
                </View>
              </View>
            </View>

              <View style={styles.flexText}>
                <Text style={styles.flexTextNone}>*</Text>
                <Text style={styles.flexTextContent}>
                  <Text style={styles.flexTextStrong}>본인명의 타행계좌 : </Text>
                본인명의 타행계좌로는 입금할 수 없습니다.{'\n'}
                루트펀드에 등록된 출금계좌가 주거래 은행이 아닌 경우 출금계좌를 변경하여 이용할 수 있습니다.
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
                타행 은행 인터넷 뱅킹 혹은 모바일 뱅킹에서 오픈뱅킹을 통한 입금이 불가능 합니다.
              </Text>
            </View>
              <View style={styles.flexText}>
                <Text style={styles.flexTextNone}>*</Text>
                <Text style={styles.flexTextContent}>
                  <Text style={styles.flexTextStrong}>은행 방문 이용 : </Text>
                등록된 투자금 출금 계좌가 농협이 아닌 경우 창구, ATM에서 입금이 불가능합니다.
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
                <Text style={styles.bankLogo}>🏦</Text>
              </View>
              <View style={styles.bankTxtbox}>
                  <View style={[styles.bankRow, styles.bankRowFirst]}>
                  <Text style={styles.bankLabel}>은행명</Text>
                    <View style={styles.bankValueContainer}>
                  <View style={styles.bankValueRow}>
                    <Text style={styles.bankValue}>{bankNm || '-'}</Text>
                    <TouchableOpacity
                      style={styles.changeButton}
                      onPress={() => setShowAccountModal(true)}
                    >
                      <Text style={styles.changeButtonText}>계좌변경</Text>
                    </TouchableOpacity>
                      </View>
                  </View>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>예금주</Text>
                    <View style={styles.bankValueContainer}>
                  <Text style={styles.bankValue}>{user?.session?.r_name || '-'}</Text>
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
                onChangeText={(text) => {
                  const numeric = text.replace(/[^0-9]/g, '');
                  setWithdrawAmount(formatCurrency(numeric));
                }}
                placeholder="출금금액 입력"
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>원</Text>
              <TouchableOpacity
                style={styles.allButton}
                onPress={handleSetAllAmount}
              >
                <Text style={styles.allButtonText}>전액입력</Text>
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
                  신한은행, 우리은행, 신협의 경우 (구)계좌는 이용이 불가능하며, 신 계좌번호(신한 110, 우리 1002, 신협 13 으로 시작)만 이용 가능 합니다.
              </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 출금계좌 변경 모달 */}
      <Modal
        visible={showAccountModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>출금계좌 변경</Text>
            
            <View style={styles.modalBody}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>예금주</Text>
                <Text style={styles.modalValue}>{user?.session?.r_name || '-'}</Text>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>은행선택</Text>
                <View style={styles.selectContainer}>
                  {banks.length > 0 ? (
                    <ScrollView style={styles.selectScroll}>
                      {banks.map((bank) => (
                        <TouchableOpacity
                          key={bank.bank_cd}
                          style={[
                            styles.selectOption,
                            selectedBank === bank.bank_cd && styles.selectOptionActive
                          ]}
                          onPress={() => setSelectedBank(bank.bank_cd)}
                        >
                          <Text style={[
                            styles.selectOptionText,
                            selectedBank === bank.bank_cd && styles.selectOptionTextActive
                          ]}>
                            {bank.bank_nm}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.selectPlaceholder}>은행 목록을 불러오는 중...</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>계좌번호</Text>
                <TextInput
                  style={styles.modalInput}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="기호('-')없이 숫자만 입력"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAccountModal(false)}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleChangeAccount}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>변경</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 이용가능한도 안내 모달 */}
      <Modal
        visible={showLimitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLimitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>잔여 투자 한도 안내</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalText}>
                혁신상품 출시에 따라 추가된 투자한도에 대한 안내입니다.{'\n'}
                일반개인투자자와 소득적격개인투자자에게 적용됩니다.{'\n\n'}
                혁신상품[미인증]{'\n\n'}
                1. 혁신상품에 투자할 때만 적용되는 투자한도입니다.{'\n'}
                2. 혁신상품의 사업지역 1km이내 시·군·구 거주 주민으로 인증받지 못한 경우 적용됩니다.{'\n'}
                3. 투자한도가 5천만원이지만 일반상품에는 1천만원까지만 투자가 가능합니다.(동일차입자 한도 5백만원){'\n'}
                4. 혁신상품[미인증]만으로 5천만원까지 투자가 가능합니다.(동일차입자 한도 2천만원){'\n'}
                5. 일반상품과 혁신상품[미인증]의 투자금액 합계가 5천만원을 초과할 수 없습니다.{'\n'}
                6. 일반상품에 투자한 금액만큼 혁신상품[미인증]의 잔여한도도 감소합니다.{'\n'}
                7. 혁신상품[미인증]에 투자한 금액이 4천만원을 초과할 경우 일반상품의 잔여한도도 감소합니다.{'\n\n'}
                혁신상품[인증]{'\n\n'}
                1. 혁신상품에 투자할 때만 적용되는 투자한도입니다.{'\n'}
                2. 혁신상품의 사업지역 1km이내 시·군·구 거주 주민으로 1회 이상 인증을 받은 경우에 적용됩니다.{'\n'}
                3. 투자한도가 1억원이지만 일반상품에는 1천만원까지만 투자가 가능합니다.(동일차입자 한도 5백만원){'\n'}
                4. 혁신상품[인증]만으로 1억원까지 투자가 가능합니다.(동일차입자 한도 4천만원){'\n'}
                5. 일반상품과 혁신상품[미인증]의 투자금액 합계가 5천만원을 초과할 수 없습니다.{'\n'}
                6. 모든 상품의 투자금액 합계는 1억원을 초과할 수 없습니다.{'\n'}
                7. 동일차입자 한도인 4천만원까지 투자를 하기 위해서는 상품마다 사업지역 1km 이내 시·군·구 거주 주민 여부를 인증받아야 합니다.{'\n'}
                8. 인증을 받지 않고 혁신상품에 투자한 경우 혁신상품[미인증]의 한도를 적용합니다.{'\n'}
                9. 일반상품에 투자한 금액만큼 혁신상품[인증]의 잔여한도도 감소합니다.{'\n'}
                10. 혁신상품[미인증]에 투자한 금액만큼 혁신상품[인증]의 잔여한도도 감소합니다.{'\n'}
                11. 혁신상품[인증]에 투자한 금액이 5천만원을 초과할 경우 혁신상품[미인증]의 잔여한도도 감소합니다.{'\n'}
                12. 혁신상품[인증]에 투자한 금액이 9천만원을 초과할 경우 일반상품의 잔여한도도 감소합니다.{'\n\n'}
                - 상기 내용은 법인과 개인전문투자자는 해당 사항이 없고 상품 모집금액의 40%의 투자한도만 적용
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButtonConfirm}
              onPress={() => setShowLimitModal(false)}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 총 누적 투자금액 안내 모달 */}
      <Modal
        visible={showInvestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInvestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>총 누적 투자금액 안내</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalText}>
                총 누적 투자금액에 대한 설명!?
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButtonConfirm}
              onPress={() => setShowInvestModal(false)}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>확인</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 24,
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
    fontSize: 32,
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
    lineHeight: 13,
  },
  refreshButton: {
    width: 20,
    height: 20,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 16,
  },
  tipButton: {
    width: 16,
    height: 16,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipIcon: {
    fontSize: 14,
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
    paddingHorizontal: 16,
  },
  methodItem: {
    marginTop: 8,
  },
  methodInbox: {
    position: 'relative',
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#68738f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  methodImgbox: {
    padding: 24,
    alignItems: 'center',
  },
  methodIcon: {
    fontSize: 48,
  },
  methodTxtbox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    justifyContent: 'center',
  },
  methodTit: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  methodTxt: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    color: '#666',
  },
  subTab: {
    flexDirection: 'row',
    height: 30,
    marginTop: 10,
    marginHorizontal: 16,
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
    paddingVertical: 20,
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
    width: 95,
    marginRight: 30,
    marginTop: 34,
    alignItems: 'center',
  },
  bankLogo: {
    fontSize: 48,
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
    lineHeight: 13,
    color: '#666',
    fontWeight: '400',
    marginBottom: 2,
  },
  bankValueContainer: {
    marginTop: 2,
  },
  bankValue: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    color: '#222',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyIcon: {
    fontSize: 16,
  },
  changeButton: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    height: 24,
    borderWidth: 1,
    borderColor: '#2c3db8',
    borderRadius: 13,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
  },
  amountLabel: {
    fontSize: 13,
    lineHeight: 13,
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
    lineHeight: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  allButton: {
    marginLeft: 20,
    paddingHorizontal: 7,
    paddingVertical: 10,
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  allButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
  },
  btnBox: {
    marginTop: 30,
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
    marginTop: 16,
    alignItems: 'flex-start',
  },
  flexTextNone: {
    flex: 0,
    marginRight: 2,
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '400',
  },
  flexTextContent: {
    flex: 1,
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 13,
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

