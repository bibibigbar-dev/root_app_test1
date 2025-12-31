import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import PushNotificationService from '../services/pushNotification';

const NotificationListScreen = ({ navigation, route }) => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  // 화면을 떠날 때 이전 화면에 알림 개수 업데이트 요청
  useEffect(() => {
    return () => {
      // 화면을 떠날 때 실행
      const parent = navigation.getParent();
      if (parent) {
        parent.emit({
          type: 'state',
          data: { refreshNotifications: true },
        });
      }
    };
  }, [navigation]);

  const loadNotifications = async () => {
    try {
      const list = await PushNotificationService.getNotifications();
      setNotifications(list);
    } catch (error) {
      console.error('알림 목록 로드 오류:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification) => {
    // 읽음 처리
    if (!notification.read) {
      await PushNotificationService.markAsRead(notification.id);
      await loadNotifications();
      // 부모 화면에 알림 개수 변경 알림
      navigation.setParams({ refreshNotifications: Date.now() });
    }

    // 알림 타입에 따라 화면 이동
    const data = notification.data;
    if (data.type === 'product' && data.orderKey) {
      navigation.navigate('ProductDetail', { orderKey: data.orderKey });
    } else if (data.type === 'repayment') {
      navigation.navigate('RepaymentHistory');
    } else if (data.type === 'notice' && data.noticeId) {
      navigation.navigate('NoticeDetail', { noticeId: data.noticeId });
    }
  };

  const handleDeleteNotification = (notificationId) => {
    Alert.alert(
      '알림 삭제',
      '이 알림을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await PushNotificationService.deleteNotification(notificationId);
            await loadNotifications();
            // 부모 화면에 알림 개수 변경 알림
            navigation.setParams({ refreshNotifications: Date.now() });
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = async () => {
    await PushNotificationService.markAllAsRead();
    await loadNotifications();
    // 부모 화면에 알림 개수 변경 알림
    navigation.setParams({ refreshNotifications: Date.now() });
  };

  const handleDeleteAll = () => {
    Alert.alert(
      '모든 알림 삭제',
      '모든 알림을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await PushNotificationService.deleteAllNotifications();
            await loadNotifications();
            // 부모 화면에 알림 개수 변경 알림
            navigation.setParams({ refreshNotifications: Date.now() });
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        {!item.read && <View style={styles.unreadDot} />}
        <View style={styles.textContainer}>
          <Text style={[styles.title, !item.read && styles.unreadText]}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.date}>{formatDate(item.receivedAt)}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteNotification(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.deleteButtonText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="notifications-outline"
        color="#000"
        size={24}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyText}>받은 알림이 없습니다</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require('../assets/images/ico_back.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 액션 버튼 */}
      {notifications.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.actionText}>모두 읽음</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton]}
            onPress={handleDeleteAll}
          >
            <Text style={[styles.actionText, styles.deleteText]}>모두 삭제</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 알림 목록 */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={notifications.length === 0 && styles.emptyList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  headerRight: {
    width: 40,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  deleteText: {
    color: '#ff4444',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  unreadItem: {
    backgroundColor: '#f8f9ff',
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2c3db8',
    marginTop: 6,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  unreadText: {
    color: '#222',
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#999',
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default NotificationListScreen;
