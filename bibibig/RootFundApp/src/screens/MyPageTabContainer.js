import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../components/Header';
import ApiService from '../services/api';
import MyPageContent from './MyPageContent';
import RepaymentScheduleContent from './RepaymentScheduleContent';
import AssetsContent from './AssetsContent';
import InvestReviewContent from './InvestReviewContent';
import InvestStatusContent from './InvestStatusContent';
import LoanListContent from './LoanListContent';

const MyPageTabContainer = ({ navigation, route }) => {
  const { user, member_id, initialTab } = route.params || {};
  const [activeTab, setActiveTab] = useState(initialTab || 'info'); // 'info' 또는 'schedule'
  const [memberData, setMemberData] = useState(null);

  // route.params.initialTab이 변경될 때 activeTab 업데이트
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // 화면이 포커스될 때마다 initialTab 확인
  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.initialTab && route.params.initialTab !== activeTab) {
        setActiveTab(route.params.initialTab);
      }
    }, [route.params?.initialTab])
  );

  useEffect(() => {
    loadMemberData();
  }, []);

  const loadMemberData = async () => {
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      const response = await ApiService.api.get('/app/my/info');
      
      if (response.data && response.data.member) {
        setMemberData(response.data.member);
      }
    } catch (error) {
      console.error('회원정보 조회 실패:', error);
    }
  };

  const tabs = [
    { key: 'assets', label: '자산관리' },
    { key: 'loan', label: '대출내역' },
    { key: 'invest', label: '투자현황' },
    { key: 'review', label: '투자후기' },
    { key: 'schedule', label: '상환스케줄' },
    { key: 'info', label: '개인정보관리' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'assets':
        return <AssetsContent navigation={navigation} route={route} user={user} member_id={member_id} />;
      case 'loan':
        return <LoanListContent navigation={navigation} route={route} user={user} member_id={member_id} />;
      case 'invest':
        return <InvestStatusContent navigation={navigation} route={route} user={user} member_id={member_id} />;
      case 'review':
        return <InvestReviewContent navigation={navigation} route={route} user={user} member_id={member_id} />;
      case 'info':
        return <MyPageContent navigation={navigation} route={route} user={user} member_id={member_id} memberData={memberData} />;
      case 'schedule':
        return <RepaymentScheduleContent navigation={navigation} route={route} user={user} member_id={member_id} />;
      default:
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>준비 중입니다.</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} user={user} />
      
      <ScrollView style={styles.content}>
        {/* 헤더 */}
        <View style={styles.mypageHead}>
          <Text style={styles.txtWelcome}>
            <Text style={styles.txtWelcomeEm}>{memberData?.r_name || user?.name}님</Text>, 부자되세요!
          </Text>
          <View style={styles.userType}>
            <TouchableOpacity 
              style={styles.tip}
              onPress={() => {
                navigation.navigate('UpwardRequest', { user, member_id });
              }}
            >
              <Text style={styles.tipText}>상향신청</Text>
            </TouchableOpacity>
            <Text style={styles.userTypeText}>
              {memberData?.f_member_class_kr?.replace(/<br\s*\/?>/gi, '\n') || '개인\n투자자'}
            </Text>
          </View>
        </View>

        {/* 탭 메뉴 */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabMenu}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabItem,
                activeTab === tab.key && styles.tabItemActive
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 탭 콘텐츠 */}
        {renderContent()}
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
  mypageHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 106,
    padding: 20,
  },
  txtWelcome: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '500',
    color: '#222',
  },
  txtWelcomeEm: {
    fontWeight: '700',
  },
  userType: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: 47,
    height: 47,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2c3db8',
    borderRadius: 47 / 2,
    backgroundColor: '#fff',
  },
  tip: {
    position: 'absolute',
    top: 0,
    right: '100%',
    marginRight: -8,
    paddingHorizontal: 6,
    paddingVertical: 0,
    borderRadius: 8,
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
  tabMenu: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
    paddingHorizontal: 20,
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2c3db8',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#2c3db8',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#a3a7ab',
    fontSize: 14,
  },
});

export default MyPageTabContainer;

