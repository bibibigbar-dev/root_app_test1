import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

const UpwardRequestDoneScreen = ({ navigation, route }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headCon}>
        <TouchableOpacity 
          style={styles.btnBack}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.successContainer}>
        <View style={styles.successWrapper}>
          <Image
            source={require('../assets/images/ico_success.png')}
            style={styles.successIco}
            resizeMode="contain"
          />
          <Text style={styles.successMsg}>신청이 완료되었습니다</Text>
          <Text style={styles.successDesc}>
            심사 후 순차적으로 승인처리 됩니다.{'\n'}
            처리 결과는 마이페이지에서 확인하실 수 있습니다.
          </Text>
        </View>
      </View>

      <View style={styles.btnBox}>
        <TouchableOpacity
          style={styles.btnStyle}
          onPress={() => navigation.navigate('MyHome')}
        >
          <Text style={styles.btnText}>자산관리로 이동</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headCon: {
    flexDirection: 'row',
    alignItems: 'center',
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
  backText: {
    fontSize: 24,
    color: '#222',
    fontWeight: 'bold',
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
    paddingHorizontal: 16,
    paddingBottom: 56,
  },
  btnStyle: {
    height: 48,
    borderRadius: 10,
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

export default UpwardRequestDoneScreen;

