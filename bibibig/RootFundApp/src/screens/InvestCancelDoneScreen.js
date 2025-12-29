import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

const InvestCancelDoneScreen = ({ navigation, route }) => {
  const { member_id } = route.params || {};

  const handleConfirm = () => {
    // 투자현황 화면으로 이동 (member_id 전달)
    navigation.navigate('MyPage', { 
      member_id,
      initialTab: 'invest'
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('MyPage', { 
            member_id,
            initialTab: 'invest'
          })}
        >
          <Image
            source={require('../assets/images/ico_back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}></Text>
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
    backgroundColor: '#f6f6f6',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#f6f6f6',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    paddingVertical: 40,
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
    marginBottom: 20,
  },
  successIcoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  successMsg: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
  },
  btnBox: {
    marginTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 56,
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
