import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import ApiService from '../services/api';

const InvestReviewContent = ({ navigation, route, user, member_id }) => {
  const [loading, setLoading] = useState(true);
  const [reviewList, setReviewList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [openYn, setOpenYn] = useState(true);
  const [reviewIdx, setReviewIdx] = useState('');

  useEffect(() => {
    loadReviewList();
  }, []);

  const loadReviewList = async () => {
    setLoading(true);
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      
      // GET 요청으로 쿼리 파라미터 전송
      const params = {
        member_id: memberId,
      };
      
      // orderName이 있으면 추가
      if (searchText) {
        params.orderName = searchText;
      }
      
      const response = await ApiService.api.get('/app/my/invest/review', {
        params: params
      });

      if (response.data && response.data.list) {
        const list = response.data.list;
        setReviewList(list);
        
        // 페이지 계산 (2개씩 표시)
        const pages = Math.ceil(list.length / 2);
        setTotalPages(pages > 0 ? pages : 1);
      } else {
        setReviewList([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('투자후기 목록 조회 실패:', error);
      setReviewList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadReviewList();
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '0';
    const stringValue = typeof value === 'string' ? value : String(value);
    const numericValue = stringValue.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // 시간 정보 제거 (공백이나 T로 구분된 시간 부분 제거)
    let dateOnly = dateString.split(' ')[0].split('T')[0];
    
    // YYYY-MM-DD 형식인 경우
    if (dateOnly.includes('-')) {
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        const year = parts[0].slice(-2); // 마지막 2자리
        const month = parts[1];
        const day = parts[2];
        return `${year}.${month}.${day}`;
      }
    }
    
    // YYYYMMDD 형식인 경우
    if (dateOnly.length === 8 && /^\d+$/.test(dateOnly)) {
      const year = dateOnly.slice(2, 4);
      const month = dateOnly.slice(4, 6);
      const day = dateOnly.slice(6, 8);
      return `${year}.${month}.${day}`;
    }
    
    // 기타 형식은 그대로 반환
    return dateOnly;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'FUNDING':
        return { text: '펀딩중', color: '#2c3db8' };
      case 'SUCCESS':
        return { text: '펀딩성공', color: '#2c3db8' };
      case 'REPAY':
      case 'OVERDUE':
        return { text: '상환중', color: '#2ebab4' };
      case 'CANCEL':
        return { text: '취소', color: '#666' };
      case 'COMPLETE':
        return { text: '상환완료', color: '#666' };
      case 'M_COMPLETE':
        return { text: '중도상환', color: '#666' };
      case 'COLLECT':
        return { text: '추심', color: '#666' };
      case 'C_COMPLETE':
        return { text: '추심완료', color: '#666' };
      case 'C_LOSS':
        return { text: '결손처리', color: '#666' };
      default:
        return { text: '펀딩중', color: '#2c3db8' };
    }
  };

  const getStatusBgColor = (status) => {
    if (status === 'FUNDING' || status === 'SUCCESS') return '#2c3db8';
    if (status === 'REPAY' || status === 'OVERDUE') return '#2ebab4';
    return '#666';
  };

  const getProductImage = (orderType) => {
    if (orderType === '태양광') {
      return require('../assets/images/img_product01_s.png');
    } else if (orderType === 'ESS') {
      return require('../assets/images/img_product02_s.png');
    } else if (orderType === '풍력') {
      return require('../assets/images/img_product03_s.png');
    } else if (orderType === '전기차충전소') {
      return require('../assets/images/img_product02_s.png');
    }
    return null;
  };

  const handleOpenReview = async (item, mode) => {
    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      const response = await ApiService.api.post('/app/my/invest/review/get', {
        orderNumber: item.orderNumber,
        member_id: memberId,
      });

      const data = typeof response.data === 'string' 
        ? JSON.parse(response.data) 
        : response.data;

      setSelectedItem(item);
      setReviewIdx(data.review_cnt === '0' ? '' : data.rdto?.review_idx || '');
      setReviewText(data.review_cnt === '0' ? '' : data.rdto?.review || '');
      
      if (mode === 'view') {
        // 보기 모달에서는 서버에서 받은 값 사용
        setOpenYn(data.review_cnt === '0' ? true : (data.rdto?.open_yn === 'Y'));
        setShowViewModal(true);
      } else {
        // 작성/수정 모달에서는 항상 기본값으로 체크되어 있음 (true)
        setOpenYn(true);
        setShowWriteModal(true);
      }
    } catch (error) {
      console.error('후기 조회 실패:', error);
      Alert.alert('오류', '후기 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleSaveReview = async () => {
    if (!selectedItem) return;

    try {
      const memberId = member_id || user?.session?.member_id || user?.id;
      const response = await ApiService.api.post('/app/my/invest/review/save', {
        member_id: memberId,
        orderNumber: selectedItem.orderNumber,
        review: reviewText,
        instalment: selectedItem.instalment,
        open_yn: openYn ? 'Y' : 'N',
      });

      if (response.data === '0' || response.data === 0) {
        Alert.alert('투자 이용후기', '정상적으로 등록되었습니다.', [
          {
            text: '확인',
            onPress: () => {
              setShowWriteModal(false);
              loadReviewList();
            },
          },
        ]);
      } else if (response.data === '1' || response.data === 1) {
        navigation.navigate('Login');
      } else {
        console.warn('Unexpected review save response:', response.data);
        Alert.alert('투자 이용후기', '처리도중 오류가 발생하였습니다.');
      }
    } catch (error) {
      console.error('후기 저장 실패:', error);
      Alert.alert('투자 이용후기', '처리도중 오류가 발생하였습니다.');
    }
  };

  const handleDeleteReview = async () => {
    if (!selectedItem || !reviewIdx) return;

    Alert.alert(
      '투자 이용후기',
      '정말 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const memberId = member_id || user?.session?.member_id || user?.id;
              const response = await ApiService.api.post('/app/my/invest/review/delete', {
                member_id: memberId,
                orderNumber: selectedItem.orderNumber,
                idx: reviewIdx,
              });

              if (response.data === '0' || response.data === 0) {
                Alert.alert('투자 이용후기', '정상적으로 삭제되었습니다.', [
                  {
                    text: '확인',
                    onPress: () => {
                      setShowViewModal(false);
                      loadReviewList();
                    },
                  },
                ]);
              } else if (response.data === '1' || response.data === 1) {
                navigation.navigate('Login');
              } else {
                console.warn('Unexpected review delete response:', response.data);
                Alert.alert('투자 이용후기', '처리도중 오류가 발생하였습니다.');
              }
            } catch (error) {
              console.error('후기 삭제 실패:', error);
              Alert.alert('투자 이용후기', '처리도중 오류가 발생하였습니다.');
            }
          },
        },
      ]
    );
  };

  const visibleItems = reviewList.slice(0, currentPage * 2);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3db8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 검색 영역 */}
        {reviewList.length > 0 && (
          <View style={styles.searchBox}>
            <View style={styles.searchInputWrapper}>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="예) 고성군 솔라발전소"
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Image
                source={require('../assets/images/ico_search.png')}
                style={styles.searchIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* 목록 영역 */}
        {reviewList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.loadingWrapperReview}>
              <Image 
                source={require('../assets/images/loading3.png')} 
                style={styles.loadingIco}
                resizeMode="contain"
              />
              <Text style={styles.loadingMsg}>
                투자 후 참여 하실 수 있습니다.
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.listContainer}>
              {visibleItems.map((item, index) => {
                const statusInfo = getStatusText(item.status);
                const bgColor = getStatusBgColor(item.status);
                const productImage = getProductImage(item.orderType);

                return (
                  <View key={item.idx || index} style={styles.invItem}>
                    {/* 헤더 */}
                    <View style={[styles.invHead, { backgroundColor: bgColor }]}>
                      <Text style={styles.invHeadTitle}>
                        채권번호 <Text style={styles.invHeadTitleEm}>RB-{item.idx}</Text>
                      </Text>
                    </View>

                    {/* 내용 */}
                    <View style={styles.invCont}>
                      <View style={styles.prdInfoBox}>
                        <View style={styles.prdInfo}>
                          <View style={styles.prdImgBox}>
                            {productImage ? (
                              <Image source={productImage} style={styles.prdIcon} resizeMode="contain" />
                            ) : (
                              <Text style={styles.prdIcon}>📦</Text>
                            )}
                          </View>
                          <View style={styles.prdTxtBox}>
                            <Text style={styles.prdTit} numberOfLines={1}>
                              {item.orderName}
                            </Text>
                            <Text style={styles.prdTxt}>
                              {item.orderType} {item.orderNum}호
                            </Text>
                          </View>
                        </View>
                        <View style={styles.prdPrice}>
                          <Text style={styles.prdPriceLabel}>투자금액</Text>
                          <Text style={styles.prdPriceValue}>
                            {formatCurrency(item.price)}원
                          </Text>
                        </View>
                      </View>

                      <View style={styles.prdDataBox}>
                        <View style={styles.prdDataItem}>
                          <Text style={styles.prdDataLabel}>연 수익률</Text>
                          <Text style={styles.prdDataValue}>{item.rate}%</Text>
                        </View>
                        <View style={styles.prdDataItem}>
                          <Text style={styles.prdDataLabel}>상환회차</Text>
                          <Text style={styles.prdDataValue}>
                            {item.instalment}/{item.period}
                          </Text>
                        </View>
                        <View style={styles.prdDataItem}>
                          <Text style={styles.prdDataLabel}>상환일</Text>
                          <Text style={styles.prdDataValue}>{formatDate(item.repay_date)}</Text>
                        </View>
                        <View style={styles.prdDataItem}>
                          <Text style={styles.prdDataLabel}>상태</Text>
                          <Text style={[styles.prdDataValue, { color: statusInfo.color }]}>
                            {statusInfo.text}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 버튼 영역 */}
                    <View style={styles.invBtnBox}>
                      {item.review_idx === '0' || !item.review_idx ? (
                        <TouchableOpacity
                          style={styles.invBtn}
                          onPress={() => handleOpenReview(item, 'save')}
                        >
                          <Text style={styles.invBtnText}>투자 이용후기 작성</Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.invBtn}
                            onPress={() => handleOpenReview(item, 'view')}
                          >
                            <Text style={styles.invBtnText}>내용보기</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.invBtn}
                            onPress={() => handleOpenReview(item, 'save')}
                          >
                            <Text style={styles.invBtnText}>수정</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* 더보기 버튼 */}
            {currentPage < totalPages && (
              <View style={styles.loadMoreContainer}>
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                >
                  <Text style={styles.loadMoreText}>더보기 ({currentPage}/{totalPages})</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* 후기 작성/수정 모달 */}
      <Modal
        visible={showWriteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWriteModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowWriteModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>투자 이용후기 작성</Text>

            <View style={styles.modalBody}>
              <View style={styles.flexTit}>
                <Text style={styles.flexTitText}>상품명</Text>
              </View>
              <View style={styles.flexInput}>
                <View style={styles.txtVal}>
                  <Text style={styles.txtValText}>{selectedItem?.orderName || ''}</Text>
                </View>
              </View>

              <View style={styles.flexTit}>
                <Text style={styles.flexTitText}>이용후기</Text>
              </View>
              <View style={styles.flexInput}>
                <TextInput
                  style={styles.textarea}
                  value={reviewText}
                  onChangeText={setReviewText}
                  placeholder="투자 이용후기를 입력해주세요"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.flexTit}>
                <Text style={styles.flexTitText}>공개글 여부</Text>
              </View>
              <View style={styles.flexInput}>
                <TouchableOpacity
                  style={styles.labelBox}
                  onPress={() => setOpenYn((prev) => !prev)}
                >
                  <View style={[styles.checkbox, openYn && styles.checkboxChecked]}>
                    {openYn && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.labelBoxText}>
                    (게시판 공개를 원하지 않을 경우 체크 해제)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.buyTxt}>
              해당 상품에 대한 투자 이용후기를{'\n'}등록 하시겠습니까?
            </Text>

            <View style={styles.btnBox}>
              <TouchableOpacity
                style={[styles.btnStyle, styles.btnStyleCancel]}
                onPress={() => setShowWriteModal(false)}
              >
                <Text style={styles.btnStyleTextCancel}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnStyle, styles.btnStyleConfirm, styles.btnStyleSecond]}
                onPress={handleSaveReview}
              >
                <Text style={styles.btnStyleTextConfirm}>등록하기</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 후기 보기/삭제 모달 */}
      <Modal
        visible={showViewModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowViewModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowViewModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>투자 이용후기</Text>

            <View style={styles.modalBody}>
              <View style={styles.flexTit}>
                <Text style={styles.flexTitText}>상품명</Text>
              </View>
              <View style={styles.flexInput}>
                <View style={styles.txtVal}>
                  <Text style={styles.txtValText}>{selectedItem?.orderName || ''}</Text>
                </View>
              </View>

              <View style={styles.flexTit}>
                <Text style={styles.flexTitText}>이용후기</Text>
              </View>
              <View style={styles.flexInput}>
                <TextInput
                  style={[styles.textarea, styles.textareaDisabled]}
                  value={reviewText}
                  editable={false}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.flexTit}>
                <Text style={styles.flexTitText}>공개글 여부</Text>
              </View>
              <View style={styles.flexInput}>
                <View style={styles.labelBox}>
                  <View style={[styles.checkbox, openYn && styles.checkboxChecked]}>
                    {openYn && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.labelBoxText}>
                    (게시판 공개를 원하지 않을 경우 체크 해제)
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.btnBox}>
              <TouchableOpacity
                style={[styles.btnStyle, styles.btnStyleCancel]}
                onPress={() => setShowViewModal(false)}
              >
                <Text style={styles.btnStyleTextCancel}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnStyle, styles.btnStyleConfirm]}
                onPress={handleDeleteReview}
              >
                <Text style={styles.btnStyleTextConfirm}>삭제하기</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginLeft: 160,
    marginRight: 16,
    gap: 5,
  },
  searchInputWrapper: {
    flex: 1,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    backgroundColor: '#fbfbfb',
  },
  searchInput: {
    flex: 1,
    height: 32,
    paddingVertical: 0,
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
    textAlignVertical: 'center',
  },
  searchButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    width: 24,
    height: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingWrapperReview: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  loadingIco: {
    width: 40,
    height: 40,
  },
  loadingMsg: {
    marginTop: 16,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingDesc: {
    marginTop: 16,
    color: '#666',
    fontSize: 15,
    lineHeight: 22.5,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  invItem: {
    flexDirection: 'column',
    position: 'relative',
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#68738f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  invHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  invHeadTitle: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  invHeadTitleEm: {
    fontWeight: '600',
  },
  invCont: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(224, 225, 226, 0.5)',
    borderTopWidth: 0,
  },
  prdInfoBox: {
    paddingVertical: 16,
  },
  prdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prdImgBox: {
    width: 28,
    height: 31,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prdIcon: {
    width: 28,
    height: 31,
  },
  prdTxtBox: {
    flex: 1,
    overflow: 'hidden',
  },
  prdTit: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
    color: '#222',
  },
  prdTxt: {
    marginTop: 2,
    color: '#a3a7ab',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  prdPrice: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
  },
  prdPriceLabel: {
    marginRight: 8,
    color: '#666',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '400',
  },
  prdPriceValue: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#222',
  },
  prdDataBox: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(246, 246, 246, 0.5)',
  },
  prdDataItem: {
    flex: 1,
    paddingHorizontal: 10,
  },
  prdDataLabel: {
    color: '#a3a7ab',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  prdDataValue: {
    marginTop: 8,
    color: '#393f44',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    textAlign: 'right',
  },
  invBtnBox: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f6f6f6',
  },
  invBtn: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invBtnText: {
    color: '#666',
    fontSize: 13,
    lineHeight: 40,
    fontWeight: '500',
  },
  loadMoreContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#e0e1e2',
    backgroundColor: '#fff',
  },
  loadMoreText: {
    marginRight: 8,
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(34, 34, 34, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
  },
  modalBody: {
    paddingHorizontal: 4,
    paddingTop: 16,
  },
  flexTit: {
    marginTop: 20,
  },
  flexTitText: {
    marginVertical: -4,
    color: '#666',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  flexInput: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 12,
  },
  txtVal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingLeft: 8,
  },
  txtValText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600',
    color: '#222',
  },
  textarea: {
    flex: 1,
    minWidth: 0,
    height: 120,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    backgroundColor: '#fbfbfb',
    color: '#222',
  },
  textareaDisabled: {
    backgroundColor: '#f2f2f2',
  },
  labelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginRight: 30,
    marginLeft: 0,
  },
  checkbox: {
    width: 21,
    height: 21,
    borderWidth: 1,
    borderColor: '#e0e1e2',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#2c3db8',
    borderColor: '#2c3db8',
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  labelBoxText: {
    marginLeft: 0,
    fontSize: 14,
    lineHeight: 21,
    color: '#666',
  },
  buyTxt: {
    marginTop: 24,
    color: '#393f44',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  btnBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  btnStyle: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnStyleCancel: {
    borderWidth: 1,
    borderColor: '#e0e1e2',
    backgroundColor: '#fff',
  },
  btnStyleConfirm: {
    backgroundColor: '#2c3db8',
    borderWidth: 1,
    borderColor: '#2c3db8',
  },
  btnStyleTextCancel: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '400',
    color: '#a3a7ab',
  },
  btnStyleTextConfirm: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '500',
    color: '#fff',
  },
});

export default InvestReviewContent;
