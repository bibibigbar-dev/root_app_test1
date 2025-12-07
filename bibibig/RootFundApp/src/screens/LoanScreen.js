import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCREEN_WIDTH = Dimensions.get('window').width;

const LoanScreen = ({ navigation, route }) => {
  const { user } = route.params || {};

  const handleLoanRequest = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (userData && userToken) {
        // 로그인 상태 - 대출 상담 신청 페이지로 이동
        const user = JSON.parse(userData);
        navigation.navigate('LoanRequest', { user, returnScreen: 'Loan' });
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
      <ScrollView style={styles.content}>
        {/* 비주얼 섹션 */}
        <View style={styles.subVisual}>
          <View style={styles.visualTxtbox}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>대출</Text>
            </View>
            <Text style={styles.title}>저탄소 사업을 위한{'\n'}금융조달</Text>
            <Text style={styles.titleP}>루트펀드에서 편하게{'\n'}상담 받아보세요</Text>
            <View style={styles.visualBanner}>
              <Image 
                source={require('../assets/images/img_sub_visual_banner.png')} 
                style={styles.visualBannerImg}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* 연결 가이드 섹션 */}
        <View style={styles.subGuideConnection}>
          <Text style={styles.subTitleGuide}>
            기후금융 플랫폼{'\n'}저탄소 사업자와 가치투자자를{'\n'}연결합니다
          </Text>
          <View style={styles.connectionImgbox}>
            <Image 
              source={require('../assets/images/img_sub_guide_connection.png')} 
              style={styles.connectionImg}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* 좋은 이유 섹션 */}
        <View style={styles.subGuideReason}>
          <Text style={styles.subTitleGuide}>
            루트펀드 대출 상품이{'\n'}좋은 이유
          </Text>
          <Text style={styles.subTitlePGuide}>
            루트펀드는 K-택소노미 사업에 필요한{'\n'}금융 지원을 확대하고 있습니다.
          </Text>
          <View style={styles.reasonList}>
            <View style={styles.reasonItem}><Text style={styles.reasonText}>토지 소유권 확보 전에도 대출 💰</Text></View>
            <View style={styles.reasonItem}><Text style={styles.reasonText}>총 공사비의 최대 90% 💸</Text></View>
            <View style={styles.reasonItem}><Text style={styles.reasonText}>REC 계약 없이도 가능 📋</Text></View>
            <View style={styles.reasonItem}><Text style={styles.reasonText}>중도상환수수료 없음 🚫</Text></View>
            <View style={styles.reasonItem}><Text style={styles.reasonText}>신용등급 영향 없음 🔒</Text></View>
            <View style={styles.reasonItem}><Text style={styles.reasonText}>지역 수용성 상승 🗺</Text></View>
          </View>
          <View style={styles.reasonImgbox}>
            <Image 
              source={require('../assets/images/img_sub_guide_reason.png')} 
              style={styles.reasonImg}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* 대출 선택 섹션 */}
        <View style={styles.subGuideView}>
          <Text style={styles.subTitleGuide}>
            상황에 맞는{'\n'}대출을 선택하세요
          </Text>
          <Text style={styles.subTitlePGuide}>
            루트펀드 대출 상품은 설치부지 확정 및 인허가가{'\n'}완료된 중·소규모재생에너지 (태양광, 풍력, ESS등){'\n'}발전사업자를 중심으로 대출이 이루어지며,{'\n'}단기 준공자금 대출 상품과 장기 운영자금 대출 상품을{'\n'}제공합니다.
          </Text>

          <Text style={styles.viewTitle}>대출 전 조건</Text>
          <View style={styles.condition}>
            <View style={styles.conditionItem}>
              <View style={styles.conditionImgbox}>
                <Image 
                  source={require('../assets/images/ico_sub_guide_condition01.png')} 
                  style={styles.conditionImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.conditionTit}>사업부지 소유{'\n'}혹은 임대</Text>
              <Text style={styles.conditionTxt}>토지 매매 혹은{'\n'}임대 계약 완료</Text>
            </View>
            <View style={styles.conditionDivider} />
            <View style={styles.conditionItem}>
              <View style={styles.conditionImgbox}>
                <Image 
                  source={require('../assets/images/ico_sub_guide_condition02.png')} 
                  style={styles.conditionImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.conditionTit}>인허가{'\n'}완료</Text>
              <Text style={styles.conditionTxt}>발전사업, 개발행위{'\n'}PPA접수 인허가 미비 시{'\n'}별도 문의</Text>
            </View>
          </View>

          {/* 단기 준공자금 대출 */}
          <View style={styles.itembox}>
            <View style={[styles.itemboxTit, styles.bgBlue]}>
              <Text style={styles.itemboxTitText}>단기 준공자금 대출</Text>
            </View>
            <View style={styles.itemboxCon}>
              <Text style={styles.itemboxTxt}>
                <Text style={styles.strong}>인허가가 완료</Text>된 사업을 대상으로 발전소{'\n'}
                <Text style={styles.strong}>건설자금</Text>을 제공합니다.{'\n'}
                상환 기간 동안 안전하게 건설하고,{'\n'}
                준공 후 은행 시설자금대출 등으로 상환합니다.
              </Text>
              <View style={styles.itemboxImgbox}>
                <Image 
                  source={require('../assets/images/img_sub_guide_view1.png')} 
                  style={styles.itemboxImg}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.itemboxDl}>
                <Text style={styles.dlDt}>대출 규모</Text>
                <Text style={styles.dlDd}>총 사업비의 <Text style={styles.colorBlue}>50~90%</Text></Text>
              </View>
              <View style={styles.itemboxDl}>
                <Text style={styles.dlDt}>상환 기간</Text>
                <Text style={styles.dlDd}>3~10개월</Text>
              </View>
              <View style={styles.itemboxDl}>
                <Text style={styles.dlDt}>이자율</Text>
                <Text style={styles.dlDd}><Text style={styles.colorBlue}>8~13%</Text> 이자율(년)</Text>
              </View>
            </View>
          </View>

          {/* 장기 운영자금 대출 */}
          <View style={styles.itembox}>
            <View style={[styles.itemboxTit, styles.bgMint]}>
              <Text style={styles.itemboxTitText}>장기 운영자금 대출</Text>
            </View>
            <View style={styles.itemboxCon}>
              <Text style={styles.itemboxTxt}>
                <Text style={styles.strong}>운영 중인 발전소</Text>를 담보로 <Text style={styles.strong}>운영자금</Text>을 제공합니다.{'\n'}
                발전소 가치를 평가하여 자금이 지급되고,{'\n'}
                발전소 매출로 상환합니다.
              </Text>
              <View style={styles.itemboxImgbox}>
                <Image 
                  source={require('../assets/images/img_sub_guide_view2.png')} 
                  style={styles.itemboxImg}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.itemboxDl}>
                <Text style={styles.dlDt}>대출 규모</Text>
                <Text style={styles.dlDd}>총 사업비의 <Text style={styles.colorMint}>50~90%</Text></Text>
              </View>
              <View style={styles.itemboxDl}>
                <Text style={styles.dlDt}>상환 기간</Text>
                <Text style={styles.dlDd}>최대 25년</Text>
              </View>
              <View style={styles.itemboxDl}>
                <Text style={styles.dlDt}>이자율</Text>
                <Text style={styles.dlDd}><Text style={styles.colorMint}>6~10%</Text> 이자율(년)</Text>
              </View>
              <View style={styles.itemboxDl}>
                <Text style={styles.dlDt}>배당</Text>
                <Text style={styles.dlDd}>6~12개월 마다 <Text style={styles.colorMint}>사업주 배당</Text> 가능</Text>
              </View>
              <View style={styles.itemboxDl}>
                <Text style={styles.dlDt}>혜택</Text>
                <Text style={styles.dlDd}>관리운영 서비스 제공</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 절차 가이드 섹션 */}
        <View style={styles.subGuideStep}>
          <Text style={styles.subTitleGuide}>
            상담부터 대출까지{'\n'}복잡한 사업 절차는 걱정하지 마세요
          </Text>
          <View style={styles.guideStep}>
            <View style={styles.guideStepLine} />
            <View style={styles.guideStepItem}>
              <View style={styles.guideStepDot} />
              <View style={styles.guideStepImgbox}>
                <Image 
                  source={require('../assets/images/ico_sub_guide_step01.png')} 
                  style={styles.guideStepImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.guideStepTit}>대출 문의</Text>
              <Text style={styles.guideStepTxt}>온라인으로 대출문의 신청서를 제출합니다.</Text>
            </View>
            <View style={styles.guideStepItem}>
              <View style={styles.guideStepDot} />
              <View style={styles.guideStepImgbox}>
                <Image 
                  source={require('../assets/images/ico_sub_guide_step02.png')} 
                  style={styles.guideStepImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.guideStepTit}>대출 심사 및 약정</Text>
              <Text style={styles.guideStepTxt}>서류 심사 후, 필요시 현장 및 기술실사를 거쳐서{'\n'}최종 대출 약정이 이루어집니다.</Text>
            </View>
            <View style={styles.guideStepItem}>
              <View style={styles.guideStepDot} />
              <View style={styles.guideStepImgbox}>
                <Image 
                  source={require('../assets/images/ico_sub_guide_step03.png')} 
                  style={styles.guideStepImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.guideStepTit}>투자금 모금</Text>
              <Text style={styles.guideStepTxt}>다수의 투자자(개인/법인)로부터{'\n'}투자금이 모급됩니다. (지역 우대금리)</Text>
            </View>
            <View style={[styles.guideStepItem, styles.guideStepItemLast]}>
              <View style={styles.guideStepDot} />
              <View style={styles.guideStepLastLine} />
              <View style={styles.guideStepImgbox}>
                <Image 
                  source={require('../assets/images/ico_sub_guide_step04.png')} 
                  style={styles.guideStepImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.guideStepTit}>대출 실행</Text>
              <Text style={styles.guideStepTxt}>대출금은 시공 단계별로 지정된 기자재 공금사{'\n'}토지주, 혹은 시공사에 직접 입금됩니다.</Text>
            </View>
          </View>
        </View>

        {/* 하단 이미지 섹션 */}
        <ImageBackground 
          source={require('../assets/images/img_corp_guide.png')} 
          style={styles.subCorpImgbox}
          resizeMode="cover"
        >
          <View style={styles.corpTxtbox}>
            <Text style={styles.corpTit}>시작부터 끝까지{'\n'}함께 합니다</Text>
            <Text style={styles.corpTxt}>신청서를 작성하시면 세부 내용에 대한 설명과{'\n'}더불어 모든 절차를 도와드립니다</Text>
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
  // 비주얼 섹션
  subVisual: {
    backgroundColor: '#fff',
  },
  visualTxtbox: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    backgroundColor: 'rgba(211, 225, 245, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  tagText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2c3db8',
    fontWeight: '600',
  },
  title: {
    marginTop: 16,
    fontSize: 26,
    lineHeight: 36,
    fontWeight: '700',
    textAlign: 'center',
    color: '#222',
  },
  titleP: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'center',
    color: '#666',
  },
  visualBanner: {
    marginTop: 24,
    width: SCREEN_WIDTH - 40,
  },
  visualBannerImg: {
    width: '100%',
    height: 150,
  },
  // 연결 가이드 섹션
  subGuideConnection: {
    paddingTop: 50,
    paddingBottom: 30,
    backgroundColor: '#fff',
  },
  subTitleGuide: {
    fontSize: 24,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
    color: '#222',
  },
  connectionImgbox: {
    marginTop: 40,
    paddingHorizontal: 50,
    paddingRight: 17,
    paddingBottom: 48,
  },
  connectionImg: {
    width: '100%',
    height: 200,
  },
  // 좋은 이유 섹션
  subGuideReason: {
    paddingBottom: 30,
    backgroundColor: '#fff',
  },
  subTitlePGuide: {
    marginTop: 16,
    paddingHorizontal: 20,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'center',
    color: '#666',
  },
  reasonList: {
    marginTop: 36,
    marginHorizontal: 20,
  },
  reasonItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(235, 243, 254, 0.7)',
    marginBottom: 9,
    alignSelf: 'flex-start',
  },
  reasonText: {
    fontSize: 15,
    lineHeight: 19,
    color: '#222',
  },
  reasonImgbox: {
    marginTop: 23,
    alignItems: 'flex-end',
  },
  reasonImg: {
    width: 239,
    height: 200,
  },
  // 대출 선택 섹션
  subGuideView: {
    paddingTop: 50,
    paddingBottom: 30,
    backgroundColor: '#f6f6f6',
  },
  viewTitle: {
    marginTop: 40,
    marginHorizontal: 20,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: '#222',
  },
  condition: {
    flexDirection: 'row',
    marginTop: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#516c89',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  conditionItem: {
    flex: 1,
    paddingVertical: 22,
    paddingBottom: 20,
    alignItems: 'center',
  },
  conditionDivider: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 32,
    height: 32,
    marginTop: -16,
    marginLeft: -16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e1e2',
  },
  conditionImgbox: {
    width: 56,
    height: 52,
  },
  conditionImg: {
    width: '100%',
    height: '100%',
  },
  conditionTit: {
    marginTop: 12,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    textAlign: 'center',
    color: '#222',
  },
  conditionTxt: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400',
    textAlign: 'center',
    color: '#666',
  },
  itembox: {
    marginTop: 30,
    marginHorizontal: 16,
  },
  itemboxTit: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#222',
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgBlue: {
    backgroundColor: '#2c3db8',
  },
  bgMint: {
    backgroundColor: '#2ebab4',
  },
  itemboxTitText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: '#fff',
  },
  itemboxCon: {
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#e0e1e2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 1,
  },
  itemboxTxt: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    textAlign: 'center',
    color: '#222',
  },
  strong: {
    fontWeight: '700',
  },
  itemboxImgbox: {
    width: 196,
    marginHorizontal: 'auto',
    marginTop: 20,
    marginBottom: 30,
    alignSelf: 'center',
  },
  itemboxImg: {
    width: '100%',
    height: 150,
  },
  itemboxDl: {
    flexDirection: 'row',
    marginTop: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    shadowColor: '#516c89',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dlDt: {
    width: 74,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
    color: '#666',
  },
  dlDd: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#222',
  },
  colorBlue: {
    color: '#2c3db8',
  },
  colorMint: {
    color: '#2ebab4',
  },
  // 절차 가이드 섹션
  subGuideStep: {
    paddingTop: 50,
    paddingBottom: 30,
    backgroundColor: '#fff',
  },
  guideStep: {
    position: 'relative',
    marginTop: 36,
    marginHorizontal: 30,
  },
  guideStepLine: {
    position: 'absolute',
    top: 11,
    bottom: 11,
    left: 5,
    width: 1,
    backgroundColor: '#2c3db8',
    opacity: 0.4,
  },
  guideStepItem: {
    position: 'relative',
    paddingLeft: 28,
    marginBottom: 48,
  },
  guideStepItemLast: {
    marginBottom: 0,
  },
  guideStepDot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 11,
    height: 11,
    borderRadius: 11,
    backgroundColor: '#2c3db8',
    shadowColor: '#2c3db8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  guideStepLastLine: {
    position: 'absolute',
    top: 5,
    bottom: 0,
    left: 0,
    width: 11,
    backgroundColor: '#f5f7fa',
  },
  guideStepImgbox: {
    marginTop: -20,
  },
  guideStepImg: {
    width: 47,
    height: 52,
  },
  guideStepTit: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#222',
  },
  guideStepTxt: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    color: '#666',
  },
  // 하단 이미지 섹션
  subCorpImgbox: {
    minHeight: 390,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  corpTxtbox: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  corpTit: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  corpTxt: {
    fontSize: 15,
    lineHeight: 22,
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
    fontWeight: '700',
    color: '#fff',
  },
});

export default LoanScreen;

