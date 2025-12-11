/**
 * Pretendard 폰트 유틸리티
 * fontWeight에 따라 적절한 Pretendard 폰트 패밀리를 반환합니다.
 */

export const getFontFamily = (fontWeight) => {
  if (!fontWeight) return 'Pretendard-Regular';
  
  const weight = String(fontWeight);
  
  if (weight === '700' || weight === 'bold') {
    return 'Pretendard-Bold';
  } else if (weight === '600') {
    return 'Pretendard-SemiBold';
  } else if (weight === '500') {
    return 'Pretendard-Medium';
  } else if (weight === '400' || weight === 'normal') {
    return 'Pretendard-Regular';
  }
  
  return 'Pretendard-Regular';
};

/**
 * 스타일 객체에 fontFamily를 추가합니다.
 * fontWeight가 있으면 해당하는 Pretendard 폰트를 자동으로 설정합니다.
 */
export const applyFont = (style) => {
  if (!style) return { fontFamily: 'Pretendard-Regular' };
  
  const fontWeight = style.fontWeight;
  const fontFamily = getFontFamily(fontWeight);
  
  return {
    ...style,
    fontFamily,
  };
};

/**
 * 여러 스타일 객체를 병합하고 폰트를 적용합니다.
 */
export const mergeStyles = (...styles) => {
  const merged = Object.assign({}, ...styles);
  return applyFont(merged);
};

// 기본 폰트 스타일
export const fontStyles = {
  regular: {
    fontFamily: 'Pretendard-Regular',
    fontWeight: '400',
  },
  medium: {
    fontFamily: 'Pretendard-Medium',
    fontWeight: '500',
  },
  semiBold: {
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: '600',
  },
  bold: {
    fontFamily: 'Pretendard-Bold',
    fontWeight: '700',
  },
};
