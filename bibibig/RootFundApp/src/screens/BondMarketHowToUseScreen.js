import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Header from '../components/Header';

const BondMarketHowToUseScreen = ({ navigation, route }) => {
  const { user } = route.params || {};

  return (
    <View style={styles.container}>
      <Header navigation={navigation} user={user} showBack={true} />
      
      <View style={styles.headCon}>
        <TouchableOpacity 
          style={styles.btnBack}
          onPress={() => navigation.goBack()}
        >
          <Image 
            source={require('../assets/images/ico_back.png')} 
            style={styles.backIcon} 
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headTitle}></Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.subTitleBox}>
          <Text style={styles.title}>이용방법 안내</Text>
          <Text style={styles.titleP}>
            원리금수취권 거래는 판매와 구매 서비스로 구분되며,{'\n'}
            <Text style={styles.titlePEm}>판매가 가능한 상품</Text>에 대해서만 판매 신청을 할 수 있습니다.
          </Text>
          <Text style={[styles.titleP, styles.titlePMt10]}>
            구매의 경우 소득적격/전문/법인 투자자는 자유롭게 구매가 가능하나 개인투자자의 경우 <Text style={styles.titlePEm}>2021년 8월 27일 이후 온투법 거래가5회</Text> 이상 있는 경우에만 가능합니다.
          </Text>
        </View>

        <View style={styles.infoUseBox}>
          <Text style={styles.infoUseTit}>판매자</Text>
          <View style={styles.infoUseCon}>
            <Image
              source={require('../assets/images/img_info_use01.png')}
              style={styles.infoUseImg}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.infoUseBox}>
          <Text style={styles.infoUseTit}>구매자</Text>
          <View style={styles.infoUseCon}>
            <Image
              source={require('../assets/images/img_info_use02.png')}
              style={styles.infoUseImg}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={[styles.subTitleBox, styles.subTitleBoxMt36]}>
          <Text style={styles.title}>이용한도 안내</Text>
          <Text style={styles.stitle}>개인 투자자</Text>
          <Text style={styles.titleP}>
            동일 차입자 5백만원 (온투법권 전체 3천만원 한도 포함)
          </Text>
          <Text style={styles.stitle}>전문 투자자</Text>
          <Text style={styles.titleP}>
            제한없음 (상품별 모집금액의 40%)
          </Text>
          <Text style={styles.stitle}>소득적격 투자자</Text>
          <Text style={styles.titleP}>
            동일 차입자 2천만원 (온투법권 전체 1억원 한도 포함)
          </Text>
          <Text style={styles.stitle}>법인 투자자</Text>
          <Text style={[styles.titleP, styles.titlePMb40]}>
            제한없음 (상품별 모집금액의 40%)
          </Text>
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
  btnBack: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headTitle: {
    marginLeft: 12,
    paddingTop: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  subTitleBox: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    color: '#222',
  },
  titleP: {
    width: '100%',
    marginTop: 18,
    color: '#666',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  titlePMt10: {
    marginTop: 10,
  },
  titlePMb40: {
    marginBottom: 40,
  },
  titlePEm: {
    color: '#393f44',
    fontWeight: '600',
  },
  stitle: {
    width: '100%',
    marginTop: 20,
    color: '#393f44',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  subTitleBoxMt36: {
    marginTop: 36,
  },
  infoUseBox: {
    marginTop: 12,
    marginHorizontal: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    paddingBottom: 20,
    borderWidth: 0.5,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    shadowColor: '#516c89',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoUseTit: {
    paddingHorizontal: 8,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: '#222',
  },
  infoUseCon: {
    marginTop: 12,
  },
  infoUseImg: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
  },
});

export default BondMarketHowToUseScreen;


