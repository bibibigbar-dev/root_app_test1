import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Linking, ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header, { HEADER_HEIGHT } from '../components/Header';
import LoginScreen from '../screens/LoginScreen';
import WithdrawalLoginScreen from '../screens/WithdrawalLoginScreen';
import MainScreen from '../screens/MainScreen';
import MyHomeScreen from '../screens/MyHomeScreen';
import WithdrawalScreen from '../screens/WithdrawalScreen';
import AccountChangeScreen from '../screens/AccountChangeScreen';
import FindEmailScreen from '../screens/FindEmailScreen';
import FindPasswordScreen from '../screens/FindPasswordScreen';
import SignUpScreen from '../screens/SignUpScreen';
import CorporateInvestmentScreen from '../screens/CorporateInvestmentScreen';
import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ProductDetailOld1Screen from '../screens/ProductDetailOld1Screen';
import ProductDetailOld2Screen from '../screens/ProductDetailOld2Screen';
import ProductDetailOld3Screen from '../screens/ProductDetailOld3Screen';
import ProductDetailOld4Screen from '../screens/ProductDetailOld4Screen';
import InvestRequestScreen from '../screens/InvestRequestScreen';
import HowToUseScreen from '../screens/HowToUseScreen';
import CompanyIntroScreen from '../screens/CompanyIntroScreen';
import LoanScreen from '../screens/LoanScreen';
import BondMarketScreen from '../screens/BondMarketScreen';
import CustomerServiceScreen from '../screens/CustomerServiceScreen';
import PromotionScreen from '../screens/PromotionScreen';
import PromotionDetailScreen from '../screens/PromotionDetailScreen';
import MyPageTabContainer from '../screens/MyPageTabContainer';
import NeighborRequestScreen from '../screens/NeighborRequestScreen';
import RepaymentHistoryScreen from '../screens/RepaymentHistoryScreen';
import BalanceHistoryScreen from '../screens/BalanceHistoryScreen';
import UpwardRequestScreen from '../screens/UpwardRequestScreen';
import UpwardRequestDoneScreen from '../screens/UpwardRequestDoneScreen';
import BondMarketHowToUseScreen from '../screens/BondMarketHowToUseScreen';
import MemberWithdrawalScreen from '../screens/MemberWithdrawalScreen';
import WithdrawalSurveyScreen from '../screens/WithdrawalSurveyScreen';
import WithdrawalDoneScreen from '../screens/WithdrawalDoneScreen';
import RecruitScreen from '../screens/RecruitScreen';
import TermsScreen from '../screens/TermsScreen';

const Stack = createStackNavigator();

// Header를 사용하지 않는 화면들 (로그인, 회원가입 등)
const SCREENS_WITHOUT_HEADER = ['Login', 'WithdrawalLogin', 'FindEmail', 'FindPassword', 'SignUp', 'Withdrawal', 'AccountChange'];

// 딥링크 설정
const linking = {
  prefixes: ['rootfund://', 'https://rootenergy.co.kr', 'http://rootenergy.co.kr'],
  config: {
    screens: {
      Login: 'login',
      WithdrawalLogin: 'withdrawal-login',
      Main: 'main',
      Withdrawal: 'withdrawal',
      MyHome: 'myhome',
      FindEmail: 'find-email',
      FindPassword: 'find-password',
      SignUp: 'signup',
      CorporateInvestment: 'corporate-investment',
      ProductList: 'products',
      ProductDetail: 'product/:orderKey',
      InvestRequest: 'invest-request/:orderKey',
      HowToUse: 'how-to-use',
      CompanyIntro: 'company-intro',
      Loan: 'loan',
      BondMarket: 'bond-market',
      CustomerService: 'customer-service',
      Promotion: 'promotion',
      PromotionDetail: 'promotion/:idx',
      MyPage: 'mypage',
      NeighborRequest: 'neighbor-request',
      RepaymentHistory: 'repayment-history',
      BalanceHistory: 'balance-history',
      UpwardRequest: 'upward-request',
      UpwardRequestDone: 'upward-request-done',
      BondMarketHowToUse: 'bond-market-how-to-use',
    },
  },
};

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState(null);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const navigationRef = useNavigationContainerRef();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (userData && userToken) {
        // 로그인되어 있으면 Main으로
        setInitialRoute('Main');
        setCurrentRoute('Main');
      } else {
        // 로그인 안 되어 있으면 Login으로
        setInitialRoute('Login');
        setCurrentRoute('Login');
      }
    } catch (error) {
      console.error('로그인 상태 확인 오류:', error);
      setInitialRoute('Login');
      setCurrentRoute('Login');
    }
  };

  if (!initialRoute) {
    // 로딩 중
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const onNavigationStateChange = (state) => {
    if (state) {
      const route = state.routes[state.index];
      setCurrentRoute(route.name);
    }
  };

  const onNavigationReady = () => {
    setIsNavigationReady(true);
    // 초기 라우트 설정
    if (navigationRef.current) {
      const state = navigationRef.current.getRootState();
      if (state) {
        const route = state.routes[state.index];
        setCurrentRoute(route.name);
      }
    }
  };

  const showHeader = currentRoute && !SCREENS_WITHOUT_HEADER.includes(currentRoute) && isNavigationReady;
  const isPromotionScreen = currentRoute === 'Promotion';

  // Slightly increase offset so screens clear the fixed header/GNB
  const headerOffset = showHeader ? insets.top + HEADER_HEIGHT + 14 : 0;

  return (
    <View style={styles.container}>
      {showHeader && navigationRef.current && (
        <SafeAreaView edges={['left', 'right']} style={styles.headerSafeArea}>
          <Header 
            navigation={navigationRef.current} 
            showBack={false}
            hideBorder={false}
            hideGnb={false}
          />
        </SafeAreaView>
      )}
      <View style={[styles.contentContainer, { paddingTop: headerOffset }]}>
        <NavigationContainer 
          ref={navigationRef}
          linking={linking} 
          fallback={<></>}
          onReady={onNavigationReady}
          onStateChange={onNavigationStateChange}
        >
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
              animationEnabled: false,
              cardStyleInterpolator: CardStyleInterpolators.forNoAnimation,
              transitionSpec: {
                open: { animation: 'timing', config: { duration: 0 } },
                close: { animation: 'timing', config: { duration: 0 } },
              },
            }}
          >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="WithdrawalLogin" component={WithdrawalLoginScreen} />
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Screen name="MyHome" component={MyHomeScreen} />
          <Stack.Screen name="Withdrawal" component={WithdrawalScreen} />
          <Stack.Screen name="AccountChange" component={AccountChangeScreen} />
          <Stack.Screen name="FindEmail" component={FindEmailScreen} />
          <Stack.Screen name="FindPassword" component={FindPasswordScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="CorporateInvestment" component={CorporateInvestmentScreen} />
          <Stack.Screen name="ProductList" component={ProductListScreen} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="ProductDetailOld1" component={ProductDetailOld1Screen} />
          <Stack.Screen name="ProductDetailOld2" component={ProductDetailOld2Screen} />
          <Stack.Screen name="ProductDetailOld3" component={ProductDetailOld3Screen} />
          <Stack.Screen name="ProductDetailOld4" component={ProductDetailOld4Screen} />
          <Stack.Screen name="InvestRequest" component={InvestRequestScreen} />
          <Stack.Screen name="HowToUse" component={HowToUseScreen} />
          <Stack.Screen name="CompanyIntro" component={CompanyIntroScreen} />
          <Stack.Screen name="Loan" component={LoanScreen} />
          <Stack.Screen name="BondMarket" component={BondMarketScreen} />
          <Stack.Screen name="CustomerService" component={CustomerServiceScreen} />
          <Stack.Screen name="Promotion" component={PromotionScreen} />
          <Stack.Screen name="PromotionDetail" component={PromotionDetailScreen} />
          <Stack.Screen name="MyPage" component={MyPageTabContainer} />
          <Stack.Screen name="NeighborRequest" component={NeighborRequestScreen} />
          <Stack.Screen name="RepaymentHistory" component={RepaymentHistoryScreen} />
          <Stack.Screen name="BalanceHistory" component={BalanceHistoryScreen} />
          <Stack.Screen name="UpwardRequest" component={UpwardRequestScreen} />
          <Stack.Screen name="UpwardRequestDone" component={UpwardRequestDoneScreen} />
          <Stack.Screen name="BondMarketHowToUse" component={BondMarketHowToUseScreen} />
          <Stack.Screen name="MemberWithdrawal" component={MemberWithdrawalScreen} />
          <Stack.Screen name="WithdrawalSurvey" component={WithdrawalSurveyScreen} />
          <Stack.Screen name="WithdrawalDone" component={WithdrawalDoneScreen} />
          <Stack.Screen name="Recruit" component={RecruitScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
  },
});

export default AppNavigator;
