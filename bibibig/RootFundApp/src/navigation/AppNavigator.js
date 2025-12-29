import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Linking, ActivityIndicator, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header, { HEADER_HEIGHT } from '../components/Header';
import LoginScreen from '../screens/LoginScreen';
import WithdrawalLoginScreen from '../screens/WithdrawalLoginScreen';
import MainScreen from '../screens/MainScreen';
import MyHomeScreen from '../screens/MyHomeScreen';
import WithdrawalScreen from '../screens/WithdrawalScreen';
import AccountChangeScreen from '../screens/AccountChangeScreen';
import AccountChangeWithHeaderScreen from '../screens/AccountChangeWithHeaderScreen';
import FindEmailScreen from '../screens/FindEmailScreen';
import FindPasswordScreen from '../screens/FindPasswordScreen';
import PhoneAuthScreen from '../screens/PhoneAuthScreen';
import SignUpTypeScreen from '../screens/SignUpTypeScreen';
import SignUpPrivateSelectScreen from '../screens/SignUpPrivateSelectScreen';
import SignUpPrivateScreen from '../screens/SignUpPrivateScreen';
import SignUpPrivateAdultScreen from '../screens/SignUpPrivateAdultScreen';
import SignUpPrivateMinorScreen from '../screens/SignUpPrivateMinorScreen';
import SignUpPrivateForeignerScreen from '../screens/SignUpPrivateForeignerScreen';
import SignUpCorpScreen from '../screens/SignUpCorpScreen';
import SignUpCorpFormScreen from '../screens/SignUpCorpFormScreen';
import CorporateInvestmentScreen from '../screens/CorporateInvestmentScreen';
import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ProductDetailOld1Screen from '../screens/ProductDetailOld1Screen';
import ProductDetailOld2Screen from '../screens/ProductDetailOld2Screen';
import ProductDetailOld3Screen from '../screens/ProductDetailOld3Screen';
import ProductDetailOld4Screen from '../screens/ProductDetailOld4Screen';
import InvestRequestScreen from '../screens/InvestRequestScreen';
import InvestSuccessScreen from '../screens/InvestSuccessScreen';
import WebViewScreen from '../screens/WebViewScreen';
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
import ConsultationRequestScreen from '../screens/ConsultationRequestScreen';
import ConsultationRequestDoneScreen from '../screens/ConsultationRequestDoneScreen';
import NotificationListScreen from '../screens/NotificationListScreen';
import PushTestScreen from '../screens/PushTestScreen';
import LoanRequestScreen from '../screens/LoanRequestScreen';
import LoanRequestDoneScreen from '../screens/LoanRequestDoneScreen';
import BondMarketHowToUseScreen from '../screens/BondMarketHowToUseScreen';
import MemberWithdrawalScreen from '../screens/MemberWithdrawalScreen';
import WithdrawalSurveyScreen from '../screens/WithdrawalSurveyScreen';
import WithdrawalDoneScreen from '../screens/WithdrawalDoneScreen';
import RecruitScreen from '../screens/RecruitScreen';
import TermsScreen from '../screens/TermsScreen';
import InvestReceiptScreen from '../screens/InvestReceiptScreen';
import InvestCertifyScreen from '../screens/InvestCertifyScreen';
import MyCertScreen from '../screens/MyCertScreen';
import InvestCancelScreen from '../screens/InvestCancelScreen';
import InvestCancelDoneScreen from '../screens/InvestCancelDoneScreen';
import NeighborRequestDoneScreen from '../screens/NeighborRequestDoneScreen';
import NeighborStatusScreen from '../screens/NeighborStatusScreen';

const Stack = createStackNavigator();

// Header를 사용하지 않는 화면들 (로그인, 회원가입 등)
const SCREENS_WITHOUT_HEADER = ['WithdrawalLogin', 'Withdrawal', 'AccountChange', 'PhoneAuth'];

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
      InvestSuccess: 'invest-success',
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
      ConsultationRequest: 'consultation-request',
      ConsultationRequestDone: 'consultation-request-done',
      LoanRequest: 'loan-request',
      LoanRequestDone: 'loan-request-done',
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
      // 앱 열리자마자 항상 Main 화면으로
      setInitialRoute('Main');
      setCurrentRoute('Main');
    } catch (error) {
      console.error('로그인 상태 확인 오류:', error);
      setInitialRoute('Main');
      setCurrentRoute('Main');
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
  
  // Back 버튼이 필요한 화면들
  const screensWithBack = ['FindEmail', 'FindPassword', 'SignUpType', 'SignUpPrivateSelect', 'SignUpPrivate', 'SignUpCorp', 'SignUpCorpForm', 'InvestReceipt', 'InvestCertify', 'RepaymentHistory', 'BalanceHistory', 'UpwardRequest', 'ConsultationRequest', 'BondMarketHowToUse', 'MemberWithdrawal', 'WithdrawalSurvey', 'WithdrawalDone', 'Recruit', 'Terms', 'WebView'];
  const shouldShowBack = screensWithBack.includes(currentRoute);

  // Slightly increase offset so screens clear the fixed header/GNB
  const headerOffset = showHeader ? insets.top + HEADER_HEIGHT + 14 : 0;

  return (
    <View style={styles.container}>
      {showHeader && navigationRef.current && (
        <SafeAreaView edges={['left', 'right']} style={styles.headerSafeArea}>
          <Header 
            navigation={navigationRef.current} 
            showBack={shouldShowBack}
            onBackPress={shouldShowBack ? () => navigationRef.current?.goBack() : undefined}
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
          <Stack.Screen name="AccountChangeWithHeader" component={AccountChangeWithHeaderScreen} />
          <Stack.Screen name="FindEmail" component={FindEmailScreen} />
          <Stack.Screen name="FindPassword" component={FindPasswordScreen} />
          <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
          <Stack.Screen name="SignUpType" component={SignUpTypeScreen} />
          <Stack.Screen name="SignUpPrivateSelect" component={SignUpPrivateSelectScreen} />
          <Stack.Screen name="SignUpPrivate" component={SignUpPrivateScreen} />
          <Stack.Screen name="SignUpPrivateAdult" component={SignUpPrivateAdultScreen} />
          <Stack.Screen name="SignUpPrivateMinor" component={SignUpPrivateMinorScreen} />
          <Stack.Screen name="SignUpPrivateForeigner" component={SignUpPrivateForeignerScreen} />
          <Stack.Screen name="SignUpCorp" component={SignUpCorpScreen} />
          <Stack.Screen name="SignUpCorpForm" component={SignUpCorpFormScreen} />
          <Stack.Screen name="CorporateInvestment" component={CorporateInvestmentScreen} />
          <Stack.Screen name="ProductList" component={ProductListScreen} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="ProductDetailOld1" component={ProductDetailOld1Screen} />
          <Stack.Screen name="ProductDetailOld2" component={ProductDetailOld2Screen} />
          <Stack.Screen name="ProductDetailOld3" component={ProductDetailOld3Screen} />
          <Stack.Screen name="ProductDetailOld4" component={ProductDetailOld4Screen} />
          <Stack.Screen name="InvestRequest" component={InvestRequestScreen} />
          <Stack.Screen name="InvestSuccess" component={InvestSuccessScreen} />
          <Stack.Screen name="WebView" component={WebViewScreen} />
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
          <Stack.Screen name="ConsultationRequest" component={ConsultationRequestScreen} />
          <Stack.Screen name="ConsultationRequestDone" component={ConsultationRequestDoneScreen} />
          <Stack.Screen name="NotificationList" component={NotificationListScreen} />
          <Stack.Screen name="PushTest" component={PushTestScreen} />
          <Stack.Screen name="LoanRequest" component={LoanRequestScreen} />
          <Stack.Screen name="LoanRequestDone" component={LoanRequestDoneScreen} />
          <Stack.Screen name="BondMarketHowToUse" component={BondMarketHowToUseScreen} />
          <Stack.Screen name="MemberWithdrawal" component={MemberWithdrawalScreen} />
          <Stack.Screen name="WithdrawalSurvey" component={WithdrawalSurveyScreen} />
          <Stack.Screen name="WithdrawalDone" component={WithdrawalDoneScreen} />
          <Stack.Screen name="Recruit" component={RecruitScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="InvestReceipt" component={InvestReceiptScreen} />
          <Stack.Screen name="InvestCertify" component={InvestCertifyScreen} />
          <Stack.Screen name="MyCert" component={MyCertScreen} />
          <Stack.Screen name="InvestCancel" component={InvestCancelScreen} />
          <Stack.Screen name="InvestCancelDone" component={InvestCancelDoneScreen} />
          <Stack.Screen name="NeighborRequestDone" component={NeighborRequestDoneScreen} />
          <Stack.Screen name="NeighborStatus" component={NeighborStatusScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>

      {/* 채널톡 플로팅 버튼 - 모든 화면에 표시 */}
      <TouchableOpacity
        style={styles.channelTalkButton}
        onPress={() => Linking.openURL('https://rootenergy.channel.io')}
        activeOpacity={0.9}
      >
        <Image
          source={require('../assets/images/1.png')}
          style={styles.channelTalkIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
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
  // ChannelTalk 플로팅 버튼
  channelTalkButton: {
    position: 'absolute',
    right: 30,
    bottom: 30,
    width: 60,
    height: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 9999,
  },
  channelTalkIcon: {
    width: 60,
    height: 60,
  },
});

export default AppNavigator;
