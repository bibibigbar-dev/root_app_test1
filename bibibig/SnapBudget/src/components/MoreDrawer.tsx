import React from 'react';
import {Image, Modal, Pressable, Text, View} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {styles} from '../styles/appStyles';

type MoreSection = 'settings' | 'backup' | 'excel' | 'budget' | 'institution' | 'category' | 'subscription';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectSection: (section: MoreSection) => void;
};

const menuItems: Array<{key: MoreSection; label: string}> = [
  {key: 'subscription', label: 'Subscription'},
  {key: 'budget', label: 'Budget Management'},
  {key: 'category', label: 'Category Management'},
  {key: 'institution', label: 'Institution Management'},
  {key: 'excel', label: 'Excel Export'},
  {key: 'backup', label: 'Data Backup'},
  {key: 'settings', label: 'Settings'},
];

function MenuItemIcon({itemKey}: {itemKey: MoreSection}) {
  if (itemKey === 'subscription') {
    return <MaterialIcons name="workspace-premium" color="#515151" size={20} />;
  }
  if (itemKey === 'budget') {
    return <MaterialIcons name="account-balance-wallet" color="#515151" size={20} />;
  }
  if (itemKey === 'settings') {
    return <Ionicons name="settings-sharp" color="#515151" size={20} />;
  }
  if (itemKey === 'backup') {
    return <MaterialIcons name="backup" color="#515151" size={20} />;
  }
  if (itemKey === 'excel') {
    return <MaterialCommunityIcons name="file-excel" color="#515151" size={22} />;
  }
  if (itemKey === 'institution') {
    return <FontAwesome name="institution" color="#515151" size={18} />;
  }
  if (itemKey === 'category') {
    return <MaterialIcons name="category" color="#515151" size={20} />;
  }
  return null;
}

export function MoreDrawer({
  visible,
  onClose,
  onSelectSection,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.moreDrawerOverlay}>
        <Pressable style={styles.moreDrawerBackdrop} onPress={onClose} />
        <View style={styles.moreDrawerPanel}>
          <View style={styles.moreDrawerHeader}>
            <Image source={require('../assets/images/logo.png')} style={styles.moreDrawerLogo} resizeMode="cover" />
          </View>
          <View style={styles.moreDrawerMenuList}>
            {menuItems.map(item => (
              <Pressable
                key={item.key}
                style={styles.moreDrawerMenuItem}
                onPress={() => {
                  onSelectSection(item.key);
                  onClose();
                }}>
                <View style={styles.moreDrawerMenuItemInner}>
                  <MenuItemIcon itemKey={item.key} />
                  <Text style={styles.moreDrawerMenuText}>{item.label}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
