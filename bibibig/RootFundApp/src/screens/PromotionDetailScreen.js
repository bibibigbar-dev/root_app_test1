import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import Header from '../components/Header';
import ApiService from '../services/api';

const PromotionDetailScreen = ({ navigation, route }) => {
  const { idx } = route.params || {};
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [promotionData, setPromotionData] = useState(null);

  useEffect(() => {
    loadPromotionDetail();
  }, []);

  const loadPromotionDetail = async () => {
    setLoading(true);
    try {
      const response = await ApiService.api.get(`/app/board/promotion/${idx}`);
      
      if (response.data && response.data.dto) {
        setPromotionData(response.data.dto);
      }
    } catch (error) {
      console.error('프로모션 상세 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title="프로모션" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3db8" />
        </View>
      </View>
    );
  }

  if (!promotionData) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title="프로모션" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>프로모션 정보를 불러올 수 없습니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title="프로모션" />
      
      <ScrollView style={styles.content}>
        {/* 헤더 */}
        <View style={styles.subHead}>
          <ImageBackground 
            source={require('../assets/images/bg_sub_promotion.png')}
            style={styles.bgbox}
            resizeMode="cover"
          >
            <Text style={styles.headTitle}>프로모션</Text>
          </ImageBackground>
        </View>

        {/* 탭 메뉴 */}
        <View style={styles.tabSwiper}>
          <View style={styles.tabSwiperWrapper}>
            <TouchableOpacity 
              style={styles.tabSlide}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.tabLink}>진행중 프로모션</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.tabSlide}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.tabLink}>종료된 프로모션</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 갤러리 뷰 */}
        <View style={styles.galleryView}>
          <View style={styles.inHead}>
            {promotionData.dday !== undefined && promotionData.dday !== null && (
              <Text style={styles.source}>D-{promotionData.dday}</Text>
            )}
            <Text style={styles.tit}>{promotionData.subject}</Text>
            <Text style={styles.date}>
              {promotionData.start_date} - {promotionData.end_date}
            </Text>
            <TouchableOpacity 
              style={styles.btnClose}
              onPress={() => navigation.goBack()}
            >
              <Image 
                source={require('../assets/images/ico_close_gray.png')}
                style={styles.btnCloseIcon}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.inCont}>
            <View style={styles.imgbox}>
              {promotionData.contents && (
                <RenderHTML
                  contentWidth={width - 40}
                  source={{ html: promotionData.contents }}
                  baseStyle={styles.htmlContent}
                />
              )}
            </View>
          </View>
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
  content: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  subHead: {
    position: 'relative',
    marginTop: 0, // -4.8rem
    marginBottom: 16, // 1.6rem
    height: 130, // 더 아래까지 내려오도록 높이 증가
    overflow: 'hidden',
    borderBottomLeftRadius: 20, // 2rem - 하단만 둥글게
    borderBottomRightRadius: 20, // 2rem - 하단만 둥글게
  },
  bgbox: {
    width: '105%',
    height: 130,
    justifyContent: 'flex-end',
    paddingBottom: 20, // 3rem
    paddingLeft: 20, // 2rem
  },
  headTitle: {
    fontSize: 20, // 2rem
    lineHeight: 28, // 1.4 * 20
    fontWeight: '700',
    color: '#fff',
  },
  tabSwiper: {
    height: 30,
    marginTop: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  tabSwiperWrapper: {
    flexDirection: 'row',
  },
  tabSlide: {
    marginRight: 24,
    position: 'relative',
  },
  tabLink: {
    paddingTop: 3,
    paddingBottom: 7,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '600',
    color: '#bfc3c7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  galleryView: {
    marginTop: 30, // 3rem
    backgroundColor: '#fff',
  },
  inHead: {
    position: 'relative',
    paddingTop: 16, // 1.6rem
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 54, // 5.4rem
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 225, 226, 0.5)',
    backgroundColor: '#fff',
  },
  source: {
    display: 'flex',
    color: '#666',
    fontSize: 13, // 1.3rem
    lineHeight: 16.9, // 1.3 * 13
    fontWeight: '400',
  },
  tit: {
    marginTop: 6, // 0.6rem
    fontSize: 18, // 1.8rem
    lineHeight: 23.4, // 1.3 * 18
    fontWeight: '600',
    color: '#222',
  },
  date: {
    marginTop: 6, // 0.6rem
    color: '#bfc3c7',
    fontSize: 12, // 1.2rem
    lineHeight: 15.6, // 1.3 * 12
    fontWeight: '400',
  },
  btnClose: {
    position: 'absolute',
    top: 20, // 2rem
    right: 20, // 2rem
    width: 18, // 1.8rem
    height: 18, // 1.8rem
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCloseIcon: {
    width: 12, // 1.2rem
    height: 12, // 1.2rem
    tintColor: '#666',
  },
  inCont: {
    paddingTop: 30, // 3rem
    paddingBottom: 30,
    paddingHorizontal: 20, // 2rem
    backgroundColor: '#fff',
  },
  imgbox: {
    marginBottom: 24, // 2.4rem
  },
  htmlContent: {
    color: '#666',
    fontSize: 15, // 1.5rem
    lineHeight: 22.5, // 1.5 * 15
  },
});

export default PromotionDetailScreen;

