import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Pressable, ImageBackground } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedButton = ({ onPress, icon, text }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <LinearGradient
          colors={['#e58c63', '#c4704f']}
          style={styles.entryBtn}
        >
          <Ionicons name={icon} size={28} color="#fff" style={{ marginRight: 15 }} />
          <Text style={styles.entryBtnText}>{text}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const CapsuleEntryScreen = () => {
  const navigation = useNavigation();
  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }}
      style={styles.mainContainer}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0)' }]}>
        <SafeAreaView style={styles.container}>
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={{ ...styles.header, color: 'black' }}>Capsule Wardrobe</Text>
          </View>
          <View style={styles.buttonContainer}>
              <AnimatedButton 
                  onPress={() => navigation.navigate('CapsuleWardrobeScreen')}
                  icon="shirt-outline"
                  text="Open Capsule Wardrobe"
              />
              <AnimatedButton 
                  onPress={() => navigation.navigate('SavedCombinationsScreen')}
                  icon="albums-outline"
                  text="Saved Combinations"
              />
          </View>
        </SafeAreaView>
        <BottomNav />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
    paddingBottom: 65,
  },
  headerContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 6,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  entryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 25,
    marginVertical: 15,
    width: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  entryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default CapsuleEntryScreen;