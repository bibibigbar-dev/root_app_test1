import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import ApiService from '../services/api';
import AppModal from '../components/AppModal';

const NeighborStatusScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [neighborList, setNeighborList] = useState([]);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState('');

  useEffect(() => {
    loadNeighborStatus();
  }, []);

  const loadNeighborStatus = async () => {
    try {
      setLoading(true);

      const currentUser = await ApiService.getCurrentUser();
      const memberId = currentUser?.session?.member_id || currentUser?.id;

      if (!memberId) {
        navigation.replace('Login');
        return;
      }

      const response = await ApiService.api.get('/app/my/neighbor', {
        params: {
          member_id: memberId,
        },
      });

      if (response.data) {
        setNeighborList(response.data.nb || []);
      }
    } catch (error) {
      console.error('이웃신청 현황 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMemoPopup = memo => {
    setSelectedMemo(memo);
    setShowMemoModal(true);
  };

  const formatDate = dateStr => {
    if (!dateStr) return '-';
    return dateStr.substring(0, 10);
  };

  const getStatusText = status => {
    if (status === 'Y') return '승인완료';
    if (status === 'X') return '승인거절';
    return '승인대기';
  };

  const getStatusColor = status => {
    if (status === 'Y') return styles.colorBlue;
    if (status === 'X') return styles.colorRed;
    return styles.colorMint;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.subHeadWrap}>
          <Text style={styles.title}>이웃신청 현황</Text>
        </View>

        <View style={styles.innerCenter}>
          <View style={styles.neighborBanner}>
            <Text style={styles.bannerTxt}>
              주민참여형 사업에 필요한 주민 투자를 위해{'\n'}
              아래 절차에 맞게 진행 부탁드립니다.
            </Text>
            <Image
              source={require('../assets/images/img_neighbor_banner01.png')}
              style={styles.bannerImg}
              resizeMode="contain"
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2c3db8" />
            </View>
          ) : neighborList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyWrapper}>
                <View style={styles.emptyIco}>
                  <Text style={styles.emptyIcoText}>!</Text>
                </View>
                <Text style={styles.emptyMsg}>조회된 목록이 없습니다.</Text>
              </View>
            </View>
          ) : (
            <View style={styles.neighborList}>
              {neighborList.map((item, index) => (
                <View key={index} style={styles.neighborItem}>
                  <View style={styles.inbox}>
                    <Text style={styles.itemTit}>{item.orderName}</Text>
                    <View style={styles.prdDatabox}>
                      <View style={styles.dl}>
                        <Text style={styles.dt}>승인여부</Text>
                        <Text style={[styles.dd, getStatusColor(item.status)]}>
                          {getStatusText(item.status)}
                        </Text>
                      </View>
                      <View style={styles.dl}>
                        <Text style={styles.dt}>승인일자</Text>
                        <Text style={styles.dd}>
                          {item.status === 'Y'
                            ? formatDate(item.certdate)
                            : '-'}
                        </Text>
                      </View>
                      <View style={styles.dl}>
                        <Text style={styles.dt}>비고</Text>
                        {item.status === 'X' ? (
                          <TouchableOpacity
                            onPress={() => handleMemoPopup(item.memo)}
                          >
                            <Text style={styles.memoLink}>사유보기</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.dd}>-</Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 거절 사유 모달 */}
      <AppModal
        visible={showMemoModal}
        title="거절 사유"
        onClose={() => setShowMemoModal(false)}
        primaryAction={{ text: '확인', onPress: () => setShowMemoModal(false) }}
      >
        <Text style={styles.popMsg}>{selectedMemo}</Text>
      </AppModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  subHeadWrap: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '700',
    color: '#222',
  },
  innerCenter: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  neighborBanner: {
    backgroundColor: '#f6f6f6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  bannerTxt: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: '#222',
    marginBottom: 16,
  },
  bannerImg: {
    width: '100%',
    height: 80,
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyWrapper: {
    alignItems: 'center',
  },
  emptyIco: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e1e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  emptyMsg: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#666',
  },
  neighborList: {
    marginTop: 8,
  },
  neighborItem: {
    marginBottom: 16,
  },
  inbox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 12,
    padding: 20,
  },
  itemTit: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
  },
  prdDatabox: {
    gap: 12,
  },
  dl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dt: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: '#666',
  },
  dd: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#222',
  },
  colorBlue: {
    color: '#2c3db8',
  },
  colorRed: {
    color: '#ff5042',
  },
  colorMint: {
    color: '#00c896',
  },
  memoLink: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
    color: '#666',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  popTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 20,
  },
  popMsg: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: '#222',
    textAlign: 'center',
    marginBottom: 24,
  },
  btnBox: {
    marginTop: 16,
  },
  btnStyle: {
    height: 48,
    backgroundColor: '#2c3db8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

export default NeighborStatusScreen;
