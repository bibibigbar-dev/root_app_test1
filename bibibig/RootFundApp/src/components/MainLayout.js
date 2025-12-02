import React from 'react';
import { View, StyleSheet } from 'react-native';
import Header from './Header';

const MainLayout = ({ children, navigation, showBack = false, onBackPress, hideBorder = false, hideGnb = false }) => {
  return (
    <View style={styles.container}>
      <Header 
        navigation={navigation}
        showBack={showBack}
        onBackPress={onBackPress}
        hideBorder={hideBorder}
        hideGnb={hideGnb}
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});

export default MainLayout;

