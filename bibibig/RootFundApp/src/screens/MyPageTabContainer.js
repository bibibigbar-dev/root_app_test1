import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
  const [repayCount, setRepayCount] = useState(0);
  const tabScrollViewRef = React.useRef(null);

  // route.params.initialTab이 변경될 때 activeTab 업데이트 및 스크롤
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
      scrollToTab(initialTab);
    }
  }, [initialTab]);

  // 화면이 포커스될 때마다 initialTab 확인
  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.initialTab && route.params.initialTab !== activeTab) {
        setActiveTab(route.params.initialTab);
        scrollToTab(route.params.initialTab);
      }
    }, [route.params?.initialTab])
  );

  // 탭으로 스크롤하는 함수
  const scrollToTab = (tabKey) => {
    const tabs = [
      { key: 'assets', label: '자산관리' },
      { key: 'loan', label: '대출내역' },
      { key: 'invest', label: '투자현황' },
      { key: 'review', label: '투자후기' },
      { key: 'schedule', label: '상환스케줄' },
      { key: 'info', label: '개인정보관리' },
    ];
    
    const tabIndex = tabs.findIndex(tab => tab.key === tabKey);
    if (tabIndex !== -1 && tabScrollViewRef.current) {
      // 마지막 탭이면 끝까지 스크롤
      if (tabIndex === tabs.length - 1) {
        setTimeout(() => {
          tabScrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        // 각 탭의 너비를 대략 120px로 가정
        const tabWidth = 100;
        const scrollPosition = tabIndex * tabWidth;
        
        setTimeout(() => {
          tabScrollViewRef.current?.scrollTo({
            x: scrollPosition,
            animated: true,
          });
        }, 100);
      }
    }
  };

  useEffect(() => {
    loadMemberData();
  }, []);

  const loadMemberData = async () => {
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      
      // 먼저 user 세션에서 기본 정보 설정
      if (user?.session) {
        setMemberData({
          r_name: user.session.r_name || user.name,
          f_member_class_kr: user.session.f_member_class_kr || '개인<br>투자자',
        });
      }
      
      // API로 최신 정보 가져오기
      const response = await ApiService.api.get('/app/my/info', {
        params: { member_id: memberId }
      });
      
      if (response.data && response.data.member) {
        setMemberData(response.data.member);
      }
      
      // repay_count 설정
      if (response.data && response.data.repay_count !== undefined) {
        setRepayCount(response.data.repay_count || 0);
      }
    } catch (error) {
      console.error('회원정보 조회 실패:', error);
      // API 실패해도 user 세션 정보는 유지
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
        return <AssetsContent navigation={navigation} route={route} user={user} member_id={member_id} repay_count={repayCount} />;
      case 'loan':
        return <LoanListContent navigation={navigation} route={route} user={user} member_id={member_id} repay_count={repayCount} />;
      case 'invest':
        return <InvestStatusContent navigation={navigation} route={route} user={user} member_id={member_id} repay_count={repayCount} />;
      case 'review':
        return <InvestReviewContent navigation={navigation} route={route} user={user} member_id={member_id} repay_count={repayCount} />;
      case 'info':
        return <MyPageContent navigation={navigation} route={route} user={user} member_id={member_id} memberData={memberData} repay_count={repayCount} />;
      case 'schedule':
        return <RepaymentScheduleContent navigation={navigation} route={route} user={user} member_id={member_id} repay_count={repayCount} />;
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
      {/* Back 버튼 - 고정 */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image 
            source={require('../assets/images/ico_back.png')} 
            style={styles.backIcon}
          />
        </TouchableOpacity>
      
      <ScrollView style={styles.content}>

        {/* 헤더 */}
        <View style={styles.mypageHead}>
          <View style={styles.txtWelcomeContainer}>
            <Text style={styles.txtWelcome}>
              <Text style={styles.txtWelcomeEm}>
                {memberData?.r_name || user?.session?.r_name || user?.name || '사용자'}님,
              </Text>
              {'\n부자되세요!'}
            </Text>
          </View>
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
          ref={tabScrollViewRef}
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
              <View style={styles.tabItemContent}>
                <Text style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive
                ]}>
                  {tab.label}
                </Text>
                {tab.key === 'schedule' && repayCount > 0 && (
                  <View style={styles.tabCount}>
                    <Text style={styles.tabCountText}>{repayCount}</Text>
                  </View>
                )}
              </View>
              {activeTab === tab.key && (
                <View style={styles.tabActiveBar} />
              )}
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
  backButton: {
    paddingTop: 16,
    paddingLeft: 20,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  mypageHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 106,
    padding: 20,
    position: 'relative',
  },
  txtWelcomeContainer: {
    flex: 1,
    paddingRight: 60,
  },
  txtWelcome: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '500',
    color: '#222',
    flexWrap: 'wrap',
  },
  txtWelcomeEm: {
    fontWeight: '700',
  },
  userType: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 20,
    right: 20,
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
    marginRight: -2,
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
    height: 30,
    marginTop: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  tabItem: {
    paddingTop: 3,
    paddingBottom: 7,
    paddingHorizontal: 12,
    marginRight: 0,
    position: 'relative',
  },
  tabItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  tabItemActive: {
    // active 상태의 하단 바는 View로 추가
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
  tabText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: '#bfc3c7',
  },
  tabTextActive: {
    color: '#2c3db8',
  },
  tabCount: {
    minWidth: 13,
    height: 13,
    paddingHorizontal: 2,
    marginLeft: 1,
    marginBottom: 6,
    borderRadius: 6,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabCountText: {
    color: '#fff',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
    textAlign: 'center',
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

