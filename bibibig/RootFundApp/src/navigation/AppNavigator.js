import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Linking } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import WithdrawalLoginScreen from '../screens/WithdrawalLoginScreen';
import MainScreen from '../screens/MainScreen';
import MyHomeScreen from '../screens/MyHomeScreen';
import WithdrawalScreen from '../screens/WithdrawalScreen';
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

const Stack = createStackNavigator();

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
  return (
    <NavigationContainer linking={linking} fallback={<></>}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="WithdrawalLogin" component={WithdrawalLoginScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="MyHome" component={MyHomeScreen} />
        <Stack.Screen name="Withdrawal" component={WithdrawalScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
