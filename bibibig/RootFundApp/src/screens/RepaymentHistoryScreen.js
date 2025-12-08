import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import RNFS from 'react-native-fs';
import ApiService from '../services/api';

const RepaymentHistoryScreen = ({ navigation, route }) => {
  const { user, member_id } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [repaymentData, setRepaymentData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  const currentYear = new Date().getFullYear();
  const startYear = 2019;
  const years = [];
  for (let i = currentYear; i >= startYear; i--) {
    years.push(i);
  }

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadRepaymentData();
    }
  }, [selectedYear, currentUser]);

  const loadUserData = async () => {
    try {
      if (!user) {
        const userData = await ApiService.getCurrentUser();
        if (userData) {
          setCurrentUser(userData);
        }
      } else {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
    }
  };

  const loadRepaymentData = async () => {
    setLoading(true);
    try {
      const memberId = member_id || currentUser?.session?.member_id || currentUser?.id;
      
      // GET 요청으로 쿼리 파라미터 전송
      const response = await ApiService.api.get('/app/my/repayment', {
        params: {
          member_id: memberId,
          cur_yyyy: selectedYear
        }
      });

      console.log('연도별 지급액 내역 응답:', response.data);

      // 응답 데이터 처리
      if (response.data && response.data.repayment) {
        setRepaymentData(response.data.repayment);
      } else if (Array.isArray(response.data)) {
        setRepaymentData(response.data);
      } else {
        setRepaymentData([]);
      }
    } catch (error) {
      console.error('연도별 지급액 내역 조회 실패:', error);
      Alert.alert('오류', '지급액 내역을 불러오는 중 오류가 발생했습니다.');
      setRepaymentData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0';
    const stringValue = typeof value === 'string' ? value : String(value);
    const numericValue = stringValue.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return dateString.substring(0, 10);
  };

  const handleExcelDownload = async () => {
    try {
      // Android 권한 확인
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('권한 필요', '파일 다운로드를 위해 저장 권한이 필요합니다.');
          return;
        }
      }

      Alert.alert('알림', '엑셀 파일을 다운로드 중입니다...');

      const baseURL = ApiService.baseURL;
      const excelUrl = `${baseURL}/my/repayment/excel?cur_yyyy=${selectedYear}`;
      
      // 토큰 가져오기
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('userToken');
      
      // 파일 다운로드
      const downloadDest = `${RNFS.DownloadDirectoryPath}/연도별_지급액_내역_${selectedYear}.xls`;
      
      const downloadResult = await RNFS.downloadFile({
        fromUrl: excelUrl,
        toFile: downloadDest,
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      }).promise;

      if (downloadResult.statusCode === 200) {
        Alert.alert(
          '다운로드 완료',
          `엑셀 파일이 다운로드되었습니다.\n\n파일 위치: ${downloadDest}`,
          [{ text: '확인' }]
        );
      } else {
        throw new Error(`다운로드 실패: ${downloadResult.statusCode}`);
      }
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error);
      Alert.alert('오류', `엑셀 다운로드 중 오류가 발생했습니다.\n${error.message}`);
    }
  };

  if (loading && repaymentData.length === 0) {
    return (
      <View style={styles.container}>
      <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3db8" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back 버튼 */}
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
      </View>

      <ScrollView style={styles.scrollView}>

        {/* 제목 */}
        <View style={styles.titleBox}>
          <Text style={styles.title}>연도별 지급액 내역</Text>
        </View>

        {/* 연도 선택 및 엑셀 다운로드 */}
        <View style={styles.controlBox}>
          <TouchableOpacity
            style={styles.yearPicker}
            onPress={() => setShowYearPicker(true)}
          >
            <Text style={styles.yearPickerText}>{selectedYear}년</Text>
            <Text style={styles.yearPickerArrow}>▼</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.excelButton}
            onPress={handleExcelDownload}
          >
            <Text style={styles.excelButtonText}>엑셀 다운로드</Text>
          </TouchableOpacity>
        </View>

        {/* 테이블 */}
        <View style={styles.tableContainer}>
          {repaymentData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>지급액 내역이 없습니다.</Text>
            </View>
          ) : (
            <View style={styles.table}>
              {/* 테이블 헤더 */}
              <View style={styles.tableHeader}>
                <View style={[styles.headerCell, styles.headerCell1]}>
                  <Text style={styles.headerText}>지급일</Text>
                </View>
                <View style={[styles.headerCell, styles.headerCell2]}>
                  <Text style={styles.headerText}>이자율</Text>
                </View>
                <View style={[styles.headerCell, styles.headerCell3]}>
                  <Text style={styles.headerText}>세율</Text>
                </View>
              </View>
              
              <View style={styles.tableHeader}>
                <View style={[styles.headerCell, styles.headerCell1]}>
                  <Text style={styles.headerText}>지급대상기간{'\n'}(연체대상기간)</Text>
                </View>
                <View style={[styles.headerCell, styles.headerCell2]}>
                  <Text style={styles.headerText}>지급액</Text>
                </View>
                <View style={[styles.headerCell, styles.headerCell3]}>
                  <Text style={styles.headerText}>소득세</Text>
                </View>
                <View style={[styles.headerCell, styles.headerCell4]}>
                  <Text style={styles.headerText}>지방소득세</Text>
                </View>
                <View style={[styles.headerCell, styles.headerCell5]}>
                  <Text style={styles.headerText}>계</Text>
                </View>
              </View>

              {/* 테이블 바디 */}
              {repaymentData.map((item, index) => (
                <View key={index}>
                  {/* 첫 번째 행 */}
                  <View style={styles.tableRow}>
                    <View style={[styles.tableCell, styles.tableCell1]}>
                      <Text style={[styles.cellText, styles.dateText]}>
                        {formatDate(item.de_date)}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, styles.tableCell2]}>
                      <Text style={[styles.cellText, styles.numberText]}>
                        {item.rate}%
                      </Text>
                    </View>
                    <View style={[styles.tableCell, styles.tableCell3]}>
                      <Text style={styles.cellText}></Text>
                    </View>
                    <View style={[styles.tableCell, styles.tableCell4]}>
                      <Text style={[styles.cellText, styles.numberText]}>
                        {item.s_i_tax}%
                      </Text>
                    </View>
                    <View style={[styles.tableCell, styles.tableCell5]}>
                      <Text style={styles.cellText}></Text>
                    </View>
                  </View>
                  
                  {/* 두 번째 행 */}
                  <View style={styles.tableRow}>
                    <View style={[styles.tableCell, styles.tableCell1]}>
                      <Text style={styles.cellText}>
                        {item.i_start_date}~{item.i_end_date}
                        {item.o_start_date && item.o_end_date && (
                          <Text style={styles.overdueText}>
                            {'\n'}({item.o_start_date}~{item.o_end_date})
                          </Text>
                        )}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, styles.tableCell2]}>
                      <Text style={[styles.cellText, styles.numberText]}>
                        {formatCurrency(item.r_return_price)}원
                      </Text>
                    </View>
                    <View style={[styles.tableCell, styles.tableCell3]}>
                      <Text style={[styles.cellText, styles.numberText]}>
                        {formatCurrency(item.i_tax)}원
                      </Text>
                    </View>
                    <View style={[styles.tableCell, styles.tableCell4]}>
                      <Text style={[styles.cellText, styles.numberText]}>
                        {formatCurrency(item.r_tax)}원
                      </Text>
                    </View>
                    <View style={[styles.tableCell, styles.tableCell5]}>
                      <Text style={[styles.cellText, styles.numberText]}>
                        {formatCurrency((item.i_tax || 0) + (item.r_tax || 0))}원
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 연도 선택 모달 */}
      <Modal
        visible={showYearPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>연도 선택</Text>
            <ScrollView style={styles.yearList}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearOption,
                    selectedYear === year && styles.yearOptionActive
                  ]}
                  onPress={() => {
                    setSelectedYear(year);
                    setShowYearPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.yearOptionText,
                      selectedYear === year && styles.yearOptionTextActive
                    ]}
                  >
                    {year}년
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  headCon: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
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
  titleBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    color: '#222',
  },
  controlBox: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 15,
  },
  yearPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 20,
    backgroundColor: '#fff',
    minWidth: 100,
  },
  yearPickerText: {
    flex: 1,
    fontSize: 14,
    color: '#222',
  },
  yearPickerArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  excelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2c3db8',
    borderRadius: 20,
    height: 30,
    justifyContent: 'center',
  },
  excelButtonText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  tableContainer: {
    marginTop: 10,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  table: {
    //borderWidth: 1,
    //borderColor: '#e0e1e2',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(246, 246, 246, 0.5)',
  },
  headerCell: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCell1: {
    width: '35%',
  },
  headerCell2: {
    width: '20%',
  },
  headerCell3: {
    width: '15%',
  },
  headerCell4: {
    width: '15%',
  },
  headerCell5: {
    width: '15%',
    borderRightWidth: 0,
  },
  headerText: {
    fontSize: 15,
    lineHeight: 19.5,
    fontWeight: '400',
    color: '#393f44',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  tableCell: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    borderBottomWidth: 0.1,
    borderBottomColor: '#f6f6f6',
  },
  tableCell1: {
    width: '35%',
  },
  tableCell2: {
    width: '20%',
    alignItems: 'flex-end',
  },
  tableCell3: {
    width: '15%',
    alignItems: 'flex-end',
  },
  tableCell4: {
    width: '15%',
    alignItems: 'flex-end',
  },
  tableCell5: {
    width: '15%',
    alignItems: 'flex-end',
    borderRightWidth: 0,
  },
  cellText: {
    fontSize: 14,
    lineHeight: 19.5,
    color: '#393f44',
    textAlign: 'center',
  },
  dateText: {
    color: '#2c3db8',
    fontWeight: '600',
  },
  numberText: {
    textAlign: 'right',
  },
  overdueText: {
    color: '#666',
    fontSize: 12,
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
    maxWidth: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '60%',
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
  yearList: {
    maxHeight: 300,
  },
  yearOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f6f6f6',
  },
  yearOptionActive: {
    backgroundColor: '#f5f7fa',
  },
  yearOptionText: {
    fontSize: 15,
    color: '#222',
  },
  yearOptionTextActive: {
    fontWeight: '600',
    color: '#2c3db8',
  },
});

export default RepaymentHistoryScreen;

