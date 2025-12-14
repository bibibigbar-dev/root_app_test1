# 채널톡 간편 설정 가이드

## 현재 설정

기존 웹사이트처럼 채널톡 웹페이지를 여는 방식으로 설정되었습니다.

### 변경 내용
- ✅ 우측 하단 플로팅 버튼 클릭 시 `https://rootenergy.channel.io` 열기
- ✅ 기존 `Linking.openURL` 방식 사용 (웹과 동일)
- ✅ 복잡한 네이티브 SDK 제거

### 버튼 위치
- 화면 우측 하단 (right: 20, bottom: 20)
- 60x60 크기
- 흰색 배경, 그림자 효과

## 아이콘 이미지

현재 `sns_talk.png` 이미지를 사용 중입니다.

### 채널톡 아이콘 추가 방법 (선택사항)

만약 채널톡 전용 아이콘을 원하시면:

1. 채널톡 아이콘 다운로드 (40x40 크기 권장)
2. `src/assets/images/` 폴더에 저장
3. 파일명: `sns_cntalk.png` 또는 `ico_channeltalk.png`

### 텍스트 버전 (대안)

아이콘이 마음에 들지 않으시면 텍스트로 변경 가능합니다:

```javascript
{/* 채널톡 플로팅 버튼 - 텍스트 버전 */}
<TouchableOpacity
  style={styles.channelTalkButton}
  onPress={() => Linking.openURL('https://rootenergy.channel.io')}
  activeOpacity={0.9}
>
  <Text style={styles.channelTalkText}>💬</Text>
</TouchableOpacity>
```

스타일 추가:
```javascript
channelTalkText: {
  fontSize: 30,
  color: '#6200ee',
},
```

## 테스트

1. 앱 새로고침 (Cmd+R 또는 R 키)
2. MainScreen 우측 하단 버튼 확인
3. 버튼 클릭 → 채널톡 웹페이지 열림

## 장점

✅ 네이티브 SDK 불필요 (설치 문제 없음)
✅ 기존 웹과 동일한 경험
✅ 간단한 설정
✅ 즉시 작동
✅ 유지보수 쉬움

## 채널톡 URL 변경

다른 채널톡 URL을 사용하시려면 `MainScreen.js`에서:

```javascript
onPress={() => Linking.openURL('여기에_새_URL')}
```

## 스타일 커스터마이징

버튼 위치, 크기, 색상 변경:

```javascript
channelTalkButton: {
  position: 'absolute',
  right: 20,          // 우측 여백
  bottom: 20,         // 하단 여백
  width: 60,          // 버튼 너비
  height: 60,         // 버튼 높이
  borderRadius: 30,   // 원형
  backgroundColor: '#fff',  // 배경색
  // ... 나머지 스타일
},
```
