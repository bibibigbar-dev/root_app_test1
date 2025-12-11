import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';

const SignUpPrivateSelectScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState('adult');

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    // 선택 후 자동으로 다음 화면으로 이동 (약관 동의 화면)
    navigation.navigate('SignUpPrivate', { joinType: type });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Image source={require('../assets/images/ico_back.png')} style={styles.backButtonImage} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.subTitleBox}>
          <Text style={styles.title}>개인회원 유형을 선택해주세요</Text>
        </View>

        <View style={styles.joinTypeSelect}>
          {/* 만 18세 미만 */}
          <TouchableOpacity
            style={styles.typeItem}
            onPress={() => handleTypeSelect('minor')}
            activeOpacity={0.8}
          >
            <View style={[styles.inbox, selectedType === 'minor' && styles.inboxSelected]}>
              <Text style={[styles.typeText, selectedType === 'minor' && styles.typeTextSelected]}>
                만 18세 미만
              </Text>
              <View style={styles.imgBox}>
                <Image
                  source={
                    selectedType === 'minor'
                      ? require('../assets/images/img_privjointype01_01_on.png')
                      : require('../assets/images/img_privjointype01_01.png')
                  }
                  style={[styles.typeImage, selectedType !== 'minor' && { opacity: 0.8 }]}
                  resizeMode="contain"
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* 만 18세 이상 */}
          <TouchableOpacity
            style={[styles.typeItem, { marginLeft: 8 }]}
            onPress={() => handleTypeSelect('adult')}
            activeOpacity={0.8}
          >
            <View style={[styles.inbox, selectedType === 'adult' && styles.inboxSelected]}>
              <Text style={[styles.typeText, selectedType === 'adult' && styles.typeTextSelected]}>
                만 18세 이상
              </Text>
              <View style={styles.imgBox}>
                <Image
                  source={
                    selectedType === 'adult'
                      ? require('../assets/images/img_privjointype01_02_on.png')
                      : require('../assets/images/img_privjointype01_02.png')
                  }
                  style={[styles.typeImage, selectedType !== 'adult' && { opacity: 0.8 }]}
                  resizeMode="contain"
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* 외국인 */}
          <TouchableOpacity
            style={[styles.typeItem, { marginLeft: 8 }]}
            onPress={() => handleTypeSelect('foreigner')}
            activeOpacity={0.8}
          >
            <View style={[styles.inbox, selectedType === 'foreigner' && styles.inboxSelected]}>
              <Text style={[styles.typeText, selectedType === 'foreigner' && styles.typeTextSelected]}>
                외국인
              </Text>
              <View style={styles.imgBox}>
                <Image
                  source={
                    selectedType === 'foreigner'
                      ? require('../assets/images/img_privjointype01_03_on.png')
                      : require('../assets/images/img_privjointype01_03.png')
                  }
                  style={[styles.typeImage, selectedType !== 'foreigner' && { opacity: 0.8 }]}
                  resizeMode="contain"
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.txtLinkCenter}>
          <Text style={styles.linkText}>
            이미 회원이세요?{' '}
            <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
              로그인하기
            </Text>
          </Text>
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
  content: {
    flex: 1,
  },
  subTitleBox: {
    marginTop: 24, // 2.4rem
    paddingHorizontal: 20, // 2rem
  },
  title: {
    fontSize: 25, // 2.5rem
    lineHeight: 35, // 1.4
    fontWeight: '700',
    color: '#222222',
  },
  joinTypeSelect: {
    flexDirection: 'row',
    marginTop: 40, // 4rem
    marginHorizontal: 20, // 2rem
  },
  typeItem: {
    flex: 1,
  },
  inbox: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 194, // 19.4rem
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10, // 1rem
    backgroundColor: '#FFFFFF',
    paddingTop: 24, // 2.4rem
    paddingBottom: 20,
  },
  inboxSelected: {
    borderColor: '#2c3db8',
    borderWidth: 1,
  },
  typeText: {
    color: '#a3a7ab',
    fontSize: 18, // 2rem
    lineHeight: 28, // 1.4
    fontWeight: '700',
  },
  typeTextSelected: {
    color: '#222222',
  },
  imgBox: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeImage: {
    width: 80,
    height: 80,
  },
  txtLinkCenter: {
    marginTop: 40, // 4rem
    marginBottom: 40, // 4rem (mb40)
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666666',
  },
  link: {
    ontSize: 14,
    color: '#2c3db8',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  header: {
    height: 48, // 4.8rem
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, // 1.6rem
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});

export default SignUpPrivateSelectScreen;
