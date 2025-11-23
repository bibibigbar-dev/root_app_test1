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
  Dimensions,
} from 'react-native';
import Header from '../components/Header';
import ApiService from '../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

const PromotionScreen = ({ navigation, route }) => {
  const { user } = route.params || {};
  const [activeTab, setActiveTab] = useState(0); // 0: 진행중, 1: 종료됨
  const [loading, setLoading] = useState(true);
  const [promotionList, setPromotionList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadPromotionData();
  }, [activeTab]);

  const loadPromotionData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 0 ? '/app/board/promotion' : '/app/board/promotionend';
      const response = await ApiService.api.get(endpoint);
      
      if (response.data && response.data.list) {
        setPromotionList(response.data.list);
      } else {
        setPromotionList([]);
      }
    } catch (error) {
      console.error('프로모션 조회 실패:', error);
      setPromotionList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setCurrentPage(currentPage + 1);
  };

  const handlePromotionDetail = (idx) => {
    navigation.navigate('PromotionDetail', { idx });
  };

  const visibleItems = promotionList.slice(0, currentPage * itemsPerPage);
  const totalPages = Math.ceil(promotionList.length / itemsPerPage);

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title="프로모션" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
              onPress={() => {
                setActiveTab(0);
                setCurrentPage(1);
              }}
            >
              <Text style={[styles.tabLink, activeTab === 0 && styles.tabLinkActive]}>
                진행중 프로모션
              </Text>
              {activeTab === 0 && <View style={styles.tabActiveBar} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.tabSlide}
              onPress={() => {
                setActiveTab(1);
                setCurrentPage(1);
              }}
            >
              <Text style={[styles.tabLink, activeTab === 1 && styles.tabLinkActive]}>
                종료된 프로모션
              </Text>
              {activeTab === 1 && <View style={styles.tabActiveBar} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* 로딩 또는 목록 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2c3db8" />
          </View>
        ) : promotionList.length === 0 ? (
          <View style={styles.loadingWrapperPromotion}>
            <Image 
              source={require('../assets/images/loading4.png')}
              style={styles.ico}
              resizeMode="contain"
            />
            <Text style={styles.msg}>
              {activeTab === 0 ? '현재 진행 중인 프로모션이 없습니다.' : '종료된 프로모션이 없습니다.'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.galleryListFull}>
              {visibleItems.map((item, index) => (
                <TouchableOpacity
                  key={item.idx}
                  style={styles.galleryItemFull}
                  onPress={() => handlePromotionDetail(item.idx)}
                >
                  <View style={styles.galleryImgbox}>
                    {item.thumbnail ? (
                      <Image 
                        source={{ uri: item.thumbnail }} 
                        style={styles.galleryImgFull}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.galleryImgPlaceholder} />
                    )}
                    {item.dday !== undefined && item.dday !== null && (
                      <View style={styles.dDay}>
                        <Text style={styles.dDayText}>D-{item.dday}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.galleryTxtbox}>
                    <Text style={styles.galleryTitFull} numberOfLines={2}>{item.subject}</Text>
                    <Text style={styles.galleryDate}>{item.start_date} - {item.end_date}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* 더보기 버튼 */}
            {currentPage < totalPages && (
              <View style={styles.listMore}>
                <TouchableOpacity style={styles.moreButton} onPress={handleLoadMore}>
                  <Text style={styles.moreButtonText}>더보기</Text>
                  <Text style={styles.moreButtonCurrent}>{currentPage}/{totalPages}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
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
  tabLinkActive: {
    color: '#2c3db8',
  },
  tabActiveBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 3,
    borderRadius: 3,
    backgroundColor: '#2c3db8',
  },
  loadingContainer: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  loadingWrapperPromotion: {
    marginTop: 60,
    marginBottom: 40,
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  ico: {
    width: 40,
    height: 40,
  },
  msg: {
    marginTop: 16,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#222',
  },
  galleryListFull: {
    paddingHorizontal: 8,
    marginBottom: 40,
  },
  galleryItemFull: {
    width: '100%',
    marginTop: 30,
    paddingHorizontal: 8,
    marginBottom: -4,
  },
  galleryImgbox: {
    position: 'relative',
    width: '100%',
  },
  galleryImgFull: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  galleryImgPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#e0e1e2',
  },
  dDay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 33,
    height: 33,
    borderRadius: 16.5,
    backgroundColor: 'rgba(34, 34, 34, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dDayText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: '#fff',
  },
  galleryTxtbox: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  galleryTitFull: {
    marginTop: 4,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    color: '#222',
  },
  galleryDate: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: '#bfc3c7',
  },
  listMore: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  moreButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    backgroundColor: '#fff',
  },
  moreButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#222',
    marginRight: 8,
  },
  moreButtonCurrent: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: '#666',
  },
});

export default PromotionScreen;

