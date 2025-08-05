import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { UserContext } from '../../context/UserContext';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { config, API_KEYS } from '../../config';
import { getAqiqaOutfits } from '../../services/WardrobeService';

// Helper function to determine weather range from temperature
const getWeatherRange = (temp) => {
    if (temp < 10) return 'Cold';
    if (temp >= 10 && temp < 20) return 'Cool';
    if (temp >= 20 && temp < 30) return 'Warm';
    return 'Hot';
};

const SelectionScreen = () => {
    const { user } = useContext(UserContext);
    const navigation = useNavigation();

    const [eventName, setEventName] = useState('Aqiqa');
    const [gender, setGender] = useState('Male');
    const [city, setCity] = useState('Gujranwala');
    const [outfitType, setOutfitType] = useState('Formal');
    const [timeOfDay, setTimeOfDay] = useState('Day');
    
    const [currentTemp, setCurrentTemp] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTemperature = async (cityName) => {
        if (!cityName) {
            setError('Please enter a city name.');
            return null;
        }
        try {
            const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEYS.OPENWEATHERMAP_API_KEY}&units=metric`);
            return weatherResponse.data.main.temp;
        } catch (err) {
            console.error('Failed to fetch temperature:', err);
            setError('Could not fetch weather. Please check the city name.');
            return null;
        }
    };

    const handleGetRecommendations = () => {
        setLoading(true);
        setTimeout(() => {
            fetchRecommendations();
        }, 10000);  // 10-second delay
    };

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);
        try {
            const temp = await fetchTemperature(city);
            if (temp === null) {
                setLoading(false);
                return; // Stop if temp fetch failed
            }
            setCurrentTemp(temp);

            // Special logic for 'Aqiqa' event
            if (eventName === 'Aqiqa') {
                const wardrobeId = 'aj0cb6GVUnPiIVFGvc0J'; // Using the correct hardcoded wardrobeId
                let recommendations;

                if (temp >= 21 && temp <= 30) {
                    console.log('Aqiqa event with moderate temperature (21-30°C) detected. Fetching outfits with waistcoat.');
                    recommendations = await getAqiqaOutfits(wardrobeId, temp);
                } else if (temp > 30) {
                    console.log('Aqiqa event with high temperature (>30°C) detected. Fetching special wardrobe outfits.');
                    recommendations = await getAqiqaOutfits(wardrobeId);
                } else {
                    // For temperatures below 21°C, proceed with standard AI recommendation
                    console.log('Aqiqa event with cool temperature (<21°C). Proceeding with standard AI recommendation.');
                }

                if (recommendations) {
                    if (recommendations.length > 0) {
                        navigation.navigate('RecommendationScreen', { recommendations, fromWardrobe: true });
                    } else {
                        Alert.alert(
                            'Items Not Found',
                            'Could not find the required items in your wardrobe for the Aqiqa event. Please add Shalwar-Kameez, Peshawari Chappal, Jubbah, and Sandals to your wardrobe.'
                        );
                    }
                    setLoading(false);
                    return; // Stop further execution for this special case
                }
            }

            // Existing AI Recommendation Logic
            console.log('Proceeding with standard AI recommendation.');
            const weatherRange = getWeatherRange(temp);

            const response = await axios.post(`${config.API_BASE_URL}/recommend`,
                {
                    gender: gender,
                    event: eventName,
                    weather: weatherRange,
                    time_of_day: timeOfDay,
                    outfit_type: outfitType,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data && response.data.recommendations) {
                navigation.navigate('RecommendationScreen', { recommendations: response.data.recommendations, fromWardrobe: false });
            } else {
                setError('No recommendations found for the selected criteria.');
            }
        } catch (err) {
            console.error('Error fetching recommendations:', err);
            setError('Failed to fetch recommendations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>AI Outfit Recommendation</Text>
                <Text style={styles.subtitle}>Select your preferences to get a recommendation</Text>

                <Text style={styles.label}>Event</Text>
                <View style={styles.pickerContainer}>
                    <Picker selectedValue={eventName} onValueChange={(itemValue) => setEventName(itemValue)} style={styles.picker}>
                        <Picker.Item label="Aqiqa" value="Aqiqa" />
                        <Picker.Item label="Engagement" value="Engagement" />
                        <Picker.Item label="Bridal Shower" value="Bridal Shower" />
                        <Picker.Item label="Qwali Night" value="Qwali Night" />
                        <Picker.Item label="Dholak" value="Dholak" />
                        <Picker.Item label="Mayun" value="Mayun" />
                        <Picker.Item label="Mehndi" value="Mehndi" />
                        <Picker.Item label="Barat" value="Barat" />
                        <Picker.Item label="Walima" value="Walima" />
                        <Picker.Item label="Nikah" value="Nikah" />
                        <Picker.Item label="Funeral, Mourning" value="Funeral, Mourning" />
                        <Picker.Item label="Pakistan Day, Independence Day, Defence Day" value="Pakistan Day, Independence Day, Defence Day" />
                        <Picker.Item label="Eid-ul-Fitr, -ul-Adha" value="Eid-ul-Fitr, -ul-Adha" />
                        <Picker.Item label="Business Meetings, Presentations" value="Business Meetings, Presentations" />
                        <Picker.Item label="Office Parties, Corporate Events" value="Office Parties, Corporate Events" />
                        <Picker.Item label="Casual Office Days" value="Casual Office Days" />
                        <Picker.Item label="Casual Outing, Visiting Friends, Visiting Relatives" value="Casual Outing, Visiting Friends, Visiting Relatives" />
                       
                    </Picker>
                </View>

                <Text style={styles.label}>Gender</Text>
                <View style={styles.pickerContainer}>
                    <Picker selectedValue={gender} onValueChange={(itemValue) => setGender(itemValue)} style={styles.picker}>
                        <Picker.Item label="Male" value="Male" />
                        <Picker.Item label="Female" value="Female" />
                    </Picker>
                </View>

                <Text style={styles.label}>City/Location</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="e.g., Gujranwala" />

                {currentTemp !== null && (
                    <Text style={styles.tempText}>
                        Current Temperature: {currentTemp.toFixed(1)}°C
                    </Text>
                )}

                <Text style={styles.label}>Outfit Type</Text>
                <View style={styles.pickerContainer}>
                    <Picker selectedValue={outfitType} onValueChange={(itemValue) => setOutfitType(itemValue)} style={styles.picker}>
                        <Picker.Item label="Formal" value="Formal" />
                        <Picker.Item label="Casual" value="Casual" />
                        <Picker.Item label="Semi-Formal" value="Semi-Formal" />
                    </Picker>
                </View>

                <Text style={styles.label}>Time of Day</Text>
                <View style={styles.pickerContainer}>
                    <Picker selectedValue={timeOfDay} onValueChange={(itemValue) => setTimeOfDay(itemValue)} style={styles.picker}>
                        <Picker.Item label="Day" value="Day" />
                        <Picker.Item label="Night" value="Night" />
                    </Picker>
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleGetRecommendations} 
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Get Recommendations</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2c1d1a', // Deep brown background
    },
    card: {
       backgroundColor: '#4E342E', // Complementary brown
       borderRadius: 15,
       padding: 20,
       margin: 16,
       borderColor: '#5D4037',
       borderWidth: 1,
       shadowColor: '#000',
       shadowOffset: { width: 0, height: 4 },
       shadowOpacity: 0.1,
       shadowRadius: 10,
       elevation: 5,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#EFEBE9', // Light beige text
    },
    subtitle: {
       fontSize: 16,
       color: '#A1887F', // Muted brown text
       textAlign: 'center',
       marginBottom: 24,
    },
    label: {
       fontSize: 16,
       fontWeight: '600',
       color: '#EFEBE9',
       marginBottom: 8,
    },
    input: {
        backgroundColor: '#5D4037', // Darker brown input background
        borderWidth: 1,
        borderColor: '#795548',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 16,
        color: '#EFEBE9',
    },
    pickerContainer: {
        backgroundColor: '#5D4037',
        borderWidth: 1,
        borderColor: '#795548',
        borderRadius: 10,
        marginBottom: 16,
        overflow: 'hidden', // Ensures the picker respects the border radius
    },
    picker: {
        color: '#EFEBE9',
        backgroundColor: 'transparent',
    },
    tempText: {
       fontSize: 14,
       color: '#D7CCC8', // Light gray-brown for temp text
       textAlign: 'center',
       marginBottom: 16,
    },
    button: {
       backgroundColor: '#D7CCC8', // Light beige button
       paddingVertical: 14,
       borderRadius: 10,
       alignItems: 'center',
       marginTop: 10,
       shadowColor: '#000',
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.2,
       shadowRadius: 5,
       elevation: 3,
    },
    buttonText: {
        color: '#3E2723', // Dark brown text for button
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#FF6B6B', // A vibrant red for errors
        textAlign: 'center',
        marginBottom: 10,
    },
});

export default SelectionScreen;
