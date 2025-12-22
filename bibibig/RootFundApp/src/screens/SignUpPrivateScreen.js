import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useWindowDimensions } from 'react-native';
import ApiService from '../services/api';
import AppModal from '../components/AppModal';

const SignUpPrivateScreen = ({ route, navigation }) => {
  const { joinType } = route.params || { joinType: 'adult' };
  const { width } = useWindowDimensions();

  const [checkAll, setCheckAll] = useState(false);
  const [checks, setChecks] = useState({
    service: false,
    privacy: false,
    p2p: false,
    bank: false,
    marketing: false,
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsLoading, setTermsLoading] = useState(true);
  const [termsData, setTermsData] = useState(null);

  // 모달 상태
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showP2PModal, setShowP2PModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);

  useEffect(() => {
    loadTermsData();
  }, []);

  const loadTermsData = async () => {
    try {
      setTermsLoading(true);
      const response = await ApiService.api.get('/app/join/private', {
        params: {
          f_joinType: joinType,
          kakaoCi: '0',
        },
      });

      if (response.data.status === 'success') {
        setTermsData(response.data);
      }
    } catch (error) {
      console.error('Failed to load terms data:', error);
    } finally {
      setTermsLoading(false);
    }
  };

  const handleCheckAll = () => {
    const newValue = !checkAll;
    setCheckAll(newValue);
    setChecks({
      service: newValue,
      privacy: newValue,
      p2p: newValue,
      bank: newValue,
      marketing: newValue,
    });
    setErrorMsg('');
  };

  const handleCheck = key => {
    const newChecks = { ...checks, [key]: !checks[key] };
    setChecks(newChecks);
    setErrorMsg('');

    // 모든 항목이 체크되었는지 확인
    const allChecked = Object.values(newChecks).every(v => v === true);
    setCheckAll(allChecked);
  };

  const handleNext = async () => {
    if (!checks.service) {
      setErrorMsg('* 서비스 이용약관에 동의하여 주십시오.');
      return;
    }
    if (!checks.privacy) {
      setErrorMsg('* 개인정보처리방침에 동의하여 주십시오.');
      return;
    }
    if (!checks.p2p) {
      setErrorMsg(
        '* 개인(신용)정보 제3자(P2P자금관리) 제공에 동의하여 주십시오.',
      );
      return;
    }
    if (!checks.bank) {
      setErrorMsg(
        '* 개인(신용)정보 제3자(투자금예치은행) 제공에 동의하여 주십시오.',
      );
      return;
    }

    try {
      setLoading(true);
      const marketing = checks.marketing ? 'Y' : 'N';

      // API 호출 - FormData 형식으로 전송
      const formData = new FormData();
      formData.append('marketing', marketing);
      formData.append('f_joinType', joinType);
      formData.append('kakaoCi', '0');

      const response = await ApiService.api.post(
        '/app/join/privateAgree',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data.status === 'success') {
        // joinType에 따라 다른 화면으로 이동
        if (joinType === 'adult') {
          navigation.navigate('SignUpPrivateAdult', {
            ...response.data,
            marketing: marketing,
            f_joinType: joinType,
          });
        } else if (joinType === 'minor') {
          navigation.navigate('SignUpPrivateMinor', {
            ...response.data,
            marketing: marketing,
            f_joinType: joinType,
          });
        } else if (joinType === 'foreigner') {
          navigation.navigate('SignUpPrivateForeigner', {
            ...response.data,
            marketing: marketing,
            f_joinType: joinType,
          });
        }
      } else if (response.data.redirect) {
        navigation.replace(response.data.redirectUrl);
      } else {
        setErrorMsg('* 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Failed to proceed to next step:', error);
      console.error('Error details:', error.response?.data);
      setErrorMsg('* 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const createHtmlContent = htmlContent => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 13px; 
              line-height: 1.5; 
              color: #666; 
              padding: 4px;
              overflow-x: auto;
            }
            p { margin: 8px 0; }
            table { 
              width: auto;
              min-width: 100%;
              border-collapse: collapse; 
              border: 1px solid #e0e1e2; 
              margin: 8px 0;
              display: table;
            }
            th, td { 
              border: 1px solid #e0e1e2; 
              padding: 8px; 
              font-size: 13px;
              white-space: nowrap;
            }
            th { 
              background-color: #f6f6f6; 
              font-weight: 600; 
              color: #393f44;
              text-align: center;
            }
            td { color: #666; }
            strong, b { font-weight: 600; color: #393f44; }
            ul, ol { margin: 8px 0; padding-left: 20px; }
            li { margin: 4px 0; }
            h1 { font-size: 18px; font-weight: 700; margin: 16px 0 8px; color: #222; }
            h2 { font-size: 16px; font-weight: 700; margin: 14px 0 8px; color: #222; }
            h3 { font-size: 15px; font-weight: 600; margin: 12px 0 8px; color: #393f44; }
            h4 { font-size: 14px; font-weight: 600; margin: 10px 0 8px; color: #393f44; }
          </style>
          <script>
            window.onload = function() {
              const height = document.body.scrollHeight;
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: height }));
            };
          </script>
        </head>
        <body>${htmlContent || ''}</body>
      </html>
    `;
  };

  const [webViewHeight, setWebViewHeight] = useState(300);

  const renderModal = (visible, onClose, title, content) => (
    <AppModal
      visible={visible}
      title={title}
      onClose={onClose}
      primaryAction={{ text: '닫기', onPress: onClose }}
    >
      {content && (
        <WebView
          originWhitelist={['*']}
          source={{ html: createHtmlContent(content) }}
          style={[styles.webView, { height: webViewHeight }]}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={true}
          onMessage={event => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'height' && data.height) {
                setWebViewHeight(data.height + 20);
              }
            } catch (e) {
              console.error('WebView message parse error:', e);
            }
          }}
        />
      )}
    </AppModal>
  );

  if (termsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3db8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Image
            source={require('../assets/images/ico_back.png')}
            style={styles.backButtonImage}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.subTitleBox}>
          <Text style={styles.title}>
            회원가입을 위해{'\n'}약관에 동의해 주세요
          </Text>
        </View>

        <View style={styles.termsArea}>
          {/* 전체 동의 */}
          <View style={styles.termsBox}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={handleCheckAll}
            >
              <Image
                source={
                  checkAll
                    ? require('../assets/images/checkbox_on.png')
                    : require('../assets/images/checkbox_off.png')
                }
                style={styles.checkboxImage}
              />
              <Text style={styles.checkboxText}>약관 전체 동의</Text>
            </TouchableOpacity>
          </View>

          {/* 개별 약관 */}
          <View style={styles.termsList}>
            {/* 서비스 이용약관 */}
            <View style={styles.termsItem}>
              <TouchableOpacity
                style={styles.labelBox}
                onPress={() => handleCheck('service')}
              >
                <Image
                  source={
                    checks.service
                      ? require('../assets/images/checkbox_on.png')
                      : require('../assets/images/checkbox_off.png')
                  }
                  style={styles.checkboxImageSmall}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termsLink}
                onPress={() => setShowServiceModal(true)}
              >
                <Text style={styles.termsLinkText}>
                  <Text style={styles.colorBlue}>(필수)</Text> 서비스 이용약관
                </Text>
                <Image
                  source={require('../assets/images/arrow_right.png')}
                  style={styles.arrowIcon}
                />
              </TouchableOpacity>
            </View>

            {/* 개인정보처리방침 */}
            <View style={styles.termsItem}>
              <TouchableOpacity
                style={styles.labelBox}
                onPress={() => handleCheck('privacy')}
              >
                <Image
                  source={
                    checks.privacy
                      ? require('../assets/images/checkbox_on.png')
                      : require('../assets/images/checkbox_off.png')
                  }
                  style={styles.checkboxImageSmall}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termsLink}
                onPress={() => setShowPrivacyModal(true)}
              >
                <Text style={styles.termsLinkText}>
                  <Text style={styles.colorBlue}>(필수)</Text> 개인정보처리방침
                </Text>
                <Image
                  source={require('../assets/images/arrow_right.png')}
                  style={styles.arrowIcon}
                />
              </TouchableOpacity>
            </View>

            {/* P2P자금관리 */}
            <View style={styles.termsItem}>
              <TouchableOpacity
                style={styles.labelBox}
                onPress={() => handleCheck('p2p')}
              >
                <Image
                  source={
                    checks.p2p
                      ? require('../assets/images/checkbox_on.png')
                      : require('../assets/images/checkbox_off.png')
                  }
                  style={styles.checkboxImageSmall}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termsLink}
                onPress={() => setShowP2PModal(true)}
              >
                <Text style={styles.termsLinkText}>
                  <Text style={styles.colorBlue}>(필수)</Text> 개인(신용)정보
                  제3자(P2P자금관리) 제공 동의
                </Text>
                <Image
                  source={require('../assets/images/arrow_right.png')}
                  style={styles.arrowIcon}
                />
              </TouchableOpacity>
            </View>

            {/* 투자금예치은행 */}
            <View style={styles.termsItem}>
              <TouchableOpacity
                style={styles.labelBox}
                onPress={() => handleCheck('bank')}
              >
                <Image
                  source={
                    checks.bank
                      ? require('../assets/images/checkbox_on.png')
                      : require('../assets/images/checkbox_off.png')
                  }
                  style={styles.checkboxImageSmall}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termsLink}
                onPress={() => setShowBankModal(true)}
              >
                <Text style={styles.termsLinkText}>
                  <Text style={styles.colorBlue}>(필수)</Text> 개인(신용)정보
                  제3자(투자금예치은행) 제공 동의
                </Text>
                <Image
                  source={require('../assets/images/arrow_right.png')}
                  style={styles.arrowIcon}
                />
              </TouchableOpacity>
            </View>

            {/* 마케팅 */}
            <View style={styles.termsItem}>
              <TouchableOpacity
                style={styles.labelBox}
                onPress={() => handleCheck('marketing')}
              >
                <Image
                  source={
                    checks.marketing
                      ? require('../assets/images/checkbox_on.png')
                      : require('../assets/images/checkbox_off.png')
                  }
                  style={styles.checkboxImageSmall}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termsLink}
                onPress={() => setShowMarketingModal(true)}
              >
                <Text style={styles.termsLinkText}>
                  (선택) 마케팅 정보 수집 및 활용 동의
                </Text>
                <Image
                  source={require('../assets/images/arrow_right.png')}
                  style={styles.arrowIcon}
                />
              </TouchableOpacity>
            </View>

            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 다음 버튼 */}
      <View style={styles.fixBtnWrap}>
        <View style={styles.btnBox}>
          <TouchableOpacity
            style={[styles.btnNext, loading && styles.btnNextDisabled]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnNextText}>다음</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 모달들 */}
      {renderModal(
        showServiceModal,
        () => setShowServiceModal(false),
        '서비스 이용약관',
        termsData?.service?.contents ||
          '서비스 이용약관 내용을 불러오는 중입니다.',
      )}
      {renderModal(
        showPrivacyModal,
        () => setShowPrivacyModal(false),
        '개인정보처리방침',
        termsData?.private_agree?.contents ||
          '개인정보처리방침 내용을 불러오는 중입니다.',
      )}
      {renderModal(
        showP2PModal,
        () => setShowP2PModal(false),
        '개인(신용)정보\n제3자(P2P자금관리) 제공 동의',
        termsData?.priv2?.contents ||
          '개인(신용)정보 제3자 제공 동의 내용을 불러오는 중입니다.',
      )}
      {renderModal(
        showBankModal,
        () => setShowBankModal(false),
        '개인(신용)정보\n제3자(투자금예치은행) 제공 동의',
        termsData?.nhapi?.contents ||
          '개인(신용)정보 제3자 제공 동의 내용을 불러오는 중입니다.',
      )}
      {renderModal(
        showMarketingModal,
        () => setShowMarketingModal(false),
        '마케팅 정보 수집 및 활용 동의',
        termsData?.marketing?.contents ||
          '마케팅 정보 수집 및 활용에 대한 약관 내용입니다.',
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  content: {
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
    color: '#222222',
  },
  termsArea: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 30,
  },
  termsBox: {
    marginTop: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 55,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: 'rgba(81, 108, 137, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 2,
  },
  checkboxImage: {
    width: 21,
    height: 21,
    marginRight: 12,
  },
  checkboxText: {
    fontSize: 15,
    lineHeight: 19.5,
    fontWeight: '600',
    color: '#222222',
  },
  termsList: {
    marginTop: 16,
    marginLeft: 8,
    marginRight: 8,
  },
  termsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  labelBox: {
    padding: 4,
  },
  checkboxImageSmall: {
    width: 21,
    height: 21,
  },
  termsLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 8,
    paddingRight: 20,
  },
  termsLinkText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 24,
    color: '#222222',
  },
  colorBlue: {
    color: '#2c3db8',
  },
  arrowIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
    position: 'absolute',
    right: 0,
  },
  errorContainer: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#ff5042',
    fontSize: 11,
    lineHeight: 14,
  },
  fixBtnWrap: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  btnBox: {
    flexDirection: 'row',
  },
  btnNext: {
    flex: 1,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnNextDisabled: {
    backgroundColor: '#bfc3c7',
  },
  btnNextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // 모달 스타일
  popContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 48,
  },
  popMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#222',
    opacity: 0.7,
  },
  popWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  popBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  popTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#222222',
  },
  popContent: {
    marginTop: 20,
    maxHeight: 400,
    paddingHorizontal: 4,
  },
  webView: {
    backgroundColor: 'transparent',
  },
  popCloseBtn: {
    marginTop: 24,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popCloseBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SignUpPrivateScreen;
