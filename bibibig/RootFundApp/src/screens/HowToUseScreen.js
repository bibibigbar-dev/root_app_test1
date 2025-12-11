import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  Linking,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HowToUseScreen = ({ navigation }) => {
  const [expandedFaq, setExpandedFaq] = useState({});

  const toggleFaq = (index) => {
    setExpandedFaq(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleChannelTalk = () => {
    Linking.openURL('https://rootenergy.channel.io');
  };

  const handleKakaoTalk = () => {
    Linking.openURL('https://pf.kakao.com/_CxaYbd');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* 비주얼 헤더 */}
        <View style={styles.subVisual}>
          <View style={styles.visualTxtbox}>
            <Text style={styles.tagBlue}>이용방법</Text>
            <Text style={styles.titleB}>투자 이용안내</Text>
          </View>
        </View>

        {/* 이용방법 스텝 */}
        <View style={styles.subUseWay}>
          <View style={styles.subUseWayStep}>
            {/* Step 01 */}
            <View style={styles.stepItem}>
              <View style={styles.txtbox}>
                <View style={styles.numRow}>
                  <Text style={styles.num}>01</Text>
                  <Text style={styles.tit}>회원가입</Text>
                </View>
                <Text style={styles.txt}>아래 준비물을 확인하고 회원가입을 합니다.</Text>
                <View style={styles.txtList}>
                  <Text style={styles.txtListItem}>• 신분증</Text>
                  <Text style={styles.txtListItem}>• 본인명의 휴대폰</Text>
                  <Text style={styles.txtListItem}>• 본인명의 계좌</Text>
                </View>
                <View style={styles.tipBdBlue}>
                  <View style={styles.tipArrow}>
                    <View style={styles.tipArrowInner} />
                  </View>
                  <Text style={styles.tipText}>
                    <Text style={styles.tipEm}>가입 시 등록한 계좌</Text>를 통해서만 예치금 입금 가능!
                  </Text>
                </View>
              </View>
              <View style={styles.imgbox}>
                <Image source={require('../assets/images/step_1.png')} style={styles.stepImage} resizeMode="contain" />
              </View>
            </View>

            {/* Step 02 */}
            <View style={styles.stepItem}>
              <View style={styles.txtbox}>
                <View style={styles.numRow}>
                  <Text style={styles.num}>02</Text>
                  <Text style={styles.tit}>개인전용 가상계좌번호 확인</Text>
                </View>
                <Text style={styles.txt}>[마이페이지 - 자산관리 - 입출금 관리]에서{'\n'}투자금 입금 계좌를 확인합니다</Text>
                <TouchableOpacity 
                  style={styles.btnStyleGray}
                  onPress={() => navigation.navigate('MyPage', { initialTab: 'assets' })}
                >
                  <Text style={styles.btnTextGray}>가상계좌 확인하러 가기</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.imgbox}>
                <Image source={require('../assets/images/step_2.png')} style={styles.stepImage} resizeMode="contain" />
              </View>
            </View>

            {/* Step 03 */}
            <View style={styles.stepItem}>
              <View style={styles.txtbox}>
                <View style={styles.numRow}>
                  <Text style={styles.num}>03</Text>
                  <Text style={styles.tit}>예치금 입금</Text>
                </View>
                <Text style={styles.txt}>가입 시 등록한 출금 계좌 → 투자금 입금 계좌로{'\n'}예치금을 입금합니다</Text>
              </View>
              <View style={styles.imgbox2}>
                <Image source={require('../assets/images/step_3.png')} style={styles.stepImage} resizeMode="contain" />
              </View>
              <View style={styles.depositPart}>
                <Text style={styles.depositTitle}>입금 불가 안내</Text>
                <View style={styles.noticeList}>
                  <View style={styles.noticeItem}>
                    <Image source={require('../assets/images/one_1.png')} style={styles.noticeImage} resizeMode="contain" />
                    <Text style={styles.noticeText1}>본인명의 타행계좌</Text>
                    <Text style={styles.noticeText2}>본인명의 타행계좌로는{'\n'}입금 불가능</Text>
                  </View>
                  <View style={styles.noticeItem}>
                    <Image source={require('../assets/images/one_2.png')} style={styles.noticeImage} resizeMode="contain" />
                    <Text style={styles.noticeText1}>간편송금</Text>
                    <Text style={styles.noticeText2}>토스, 카카오페이 등{'\n'}간편송금을 통한 입금 불가능</Text>
                  </View>
                  <View style={styles.noticeItem}>
                    <Image source={require('../assets/images/one_3.png')} style={styles.noticeImage} resizeMode="contain" />
                    <Text style={styles.noticeText1}>오픈뱅킹</Text>
                    <Text style={styles.noticeText2}>타행 은행 인터넷 뱅킹 혹은{'\n'}모바일 뱅킹에서{'\n'}오픈뱅킹을 통한 입금 불가능</Text>
                  </View>
                  <View style={styles.noticeItem}>
                    <Image source={require('../assets/images/one_4.png')} style={styles.noticeImage} resizeMode="contain" />
                    <Text style={styles.noticeText1}>은행 방문 이용</Text>
                    <Text style={styles.noticeText2}>등록된 투자금 출금 계좌가{'\n'}농협이 아닌 경우{'\n'}창구, ATM에서 입금 불가능</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Step 04 */}
            <View style={styles.stepItem}>
              <View style={styles.txtbox}>
                <View style={styles.numRow}>
                  <Text style={styles.num}>04</Text>
                  <Text style={styles.tit}>투자하기</Text>
                </View>
                <Text style={styles.txt}>이제 원하는 상품에 마음껏 투자하세요!</Text>
                <TouchableOpacity 
                  style={styles.btnStyleBlue}
                  onPress={() => navigation.navigate('ProductList')}
                >
                  <Text style={styles.btnTextBlue}>지금 바로 투자하기</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.imgbox}>
                <Image source={require('../assets/images/step_4.png')} style={styles.stepImage} resizeMode="contain" />
              </View>
            </View>
          </View>
        </View>

        {/* 비디오 섹션 */}
        <View style={styles.subVedioView}>
          <Text style={styles.vedioTitle}>5분만에 투자 완료!{'\n'}영상으로 쉽게 따라해보세요</Text>
          <TouchableOpacity 
            style={styles.player}
            onPress={() => Linking.openURL('https://www.youtube.com/watch?v=QmXOYE22tyY')}
          >
            <View style={styles.playerPlaceholder}>
              <Text style={styles.playIcon}>▶</Text>
              <Text style={styles.playerText}>투자 이용 안내 영상 보기</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.player}
            onPress={() => Linking.openURL('https://www.youtube.com/watch?v=DvZrDrT_BcI')}
          >
            <View style={styles.playerPlaceholder}>
              <Text style={styles.playIcon}>▶</Text>
              <Text style={styles.playerText}>투자 방법 영상 보기</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* FAQ 섹션 */}
        <View style={styles.subFaqView}>
          <Text style={styles.faqTitle}>대표질문</Text>
          <View style={styles.faqList}>
            <View style={styles.faqItem}>
              <View style={styles.titbox}>
                <Text style={styles.faqTit}>Q. 루트펀드 투자금 입금계좌(가상계좌)는 무엇인가요?</Text>
              </View>
              <View style={styles.conbox}>
                <Text style={styles.faqCon}>
                  루트펀드 투자 과정에서 발생되는 모든 입/출금 거래를 위한 전용 계좌입니다. 루트펀드 가상계좌의 예치금으로 투자를 하고, 원할 때는 본인의 개인 은행 계좌로 출금신청을 할 수 있습니다.
                </Text>
              </View>
            </View>

            <View style={styles.faqItem}>
              <View style={styles.titbox}>
                <Text style={styles.faqTit}>Q. 예치금을 출금하려면 어떻게 해야하나요?</Text>
              </View>
              <View style={styles.conbox}>
                <Text style={styles.faqCon}>
                  로그인 후, 마이페이지 {'>'} 예치금 관리 페이지에서 출금신청 금액을 입력하고 [출금신청하기] 버튼을 누르면, 출금지정계좌로 입금됩니다.
                </Text>
              </View>
            </View>

            <View style={styles.faqItem}>
              <View style={styles.titbox}>
                <Text style={styles.faqTit}>Q. 투자금 출금 시 계좌번호 오류가 떠요</Text>
              </View>
              <View style={styles.conbox}>
                <Text style={styles.faqCon}>
                  신협, 신한은행, 우리은행, 하나은행의 경우 (구)계좌는 이용이 불가능하며 신 계좌번호(신한 110, 우리 1002, 신협 13으로 시작)만 이용 가능 합니다.
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.btnbox}
            onPress={() => {
              navigation.navigate('CustomerService', {
                user: route.params?.user,
                initialTab: 1 // 1: 자주하는질문 탭
              });
            }}
          >
            <Text style={styles.btnboxText}>자주묻는질문 바로가기 {'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* SNS 문의 섹션 */}
        <ImageBackground 
          source={require('../assets/images/img_useway_sns.png')} 
          style={styles.subSnsImgbox}
          resizeMode="cover"
        >
          <View style={styles.snsTxtbox}>
            <Text style={styles.snsTit}>궁금한 점이 있으시면{'\n'}문의주세요!</Text>
            <Text style={styles.snsTxt}>평일 10시~17시 (점심 12시~13시)</Text>
          </View>
          <View style={styles.snsbox}>
            <TouchableOpacity style={styles.snsItem} onPress={handleChannelTalk}>
              <Image source={require('../assets/images/1.png')} style={styles.snsIcon} resizeMode="contain" />
              <Text style={styles.snsTxt2}>채널톡 문의</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.snsItem} onPress={handleKakaoTalk}>
              <Image source={require('../assets/images/2.png')} style={styles.snsIcon} resizeMode="contain" />
              <Text style={styles.snsTxt2}>카카오톡 문의</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </ScrollView>
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
  // 비주얼 헤더
  subVisual: {
    position: 'relative',
    height: 150,
    backgroundColor: '#fff',
  },
  visualTxtbox: {
    position: 'absolute',
    top: 20,
    right: 0,
    bottom: 0,
    left: 0,
    paddingTop: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tagBlue: {
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(211, 225, 245, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    color: '#2c3db8',
    fontSize: 14,
    lineHeight: 30,
    fontWeight: '600',
  },
  titleB: {
    marginTop: 14,
    color: '#393f44',
    fontSize: 26,
    lineHeight: 36.4,
    fontWeight: '700',
    textAlign: 'center',
  },
  // 이용방법 스텝
  subUseWay: {
    backgroundColor: '#fff',
  },
  subUseWayStep: {
    marginTop: 10,
    marginHorizontal: 20,
  },
  stepItem: {
    marginBottom: 52,
  },
  txtbox: {
    flex: 1,
  },
  numRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  num: {
    color: '#2c3db8',
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '700',
  },
  tit: {
    marginLeft: 5,
    color: '#222',
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '700',
  },
  txt: {
    marginTop: 12,
    marginBottom: 13,
    color: '#222',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
  },
  txtList: {
    marginLeft: 7,
  },
  txtListItem: {
    color: '#222',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
    marginTop: 2,
  },
  tipBdBlue: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginTop: 10,
    marginLeft: 22,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#197cff',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  tipArrow: {
    position: 'absolute',
    bottom: '167%',
    left: '13%',
    width: 0,
    height: 0,
    borderLeftWidth: 7.5,
    borderRightWidth: 7.5,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#197cff',
    marginLeft: -6.5,
  },
  tipArrowInner: {
    position: 'absolute',
    bottom: -7,
    left: -5.5,
    width: 0,
    height: 0,
    borderLeftWidth: 5.5,
    borderRightWidth: 5.5,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  tipText: {
    color: '#393f44',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  tipEm: {
    color: '#197cff',
    fontWeight: '600',
  },
  imgbox: {
    marginTop: 30,
    marginLeft: 13,
  },
  imgbox2: {
    marginTop: 30,
    marginLeft: -12,
  },
  stepImage: {
    width: 325,
    height: 270,
  },
  btnStyleGray: {
    marginTop: 5,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  btnTextGray: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  btnStyleBlue: {
    marginTop: 5,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2c3db8',
    borderRadius: 20,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  btnTextBlue: {
    fontSize: 10,
    color: '#2c3db8',
    fontWeight: '500',
  },
  // 입금 불가 안내
  depositPart: {
    padding: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 80, 66, 0.3)',
    backgroundColor: 'rgba(253, 245, 243, 1)',
  },
  depositTitle: {
    color: 'rgba(219, 40, 82, 1)',
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '600',
  },
  noticeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 17,
    marginHorizontal: 12,
    gap: 21,
  },
  noticeItem: {
    width: 130,
    alignItems: 'center',
  },
  noticeImage: {
    width: 97,
    height: 97,
  },
  noticeText1: {
    marginTop: 11,
    color: 'rgba(219, 40, 82, 1)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  noticeText2: {
    marginTop: 7,
    color: 'rgba(102, 102, 102, 1)',
    fontSize: 11,
    lineHeight: 18,
    fontWeight: '400',
    textAlign: 'center',
  },
  // 비디오 섹션
  subVedioView: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: '#fff',
  },
  vedioTitle: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '700',
    color: '#222',
    marginBottom: 20,
    textAlign: 'center',
  },
  player: {
    width: '100%',
    height: 206,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#2c3db8',
  },
  playerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 48,
    color: '#fff',
    marginBottom: 10,
  },
  playerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // FAQ 섹션
  subFaqView: {
    paddingHorizontal: 0,
    paddingVertical: 40,
    backgroundColor: '#f5f7fa',
  },
  faqTitle: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '700',
    color: '#222',
    marginBottom: 20,
    textAlign: 'center',
  },
  faqList: {
    marginBottom: 20,
  },
  faqItem: {
    marginTop: 10,
  },
  titbox: {
    width: '100%',
    height: 65,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'left',
    paddingHorizontal: 20,
  },
  faqTit: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'left',
  },
  conbox: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 17,
  },
  faqCon: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
    color: '#666',
    textAlign: 'left',
  },
  btnbox: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#bfc3c7',
    borderRadius: 20,
    backgroundColor: '#fff',
    alignSelf: 'center',
    minWidth: 204,
  },
  btnboxText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    lineHeight: 19,
  },
  // SNS 섹션
  subSnsImgbox: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingVertical: 40,
    minHeight: 390,
    marginTop: 25,
  },
  snsTxtbox: {
    marginTop: 20,
    alignItems: 'center',
  },
  snsTit: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  snsTxt: {
    marginTop: 25,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '500',
    color: '#fff',
  },
  snsbox: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    gap: 40,
  },
  snsItem: {
    alignItems: 'center',
  },
  snsIcon: {
    width: 60,
    height: 60,
  },
  snsTxt2: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});

export default HowToUseScreen;

