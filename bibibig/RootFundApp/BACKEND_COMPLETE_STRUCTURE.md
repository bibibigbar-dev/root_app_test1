# 📦 백엔드 푸시 알림 완전 구조 가이드

> **다중 모듈 Spring Boot 프로젝트 구조**  
> Common (공통 로직) + Admin (관리자 API) + User (사용자 앱 API)

---

## 📂 전체 파일 구조

```
📦 RootFund Backend (Multi-Module)
│
├── 📁 Common (공통 모듈)
│   ├── src/main/java/com/invader/
│   │   ├── business/
│   │   │   ├── dto/FcmDTO.java                    ← FCM 데이터 전송 객체
│   │   │   ├── dao/FcmDAO.java                    ← FCM DB 접근 계층
│   │   │   └── service/                           (없음, firebase 폴더 사용)
│   │   └── api/firebase/
│   │       ├── FirebaseConfig.java                ← Firebase Admin SDK 초기화
│   │       └── FcmService.java                    ← FCM 알림 발송 비즈니스 로직
│   ├── src/main/resources/
│   │   ├── mapper/business/Fcm-Sql.xml            ← MyBatis SQL 매퍼
│   │   └── root-martion-firebase-adminsdk-rrlof-ee37154f03.json  ← Firebase 키
│   └── pom.xml                                     ← Common 의존성
│
├── 📁 Admin (관리자 모듈)
│   ├── src/main/java/com/invader/apis/
│   │   ├── controller/AdminFcmController.java     ← 관리자 FCM 테스트 API
│   │   └── AdminApplication.java                  ← Admin 앱 엔트리포인트
│   ├── src/main/resources/
│   │   └── application.properties                 ← Admin 설정
│   └── pom.xml                                     ← Admin 의존성 (Common 포함)
│
└── 📁 User (사용자 앱 모듈)
    ├── src/main/java/com/invader/user/
    │   ├── app/UserFcmController.java             ← 사용자 앱 FCM API
    │   └── UserApplication.java                   ← User 앱 엔트리포인트
    ├── src/main/resources/
    │   └── application.properties                 ← User 설정
    └── pom.xml                                     ← User 의존성 (Common 포함)
```

---

## 📄 Common/src/main/java/com/invader/business/dto/FcmDTO.java

```java
package com.invader.business.dto;

import com.invader.plugin.SitePluginDTO;

/**
 * FCM 푸시 알림 데이터 전송 객체
 */
public class FcmDTO extends SitePluginDTO {
    
    private static final long serialVersionUID = 1L;
    
    private String memberId;           // 회원 ID
    private String fcmToken;           // FCM 디바이스 토큰
    private String deviceType;         // 디바이스 타입 (ios/android)
    private String updatedAt;          // 토큰 업데이트 시간
    
    // 알림 발송용 필드
    private String title;              // 알림 제목
    private String body;               // 알림 내용
    private String screenName;         // 이동할 화면 (예: MyHome, Main)
    private String notificationType;   // 알림 타입 (예: repayment_completed)
    
    // 대량 발송용
    private String[] memberIds;        // 여러 회원 ID 배열

    // Getters and Setters
    public String getMemberId() {
        return memberId;
    }

    public void setMemberId(String memberId) {
        this.memberId = memberId;
    }

    public String getFcmToken() {
        return fcmToken;
    }

    public void setFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }

    public String getDeviceType() {
        return deviceType;
    }

    public void setDeviceType(String deviceType) {
        this.deviceType = deviceType;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getScreenName() {
        return screenName;
    }

    public void setScreenName(String screenName) {
        this.screenName = screenName;
    }

    public String getNotificationType() {
        return notificationType;
    }

    public void setNotificationType(String notificationType) {
        this.notificationType = notificationType;
    }

    public String[] getMemberIds() {
        return memberIds;
    }

    public void setMemberIds(String[] memberIds) {
        this.memberIds = memberIds;
    }
}
```

---

## 📄 Common/src/main/java/com/invader/business/dao/FcmDAO.java

```java
package com.invader.business.dao;

import com.invader.business.dto.FcmDTO;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Repository;

import javax.annotation.Resource;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;

/**
 * FCM 푸시 알림 DAO
 */
@Repository("com.invader.business.dao.FcmDAO")
public class FcmDAO {
    
    Logger log = LogManager.getLogger(FcmDAO.class);
    
    @Resource(name = "default_sql_sqlSessionFactory")
    private SqlSessionFactory default_sqlSessionFactory;
    
    /**
     * 회원의 FCM 토큰 조회
     */
    public FcmDTO selectFcmToken(FcmDTO dto) {
        SqlSession default_sqlSession = default_sqlSessionFactory.openSession();
        FcmDTO result = null;
        
        try {
            result = default_sqlSession.selectOne(FcmDAO.class.getName() + ".selectFcmToken", dto);
            log.info("✅ FCM 토큰 조회 완료: {}", dto.getMemberId());
        } catch (Exception e) {
            log.error("❌ FCM 토큰 조회 실패: {}", e.getMessage());
        } finally {
            default_sqlSession.close();
        }
        
        return result;
    }
    
    /**
     * 회원의 FCM 토큰 저장 (INSERT)
     */
    public int insertFcmToken(FcmDTO dto) {
        SqlSession default_sqlSession = default_sqlSessionFactory.openSession();
        Connection conn = default_sqlSession.getConnection();
        int result = 0;
        
        try {
            conn.setAutoCommit(false);
            result = default_sqlSession.insert(FcmDAO.class.getName() + ".insertFcmToken", dto);
            conn.commit();
            log.info("✅ FCM 토큰 저장 성공: {}", dto.getMemberId());
        } catch (Exception e) {
            default_sqlSession.rollback();
            log.error("❌ FCM 토큰 저장 실패: {}", e.getMessage());
        } finally {
            default_sqlSession.close();
        }
        
        return result;
    }
    
    /**
     * 회원의 FCM 토큰 업데이트 (UPDATE)
     */
    public int updateFcmToken(FcmDTO dto) {
        SqlSession default_sqlSession = default_sqlSessionFactory.openSession();
        Connection conn = default_sqlSession.getConnection();
        int result = 0;
        
        try {
            conn.setAutoCommit(false);
            result = default_sqlSession.update(FcmDAO.class.getName() + ".updateFcmToken", dto);
            conn.commit();
            log.info("✅ FCM 토큰 업데이트 성공: {}", dto.getMemberId());
        } catch (Exception e) {
            default_sqlSession.rollback();
            log.error("❌ FCM 토큰 업데이트 실패: {}", e.getMessage());
        } finally {
            default_sqlSession.close();
        }
        
        return result;
    }
    
    /**
     * 회원의 FCM 토큰 삭제 (로그아웃 시)
     */
    public int deleteFcmToken(FcmDTO dto) {
        SqlSession default_sqlSession = default_sqlSessionFactory.openSession();
        Connection conn = default_sqlSession.getConnection();
        int result = 0;
        
        try {
            conn.setAutoCommit(false);
            result = default_sqlSession.delete(FcmDAO.class.getName() + ".deleteFcmToken", dto);
            conn.commit();
            log.info("✅ FCM 토큰 삭제 성공: {}", dto.getMemberId());
        } catch (Exception e) {
            default_sqlSession.rollback();
            log.error("❌ FCM 토큰 삭제 실패: {}", e.getMessage());
        } finally {
            default_sqlSession.close();
        }
        
        return result;
    }
    
    /**
     * 활성화된 모든 FCM 토큰 조회 (대량 발송용)
     */
    public List<FcmDTO> selectAllActiveFcmTokens() {
        SqlSession default_sqlSession = default_sqlSessionFactory.openSession();
        List<FcmDTO> result = new ArrayList<>();
        
        try {
            result = default_sqlSession.selectList(FcmDAO.class.getName() + ".selectAllActiveFcmTokens");
            log.info("✅ 전체 FCM 토큰 조회 완료: {}개", result.size());
        } catch (Exception e) {
            log.error("❌ 전체 FCM 토큰 조회 실패: {}", e.getMessage());
        } finally {
            default_sqlSession.close();
        }
        
        return result;
    }
}
```

---

## 📄 Common/src/main/resources/mapper/business/Fcm-Sql.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.invader.business.dao.FcmDAO">

    <!-- DTO MAP -->
    <parameterMap id="fcm" type="com.invader.business.dto.FcmDTO"/>
    
    <!-- 회원의 FCM 토큰 조회 -->
    <select id="selectFcmToken" parameterMap="fcm" resultType="com.invader.business.dto.FcmDTO">
        SELECT 
            member_id AS memberId,
            fcm_token AS fcmToken,
            fcm_device_type AS deviceType,
            fcm_updated_at AS updatedAt
        FROM 
            member
        WHERE 
            member_id = #{memberId}
            AND fcm_token IS NOT NULL
    </select>
    
    <!-- FCM 토큰 저장 (INSERT) -->
    <insert id="insertFcmToken" parameterMap="fcm">
        INSERT INTO member (
            member_id,
            fcm_token,
            fcm_device_type,
            fcm_updated_at
        ) VALUES (
            #{memberId},
            #{fcmToken},
            #{deviceType},
            NOW()
        )
    </insert>
    
    <!-- FCM 토큰 업데이트 (UPDATE) -->
    <update id="updateFcmToken" parameterMap="fcm">
        UPDATE member
        SET 
            fcm_token = #{fcmToken},
            fcm_device_type = #{deviceType},
            fcm_updated_at = NOW()
        WHERE 
            member_id = #{memberId}
    </update>
    
    <!-- FCM 토큰 삭제 (로그아웃 시) -->
    <delete id="deleteFcmToken" parameterMap="fcm">
        UPDATE member
        SET 
            fcm_token = NULL,
            fcm_device_type = NULL,
            fcm_updated_at = NOW()
        WHERE 
            member_id = #{memberId}
    </delete>
    
    <!-- 활성화된 모든 FCM 토큰 조회 (대량 발송용) -->
    <select id="selectAllActiveFcmTokens" resultType="com.invader.business.dto.FcmDTO">
        SELECT 
            member_id AS memberId,
            fcm_token AS fcmToken,
            fcm_device_type AS deviceType,
            fcm_updated_at AS updatedAt
        FROM 
            member
        WHERE 
            fcm_token IS NOT NULL
            AND fcm_token != ''
        ORDER BY 
            fcm_updated_at DESC
    </select>

</mapper>
```

---

## 📄 Common/src/main/java/com/invader/api/firebase/FirebaseConfig.java

```java
package com.invader.api.firebase;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import javax.annotation.PostConstruct;
import java.io.InputStream;

/**
 * Firebase Admin SDK 초기화 설정
 */
@Configuration
public class FirebaseConfig {
    
    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                
                // resources 폴더에서 Firebase 키 파일 로드
                ClassPathResource resource = new ClassPathResource("root-martion-firebase-adminsdk-rrlof-ee37154f03.json");
                InputStream serviceAccount = resource.getInputStream();
                
                if (serviceAccount == null) {
                    System.err.println("❌ Firebase 키 파일을 찾을 수 없습니다!");
                    System.err.println("   경로: src/main/resources/root-martion-firebase-adminsdk-rrlof-ee37154f03.json");
                    return;
                }
                
                FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();
                
                FirebaseApp.initializeApp(options);
                
                System.out.println("========================================");
                System.out.println("✅ Firebase Admin SDK 초기화 완료");
                System.out.println("   프로젝트: root-martion");
                System.out.println("========================================");
            }
        } catch (Exception e) {
            System.err.println("❌ Firebase 초기화 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
```

---

## 📄 Common/src/main/java/com/invader/api/firebase/FcmService.java

```java
package com.invader.api.firebase;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.invader.business.dao.FcmDAO;
import com.invader.business.dto.FcmDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;

/**
 * FCM 푸시 알림 비즈니스 로직
 */
@Service
public class FcmService {
    
    @Autowired
    private FcmDAO fcmDAO;
    
    /**
     * FCM 토큰으로 직접 알림 발송
     */
    public HashMap<String, Object> sendNotification(FcmDTO dto) {
        HashMap<String, Object> resultMap = new HashMap<>();
        String rtnValue = "0";
        String errorMsg = "";
        
        try {
            Notification notification = Notification.builder()
                .setTitle(dto.getTitle())
                .setBody(dto.getBody())
                .build();
            
            Message message = Message.builder()
                .setToken(dto.getFcmToken())
                .setNotification(notification)
                .build();
            
            String response = FirebaseMessaging.getInstance().send(message);
            
            rtnValue = "1";
            errorMsg = "알림 발송 성공";
            resultMap.put("firebase_response", response);
            
            System.out.println("✅ 알림 발송 성공: " + response);
            
        } catch (Exception e) {
            System.err.println("❌ 알림 발송 실패: " + e.getMessage());
            e.printStackTrace();
            rtnValue = "0";
            errorMsg = "알림 발송 오류: " + e.getMessage();
        }
        
        resultMap.put("rtnValue", rtnValue);
        resultMap.put("errorMsg", errorMsg);
        return resultMap;
    }
    
    /**
     * 회원 ID로 알림 발송
     */
    public HashMap<String, Object> sendNotificationToMember(FcmDTO dto) {
        HashMap<String, Object> resultMap = new HashMap<>();
        String rtnValue = "0";
        String errorMsg = "";
        
        try {
            // DB에서 FCM 토큰 조회
            FcmDTO queryDto = new FcmDTO();
            queryDto.setMemberId(dto.getMemberId());
            FcmDTO fcmInfo = fcmDAO.selectFcmToken(queryDto);
            
            if (fcmInfo == null || fcmInfo.getFcmToken() == null || fcmInfo.getFcmToken().isEmpty()) {
                rtnValue = "0";
                errorMsg = "FCM 토큰이 없습니다.";
                resultMap.put("rtnValue", rtnValue);
                resultMap.put("errorMsg", errorMsg);
                return resultMap;
            }
            
            // 토큰 설정 후 발송
            dto.setFcmToken(fcmInfo.getFcmToken());
            return sendNotification(dto);
            
        } catch (Exception e) {
            System.err.println("❌ 회원 알림 발송 실패: " + e.getMessage());
            e.printStackTrace();
            rtnValue = "0";
            errorMsg = "알림 발송 오류: " + e.getMessage();
        }
        
        resultMap.put("rtnValue", rtnValue);
        resultMap.put("errorMsg", errorMsg);
        return resultMap;
    }
    
    /**
     * 여러 회원에게 동시 발송
     */
    public HashMap<String, Object> sendNotificationToMultipleMembers(FcmDTO dto) {
        HashMap<String, Object> resultMap = new HashMap<>();
        String rtnValue = "0";
        String errorMsg = "";
        int successCount = 0;
        int failCount = 0;
        
        try {
            String[] memberIds = dto.getMemberIds();
            
            for (String memberId : memberIds) {
                try {
                    FcmDTO memberDto = new FcmDTO();
                    memberDto.setMemberId(memberId.trim());
                    memberDto.setTitle(dto.getTitle());
                    memberDto.setBody(dto.getBody());
                    
                    HashMap<String, Object> result = sendNotificationToMember(memberDto);
                    
                    if ("1".equals(result.get("rtnValue"))) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (Exception e) {
                    failCount++;
                }
            }
            
            rtnValue = "1";
            errorMsg = "대량 알림 발송 완료: 성공 " + successCount + "건, 실패 " + failCount + "건";
            resultMap.put("successCount", successCount);
            resultMap.put("failCount", failCount);
            
        } catch (Exception e) {
            System.err.println("❌ 대량 알림 발송 오류: " + e.getMessage());
            e.printStackTrace();
            rtnValue = "0";
            errorMsg = "대량 알림 발송 오류: " + e.getMessage();
        }
        
        resultMap.put("rtnValue", rtnValue);
        resultMap.put("errorMsg", errorMsg);
        return resultMap;
    }
}
```

---

## 📄 Admin/src/main/java/com/invader/apis/controller/AdminFcmController.java

```java
package com.invader.apis.controller;

import com.invader.business.dao.FcmDAO;
import com.invader.business.dto.FcmDTO;
import com.invader.api.firebase.FcmService;
import com.invader.core.util.Util;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

/**
 * 관리자 - FCM 테스트 컨트롤러
 * (개발/테스트 환경용)
 */
@Controller
public class AdminFcmController {
    
    @Autowired
    private FcmService fcmService;
    
    @Autowired
    private FcmDAO fcmDAO;
    
    /**
     * 테스트: FCM 토큰으로 직접 발송
     * POST /admin/fcm/test/send
     */
    @RequestMapping(value = "/admin/fcm/test/send", method = RequestMethod.POST)
    @ResponseBody
    public HashMap<String, Object> testSend(HttpServletRequest request, @ModelAttribute FcmDTO dto) throws Exception {
        dto.setRecordid(Util.toString(request.getAttribute("ssoManagementId")));
        
        System.out.println("========================================");
        System.out.println("🔔 [테스트] FCM 직접 발송");
        System.out.println("   제목: " + dto.getTitle());
        System.out.println("   내용: " + dto.getBody());
        System.out.println("========================================");
        
        return fcmService.sendNotification(dto);
    }
    
    /**
     * 테스트: 회원 ID로 알림 발송
     * POST /admin/fcm/test/member
     */
    @RequestMapping(value = "/admin/fcm/test/member", method = RequestMethod.POST)
    @ResponseBody
    public HashMap<String, Object> testMemberSend(HttpServletRequest request, @ModelAttribute FcmDTO dto) throws Exception {
        dto.setRecordid(Util.toString(request.getAttribute("ssoManagementId")));
        
        System.out.println("========================================");
        System.out.println("🔔 [테스트] 회원 알림 발송");
        System.out.println("   회원ID: " + dto.getMemberId());
        System.out.println("   제목: " + dto.getTitle());
        System.out.println("========================================");
        
        return fcmService.sendNotificationToMember(dto);
    }
    
    /**
     * 테스트: 특정 회원 FCM 토큰 조회
     * GET /admin/fcm/test/token?member_id=4587
     */
    @RequestMapping(value = "/admin/fcm/test/token", method = RequestMethod.GET)
    @ResponseBody
    public Map<String, Object> testGetToken(@RequestParam("member_id") String memberId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            FcmDTO dto = new FcmDTO();
            dto.setMemberId(memberId);
            FcmDTO fcmInfo = fcmDAO.selectFcmToken(dto);
            
            if (fcmInfo != null && fcmInfo.getFcmToken() != null) {
                result.put("success", true);
                result.put("member_id", fcmInfo.getMemberId());
                result.put("fcm_token", fcmInfo.getFcmToken());
                result.put("device_type", fcmInfo.getDeviceType());
                System.out.println("✅ 토큰 조회 성공: " + memberId);
            } else {
                result.put("success", false);
                result.put("message", "등록된 FCM 토큰이 없습니다");
            }
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "오류: " + e.getMessage());
            System.err.println("❌ 토큰 조회 실패: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 테스트: Firebase 초기화 상태 확인
     * GET /admin/fcm/test/firebase
     */
    @RequestMapping(value = "/admin/fcm/test/firebase", method = RequestMethod.GET)
    @ResponseBody
    public Map<String, Object> testFirebase() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            com.google.firebase.FirebaseApp app = com.google.firebase.FirebaseApp.getInstance();
            
            result.put("success", true);
            result.put("project_id", app.getOptions().getProjectId());
            System.out.println("✅ Firebase 정상");
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
            System.err.println("❌ Firebase 오류: " + e.getMessage());
        }
        
        return result;
    }
}
```

---

## 📄 User/src/main/java/com/invader/user/app/UserFcmController.java

```java
package com.invader.user.app;

import com.invader.business.dao.FcmDAO;
import com.invader.business.dto.FcmDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;

/**
 * 사용자 앱 - FCM 푸시 알림 컨트롤러
 */
@Controller
@RequestMapping("/api/fcm")
public class UserFcmController {
    
    @Autowired
    private FcmDAO fcmDAO;
    
    /**
     * FCM 토큰 등록 API (로그인 시 자동 호출)
     * POST /api/fcm/register
     */
    @RequestMapping(value = "/register", method = RequestMethod.POST)
    @ResponseBody
    public HashMap<String, Object> registerFcmToken(@ModelAttribute FcmDTO dto, HttpServletRequest request) throws Exception {
        HashMap<String, Object> resultMap = new HashMap<>();
        String rtnValue = "0";
        String errorMsg = "";
        
        try {
            String memberId = (String) request.getSession().getAttribute("member_id");
            
            if (memberId == null || memberId.isEmpty()) {
                rtnValue = "0";
                errorMsg = "로그인이 필요합니다.";
                resultMap.put("rtnValue", rtnValue);
                resultMap.put("errorMsg", errorMsg);
                return resultMap;
            }
            
            dto.setMemberId(memberId);
            
            System.out.println("========================================");
            System.out.println("📱 [사용자 앱] FCM 토큰 등록 요청");
            System.out.println("   회원ID: " + memberId);
            System.out.println("   디바이스: " + dto.getDeviceType());
            System.out.println("========================================");
            
            FcmDTO existingToken = fcmDAO.selectFcmToken(dto);
            
            int updateResult = 0;
            if (existingToken != null && existingToken.getFcmToken() != null) {
                updateResult = fcmDAO.updateFcmToken(dto);
                System.out.println("🔄 기존 토큰 UPDATE");
            } else {
                updateResult = fcmDAO.insertFcmToken(dto);
                System.out.println("✨ 신규 토큰 INSERT");
            }
            
            if (updateResult > 0) {
                rtnValue = "1";
                errorMsg = "FCM 토큰이 성공적으로 저장되었습니다.";
                System.out.println("✅ FCM 토큰 등록 성공");
            } else {
                rtnValue = "0";
                errorMsg = "FCM 토큰 저장 실패.";
                System.err.println("❌ FCM 토큰 등록 실패");
            }
            
        } catch (Exception e) {
            System.err.println("❌ FCM 토큰 등록 실패: " + e.getMessage());
            e.printStackTrace();
            rtnValue = "0";
            errorMsg = "토큰 등록 중 오류가 발생했습니다: " + e.getMessage();
        }
        
        System.out.println("========================================");
        resultMap.put("rtnValue", rtnValue);
        resultMap.put("errorMsg", errorMsg);
        return resultMap;
    }
    
    /**
     * FCM 토큰 삭제 (로그아웃 시 호출)
     * POST /api/fcm/unregister
     */
    @RequestMapping(value = "/unregister", method = RequestMethod.POST)
    @ResponseBody
    public HashMap<String, Object> unregisterFcmToken(HttpServletRequest request) throws Exception {
        HashMap<String, Object> resultMap = new HashMap<>();
        String rtnValue = "0";
        String errorMsg = "";
        
        try {
            String memberId = (String) request.getSession().getAttribute("member_id");
            
            if (memberId != null && !memberId.isEmpty()) {
                FcmDTO dto = new FcmDTO();
                dto.setMemberId(memberId);
                
                System.out.println("========================================");
                System.out.println("🗑️ [사용자 앱] FCM 토큰 삭제 요청");
                System.out.println("   회원ID: " + memberId);
                System.out.println("========================================");
                
                int deleteResult = fcmDAO.deleteFcmToken(dto);
                
                if (deleteResult > 0) {
                    rtnValue = "1";
                    errorMsg = "FCM 토큰이 성공적으로 삭제되었습니다.";
                    System.out.println("✅ FCM 토큰 삭제 성공");
                } else {
                    rtnValue = "0";
                    errorMsg = "FCM 토큰 삭제 실패.";
                    System.err.println("❌ FCM 토큰 삭제 실패");
                }
                
                System.out.println("========================================");
            } else {
                rtnValue = "0";
                errorMsg = "로그인된 회원 정보가 없습니다.";
                System.out.println("⚠️ 로그인 정보 없음 - 토큰 삭제 불가");
            }
            
        } catch (Exception e) {
            System.err.println("❌ FCM 토큰 삭제 실패: " + e.getMessage());
            e.printStackTrace();
            rtnValue = "0";
            errorMsg = "토큰 삭제 중 오류가 발생했습니다: " + e.getMessage();
        }
        
        resultMap.put("rtnValue", rtnValue);
        resultMap.put("errorMsg", errorMsg);
        return resultMap;
    }
    
    /**
     * FCM 토큰 조회 (디버그용)
     * GET /api/fcm/token
     */
    @RequestMapping(value = "/token", method = RequestMethod.GET)
    @ResponseBody
    public HashMap<String, Object> getFcmToken(HttpServletRequest request) throws Exception {
        HashMap<String, Object> resultMap = new HashMap<>();
        String rtnValue = "0";
        String errorMsg = "";
        
        try {
            String memberId = (String) request.getSession().getAttribute("member_id");
            
            if (memberId == null || memberId.isEmpty()) {
                rtnValue = "0";
                errorMsg = "로그인이 필요합니다.";
                resultMap.put("rtnValue", rtnValue);
                resultMap.put("errorMsg", errorMsg);
                return resultMap;
            }
            
            FcmDTO queryDto = new FcmDTO();
            queryDto.setMemberId(memberId);
            FcmDTO fcmInfo = fcmDAO.selectFcmToken(queryDto);
            
            if (fcmInfo != null && fcmInfo.getFcmToken() != null && !fcmInfo.getFcmToken().isEmpty()) {
                rtnValue = "1";
                errorMsg = "FCM 토큰 조회 성공";
                resultMap.put("fcm_token", fcmInfo.getFcmToken());
                resultMap.put("member_id", fcmInfo.getMemberId());
                resultMap.put("device_type", fcmInfo.getDeviceType());
                resultMap.put("updated_at", fcmInfo.getUpdatedAt());
                
                System.out.println("✅ FCM 토큰 조회 성공: " + memberId);
            } else {
                rtnValue = "0";
                errorMsg = "등록된 FCM 토큰이 없습니다.";
                System.out.println("⚠️ 등록된 FCM 토큰 없음: " + memberId);
            }
            
        } catch (Exception e) {
            System.err.println("❌ FCM 토큰 조회 오류: " + e.getMessage());
            e.printStackTrace();
            rtnValue = "0";
            errorMsg = "FCM 토큰 조회 중 오류가 발생했습니다.";
        }
        
        resultMap.put("rtnValue", rtnValue);
        resultMap.put("errorMsg", errorMsg);
        return resultMap;
    }
    
    /**
     * 하위 호환용: 기존 앱에서 사용하는 경로
     * POST /member/save_fcm_token.json
     */
    @RequestMapping(value = "/member/save_fcm_token.json", method = RequestMethod.POST)
    @ResponseBody
    public HashMap<String, Object> saveFcmTokenLegacy(
        @RequestParam("fcm_token") String fcmToken,
        HttpServletRequest request
    ) throws Exception {
        HashMap<String, Object> resultMap = new HashMap<>();
        String rtnValue = "0";
        String errorMsg = "";
        
        try {
            String memberId = (String) request.getSession().getAttribute("member_id");
            
            if (memberId == null || memberId.isEmpty()) {
                rtnValue = "0";
                errorMsg = "로그인이 필요합니다.";
                resultMap.put("rtnValue", rtnValue);
                resultMap.put("errorMsg", errorMsg);
                return resultMap;
            }
            
            System.out.println("📱 [레거시 API] FCM 토큰 저장: " + memberId);
            
            FcmDTO dto = new FcmDTO();
            dto.setMemberId(memberId);
            dto.setFcmToken(fcmToken);
            dto.setDeviceType("unknown");
            
            FcmDTO existingToken = fcmDAO.selectFcmToken(dto);
            
            int updateResult = 0;
            if (existingToken != null && existingToken.getFcmToken() != null) {
                updateResult = fcmDAO.updateFcmToken(dto);
            } else {
                updateResult = fcmDAO.insertFcmToken(dto);
            }
            
            if (updateResult > 0) {
                rtnValue = "1";
                errorMsg = "FCM 토큰 저장 성공";
                System.out.println("✅ 레거시 FCM 토큰 저장 성공");
            } else {
                rtnValue = "0";
                errorMsg = "FCM 토큰 저장 실패";
            }
            
        } catch (Exception e) {
            System.err.println("❌ 레거시 FCM 토큰 저장 실패: " + e.getMessage());
            e.printStackTrace();
            rtnValue = "0";
            errorMsg = "레거시 토큰 저장 중 오류가 발생했습니다.";
        }
        
        resultMap.put("rtnValue", rtnValue);
        resultMap.put("errorMsg", errorMsg);
        return resultMap;
    }
}
```

---

## 📄 Admin/src/main/java/com/invader/apis/AdminApplication.java

```java
package com.invader.apis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {
    "com.invader.apis",           // Admin 컨트롤러
    "com.invader.api.firebase",   // Firebase 설정 (Common)
    "com.invader.business.dao",   // DAO (Common)
    "com.invader.business.service" // Service (Common)
})
public class AdminApplication {
    public static void main(String[] args) {
        SpringApplication.run(AdminApplication.java, args);
    }
}
```

---

## 📄 User/src/main/java/com/invader/user/UserApplication.java

```java
package com.invader.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {
    "com.invader.user",           // User 컨트롤러
    "com.invader.api.firebase",   // Firebase 설정 (Common)
    "com.invader.business.dao",   // DAO (Common)
    "com.invader.business.service" // Service (Common)
})
public class UserApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserApplication.java, args);
    }
}
```

---

## 📄 Common/pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.invader</groupId>
    <artifactId>common</artifactId>
    <version>2.0.0</version>
    <packaging>jar</packaging>

    <dependencies>
        <!-- Firebase Admin SDK -->
        <dependency>
            <groupId>com.google.firebase</groupId>
            <artifactId>firebase-admin</artifactId>
            <version>9.1.1</version>
        </dependency>

        <!-- MyBatis -->
        <dependency>
            <groupId>org.mybatis</groupId>
            <artifactId>mybatis</artifactId>
            <version>3.5.9</version>
        </dependency>

        <dependency>
            <groupId>org.mybatis</groupId>
            <artifactId>mybatis-spring</artifactId>
            <version>2.0.7</version>
        </dependency>

        <!-- Spring Framework -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <version>5.3.20</version>
        </dependency>

        <!-- Log4j2 -->
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-api</artifactId>
            <version>2.17.2</version>
        </dependency>

        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-core</artifactId>
            <version>2.17.2</version>
        </dependency>
    </dependencies>

    <build>
        <resources>
            <!-- src/main/resources 폴더의 모든 파일 포함 -->
            <resource>
                <directory>src/main/resources</directory>
                <includes>
                    <include>**/*</include>
                </includes>
            </resource>
            
            <!-- src/main/java 폴더의 JSON 파일 포함 (Firebase 키) -->
            <resource>
                <directory>src/main/java</directory>
                <includes>
                    <include>**/*.json</include>
                </includes>
            </resource>
        </resources>
    </build>
</project>
```

---

## 📄 Admin/pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.invader</groupId>
    <artifactId>admin</artifactId>
    <version>2.0.0</version>
    <packaging>war</packaging>

    <dependencies>
        <!-- Common 모듈 의존성 -->
        <dependency>
            <groupId>com.invader</groupId>
            <artifactId>common</artifactId>
            <version>2.0.0</version>
        </dependency>

        <!-- Spring Boot Starter Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <version>2.7.0</version>
        </dependency>

        <!-- Servlet API -->
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>javax.servlet-api</artifactId>
            <version>4.0.1</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>
</project>
```

---

## 📄 User/pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.invader</groupId>
    <artifactId>user</artifactId>
    <version>2.0.0</version>
    <packaging>war</packaging>

    <dependencies>
        <!-- Common 모듈 의존성 -->
        <dependency>
            <groupId>com.invader</groupId>
            <artifactId>common</artifactId>
            <version>2.0.0</version>
        </dependency>

        <!-- Spring Boot Starter Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <version>2.7.0</version>
        </dependency>

        <!-- Servlet API -->
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>javax.servlet-api</artifactId>
            <version>4.0.1</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>
</project>
```

---

## 🗄️ DB 스키마

### member 테이블에 FCM 관련 컬럼 추가

```sql
-- FCM 토큰 저장 컬럼 추가
ALTER TABLE member ADD COLUMN fcm_token VARCHAR(255) NULL COMMENT 'FCM 디바이스 토큰';
ALTER TABLE member ADD COLUMN fcm_device_type VARCHAR(20) NULL COMMENT '디바이스 타입 (ios/android)';
ALTER TABLE member ADD COLUMN fcm_updated_at DATETIME NULL COMMENT 'FCM 토큰 업데이트 시간';

-- FCM 토큰 검색 인덱스 추가
CREATE INDEX idx_fcm_token ON member(fcm_token);
```

---

## 🔐 .gitignore 추가

```gitignore
# Firebase Admin SDK 키 파일 (보안상 Git에 올리지 말 것!)
**/firebase/*-firebase-adminsdk-*.json
**/*-firebase-adminsdk-*.json
root-martion-firebase-adminsdk-*.json
```

---

## 🧪 Admin API 테스트 방법

### 1️⃣ **Firebase 초기화 확인**
```bash
GET http://localhost:8080/admin/fcm/test/firebase
```

### 2️⃣ **회원 토큰 조회**
```bash
GET http://localhost:8080/admin/fcm/test/token?member_id=4587
```

### 3️⃣ **토큰으로 직접 발송 테스트**
```bash
POST http://localhost:8080/admin/fcm/test/send
Content-Type: application/x-www-form-urlencoded

fcm_token=디바이스토큰값
title=테스트 알림
body=푸시 테스트입니다
```

### 4️⃣ **회원 ID로 발송 테스트**
```bash
POST http://localhost:8080/admin/fcm/test/member
Content-Type: application/x-www-form-urlencoded

member_id=4587
title=상환 완료
body=10,000원이 상환되었습니다
```

---

## 📱 User API (사용자 앱)

### 1️⃣ **FCM 토큰 등록** (로그인 시)
```bash
POST http://localhost:8080/api/fcm/register
Content-Type: application/x-www-form-urlencoded

fcm_token=디바이스토큰값
device_type=ios
```

### 2️⃣ **FCM 토큰 삭제** (로그아웃 시)
```bash
POST http://localhost:8080/api/fcm/unregister
```

### 3️⃣ **FCM 토큰 조회** (디버그용)
```bash
GET http://localhost:8080/api/fcm/token
```

---

## ✅ 최종 체크리스트

### **백엔드 개발자**
- [ ] Firebase Admin SDK 키 파일을 `Common/src/main/resources/`에 배치
- [ ] DB에 `fcm_token`, `fcm_device_type`, `fcm_updated_at` 컬럼 추가
- [ ] Common 모듈 빌드 후 Admin/User 모듈에서 참조
- [ ] Admin 테스트 API로 Firebase 연동 확인
- [ ] User API로 토큰 등록/삭제 테스트

### **프론트엔드 개발자**
- [ ] 로그인 성공 시 `/api/fcm/register` 호출
- [ ] 로그아웃 시 `/api/fcm/unregister` 호출
- [ ] Firebase 초기화 및 토큰 획득 로직 완료
- [ ] Push Test 화면에서 관리자 테스트 API 연동

---

## 🎯 결론

**Admin Controller는 이제 `/admin/fcm/test/` 하위로 통일!**
- ✅ `/admin/fcm/test/send` - 토큰 직접 발송
- ✅ `/admin/fcm/test/member` - 회원 ID로 발송
- ✅ `/admin/fcm/test/token?member_id=xxx` - 회원 토큰 조회
- ✅ `/admin/fcm/test/firebase` - Firebase 상태 확인

**User Controller는 `/api/fcm/` 유지!**
- ✅ `/api/fcm/register` - 토큰 등록
- ✅ `/api/fcm/unregister` - 토큰 삭제
- ✅ `/api/fcm/token` - 토큰 조회

깔끔하게 정리 완료! 🎉
