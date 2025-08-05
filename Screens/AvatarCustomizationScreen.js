import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { UserContext } from "../context/UserContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";

import API_URL from '../config';

// Add this function for web image picking
function WebImagePicker({ onPick }) {
  return (
    <input
      type="file"
      accept="image/*"
      style={{ 
        margin: 10,
        padding: '12px',
        backgroundColor: '#8D6E63',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer'
      }}
      onChange={async (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new window.FileReader();
          reader.onload = (ev) => {
            onPick({
              uri: ev.target.result,
              type: file.type,
              name: file.name,
              isWeb: true,
              fileObj: file,
            });
          };
          reader.readAsDataURL(file);
        }
      }}
    />
  );
}

const AvatarCustomizationScreen = () => {
  const navigation = useNavigation();
  const { user, handleSaveProfile } = useContext(UserContext);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cartoonImage, setCartoonImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow access to gallery.");
      }
    })();
  }, []);

  // Replace selectImage with web support
  const selectImage = async (webImage) => {
    if (Platform.OS === "web" && webImage) {
      setSelectedImage(webImage);
      setCartoonImage(null);
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileType = asset.uri.split(".").pop().toLowerCase();
        const mimeType = fileType === "png" ? "image/png" : "image/jpeg";
        setSelectedImage({
          uri: asset.uri,
          type: mimeType,
          name: `photo.${fileType}`,
        });
        setCartoonImage(null);
      }
    } catch (error) {
      console.error("❌ ImagePicker Error:", error);
      Alert.alert("Error", "Failed to pick an image. Try again.");
    }
  };

  // Update uploadAndCartoonify for web
  const uploadAndCartoonify = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "No image selected. Please choose an image.");
      return;
    }
    setLoading(true);
    setCartoonImage(null);
    try {
      let formData;
      if (Platform.OS === "web" && selectedImage.isWeb) {
        formData = new FormData();
        formData.append("image", selectedImage.fileObj, selectedImage.name);
      } else {
        formData = new FormData();
        formData.append("image", {
          uri: selectedImage.uri,
          type: selectedImage.type,
          name: selectedImage.name,
        });
      }
      const response = await fetch(`${API_URL}/cartoonify`, {
        method: "POST",
        body: formData,   
        headers: Platform.OS === "web" ? {} : {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Server error: ${response.status}`);
      }
      const jsonResponse = await response.json();
      let cartoonImageBase64 = jsonResponse?.cartoonImage;
      if (!cartoonImageBase64) {
        throw new Error("Invalid response from server. No cartoon image received.");
      }
      if (!cartoonImageBase64.startsWith("data:image")) {
        cartoonImageBase64 = `data:image/png;base64,${cartoonImageBase64}`;
      }
      setCartoonImage(cartoonImageBase64);
    } catch (error) {
      console.error("⚠️ API Error:", error);
      Alert.alert("Error", error.message || "Failed to process the image.");
    } finally {
      setLoading(false);
    }
  };
  

  const saveAvatar = async () => {
    if (!cartoonImage) {
      Alert.alert("Error", "No cartoon image available to save.");
      return;
    }
  
    try {
      // Create a proper update object with all required fields
      const updateData = {
        profileImage: cartoonImage,
        Guest: user?.Guest || false, // Ensure Guest is always defined
        username: user?.username || "" // Ensure username is always defined
      };
      
      // Save cartoon avatar to Firestore user profile
      await handleSaveProfile(updateData);
  
      Alert.alert("Success", "Avatar saved to your profile!");
      
      // Navigate to Avatar Preview screen and pass the avatar URI
      navigation.navigate("AvatarPreviewScreen", { avatarUri: cartoonImage });
    } catch (error) {
      console.error("⚠️ Save Error:", error);
      Alert.alert("Save Error", "Failed to save the avatar. Please try again.");
    }
  };
  
  
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.contentContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#F5F5DC" />
      </TouchableOpacity>
  
      <Text style={styles.title}>Avatar Customization</Text>
  
      {/* Custom Button for selecting an image */}
      {Platform.OS === "web" ? (
        <WebImagePicker onPick={(img) => selectImage(img)} />
      ) : (
        <TouchableOpacity style={styles.selectImageButton} onPress={selectImage}>
          <Text style={styles.selectImageButtonText}>Select Image from Gallery</Text>
        </TouchableOpacity>
      )}
  
      {selectedImage && (
        <>
          <Text style={styles.label}>Selected Image:</Text>
          <Image source={{ uri: selectedImage.uri }} style={styles.image} resizeMode="contain" />
        </>
      )}
  
      {/* Custom Button for generating cartoon avatar */}
      <TouchableOpacity
        style={[styles.generateButton, { opacity: selectedImage ? 1 : 0.6 }]}
        onPress={uploadAndCartoonify}
        disabled={!selectedImage || loading}
      >
        <Text style={styles.generateButtonText}>Generate Cartoon Avatar</Text>
      </TouchableOpacity>
  
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8D6E63" />
          <Text style={styles.loadingText}>Processing image...</Text>
        </View>
      )}
  
      {cartoonImage && (
        <>
          <Text style={styles.label}>Cartoon Avatar:</Text>
          <Image source={{ uri: cartoonImage }} style={styles.image} resizeMode="contain" />
  
          {/* Save Button for saving the avatar */}
          <TouchableOpacity style={styles.saveButton} onPress={saveAvatar}>
            <Text style={styles.saveButtonText}>Save Avatar</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
    </ScrollView>
  );
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2E1B13", // Dark brown background
  },
  contentContainer: {
    padding: 16,
    flex: 1,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#F5F5DC", // Light beige text
  },
  label: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
    color: "#F5F5DC", // Light beige text
  },
  image: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#8D6E63", // Medium brown border
  },
  loadingContainer: {
    marginVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#D7CCC8", // Light brown text
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
    backgroundColor: "#5D4037", // Dark brown background
    borderRadius: 20,
    padding: 8,
  },
  selectImageButton: {
    backgroundColor: "#8D6E63", // Medium brown
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    alignSelf: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  selectImageButtonText: {
    color: "#FFFFFF", // White text
    fontSize: 18,
    fontWeight: "bold",
  },
  generateButton: {
    backgroundColor: "#8D6E63", // Medium brown
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    alignSelf: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  generateButtonText: {
    color: "#FFFFFF", // White text
    fontSize: 18,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#A1887F", // Lighter brown for save button
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    alignSelf: "center",
    width: "50%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonText: {
    color: "#FFFFFF", // White text
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AvatarCustomizationScreen;