import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

const InvestCancelDoneScreen = ({ navigation }) => {
  const handleConfirm = () => {
    // 마이페이지 - 투자현황 탭으로 이동
    navigation.navigate('MyPage', {
      initialTab: 'invest'
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>투자취소</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.successContainer}>
          <View style={styles.successWrapper}>
            <View style={styles.successIco}>
              <Text style={styles.successIcoText}>✓</Text>
            </View>
            <Text style={styles.successMsg}>
              투자취소가 완료되었습니다.
            </Text>
          </View>
        </View>
      </View>

      {/* Button */}
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
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e1e2',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#222',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
  },
  btnBox: {
    paddingTop: 40,
    paddingRight: 16,
    paddingBottom: 56,
    paddingLeft: 16,
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

export default InvestCancelDoneScreen;
