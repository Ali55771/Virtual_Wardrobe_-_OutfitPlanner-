import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, ActivityIndicator, ScrollView, Dimensions, Alert, Modal, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const VirtualTryOnScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { combination } = route.params;
  const scrollViewRef = useRef(null);

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState('Upper Layer');
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState({ upper: null, lower: null });
  const hoverAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const db = getFirestore(); // Use Firestore
          const userDocRef = doc(db, 'users', user.uid); // Reference to the user document in Firestore
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.profileImage) {
              setAvatarUrl(userData.profileImage);
            } else {
              console.log('No profileImage field in user document');
            }
          } else {
            console.log('No such user document!');
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch your avatar.');
        console.error('Failed to fetch avatar:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatar();

    Animated.loop(
      Animated.sequence([
        Animated.timing(hoverAnim, {
          toValue: 10, // moves down
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(hoverAnim, {
          toValue: 0, // moves back up
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [hoverAnim]);

  const handleScroll = (direction) => {
    const scrollAmount = width * 0.6;
    if (direction === 'left') {
        scrollViewRef.current.scrollTo({ x: scrollViewRef.current.scrollX - scrollAmount, animated: true });
    } else {
        scrollViewRef.current.scrollTo({ x: scrollViewRef.current.scrollX + scrollAmount, animated: true });
    }
  };

  const handleItemSelect = (item) => {
    const key = selectedLayer === 'Upper Layer' ? 'upper' : 'lower';
    setSelectedItems(prev => ({ ...prev, [key]: item }));
  };

  return (
    <LinearGradient colors={['#F5DDC5', '#E7C6A9']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>
      <Text style={styles.header}>Virtual Try-On Studio</Text>
      <Text style={styles.subtitle}>Your Avatar Model</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#333" style={{ flex: 1 }} />
      ) : (
        <View style={styles.mainContent}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Animated.Image source={{ uri: avatarUrl }} style={[styles.avatar, { transform: [{ translateY: hoverAnim }] }]} resizeMode="contain" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-circle-outline" size={150} color="#444" />
                <Text style={styles.placeholderText}>No Avatar Found</Text>
              </View>
            )}
            <LinearGradient
              colors={['#00FFFF', '#1E90FF']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.glowEffect}
            />
          </View>

          <View style={styles.bottomContainer}>
            <View style={styles.carouselContainer}>
              <TouchableOpacity style={styles.arrowButton} onPress={() => handleScroll('left')}>
                <Ionicons name="chevron-back-outline" size={30} color="#333" />
              </TouchableOpacity>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.itemsContainer}
                onLayout={(event) => { scrollViewRef.current.scrollX = 0; }}
              >
                {combination.map((item, index) => {
                  const isSelected = (selectedItems.upper && selectedItems.upper.id === item.id) || (selectedItems.lower && selectedItems.lower.id === item.id);
                  return (
                    <TouchableOpacity key={index} onPress={() => handleItemSelect(item)} style={[styles.itemCard, isSelected && styles.selectedItemCard]}>
                      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                      <Text style={styles.itemText}>{item.clothingType}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity style={styles.arrowButton} onPress={() => handleScroll('right')}>
                <Ionicons name="chevron-forward-outline" size={30} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.layerButton} onPress={() => setDropdownVisible(true)}>
                <Text style={styles.layerButtonText}>{selectedLayer}</Text>
                <Ionicons name="chevron-down-outline" size={20} color="#333" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.tryOnButton}>
                <Text style={styles.tryOnButtonText}>Try On</Text>
              </TouchableOpacity>
            </View>

            <Modal
              transparent={true}
              visible={isDropdownVisible}
              onRequestClose={() => setDropdownVisible(false)}
            >
              <TouchableOpacity style={styles.modalOverlay} onPress={() => setDropdownVisible(false)}>
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSelectedLayer('Upper Layer'); setDropdownVisible(false); }}>
                    <Text style={styles.dropdownItemText}>Upper Layer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSelectedLayer('Lower Layer'); setDropdownVisible(false); }}>
                    <Text style={styles.dropdownItemText}>Lower Layer</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        </View>
      )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    padding: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginTop: 55,
    marginBottom: 15,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '80%',
  },
  avatar: {
    width: '100%',
    height: '80%',
    transform: [{ translateX: -15 }], // Nudge the avatar to the left
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    marginTop: 10,
    fontSize: 16,
  },
  glowEffect: {
    position: 'center',
    bottom: '1%',
    width: '20%',
    backgroundColor: '#FFC57D',
    right: '-1%',
    height: 40,
    borderRadius: 25,
    transform: [{ scaleX: 2 }, { scaleY: 0.5 }],
    opacity: 0.9,
    overflow: 'hidden',
  },
  bottomContainer: {
    paddingBottom: 30,
  },
  carouselContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  itemsContainer: {
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  selectedItemCard: {
    borderColor: '#00BFFF',
    borderWidth: 3,
    borderRadius: 18,
  },
  itemCard: {
    alignItems: 'center',
    marginHorizontal: 10,
    width: width / 4,
  },
  itemImage: {
    width: 100,
    height: 120,
    borderRadius: 15,
    backgroundColor: '#222',
  },
  itemText: {
    color: '#333',
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  arrowButton: {
    paddingHorizontal: 15,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  layerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  layerButtonText: {
    color: '#333',
    fontSize: 16,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    width: '60%',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  dropdownItem: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dropdownItemText: {
    color: '#333',
    fontSize: 16,
  },
  tryOnButton: {
    backgroundColor: '#00BFFF',
    paddingVertical: 18,
    paddingHorizontal: 80,
    borderRadius: 35,
    alignSelf: 'center',
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  tryOnButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default VirtualTryOnScreen;
