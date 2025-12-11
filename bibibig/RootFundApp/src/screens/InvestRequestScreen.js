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
  Dimensions,
  Modal,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import RenderHtml from 'react-native-render-html';
import api from '../services/api';

const InvestRequestScreen = ({ navigation, route }) => {
  const { orderNumber, orderKey } = route.params || {};
  // orderKey와 orderNumber 둘 다 지원 (호환성)
  const productOrderNumber = orderNumber || orderKey;
  const { width } = useWindowDimensions();

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
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = React.useRef(null);
  const [showInvestLimitModal, setShowInvestLimitModal] = useState(false);
  const [showInvestGradeModal, setShowInvestGradeModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    loadInvestData();
  }, [productOrderNumber]);

  const loadInvestData = async () => {
    try {
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
      
      const formData = api.convertToFormData({ 
        orderNumber: productOrderNumber.toString(),
        member_id: memberId.toString()
      });
      const response = await api.api.post('/app/product/invest', formData);
      
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
    if (!num && num !== 0) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue === '') {
      setInvestAmount('');
    } else {
      setInvestAmount(formatNumber(numericValue));
    }
  };

  const handleRefresh = async () => {
    try {
      const response = await api.api.post('/app/product/balance/refresh', api.convertToFormData({}));
      if (response.data !== undefined && response.data !== null) {
        setBalance(response.data);
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
    
    if (!trimmedCode) {
      Alert.alert('투자하기', '추천인 코드를 입력해주세요.');
      return;
    }
    
    try {
      const formData = api.convertToFormData({ referee_code: trimmedCode.toString() });
      const response = await api.api.post('/app/product/referee/check', formData);
      
      if (response.data.rtnvalue === '0') {
        setRefereeCheckYn('Y');
        Alert.alert('투자하기', `입력하신 추천인코드는\n${response.data.member_name}님으로 확인되었습니다.`);
      } else {
        setRefereeCheckYn('N');
        Alert.alert('투자하기', '입력하신 추천인코드는 확인되지 않습니다.');
      }
    } catch (error) {
      console.error('❌ 추천인 확인 실패:', error);
      setRefereeCheckYn('N');
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
      // 현재 로그인한 사용자 정보 가져오기
      const currentUser = await api.getCurrentUser();
      const memberId = currentUser?.session?.member_id || currentUser?.member_id;
      
      if (!memberId) {
        Alert.alert('오류', '로그인이 필요합니다.');
        navigation.navigate('Login');
        return;
      }

      // 보안 요청 데이터 생성
      const reqModesFormData = api.convertToFormData({ reqdata: investment });
      const reqModesResponse = await api.api.post('/app/setreqmodes', reqModesFormData);
      
      if (!reqModesResponse.data) {
        Alert.alert('투자하기', '요청 데이터 생성 중 오류가 발생하였습니다. 다시 시도하여 주세요.');
        return;
      }

      // 투자 처리 API 호출
      const formData = api.convertToFormData({
        member_id: memberId.toString(),
        orderNumber: productOrderNumber.toString(),
        investment: investment.toString(),
        referee_code: trimmedRefereeCode.toString(),
        _bcsrmd1: reqModesResponse.data.data1,
        _bcsrmd2: reqModesResponse.data.data2,
      });
      
      const response = await api.api.post('/app/product/invest/process', formData);

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
          <Image 
            source={require('../assets/images/ico_back.png')} 
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.title}></Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Product Item */}
        <View style={styles.blBox}>
          <View style={styles.blBoxBefore} />
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
              {expertopinion?.note && (
                <Text style={styles.productNum}>
                  {expertopinion.note.replace(/\n/g, ' ')}
                </Text>
              )}
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
              <View style={styles.progressBarBefore} />
              <LinearGradient
                colors={['#495ad8', '#77abf8']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={[styles.progressVal, { width: `${prod.percent || 0}%` }]}
              />
              <View style={styles.progressTip}>
                <Text style={styles.progressTipText}>
                  모집 잔액 {formatNumber(prod.left_price)}원
                </Text>
                <View style={styles.progressTipArrow} />
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
            <Image
              source={require('../assets/images/ico_coin.png')}
              style={styles.icoCoin}
              resizeMode="contain"
            />
            <Text style={styles.flexTxtlimitText}>더 높은 투자한도를 원한다면?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('UpwardRequest')}>
              <Text style={styles.flexTxtlimitLink}>특수투자자 전환하기 {'>'}</Text>
            </TouchableOpacity>
          </View>

          {/* Investor Info */}
          <View style={[styles.subWhitebox, styles.pb24]}>
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
                  <TouchableOpacity onPress={() => setShowInvestGradeModal(true)}>
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
          <View style={[styles.subSTitleBox, styles.mt24]}>
            <Text style={styles.subSTitle}>투자방법</Text>
          </View>
          
          <View style={styles.invMethodSwiper}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled={false}
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const slideWidth = Dimensions.get('window').width * 0.78 + 16;
                const index = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
                setCurrentSlide(index);
              }}
              scrollEventThrottle={16}
              decelerationRate="fast"
              snapToInterval={Dimensions.get('window').width * 0.78 + 16}
              snapToAlignment="start"
              contentContainerStyle={styles.invMethodScrollContent}
            >
              {/* Slide 1 */}
              <View style={styles.invMethodSlide}>
                <View style={styles.invMethodInbox}>
                  <View style={styles.invMethodImgbox}>
                    <Image
                      source={require('../assets/images/bg_inv_method01.png')}
                      style={styles.invMethodImg}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.invMethodTxtbox}>
                    <Text style={styles.invMethodTit}>개인전용 가상계좌번호 확인</Text>
                    <Text style={styles.invMethodTxt}>아래 가상계좌번호를 확인해주세요</Text>
                  </View>
                </View>
              </View>

              {/* Slide 2 */}
              <View style={styles.invMethodSlide}>
                <View style={styles.invMethodInbox}>
                  <View style={styles.invMethodImgbox}>
                    <Image
                      source={require('../assets/images/bg_inv_method02.png')}
                      style={styles.invMethodImg}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.invMethodTxtbox}>
                    <Text style={styles.invMethodTit}>예치금 입금</Text>
                    <Text style={styles.invMethodTxt}>*가입 시 등록한 출금계좌에서만 입금가능</Text>
                  </View>
                </View>
              </View>

              {/* Slide 3 */}
              <View style={[styles.invMethodSlide, styles.invMethodSlideLast]}>
                <View style={styles.invMethodInbox}>
                  <View style={styles.invMethodImgbox}>
                    <Image
                      source={require('../assets/images/bg_inv_method02.png')}
                      style={styles.invMethodImg}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.invMethodTxtbox}>
                    <Text style={styles.invMethodTit}>투자 준비 완료</Text>
                    <Text style={styles.invMethodTxt}>이제 마음껏 투자하세요!</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Pagination */}
            <View style={styles.swiperPagination}>
              {[0, 1, 2].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationBullet,
                    currentSlide === index && styles.paginationBulletActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Bank Card */}
          <View style={styles.bankCard}>
            <TouchableOpacity style={styles.btnRefresh} onPress={handleRefresh}>
              <Image
                source={require('../assets/images/ico_refresh.png')}
                style={styles.btnRefreshImg}
                resizeMode="contain"
              />
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
                      <View style={styles.bankNumTipArrow} />
                      <View style={styles.bankNumTipArrowInner} />
                      <Text style={styles.bankNumTipText}>
                        위 계좌로 <Text style={styles.bankNumTipEm}>예치금을 입금</Text>해주세요!
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.btnCopy} onPress={handleCopyAccount}>
                    <Image
                      source={require('../assets/images/ico_copy.png')}
                      style={styles.btnCopyImg}
                      resizeMode="contain"
                    />
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
                <TouchableOpacity onPress={() => setShowInvestLimitModal(true)}>
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
                style={[styles.inputAmount, { color: '#ffffff' }]}
                value={investAmount}
                onChangeText={handleAmountChange}
                placeholder="최소 투자금액 10,000원 부터 입력"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="numeric"
                selectionColor="#ffffff"
                underlineColorAndroid="transparent"
                autoCorrect={false}
                autoCapitalize="none"
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
          <View style={[styles.subWhitebox, styles.mt36]}>
            <View style={styles.subSTitleBox}>
              <Text style={styles.subSTitle}>추천인 등록</Text>
              <Text style={styles.titleP}>
                * 해당 상품을 소개해 준 추천인에 대한 코드를 입력{'\n'}
                * 추천인 코드 위치 : 추천인의 마이페이지 {'>'} 개인정보관리{'\n'}
                * 본인 추천인 코드 입력 불가{'\n'}
                * 추천인 코드 변경시 [추천인 확인] 재진행 필요{'\n'}
              </Text>
            </View>

            <View style={styles.invintroBox2}>
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
              <Text style={styles.termsLink} onPress={() => setShowTermsModal(true)}>
                연계투자계약 약관
              </Text>에 동의합니다.
            </Text>
            <TouchableOpacity
              style={styles.termsBox}
              onPress={() => setIsAgreed(!isAgreed)}
            >
              <Image
                source={
                  isAgreed
                    ? require('../assets/images/checkbox_on.png')
                    : require('../assets/images/checkbox_off.png')
                }
                style={styles.checkboxIcon}
              />
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

          {/* 임시 테스트 버튼 - 디자인 확인용 */}
          {/*<View style={[styles.btnBox, { marginTop: 10 }]}>
            <TouchableOpacity
              style={[styles.btnStyleH48, { backgroundColor: '#28a745' }]}
              onPress={() => {
                // 임시 데이터로 투자 성공 화면 이동
                navigation.navigate('InvestSuccess', {
                  orderNumber: prod.orderNumber || productOrderNumber,
                  tid: 'TEST_TID_' + Date.now()
                });
              }}
            >
              <Text style={styles.btnStyleH48Text}>투자 완료 (디자인 확인용)</Text>
            </TouchableOpacity>
          </View>*/}

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

      {/* 투자가능금액 안내 모달 */}
      <Modal
        visible={showInvestLimitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInvestLimitModal(false)}
      >
        <View style={styles.popContainer}>
          <TouchableOpacity 
            style={styles.popMask} 
            activeOpacity={1}
            onPress={() => setShowInvestLimitModal(false)}
          />
          <View style={styles.popWrapper}>
            <View style={styles.popBox}>
              <Text style={styles.popTitle}>투자가능금액 안내</Text>
              
              <Text style={styles.popMsg}>
                해당 상품에 투자한 이력이 없는 경우{'\n'}
                전체 투자한도까지 투자 가능합니다.
              </Text>
              
              <Text style={styles.popMsg}>
                해당 상품에 일부 금액을 투자한 적 있거나,{'\n'}
                투자한도 전체 금액을 투자한 적이 있는 경우{'\n'}
                해당 금액을 제외한 금액만 투자 가능합니다.
              </Text>
              
              <Text style={styles.popMsg}>
                ex) A-1호 상품에 200만원 투자 시{'\n'}
                A-2호 상품에 300만원 투자 가능
              </Text>
              
              <View style={styles.popBtnBox}>
                <TouchableOpacity 
                  style={styles.popBtnStyleH48}
                  onPress={() => setShowInvestLimitModal(false)}
                >
                  <Text style={styles.popBtnText}>확인</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 투자등급 안내 모달 */}
      <Modal
        visible={showInvestGradeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInvestGradeModal(false)}
      >
        <View style={styles.popContainer}>
          <TouchableOpacity 
            style={styles.popMask} 
            activeOpacity={1}
            onPress={() => setShowInvestGradeModal(false)}
          />
          <View style={styles.popWrapper}>
            <View style={styles.popBox}>
              <Text style={styles.popTitle}>투자등급 안내</Text>
              
              <Text style={styles.popMsg}>
                소득적격 투자자 : 투자한도 2천만원{'\n'}
                전문투자자 : 투자한도 모집금액의 40%{'\n'}
                등급 변경에 관한 조건은 상단의{'\n'}
                특수투자자 전환하기를 참고해 주세요.
              </Text>
              
              <Text style={styles.popMsg}>
                해당 차입자 상품에 투자한 적 없으면 500만원{'\n'}
                해당 차입자 상품에 일부 투자한 적 있으면 해당 금액 제외
              </Text>
              
              <Text style={styles.popMsg}>
                예) 이전 상품 300만원 투자 시 200만원{'\n'}
                해당 차입자 상품에 투자한도 전액 투자한 상태면 0원
              </Text>
              
              <View style={styles.popBtnBox}>
                <TouchableOpacity 
                  style={styles.popBtnStyleH48}
                  onPress={() => setShowInvestGradeModal(false)}
                >
                  <Text style={styles.popBtnText}>확인</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 연계투자계약 약관 모달 */}
      <Modal
        visible={showTermsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.popContainer}>
          <TouchableOpacity 
            style={styles.popMask} 
            activeOpacity={1}
            onPress={() => setShowTermsModal(false)}
          />
          <View style={styles.popWrapper}>
            <View style={styles.popBox}>
              <Text style={styles.popTitle}>연계투자계약 약관</Text>
              
              <ScrollView style={styles.popTermsScroll}>
                <View style={styles.popTermsContent}>
                  {term.contents ? (
                    <RenderHtml
                      contentWidth={width - 100}
                      source={{ html: term.contents }}
                      tagsStyles={{
                        body: {
                          color: '#666',
                          fontSize: 13,
                          lineHeight: 19.5,
                          fontWeight: '400',
                        },
                        p: {
                          marginTop: 0,
                          marginBottom: 8,
                        },
                        br: {
                          height: 8,
                        },
                      }}
                    />
                  ) : (
                    <Text style={styles.popTermsTxt}>
                      약관 내용을 불러오는 중입니다...
                    </Text>
                  )}
                </View>
              </ScrollView>
              
              <View style={styles.popBtnBox}>
                <TouchableOpacity 
                  style={styles.popBtnStyleH48}
                  onPress={() => setShowTermsModal(false)}
                >
                  <Text style={styles.popBtnText}>확인</Text>
                </TouchableOpacity>
              </View>
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
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
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
    backgroundColor: '#fff',
  },
  blBoxBefore: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: '#2c3db8',
    zIndex: 1,
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
    top: 22,
    left: 27,
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
    marginLeft: 20,
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
    paddingTop: 14,
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
  },
  progressBarBefore: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    backgroundColor: '#e0e1e2',
  },
  progressVal: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 3,
    zIndex: 1,
  },
  progressTip: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: 10,
    paddingTop: 5,
    paddingHorizontal: 8,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: '#197cff',
    borderRadius: 5,
    backgroundColor: '#197cff',
  },
  progressTipArrow: {
    position: 'absolute',
    top: 23,
    right: 15,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4.5,
    borderRightWidth: 4.5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#197cff',
  },
  progressTipText: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 13,
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
    marginTop: 24,
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
    fontSize: 13,
    lineHeight: 19,
    color: '#666',
  },
  mt50: {
    marginTop: 50,
  },
  invMethodSwiper: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 25,
  },
  invMethodScrollContent: {
    paddingRight: 2,
  },
  invMethodSlide: {
    width: Dimensions.get('window').width * 0.78,
    marginRight: 16,
  },
  invMethodSlideLast: {
    marginRight: 0,
  },
  invMethodInbox: {
    position: 'relative',
    height: 270,
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
    height: 270,
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
  swiperPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  paginationBullet: {
    width: 5,
    height: 5,
    marginHorizontal: 2,
    borderRadius: 5,
    backgroundColor: '#aab1bc',
  },
  paginationBulletActive: {
    width: 16,
    backgroundColor: '#2c3db8',
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
    width: 20,
    height: 20,
    zIndex: 10,
  },
  btnRefreshImg: {
    width: 20,
    height: 20,
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
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#2c3db8',
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#f8faff',
  },
  bankInfoAccountnum: {
    marginBottom: 6,
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
    position: 'absolute',
    top: 23,
    right: 40,
    marginTop: 5,
    paddingTop: 5,
    paddingHorizontal: 8,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: '#197cff',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  bankNumTipArrow: {
    position: 'absolute',
    bottom: '100%',
    right: 22,
    top: -6,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#197cff',
  },
  bankNumTipArrowInner: {
    position: 'absolute',
    bottom: '100%',
    right: 23,
    top: -5,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  bankNumTipText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
    color: '#393f44',
    whiteSpace: 'nowrap',
  },
  bankNumTipEm: {
    color: '#197cff',
    fontWeight: '600',
  },
  btnCopy: {
    marginLeft: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCopyImg: {
    width: 13,
    height: 13,
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
    marginBottom: 40,
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
    fontSize: 20,
    lineHeight: 29.9,
    fontWeight: '600',
  },
  dlAmountB: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  dlAmountBDt: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
  },
  dlAmountBDd: {
    color: '#fff',
    fontSize: 20,
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
    paddingLeft: 0,
    paddingTop: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'left',
    includeFontPadding: false,
    textAlignVertical: 'center',
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
  invintroBox2: { 
    paddingHorizontal: 20,
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
    paddingBottom: 5,
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
    fontSize: 14,
    lineHeight: 20.5,
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
    minHeight: 55,
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: 'rgba(81, 108, 137, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  checkboxIcon: {
    width: 21,
    height: 21,
  },
  checkboxTxt: {
    marginLeft: 12,
    marginTop: 1,
    fontSize: 15,
    lineHeight: 19.5,
    fontWeight: '600',
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
    width: 10,
    height: 10,
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
  mt36: {
    marginTop: 36,
  },
  pt15: {
    paddingTop: 15,
  },
  pb24: {
    paddingBottom: 24,
  },
  wFull: {
    flex: 1,
  },
  btnBox: {
    paddingHorizontal: 16,
    marginTop: 30,
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
  // 모달 스타일
  popContainer: {
    flex: 1,
    flexDirection: 'column',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    padding: 48,
    paddingTop: 48,
    paddingBottom: 48,
    zIndex: 999,
  },
  popMask: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#222',
    opacity: 0.7,
  },
  popWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    width: '100%',
  },
  popBox: {
    position: 'relative',
    width: '100%',
    padding: 24,
    paddingTop: 24,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  popTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#393f44',
  },
  popMsg: {
    marginTop: 20,
    color: '#393f44',
    fontSize: 15,
    lineHeight: 19.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  popBtnBox: {
    marginTop: 24,
  },
  popBtnStyleH48: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2c3db8',
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  // 약관 모달 추가 스타일
  popTermsScroll: {
    maxHeight: 400,
    marginTop: 20,
    marginBottom: 20,
  },
  popTermsContent: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  popTermsTxt: {
    color: '#666',
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
  },
});

export default InvestRequestScreen;
