import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

const NeighborRequestDoneScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.successContainer}>
        <View style={styles.successWrapper}>
          <View style={styles.successIco}>
            <Text style={styles.successIcoText}>✓</Text>
          </View>
          <Text style={styles.successMsg}>
            이웃신청이{'\n'}
            완료되었습니다!
          </Text>
          <Text style={styles.successDesc}>
            승인처리시{'\n'}
            안내 문자가 발송됩니다.
          </Text>
        </View>
      </View>

      <View style={styles.btnBox}>
        <TouchableOpacity
          style={styles.btnStyle}
          onPress={() => {
            navigation.navigate('NeighborStatus');
          }}
        >
          <Text style={styles.btnText}>이웃신청현황 확인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  successMsg: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 16,
  },
  successDesc: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
  },
  btnBox: {
    padding: 16,
    paddingBottom: 56,
    backgroundColor: '#fff',
  },
  btnStyle: {
    height: 48,
    backgroundColor: '#2c3db8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

export default NeighborRequestDoneScreen;
