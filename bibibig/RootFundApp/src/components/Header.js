import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const Header = ({ navigation, user, showBack = false, onBackPress, hideBorder = false }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!user);
  const slideAnim = useRef(new Animated.Value(-1000)).current;

  useEffect(() => {
    if (menuVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -1000,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [menuVisible]);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleLogout = async () => {
    try {
      if (user) {
        await ApiService.logout();
      } else {
        await ApiService.clearLoginData();
      }
      setMenuVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('로그아웃 오류:', error);
      await ApiService.clearLoginData();
      setMenuVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const formatCurrency = (value) => {
    const stringValue = typeof value === 'string' ? value : String(value || '0');
    const numericValue = stringValue.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <SafeAreaView style={styles.headerContainer} edges={hideBorder ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBackPress || (() => navigation.navigate('MyHome'))}
          >
            <Image 
              source={require('../assets/images/ico_my.png')} 
              style={{ width: 24, height: 24 }} 
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.myButton}
            onPress={() => {
              // 마이페이지로 이동 (추후 구현)
              console.log('마이페이지');
            }}
          >
            <Image 
              source={require('../assets/images/ico_my.png')} 
              style={{ width: 24, height: 24 }} 
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.logoContainer}
          onPress={() => navigation.navigate('Main')}
        >
          <Image 
            source={require('../assets/images/rootfund_logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={toggleMenu}
        >
          <Image 
            source={require('../assets/images/ico_menu.png')} 
            style={{ width: 24, height: 24 }} 
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* GNB (하단 네비게이션) */}
      <View style={[styles.gnbBox, hideBorder && styles.noBorder]}>
        <View style={styles.gnb}>
          <TouchableOpacity 
            style={styles.gnbItem}
            onPress={() => {
              // 투자하기 (추후 구현)
              console.log('투자하기');
            }}
          >
            <Text style={styles.gnbText}>투자하기</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.gnbItem}
            onPress={() => {
              // 법인투자 (추후 구현)
              console.log('법인투자');
            }}
          >
            <Text style={styles.gnbText}>법인투자</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.gnbItem}
            onPress={() => {
              // 고객센터 (추후 구현)
              console.log('고객센터');
            }}
          >
            <Text style={styles.gnbText}>고객센터</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 메뉴 모달 */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleMenu}
      >
        <View style={styles.menuWrap}>
          <TouchableOpacity 
            style={styles.menuMask}
            activeOpacity={1}
            onPress={toggleMenu}
          />
          <Animated.View style={[styles.menuCont, { right: slideAnim }]}>
            {/* 메뉴 헤더 */}
            <View style={styles.menuHead}>
              <Text style={styles.welcomeText}>
                환영합니다!{'\n'}
                {user?.session?.r_name || user?.name || '로그인 후 이용해주세요'}
              </Text>
              {user && (
                <View style={styles.userType}>
                  <Text style={styles.userTypeText}>
                    {user.member?.class_kr || '일반'}
                  </Text>
                </View>
              )}
            </View>

            {/* 로그인/계좌 정보 박스 (절대 위치) */}
            {user ? (
              <View style={styles.bankBox}>
                <View style={styles.nameNum}>
                  <Image 
                    source={require('../assets/images/img_bank_nh.png')} 
                    style={styles.bankIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.accountNum}>
                    {user.member?.v_account || '-'}
                  </Text>
                </View>
                <View style={styles.amountBox}>
                  <Text style={styles.amountLabel}>예치금</Text>
                  <Text style={styles.amountValue}>
                    {formatCurrency(user?.session?.balance || '0')}원
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.loginJoin}>
                <TouchableOpacity 
                  style={styles.loginJoinItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('Login');
                  }}
                >
                  <Text style={styles.loginJoinText}>로그인</Text>
                </TouchableOpacity>
                <View style={styles.loginJoinDivider} />
                <TouchableOpacity 
                  style={styles.loginJoinItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('SignUp');
                  }}
                >
                  <Text style={styles.loginJoinText}>회원가입</Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView style={styles.menuInfo}>
              {/* 메인 메뉴 */}
              <View style={styles.menuMain}>
                <TouchableOpacity style={styles.menuMainItem}>
                  <Image 
                    source={require('../assets/images/ico_menu_main01.png')} 
                    style={[styles.menuMainIcon, { tintColor: null }]}
                    resizeMode="contain"
                  />
                  <Text style={styles.menuMainText}>투자현황</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuMainItem}>
                  <Image 
                    source={require('../assets/images/ico_menu_main02.png')} 
                    style={[styles.menuMainIcon, { tintColor: null }]}
                    resizeMode="contain"
                  />
                  <Text style={styles.menuMainText}>마이페이지</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuMainItem}>
                  <Image 
                    source={require('../assets/images/ico_menu_main03.png')} 
                    style={[styles.menuMainIcon, { tintColor: null }]}
                    resizeMode="contain"
                  />
                  <Text style={styles.menuMainText}>프로모션</Text>
                </TouchableOpacity>
              </View>

              {/* 메뉴 리스트 */}
              <View style={styles.menuList}>
                <TouchableOpacity style={styles.menuListItem}>
                  <Image 
                    source={require('../assets/images/ico_menu_list01.png')} 
                    style={styles.menuListIcon} 
                    resizeMode="contain"
                  />
                  <Text style={styles.menuListText}>투자</Text>
                  <Image 
                    source={require('../assets/images/ico_arrow_right_30.png')} 
                    style={styles.menuListArrow} 
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuListItem}>
                  <Image 
                    source={require('../assets/images/ico_menu_list02.png')} 
                    style={styles.menuListIcon} 
                    resizeMode="contain"
                  />
                  <Text style={styles.menuListText}>대출</Text>
                  <Image 
                    source={require('../assets/images/ico_arrow_right_30.png')} 
                    style={styles.menuListArrow} 
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuListItem}>
                  <Image 
                    source={require('../assets/images/ico_menu_list03.png')} 
                    style={styles.menuListIcon} 
                    resizeMode="contain"
                  />
                  <Text style={styles.menuListText}>법인투자안내</Text>
                  <Image 
                    source={require('../assets/images/ico_arrow_right_30.png')} 
                    style={styles.menuListArrow} 
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuListItem}>
                  <Image 
                    source={require('../assets/images/ico_menu_list04.png')} 
                    style={styles.menuListIcon} 
                    resizeMode="contain"
                  />
                  <Text style={styles.menuListText}>회사소개</Text>
                  <Image 
                    source={require('../assets/images/ico_arrow_right_30.png')} 
                    style={styles.menuListArrow} 
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuListItem}>
                  <Image 
                    source={require('../assets/images/ico_menu_list04.png')} 
                    style={styles.menuListIcon} 
                    resizeMode="contain"
                  />
                  <Text style={styles.menuListText}>고객센터</Text>
                  <Image 
                    source={require('../assets/images/ico_arrow_right_30.png')} 
                    style={styles.menuListArrow} 
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuListItem}>
                  <Image 
                    source={require('../assets/images/ico_menu_list05.png')} 
                    style={styles.menuListIcon} 
                    resizeMode="contain"
                  />
                  <Text style={styles.menuListText}>채권거래소</Text>
                  <Image 
                    source={require('../assets/images/ico_arrow_right_30.png')} 
                    style={styles.menuListArrow} 
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuListItem}>
                  <Image 
                    source={require('../assets/images/ico_menu_list06.png')} 
                    style={styles.menuListIcon} 
                    resizeMode="contain"
                  />
                  <Text style={styles.menuListText}>이웃신청 현황</Text>
                  <Image 
                    source={require('../assets/images/ico_arrow_right_30.png')} 
                    style={styles.menuListArrow} 
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuListItem}>
                  <Image 
                    source={require('../assets/images/ico_menu_list08.png')} 
                    style={styles.menuListIcon} 
                    resizeMode="contain"
                  />
                  <Text style={styles.menuListText}>이용방법</Text>
                  <Image 
                    source={require('../assets/images/ico_arrow_right_30.png')} 
                    style={styles.menuListArrow} 
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                {user && (
                  <TouchableOpacity 
                    style={styles.menuListItem}
                    onPress={handleLogout}
                  >
                    <Image 
                      source={require('../assets/images/ico_logout.png')} 
                      style={styles.menuListIcon} 
                      resizeMode="contain"
                    />
                    <Text style={styles.menuListText}>로그아웃</Text>
                    <Image 
                      source={require('../assets/images/ico_arrow_right_30.png')} 
                      style={styles.menuListArrow} 
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  myButton: {
    width: 24,
    height: 24,
    marginRight: 'auto',
  },
  backButton: {
    width: 24,
    height: 24,
    marginRight: 'auto',
  },
  myIcon: {
    width: 24,
    height: 24,
  },
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 142,
    height: 24,
  },
  menuButton: {
    width: 24,
    height: 24,
    marginLeft: 'auto',
  },
  menuIcon: {
    width: 24,
    height: 24,
  },
  gnbBox: {
    backgroundColor: '#FFFFFF',
  },
  gnb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 225, 226, 0.5)',
  },
  gnbItem: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
  },
  gnbText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  menuWrap: {
    flex: 1,
  },
  menuMask: {
    flex: 1,
    backgroundColor: '#222222',
    opacity: 0.7,
  },
  menuCont: {
    position: 'absolute',
    top: 0,
    width: '90%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  menuHead: {
    flex: 0,
    minHeight: 181,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: '#2c3db8',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  userType: {
    width: 47,
    height: 47,
    borderRadius: 47,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userTypeText: {
    color: '#2c3db8',
    fontSize: 12,
    fontWeight: '600',
  },
  menuInfo: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
    paddingTop: 25,
  },
  bankBox: {
    position: 'absolute',
    top: 148,
    left: 20,
    right: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E1E2',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
    elevation: 10,
  },
  nameNum: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bankIcon: {
    width: 24,
    height: 15,
    marginRight: 8,
  },
  accountNum: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F8FAFF',
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '400',
  },
  amountValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  loginJoin: {
    position: 'absolute',
    top: 148,
    left: 20,
    right: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E0E1E2',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
    elevation: 10,
  },
  loginJoinItem: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  loginJoinDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E1E2',
    alignSelf: 'center',
  },
  loginJoinText: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 50,
    paddingTop: 20,
    paddingBottom: 15,
  },
  menuMainItem: {
    alignItems: 'center',
  },
  menuMainIcon: {
    width: 35,
    height: 35,
  },
  menuMainText: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
    color: '#333333',
  },
  menuList: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopWidth: 8,
    borderTopColor: '#F5F7FA',
  },
  menuListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#F6F6F6',
  },
  menuListIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    tintColor: '#666666',
  },
  menuListText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  menuListArrow: {
    width: 14,
    height: 14,
    position: 'absolute',
    right: 4,
  },
});

export default Header;

