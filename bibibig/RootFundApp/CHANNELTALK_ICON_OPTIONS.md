# 채널톡 아이콘 설정 옵션

## 현재 상태
✅ 버튼이 우측 하단에 배치됨
✅ 클릭 시 채널톡 웹페이지 열림
⚠️ 아이콘 이미지: `sns_talk.png` 사용 중

## 아이콘 옵션

### 옵션 1: 현재 이미지 사용 (sns_talk.png)
- 장점: 추가 작업 불필요
- 단점: 채널톡 전용 아이콘이 아님

### 옵션 2: 이모지 사용 (가장 간단)

MainScreen.js 수정:

```javascript
{/* 채널톡 플로팅 버튼 - 이모지 버전 */}
<TouchableOpacity
  style={styles.channelTalkButton}
  onPress={() => Linking.openURL('https://rootenergy.channel.io')}
  activeOpacity={0.9}
>
  <Text style={styles.channelTalkEmoji}>💬</Text>
</TouchableOpacity>
```

styles에 추가:
```javascript
channelTalkEmoji: {
  fontSize: 32,
  textAlign: 'center',
},
```

### 옵션 3: 채널톡 공식 아이콘 다운로드

1. 채널톡 공식 로고 다운로드:
   - https://channel.io/ko/press 에서 다운로드
   - 또는 웹사이트에서 사용 중인 아이콘 사용

2. 이미지 저장 위치:
   ```
   src/assets/images/ico_channeltalk.png
   ```

3. 권장 사이즈: 40x40 픽셀 (2x: 80x80, 3x: 120x120)

4. MainScreen.js 수정:
   ```javascript
   source={require('../assets/images/ico_channeltalk.png')}
   ```

### 옵션 4: 텍스트 버튼

```javascript
{/* 채널톡 플로팅 버튼 - 텍스트 버전 */}
<TouchableOpacity
  style={[styles.channelTalkButton, styles.channelTalkButtonText]}
  onPress={() => Linking.openURL('https://rootenergy.channel.io')}
  activeOpacity={0.9}
>
  <Text style={styles.channelTalkButtonLabel}>문의</Text>
</TouchableOpacity>
```

styles:
```javascript
channelTalkButtonText: {
  backgroundColor: '#6200ee',
},
channelTalkButtonLabel: {
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
},
```

## 빠른 테스트

아이콘이 제대로 표시되는지 확인:

1. 앱 새로고침 (Cmd+R)
2. 우측 하단 버튼 확인
3. 이미지가 안 보이면 위 옵션 중 선택

## 추천

**지금 당장 작동시키려면**: 옵션 2 (이모지) 사용
- 가장 빠름
- 추가 이미지 파일 불필요
- 모든 플랫폼에서 작동

**브랜드 일관성을 원한다면**: 옵션 3 (공식 아이콘)
- 웹사이트와 동일한 아이콘 사용
- 전문적인 느낌
