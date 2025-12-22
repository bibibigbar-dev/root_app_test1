import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import DocumentPicker from 'react-native-document-picker';
import ApiService from '../services/api';
import AppModal from '../components/AppModal';

const NeighborRequestScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderName, setOrderName] = useState('');
  const [sido, setSido] = useState('');
  const [sigungu, setSigungu] = useState('');
  const [bname1, setBname1] = useState('');
  const [bname, setBname] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);

  useEffect(() => {
    loadUserData();
    if (route?.params?.product) {
      setOrderNumber(route.params.product.orderNumber || '');
      setOrderName(route.params.product.orderName || '');
    }
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await ApiService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
    }
  };

  const handleAddressSearch = () => {
    setShowAddressModal(true);
  };

  const handleAddressSelect = data => {
    try {
      let parsedData = data;
      if (typeof data === 'string') {
        parsedData = JSON.parse(data);
      }

      // Daum Postcode API 응답에서 시/도, 시/군/구, 읍/면, 동/리 추출
      // sido는 address 또는 roadAddress에서 추출
      const roadAddress = parsedData.roadAddress || '';
      const jibunAddress = parsedData.jibunAddress || '';

      // 시/도 추출 (예: "서울특별시", "경기도" 등)
      const sidoMatch = roadAddress.match(
        /^(서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|경기도|강원도|충청북도|충청남도|전라북도|전라남도|경상북도|경상남도|제주특별자치도)/,
      );
      const extractedSido = sidoMatch ? sidoMatch[1] : '';

      // 시/군/구 추출
      const sigunguMatch = roadAddress
        .replace(extractedSido, '')
        .trim()
        .match(/^([^\s]+)/);
      const extractedSigungu = sigunguMatch ? sigunguMatch[1] : '';

      // 읍/면/동 추출
      const addressParts = roadAddress
        .replace(extractedSido, '')
        .replace(extractedSigungu, '')
        .trim()
        .split(' ');
      const extractedBname1 = addressParts[0] || '';
      const extractedBname = addressParts[1] || '';

      setSido(extractedSido);
      setSigungu(extractedSigungu);
      setBname1(extractedBname1);
      setBname(extractedBname);
      setShowAddressModal(false);
    } catch (error) {
      console.error('주소 파싱 오류:', error);
      Alert.alert('오류', '주소 정보를 처리하는 중 오류가 발생했습니다.');
    }
  };

  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.images,
          DocumentPicker.types.pdf,
          DocumentPicker.types.allFiles,
        ],
        allowMultiSelection: true,
        copyTo: 'cachesDirectory',
      });

      const files = Array.isArray(result) ? result : [result];

      files.forEach(file => {
        const fileName = file.name || file.fileName || '';
        const fileExt = fileName.split('.').pop().toLowerCase();
        const allowedExts = [
          'gif',
          'jpg',
          'jpeg',
          'png',
          'pdf',
          'hwp',
          'xls',
          'xlsx',
          'csv',
        ];

        if (!allowedExts.includes(fileExt)) {
          Alert.alert(
            '서류 제출',
            '업로드 불가 파일형식입니다.\n(gif, jpg, jpeg, png, pdf, hwp, xls, xlsx 파일만 가능합니다.)',
            [{ text: '확인' }],
          );
          return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        const fileSize = file.size || 0;
        if (fileSize > maxSize) {
          Alert.alert(
            '서류 제출',
            '업로드 가능한 최대 용량은 파일당 5MB 입니다.',
            [{ text: '확인' }],
          );
          return;
        }

        setSelectedFiles(prev => [
          ...prev,
          {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: fileName,
            uri: file.uri || file.fileCopyUri,
            size: fileSize,
            type: file.type || 'application/octet-stream',
          },
        ]);
      });
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return;
      }
      console.error('파일 선택 오류:', error);
      Alert.alert('오류', '파일 선택 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveFile = fileId => {
    setSelectedFiles(selectedFiles.filter(file => file.id !== fileId));
  };

  const handleSubmit = async () => {
    if (!sido || !sigungu || !bname1 || !bname) {
      Alert.alert('이웃신청', '거주지를 선택해 주십시오.');
      return;
    }

    if (selectedFiles.length === 0) {
      Alert.alert('서류 제출', '최소 하나 이상의 파일을 첨부해주세요.');
      return;
    }

    setLoading(true);

    try {
      const memberId = user?.session?.member_id || user?.id;

      if (!memberId) {
        Alert.alert('알림', '로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('member_id', memberId);
      formData.append('orderNumber', orderNumber);
      formData.append('sido', sido);
      formData.append('sigungu', sigungu);
      formData.append('bname1', bname1);
      formData.append('bname', bname);

      selectedFiles.forEach((file, index) => {
        formData.append('files', {
          uri: file.uri,
          type: file.type || 'application/octet-stream',
          name: file.name,
        });
      });

      const response = await ApiService.api.post(
        '/app/product/upload/proc/arearequest',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const result = String(response.data);

      if (result === '0') {
        // 성공 - 완료 화면으로 이동
        navigation.replace('NeighborRequestDone');
      } else if (result === '1') {
        Alert.alert('이웃신청', '회원 정보가 없습니다.');
      } else if (result === '9') {
        Alert.alert('이웃신청', '파일 업로드에 실패했습니다.');
      } else {
        Alert.alert('이웃신청', '처리도중 오류가 발생하였습니다.');
      }
    } catch (error) {
      console.error('이웃신청 제출 오류:', error);
      Alert.alert('이웃신청', '처리도중 오류가 발생하였습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:cs@rootenery.co.kr');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.subTitleBox}>
          <Text style={styles.title}>이웃신청</Text>
          <Text style={styles.titleP}>
            혁신상품의 투자를 이용하기 위해,{'\n'}
            사용자 거주 주소지를 확인 후 순차적으로 승인처리 됩니다.
          </Text>
        </View>

        <View style={styles.formBox}>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>상품번호</Text>
            <Text style={styles.formValue}>{orderNumber || '-'}</Text>
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>상품명</Text>
            <Text style={styles.formValue}>{orderName || '-'}</Text>
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>거주지역</Text>
            <TouchableOpacity
              style={styles.addressButton}
              onPress={handleAddressSearch}
            >
              <Text style={styles.addressButtonText}>거주지검색</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.addressInputs}>
            <TextInput
              style={styles.addressInput}
              value={sido}
              placeholder="시/도"
              placeholderTextColor="#999"
              editable={false}
            />
            <TextInput
              style={styles.addressInput}
              value={sigungu}
              placeholder="시/군/구"
              placeholderTextColor="#999"
              editable={false}
            />
            <TextInput
              style={styles.addressInput}
              value={bname1}
              placeholder="읍/면"
              placeholderTextColor="#999"
              editable={false}
            />
            <TextInput
              style={styles.addressInput}
              value={bname}
              placeholder="동/리"
              placeholderTextColor="#999"
              editable={false}
            />
          </View>

          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              * 거주 주소를 선택해 주시기 바랍니다.
            </Text>
            <Text style={styles.noticeText}>
              * 주소 선택시 지역명(동/리)으로 입력됩니다.
            </Text>
          </View>

          <Text style={styles.subTitle}>인증자료</Text>

          <TouchableOpacity
            style={styles.fileUploadBox}
            onPress={handleFilePicker}
          >
            <Image
              source={require('../assets/images/ico_fileupload.png')}
              style={styles.fileuploadIco}
              resizeMode="contain"
            />
            <Text style={styles.fileUploadText}>파일추가</Text>
          </TouchableOpacity>

          {selectedFiles.length > 0 && (
            <View style={styles.fileList}>
              {selectedFiles.map(file => (
                <View key={file.id} style={styles.fileItem}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.fileDeleteButton}
                    onPress={() => handleRemoveFile(file.id)}
                  >
                    <Text style={styles.fileDeleteIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              * 거주 주소를 증빙하는 서류 (예: 주민등록초본)
            </Text>
            <Text style={styles.noticeText}>
              * 등/초본은 1개월이내 발급한 서류만 유효합니다.
            </Text>
          </View>
        </View>

        <View style={styles.notifBox}>
          <Text style={styles.notifText}>
            보안망으로 인하여 정상적으로 첨부가 되지 않을 경우 로그인 아이디를
            포함하여 아래 고객센터 메일로 전달주시면 빠른 처리 진행하겠습니다.
            {'\n\n'}
            <Text style={styles.mailto} onPress={handleEmailPress}>
              Email : cs@rootenery.co.kr
            </Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>주민신청하기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* 주소 검색 모달 - Daum Postcode */}
      <AppModal
        visible={showAddressModal}
        title="주소검색"
        onClose={() => setShowAddressModal(false)}
        backdropClose={false}
        scroll={false}
        primaryAction={{
          text: '닫기',
          onPress: () => setShowAddressModal(false),
        }}
      >
        <View style={styles.webViewContainer}>
          <WebView
            source={{
              baseUrl: 'https://rootenergy.co.kr',
              html: `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                        <style>
                          * { margin: 0; padding: 0; box-sizing: border-box; }
                          body { overflow: hidden; background-color: white; }
                          #loading { padding: 20px; text-align: center; }
                          #layer { width: 100%; height: 460px; }
                        </style>
                      </head>
                      <body>
                        <div id="loading">주소 검색 로딩중...</div>
                        <div id="layer"></div>
                        <script>
                          function rnSend(obj) {
                            try {
                              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                window.ReactNativeWebView.postMessage(JSON.stringify(obj));
                                return true;
                              }
                            } catch (e) {}
                            return false;
                          }

                          window.addEventListener('message', function(ev) {
                            try {
                              var data = ev.data;
                              if (typeof data === 'string') {
                                data = JSON.parse(data);
                              }
                              if (data && (data.zonecode || data.roadAddress || data.jibunAddress)) {
                                var wrapped = { __type: 'address', payload: data, ts: Date.now() };
                                rnSend(wrapped);
                              }
                            } catch (e) {}
                          }, false);
                          
                          var script = document.createElement('script');
                          script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
                          script.onload = function() {
                            document.getElementById('loading').style.display = 'none';
                            
                            var daunaddrlayer = document.getElementById('layer');

                            function sendToReactNative(payload) {
                              var wrapped = { __type: 'address', payload: payload, ts: Date.now() };
                              var ok = rnSend(wrapped);
                              if (!ok) {
                              try {
                                  window.location.href = 'postcode://' + encodeURIComponent(JSON.stringify(payload));
                                } catch (err) {}
                              }
                            }
                            
                            function execDaumPostcode() {
                              new daum.Postcode({
                                oncomplete: function(data) {
                                  var fullRoadAddr = data.roadAddress;
                                  var extraRoadAddr = '';
                                  
                                  if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                                    extraRoadAddr += data.bname;
                                  }
                                  if (data.buildingName !== '' && data.apartment === 'Y') {
                                    extraRoadAddr += (extraRoadAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                                  }
                                  if (extraRoadAddr !== '') {
                                    extraRoadAddr = ' (' + extraRoadAddr + ')';
                                  }
                                  if (fullRoadAddr !== '') {
                                    fullRoadAddr += extraRoadAddr;
                                  }
                                  
                                  var payload = {
                                    zonecode: data.zonecode,
                                    roadAddress: fullRoadAddr,
                                    jibunAddress: data.jibunAddress
                                  };

                                  sendToReactNative(payload);
                                },
                                width: '100%',
                                height: '460px',
                                maxSuggestItems: 5,
                                autoClose: true
                              }).embed(daunaddrlayer);
                            }
                            
                            execDaumPostcode();
                          };
                          script.onerror = function() {
                            document.getElementById('loading').innerHTML = '주소 검색 로드 실패<br>인터넷 연결을 확인해주세요';
                          };
                          document.head.appendChild(script);
                        </script>
                      </body>
                    </html>
                  `,
            }}
            onMessage={event => {
              const data = event.nativeEvent.data;
              try {
                const parsed = JSON.parse(data);
                if (parsed?.__type === 'address') {
                  handleAddressSelect(parsed.payload);
                  return;
                }
              } catch (_) {}
              handleAddressSelect(data);
            }}
            onShouldStartLoadWithRequest={request => {
              if (request.url.startsWith('postcode://')) {
                const payload = decodeURIComponent(
                  request.url.replace('postcode://', ''),
                );
                handleAddressSelect(payload);
                return false;
              }
              return true;
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mixedContentMode="always"
            originWhitelist={['*']}
            style={styles.webView}
          />
        </View>
      </AppModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  subTitleBox: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    color: '#222',
  },
  titleP: {
    marginTop: 18,
    color: '#666',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  formBox: {
    marginVertical: 24,
    marginHorizontal: 16,
    paddingBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    shadowColor: '#516c89',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    marginHorizontal: 20,
  },
  formLabel: {
    flex: 0,
    width: 104,
    minHeight: 44,
    marginRight: 12,
    paddingTop: 3,
    color: '#666',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '400',
  },
  formValue: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#222',
  },
  addressButton: {
    paddingHorizontal: 70,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  addressButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
  },
  addressInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginHorizontal: 20,
    gap: 8,
  },
  addressInput: {
    flex: 1,
    minWidth: '45%',
    height: 44,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    fontSize: 15,
    backgroundColor: '#fbfbfb',
  },
  noticeBox: {
    marginTop: 12,
    paddingHorizontal: 20,
  },
  noticeText: {
    position: 'relative',
    paddingLeft: 19,
    marginTop: 3,
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '400',
  },
  subTitle: {
    marginTop: 20,
    paddingHorizontal: 20,
    color: '#666',
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '400',
  },
  fileUploadBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfc3c7',
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  fileuploadIco: {
    width: 19,
    height: 25,
    backgroundColor: '#fff',
  },
  fileUploadText: {
    marginTop: 2,
    marginLeft: 10,
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 13,
  },
  fileList: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    backgroundColor: 'rgba(246, 246, 246, 0.5)',
  },
  fileName: {
    flex: 1,
    marginRight: 12,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#222',
  },
  fileDeleteButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileDeleteIcon: {
    fontSize: 16,
    color: '#666',
  },
  notifBox: {
    position: 'relative',
    paddingLeft: 19,
    marginTop: 20,
    marginHorizontal: 20,
  },
  notifText: {
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '400',
  },
  mailto: {
    color: '#666',
  },
  submitButton: {
    height: 48,
    marginTop: 40,
    marginHorizontal: 16,
    marginBottom: 30,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#a3a7ab',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  addressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  webViewContainer: {
    height: 460,
  },
  webView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  addressInputModal: {
    padding: 20,
  },
  addressModalLabel: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  addressModalInput: {
    height: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 8,
    fontSize: 15,
    backgroundColor: '#fbfbfb',
  },
  addressModalButton: {
    marginTop: 20,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default NeighborRequestScreen;
