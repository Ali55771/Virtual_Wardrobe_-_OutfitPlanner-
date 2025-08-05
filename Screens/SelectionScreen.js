import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getAqiqaOutfits } from '../services/WardrobeService';

const SelectionScreen = ({ route, navigation }) => {
    const { event, city, temperature } = route.params;
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Finding the best outfits for you...');

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                // 1. Fetch AI Recommendations
                setLoadingMessage('Consulting with our AI stylist...');
                const response = await fetch('http://192.168.18.183:5000/recommend', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        event_type: event,
                        city: city
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to get recommendations from the server.');
                }

                const aiRecs = await response.json();

                // 2. Fetch Wardrobe Matches
                setLoadingMessage('Checking your wardrobe for matching items...');
                const wardrobeMatches = await getAqiqaOutfits(event, temperature);

                // 3. Navigate to Recommendation Screen
                setLoadingMessage('Almost there! Preparing your recommendations...');
                navigation.replace('Recommendation', {
                    recommendations: aiRecs.recommendations,
                    wardrobeMatches: wardrobeMatches,
                    event: event,
                    city: city,
                    temperature: temperature
                });

            } catch (error) {
                console.error("Error in selection process:", error);
                setLoading(false);
                Alert.alert(
                    "Error",
                    `Could not prepare recommendations. ${error.message}`,
                    [
                        { text: "Go Back", onPress: () => navigation.goBack() }
                    ]
                );
            }
        };

        fetchRecommendations();
    }, [event, city, temperature, navigation]);

    return (
        <LinearGradient colors={['#2c1d1a', '#4a302d']} style={styles.container}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#C4704F" />
                    <Text style={styles.loadingText}>{loadingMessage}</Text>
                </View>
            ) : (
                <View style={styles.errorContainer}>
                    <Ionicons name="cloud-offline-outline" size={64} color="rgba(255, 255, 255, 0.5)" />
                    <Text style={styles.errorText}>Something went wrong.</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            )}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        paddingHorizontal: 30,
    },
    errorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'white',
        fontSize: 18,
        marginTop: 15,
    },
    backButton: {
        marginTop: 20,
        backgroundColor: '#C4704F',
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderRadius: 20,
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SelectionScreen;
