import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

const ConsultationRequestDoneScreen = ({ navigation, route }) => {
  const handleConfirm = () => {
    // 스택을 초기화하고 법인투자 화면으로 이동
    navigation.reset({
      index: 0,
      routes: [{ name: 'CorporateInvestment' }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headCon}>
        <TouchableOpacity 
          style={styles.btnBack}
          onPress={handleConfirm}
        >
          <Image
            source={require('../assets/images/ico_back.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.successContainer}>
        <View style={styles.successWrapper}>
          <Image
            source={require('../assets/images/ico_success.png')}
            style={styles.successIco}
            resizeMode="contain"
          />
          <Text style={styles.successMsg}>상담신청이 완료되었습니다.</Text>
          <Text style={styles.successDesc}>
            빠른 시일내에 연락드리겠습니다.
          </Text>
        </View>
      </View>

      <View style={styles.btnBox}>
        <TouchableOpacity
          style={styles.btnStyle}
          onPress={handleConfirm}
        >
          <Text style={styles.btnText}>확인</Text>
        </TouchableOpacity>
      </View>
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
    height: 48,
    paddingHorizontal: 16,
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
  headTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    marginRight: 24, // 중앙 정렬을 위해 back 버튼 너비만큼 오른쪽 마진
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successWrapper: {
    alignItems: 'center',
  },
  successIco: {
    width: 40,
    height: 40,
  },
  successMsg: {
    marginTop: 16,
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
  },
  successDesc: {
    marginTop: 16,
    color: '#666',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'center',
  },
  btnBox: {
    marginTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 56,
  },
  btnStyle: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2c3db8',
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ConsultationRequestDoneScreen;

