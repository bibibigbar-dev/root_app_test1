import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Video from 'react-native-video';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    // 3초 후 자동으로 다음 화면으로
    const timer = setTimeout(() => {
      onFinish();
    }, 6000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const handleSkip = () => {
    onFinish();
  };

  return (
    <View style={styles.container}>
      {/* 비디오 배경 */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={require('../assets/images/splash.mp4')}
          style={styles.video}
          resizeMode="cover"
          repeat={true}
          muted={true}
          playInBackground={false}
          playWhenInactive={false}
        />
      </View>

      {/* 텍스트 오버레이 */}
      <View style={styles.overlay}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>재생에너지 펀딩 플랫폼</Text>
          <Text style={styles.subtitle}>탄소중립 가속화로</Text>
          <Text style={styles.subtitle}>지속 가능한 미래를 만듭니다.</Text>
        </View>
      </View>

      {/* Skip 버튼 - 중앙 하단 */}
      <View style={styles.skipButtonContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>SKIP</Text>
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
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    overflow: 'hidden',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  textContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 120,
    marginLeft: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#666',
    textAlign: 'left',
  },
  skipButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    marginBottom: 20,
  },
  skipButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 1,
  },
});

export default SplashScreen;

