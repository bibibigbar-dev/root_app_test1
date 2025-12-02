import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import ApiService from '../services/api';

const TERM_TITLES = {
  service: '서비스 이용약관',
  deals: '전자금융거래약관',
  private: '개인정보처리방침',
  credit: '신용정보 활용체계',
  invest: '연계투자계약 약관',
  loan: '연계대출계약 약관',
};

const TermsScreen = ({ navigation, route }) => {
  const { user, service } = route.params || {};
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [termContent, setTermContent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTermData();
  }, [service]);

  const loadTermData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.api.post(`/app/term/${service}`, {});
      
      if (response.data && response.data.rtnvalue === '0' && response.data.term) {
        setTermContent(response.data.term.contents || '');
      } else {
        const errorMsg = response.data?.rtnvalue === '1' ? '서비스 정보가 없습니다.' :
                        response.data?.rtnvalue === '2' ? '잘못된 서비스 값입니다.' :
                        response.data?.rtnvalue === '3' ? '약관 조회에 실패했습니다.' :
                        '약관을 불러올 수 없습니다.';
        setError(errorMsg);
      }
    } catch (error) {
      console.error('약관 조회 실패:', error);
      if (error.response?.status === 404) {
        setError('약관 페이지를 찾을 수 없습니다.');
      } else {
        setError('약관을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const title = TERM_TITLES[service] || '약관';

  return (
    <View style={styles.container}>
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
          <Text style={styles.title}>{title}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2c3db8" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : termContent ? (
          <View style={styles.contentBox}>
            <RenderHTML
              contentWidth={width - 32}
              source={{ html: termContent }}
              baseStyle={styles.htmlContent}
              ignoredDomTags={['o:p', 'font']}
            />
          </View>
        ) : null}
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
    color: '#222',
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
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorContainer: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff5042',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  contentBox: {
    marginTop: 40,
    marginHorizontal: 20,
    marginBottom: 40,
    backgroundColor: '#fff',
    borderTopWidth: 0.1,
    borderTopColor: 'rgba(224, 225, 226, 0.50)',
  },
  htmlContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#222',
  },
});

export default TermsScreen;

