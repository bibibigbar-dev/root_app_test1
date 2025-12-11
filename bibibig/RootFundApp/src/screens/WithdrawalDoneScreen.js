import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';

const WithdrawalDoneScreen = ({ navigation }) => {
  const handleGoToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Back 버튼 헤더 */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Image 
              source={require('../assets/images/ico_back.png')} 
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}></Text>
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successWrapper}>
            <Image 
              source={require('../assets/images/ico_success.png')}
              style={styles.successIco}
              resizeMode="contain"
            />
            <Text style={styles.successMsg}>
              탈퇴가{'\n'}
              완료되었습니다!
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.btnBox}>
        <TouchableOpacity style={styles.btnStyle} onPress={handleGoToLogin}>
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
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#f5f7fa',
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
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    marginRight: 40,
  },
  successContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: 400,
  },
  successWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
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
    textAlign: 'center',
  },
  btnBox: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 40,
    paddingRight: 16,
    paddingBottom: 40,
    paddingLeft: 16,
  },
  btnStyle: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    backgroundColor: '#2c3db8',
    borderWidth: 1,
    borderColor: '#2c3db8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

export default WithdrawalDoneScreen;

