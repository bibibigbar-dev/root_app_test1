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

const InvestCertifyScreen = ({ navigation, route }) => {
  const { user, member_id, idx } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [certifyData, setCertifyData] = useState(null);
  const [saving, setSaving] = useState(false);
  const viewShotRef = useRef(null);

  useEffect(() => {
    loadCertifyData();
  }, []);

  const calculateInterest = (data) => {
    try {
      const sort = data.prod?.sort || data.invest?.sort || '';
      const rate = Number(data.prod?.rate || 0);
      const price = Number(data.invest?.price || 0);
      const period = Number(data.prod?.period || 0);
      const orderNumber = data.prod?.orderNumber || '';
      
      // 수수료 및 세율 (option에서 가져오거나 기본값 사용)
      const comm = Number(data.option?.i_comm_1 || 0);
      const i_tax_per = Number(data.option?.i_tax || 15.4);
      const r_tax_per = Number(data.option?.r_tax || 0);
      
      const d_rate = (rate / 100) / 365;
      const d_comm = (comm / 100) / 365;
      
      let t_int = 0;
      let t_tax = 0;
      let t_comm = 0;
      let t_bal = price;
      
      const rp_1_rp = Math.floor(t_bal / period);
      let start_date = new Date();
      
      for (let i = 1; i <= period; i++) {
        let end_date = new Date(start_date);
        
        // 상환 주기 계산
        if (sort.toLowerCase() === 'bridge') {
          end_date.setMonth(end_date.getMonth() + 1);
        } else if (sort.toLowerCase() === 'pf') {
          end_date.setMonth(end_date.getMonth() + 3);
        } else {
          // 특정 상품번호는 6개월, 나머지는 3개월
          const sixMonthProducts = ['R000278', 'R000280', 'R000281', 'R000282', 'R000286', 'R000287', 'R000288'];
          if (sixMonthProducts.includes(orderNumber)) {
            end_date.setMonth(end_date.getMonth() + 6);
          } else {
            end_date.setMonth(end_date.getMonth() + 3);
          }
        }
        
        // 날짜 차이 계산
        const diff_dt = Math.floor((end_date - start_date) / (1000 * 60 * 60 * 24)) - 1;
        
        // 원금 상환액
        let rp = 0;
        const repay_type = data.prod?.repay_type;
        if (i === period) {
          rp = t_bal;
        } else {
          if (repay_type === '1') {
            rp = rp_1_rp;
          }
        }
        
        // 이자 계산
        const ri = (t_bal * d_rate) * diff_dt;
        
        // 세금 계산
        const rti = Math.floor((ri * (i_tax_per / 100)) / 10) * 10;
        const rtr = Math.floor((ri * (r_tax_per / 100)) / 10) * 10;
        
        // 수수료 계산
        const rc = (price * d_comm) * diff_dt;
        
        // 누적
        t_int += Math.floor(ri);
        t_tax += (rti + rtr);
        t_comm += Math.floor(rc);
        t_bal = t_bal - Math.floor(rp);
        
        start_date = end_date;
      }
      
      return {
        totalInterest: Math.floor(t_int),
        totalTax: Math.floor(t_tax),
        totalCommission: Math.floor(t_comm),
      };
    } catch (error) {
      console.error('이자 계산 오류:', error);
      return {
        totalInterest: 0,
        totalTax: 0,
        totalCommission: 0,
      };
    }
  };

  const loadCertifyData = async () => {
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

      const response = await ApiService.api.post('/app/my/invest/investCertify', {
        member_id: memberId,
        idx: idx,
      });

      if (response.data) {
        const rtnvalue = response.data.rtnvalue || response.data.rtnvalue;

        if (rtnvalue === '0' || rtnvalue === 0) {
          // 이자 계산
          const calculated = calculateInterest(response.data);
          
          // 계산된 값을 데이터에 추가
          const dataWithCalculation = {
            ...response.data,
            calculated: calculated,
          };
          
          setCertifyData(dataWithCalculation);
        } else {
          let errorMessage = '투자 확인서를 불러올 수 없습니다.';
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
            { text: '확인', onPress: () => navigation.goBack() },
          ]);
        }
      }
    } catch (error) {
      console.error('투자 확인서 조회 실패:', error);
      Alert.alert(
        '오류',
        '투자 확인서를 불러오는 중 오류가 발생했습니다.',
        [{ text: '확인', onPress: () => navigation.goBack() }],
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = value => {
    if (!value) return '0';
    const stringValue = typeof value === 'string' ? value : String(value);
    const numericValue = stringValue.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDate = dateString => {
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

  const formatDateFull = dateString => {
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

  const getRepayTypeText = repayType => {
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

  const getInterestPayDate = sort => {
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
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else {
          Alert.alert(
            '권한 필요',
            '이미지를 저장하려면 저장 권한이 필요합니다.',
          );
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

      // 파일명 생성
      const fileName = `invest_certify_${idx || 'unknown'}_${new Date().getTime()}.png`;

      // 저장 경로 설정
      const downloadPath = Platform.select({
        ios: `${RNFS.DocumentDirectoryPath}/${fileName}`,
        android: `${RNFS.PicturesDirectoryPath}/${fileName}`,
      });

      // 파일 복사
      await RNFS.copyFile(uri, downloadPath);

      // Android의 경우 갤러리에 추가
      if (Platform.OS === 'android') {
        const MediaStore =
          require('react-native').NativeModules.MediaStore || null;
        if (MediaStore) {
          await MediaStore.addImageToGallery(downloadPath, fileName);
        }
      }

      Alert.alert(
        '저장 완료',
        `이미지가 저장되었습니다.\n${
          Platform.OS === 'ios'
            ? '파일 앱에서 확인하실 수 있습니다.'
            : '갤러리에서 확인하실 수 있습니다.'
        }`,
        [{ text: '확인' }],
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

  if (!certifyData) {
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
          <Text style={styles.emptyText}>투자 확인서 정보를 불러올 수 없습니다.</Text>
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
        <TouchableOpacity
          style={styles.btnDownload}
          onPress={handleSaveImage}
          disabled={saving || !certifyData}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.btnDownloadText}>다운로드</Text>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1.0 }}
          style={styles.viewShotContainer}
        >
          <View style={styles.certifyA4Container}>
            {/* 확인서 외곽 테두리 */}
            <View style={styles.certifyBorder}>
              {/* 상단 여백 */}
              <View style={styles.certifySpacer} />

              {/* 제목 */}
              <View style={styles.certifyTitleContainer}>
                <Text style={styles.certifyMainTitle}>투자 확인서</Text>
              </View>

              <View style={styles.certifySpacerSmall} />

              {/* 상품명 */}
              <View style={styles.certifyProductNameBox}>
                <Text style={styles.certifyProductNameLabel}>상품명</Text>
                <Text style={styles.certifyProductNameValue}>
                  {certifyData.prod?.orderName ||
                    certifyData.prod?.r_name ||
                    '-'}
                </Text>
              </View>

              {/* 구분선 */}
              <View style={styles.certifyDividerThick} />

              {/* 상품 정보 테이블 */}
              <View style={styles.certifyInfoTable}>
                <View style={styles.certifyTableRow}>
                  <View style={styles.certifyTableCell}>
                    <Text style={styles.certifyTableCellLabel}>
                      연수익률{'\n'}(세전)
                    </Text>
                  </View>
                  <View style={styles.certifyTableCellValue}>
                    <Text style={styles.certifyTableCellText}>
                      {certifyData.prod?.rate || '-'}%
                    </Text>
                  </View>
                  <View style={styles.certifyTableCellSpacer} />
                  <View style={styles.certifyTableCell}>
                    <Text style={styles.certifyTableCellLabel}>모집금액</Text>
                  </View>
                  <View style={styles.certifyTableCellValue}>
                    <Text style={styles.certifyTableCellText}>
                      {formatCurrency(
                        certifyData.prod?.investment ||
                          certifyData.prod?.price ||
                          0,
                      )}
                      원
                    </Text>
                  </View>
                </View>
                <View style={styles.certifyTableDivider} />
                <View style={styles.certifyTableRow}>
                  <View style={styles.certifyTableCell}>
                    <Text style={styles.certifyTableCellLabel}>상환기간</Text>
                  </View>
                  <View style={styles.certifyTableCellValue}>
                    <Text style={styles.certifyTableCellText}>
                      {certifyData.prod?.period_text ||
                        (certifyData.prod?.period
                          ? `${certifyData.prod.period}개월`
                          : '-')}
                    </Text>
                  </View>
                  <View style={styles.certifyTableCellSpacer} />
                  <View style={styles.certifyTableCell}>
                    <Text style={styles.certifyTableCellLabel}>상환방식</Text>
                  </View>
                  <View style={styles.certifyTableCellValue}>
                    <Text style={styles.certifyTableCellText}>
                      {getRepayTypeText(certifyData.prod?.repay_type)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 구분선 */}
              <View style={styles.certifyDividerThick} />

              {/* 투자자 정보 테이블 */}
              <View style={styles.certifyInfoTable}>
                <View style={styles.certifyTableRow}>
                  <View style={styles.certifyTableCell}>
                    <Text style={styles.certifyTableCellLabel}>투자자</Text>
                  </View>
                  <View style={styles.certifyTableCellValue}>
                    <Text style={styles.certifyTableCellText}>
                      {certifyData.member?.r_name ||
                        certifyData.member?.name ||
                        certifyData.member?.member_name ||
                        '-'}
                    </Text>
                  </View>
                  <View style={styles.certifyTableCellSpacer} />
                  <View style={styles.certifyTableCell}>
                    <Text style={styles.certifyTableCellLabel}>계정</Text>
                  </View>
                  <View style={styles.certifyTableCellValue}>
                    <Text
                      style={[
                        styles.certifyTableCellText,
                        styles.certifyTableCellTextBreak,
                      ]}
                    >
                      {certifyData.member?.web_id ||
                        certifyData.member?.email ||
                        '-'}
                    </Text>
                  </View>
                </View>
                <View style={styles.certifyTableDivider} />
                <View style={styles.certifyTableRow}>
                  <View style={styles.certifyTableCell}>
                    <Text style={styles.certifyTableCellLabel}>투자금액</Text>
                  </View>
                  <View style={styles.certifyTableCellValue}>
                    <Text style={styles.certifyTableCellText}>
                      {formatCurrency(certifyData.invest?.price || 0)}원
                    </Text>
                  </View>
                  <View style={styles.certifyTableCellSpacer} />
                  <View style={styles.certifyTableCell}>
                    <View style={styles.certifyTableCellLabelWithNote}>
                      <Text style={styles.certifyTableCellLabel}>예상 총 수익</Text>
                      <Text style={styles.certifyTableCellLabelNote}>
                        (세금 및 수수료 포함)
                      </Text>
                    </View>
                  </View>
                  <View style={styles.certifyTableCellValue}>
                    <Text style={styles.certifyTableCellText}>
                      {formatCurrency(certifyData.calculated?.totalInterest || 0)}원
                    </Text>
                  </View>
                </View>
                <View style={styles.certifyTableDivider} />
                <View style={styles.certifyTableRow}>
                  <View style={styles.certifyTableCell}>
                    <Text style={styles.certifyTableCellLabel}>
                      예상 총 세금
                    </Text>
                  </View>
                  <View style={styles.certifyTableCellValue}>
                    <Text style={styles.certifyTableCellText}>
                      {formatCurrency(certifyData.calculated?.totalTax || 0)}원
                    </Text>
                  </View>
                  <View style={styles.certifyTableCellSpacer} />
                  <View style={styles.certifyTableCell}>
                    <Text style={styles.certifyTableCellLabel}>
                      예상 총 수수료
                    </Text>
                  </View>
                  <View style={styles.certifyTableCellValue}>
                    <Text style={styles.certifyTableCellText}>
                      {formatCurrency(certifyData.calculated?.totalCommission || 0)}원
                    </Text>
                  </View>
                </View>
                <View style={styles.certifyTableDivider} />
                <View style={styles.certifyTableRow}>
                  <View style={styles.certifyTableCell}>
                    <Text style={styles.certifyTableCellLabel}>
                      투자 신청일
                    </Text>
                  </View>
                  <View style={styles.certifyTableCellValue}>
                    <Text style={styles.certifyTableCellText}>
                      {certifyData.invest?.recordtime ||
                        formatDate(
                          certifyData.invest?.invest_date ||
                            certifyData.invest?.regdate,
                        ) ||
                        '-'}
                    </Text>
                  </View>
                  <View style={styles.certifyTableCellSpacer} />
                  <View style={styles.certifyTableCell}>
                    <Text style={styles.certifyTableCellLabel}>
                      이자 지급일
                    </Text>
                  </View>
                  <View style={styles.certifyTableCellValue}>
                    <Text style={styles.certifyTableCellText}>
                      {getInterestPayDate(
                        certifyData.invest?.sort || certifyData.prod?.sort,
                      )}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 구분선 */}
              <View style={styles.certifyDividerThick} />

              <View style={styles.certifySpacerSmall} />

              {/* 각주 및 주의사항 */}
              <View style={styles.certifyNotesContainer}>
                <View style={styles.certifyNoteItem}>
                  <Text style={styles.certifyNoteText}>
                    - 투자자는 투자금 모집이 완료되기 전까지 당사의 온라인 플랫폼에서 투자신청을 철회하고 투자금을 반환받을 수 있습니다. 단, 투자금 모집이 완료된 이후에는 투자신청을 철회할 수 없습니다.
                  </Text>
                </View>

                <View style={styles.certifySpacerSmall} />

                <View style={styles.certifyNoteItem}>
                  <Text style={styles.certifyNoteText}>
                    - 투자금 모집이 완료된 후에는 대출채권에 대한 원리금수취권 증서를 온라인 플랫폼에서 발급받을 수 있습니다.
                  </Text>
                </View>

                <View style={styles.certifySpacerSmall} />

                <View style={styles.certifyNoteItem}>
                  <Text style={styles.certifyNoteText}>
                    - 투자금 모집 중에 투자자가 투자신청을 철회하거나 당사에서 투자신청 철회를 확인하였을 경우, 본 확인서는 효력을 상실합니다.
                  </Text>
                </View>

                <View style={styles.certifySpacerSmall} />

                <View style={styles.certifyNoteItem}>
                  <Text style={styles.certifyNoteText}>
                    - 본 확인서는 투자자가 상기 투자상품에 투자하였음을 확인하기 위한 서류로 다른 용도로는 사용할 수 없습니다.
                  </Text>
                </View>
              </View>

              <View style={styles.certifySpacerSmall} />
              <View style={styles.certifySpacerSmall} />

              {/* 하단 안내문 */}
              <View style={styles.certifyFooterContainer}>
                <Text style={styles.certifyFooterText}>
                  투자신청 확인요청에 따라 본 확인서를 제공합니다.
                </Text>
              </View>

              <View style={styles.certifySpacerSmall} />

              {/* 발행일 및 회사명 */}
              <View style={styles.certifySignatureContainer}>
                <Text style={styles.certifySignatureDate}>
                  {certifyData.prod?.r_loan_date2
                    ? formatDateFull(certifyData.prod.r_loan_date2)
                    : formatDateFull(new Date().toISOString().split('T')[0])}
                </Text>
                <View style={styles.certifySignatureRow}>
                  <Text style={styles.certifySignatureCompany}>
                    루트인프라금융㈜
                  </Text>
                  <Image
                    source={require('../assets/images/rootfund_stamp.png')}
                    style={styles.certifyStampImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <View style={styles.certifySpacer} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
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
  certifyA4Container: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingBottom: 10,
    marginBottom: 40,
  },
  certifyBorder: {
    borderWidth: 3,
    borderColor: '#2c40a0',
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
  },
  certifySpacer: {
    height: 10,
  },
  certifySpacerSmall: {
    height: 5,
  },
  certifyTitleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  certifyMainTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#2c40a0',
  },
  certifyProductNameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f5ff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 20,
    marginBottom: 10,
  },
  certifyProductNameLabel: {
    fontSize: 13,
    color: '#2c40a0',
    minWidth: 20,
  },
  certifyProductNameValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#2c40a0',
    marginLeft: 20,
  },
  certifyDividerThick: {
    height: 2,
    backgroundColor: '#2c40a0',
    marginVertical: 5,
  },
  certifyInfoTable: {
    width: '100%',
  },
  certifyTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    minHeight: 42,
    paddingVertical: 8,
  },
  certifyTableCell: {
    width: 70,
    minHeight: 27,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  certifyTableCellLabel: {
    fontSize: 10,
    color: '#2c40a0',
    lineHeight: 14,
  },
  certifyTableCellLabelWithNote: {
    justifyContent: 'center',
  },
  certifyTableCellLabelNote: {
    fontSize: 9,
    color: '#2c40a0',
    lineHeight: 12,
  },
  certifyTableCellValue: {
    width: 80,
    minHeight: 27,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  certifyTableCellText: {
    fontSize: 10,
    color: '#2c40a0',
    lineHeight: 14,
    textAlign: 'right',
  },
  certifyTableCellTextBreak: {
    flexWrap: 'wrap',
  },
  certifyTableCellSpacer: {
    width: 30,
  },
  certifyTableDivider: {
    height: 1,
    backgroundColor: '#2c40a0',
    marginVertical: 0,
  },
  certifyNotesContainer: {
    paddingLeft: 10,
    marginTop: 12,
  },
  certifyNoteItem: {
    flexDirection: 'row',
    marginTop: 3,
    paddingLeft: 10,
  },
  certifyNoteText: {
    fontSize: 11,
    color: '#2c40a0',
    lineHeight: 16,
    flex: 1,
  },
  certifyWarningText: {
    fontSize: 11,
    color: '#2c40a0',
    lineHeight: 16,
    marginTop: 5,
  },
  certifyFooterContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  certifyFooterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2c40a0',
    textAlign: 'center',
  },
  certifySignatureContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  certifySignatureDate: {
    fontSize: 14,
    color: '#2c40a0',
    marginBottom: 15,
  },
  certifySignatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certifySignatureCompany: {
    fontSize: 18,
    color: '#2c40a0',
    fontWeight: '600',
  },
  certifyStampImage: {
    width: 50,
    height: 50,
    marginLeft: 20,
    opacity: 0.5,
  },
});

export default InvestCertifyScreen;

