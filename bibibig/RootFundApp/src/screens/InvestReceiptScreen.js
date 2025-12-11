import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import ApiService from '../services/api';

const InvestReceiptScreen = ({ navigation, route }) => {
  const { user, member_id, idx } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [receiptData, setReceiptData] = useState(null);
  const [saving, setSaving] = useState(false);
  const viewShotRef = useRef(null);

  useEffect(() => {
    loadReceiptData();
  }, []);

  const loadReceiptData = async () => {
    setLoading(true);
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      
      if (!memberId) {
        Alert.alert('오류', '회원 정보를 찾을 수 없습니다.');
        navigation.goBack();
        return;
      }

      if (!idx) {
        Alert.alert('오류', '투자 정보가 없습니다.');
        navigation.goBack();
        return;
      }

      const response = await ApiService.api.post('/app/my/invest/receipt', {
        member_id: memberId,
        idx: idx,
      });

      if (response.data) {
        const rtnvalue = response.data.rtnvalue || response.data.rtnvalue;
        
        if (rtnvalue === '0' || rtnvalue === 0) {
          setReceiptData(response.data);
        } else {
          let errorMessage = '원리금수취권 증서를 불러올 수 없습니다.';
          switch (rtnvalue) {
            case '1':
              errorMessage = '회원 정보가 없습니다.';
              break;
            case '2':
              errorMessage = '투자 정보가 없습니다.';
              break;
            case '3':
              errorMessage = '투자 정보를 찾을 수 없습니다.';
              break;
            case '4':
              errorMessage = '본인의 투자가 아닙니다.';
              break;
          }
          Alert.alert('오류', errorMessage, [
            { text: '확인', onPress: () => navigation.goBack() }
          ]);
        }
      }
    } catch (error) {
      console.error('원리금수취권 증서 조회 실패:', error);
      Alert.alert('오류', '원리금수취권 증서를 불러오는 중 오류가 발생했습니다.', [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '0';
    const stringValue = typeof value === 'string' ? value : String(value);
    const numericValue = stringValue.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    let dateOnly = dateString.split(' ')[0].split('T')[0];
    
    if (dateOnly.includes('-')) {
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        const year = parts[0].slice(-2);
        const month = parts[1];
        const day = parts[2];
        return `${year}.${month}.${day}`;
      }
    }
    
    if (dateOnly.length === 8 && /^\d+$/.test(dateOnly)) {
      const year = dateOnly.slice(2, 4);
      const month = dateOnly.slice(4, 6);
      const day = dateOnly.slice(6, 8);
      return `${year}.${month}.${day}`;
    }
    
    return dateOnly;
  };

  const formatDateFull = (dateString) => {
    if (!dateString) return '';
    
    let dateOnly = dateString.split(' ')[0].split('T')[0];
    
    if (dateOnly.includes('-')) {
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        return `${year}년 ${month}월 ${day}일`;
      }
    }
    
    if (dateOnly.length === 8 && /^\d+$/.test(dateOnly)) {
      const year = dateOnly.slice(0, 4);
      const month = dateOnly.slice(4, 6);
      const day = dateOnly.slice(6, 8);
      return `${year}년 ${month}월 ${day}일`;
    }
    
    return dateOnly;
  };

  const getRepayTypeText = (repayType) => {
    switch (repayType) {
      case '1':
        return '원금균등상환';
      case '2':
        return '만기일시상환';
      case '3':
        return '원리금균등상환';
      case '4':
        return '기간상환';
      default:
        return repayType || '-';
    }
  };

  const getInterestPayDate = (sort) => {
    switch (sort) {
      case 'bridge':
        return '매 1개월마다 말일';
      case 'pf':
        return '매 3개월마다 말일';
      default:
        return '매 3개월마다';
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: '저장 권한',
            message: '이미지를 저장하기 위해 저장 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '취소',
            buttonPositive: '확인',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else {
          Alert.alert('권한 필요', '이미지를 저장하려면 저장 권한이 필요합니다.');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleSaveImage = async () => {
    if (!viewShotRef.current) {
      Alert.alert('오류', '이미지를 캡처할 수 없습니다.');
      return;
    }

    try {
      setSaving(true);
      
      // Android 권한 요청
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        setSaving(false);
        return;
      }

      // View를 이미지로 캡처
      const uri = await viewShotRef.current.capture();
      
      if (!uri) {
        throw new Error('이미지 캡처 실패');
      }

      // 파일명 생성 (증서번호 또는 날짜 기반)
      const receiptNum = receiptData?.receipt_num || `receipt_${idx || 'unknown'}`;
      const fileName = `${receiptNum.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.png`;
      
      // 저장 경로 설정
      const downloadPath = Platform.select({
        ios: `${RNFS.DocumentDirectoryPath}/${fileName}`,
        android: `${RNFS.PicturesDirectoryPath}/${fileName}`,
      });

      // 파일 복사
      await RNFS.copyFile(uri, downloadPath);

      // Android의 경우 갤러리에 추가
      if (Platform.OS === 'android') {
        const MediaStore = require('react-native').NativeModules.MediaStore || null;
        if (MediaStore) {
          await MediaStore.addImageToGallery(downloadPath, fileName);
        }
      }

      Alert.alert(
        '저장 완료',
        `이미지가 저장되었습니다.\n${Platform.OS === 'ios' ? '파일 앱에서 확인하실 수 있습니다.' : '갤러리에서 확인하실 수 있습니다.'}`,
        [{ text: '확인' }]
      );
    } catch (error) {
      console.error('이미지 저장 오류:', error);
      Alert.alert('오류', '이미지 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3db8" />
        </View>
      </View>
    );
  }

  if (!receiptData) {
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
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>증서 정보를 불러올 수 없습니다.</Text>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headTitle}>원리금수취권 증서</Text>
        <TouchableOpacity 
          style={styles.btnDownload}
          onPress={handleSaveImage}
          disabled={saving || !receiptData}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.btnDownloadText}>다운로드</Text>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1.0 }}
          style={styles.viewShotContainer}
        >
          <View style={styles.receiptA4Container}>
            {/* 증서 외곽 테두리 */}
            <View style={styles.receiptBorder}>
            {/* 상단 여백 */}
            <View style={styles.receiptSpacer} />
            
            {/* 제목 */}
            <View style={styles.receiptTitleContainer}>
              <Text style={styles.receiptMainTitle}>원리금수취권 증서</Text>
            </View>
            
            <View style={styles.receiptSpacerSmall} />
            
            {/* 상품명 */}
            <View style={styles.receiptProductNameBox}>
              <Text style={styles.receiptProductNameLabel}>상품명</Text>
              <Text style={styles.receiptProductNameValue}>
                {receiptData.prod?.orderName || receiptData.prod?.r_name || '-'}
              </Text>
            </View>
            
            {/* 구분선 */}
            <View style={styles.receiptDividerThick} />
            
            {/* 상품 정보 테이블 */}
            <View style={styles.receiptInfoTable}>
              <View style={styles.receiptTableRow}>
                <View style={styles.receiptTableCell}>
                  <Text style={styles.receiptTableCellLabel}>연수익률{'\n'}(세전)</Text>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={styles.receiptTableCellText}>
                    {receiptData.prod?.rate || '-'}%
                  </Text>
                </View>
                <View style={styles.receiptTableCellSpacer} />
                <View style={styles.receiptTableCell}>
                  <Text style={styles.receiptTableCellLabel}>모집금액</Text>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={styles.receiptTableCellText}>
                    {formatCurrency(receiptData.prod?.investment || receiptData.prod?.price || 0)}원
                  </Text>
                </View>
              </View>
              <View style={styles.receiptTableDivider} />
              <View style={styles.receiptTableRow}>
                <View style={styles.receiptTableCell}>
                  <Text style={styles.receiptTableCellLabel}>상환기간</Text>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={styles.receiptTableCellText}>
                    {receiptData.prod?.period_text || (receiptData.prod?.period ? `${receiptData.prod.period}개월` : '-')}
                  </Text>
                </View>
                <View style={styles.receiptTableCellSpacer} />
                <View style={styles.receiptTableCell}>
                  <Text style={styles.receiptTableCellLabel}>상환방식</Text>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={styles.receiptTableCellText}>
                    {getRepayTypeText(receiptData.prod?.repay_type)}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* 구분선 */}
            <View style={styles.receiptDividerThick} />
            
            {/* 투자자 정보 테이블 */}
            <View style={styles.receiptInfoTable}>
              <View style={styles.receiptTableRow}>
                <View style={styles.receiptTableCell}>
                  <Text style={styles.receiptTableCellLabel}>원리금{'\n'}수취권자</Text>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={styles.receiptTableCellText}>
                    {receiptData.member?.r_name || receiptData.member?.name || receiptData.member?.member_name || '-'}
                  </Text>
                </View>
                <View style={styles.receiptTableCellSpacer} />
                <View style={styles.receiptTableCell}>
                  <Text style={styles.receiptTableCellLabel}>계정</Text>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={[styles.receiptTableCellText, styles.receiptTableCellTextBreak]}>
                    {receiptData.member?.web_id || receiptData.member?.email || '-'}
                  </Text>
                </View>
              </View>
              <View style={styles.receiptTableDivider} />
              <View style={styles.receiptTableRow}>
                <View style={styles.receiptTableCell}>
                  <Text style={styles.receiptTableCellLabel}>투자금액</Text>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={styles.receiptTableCellText}>
                    {formatCurrency(receiptData.invest?.price || 0)}원
                  </Text>
                </View>
                <View style={styles.receiptTableCellSpacer} />
                <View style={styles.receiptTableCell}>
                  <View style={styles.receiptTableCellLabelWithNote}>
                    <Text style={styles.receiptTableCellLabel}>
                      총 수익<Text style={styles.receiptNoteNumberInline}>3)</Text>
                    </Text>
                    <Text style={styles.receiptTableCellLabelNote}>(예상, 세금 및 수수료 포함)</Text>
                  </View>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={styles.receiptTableCellText}>
                    {formatCurrency(receiptData.repays?.interest || 0)}원
                  </Text>
                </View>
              </View>
              <View style={styles.receiptTableDivider} />
              <View style={styles.receiptTableRow}>
                <View style={styles.receiptTableCell}>
                  <Text style={styles.receiptTableCellLabel}>총 세금{'\n'}(예상)</Text>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={styles.receiptTableCellText}>
                    {formatCurrency((receiptData.repays?.i_tax || 0) + (receiptData.repays?.r_tax || 0))}원
                  </Text>
                </View>
                <View style={styles.receiptTableCellSpacer} />
                <View style={styles.receiptTableCell}>
                  <Text style={styles.receiptTableCellLabel}>총 수수료{'\n'}(예상)</Text>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={styles.receiptTableCellText}>
                    {formatCurrency(receiptData.repays?.i_commission || 0)}원
                  </Text>
                </View>
              </View>
              <View style={styles.receiptTableDivider} />
              <View style={styles.receiptTableRow}>
                <View style={styles.receiptTableCell}>
                  <Text style={styles.receiptTableCellLabel}>투자 신청일</Text>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={styles.receiptTableCellText}>
                    {receiptData.invest?.recordtime || formatDate(receiptData.invest?.invest_date || receiptData.invest?.regdate) || '-'}
                  </Text>
                </View>
                <View style={styles.receiptTableCellSpacer} />
                <View style={styles.receiptTableCell}>
                  <Text style={styles.receiptTableCellLabel}>
                    투자원금 상환일<Text style={styles.receiptNoteNumberInline}>1)</Text>
                  </Text>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={styles.receiptTableCellText}>
                    {receiptData.repays?.end_date || '-'}
                  </Text>
                </View>
              </View>
              <View style={styles.receiptTableDivider} />
              <View style={styles.receiptTableRow}>
                <View style={styles.receiptTableCell}>
                  <Text style={styles.receiptTableCellLabel}>
                    이자 지급일<Text style={styles.receiptNoteNumberInline}>2)</Text>
                  </Text>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={styles.receiptTableCellText}>
                    {getInterestPayDate(receiptData.invest?.sort || receiptData.prod?.sort)}
                  </Text>
                </View>
                <View style={styles.receiptTableCellSpacer} />
                <View style={styles.receiptTableCell}>
                  <Text style={styles.receiptTableCellLabel}>투자 기간</Text>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={styles.receiptTableCellText}>
                    {receiptData.repays?.start_date || '-'}{'\n'}~{receiptData.repays?.end_date || '-'}
                  </Text>
                </View>
              </View>
              <View style={styles.receiptTableDivider} />
              <View style={styles.receiptTableRow}>
                <View style={styles.receiptTableCell}>
                  <Text style={styles.receiptTableCellLabel}>수익권발행자</Text>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={styles.receiptTableCellText}>루트인프라금융㈜</Text>
                </View>
                <View style={styles.receiptTableCellSpacer} />
                <View style={styles.receiptTableCell}>
                  <Text style={styles.receiptTableCellLabel}>수익권판매자</Text>
                </View>
                <View style={styles.receiptTableCellValue}>
                  <Text style={styles.receiptTableCellText}>루트인프라금융㈜</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.receiptSpacerSmall} />
            
            {/* 각주 및 주의사항 */}
            <View style={styles.receiptNotesContainer}>
              <View style={styles.receiptNoteItem}>
                <Text style={styles.receiptNoteNumber}>1)</Text>
                <Text style={styles.receiptNoteText}>
                  투자 수익 지급일은 대출자 상환일의 익영업일이 됩니다.
                </Text>
              </View>
              <View style={styles.receiptNoteItem}>
                <Text style={styles.receiptNoteNumber}>2)</Text>
                <Text style={styles.receiptNoteText}>
                  투자원금상환일에도 상환한다.
                </Text>
              </View>
              <View style={styles.receiptNoteItem}>
                <Text style={styles.receiptNoteNumber}>3)</Text>
                <Text style={styles.receiptNoteText}>
                  총 수익의 원천징수 세액기준은 온라인투자연계금융업 및 이용자 보호에 관한 법률에 따라 15.4% 적용
                </Text>
              </View>
              
              <View style={styles.receiptSpacerSmall} />
              
              <Text style={styles.receiptWarningText}>
                - 본 상품의 중도상환 발생 시, 연 이자의 일할 계산이 적용되므로 명시된 예상 수익금액과 실 수령금액의 차이가 발생할 수 있습니다.
              </Text>
              <Text style={styles.receiptWarningText}>
                - 본 상품의 연체 발생 시, 대출약정서에 따른 연체가산이자율이 적용됩니다.
              </Text>
              <Text style={styles.receiptWarningText}>
                (연체가산이자율 : 2019.6.25. 부터 금융위원회의 고시에 따라 연체가산이자율은 연 3%가 적용됩니다.)
              </Text>
              <Text style={styles.receiptWarningText}>
                - 본 수익권 증서는 고객님이 동의하신 투자이용약관에 의거한 원리금수취권 증서로서, 본 투자상품은 원금 보장이 되지 않으며 예금자 보호대상이 아닙니다.
              </Text>
            </View>
            
            <View style={styles.receiptSpacerSmall} />
            
            {/* 하단 안내문 */}
            <View style={styles.receiptFooterContainer}>
              <Text style={styles.receiptFooterText}>
                원리금 수취권 계약에 따라 권리증명을 위해 본 증서를 제공합니다.
              </Text>
            </View>
            
            <View style={styles.receiptSpacerSmall} />
            
            {/* 발행일 및 회사명 */}
            <View style={styles.receiptSignatureContainer}>
              <Text style={styles.receiptSignatureDate}>
                {receiptData.prod?.r_loan_date2 ? formatDateFull(receiptData.prod.r_loan_date2) : formatDateFull(new Date().toISOString().split('T')[0])}
              </Text>
              <Text style={styles.receiptSignatureCompany}>루트인프라금융㈜</Text>
            </View>
            
            <View style={styles.receiptSpacer} />
            </View>
          </View>
        </ViewShot>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headCon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  btnBack: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  btnDownload: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2c3db8',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  btnDownloadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewShotContainer: {
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  receiptA4Container: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  receiptBorder: {
    borderWidth: 3,
    borderColor: '#2c40a0',
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
  },
  receiptSpacer: {
    height: 10,
  },
  receiptSpacerSmall: {
    height: 5,
  },
  receiptTitleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  receiptMainTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#2c40a0',
  },
  receiptProductNameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f5ff',
    paddingVertical: 7,
    paddingHorizontal: 80,
    borderRadius: 20,
    marginBottom: 10,
  },
  receiptProductNameLabel: {
    fontSize: 13,
    color: '#2c40a0',
  },
  receiptProductNameValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c40a0',
    marginLeft: 70,
  },
  receiptDividerThick: {
    height: 2,
    backgroundColor: '#2c40a0',
    marginVertical: 5,
  },
  receiptInfoTable: {
    width: '100%',
  },
  receiptTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
    paddingVertical: 8,
  },
  receiptTableCell: {
    width: 125,
    justifyContent: 'center',
  },
  receiptTableCellLabel: {
    fontSize: 11,
    color: '#2c40a0',
    lineHeight: 16,
  },
  receiptTableCellLabelWithNote: {
    justifyContent: 'center',
  },
  receiptTableCellLabelNote: {
    fontSize: 9,
    color: '#2c40a0',
    lineHeight: 12,
  },
  receiptTableCellValue: {
    width: 135,
    alignItems: 'flex-end',
    paddingRight: 5,
  },
  receiptTableCellText: {
    fontSize: 11,
    color: '#2c40a0',
    lineHeight: 16,
    textAlign: 'right',
  },
  receiptTableCellTextBreak: {
    flexWrap: 'wrap',
  },
  receiptTableCellSpacer: {
    width: 50,
  },
  receiptTableDivider: {
    height: 1,
    backgroundColor: '#2c40a0',
    marginVertical: 0,
  },
  receiptNoteNumberInline: {
    fontSize: 8,
    color: '#2c40a0',
    position: 'absolute',
    top: -2,
  },
  receiptNotesContainer: {
    paddingLeft: 10,
    marginTop: 12,
  },
  receiptNoteItem: {
    flexDirection: 'row',
    marginTop: 3,
    paddingLeft: 10,
  },
  receiptNoteNumber: {
    fontSize: 11,
    color: '#2c40a0',
    marginRight: 4,
    width: 15,
  },
  receiptNoteText: {
    fontSize: 11,
    color: '#2c40a0',
    lineHeight: 16,
    flex: 1,
  },
  receiptWarningText: {
    fontSize: 11,
    color: '#2c40a0',
    lineHeight: 16,
    marginTop: 5,
  },
  receiptFooterContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  receiptFooterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2c40a0',
    textAlign: 'center',
  },
  receiptSignatureContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  receiptSignatureDate: {
    fontSize: 14,
    color: '#2c40a0',
    marginBottom: 15,
  },
  receiptSignatureCompany: {
    fontSize: 18,
    color: '#2c40a0',
    fontWeight: '600',
  },
});

export default InvestReceiptScreen;

