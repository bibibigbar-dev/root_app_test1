import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

const LoanRequestDoneScreen = ({ navigation, route }) => {
  const { orderNumber, returnScreen } = route.params || {};

  const handleConfirm = () => {
    // returnScreen이 지정되어 있으면 해당 화면으로, 없으면 Loan 화면으로
    const targetScreen = returnScreen || 'Loan';
    navigation.reset({
      index: 0,
      routes: [{ name: targetScreen }],
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
          <Text style={styles.successMsg}>대출 상담 신청이{'\n'}완료되었습니다.</Text>
          {orderNumber && (
            <Text style={styles.orderNumber}>대출번호: {orderNumber}</Text>
          )}
          <Text style={styles.successDesc}>
            심사 후 순차적으로 처리됩니다.
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
    marginRight: 24,
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
  orderNumber: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3db8',
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

export default LoanRequestDoneScreen;

