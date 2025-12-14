# 백엔드 서버 푸시 알림 구현 가이드

## 1. Firebase Admin SDK 설정

### Node.js 예제

#### 패키지 설치:
```bash
npm install firebase-admin
```

#### Firebase 서비스 계정 키 다운로드:
1. Firebase Console → 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. JSON 키 파일 다운로드
4. 서버의 안전한 위치에 저장 (예: `config/firebase-service-account.json`)

#### 서버 초기화 (`server.js` 또는 `app.js`):
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./config/firebase-service-account.json');

// Firebase Admin 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('Firebase Admin SDK 초기화 완료');
```

---

## 2. FCM 토큰 저장 API

### API 엔드포인트: `POST /api/member/fcm-token`

```javascript
// routes/member.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // 데이터베이스 설정

// FCM 토큰 저장
router.post('/fcm-token', async (req, res) => {
  try {
    const { fcm_token } = req.body;
    const member_id = req.user.member_id; // 인증된 사용자 ID
    
    if (!fcm_token) {
      return res.status(400).json({ error: 'FCM 토큰이 필요합니다' });
    }

    // DB에 토큰 저장 (기존 토큰 업데이트)
    await db.query(
      `INSERT INTO member_fcm_tokens (member_id, fcm_token, updated_at) 
       VALUES (?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE fcm_token = ?, updated_at = NOW()`,
      [member_id, fcm_token, fcm_token]
    );

    res.json({ 
      success: true, 
      message: 'FCM 토큰이 저장되었습니다' 
    });
  } catch (error) {
    console.error('FCM 토큰 저장 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
```

### 데이터베이스 테이블 생성:
```sql
CREATE TABLE member_fcm_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id VARCHAR(50) NOT NULL,
  fcm_token TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_member (member_id),
  INDEX idx_member_id (member_id)
);
```

---

## 3. 푸시 알림 발송 함수

### 단일 사용자에게 알림 전송:
```javascript
// services/pushNotification.js
const admin = require('firebase-admin');

/**
 * 단일 사용자에게 푸시 알림 전송
 */
async function sendPushToUser(fcmToken, title, body, data = {}) {
  try {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: data, // 커스텀 데이터 (문자열만 가능)
      token: fcmToken,
      // Android 설정
      android: {
        priority: 'high',
        notification: {
          channelId: 'default_channel',
          sound: 'default',
        },
      },
      // iOS 설정
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('푸시 알림 발송 성공:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('푸시 알림 발송 실패:', error);
    
    // 토큰이 유효하지 않은 경우 처리
    if (error.code === 'messaging/registration-token-not-registered') {
      console.log('유효하지 않은 FCM 토큰. DB에서 삭제 필요');
      // TODO: DB에서 해당 토큰 삭제
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * 여러 사용자에게 푸시 알림 전송
 */
async function sendPushToMultipleUsers(fcmTokens, title, body, data = {}) {
  try {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: data,
      tokens: fcmTokens, // 여러 토큰 배열
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`푸시 알림 발송 - 성공: ${response.successCount}, 실패: ${response.failureCount}`);
    
    // 실패한 토큰 처리
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(fcmTokens[idx]);
          console.error('실패한 토큰:', fcmTokens[idx], resp.error);
        }
      });
      // TODO: 실패한 토큰 DB에서 제거
    }
    
    return response;
  } catch (error) {
    console.error('멀티 푸시 알림 발송 실패:', error);
    throw error;
  }
}

/**
 * 특정 주제(토픽)로 알림 전송
 */
async function sendPushToTopic(topic, title, body, data = {}) {
  try {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: data,
      topic: topic, // 예: 'all_users', 'new_products'
    };

    const response = await admin.messaging().send(message);
    console.log('토픽 푸시 알림 발송 성공:', response);
    return response;
  } catch (error) {
    console.error('토픽 푸시 알림 발송 실패:', error);
    throw error;
  }
}

module.exports = {
  sendPushToUser,
  sendPushToMultipleUsers,
  sendPushToTopic,
};
```

---

## 4. 실제 사용 예제

### 예제 1: 새 투자 상품 등록 시
```javascript
// routes/product.js
const pushService = require('../services/pushNotification');
const db = require('../config/database');

router.post('/product/create', async (req, res) => {
  try {
    // 상품 등록 로직
    const newProduct = await createProduct(req.body);
    
    // 모든 사용자에게 알림 전송
    const tokens = await db.query(
      'SELECT fcm_token FROM member_fcm_tokens WHERE fcm_token IS NOT NULL'
    );
    
    const fcmTokens = tokens.map(t => t.fcm_token);
    
    await pushService.sendPushToMultipleUsers(
      fcmTokens,
      '🌱 새로운 투자 상품!',
      `${newProduct.product_name}에 투자하세요`,
      {
        type: 'product',
        orderKey: newProduct.order_key,
        screen: 'ProductDetail',
      }
    );
    
    res.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('상품 생성 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});
```

### 예제 2: 투자 상환 완료 시
```javascript
// services/investment.js
const pushService = require('./pushNotification');

async function completeRepayment(investmentId) {
  try {
    // 상환 처리 로직
    const investment = await processRepayment(investmentId);
    
    // 해당 투자자에게 알림
    const token = await db.query(
      'SELECT fcm_token FROM member_fcm_tokens WHERE member_id = ?',
      [investment.member_id]
    );
    
    if (token && token[0]?.fcm_token) {
      await pushService.sendPushToUser(
        token[0].fcm_token,
        '💰 상환 완료!',
        `${investment.product_name}의 원리금이 입금되었습니다`,
        {
          type: 'repayment',
          investmentId: investmentId.toString(),
          screen: 'RepaymentHistory',
        }
      );
    }
    
    return investment;
  } catch (error) {
    console.error('상환 처리 오류:', error);
    throw error;
  }
}
```

### 예제 3: 공지사항 발송
```javascript
// routes/notice.js
router.post('/notice/send', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // 공지사항 저장
    const notice = await saveNotice(title, content);
    
    // 전체 사용자에게 알림 (토픽 사용)
    await pushService.sendPushToTopic(
      'all_users',
      '📢 공지사항',
      title,
      {
        type: 'notice',
        noticeId: notice.id.toString(),
        screen: 'NoticeDetail',
      }
    );
    
    res.json({ success: true, notice });
  } catch (error) {
    console.error('공지사항 발송 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});
```

---

## 5. PHP 예제 (Laravel)

```php
<?php
// app/Services/PushNotificationService.php
namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;

class PushNotificationService
{
    private $messaging;
    
    public function __construct()
    {
        $factory = (new Factory)->withServiceAccount(config('firebase.credentials.file'));
        $this->messaging = $factory->createMessaging();
    }
    
    /**
     * 단일 사용자에게 푸시 알림 전송
     */
    public function sendToUser($fcmToken, $title, $body, $data = [])
    {
        try {
            $message = CloudMessage::withTarget('token', $fcmToken)
                ->withNotification([
                    'title' => $title,
                    'body' => $body,
                ])
                ->withData($data);
            
            $response = $this->messaging->send($message);
            \Log::info('푸시 알림 발송 성공: ' . $response);
            
            return ['success' => true, 'messageId' => $response];
        } catch (\Exception $e) {
            \Log::error('푸시 알림 발송 실패: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * 여러 사용자에게 푸시 알림 전송
     */
    public function sendToMultipleUsers($fcmTokens, $title, $body, $data = [])
    {
        try {
            $messages = [];
            foreach ($fcmTokens as $token) {
                $messages[] = CloudMessage::withTarget('token', $token)
                    ->withNotification([
                        'title' => $title,
                        'body' => $body,
                    ])
                    ->withData($data);
            }
            
            $response = $this->messaging->sendAll($messages);
            \Log::info("푸시 알림 발송 - 성공: {$response->successes()->count()}, 실패: {$response->failures()->count()}");
            
            return $response;
        } catch (\Exception $e) {
            \Log::error('멀티 푸시 알림 발송 실패: ' . $e->getMessage());
            throw $e;
        }
    }
}
```

```php
<?php
// app/Http/Controllers/MemberController.php
use App\Services\PushNotificationService;

public function saveFcmToken(Request $request)
{
    $validated = $request->validate([
        'fcm_token' => 'required|string',
    ]);
    
    $memberId = auth()->user()->member_id;
    
    DB::table('member_fcm_tokens')->updateOrInsert(
        ['member_id' => $memberId],
        [
            'fcm_token' => $validated['fcm_token'],
            'updated_at' => now(),
        ]
    );
    
    return response()->json([
        'success' => true,
        'message' => 'FCM 토큰이 저장되었습니다',
    ]);
}

// 새 상품 등록 시 알림
public function createProduct(Request $request, PushNotificationService $pushService)
{
    $product = Product::create($request->all());
    
    // 모든 사용자에게 알림
    $tokens = DB::table('member_fcm_tokens')
        ->whereNotNull('fcm_token')
        ->pluck('fcm_token')
        ->toArray();
    
    $pushService->sendToMultipleUsers(
        $tokens,
        '🌱 새로운 투자 상품!',
        "{$product->product_name}에 투자하세요",
        [
            'type' => 'product',
            'orderKey' => $product->order_key,
            'screen' => 'ProductDetail',
        ]
    );
    
    return response()->json(['success' => true, 'product' => $product]);
}
```

---

## 6. 알림 시나리오별 구현

### 투자 관련
- ✅ 새 투자 상품 등록
- ✅ 투자 상품 마감 임박 (D-3, D-1)
- ✅ 투자 승인/거절
- ✅ 상환 완료
- ✅ 배당금 지급

### 계정 관련
- ✅ 회원가입 완료
- ✅ 로그인 (다른 기기)
- ✅ 비밀번호 변경
- ✅ 계좌 인증 완료

### 시스템 알림
- ✅ 공지사항
- ✅ 이벤트/프로모션
- ✅ 시스템 점검 안내

---

## 7. 보안 고려사항

### Firebase 서비스 계정 키 보안
```javascript
// ❌ 나쁜 예 - 코드에 직접 포함
const serviceAccount = {
  "project_id": "my-project",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
};

// ✅ 좋은 예 - 환경 변수 사용
const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};
```

### API 인증
```javascript
// FCM 토큰 저장 시 반드시 인증 확인
router.post('/fcm-token', authenticateUser, async (req, res) => {
  // 인증된 사용자만 토큰 저장 가능
});
```

---

## 8. 테스트

### Postman으로 테스트
```json
POST http://your-server.com/api/member/fcm-token
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_JWT_TOKEN

Body:
{
  "fcm_token": "앱에서_받은_FCM_토큰"
}
```

### 알림 발송 테스트
```json
POST http://your-server.com/api/push/test
Headers:
  Content-Type: application/json
  Authorization: Bearer ADMIN_TOKEN

Body:
{
  "member_id": "test_user",
  "title": "테스트 알림",
  "body": "푸시 알림 테스트입니다"
}
```

---

## 요약

1. **Firebase Admin SDK** 서버에 설치 및 초기화
2. **FCM 토큰** 앱에서 받아서 DB에 저장
3. **특정 이벤트 발생 시** 서버에서 푸시 알림 발송
4. **앱에서 알림 수신** 및 처리

백엔드 서버가 준비되면 위 코드를 참고해서 구현하시면 됩니다! 👍
