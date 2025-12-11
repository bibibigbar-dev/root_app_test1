import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';

const SignUpTypeScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState('private');

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    
    // 타입 선택 후 자동으로 다음 화면으로 이동
    if (type === 'corp') {
      // 법인회원 가입 화면으로 이동
      navigation.navigate('SignUpCorp');
    } else {
      // 개인회원 선택 화면으로 이동
      navigation.navigate('SignUpPrivateSelect');
    }
  };

  return (
    <View style={styles.container}>
      {/* 뒤로가기 버튼 */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Image 
            source={require('../assets/images/ico_back.png')} 
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 타이틀 */}
        <View style={styles.subTitleBox}>
          <Text style={styles.title}>
            먼저,{'\n'}회원타입을 선택해 주세요
          </Text>
        </View>

        {/* 회원 타입 선택 */}
        <View style={styles.joinTypeSelect}>
          {/* 개인회원 */}
          <TouchableOpacity
            style={styles.typeItem}
            onPress={() => handleTypeSelect('private')}
            activeOpacity={0.8}
          >
            <View style={[
              styles.inbox,
              selectedType === 'private' && styles.inboxSelected
            ]}>
              <Text style={[
                styles.typeText,
                selectedType === 'private' && styles.typeTextSelected
              ]}>개인회원</Text>
              <View style={[
                styles.imgBox,
                selectedType !== 'private' && styles.imgBoxGray
              ]}>
                <Image
                  source={require('../assets/images/img_jointype01.png')}
                  style={styles.typeImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* 법인회원 */}
          <TouchableOpacity
            style={styles.typeItem}
            onPress={() => handleTypeSelect('corp')}
            activeOpacity={0.8}
          >
            <View style={[
              styles.inbox,
              selectedType === 'corp' && styles.inboxSelected
            ]}>
              <Text style={[
                styles.typeText,
                selectedType === 'corp' && styles.typeTextSelected
              ]}>법인회원</Text>
              <View style={[
                styles.imgBox,
                selectedType !== 'corp' && styles.imgBoxGray
              ]}>
                <Image
                  source={require('../assets/images/img_jointype02.png')}
                  style={styles.typeImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 로그인 링크 */}
        <View style={styles.txtLinkCenter}>
          <Text style={styles.linkText}>이미 회원이세요? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkButton}>로그인하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
  content: {
    flex: 1,
  },
  subTitleBox: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  joinTypeSelect: {
    flexDirection: 'row',
    marginTop: 40,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  typeItem: {
    flex: 1,
    marginLeft: 8,
  },
  inbox: {
    height: 194,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  inboxSelected: {
    borderColor: '#2c3db8',
  },
  typeText: {
    marginTop: 24,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#a3a7ab',
  },
  typeTextSelected: {
    color: '#222222',
  },
  imgBox: {
    width: '100%',
    height: 85,
    opacity: 1,
  },
  imgBoxGray: {
    opacity: 0.8,
  },
  typeImage: {
    width: '100%',
    height: '100%',
  },
  txtLinkCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 40,
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#666666',
  },
  linkButton: {
    fontSize: 14,
    color: '#2c3db8',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SignUpTypeScreen;

