import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

const CustomText = (props) => {
  const { style, ...otherProps } = props;
  return (
    <RNText
      {...otherProps}
      style={[styles.defaultText, style]}
    />
  );
};

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: 'Pretendard',
  },
});

export default CustomText;

