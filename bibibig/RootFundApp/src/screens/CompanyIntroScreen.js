import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CompanyIntroScreen = ({ navigation }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  React.useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const userToken = await AsyncStorage.getItem('userToken');
      setIsLoggedIn(!!(userData && userToken));
    } catch (error) {
      console.error('로그인 상태 확인 오류:', error);
    }
  };

  const handleLoanRequest = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (userData && userToken) {
        // 로그인 상태 - 대출 상담 신청 페이지로 이동
        const user = JSON.parse(userData);
        navigation.navigate('LoanRequest', { user, returnScreen: 'CompanyIntro' });
      } else {
        // 로그인 안 됨 - 로그인 페이지로 이동
        navigation.navigate('Login', { type: 'loreq' });
      }
    } catch (error) {
      console.error('로그인 상태 확인 오류:', error);
      navigation.navigate('Login', { type: 'loreq' });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        showsHorizontalScrollIndicator={false}
      >
        {/* 비주얼 섹션 */}
        <View style={styles.subBusinessVisual}>
          <ImageBackground 
            source={require('../assets/images/bg_corp_intro.png')} 
            style={styles.imgbox}
            resizeMode="cover"
          >
          <View style={styles.txtbox}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>회사소개</Text>
            </View>
            <Text style={styles.title}>More for the future</Text>
            <Text style={styles.titleP}>
              세상의 가장 작은 뿌리인 시민 한 사람, 한 사람으로부터{'\n'}
              에너지 전환이 이루어진다는 믿음으로{'\n'}
              누구나 에너지의 주인이 되는 미래를 만듭니다.
            </Text>
            
            <Text style={styles.subTitle}>
              루트인프라금융㈜은{'\n'}
              국내 최초 친환경 투자 플랫폼{'\n'}
              '루트펀드'를 운영하는{'\n'}
              재생에너지 금융 전문{'\n'}
              핀테크 기업입니다
            </Text>

            <View style={styles.subImgbox}>
              <Image 
                source={require('../assets/images/img_regi.png')} 
                style={styles.regiImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.subDetail}>
              재생에너지 수용성 솔루션 전문 기업{'\n'}
              ㈜루트에너지의 자회사로,{'\n'}
              누구나 에너지의 주인이 될 수 있도록{'\n'}
              손쉽게 재생에너지에 투자할 수 있는{'\n'}
              편리한 금융 환경을 만듭니다.{'\n'}
              루트인프라금융㈜는 온라인투자연계금융업(온투업)의{'\n'}
              엄격한 기준을 통과한 제도권 금융회사로서{'\n'}
              더욱 안전한 금융 서비스를 제공합니다.
            </Text>
          </View>
          </ImageBackground>
        </View>

        {/* 미션 가이드 섹션 */}
        <View style={styles.subMissionGuide}>
          <View style={styles.missionImg}>
            <Image 
              source={require('../assets/images/rootfund_logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.missionDetail}>
            재생에너지 대중화로{'\n'}
            탄소중립을 앞당기는{'\n'}
            친환경 투자 플랫폼 루트펀드
          </Text>
          <View style={styles.phoneImg}>
            <Image 
              source={require('../assets/images/img_phone.png')} 
              style={styles.phoneImage}
              resizeMode="contain"
            />
          </View>

          {/* 아이템 1 */}
          <View style={styles.item}>
            <View style={styles.itemContentBox}>
              <View style={styles.itemImgbox}>
                <Image 
                  source={require('../assets/images/img_rootfund_01.png')} 
                  style={styles.itemImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.titbox}>
                <Image 
                  source={require('../assets/images/icon_check.png')} 
                  style={styles.checkImg}
                  resizeMode="contain"
                />
                <Text style={styles.itemTit}>수익을 쌓고 유익을 더합니다</Text>
              </View>
              <Text style={styles.itemTxt}>
                재생에너지 특화 P2P 플랫폼 루트펀드의 새로운 BI는 투자할수록 쌓이고 배가되는 혜택을 형상화했습니다.{' '}
                <Text style={styles.itemTxt2}>
                  이 혜택에는 연 10% 이상의 높은 수익률뿐만 아니라 기후위기, 지역위기 해결이라는 사회ㆍ환경적 가치가 포함됩니다. 루트펀드는 철저한 사업 검증과 리스크 관리를 통해 안정적이고 수익성 높은 친환경 투자 상품을 선보이고 있습니다.
                </Text>
              </Text>
            </View>
          </View>

          {/* 아이템 2 */}
          <View style={styles.item}>
            <View style={styles.itemContentBox}>
              <View style={styles.itemImgbox}>
                <Image 
                  source={require('../assets/images/img_rootfund_02.png')} 
                  style={styles.itemImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.titbox}>
                <Image 
                  source={require('../assets/images/icon_check.png')} 
                  style={styles.checkImg}
                  resizeMode="contain"
                />
                <Text style={styles.itemTit}>가치와 가치를 연결합니다</Text>
              </View>
              <Text style={styles.itemTxt}>
                루트펀드는 태양광, 풍력 발전소, 전기차 충전시설 등의 사업자와 친환경 투자수익을 원하는 투자자를 연결합니다.{' '}
                <Text style={styles.itemTxt2}>
                  자금 조달의 사각지대에 있던 소규모 발전 사업자에게는 기존 금융권보다 유리한 조건의 중금리 금융 서비스를, 환경 감수성을 지닌 시민들에게는 누구나 양질의 재생에너지 발전 사업에 투자하고 높은 수익을 얻을 수 있는 가치투자 기회를 제공합니다.
                </Text>
              </Text>
            </View>
          </View>

          {/* 아이템 3 */}
          <View style={styles.item}>
            <View style={styles.itemContentBox}>
              <View style={styles.itemImgbox2}>
                <Image 
                  source={require('../assets/images/img_rootfund_03.png')} 
                  style={styles.itemImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.titbox}>
                <Image 
                  source={require('../assets/images/icon_check.png')} 
                  style={styles.checkImg}
                  resizeMode="contain"
                />
                <Text style={styles.itemTit}>더 쉽고 가까워집니다</Text>
              </View>
              <Text style={styles.itemTxt}>
                루트펀드는 국내 최초 재생에너지 및 탄소중립 전문 P2P 금융 플랫폼입니다.{' '}
                <Text style={styles.itemTxt2}>
                  사용자 친화적인 설계로 누구나 스마트폰 하나만 있으면 투자할 수 있으며, 더욱 안전하고 편리한 IT 환경을 구축하기 위해 끊임없이 발전시켜 나가고 있습니다. 또한 대출, 투자 관련 제반기능의 자동화로 정확하고 투명한 운영이 가능합니다.
                </Text>
              </Text>
            </View>
          </View>

          {/* 아이템 4 */}
          <View style={styles.item}>
            <View style={styles.itemContentBox}>
              <View style={styles.itemImgbox}>
                <Image 
                  source={require('../assets/images/img_rootfund_04.png')} 
                  style={styles.itemImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.titbox}>
                <Image 
                  source={require('../assets/images/icon_check.png')} 
                  style={styles.checkImg}
                  resizeMode="contain"
                />
                <Text style={styles.itemTit}>모두의 이익을 만듭니다</Text>
              </View>
              <Text style={styles.itemTxt}>
                루트펀드는 금융과 기술, 가치를 결합해 탄소중립을 앞당깁니다.{' '}
                <Text style={styles.itemTxt2}>
                  손쉬운 투자 기회와 높은 수익으로 재생에너지에 대한 긍정적인 인식을 확대하고, 이를 통해 기후위기를 해결하기 위해 노력합니다. 가치투자자와 탄소중립 사업자, 루트펀드가 함께 더 살기 좋은 미래를 만들어갑니다.
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* 파트너 섹션 */}
        <Text style={styles.subTitleGuide}>정책, 기술, 금융의{'\n'}최고 전문가와 함께합니다</Text>
        <View style={styles.subPartnerGuide}>
          <View style={styles.partnerBox}>
            <View style={styles.partnerLogos}>
              <View style={styles.partnerLogosRow}>
                <View style={styles.partnerLogoItem}>
                  <Image source={require('../assets/images/img_partner_logo01.png')} style={styles.partnerLogoImg} resizeMode="contain" />
                </View>
                <View style={styles.partnerLogoItem}>
                  <Image source={require('../assets/images/img_partner_logo02.png')} style={styles.partnerLogoImg} resizeMode="contain" />
                </View>
                <View style={styles.partnerLogoItem}>
                  <Image source={require('../assets/images/img_partner_logo03.png')} style={styles.partnerLogoImg} resizeMode="contain" />
                </View>
                <View style={styles.partnerLogoItem}>
                  <Image source={require('../assets/images/img_partner_logo04.png')} style={styles.partnerLogoImg} resizeMode="contain" />
                </View>
              </View>
              <View style={[styles.partnerLogosRow, {marginTop: 20}]}>
                <View style={styles.partnerLogoItem}>
                  <Image source={require('../assets/images/img_partner_logo05.png')} style={styles.partnerLogoImg2} resizeMode="contain" />
                </View>
                <View style={styles.partnerLogoItem}>
                  <Image source={require('../assets/images/img_partner_logo06.png')} style={styles.partnerLogoImg2} resizeMode="contain" />
                </View>
                <View style={styles.partnerLogoItem}>
                  <Image source={require('../assets/images/img_partner_logo07.png')} style={styles.partnerLogoImg2} resizeMode="contain" />
                </View>
              </View>
            </View>
            <View style={styles.partnerMain}>
              <View style={styles.partnerMainImgbox}>
                <Image source={require('../assets/images/img_partner_logo00.png')} style={styles.partnerMainLogo} resizeMode="contain" />
              </View>
              <Text style={styles.partnerMainTxt}>
                루트펀드는 NH농협은행과 함께{'\n'}최고의 금융 보안성을 갖춘{'\n'}핀테크 서비스를 제공합니다.
              </Text>
            </View>
          </View>

          <View style={styles.partnerList}>
            <View style={styles.partnerListItem}>
              <View style={styles.partnerListImgbox}>
                <Image source={require('../assets/images/img_partner_list01.png')} style={styles.partnerListImg} resizeMode="contain" />
              </View>
              <Text style={styles.partnerListTxt}>라이선스 등록</Text>
            </View>
            <View style={styles.partnerListItem}>
              <View style={styles.partnerListImgbox}>
                <Image source={require('../assets/images/img_partner_list02.png')} style={styles.partnerListImg} resizeMode="contain" />
              </View>
              <Text style={styles.partnerListTxt}>예치기관</Text>
            </View>
            <View style={styles.partnerListItem}>
              <View style={styles.partnerListImgbox}>
                <Image source={require('../assets/images/img_partner_list03.png')} style={styles.partnerListImg} resizeMode="contain" />
              </View>
              <Text style={styles.partnerListTxt}>NICE신용평가</Text>
            </View>
          </View>
        </View>

        {/* 하단 이미지 섹션 */}
        <ImageBackground 
          source={require('../assets/images/img_corp_guide.png')} 
          style={styles.subMissionImgbox}
          resizeMode="cover"
        >
          <View style={styles.corpGuideTxtbox}>
            <Text style={styles.corpGuideTit}>재생에너지{'\n'}사업자이신가요?</Text>
            <Text style={styles.corpGuideTxt}>신청서를 작성하시면 세부 내용에 대한 설명과{'\n'}더불어 모든 절차를 도와드립니다</Text>
          </View>
        </ImageBackground>

        
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View style={styles.fixBtnWrap}>
        <TouchableOpacity 
          style={styles.btnStyle}
          onPress={handleLoanRequest}
        >
          <Text style={styles.btnText}>대출 상담 신청</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 15,
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 28,
    color: '#333',
    fontWeight: '300',
  },
  // 비주얼 섹션
  subBusinessVisual: {
    position: 'relative',
    textAlign: 'center',
    minHeight: 1250,
    width: '100%',
    overflow: 'hidden',
  },
  imgbox: {
    minHeight: 1250,
    backgroundColor: '#E7EEF9',
    width: '100%',
  },
  txtbox: {
    position: 'relative',
    paddingTop: 60,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 1,
  },
  tag: {
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#fff',
  },
  tagText: {
    color: '#222',
    fontSize: 15,
    lineHeight: 30,
    fontWeight: '600',
  },
  title: {
    marginTop: 20,
    color: '#222',
    fontSize: 28,
    lineHeight: 36.4,
    fontWeight: '700',
  },
  titleP: {
    marginTop: 12,
    color: '#666',
    fontSize: 15,
    lineHeight: 22.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  subTitle: {
    marginTop: 230,
    marginHorizontal: 20,
    fontSize: 24,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
    color: '#fff',
  },
  subImgbox: {
    borderRadius: 12,
    marginTop: 60,
    marginBottom: 50,
    marginHorizontal: 20,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  regiImage: {
    width: 360,
    height: 250,
  },
  subDetail: {
    marginTop: 24,
    marginHorizontal: 20,
    fontSize: 15,
    lineHeight: 25.5,
    fontWeight: '400',
    textAlign: 'center',
    color: '#fff',
  },
  // 미션 가이드
  subMissionGuide: {
    paddingHorizontal: 20,
    paddingTop: 60,
    backgroundColor: '#dce8fa',
    paddingBottom: 30,
  },
  missionImg: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 200,
    height: 50,
  },
  missionDetail: {
    fontSize: 24,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
    color: '#222',
    marginBottom: 30,
  },
  phoneImg: {
    alignItems: 'center',
  },
  phoneImage: {
    width: SCREEN_WIDTH - 80,
    height: 300,
  },
  item: {
    marginBottom: 40,
  },
  itemImgbox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  itemImgbox2: {
    alignItems: 'center',
    marginBottom: 20,
  },
  itemImage: {
    width: '100%',
    height: 190,
  },
  itemContentBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    
  },
  titbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkImg: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  itemTit: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#2c3db8',
  },
  itemTxt: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
    color: '#222',
    marginTop: 10,
  },
  itemTxt2: {
    color: '#666',
    fontWeight: '400',
  },
  // 파트너 섹션
  subTitleGuide: {
    fontSize: 24,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
    color: '#222',
    paddingTop: 50,
    backgroundColor: '#f6f6f6',
  },
  subPartnerGuide: {
  
    backgroundColor: '#f6f6f6',
    paddingVertical: 30,
  },
  partnerBox: {
    flexDirection: 'column',
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  partnerLogos: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  partnerLogosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerLogoItem: {
    alignItems: 'center',
  },
  partnerLogoImg: {
    width: 72,
    height: 20,
  },
  partnerLogoImg2: {
    width: 87,
    height: 25,
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  partnerMain: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#f6f6f6',
    alignItems: 'center',
  },
  partnerMainImgbox: {
    lineHeight: 0,
  },
  partnerMainLogo: {
    width: 80,
    height: 15,
  },
  partnerMainTxt: {
    marginTop: 24,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    color: '#222',
    fontWeight: '400',
  },
  partnerList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(119, 171, 248, 0.30)',
    borderRadius: 10,
    backgroundColor: 'rgba(119, 171, 248, 0.05)',
  },
  partnerListItem: {
    flex: 1,
    alignItems: 'center',
  },
  partnerListImgbox: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerListImg: {
    width: 60,
    height: 40,
  },
  partnerListTxt: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: '#516c89',
    fontWeight: '400',
    textAlign: 'center',
  },
  // 하단 이미지
  subMissionImgbox: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 390,
    justifyContent: 'center',
  },
  corpGuideTxtbox: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  corpGuideTit: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  corpGuideTxt: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    color: '#fff',
    textAlign: 'center',
  },
  // 하단 고정 버튼
  fixBtnWrap: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  btnStyle: {
    height: 54,
    backgroundColor: '#2c3db8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CompanyIntroScreen;

