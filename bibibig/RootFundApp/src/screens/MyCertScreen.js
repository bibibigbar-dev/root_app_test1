import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import ApiService from '../services/api';

const MyCertScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { use_tf_join, f_joinType, member_id } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState(null);
  const [cpno2, setCpno2] = useState('');
  const [rscpnoencdata, setRscpnoencdata] = useState('');
  const [bc5jsencpublickey, setBc5jsencpublickey] = useState('');
  const [useBToken, setUseBToken] = useState('');

  useEffect(() => {
    loadMemberData();
  }, []);

  const loadMemberData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.api.get('/app/my/cert', {
        params: { member_id: member_id }
      });
      console.log('📥 회원 인증 데이터:', response.data);
      
      if (response.data.member) {
        setMemberData(response.data.member);
        setBc5jsencpublickey(response.data.bc5jsencpublickey || '');
        setUseBToken(response.data.useBToken || '');
      }
    } catch (error) {
      console.error('❌ 회원 데이터 로드 오류:', error);
      Alert.alert('오류', '회원 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleNumberInput = async (number) => {
    if (number === '100') {
      // 백스페이스
      const newCpno2 = cpno2.slice(0, -1);
      setCpno2(newCpno2);
      
      // 암호화된 값도 초기화 후 재암호화
      if (newCpno2.length > 0) {
        setRscpnoencdata('');
        // 전체 문자열을 다시 암호화
        for (let i = 0; i < newCpno2.length; i++) {
          await encryptSingleNumber(newCpno2[i]);
        }
      } else {
        setRscpnoencdata('');
      }
    } else if (number === '101') {
      // 초기화
      setCpno2('');
      setRscpnoencdata('');
    } else {
      // 숫자 입력
      if (cpno2.length < 7) {
        const newCpno2 = cpno2 + number;
        setCpno2(newCpno2);
        
        // 한 글자씩 암호화 처리 (웹 방식과 동일)
        await encryptSingleNumber(number);
      }
    }
  };

  // 웹의 _bc5jsencsetdata + fnSetMemberCpno 로직과 동일
  const encryptSingleNumber = async (singleNumber) => {
    try {
      // 1. 단일 숫자 암호화 (_bc5jsencsetdata)
      const encResponse = await ApiService.api.post('/rtencdata', {
        chkdata1: '', // 단일 숫자 암호화 시에는 빈 문자열
        chkdata2: singleNumber.toString(),
        chkdata3: 1, // 단일 숫자
      });

      if (encResponse.data && encResponse.data.rsencdata) {
        const bc5_enckeynumset = encResponse.data.rsencdata;
        
        // 2. 기존 암호화 데이터와 결합 (fnSetMemberCpno)
        const combineResponse = await ApiService.api.post('/rtencdata', {
          chkdata1: rscpnoencdata, // 기존 암호화된 데이터
          chkdata2: bc5_enckeynumset, // 새로 암호화된 숫자
          chkdata3: 7, // 최대 길이
        });

        if (combineResponse.data && combineResponse.data.rsencdata) {
          setRscpnoencdata(combineResponse.data.rsencdata);
          console.log('✅ 주민번호 암호화 완료');
        }
      }
    } catch (error) {
      console.error('❌ 주민번호 암호화 오류:', error);
      Alert.alert('오류', '주민번호 암호화 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async () => {
    if (!memberData) {
      Alert.alert('오류', '회원 정보가 없습니다.');
      return;
    }

    // 법인회원은 주민번호 입력 불필요
    if (memberData.sort === 'C') {
      return false;
    }

    if (cpno2.length !== 7) {
      Alert.alert('본인정보 저장하기', '잘못된 주민등록번호 입니다.\n다시 확인하여 주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const cpno1 = memberData.birthdate_yyyy 
        ? `${memberData.birthdate_yyyy.substring(2)}${memberData.birthdate_mm}${memberData.birthdate_dd}`
        : '';
      
      // 주민번호 검증 API 호출
      const checkResponse = await ApiService.api.post('/app/okname/check/cert/name', {
        de_cpno: cpno1,
        cert_cpno: rscpnoencdata, // 암호화된 값 사용
        cert_name: memberData.r_name || '',
        cert_chk: 'Y',
      });

      console.log('✅ 주민번호 검증 응답:', checkResponse.data);

      const checkResult = String(checkResponse.data).trim();

      if (checkResult === '0') {
        // 검증 성공 - 주민번호 저장
        const saveResponse = await ApiService.api.post('/app/member/update/cpno', {
          member_id: member_id,
          cpno: rscpnoencdata, // 암호화된 값 사용
          v_bank_cd: '011',
          v_bank_nm: '농협중앙회',
        });

        const rtnvalue = String(saveResponse.data).trim();

        if (rtnvalue === '0') {
          // 성공 - 데이터 새로고침
          Alert.alert('성공', '주민번호가 저장되었습니다.', [
            {
              text: '확인',
              onPress: () => loadMemberData(),
            },
          ]);
        } else if (rtnvalue === '1') {
          Alert.alert('본인정보 저장하기', '로그인이 필요합니다.', [
            {
              text: '확인',
              onPress: () => navigation.navigate('Login'),
            },
          ]);
        } else if (rtnvalue === '2') {
          Alert.alert('본인정보 저장하기', '주민등록번호를 확인해주세요.');
        } else if (rtnvalue === '3') {
          Alert.alert('본인정보 저장하기', '주민등록번호를 저장할 수 없습니다(기존정보 존재).');
        } else if (rtnvalue === '4') {
          Alert.alert('본인정보 저장하기', '이미 가입되어 있는 주민등록번호 입니다.');
        } else {
          Alert.alert('본인정보 저장하기', '처리도중 오류가 발생하였습니다.');
        }
      } else if (checkResult === '2') {
        Alert.alert('본인정보 저장하기', '해당 주민번호가 존재하지 않습니다. 주민번호를 다시 한번 확인해주세요.');
      } else if (checkResult === '3') {
        Alert.alert('본인정보 저장하기', '해당 이름이 존재하지 않습니다. 이름을 확인해주세요.');
      } else {
        Alert.alert('본인정보 저장하기', '처리 도중 오류가 발생했습니다. 고객센터로 오류를 문의하여 주세요');
      }
    } catch (error) {
      console.error('❌ 주민번호 저장 오류:', error);
      Alert.alert('본인정보 저장하기', '처리도중 오류가 발생하였습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3db8" />
      </View>
    );
  }

  // 주민번호가 없는 경우 - 입력 화면
  if (memberData && !memberData.cpno) {
    const cpno1 = memberData.birthdate_yyyy 
      ? `${memberData.birthdate_yyyy.substring(2)}${memberData.birthdate_mm}${memberData.birthdate_dd}`
      : '';

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
          <View style={styles.titleBox}>
            <Text style={styles.title}>서비스 이용신청</Text>
            <Text style={styles.subtitle}>
              당사의 투자 및 대출 서비스를 이용하기 위해,{'\n'}
              법인정보 확인 후 순차적으로 승인처리 됩니다.
            </Text>
          </View>

          <View style={styles.titleBox}>
            <Text style={styles.subtitle}>본인정보 등록하기</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.flexTit}>
              <Text style={styles.tit}>이름</Text>
            </View>
            <View style={styles.flexInput}>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={memberData.r_name || ''}
                editable={false}
              />
            </View>

            <View style={styles.flexTit}>
              <Text style={styles.tit}>주민등록번호</Text>
            </View>
            <View style={styles.flexInputRow}>
              <TextInput
                style={[styles.input, styles.inputDisabled, styles.inputHalf]}
                value={cpno1}
                editable={false}
                placeholder="주민등록번호 앞자리"
              />
              <Text style={styles.txtBetween}>-</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled, styles.inputHalf]}
                value={cpno2.replace(/./g, '•')}
                editable={false}
                placeholder="주민등록번호 뒷자리"
              />
            </View>

            <View style={styles.flexTit}>
              <Text style={styles.tit}>주민번호 뒷자리 입력</Text>
            </View>

            {/* 숫자 키패드 */}
            <View style={styles.keypadContainer}>
              <View style={styles.keypadRow}>
                {['1', '2', '3'].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.keypadButton}
                    onPress={() => handleNumberInput(num)}
                  >
                    <Text style={styles.keypadButtonText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                {['4', '5', '6'].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.keypadButton}
                    onPress={() => handleNumberInput(num)}
                  >
                    <Text style={styles.keypadButtonText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                {['7', '8', '9'].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.keypadButton}
                    onPress={() => handleNumberInput(num)}
                  >
                    <Text style={styles.keypadButtonText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                <TouchableOpacity
                  style={styles.keypadButton}
                  onPress={() => handleNumberInput('0')}
                >
                  <Text style={styles.keypadButtonText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keypadButton}
                  onPress={() => handleNumberInput('100')}
                >
                  <Text style={styles.keypadButtonText}>←</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keypadButton}
                  onPress={() => handleNumberInput('101')}
                >
                  <Text style={styles.keypadButtonText}>초기화</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.noticeBox}>
              <View style={styles.noticeHeader}>
                <Image
                  source={require('../assets/images/ico_notif.png')}
                  style={styles.noticeIcon}
                />
                <Text style={styles.noticeText}>
                  세금 신고를 위해 최초 1회 주민등록번호를 입력해야 합니다.{'\n'}
                  입력한 주민등록번호는 변경이 불가합니다.{'\n'}
                  루트펀드는 고객님을 대신하여 투자수익에 대한 세금을 미리 납부해야 하는 원천징수의 의무를 가집니다.{'\n'}
                  주민등록번호는 이 용도로만 사용합니다.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.fixBtnWrap}>
          <TouchableOpacity
            style={[styles.btnStyle, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          > 
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>다음</Text>
            )}
          </TouchableOpacity>

          {/* 임시 테스트 버튼 */}
          <TouchableOpacity
            style={[styles.btnStyle, { backgroundColor: '#ff9800', marginTop: 10 }]}
            onPress={async () => {
              try {
                setLoading(true);
                const response = await ApiService.api.get('/app/my/cert', {
                  params: { member_id: '6425' }
                });
                console.log('📥 테스트 회원 인증 데이터:', response.data);
                
                if (response.data.member) {
                  setMemberData(response.data.member);
                  setBc5jsencpublickey(response.data.bc5jsencpublickey || '');
                  Alert.alert('성공', 'member_id=6425 데이터를 불러왔습니다.');
                }
              } catch (error) {
                console.error('❌ 테스트 데이터 로드 오류:', error);
                Alert.alert('오류', '테스트 데이터를 불러오는 중 오류가 발생했습니다.');
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text style={styles.btnText}>🧪 테스트: member_id=6425 불러오기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 주민번호는 있지만 계좌인증이 안된 경우 - 계좌인증 화면
  // 또는 모든 인증이 완료된 경우도 동일한 화면 표시
  if (memberData && memberData.cpno) {
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
          <View style={styles.titleBox}>
            <Text style={styles.title}>서비스 이용신청</Text>
            <Text style={styles.subtitle}>
              당사의 투자 및 대출 서비스를 이용하기 위해,{'\n'}
              법인정보 확인 후 순차적으로 승인처리 됩니다.
            </Text>
          </View>

          <View style={styles.titleBox}>
            <Text style={styles.subtitle}>본인명의 계좌인증</Text>
          </View>

          <View style={styles.kycContainer}>
            <WebView
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { overflow: hidden; background-color: white; }
                        #kyc_iframe { width: 100%; height: 100vh; border: none; }
                      </style>
                    </head>
                    <body>
                      <iframe id="kyc_iframe" allow="camera"></iframe>
                      <script>
                        var token = "${useBToken}";
                        var name = "${memberData?.member_name || memberData?.r_name || ''}";
                        var birthday = "${memberData?.birthdate_yyyy || ''}-${memberData?.birthdate_mm || ''}-${memberData?.birthdate_dd || ''}";
                        var phone_number = "${memberData?.phone || ''}";
                        var email = "${memberData?.web_id || ''}";

                        console.log('UseB KYC 초기화:', { token, name, birthday, phone_number, email });

                        function test(useBToken) {
                          const KYC_TARGET_ORIGIN = "https://kyc.useb.co.kr";
                          const KYC_URL = "https://kyc.useb.co.kr/auth";
                          const params = {
                            "access_token": useBToken,
                            "name": name,
                            "birthday": birthday,
                            "phone_number": phone_number,
                            "email": email
                          };

                          const kycIframe = document.getElementById("kyc_iframe");

                          kycIframe.onload = function () {
                            try {
                              let encodedParams = btoa(encodeURIComponent(JSON.stringify(params)));
                              kycIframe.contentWindow.postMessage(encodedParams, KYC_TARGET_ORIGIN);
                              console.log('UseB KYC 파라미터 전송 완료');
                            } catch (error) {
                              console.error('UseB KYC 오류:', error);
                            }
                            kycIframe.onload = null;
                          };

                          console.log('UseB KYC iframe 로드 시작');
                          kycIframe.src = KYC_URL;
                        }

                        // 인증 완료 메시지 수신
                        window.addEventListener('message', function(event) {
                          if (event.origin === 'https://kyc.useb.co.kr') {
                            console.log('UseB KYC 메시지 수신:', event.data);
                            // React Native로 메시지 전달
                            if (window.ReactNativeWebView) {
                              window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'KYC_RESULT',
                                data: event.data
                              }));
                            }
                          }
                        });

                        test(token);
                      </script>
                    </body>
                  </html>
                `
              }}
              onMessage={async (event) => {
                try {
                  const message = JSON.parse(event.nativeEvent.data);
                  console.log('📥 UseB KYC 결과:', message);
                  
                  if (message.type === 'KYC_RESULT') {
                    // 로그인 상태 확인
                    const currentUser = await ApiService.getCurrentUser();
                    const isLoggedIn = !!currentUser;
                    
                    console.log('🔐 로그인 상태:', isLoggedIn);
                    
                    // 인증 완료 처리
                    Alert.alert('계좌인증 완료', '계좌인증이 완료되었습니다.', [
                      {
                        text: '확인',
                        onPress: () => {
                          if (isLoggedIn) {
                            // 로그인 상태: 마이페이지 자산관리 탭으로 이동
                            navigation.replace('MyPageTabContainer', {
                              initialTab: 'assets',
                              member_id: member_id,
                            });
                          } else {
                            // 비로그인 상태: 메인페이지로 이동
                            navigation.replace('Main');
                          }
                        },
                      },
                    ]);
                  }
                } catch (error) {
                  console.error('UseB KYC 메시지 파싱 오류:', error);
                }
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback={true}
              style={styles.webView}
            />
          </View>
        </ScrollView>

        <View style={styles.fixBtnWrap}>
          {/* 임시 테스트 버튼 */}
          <TouchableOpacity
            style={[styles.btnStyle, { backgroundColor: '#ff9800' }]}
            onPress={async () => {
              try {
                setLoading(true);
                const response = await ApiService.api.get('/app/my/cert', {
                  params: { member_id: '6425' }
                });
                console.log('📥 테스트 회원 인증 데이터:', response.data);
                
                if (response.data.member) {
                  setMemberData(response.data.member);
                  setBc5jsencpublickey(response.data.bc5jsencpublickey || '');
                  Alert.alert('성공', 'member_id=6425 데이터를 불러왔습니다.');
                }
              } catch (error) {
                console.error('❌ 테스트 데이터 로드 오류:', error);
                Alert.alert('오류', '테스트 데이터를 불러오는 중 오류가 발생했습니다.');
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text style={styles.btnText}>🧪 테스트: member_id=6425 불러오기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // memberData가 없는 경우
  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
    padding: 10,
    paddingLeft: 16,
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
  titleBox: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    lineHeight: 36,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  flexTit: {
    marginTop: 20,
    marginBottom: 8,
  },
  tit: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  flexInput: {
    marginBottom: 10,
  },
  flexInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#e6e6e6',
    borderColor: '#e0e0eb',
    color: '#666',
  },
  inputHalf: {
    flex: 1,
  },
  txtBetween: {
    marginHorizontal: 8,
    fontSize: 15,
    color: '#666',
  },
  keypadContainer: {
    marginBottom: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    marginBottom: 5,
    gap: 5,
  },
  keypadButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#e6e6e6',
    borderWidth: 1,
    borderColor: '#e0e0eb',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadButtonText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  noticeBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noticeIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  infoText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 40,
  },
  kycContainer: {
    flex: 1,
    height: 600,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fixBtnWrap: {
    padding: 20,
    paddingBottom: 40,
  },
  btnStyle: {
    height: 54,
    backgroundColor: '#2c3db8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#a3a7ab',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default MyCertScreen;

