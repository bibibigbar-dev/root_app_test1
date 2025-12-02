import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
// import { WebView } from 'react-native-webview';
// import DocumentPicker from 'react-native-document-picker';
// import { launchImageLibrary } from 'react-native-image-picker';
import ApiService from '../services/api';

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
    // 주소 검색은 외부 브라우저로 열거나 직접 입력받기
    Alert.alert(
      '거주지 검색',
      '주소를 직접 입력해주세요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            // 주소 입력을 위한 간단한 방법
            // 실제로는 주소 검색 API를 사용하거나 WebView를 사용해야 함
            setShowAddressModal(true);
          },
        },
      ]
    );
  };

  const handleAddressSelect = (data) => {
    if (data) {
      setSido(data.sido || '');
      setSigungu(data.sigungu || '');
      setBname1(data.bname1 || '');
      setBname(data.bname || '');
    }
    setShowAddressModal(false);
  };

  const handleFilePicker = async () => {
    // TODO: react-native-image-picker 또는 react-native-document-picker 설치 필요
    // npm install react-native-image-picker
    // 또는
    // npm install react-native-document-picker
    Alert.alert(
      '알림',
      '파일 선택 기능을 사용하려면 react-native-image-picker 패키지가 필요합니다.\n\n설치 명령어:\nnpm install react-native-image-picker\n\n그 후 코드의 주석을 해제해주세요.',
      [{ text: '확인' }]
    );
    
    // 아래 코드는 패키지 설치 후 주석 해제
    /*
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 5,
        includeBase64: false,
      });

      if (result.didCancel) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const validFiles = [];
        const maxSize = 5 * 1024 * 1024; // 5MB

        for (const asset of result.assets) {
          const fileName = asset.fileName || asset.uri.split('/').pop() || 'image.jpg';
          const ext = fileName.split('.').pop()?.toLowerCase();
          const allowedExts = ['gif', 'jpg', 'jpeg', 'png', 'pdf'];
          
          if (ext && !allowedExts.includes(ext)) {
            Alert.alert(
              '서류 제출',
              '업로드 불가 파일형식입니다.\n(gif, jpg, jpeg, png, pdf 파일만 가능합니다.)',
              [{ text: '확인' }]
            );
            continue;
          }

          if (asset.fileSize && asset.fileSize > maxSize) {
            Alert.alert(
              '서류 제출',
              '업로드 가능한 최대 용량은 파일당 5MB 입니다.',
              [{ text: '확인' }]
            );
            continue;
          }

          validFiles.push({
            id: Date.now() + Math.random(),
            name: fileName,
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            size: asset.fileSize || 0,
          });
        }

        setSelectedFiles([...selectedFiles, ...validFiles]);
      }
    } catch (err) {
      console.error('파일 선택 오류:', err);
      Alert.alert('오류', '파일 선택 중 오류가 발생했습니다.');
    }
    */
  };

  const handleRemoveFile = (fileId) => {
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
      const formData = new FormData();
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

      const response = await ApiService.api.post('/app/product/upload/proc/arearequest', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data === '0') {
        Alert.alert(
          '이웃신청',
          '신청이 완료되었습니다.',
          [
            {
              text: '확인',
              onPress: () => {
                navigation.navigate('NeighborRequestDone');
              },
            },
          ]
        );
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
        <View style={styles.titleBox}>
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
              editable={false}
            />
            <TextInput
              style={styles.addressInput}
              value={sigungu}
              placeholder="시/군/구"
              editable={false}
            />
            <TextInput
              style={styles.addressInput}
              value={bname1}
              placeholder="읍/면"
              editable={false}
            />
            <TextInput
              style={styles.addressInput}
              value={bname}
              placeholder="동/리"
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
            <Text style={styles.fileUploadIcon}>📎</Text>
            <Text style={styles.fileUploadText}>파일추가</Text>
          </TouchableOpacity>

          {selectedFiles.length > 0 && (
            <View style={styles.fileList}>
              {selectedFiles.map((file) => (
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
            보안망으로 인하여 정상적으로 첨부가 되지 않을 경우 로그인 아이디를 포함하여 아래 고객센터 메일로 전달주시면 빠른 처리 진행하겠습니다.{'\n\n'}
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

      {/* 주소 검색 모달 */}
      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>거주지 검색</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAddressModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.addressInputModal}>
              <Text style={styles.addressModalLabel}>시/도</Text>
              <TextInput
                style={styles.addressModalInput}
                value={sido}
                onChangeText={setSido}
                placeholder="예: 서울특별시"
              />
              <Text style={styles.addressModalLabel}>시/군/구</Text>
              <TextInput
                style={styles.addressModalInput}
                value={sigungu}
                onChangeText={setSigungu}
                placeholder="예: 강남구"
              />
              <Text style={styles.addressModalLabel}>읍/면</Text>
              <TextInput
                style={styles.addressModalInput}
                value={bname1}
                onChangeText={setBname1}
                placeholder="예: 역삼동"
              />
              <Text style={styles.addressModalLabel}>동/리</Text>
              <TextInput
                style={styles.addressModalInput}
                value={bname}
                onChangeText={setBname}
                placeholder="예: 테헤란로"
              />
              <TouchableOpacity
                style={styles.addressModalButton}
                onPress={() => handleAddressSelect({ sido, sigungu, bname1, bname })}
              >
                <Text style={styles.addressModalButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  titleBox: {
    marginTop: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    color: '#222',
    marginBottom: 18,
  },
  titleP: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
    textAlign: 'center',
  },
  formBox: {
    margin: 24,
    marginTop: 30,
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
    paddingHorizontal: 12,
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
  fileUploadIcon: {
    fontSize: 19,
    marginRight: 15,
  },
  fileUploadText: {
    marginTop: 2,
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
    fontSize: 20,
    fontWeight: '500',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  modalTitle: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  modalCloseButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
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

