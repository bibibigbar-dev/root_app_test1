import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Linking,
  Clipboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const InvestRequestScreen = ({ navigation, route }) => {
  const { orderNumber, orderKey } = route.params || {};
  // orderKey와 orderNumber 둘 다 지원 (호환성)
  const productOrderNumber = orderNumber || orderKey;

  // State
  const [prod, setProd] = useState({});
  const [member, setMember] = useState({});
  const [expertopinion, setExpertopinion] = useState({});
  const [circle_thumbnail, setCircleThumbnail] = useState([]);
  const [file_thumbnail, setFileThumbnail] = useState([]);
  const [file_attachment, setFileAttachment] = useState([]);
  const [term, setTerm] = useState({});
  const [banner, setBanner] = useState({});
  const [ocli, setOcli] = useState({});
  const [gbl_all, setGblAll] = useState(0);
  const [bpb, setBpb] = useState(0);

  const [investAmount, setInvestAmount] = useState('');
  const [agreeText, setAgreeText] = useState('');
  const [refereeCode, setRefereeCode] = useState('');
  const [refereeCheckYn, setRefereeCheckYn] = useState('N');
  const [isAgreed, setIsAgreed] = useState(false);
  const [balance, setBalance] = useState(0);

  const [expandedToggle, setExpandedToggle] = useState({
    charge: false,
  });

  useEffect(() => {
    loadInvestData();
  }, [productOrderNumber]);

  const loadInvestData = async () => {
    try {
      console.log('📱 투자하기 화면 데이터 로드 시작:', productOrderNumber);
      
      // orderNumber 체크
      if (!productOrderNumber) {
        console.error('❌ orderNumber가 없습니다');
        Alert.alert('오류', '상품 정보가 없습니다.');
        navigation.goBack();
        return;
      }
      
      // 현재 로그인한 사용자 정보 가져오기
      const currentUser = await api.getCurrentUser();
      const memberId = currentUser?.session?.member_id || currentUser?.member_id;
      
      if (!memberId) {
        Alert.alert('오류', '로그인이 필요합니다.');
        navigation.navigate('Login');
        return;
      }
      
      console.log('📤 투자하기 요청 데이터:', { orderNumber: productOrderNumber, member_id: memberId });
      
      const formData = api.convertToFormData({ 
        orderNumber: productOrderNumber.toString(),
        member_id: memberId.toString()
      });
      const response = await api.api.post('/app/product/invest', formData);
      
      console.log('📥 투자하기 응답:', response.data);
      
      if (response.data) {
        // 에러 체크
        if (response.data.status === 'error') {
          if (response.data.redirect) {
            if (response.data.redirectUrl === '/login') {
              Alert.alert('알림', '로그인이 필요합니다.', [
                { text: '확인', onPress: () => navigation.navigate('Login') }
              ]);
            } else if (response.data.redirectUrl === '/my/nhterms') {
              Alert.alert('알림', 'NH농협 약관 동의가 필요합니다.', [
                { text: '확인', onPress: () => navigation.navigate('NHTerms') }
              ]);
            }
          }
          return;
        }
        
        console.log('✅ 투자하기 데이터 로드 성공');
        setProd(response.data.prod || {});
        setMember(response.data.member || {});
        setExpertopinion(response.data.expertopinion || {});
        setCircleThumbnail(response.data.circle_thumbnail || []);
        setFileThumbnail(response.data.file_thumbnail || []);
        setFileAttachment(response.data.file_attachment || []);
        setTerm(response.data.term || {});
        setBanner(response.data.banner || {});
        setOcli(response.data.ocli || {});
        setGblAll(response.data.gbl_all || 0);
        setBpb(response.data.bpb || 0);
        setBalance(response.data.member?.balance || 0);
      }
    } catch (error) {
      console.error('❌ 투자하기 데이터 로드 실패:', error);
      Alert.alert('오류', '투자하기 정보를 불러오는데 실패했습니다.');
    }
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setInvestAmount(formatNumber(numericValue));
  };

  const handleRefresh = async () => {
    try {
      const response = await api.api.post('/product/balance/refresh', api.convertToFormData({}));
      if (response.data) {
        setBalance(response.data);
        Alert.alert('투자하기', '예치금 잔액이 갱신되었습니다.');
      }
    } catch (error) {
      console.error('❌ 예치금 갱신 실패:', error);
      Alert.alert('투자하기', '예치금 잔액 확인 처리도중 오류가 발생하였습니다.');
    }
  };

  const handleCopyAccount = () => {
    if (member.v_account) {
      Clipboard.setString(member.v_account);
      Alert.alert('투자하기', '계좌를 복사했습니다.');
    }
  };

  const handleRefereeCheck = async () => {
    const trimmedCode = refereeCode.replace(/ /g, '');
    
    try {
      const formData = api.convertToFormData({ referee_code: trimmedCode });
      const response = await api.api.post('/product/referee/check', formData);
      
      if (response.data.rtnvalue === '0') {
        setRefereeCheckYn('Y');
        Alert.alert('투자하기', `입력하신 추천인코드는\n${response.data.member_name}님으로 확인되었습니다.`);
      } else {
        setRefereeCheckYn('N');
        Alert.alert('투자하기', '입력하신 추천인코드는 확인되지 않습니다.');
      }
    } catch (error) {
      console.error('❌ 추천인 확인 실패:', error);
      Alert.alert('투자하기', '추천인코드 확인 도중 오류가 발생하였습니다.');
    }
  };

  const handleInvestSubmit = async () => {
    const investment = investAmount.replace(/,/g, '');
    const trimmedRefereeCode = refereeCode.replace(/ /g, '');

    // Validation
    if (trimmedRefereeCode && refereeCheckYn === 'N') {
      Alert.alert('투자하기', '추천인코드를 다시 확인해 주세요.');
      return;
    }

    if (member.is_minor === 'Y' && member.legal_approval !== 'Y') {
      Alert.alert('투자하기', '법정대리인 동의 후 투자가 가능합니다.\n고객센터로 문의해 주세요.');
      return;
    }

    if (!investment || investment === '0') {
      Alert.alert('투자하기', '투자금액을 입력해 주세요.');
      return;
    }

    if (agreeText !== '동의함') {
      Alert.alert('투자하기', "'동의함'을 입력해 주세요.");
      return;
    }

    if (member.nomin_id === trimmedRefereeCode) {
      Alert.alert('투자하기', '추천인코드 입력란에 본인 추천인코드는 입력 할 수 없어요');
      return;
    }

    if (!isAgreed) {
      Alert.alert('투자하기', '투자자 이용약관에 동의해 주세요.');
      return;
    }

    try {
      const formData = api.convertToFormData({
        orderNumber: productOrderNumber.toString(),
        investment: investment.toString(),
        referee_code: trimmedRefereeCode.toString(),
      });
      const response = await api.api.post('/product/invest/process', formData);

      if (response.data.rtnvalue === '0') {
        // Navigate to success screen
        navigation.navigate('InvestSuccess', {
          orderNumber: productOrderNumber,
          investment,
          tid: response.data.tid,
        });
      } else {
        Alert.alert('투자하기', response.data.exception || '투자 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('❌ 투자 처리 실패:', error);
      Alert.alert('투자하기', '투자 처리 중 오류가 발생했습니다.');
    }
  };

  const renderProductTypeIcon = (orderType) => {
    switch (orderType) {
      case '태양광':
        return require('../assets/images/img_product01_s.png');
      case '풍력':
        return require('../assets/images/img_product02_s.png');
      case 'ESS':
        return require('../assets/images/img_product04_s.png');
      case '전기차충전소':
        return require('../assets/images/img_product03_s.png');
      default:
        return require('../assets/images/img_product01_s.png');
    }
  };

  const getRepayTypeText = (repayType) => {
    switch (repayType) {
      case '1':
        return '원금균등상환';
      case '2':
        return '만기일시상환';
      case '3':
        return '원리금균등상환';
      default:
        return '-';
    }
  };

  const getFundPurposeText = (sort) => {
    if (sort === 'bridge' || sort === 'innovation') {
      return '건설자금';
    }
    return '운영 자금';
  };

  const calculateLimitPrice = () => {
    const memberClass = member.member_class;
    
    if (memberClass === '20' || memberClass === '30' || memberClass === '40') {
      return prod.price * 0.4;
    } else if (memberClass === '10') {
      return ocli.class_10 || 0;
    } else {
      return ocli.class_0 || 0;
    }
  };

  const calculateOlPrice = () => {
    const memberClass = member.member_class;
    
    if (memberClass === '20' || memberClass === '30' || memberClass === '40') {
      return prod.price * 0.4;
    } else if (memberClass === '10') {
      return ocli.class_ol_10 || 0;
    } else {
      return ocli.class_ol_0 || 0;
    }
  };

  const toggleSection = (section) => {
    setExpandedToggle(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderThumbnail = () => {
    if (circle_thumbnail && circle_thumbnail.length > 0) {
      return (
        <Image
          source={{ uri: circle_thumbnail[0].filePath }}
          style={styles.productImg}
        />
      );
    } else if (file_thumbnail && file_thumbnail.length > 0) {
      return (
        <Image
          source={{ uri: file_thumbnail[0].filePath }}
          style={styles.productImg}
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headCon}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}></Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Product Item */}
        <View style={styles.blBox}>
          <View style={styles.productItem}>
            <View style={styles.productImgbox}>
              {renderThumbnail()}
              <Image
                source={renderProductTypeIcon(prod.orderType)}
                style={styles.productSImg}
                resizeMode="contain"
              />
            </View>
            
            <View style={styles.productTxtbox}>
              <Text style={styles.productNum}>
                {expertopinion.note ? expertopinion.note.replace(/\n/g, ' ') : ''}
              </Text>
              <Text style={styles.productName}>{prod.orderName}</Text>
              <Text style={styles.productDate}>
                모집기간 {prod.start_date}({prod.start_week}) ~ {prod.end_date}({prod.end_week})
              </Text>
            </View>
          </View>
        </View>

        {/* Investment Info */}
        <View style={styles.subWhitebox}>
          <View style={styles.dlFlexlist}>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>연 수익률</Text>
              <Text style={styles.dd}>
                <Text style={styles.ddStrong}>{prod.rate}%</Text>
              </Text>
            </View>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>투자기간</Text>
              <Text style={styles.dd}>
                <Text style={styles.ddStrong}>{prod.period_text}개월</Text>
              </Text>
            </View>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>상품번호</Text>
              <Text style={styles.dd}>
                <Text style={styles.ddStrong}>{prod.orderNumber}</Text>
              </Text>
            </View>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>상환방식</Text>
              <Text style={styles.dd}>
                <Text style={styles.ddStrong}>{getRepayTypeText(prod.repay_type)}</Text>
              </Text>
            </View>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>상품종류</Text>
              <Text style={styles.dd}>
                <Text style={styles.ddStrong}>{prod.orderType}</Text>
              </Text>
            </View>
            <View style={styles.dlItem}>
              <Text style={styles.dt}>자금용도</Text>
              <Text style={styles.dd}>
                <Text style={styles.ddStrong}>{getFundPurposeText(prod.sort)}</Text>
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressGroup}>
            <Text style={styles.txtStit}>투자 진행률</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressVal, { width: `${prod.percent || 0}%` }]} />
              <View style={styles.progressTip}>
                <Text style={styles.progressTipText}>
                  모집 잔액 {formatNumber(prod.left_price)}원
                </Text>
              </View>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTotal}>
                <Text style={styles.progressTotalEm}>{formatNumber(prod.investment)}원</Text>
                {' / '}{formatNumber(prod.price)}원
              </Text>
              <Text style={styles.progressPct}>{prod.percent}%</Text>
            </View>
          </View>
        </View>

        {/* Gray Section */}
        <View style={styles.bodyGray}>
          {/* Special Investor Notice */}
          <View style={styles.flexTxtlimit}>
            <View style={styles.icoCoin} />
            <Text style={styles.flexTxtlimitText}>더 높은 투자한도를 원한다면?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Upward')}>
              <Text style={styles.flexTxtlimitLink}>특수투자자 전환하기 {'>'}</Text>
            </TouchableOpacity>
          </View>

          {/* Investor Info */}
          <View style={styles.subWhitebox}>
            <View style={styles.subSTitleBox}>
              <Text style={styles.subSTitle}>투자자 정보</Text>
            </View>
            <View style={styles.dlFlexlist}>
              <View style={styles.dlItem}>
                <Text style={styles.dt}>회원명</Text>
                <Text style={styles.dd}>{member.r_name}</Text>
              </View>
              <View style={styles.dlItem}>
                <View style={styles.dtWithTip}>
                  <Text style={styles.dt}>투자등급</Text>
                  <TouchableOpacity onPress={() => {/* Show tooltip */}}>
                    <Image
                      source={require('../assets/images/ico_tip.png')}
                      style={styles.icoTip}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.dd}>{member.member_class_kr}</Text>
              </View>
            </View>
          </View>

          {/* Investment Method */}
          <View style={styles.subSTitleBox}>
            <Text style={styles.subSTitle}>투자방법</Text>
          </View>
          
          <View style={styles.invMethodSwiper}>
            <View style={styles.invMethodSlide}>
              <View style={styles.invMethodInbox}>
                <View style={styles.invMethodImgbox}>
                  <Image
                    source={require('../assets/images/bg_inv_method01.png')}
                    style={styles.invMethodImg}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.invMethodTxtbox}>
                  <Text style={styles.invMethodTit}>개인전용 가상계좌번호 확인</Text>
                  <Text style={styles.invMethodTxt}>아래 가상계좌번호를 확인해주세요</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bank Card */}
          <View style={styles.bankCard}>
            <TouchableOpacity style={styles.btnRefresh} onPress={handleRefresh}>
              <Text style={styles.btnRefreshText}>새로고침</Text>
            </TouchableOpacity>
            
            <View style={styles.cntbox}>
              <Text style={styles.cntboxTit}>예치금 잔액</Text>
              <View style={styles.cntboxCnt}>
                <Text style={styles.cntboxCntEm}>{formatNumber(balance)}</Text>
                <Text style={styles.cntboxCntText}>원</Text>
              </View>
            </View>

            <View style={styles.bankInfo}>
              <View style={styles.bankInfoAccountnum}>
                <Text style={styles.bankInfoDt}>가상계좌번호</Text>
                <View style={styles.bankInfoDd}>
                  <View style={styles.bankLogo}>
                    <Image
                      source={require('../assets/images/logo_bank_nh.png')}
                      style={styles.bankLogoImg}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.bankNum}>
                    <Text style={styles.bankNumText}>{member.v_account}</Text>
                    <View style={styles.bankNumTip}>
                      <Text style={styles.bankNumTipText}>
                        위 계좌로 <Text style={styles.bankNumTipEm}>예치금을 입금</Text>해주세요!
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.btnCopy} onPress={handleCopyAccount}>
                    <Text style={styles.btnCopyText}>복사</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.bankInfoUsername}>
                <Text style={styles.bankInfoUsernameDt}>예금주</Text>
                <Text style={styles.bankInfoUsernameDd}>{member.r_name}</Text>
              </View>
            </View>
          </View>

          {/* Bank Amount */}
          <View style={styles.bankAmount}>
            <Text style={styles.bankAmountTitle}>투자 금액 (예치금) 입력</Text>
            
            <View style={styles.dlAmount}>
              <View style={styles.dtWithTip}>
                <Text style={styles.dlAmountDt}>투자가능금액</Text>
                <TouchableOpacity onPress={() => {/* Show tooltip */}}>
                  <Image
                    source={require('../assets/images/ico_tip.png')}
                    style={styles.icoTip}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.dlAmountDd}>
                {formatNumber(Math.max(0, calculateLimitPrice() - gbl_all))}원
              </Text>
            </View>

            <View style={styles.dlAmountB}>
              <Text style={styles.dlAmountBDt}>해당 차입자 투자가능금액</Text>
              <Text style={styles.dlAmountBDd}>
                {formatNumber(Math.max(0, calculateOlPrice() - bpb))}원
              </Text>
            </View>

            <View style={styles.wrAmount}>
              <TextInput
                style={styles.inputAmount}
                value={investAmount}
                onChangeText={handleAmountChange}
                placeholder="최소 투자금액 10,000원 부터 입력"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="numeric"
              />
              <Text style={styles.wrAmountTxt}>원</Text>
            </View>
          </View>

          {/* Investment Risk Notice */}
          <View style={styles.subWhitebox}>
            <View style={styles.subSTitleBox}>
              <Text style={styles.subSTitle}>투자위험 고지 안내</Text>
              <Text style={styles.titleP}>
                본 투자상품은 원금이 보장되지 않습니다. {'\n'}
                또한 차입자가 원금의 전부 또는 일부를 상환하지 못할 경우 발생하게되는 투자금 손실 등 투자위험은 투자자가 부담하게 됩니다.
              </Text>
              
              {prod.orderNumber === 'R000533' && (
                <>
                  <Text style={[styles.subSTitle, styles.mt50]}>자동이체서비스 제공</Text>
                  <Text style={styles.titleP}>
                    본 투자상품에 투자 후 원리금은 자동이체서비스를 통해 본인의 가상계좌(루트인프라금융 주식회사 (NH농협)예치은행) 에서 투자금 입출금을 위해 등록한 본인의 은행계좌로 지급됩니다. {'\n'}
                    다만, 관련 법령 해석이나 금융감독 당국의 요청 등으로 서비스가 중단될 수 있습니다.
                  </Text>
                </>
              )}
            </View>

            <View style={styles.invintroBox}>
              <Text style={styles.txtchk}>
                나 {member.r_name}은(는) {'\n'}
                상기 내용을 확인하였으며, 그 내용에
              </Text>
              <View style={styles.flexInput}>
                <TextInput
                  style={styles.textInput}
                  value={agreeText}
                  onChangeText={setAgreeText}
                  placeholder="동의함 (직접입력)"
                  placeholderTextColor="#a3a7ab"
                />
              </View>
              <Text style={styles.starNotif}>*투자 진행을 위해서 '동의함'을 직접 입력해주세요</Text>
            </View>
          </View>

          {/* Referee Registration */}
          <View style={styles.subWhitebox}>
            <View style={styles.subSTitleBox}>
              <Text style={styles.subSTitle}>추천인 등록</Text>
              <Text style={styles.titleP}>
                * 해당 상품을 소개해 준 추천인에 대한 코드를 입력{'\n'}
                * 추천인 코드 위치 : 추천인의 마이페이지 {'>'} 개인정보관리{'\n'}
                * 본인 추천인 코드 입력 불가{'\n'}
                * 추천인 코드 변경시 [추천인 확인] 재진행 필요
              </Text>
            </View>

            <View style={styles.invintroBox}>
              <View style={styles.flexInputRow}>
                <TextInput
                  style={[styles.textInput, styles.flexInputText]}
                  value={refereeCode}
                  onChangeText={(text) => {
                    setRefereeCode(text);
                    setRefereeCheckYn('N');
                  }}
                  placeholder="추천인 코드 입력"
                  placeholderTextColor="#a3a7ab"
                />
                <TouchableOpacity
                  style={styles.btnStyleH44}
                  onPress={handleRefereeCheck}
                >
                  <Text style={styles.btnStyleText}>추천인 확인</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Terms Agreement */}
          <View style={styles.termsArea}>
            <Text style={styles.termsTxt}>
              본인은 투자위험을 인지하였으며, 온투법 제 23조 제 1항에 따라 위 내용의 투자계약서와{' '}
              <Text style={styles.termsLink}>연계투자계약 약관</Text>에 동의합니다.
            </Text>
            <TouchableOpacity
              style={styles.termsBox}
              onPress={() => setIsAgreed(!isAgreed)}
            >
              <View style={[styles.checkbox, isAgreed && styles.checkboxChecked]} />
              <Text style={styles.checkboxTxt}>약관에 동의합니다.</Text>
            </TouchableOpacity>
          </View>

          {/* Fee Notice Toggle */}
          <View style={styles.detailTogglebox}>
            <TouchableOpacity
              style={styles.inTitle}
              onPress={() => toggleSection('charge')}
            >
              <Text style={styles.inTitleText}>수수료 안내</Text>
              <View style={[styles.inTitleArrow, expandedToggle.charge && styles.inTitleArrowRotated]} />
            </TouchableOpacity>
            
            {expandedToggle.charge && (
              <View style={styles.inCont}>
                <View style={styles.chargeBox}>
                  <View style={styles.tableData}>
                    <View style={styles.tableHeader}>
                      <Text style={styles.tableHeaderCell}>구분</Text>
                      <Text style={styles.tableHeaderCell}>소득세율</Text>
                      <Text style={styles.tableHeaderCell}>주민세율</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>일반</Text>
                      <Text style={styles.tableCell}>14%</Text>
                      <Text style={styles.tableCell}>1.4%</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>대부업</Text>
                      <Text style={styles.tableCell}>0%</Text>
                      <Text style={styles.tableCell}>0%</Text>
                    </View>
                  </View>

                  <View style={[styles.tableData, styles.mt24]}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, styles.wFull]}>플랫폼 이용 수수료</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.wFull]}>월 0.1%</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <View style={styles.btnBox}>
            <TouchableOpacity
              style={styles.btnStyleH48}
              onPress={handleInvestSubmit}
            >
              <Text style={styles.btnStyleH48Text}>투자진행</Text>
            </TouchableOpacity>
          </View>

          {/* Event Banner */}
          {banner.banner_text01 && (
            <View style={styles.eventBox}>
              <TouchableOpacity
                style={styles.eventInbox}
                onPress={() => navigation.navigate('Promotion')}
              >
                <View style={styles.eventIco}>
                  <Image
                    source={require('../assets/images/ico_event.png')}
                    style={styles.eventIcoImg}
                  />
                </View>
                <Text style={styles.eventTit}>이벤트</Text>
                <Text style={styles.eventTxt}>{banner.banner_text01}</Text>
              </TouchableOpacity>
            </View>
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
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
    fontWeight: '300',
  },
  title: {
    marginLeft: 12,
    fontSize: 15,
    lineHeight: 19.5,
    fontWeight: '600',
    color: '#222',
  },
  scrollView: {
    flex: 1,
  },
  blBox: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: 'rgba(81, 108, 137, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  productImgbox: {
    position: 'relative',
    marginRight: 16,
  },
  productImg: {
    width: 47,
    height: 47,
    borderRadius: 23.5,
  },
  productSImg: {
    position: 'absolute',
    right: -6,
    bottom: -5,
    width: 22,
    height: 24,
  },
  productTxtbox: {
    flex: 1,
  },
  productNum: {
    color: '#393f44',
    fontSize: 14,
    lineHeight: 21,
  },
  productName: {
    marginTop: 4,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#222',
  },
  productDate: {
    marginTop: 6,
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 16.9,
  },
  subWhitebox: {
    backgroundColor: '#fff',
    shadowColor: 'rgba(224, 225, 226, 0.5)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
  },
  dlFlexlist: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
  dlItem: {
    width: '50%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dt: {
    color: '#666',
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
  },
  dtWithTip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icoTip: {
    width: 13,
    height: 13,
    marginLeft: 4,
  },
  dd: {
    marginTop: 6,
    fontSize: 18,
    lineHeight: 23.4,
    fontWeight: '600',
    color: '#222',
  },
  ddStrong: {
    fontSize: 18,
    lineHeight: 25.2,
    fontWeight: '700',
    color: '#222',
  },
  progressGroup: {
    marginTop: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  txtStit: {
    marginBottom: 10,
    color: '#666',
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
  },
  progressBar: {
    position: 'relative',
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e0e1e2',
  },
  progressVal: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 3,
    backgroundColor: '#197cff',
  },
  progressTip: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#197cff',
    borderRadius: 5,
    backgroundColor: '#197cff',
  },
  progressTipText: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 14.3,
    fontWeight: '400',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  progressTotal: {
    flex: 1,
    color: '#bfc3c7',
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '600',
  },
  progressTotalEm: {
    color: '#393f44',
    fontWeight: '600',
  },
  progressPct: {
    color: '#393f44',
    fontSize: 12,
    lineHeight: 15.6,
    fontWeight: '600',
  },
  bodyGray: {
    backgroundColor: '#f5f7fa',
    paddingBottom: 40,
  },
  flexTxtlimit: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
    padding: 10,
  },
  icoCoin: {
    width: 18,
    height: 13,
    marginRight: 6,
    backgroundColor: 'transparent',
  },
  flexTxtlimitText: {
    color: '#666',
    fontSize: 12,
    lineHeight: 15.6,
  },
  flexTxtlimitLink: {
    marginLeft: 4,
    color: '#222',
    fontSize: 12,
    lineHeight: 15.6,
    fontWeight: '600',
  },
  subSTitleBox: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  subSTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: '#222',
  },
  titleP: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22.5,
    color: '#666',
  },
  mt50: {
    marginTop: 50,
  },
  invMethodSwiper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 25,
  },
  invMethodSlide: {
    height: 'auto',
  },
  invMethodInbox: {
    position: 'relative',
    height: 200,
  },
  invMethodImgbox: {
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: 'rgba(104, 111, 115, 0.15)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  invMethodImg: {
    width: '100%',
    height: 200,
  },
  invMethodTxtbox: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    padding: 24,
    paddingHorizontal: 20,
  },
  invMethodTit: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: '#222',
  },
  invMethodTxt: {
    marginTop: 4,
    color: '#393f44',
    fontSize: 15,
    lineHeight: 22.5,
    fontWeight: '600',
  },
  bankCard: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 40,
    borderRadius: 10,
    shadowColor: 'rgba(104, 111, 115, 0.15)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  btnRefresh: {
    position: 'absolute',
    top: 13,
    right: 17,
    width: 60,
    height: 20,
    zIndex: 10,
  },
  btnRefreshText: {
    color: '#2c3db8',
    fontSize: 12,
    fontWeight: '600',
  },
  cntbox: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#2c3db8',
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cntboxTit: {
    color: '#393f44',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  cntboxCnt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  cntboxCntEm: {
    marginRight: 2,
    fontSize: 30,
    fontWeight: '700',
    color: '#393f44',
  },
  cntboxCntText: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#393f44',
  },
  bankInfo: {
    position: 'relative',
    padding: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#2c3db8',
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#f8faff',
  },
  bankInfoAccountnum: {
    marginBottom: 12,
  },
  bankInfoDt: {
    marginBottom: 12,
    color: '#666',
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '400',
  },
  bankInfoDd: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankLogo: {
    marginRight: 10,
  },
  bankLogoImg: {
    height: 20,
  },
  bankNum: {
    flex: 1,
    position: 'relative',
  },
  bankNumText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    color: '#222',
  },
  bankNumTip: {
    marginTop: 5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#197cff',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  bankNumTipText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
    color: '#393f44',
  },
  bankNumTipEm: {
    color: '#197cff',
    fontWeight: '600',
  },
  btnCopy: {
    marginLeft: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#2c3db8',
    borderRadius: 5,
  },
  btnCopyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bankInfoUsername: {
    flexDirection: 'row',
    position: 'absolute',
    top: 10,
    right: 20,
  },
  bankInfoUsernameDt: {
    marginRight: 48,
    color: '#666',
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '400',
  },
  bankInfoUsernameDd: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    color: '#222',
  },
  bankAmount: {
    marginHorizontal: 16,
    marginTop: 34,
    padding: 20,
    paddingBottom: 30,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
  },
  bankAmountTitle: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  },
  dlAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
  dlAmountDt: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
  },
  dlAmountDd: {
    color: '#fff',
    fontSize: 23,
    lineHeight: 29.9,
    fontWeight: '600',
  },
  dlAmountB: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  dlAmountBDt: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
  },
  dlAmountBDd: {
    color: '#fff',
    fontSize: 23,
    lineHeight: 29.9,
    fontWeight: '600',
  },
  wrAmount: {
    position: 'relative',
    marginTop: 24,
  },
  inputAmount: {
    width: '100%',
    height: 38,
    paddingRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: 16,
    lineHeight: 36,
    fontWeight: '600',
  },
  wrAmountTxt: {
    position: 'absolute',
    top: 0,
    right: 0,
    color: '#fff',
    fontSize: 20,
    lineHeight: 36,
    fontWeight: '500',
  },
  invintroBox: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  txtchk: {
    fontSize: 18,
    lineHeight: 23.4,
    fontWeight: '600',
    color: '#222',
  },
  flexInput: {
    marginTop: 12,
  },
  flexInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
  },
  flexInputText: {
    flex: 1,
    marginRight: 8,
  },
  textInput: {
    height: 44,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    fontSize: 15,
    lineHeight: 22.5,
    fontWeight: '600',
    backgroundColor: '#fbfbfb',
  },
  starNotif: {
    marginTop: 12,
    color: '#ff5042',
    fontSize: 12,
    lineHeight: 18,
  },
  btnStyleH44: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2c3db8',
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnStyleText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '600',
  },
  termsArea: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 30,
  },
  termsTxt: {
    paddingHorizontal: 4,
    fontSize: 15,
    lineHeight: 22.5,
    fontWeight: '400',
    color: '#222',
  },
  termsLink: {
    color: '#2c3db8',
    fontWeight: '600',
  },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 21,
    height: 21,
    borderWidth: 2,
    borderColor: '#e0e1e2',
    borderRadius: 4,
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#2c3db8',
    borderColor: '#2c3db8',
  },
  checkboxTxt: {
    fontSize: 15,
    lineHeight: 22.5,
    color: '#222',
  },
  detailTogglebox: {
    marginTop: 8,
    backgroundColor: '#fff',
    shadowColor: 'rgba(224, 225, 226, 0.5)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
  },
  inTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    paddingHorizontal: 20,
    paddingRight: 40,
    position: 'relative',
  },
  inTitleText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: '#222',
  },
  inTitleArrow: {
    position: 'absolute',
    top: '50%',
    right: 18,
    width: 14,
    height: 14,
    marginTop: -7,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#666',
    transform: [{ rotate: '-45deg' }],
  },
  inTitleArrowRotated: {
    transform: [{ rotate: '135deg' }],
  },
  inCont: {
    paddingBottom: 30,
  },
  chargeBox: {
    paddingHorizontal: 20,
  },
  tableData: {
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8faff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  tableCell: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
  },
  mt24: {
    marginTop: 24,
  },
  wFull: {
    flex: 1,
  },
  btnBox: {
    paddingHorizontal: 16,
    marginTop: 30,
    marginBottom: 40,
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
  btnStyleH48Text: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '500',
  },
  eventBox: {
    marginHorizontal: 16,
    marginBottom: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: 'rgba(104, 111, 115, 0.15)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  eventInbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  eventIco: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  eventIcoImg: {
    width: 24,
    height: 24,
  },
  eventTit: {
    marginRight: 8,
    fontSize: 15,
    lineHeight: 19.5,
    fontWeight: '600',
    color: '#2c3db8',
  },
  eventTxt: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: '#666',
  },
});

export default InvestRequestScreen;
