import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

const CustomText = (props) => {
  const { style, ...otherProps } = props;
  
  // fontWeight에 따라 적절한 Pretendard 폰트 선택
  const getFontFamily = () => {
    const styleArray = Array.isArray(style) ? style : [style];
    const flatStyle = StyleSheet.flatten(styleArray);
    const fontWeight = flatStyle?.fontWeight;

    if (fontWeight === 'bold' || fontWeight === '700' || fontWeight === '800') {
      return 'Pretendard-Bold';
    } else if (fontWeight === '600') {
      return 'Pretendard-SemiBold';
    } else if (fontWeight === '500') {
      return 'Pretendard-Medium';
    } else {
      return 'Pretendard-Regular';
    }
  };

  const defaultStyle = {
    fontFamily: getFontFamily(),
  };

  return <RNText style={[defaultStyle, style]} {...otherProps} />;
};

export default CustomText;
