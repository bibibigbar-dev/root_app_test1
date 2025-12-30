import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import ApiService from '../services/api';
import AppModal from '../components/AppModal';
import { getWebViewPretendardCss } from '../utils/webviewPretendard';

const { width } = Dimensions.get('window');

const SignUpCorpScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { termsData: initialTermsData } = route.params || {};

  const [termsData, setTermsData] = useState(initialTermsData || {});
  const [allChecked, setAllChecked] = useState(false);
  const [checkedTerms, setCheckedTerms] = useState({
    service: false,
    privateAgree: false,
    priv2: false,
    nhapi: false,
    marketing: false,
  });
  const [termError, setTermError] = useState('');

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPrivateAgreeModal, setShowPrivateAgreeModal] = useState(false);
  const [showPriv2Modal, setShowPriv2Modal] = useState(false);
  const [showNhapiModal, setShowNhapiModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);

  const [webViewHeight, setWebViewHeight] = useState(200);

  useEffect(() => {
    // 법인회원 약관 데이터 로드
    const loadTermsData = async () => {
      try {
        const response = await ApiService.get('/app/join/corp');
        if (response.status === 'success') {
          setTermsData(response);
        }
      } catch (error) {
        console.error('Error loading corp terms:', error);
      }
    };

    if (!initialTermsData) {
      loadTermsData();
    }
  }, [initialTermsData]);

  useEffect(() => {
    const allRequiredChecked =
      checkedTerms.service &&
      checkedTerms.privateAgree &&
      checkedTerms.priv2 &&
      checkedTerms.nhapi;
    setAllChecked(allRequiredChecked && checkedTerms.marketing);
  }, [checkedTerms]);

  const handleAllCheck = () => {
    const newAllChecked = !allChecked;
    setAllChecked(newAllChecked);
    setCheckedTerms({
      service: newAllChecked,
      privateAgree: newAllChecked,
      priv2: newAllChecked,
      nhapi: newAllChecked,
      marketing: newAllChecked,
    });
    if (newAllChecked) {
      setTermError('');
    }
  };

  const handleTermCheck = termName => {
    setCheckedTerms(prev => ({
      ...prev,
      [termName]: !prev[termName],
    }));
    if (termError && checkedTerms[termName]) {
      setTermError('');
    }
  };

  const createHtmlContent = htmlContent => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
          <style>
            ${getWebViewPretendardCss()}
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
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

  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!checkedTerms.service) {
      setTermError('* 서비스 이용약관에 동의하여 주십시오.');
      return;
    }
    if (!checkedTerms.privateAgree) {
      setTermError('* 개인정보처리방침에 동의하여 주십시오.');
      return;
    }
    if (!checkedTerms.priv2) {
      setTermError(
        '* 개인(신용)정보 제3자(P2P자금관리) 제공에 동의하여 주십시오.',
      );
      return;
    }
    if (!checkedTerms.nhapi) {
      setTermError(
        '* 개인(신용)정보 제3자(투자금예치은행) 제공에 동의하여 주십시오.',
      );
      return;
    }

    try {
      setLoading(true);
      const marketing = checkedTerms.marketing ? 'Y' : 'N';

      // API 호출
      const response = await ApiService.api.post('/app/join/corpAgree', {
        marketing: marketing,
        kakaoCi: '0',
      });

      if (response.data.status === 'success') {
        // 법인회원 가입 폼 화면으로 이동
        navigation.navigate('SignUpCorpForm', {
          ...response.data,
          marketing: marketing,
        });
      } else if (response.data.redirect) {
        navigation.replace(response.data.redirectUrl);
      } else {
        setTermError('* 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Failed to proceed to next step:', error);
      console.error('Error details:', error.response?.data);
      setTermError('* 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const renderModal = (isVisible, onClose, title, content) => (
    <AppModal
      visible={isVisible}
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

  return (
    <View style={styles.container}>
      {/* 뒤로가기 버튼 */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Image 
            source={require('../assets/images/ico_back.png')} 
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.subTitleBox}>
          <Text style={styles.title}>
            회원가입을 위해 {'\n'}약관에 동의해 주세요
          </Text>
        </View>

        <View style={styles.termsArea}>
          <View style={styles.termsBox}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={handleAllCheck}
            >
              <Image
                source={
                  allChecked
                    ? require('../assets/images/checkbox_on.png')
                    : require('../assets/images/checkbox_off.png')
                }
                style={styles.checkboxIcon}
              />
              <Text style={styles.checkboxText}>약관 전체 동의</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.termsList}>
            {/* 서비스 이용약관 */}
            <View style={styles.termsItem}>
              <TouchableOpacity
                style={styles.labelBox}
                onPress={() => handleTermCheck('service')}
              >
                <Image
                  source={
                    checkedTerms.service
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
                onPress={() => handleTermCheck('privateAgree')}
              >
                <Image
                  source={
                    checkedTerms.privateAgree
                      ? require('../assets/images/checkbox_on.png')
                      : require('../assets/images/checkbox_off.png')
                  }
                  style={styles.checkboxImageSmall}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termsLink}
                onPress={() => setShowPrivateAgreeModal(true)}
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

            {/* 개인(신용)정보 제3자(P2P자금관리) 제공 동의 */}
            <View style={styles.termsItem}>
              <TouchableOpacity
                style={styles.labelBox}
                onPress={() => handleTermCheck('priv2')}
              >
                <Image
                  source={
                    checkedTerms.priv2
                      ? require('../assets/images/checkbox_on.png')
                      : require('../assets/images/checkbox_off.png')
                  }
                  style={styles.checkboxImageSmall}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termsLink}
                onPress={() => setShowPriv2Modal(true)}
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

            {/* 개인(신용)정보 제3자(투자금예치은행) 제공 동의 */}
            <View style={styles.termsItem}>
              <TouchableOpacity
                style={styles.labelBox}
                onPress={() => handleTermCheck('nhapi')}
              >
                <Image
                  source={
                    checkedTerms.nhapi
                      ? require('../assets/images/checkbox_on.png')
                      : require('../assets/images/checkbox_off.png')
                  }
                  style={styles.checkboxImageSmall}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termsLink}
                onPress={() => setShowNhapiModal(true)}
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

            {/* 마케팅 정보 수집 및 활용 동의 */}
            <View style={styles.termsItem}>
              <TouchableOpacity
                style={styles.labelBox}
                onPress={() => handleTermCheck('marketing')}
              >
                <Image
                  source={
                    checkedTerms.marketing
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

            {termError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{termError}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modals */}
      {renderModal(
        showServiceModal,
        () => setShowServiceModal(false),
        '서비스 이용약관',
        termsData?.service?.contents || '',
      )}
      {renderModal(
        showPrivateAgreeModal,
        () => setShowPrivateAgreeModal(false),
        '개인정보처리방침',
        termsData?.private_agree?.contents || '',
      )}
      {renderModal(
        showPriv2Modal,
        () => setShowPriv2Modal(false),
        '개인(신용)정보 제3자(P2P자금관리) 제공 동의',
        termsData?.priv2?.contents || '',
      )}
      {renderModal(
        showNhapiModal,
        () => setShowNhapiModal(false),
        '개인(신용)정보 제3자(투자금예치은행) 제공 동의',
        termsData?.nhapi?.contents || '',
      )}
      {renderModal(
        showMarketingModal,
        () => setShowMarketingModal(false),
        '마케팅 정보 수집 및 활용 동의',
        termsData?.marketing?.contents || '',
      )}

      <View style={styles.fixBtnWrap}>
        <View style={styles.btnBox}>
          <TouchableOpacity
            style={[styles.nextButton, loading && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>다음</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
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
  checkboxIcon: {
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
  nextButton: {
    flex: 1,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#bfc3c7',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // 모달 스타일
  modalContainer: {
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
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  modalBox: {
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
  confirmBtn: {
    marginTop: 24,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SignUpCorpScreen;
