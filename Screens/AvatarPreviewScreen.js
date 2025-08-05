import React, { useContext, useState, useEffect, useRef } from "react";
import { View, Image, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Text, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { UserContext } from "../context/UserContext";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

const AvatarPreviewScreen = () => {
  const [showTips, setShowTips] = useState(true); // New state for tips visibility
  const navigation = useNavigation();
  const { user, handleSaveProfile } = useContext(UserContext);
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(true);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const db = getFirestore();

  useEffect(() => {
    if (!user) return;

    const fetchAvatar = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setAvatar(userSnap.data().profileImage || null);
        }
      } catch (error) {
        console.error("❌ Error fetching avatar:", error);
      } finally {
        setLoading(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }
    };

    fetchAvatar();
  }, [user]);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const deleteAvatar = async () => {
    if (!user) return;

    Alert.alert("Delete Avatar", "Are you sure you want to delete your avatar?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { profileImage: "" });

            setAvatar(null);
            Alert.alert("Deleted", "Your avatar has been removed.");
          } catch (error) {
            console.error("❌ Error deleting avatar:", error);
            Alert.alert("Error", "Failed to delete avatar.");
          }
        },
      },
    ]);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("HomeScreen")}>
          <Ionicons name="arrow-back" size={28} color="#C4704F" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Avatar Preview</Text>
        <TouchableOpacity 
          style={styles.infoButton} 
          onPress={() => setShowTips(!showTips)}
          activeOpacity={0.8}
        >
          <Ionicons name="information-circle" size={28} color="#C4704F" />
        </TouchableOpacity>
      </View>

      
      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Avatar Display Section */}
        {loading ? (
          <ActivityIndicator size="large" color="#C4704F" />
        ) : avatar ? (
          <>
            <Animated.Image source={{ uri: avatar }} style={[styles.avatar, { opacity: fadeAnim }]} resizeMode="contain" />
            <Text style={styles.avatarText}>Your Personalized Avatar</Text>
            <Text style={styles.descriptionText}>
              Your unique avatar represents your style and personality. Use it to personalize your wardrobe experience.
            </Text>
          </>
        ) : (
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity style={styles.addAvatarButton} onPress={() => navigation.navigate("AvatarCustomizationScreen")}
              onPressIn={handlePressIn} onPressOut={handlePressOut}>
              <Text style={styles.addAvatarText}>Create Your Avatar</Text>
            </TouchableOpacity>
            <Text style={styles.descriptionText}>
              Create a personalized avatar that represents your unique style and personality.
            </Text>
          </Animated.View>
        )}
      </View>
      {avatar && (
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity style={styles.deleteButton} onPress={deleteAvatar} onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Ionicons name="trash" size={28} color="#C4704F" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
};

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2c1d1a",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#C4704F',
  },
  headerText: {
    color: '#C4704F',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: 'rgba(196,112,79,0.1)',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: '#4a302d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  deleteButton: {
    backgroundColor: 'rgba(196,112,79,0.1)',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: '#4a302d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C4704F',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(74,48,45,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  descriptionText: {
    color: '#C4704F',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  avatar: {
    width: 300,
    height: 300,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#C4704F",
    backgroundColor: "#F8E9D2",
    marginBottom: 20,
  },
  addAvatarButton: {
    backgroundColor: "#C4704F",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#4a302d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

export default AvatarPreviewScreen;
