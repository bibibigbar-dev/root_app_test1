import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CorporateInvestmentScreen = ({ navigation, route }) => {
  const { user } = route.params || {};
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleItem = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 상단 비주얼 */}
        <View style={styles.subVisual}>
          <Image 
            source={require('../assets/images/bg_corp_guide.png')} 
            style={styles.visualImage}
            resizeMode="cover"
          />
          <View style={styles.txtbox}>
            <View style={styles.tagWrapper}>
              <Text style={styles.tag}>법인투자</Text>
            </View>
            <Text style={styles.visualTitle}>법인/전문투자자 대상{'\n'}1:1 맞춤형 상담 서비스</Text>
            <Text style={styles.visualSubtitle}>루트펀드에서 편하게{'\n'}상담 받아보세요</Text>
          </View>
        </View>

        {/* 타이틀 */}
        <Text style={styles.subTitleGuide}>
          보다 높은 투자수익률{'\n'}
          <Text style={styles.colorBlue}>#안정적</Text>으로 <Text style={styles.colorBlue}>#중수익</Text>을 얻는{'\n'}
          루트펀드 기후금융 투자
        </Text>

        {/* 그래프 바 */}
        <View style={styles.subGuideGraphBar}>
          <Text style={styles.starNotif}>* 2022년 11월 기준</Text>
          <View style={styles.graphBarVal}>
            <View style={styles.graphBarItem}>
              <View style={[styles.graphVal, { height: 24 }]}>
                <Text style={styles.graphPct}>3%</Text>
              </View>
              <Text style={styles.graphTxt}>한국은행{'\n'}기준금리</Text>
            </View>
            <View style={styles.graphBarItem}>
              <View style={[styles.graphVal, { height: 68 }]}>
                <Text style={styles.graphPct}>5.75%</Text>
              </View>
              <Text style={styles.graphTxt}>저축은행적금{'\n'}12개월</Text>
            </View>
            <View style={styles.graphBarItem}>
              <View style={[styles.graphVal, { height: 46 }]}>
                <Text style={styles.graphPct}>4.14%</Text>
              </View>
              <Text style={styles.graphTxt}>국고채{'\n'}3년</Text>
            </View>
            <View style={styles.graphBarItem}>
              <View style={[styles.graphVal, { height: 62 }]}>
                <Text style={styles.graphPct}>5.58%</Text>
              </View>
              <Text style={styles.graphTxt}>회사채{'\n'}3년</Text>
            </View>
            <View style={styles.graphBarItem}>
              <View style={[styles.graphVal, styles.graphValBlue, { height: 148 }]}>
                <Image 
                  source={require('../assets/images/graph_logo.png')} 
                  style={styles.graphLogo}
                  resizeMode="contain"
                />
                <Text style={[styles.graphPct, styles.graphPctBlue]}>12.5%</Text>
              </View>
              <Text style={[styles.graphTxt, styles.graphTxtBlue]}>루트펀드{'\n'}7개월</Text>
            </View>
          </View>
        </View>

        {/* 그래프 섹션 */}
        <View style={styles.subGuideGraph}>
          <Text style={styles.subTitleGuide}>
            루트펀드 미션에 공감하는{'\n'}
            법인 & 전문투자자 분들 덕분에{'\n'}
            성과를 이룰 수 있었습니다
          </Text>
          <View style={styles.graphBox}>
            <Image 
              source={require('../assets/images/img_graph.png')} 
              style={styles.graphImage}
              resizeMode="contain"
            />
            <View style={styles.accumulateBox}>
              <View style={styles.accumulate}>
                <Text style={styles.accumulateTxt}>법인 누적 투자 금액</Text>
                <Text style={styles.accumulateCnt}>204억 1150만원</Text>
              </View>
            </View>
            
            {/* 하단 정보 박스 - 이미지 내부 */}
            <View style={styles.dlbox}>
              <View style={styles.dlItem}>
                <Text style={styles.dlDt}>화석에너지 대체</Text>
                <Text style={styles.dlDd}>300GWH</Text>
              </View>
              <View style={styles.dlItem}>
                <Text style={styles.dlDt}>대기오염물질</Text>
                <Text style={styles.dlDd}>138t</Text>
              </View>
            </View>
          </View>
        </View>
       

        {/* 투자자격 타이틀 */}
        <Text style={styles.subTitleGuide}>
          투자자격 변경하고{'\n'}
          더 많은 수익을 누려보세요
        </Text>

        {/* 토글 리스트 */}
        <View style={styles.subGuideToggle}>
          {/* 개인소득적격투자자 */}
          <View style={styles.toggleItem}>
            <TouchableOpacity 
              style={[styles.inHead, expandedIndex === 0 && styles.inHeadOn]}
              onPress={() => toggleItem(0)}
            >
              <View style={styles.toggleImgbox}>
                <Image 
                  source={require('../assets/images/ico_corp_guide01.png')} 
                  style={styles.toggleIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.toggleTxtbox}>
                <Text style={styles.toggleTit}>개인소득적격투자자</Text>
                <Text style={styles.toggleTxt}>
                  온투법권 전체 <Text style={styles.toggleEmphasis}>1억원 한도</Text>
                </Text>
              </View>
              <Image 
                source={require('../assets/images/arrow_select.png')} 
                style={[styles.toggleArrow, expandedIndex === 0 && styles.toggleArrowOn]}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {expandedIndex === 0 && (
              <View style={styles.inCont}>
                <Text style={styles.contTit}>자격요건</Text>
                <Text style={styles.contTxt}>
                  <Text style={styles.contStrong}>[필수조건 택 1]</Text>{'\n'}
                  1. 근로소득 1억원 초과{'\n'}
                  2. 사업소득 1억원 초과{'\n'}
                  3. 사업소득과 근로소득 합산 1억원 초과{'\n'}
                  4. 이자,배당 소득 2천만원 초과
                </Text>
                <Text style={styles.contTit}>투자한도</Text>
                <Text style={styles.contTxt}>
                  동일 차입자 기준 : 2천만원{'\n'}
                  온투업권 기준 : 1억원
                </Text>
               <Text style={[styles.contTit, {marginTop: 24}]}>증빙서류</Text>
                <Text style={styles.contTxt}>
                  필수조건 중 해당하는 기준에 맞춰 제출{'\n'}
                  전년도 &lt;근로소득원천징수영수증&gt; 혹은 &lt;소득금액증명원&gt; 중 택 1 (회사 직인 혹은 본인 서명 필수){'\n'}
                  전년도 '종합소득 과세표준 확정신고 및 납부계산서' 전체 페이지 (본인 서명 혹은 날인 필수)
                </Text>
              </View>
            )}
          </View>

          {/* 개인전문투자자 */}
          <View style={styles.toggleItem}>
            <TouchableOpacity 
              style={[styles.inHead, expandedIndex === 1 && styles.inHeadOn]}
              onPress={() => toggleItem(1)}
            >
              <View style={styles.toggleImgbox}>
                <Image 
                  source={require('../assets/images/ico_corp_guide02.png')} 
                  style={styles.toggleIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.toggleTxtbox}>
                <Text style={styles.toggleTit}>개인전문투자자</Text>
                <Text style={styles.toggleTxt}>
                  총 투자 가능한도 <Text style={styles.toggleEmphasis}>무제한</Text>
                </Text>
              </View>
              <Image 
                source={require('../assets/images/arrow_select.png')} 
                style={[styles.toggleArrow, expandedIndex === 1 && styles.toggleArrowOn]}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {expandedIndex === 1 && (
              <View style={styles.inCont}>
                <Text style={styles.contTit}>자격요건</Text>
                <Text style={styles.contTxt}>
                  <Text style={styles.contStrong}>[필수조건]</Text>{'\n'}
                  최근 5년 중 1년 이상의 기간동안{'\n'}
                  금융위원회가 정하여 고시하는 금융투자상품을{'\n'}
                  월말 평균잔고 기준으로{'\n'}
                  5,000만원 이상 보유
                </Text>
                <Text style={styles.contTxt}>
                  <Text style={styles.contStrong}>[선택조건]</Text>{'\n'}
                  세 가지 중 한 가지 충족 시{'\n'}
                  1. 본인의 연 소득 1억원 또는 배우자와의 연 소득{'\n'}
                  합계가 1억 5,000만원 이상{'\n'}
                  2. 거주 부동산, 임차보증금 및 총부채 금액을{'\n'}
                  차감한 총 자산이 5억원 이상{'\n'}
                  3. 금융 관련 전문가(1년 이상 종사)
                </Text>
                <Text style={styles.contTit}>투자한도</Text>
                <Text style={styles.contTxt}>
                  총 투자 가능한도 무제한{'\n'}
                  (*단, 연계대출 모집금액의 40% 이내)
                </Text>
                <Text style={styles.contTit}>증빙서류</Text>
                <Text style={styles.contTxt}>금융투자업자의 전문투자자 확인증</Text>
              </View>
            )}
          </View>

          {/* 법인투자자 */}
          <View style={styles.toggleItem}>
            <TouchableOpacity 
              style={[styles.inHead, expandedIndex === 2 && styles.inHeadOn]}
              onPress={() => toggleItem(2)}
            >
              <View style={styles.toggleImgbox}>
                <Image 
                  source={require('../assets/images/ico_corp_guide03.png')} 
                  style={styles.toggleIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.toggleTxtbox}>
                <Text style={styles.toggleTit}>법인투자자</Text>
                <Text style={styles.toggleTxt}>
                  총 투자 가능한도 <Text style={styles.toggleEmphasis}>무제한</Text>
                </Text>
              </View>
              <Image 
                source={require('../assets/images/arrow_select.png')} 
                style={[styles.toggleArrow, expandedIndex === 2 && styles.toggleArrowOn]}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {expandedIndex === 2 && (
              <View style={styles.inCont}>
                <Text style={styles.contTit}>자격요건</Text>
                <Text style={styles.contTxt}>
                  <Text style={styles.contStrong}>[필수조건]</Text>{'\n'}
                  법인 등기 등록이 완료되어 법인등록번호를 발급 받은 법인{'\n'}
                  (법인으로 보는 단체 등은 투자 불가)
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 하단 이미지 박스 */}
        <View style={styles.subCorpImgbox}>
          <Image 
            source={require('../assets/images/img_corp_guide.png')} 
            style={styles.corpImage}
            resizeMode="cover"
          />
          <View style={styles.corpTxtbox}>
            <Text style={styles.corpTit}>시작부터 끝까지{'\n'}함께 합니다</Text>
            <Text style={styles.corpTxt}>
              신청서를 작성하시면 세부 내용에 대한 설명과{'\n'}
              더불어 모든 절차를 도와드립니다
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* 고정 하단 버튼 */}
      <View style={styles.fixBtnWrap}>
        <View style={styles.btnBox}>
          <TouchableOpacity 
            style={styles.btnStyle}
            onPress={() => {
              // 1:1 상담 신청 페이지로 이동
              navigation.navigate('ConsultationRequest', { user });
            }}
          >
            <Text style={styles.btnText}>1:1 상담 신청</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  subVisual: {
    position: 'relative',
    marginTop: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  visualImage: {
    width: '100%',
    height: 460,
  },
  txtbox: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    //bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tagWrapper: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tag: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  visualTitle: {
    marginTop: 16,
    fontSize: 26,
    lineHeight: 36,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  visualSubtitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    fontStyle: 'pretendard-medium',
  },
  subTitleGuide: {
    marginTop: 50,
    marginHorizontal: 20,
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  colorBlue: {
    color: '#2c3db8',
  },
  subGuideGraphBar: {
    position: 'relative',
    marginTop: 70,
    marginHorizontal: 30,
    marginBottom: 56,
    backgroundColor: 'transparent',
  },
  starNotif: {
    position: 'absolute',
    top: 40,
    left: 0,
    fontSize: 12,
    color: '#999',
  },
  graphBarVal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  graphBarItem: {
    width: 54,
    alignItems: 'center',
  },
  graphVal: {
    position: 'relative',
    width: 43,
    marginTop: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#c7e0f5',
  },
  graphPct: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: 4,
    color: '#666',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  graphTxt: {
    marginTop: 8,
    color: '#a3a7ab',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  graphValBlue: {
    backgroundColor: '#2c3db8',
    justifyContent: 'flex-end',
    //paddingBottom: 7,
  },
  graphLogo: {
    width: 40,
    height: 26,
    marginLeft: 2,
    marginBottom: 7,
  },
  graphPctBlue: {
    color: '#2c3db8',
    fontSize: 14,
  },
  graphTxtBlue: {
    color: '#2c3db8',
    fontWeight: '600',
    
  },
  subGuideGraph: {
    backgroundColor: '#fff',
  },
  graphBox: {
    position: 'relative',
    marginTop: 120,
    width: SCREEN_WIDTH,
    marginLeft: 0,
    marginRight: 0,
    overflow: 'visible',
  },
  graphImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH / 1.87,
    resizeMode: 'contain',
    marginBottom: 0,
  },
  accumulateBox: {
    position: 'absolute',
    top: -40,
    left: '50%',
    transform: [{ translateX: -65 }],
  },
  accumulate: {
    position: 'relative',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#2c3db8',
    borderRadius: 15,
    backgroundColor: '#fff',
  },
  accumulateTxt: {
    color: '#2c3db8',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  accumulateCnt: {
    marginTop: 4,
    color: '#2c3db8',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  dlbox: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    right: 0,
    top: 140,
    left: 0,
    paddingRight: 34,
    paddingBottom: 0,
    backgroundColor: 'transparent',
    //zIndex: 10,
  },
  dlItem: {
    marginLeft: 50,
  },
  dlDt: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 15.6,
    fontWeight: '500',
  },
  dlDd: {
    marginTop: 4,
    color: '#fff',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  subGuideToggle: {
    marginTop: 20,
  },
  toggleItem: {
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 225, 226, 0.50)',
    backgroundColor: '#fff',
  },
  inHead: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    padding: 20,
    paddingRight: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 225, 226, 0.50)',
  },
  inHeadOn: {
  },
  toggleImgbox: {
    marginRight: 16,
  },
  toggleIcon: {
    width: 48,
    height: 48,
  },
  toggleTxtbox: {
    flex: 1,
  },
  toggleTit: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
  },
  toggleTxt: {
    marginTop: 6,
    color: '#666',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
  },
  toggleEmphasis: {
    color: '#2c3db8',
  },
  toggleArrow: {
    position: 'absolute',
    top: 35,
    right: 16,
    width: 18,
    height: 18,
  },
  toggleArrowOn: {
    transform: [{ rotate: '180deg' }],
  },
  inCont: {
    paddingTop: 10,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  contTit: {
    marginTop: 24,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  contTxt: {
    marginTop: 12,
    color: '#666',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  contStrong: {
    fontWeight: '600',
  },
  subCorpImgbox: {
    position: 'relative',
    marginTop: 50,
  },
  corpImage: {
    width: '100%',
    height: 400,

  },
  corpTxtbox: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corpTit: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',
    textAlign: 'center',
  },
  corpTxt: {
    marginTop: 16,
    color: '#fff',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
    textAlign: 'center',
  },
  fixBtnWrap: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  btnBox: {
    width: '100%',
  },
  btnStyle: {
    height: 54,
    backgroundColor: '#2c3db8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default CorporateInvestmentScreen;

