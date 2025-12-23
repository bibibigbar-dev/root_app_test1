import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';

export default function AppModal({
  visible,
  title,
  onClose,
  backdropClose = true,
  children,
  scroll = true,
  showDivider = true,
  contentContainerStyle,
  footer,
  primaryAction,
  secondaryAction,
}) {
  const handleClose = onClose || (() => {});

  const renderFooter = () => {
    if (footer) return <View style={styles.footer}>{footer}</View>;

    const hasPrimary =
      !!primaryAction?.text && typeof primaryAction?.onPress === 'function';
    const hasSecondary =
      !!secondaryAction?.text && typeof secondaryAction?.onPress === 'function';
    if (!hasPrimary && !hasSecondary) return null;

    return (
      <View style={[styles.footer, hasSecondary && styles.footerRow]}>
        {hasSecondary && (
          <TouchableOpacity
            style={[
              styles.btn,
              styles.btnSecondary,
              secondaryAction?.disabled && styles.btnDisabled,
            ]}
            onPress={secondaryAction.onPress}
            disabled={secondaryAction?.disabled}
          >
            <Text style={[styles.btnText, styles.btnTextSecondary]}>
              {secondaryAction.text}
            </Text>
          </TouchableOpacity>
        )}
        {hasPrimary && (
          <TouchableOpacity
            style={[
              styles.btn,
              styles.btnPrimary,
              hasSecondary ? styles.btnHalf : styles.btnFull,
              primaryAction?.disabled && styles.btnDisabled,
            ]}
            onPress={primaryAction.onPress}
            disabled={primaryAction?.disabled}
          >
            <Text style={styles.btnText}>{primaryAction.text}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.mask}
          activeOpacity={1}
          onPress={backdropClose ? handleClose : undefined}
        />
        <View style={styles.wrapper}>
          <View style={styles.box}>
            {!!title && (
              <>
                <Text style={styles.title}>{title}</Text>
                {showDivider && <View style={styles.titleBorder} />}
              </>
            )}

            {scroll ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
                contentContainerStyle={[
                  styles.scrollContent,
                  contentContainerStyle,
                ]}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={[styles.body, contentContainerStyle]}>
                {children}
              </View>
            )}

            {renderFooter()}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  mask: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(34, 34, 34, 0.7)',
  },
  wrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  titleBorder: {
    height: 1,
    backgroundColor: '#f6f6f6',
    marginBottom: 20,
    marginHorizontal: -20,
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  body: {},
  footer: {
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnFull: {
    width: '100%',
  },
  btnHalf: {
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: '#2c3db8',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#e0e1e2',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  btnTextSecondary: {
    color: '#333',
  },
});
