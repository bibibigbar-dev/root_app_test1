import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import ApiService from '../services/api';

const UpwardRequestScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('10');
  const [expandedGrade, setExpandedGrade] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await ApiService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else if (route?.params?.user) {
        setUser(route.params.user);
      }
    } catch (error) {
      console.error('사용자 정보 로드 오류:', error);
    }
  };

  const handleGradeSelect = (grade) => {
    setSelectedGrade(grade);
  };

  const toggleGradeExpand = (grade) => {
    setExpandedGrade(expandedGrade === grade ? null : grade);
  };

  const handleFileSelect = async () => {
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

      // result가 배열이 아닌 경우 배열로 변환
      const files = Array.isArray(result) ? result : [result];

      files.forEach((file) => {
        // 파일 유효성 검사
        const fileName = file.name || file.fileName || '';
        const fileExt = fileName.split('.').pop().toLowerCase();
        const allowedExts = ['gif', 'jpg', 'jpeg', 'png', 'pdf', 'hwp', 'xls', 'xlsx', 'csv'];
        
        if (!allowedExts.includes(fileExt)) {
          Alert.alert(
            '서류 제출',
            '업로드 불가 파일형식입니다.\n(gif, jpg, jpeg, png, pdf, hwp, xls, xlsx 파일만 가능합니다.)',
            [{ text: '확인' }]
          );
          return;
        }

        // 용량 체크 (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        const fileSize = file.size || 0;
        if (fileSize > maxSize) {
          Alert.alert(
            '서류 제출',
            '업로드 가능한 최대 용량은 파일당 5MB 입니다.',
            [{ text: '확인' }]
          );
          return;
        }

        setSelectedFiles(prev => [...prev, {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: fileName,
          uri: file.uri || file.fileCopyUri,
          size: fileSize,
          type: file.type || 'application/octet-stream',
        }]);
      });
    } catch (error) {
      // 사용자가 취소한 경우
      if (DocumentPicker.isCancel(error)) {
        return;
      }
      console.error('파일 선택 오류:', error);
      Alert.alert('오류', '파일 선택 중 오류가 발생했습니다.');
    }
  };

  const handleFileRemove = (fileId) => {
    setSelectedFiles(selectedFiles.filter(file => file.id !== fileId));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (selectedFiles.length === 0) {
      Alert.alert('서류 제출', '최소 하나 이상의 파일을 첨부해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const memberId = user?.session?.member_id || user?.id;
      
      console.log('📤 상향신청 시작 - member_id:', memberId);
      console.log('📤 선택된 등급:', selectedGrade);
      console.log('📤 선택된 파일 개수:', selectedFiles.length);
      
      // FormData 생성
      const formData = new FormData();
      formData.append('member_class', selectedGrade);
      formData.append('member_id', memberId);

      // 파일 추가
      selectedFiles.forEach((file, index) => {
        console.log(`📤 파일 ${index + 1}:`, file.name, file.type);
        formData.append('files', {
          uri: file.uri,
          type: file.type || 'application/octet-stream',
          name: file.name,
        });
      });

      console.log('📤 API 호출: /app/my/process/upward');
      
      const response = await ApiService.api.post('/app/my/process/upward', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ 상향신청 응답:', response.data);

      if (response.data === '0' || response.data === 0) {
        setIsSubmitting(false);
        navigation.navigate('UpwardRequestDone', { user });
      } else {
        Alert.alert(
          '투자등급 상향신청',
          '처리도중 오류가 발생하였습니다.',
          [
            {
              text: '확인',
              onPress: () => {
                setIsSubmitting(false);
                navigation.goBack();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('상향신청 제출 오류:', error);
      Alert.alert(
        '투자등급 상향신청',
        '처리도중 오류가 발생하였습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              setIsSubmitting(false);
              navigation.goBack();
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.subTitleBox}>
          <Text style={styles.title}>투자등급 상향신청</Text>
          <Text style={styles.titleP}>
            아래 정보를 작성해주시면{'\n'}
            심사 후 순차적으로 승인처리 됩니다.
          </Text>
        </View>

        <View style={styles.subUsername}>
          <Text style={styles.subUsernameDt}>이름</Text>
          <Text style={styles.subUsernameDd}>
            {user?.session?.member_name || user?.name || '-'}
          </Text>
        </View>

        <Text style={styles.subTitle12}>투자등급</Text>

        <View style={styles.radioList}>
          {/* 개인소득적격투자자 */}
          <View style={styles.radioListItem}>
            <View style={styles.labelBox}>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => handleGradeSelect('10')}
              >
                {selectedGrade === '10' && <View style={styles.radioButtonInner} />}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.radioInHead}
              onPress={() => toggleGradeExpand('10')}
            >
              <View style={styles.radioInHeadContent}>
                <Text style={styles.radioTit}>개인소득적격투자자</Text>
                <Text style={styles.radioTitP}>
                  온투법권 전체 <Text style={styles.radioTitPEm}>1억원 한도</Text>
                </Text>
              </View>
              <Image
                source={require('../assets/images/arrow_select.png')}
                style={[
                  styles.radioArrow,
                  expandedGrade === '10' && styles.radioArrowExpanded,
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {expandedGrade === '10' && (
              <View style={styles.radioInCont}>
                <Text style={styles.radioContTit}>자격요건</Text>
                <Text style={styles.radioContStit}>[필수조건 택 1]</Text>
                <Text style={styles.radioContTxt}>
                  1. 근로소득 1억원 초과{'\n'}
                  2. 사업소득 1억원 초과{'\n'}
                  3. 사업소득과 근로소득 합산 1억원 초과{'\n'}
                  4. 이자,배당 소득 2천만원 초과
                </Text>
                <Text style={styles.radioContTit}>투자한도</Text>
                <Text style={styles.radioContTxt}>
                  동일 차입자 기준 : 2천만원{'\n'}
                  온투업권 기준 : 1억원
                </Text>
                <Text style={styles.radioContTit}>증빙서류</Text>
                <Text style={styles.radioContTxt}>
                  필수조건 중 해당하는 기준에 맞춰 제출{'\n'}
                  전년도 {'<근로소득원천징수영수증>'} 혹은 {'<소득금액증명원>'} 중 택 1 (회사 직인 혹은 본인 서명 필수){'\n'}
                  전년도 '종합소득 과세표준 확정신고 및 납부계산서' 전체 페이지 (본인 서명 혹은 날인 필수)
                </Text>
              </View>
            )}
          </View>

          {/* 개인전문투자자 */}
          <View style={styles.radioListItem}>
            <View style={styles.labelBox}>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => handleGradeSelect('20')}
              >
                {selectedGrade === '20' && <View style={styles.radioButtonInner} />}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.radioInHead}
              onPress={() => toggleGradeExpand('20')}
            >
              <View style={styles.radioInHeadContent}>
                <Text style={styles.radioTit}>개인전문투자자</Text>
                <Text style={styles.radioTitP}>
                  총 투자 가능한도 <Text style={styles.radioTitPEm}>무제한</Text>
                </Text>
              </View>
              <Image
                source={require('../assets/images/arrow_select.png')}
                style={[
                  styles.radioArrow,
                  expandedGrade === '20' && styles.radioArrowExpanded,
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {expandedGrade === '20' && (
              <View style={styles.radioInCont}>
                <Text style={styles.radioContTit}>자격요건</Text>
                <Text style={styles.radioContStit}>[필수조건]</Text>
                <Text style={styles.radioContTxt}>
                  최근 5년 중 1년 이상의 기간동안{'\n'}
                  금융위원회가 정하여 고시하는 금융투자상품을{'\n'}
                  월말 평균잔고 기준으로{'\n'}
                  5,000만원 이상 보유
                </Text>
                <Text style={styles.radioContStit}>[선택조건]</Text>
                <Text style={styles.radioContTxt}>
                  세 가지 중 한 가지 충족 시{'\n'}
                  1. 본인의 연 소득 1억원 또는 배우자와의 연 소득{'\n'}
                  합계가 1억 5,000만원 이상{'\n'}
                  2. 거주 부동산, 임차보증금 및 총부채 금액을{'\n'}
                  차감한 총 자산이 5억원 이상{'\n'}
                  3. 금융 관련 전문가(1년 이상 종사)
                </Text>
                <Text style={styles.radioContTit}>투자한도</Text>
                <Text style={styles.radioContTxt}>
                  총 투자 가능한도 무제한{'\n'}
                  (*단, 연계대출 모집금액의 40% 이내)
                </Text>
                <Text style={styles.radioContTit}>증빙서류</Text>
                <Text style={styles.radioContTxt}>금융투자업자의 전문투자자 확인증</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.formFileupload}>
          <Text style={styles.subTitle12}>증빙 서류 제출</Text>
          
          <TouchableOpacity
            style={styles.fileuploadBox}
            onPress={handleFileSelect}
          >
            <Image 
              source={require('../assets/images/ico_fileupload.png')}
              style={styles.fileuploadIco}
              resizeMode="contain"
            />
            <Text style={styles.fileuploadTxt}>파일추가</Text>
          </TouchableOpacity>

          {selectedFiles.length > 0 && (
            <View style={styles.fileListContainer}>
              {selectedFiles.map((file) => (
                <View key={file.id} style={styles.filenameBox}>
                  <Text style={styles.filename} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.btnDel}
                    onPress={() => handleFileRemove(file.id)}
                  >
                    <Image
                      source={require('../assets/images/ico_del.png')}
                      style={styles.btnDelIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.txtNotif}>
          <Image
            source={require('../assets/images/ico_notif.png')}
            style={styles.txtNotifIcon}
            resizeMode="contain"
          />
          <Text style={styles.txtNotifText}>
            보안망으로 인하여 정상적으로 첨부가 되지 않을 경우 로그인 아이디를 포함하여 아래 고객센터 메일로 전달주시면 빠른 처리 진행하겠습니다.{'\n'}
            {'\n'}
            <Text style={styles.txtNotifMailto}>Email : cs@rootenery.co.kr</Text>
          </Text>
        </View>

        <View style={styles.btnBox}>
          <TouchableOpacity
            style={[styles.btnStyle, styles.btnCancel]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.btnCancelText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.btnStyle,
              styles.btnSubmit,
              isSubmitting && styles.btnSubmitDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.btnSubmitText}>
              {isSubmitting ? '처리 중입니다...' : '신청하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  subUsername: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginHorizontal: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    shadowColor: '#516c89',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subUsernameDt: {
    width: 92,
    marginRight: 12,
    color: '#666',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
  },
  subUsernameDd: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: '#222',
  },
  subTitle12: {
    marginTop: 26,
    paddingHorizontal: 20,
    color: '#666',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
  },
  radioList: {
    marginTop: 12,
  },
  radioListItem: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(224, 225, 226, 0.50)',
  },
  labelBox: {
    marginLeft: 20,
  },
  radioButton: {
    width: 21,
    height: 21,
    borderRadius: 10.5,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  radioButtonInner: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#2c3db8',
  },
  radioInHead: {
    flex: 1,
    position: 'relative',
    marginLeft: 16,
    paddingVertical: 16,
    paddingRight: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioInHeadContent: {
    flex: 1,
  },
  radioTit: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#222',
  },
  radioTitP: {
    marginTop: 6,
    color: '#666',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
  },
  radioTitPEm: {
    color: '#2c3db8',
  },
  radioArrow: {
    width: 18,
    height: 18,
    position: 'absolute',
    right: 12,
  },
  radioArrowExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  radioInCont: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(224, 225, 226, 0.50)',
  },
  radioContTit: {
    color: '#393f44',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    marginTop: 24,
  },
  radioContStit: {
    marginTop: 16,
    color: '#666',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  radioContTxt: {
    marginTop: 16,
    color: '#666',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
  },
  formFileupload: {
    marginTop: 30,
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
  fileuploadBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#bfc3c7',
    borderRadius: 10,
  },
  fileuploadIco: {
    width: 19,
    height: 25,
    backgroundColor: '#fff',
  },
  fileuploadTxt: {
    marginLeft: 15,
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
  },
  fileListContainer: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  filenameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    backgroundColor: 'rgba(246, 246, 246, 0.50)',
  },
  filename: {
    flex: 1,
    marginRight: 12,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#222',
  },
  btnDel: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDelIcon: {
    width: 20,
    height: 20,
  },
  txtNotif: {
    position: 'relative',
    paddingTop: 3,
    paddingLeft: 19,
    marginTop: 20,
    marginHorizontal: 20,
  },
  txtNotifIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 17,
    height: 17,
  },
  txtNotifText: {
    color: '#a3a7ab',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
  },
  txtNotifMailto: {
    color: '#666',
  },
  btnBox: {
    flexDirection: 'row',
    marginTop: 40,
    marginBottom: 50,
    paddingHorizontal: 16,
    gap: 8,
  },
  btnStyle: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancel: {
    borderWidth: 1,
    borderColor: '#e0e1e2',
    backgroundColor: '#fff',
  },
  btnCancelText: {
    color: '#a3a7ab',
    fontSize: 20,
    lineHeight: 48,
    fontWeight: '400',
  },
  btnSubmit: {
    backgroundColor: '#2c3db8',
  },
  btnSubmitDisabled: {
    backgroundColor: '#a3a7ab',
  },
  btnSubmitText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 48,
    fontWeight: '500',
  },
});

export default UpwardRequestScreen;

