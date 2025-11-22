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
  Clipboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const Header = ({ navigation, user: propUser, showBack = false, onBackPress, hideBorder = false, hideGnb = false }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const slideAnim = useRef(new Animated.Value(-1000)).current;

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // 화면이 포커스될 때마다 사용자 정보 재로드
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

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

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (userData && userToken) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
        console.log('Header - 로그인 정보:', parsedUser);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('사용자 정보 로드 오류:', error);
      setUser(null);
      setIsLoggedIn(false);
    }
  };

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
    <SafeAreaView style={styles.headerContainer} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBackPress || (async () => {
              const loginCheck = await ApiService.checkLoginExpiration();
              if (loginCheck.expired) {
                navigation.navigate('Login');
              } else {
                const currentUser = await ApiService.getCurrentUser();
                const member_id = currentUser?.session?.member_id || currentUser?.id;
                // 현재 라우트 확인
                const state = navigation.getState();
                const currentRoute = state?.routes[state?.index];
                
                if (currentRoute?.name === 'MyPage') {
                  // 이미 MyPage에 있으면 파라미터만 업데이트
                  navigation.setParams({ user: currentUser, member_id, initialTab: 'assets' });
                } else {
                  // 다른 화면에 있으면 네비게이션
                  navigation.navigate('MyPage', { user: currentUser, member_id, initialTab: 'assets' });
                }
              }
            })}
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
            onPress={async () => {
              const loginCheck = await ApiService.checkLoginExpiration();
              if (loginCheck.expired) {
                navigation.navigate('Login');
              } else {
                const currentUser = await ApiService.getCurrentUser();
                const member_id = currentUser?.session?.member_id || currentUser?.id;
                // 현재 라우트 확인
                const state = navigation.getState();
                const currentRoute = state?.routes[state?.index];
                
                if (currentRoute?.name === 'MyPage') {
                  // 이미 MyPage에 있으면 파라미터만 업데이트
                  navigation.setParams({ user: currentUser, member_id, initialTab: 'assets' });
                } else {
                  // 다른 화면에 있으면 네비게이션
                  navigation.navigate('MyPage', { user: currentUser, member_id, initialTab: 'assets' });
                }
              }
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
      {!hideGnb ? (
        <View style={[styles.gnbBox, hideBorder && styles.noBorder]}>
          <View style={styles.gnb}>
            <TouchableOpacity 
              style={styles.gnbItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('ProductList', { user });
              }}
            >
              <Text style={styles.gnbText}>투자하기</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.gnbItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('CorporateInvestment', { user });
              }}
            >
              <Text style={styles.gnbText}>법인투자</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.gnbItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('CustomerService', { user });
              }}
            >
              <Text style={styles.gnbText}>고객센터</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.gnbBox, styles.gnbBoxEmpty]} />
      )}

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
                  <TouchableOpacity 
                    style={styles.tip}
                    onPress={async () => {
                      setMenuVisible(false);
                      const currentUser = await ApiService.getCurrentUser();
                      navigation.navigate('UpwardRequest', { user: currentUser || user });
                    }}
                  >
                    <Text style={styles.tipText}>상향신청</Text>
                  </TouchableOpacity>
                  <Text style={styles.userTypeText}>
                    {user.session?.f_member_class_kr?.replace(/<br\s*\/?>/gi, '\n') || '일반'}
                  </Text>
                </View>
              )}
            </View>

            {/* 로그인/계좌 정보 박스 (절대 위치) */}
            {user ? (
              <View style={styles.bankBox}>
                <Image 
                  source={require('../assets/images/logo_bank_nh.png')} 
                  style={styles.bankIcon}
                  resizeMode="contain"
                />
                <View style={styles.nameNum}>
                  <Text style={styles.accountNum}>
                    {user.session?.v_account || '-'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => {
                      const account = user.session?.v_account || '';
                      if (account && account !== '-') {
                        Clipboard.setString(account);
                        Alert.alert('알림', '가상계좌가 복사되었습니다.');
                      }
                    }}
                  >
                    <Image 
                      source={require('../assets/images/ico_copy.png')} 
                      style={styles.copyIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
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
                  <View style={styles.signupTip}>
                    <Text style={styles.signupTipText}>지속가능한 친환경 투자 시작하기</Text>
                    <View style={styles.signupTipArrow} />
                  </View>
                  <Text style={styles.loginJoinText}>회원가입</Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView style={styles.menuInfo}>
              {/* 메인 메뉴 */}
              <View style={[styles.menuMain, user && styles.menuMainWithBankBox]}>
                <TouchableOpacity 
                  style={styles.menuMainItem}
                  onPress={async () => {
                    setMenuVisible(false);
                    const loginCheck = await ApiService.checkLoginExpiration();
                    if (loginCheck.expired) {
                      navigation.navigate('Login');
                    } else {
                      const currentUser = await ApiService.getCurrentUser();
                      const member_id = currentUser?.session?.member_id || currentUser?.id;
                      // 현재 라우트 확인
                      const state = navigation.getState();
                      const currentRoute = state?.routes[state?.index];
                      
                      if (currentRoute?.name === 'MyPage') {
                        // 이미 MyPage에 있으면 파라미터만 업데이트
                        navigation.setParams({ user: currentUser, member_id, initialTab: 'invest' });
                      } else {
                        // 다른 화면에 있으면 네비게이션
                        navigation.navigate('MyPage', { user: currentUser, member_id, initialTab: 'invest' });
                      }
                    }
                  }}
                >
                  <Image 
                    source={require('../assets/images/ico_menu_main01.png')} 
                    style={[styles.menuMainIcon, { tintColor: null }]}
                    resizeMode="contain"
                  />
                  <Text style={styles.menuMainText}>투자현황</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.menuMainItem}
                  onPress={() => {
                    setMenuVisible(false);
                    const member_id = user?.session?.member_id || user?.id;
                    navigation.navigate('MyPage', { user, member_id });
                  }}
                >
                  <Image 
                    source={require('../assets/images/ico_menu_main02.png')} 
                    style={[styles.menuMainIcon, { tintColor: null }]}
                    resizeMode="contain"
                  />
                  <Text style={styles.menuMainText}>마이페이지</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.menuMainItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('Promotion', { user });
                  }}
                >
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
                <TouchableOpacity 
                  style={styles.menuListItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('Loan', { user });
                  }}
                >
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
                <TouchableOpacity 
                  style={styles.menuListItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('CorporateInvestment', { user });
                  }}
                >
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
                <TouchableOpacity 
                  style={styles.menuListItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('CompanyIntro');
                  }}
                >
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
                <TouchableOpacity 
                  style={styles.menuListItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('CustomerService', { user });
                  }}
                >
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
                <TouchableOpacity 
                  style={styles.menuListItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('BondMarket', { user });
                  }}
                >
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
                <TouchableOpacity 
                  style={styles.menuListItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('NeighborRequest', { user });
                  }}
                >
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
                <TouchableOpacity 
                  style={styles.menuListItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('HowToUse');
                  }}
                >
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
  gnbBoxEmpty: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 225, 226, 0.5)',
  },
  gnb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
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
    fontSize: 16,
    fontWeight: '700',
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
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: 47,
    borderWidth: 1,
    borderColor: '#2c3db8',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  tip: {
    position: 'absolute',
    top: 0,
    right: '100%',
    marginRight: -3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#77abf8',
  },
  tipText: {
    color: '#fff',
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '500',
  },
  userTypeText: {
    color: '#2c3db8',
    fontSize: 12,
    lineHeight: 14.4,
    textAlign: 'center',
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
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  },
  bankIcon: {
    width: 60,
    height: 20,
  },
  accountNum: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  copyButton: {
    padding: 2,
    marginLeft: 8,
  },
  copyIcon: {
    width: 15,
    height: 15,
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
    top: 154,
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
    height: 50,
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
  signupTip: {
    position: 'absolute',
    bottom: 48,
    left: '50%',
    transform: [{ translateX: -70 }],
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 5,
    backgroundColor: '#2ebab4',
  },
  signupTipText: {
    color: '#fff',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  signupTipArrow: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    marginLeft: -5,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2ebab4',
    borderBottomWidth: 0,
  },
  menuMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 50,
    paddingTop: 20,
    paddingBottom: 15,
  },
  menuMainWithBankBox: {
    paddingTop: 60,
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

