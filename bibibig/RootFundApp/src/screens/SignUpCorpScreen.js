import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import ApiService from '../services/api';

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

  const handleTermCheck = (termName) => {
    setCheckedTerms((prev) => ({
      ...prev,
      [termName]: !prev[termName],
    }));
    if (termError && checkedTerms[termName]) {
      setTermError('');
    }
  };

  const createHtmlContent = (htmlContent) => {
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

  const handleNext = () => {
    if (!checkedTerms.service) {
      setTermError('* 서비스 이용약관에 동의하여 주십시오.');
      return;
    }
    if (!checkedTerms.privateAgree) {
      setTermError('* 개인정보처리방침에 동의하여 주십시오.');
      return;
    }
    if (!checkedTerms.priv2) {
      setTermError('* 개인(신용)정보 제3자(P2P자금관리) 제공에 동의하여 주십시오.');
      return;
    }
    if (!checkedTerms.nhapi) {
      setTermError('* 개인(신용)정보 제3자(투자금예치은행) 제공에 동의하여 주십시오.');
      return;
    }

    const marketing = checkedTerms.marketing ? 'Y' : 'N';
    // TODO: 법인회원 가입 다음 단계로 이동
    navigation.navigate('SignUpCorp', {
      marketing: marketing,
      kakaoCi: termsData?.kakaoCi || '0',
    });
  };

  const renderModal = (isVisible, onClose, title, content) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalWrapper}>
          <View style={styles.modalBox}>
            <Text style={styles.popTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Image
                source={require('../assets/images/ico_close_gray02.png')}
                style={styles.closeIcon}
              />
            </TouchableOpacity>
            <ScrollView 
              style={styles.popContent}
              showsVerticalScrollIndicator={true}
            >
              {content && (
                <WebView
                  originWhitelist={['*']}
                  source={{ html: createHtmlContent(content) }}
                  style={[styles.webView, { height: webViewHeight }]}
                  scrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                  showsHorizontalScrollIndicator={true}
                  onMessage={(event) => {
                    try {
                      const data = JSON.parse(event.nativeEvent.data);
                      if (data.type === 'height' && data.height) {
                        setWebViewHeight(data.height + 20);
                      }
                    } catch (e) {
                      console.log('WebView message parse error:', e);
                    }
                  }}
                />
              )}
            </ScrollView>
            <View style={styles.btnBox}>
              <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
                <Text style={styles.confirmBtnText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

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
        <Text style={styles.headerTitle}></Text>
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
            <View style={styles.termsListItem}>
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
                  style={styles.checkboxIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowServiceModal(true)}
                style={styles.termsLink}
              >
                <Text style={styles.termsLinkText}>
                  <Text style={styles.requiredText}>(필수)</Text> 서비스 이용약관
                </Text>
              </TouchableOpacity>
            </View>

            {/* 개인정보처리방침 */}
            <View style={styles.termsListItem}>
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
                  style={styles.checkboxIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowPrivateAgreeModal(true)}
                style={styles.termsLink}
              >
                <Text style={styles.termsLinkText}>
                  <Text style={styles.requiredText}>(필수)</Text> 개인정보처리방침
                </Text>
              </TouchableOpacity>
            </View>

            {/* 개인(신용)정보 제3자(P2P자금관리) 제공 동의 */}
            <View style={styles.termsListItem}>
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
                  style={styles.checkboxIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowPriv2Modal(true)}
                style={styles.termsLink}
              >
                <Text style={styles.termsLinkText}>
                  <Text style={styles.requiredText}>(필수)</Text> 개인(신용)정보
                  제3자(P2P자금관리) 제공 동의
                </Text>
              </TouchableOpacity>
            </View>

            {/* 개인(신용)정보 제3자(투자금예치은행) 제공 동의 */}
            <View style={styles.termsListItem}>
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
                  style={styles.checkboxIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowNhapiModal(true)}
                style={styles.termsLink}
              >
                <Text style={styles.termsLinkText}>
                  <Text style={styles.requiredText}>(필수)</Text> 개인(신용)정보
                  제3자(투자금예치은행) 제공 동의
                </Text>
              </TouchableOpacity>
            </View>

            {/* 마케팅 정보 수집 및 활용 동의 */}
            <View style={styles.termsListItem}>
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
                  style={styles.checkboxIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowMarketingModal(true)}
                style={styles.termsLink}
              >
                <Text style={styles.termsLinkText}>
                  <Text style={styles.optionalText}>(선택)</Text> 마케팅 정보 수집 및
                  활용 동의
                </Text>
              </TouchableOpacity>
            </View>

            {termError ? (
              <Text style={styles.termErrorMessage}>{termError}</Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderModal(
        showServiceModal,
        () => setShowServiceModal(false),
        '서비스 이용약관',
        termsData?.service?.contents || ''
      )}
      {renderModal(
        showPrivateAgreeModal,
        () => setShowPrivateAgreeModal(false),
        '개인정보처리방침',
        termsData?.private_agree?.contents || ''
      )}
      {renderModal(
        showPriv2Modal,
        () => setShowPriv2Modal(false),
        '개인(신용)정보 제3자(P2P자금관리) 제공 동의',
        termsData?.priv2?.contents || ''
      )}
      {renderModal(
        showNhapiModal,
        () => setShowNhapiModal(false),
        '개인(신용)정보 제3자(투자금예치은행) 제공 동의',
        termsData?.nhapi?.contents || ''
      )}
      {renderModal(
        showMarketingModal,
        () => setShowMarketingModal(false),
        '마케팅 정보 수집 및 활용 동의',
        termsData?.marketing?.contents || ''
      )}

      <View style={styles.fixBtnWrap}>
        <View style={styles.btnBox}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>다음</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 10,
  },
  backButtonImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#393f44',
  },
  content: {
    flex: 1,
  },
  subTitleBox: {
    marginTop: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    textAlign: 'center',
  },
  termsArea: {
    paddingHorizontal: 16,
    marginTop: 30,
  },
  termsBox: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxIcon: {
    width: 21,
    height: 21,
    resizeMode: 'contain',
  },
  checkboxText: {
    marginLeft: 12,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
    color: '#393f44',
  },
  termsList: {
    marginTop: 16,
  },
  termsListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 55,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#516c89',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
  },
  labelBox: {
    paddingVertical: 4,
    marginRight: 8,
  },
  termsLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
  },
  termsLinkText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: '#222222',
  },
  requiredText: {
    color: '#2c3db8',
  },
  optionalText: {
    color: '#666',
  },
  termErrorMessage: {
    color: '#ff5042',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  fixBtnWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#fff',
    marginBottom: 40,
  },
  btnBox: {
    flexDirection: 'row',
    marginTop: 20,
  },
  nextButton: {
    flex: 1,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
  },
  popTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 10,
  },
  closeIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  popContent: {
    maxHeight: Dimensions.get('window').height * 0.6,
    marginBottom: 20,
  },
  webView: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#fff',
  },
});

export default SignUpCorpScreen;
