import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Header from '../components/Header';

const RecruitScreen = ({ navigation, route }) => {
  const { user } = route.params || {};
  const [loading, setLoading] = useState(true);

  const RECRUIT_URL = 'https://m.saramin.co.kr/job-search/company-info-view/recruit?csn=aHRlWU5XWXFDRi9rbml6THFwWm1HZz09';

  return (
    <View style={styles.container}>
      <Header navigation={navigation} user={user} />
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
        <Text style={styles.headTitle}>채용</Text>
      </View>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3db8" />
        </View>
      )}
      <WebView
        source={{ uri: RECRUIT_URL }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView 오류:', nativeEvent);
          setLoading(false);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
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
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
});

export default RecruitScreen;

