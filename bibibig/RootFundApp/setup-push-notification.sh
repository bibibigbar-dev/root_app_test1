#!/bin/bash

echo "🔔 푸시 알림 설정 시작..."
echo ""

# 현재 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ 오류: RootFundApp 프로젝트 루트에서 실행해주세요"
    exit 1
fi

echo "1️⃣ Firebase 패키지 설치 중..."
npm install @react-native-firebase/app @react-native-firebase/messaging --save

echo ""
echo "2️⃣ iOS Pod 설치 중..."
cd ios
LANG=en_US.UTF-8 pod install
cd ..

echo ""
echo "✅ 푸시 알림 패키지 설치 완료!"
echo ""
echo "📋 다음 단계:"
echo ""
echo "1. Firebase Console에서 프로젝트 생성"
echo "   https://console.firebase.google.com/"
echo ""
echo "2. Android 앱 추가"
echo "   - 패키지 이름: com.rootfundapp"
echo "   - google-services.json 다운로드"
echo "   - 파일 위치: android/app/google-services.json"
echo ""
echo "3. iOS 앱 추가"
echo "   - 번들 ID 확인 (Xcode에서)"
echo "   - GoogleService-Info.plist 다운로드"
echo "   - Xcode에서 프로젝트에 추가"
echo ""
echo "4. 자세한 설정은 PUSH_NOTIFICATION_GUIDE.md 참고"
echo ""
