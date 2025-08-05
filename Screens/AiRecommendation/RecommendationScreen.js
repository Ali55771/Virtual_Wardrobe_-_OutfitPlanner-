import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Helper function to render a single wardrobe item
const renderWardrobeItem = (itemData) => {
    if (!itemData) return null;

    // Override outfit type for Sandals to always be Formal
    const displayOutfitType = itemData.clothingType === 'Sandals' ? 'Formal' : itemData.outfitType;

    return (
        <View style={styles.itemContainer}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: itemData.imageUrl }} style={styles.itemImage} />
                <View style={styles.imageOverlay}>
                    <Ionicons name="checkmark-circle" size={24} color="#C4704F" />
                </View>
            </View>
            <View style={styles.itemDetailsContainer}>
                <View style={styles.detailRow}>
                    <Ionicons name="shirt-outline" size={16} color="#C4704F" />
                    <Text style={styles.detailText}><Text style={styles.detailLabel}>Outfit:</Text> {displayOutfitType}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="pricetag-outline" size={16} color="#C4704F" />
                    <Text style={styles.detailText}><Text style={styles.detailLabel}>Type:</Text> {itemData.clothingType}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="color-palette-outline" size={16} color="#C4704F" />
                    <Text style={styles.detailText}><Text style={styles.detailLabel}>Color:</Text> {itemData.Colour}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="layers-outline" size={16} color="#C4704F" />
                    <Text style={styles.detailText}><Text style={styles.detailLabel}>Stuff:</Text> {itemData.stuff}</Text>
                </View>
            </View>
        </View>
    );
};

// Helper function to render a complete outfit from the wardrobe
const renderWardrobeOutfit = (item, onAccept, onReject, isAccepted) => {
    return (
        <View style={styles.outfitCard}>
            <View style={styles.outfitHeader}>
                <Ionicons name="sparkles" size={20} color="#C4704F" />
                <Text style={styles.outfitName}>{item.outfit_name}</Text>
                <View style={styles.wardrobeBadge}>
                    <Text style={styles.badgeText}>Your Wardrobe</Text>
                </View>
            </View>
            {item.wardrobe_items.dress && renderWardrobeItem(item.wardrobe_items.dress)}
            {item.wardrobe_items.waistcoat && renderWardrobeItem(item.wardrobe_items.waistcoat)}
            {item.wardrobe_items.shoes && renderWardrobeItem(item.wardrobe_items.shoes)}
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]} 
                    onPress={() => onReject(item.id)}>
                    <Ionicons name="close-circle-outline" size={22} color="#E74C3C" />
                    <Text style={[styles.actionButtonText, { color: '#E74C3C' }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.acceptButton, isAccepted && styles.acceptedButton]} 
                    onPress={() => onAccept(item.id)}
                    disabled={isAccepted}>
                    <Ionicons name="checkmark-circle-outline" size={22} color="#2ECC71" />
                    <Text style={[styles.actionButtonText, { color: '#2ECC71' }]}>{isAccepted ? 'Accepted' : 'Accept'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Helper function to render an AI-generated outfit recommendation
const renderAIOutfit = (item, onAccept, onReject, isAccepted) => {
    return (
        <View style={styles.outfitCard}>
            <View style={styles.outfitHeader}>
                <Ionicons name="bulb" size={20} color="#C4704F" />
                <Text style={styles.outfitName}>{item.outfit_name}</Text>
                <View style={styles.aiBadge}>
                    <Text style={styles.badgeText}>AI Recommended</Text>
                </View>
            </View>
            <View style={styles.aiRecommendationContainer}>
                <View style={styles.aiItemRow}>
                    <Ionicons name="shirt-outline" size={18} color="#C4704F" />
                    <Text style={styles.aiItemText}>{`Dress: ${item.dress_item} (${item.dress_color})`}</Text>
                </View>
                {item.waistcoat_item && (
                    <View style={styles.aiItemRow}>
                        <Ionicons name="body-outline" size={18} color="#C4704F" />
                        <Text style={styles.aiItemText}>{`Waistcoat: ${item.waistcoat_item} (${item.waistcoat_color})`}</Text>
                    </View>
                )}
                <View style={styles.aiItemRow}>
                    <Ionicons name="footsteps-outline" size={18} color="#C4704F" />
                    <Text style={styles.aiItemText}>{`Shoes: ${item.shoe_item} (${item.shoe_color})`}</Text>
                </View>
                <View style={styles.aiItemRow}>
                    <Ionicons name="calendar-outline" size={18} color="#C4704F" />
                    <Text style={styles.aiItemText}>{`Occasion: ${item.occasion}`}</Text>
                </View>
                <View style={styles.aiItemRow}>
                    <Ionicons name="partly-sunny-outline" size={18} color="#C4704F" />
                    <Text style={styles.aiItemText}>{`Weather: ${item.weather_suitability}`}</Text>
                </View>
            </View>
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]} 
                    onPress={() => onReject(item.id)}>
                    <Ionicons name="close-circle-outline" size={22} color="#E74C3C" />
                    <Text style={[styles.actionButtonText, { color: '#E74C3C' }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.acceptButton, isAccepted && styles.acceptedButton]} 
                    onPress={() => onAccept(item.id)}
                    disabled={isAccepted}>
                    <Ionicons name="checkmark-circle-outline" size={22} color="#2ECC71" />
                    <Text style={[styles.actionButtonText, { color: '#2ECC71' }]}>{isAccepted ? 'Accepted' : 'Accept'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const RecommendationScreen = ({ route, navigation }) => {
    const { recommendations: initialRecommendations, fromWardrobe } = route.params;
    const [displayedRecs, setDisplayedRecs] = useState([]);
    const [acceptedRecs, setAcceptedRecs] = useState([]);

    useEffect(() => {
        const initialRecs = initialRecommendations.map((rec, index) => ({
            ...rec,
            id: `rec-${index}`
        }));
        setDisplayedRecs(initialRecs);
    }, [initialRecommendations]);

    const handleReject = (id) => {
        setDisplayedRecs(prevRecs => prevRecs.filter(rec => rec.id !== id));
        setAcceptedRecs(prevRecs => prevRecs.filter(rec => rec.id !== id));
    };

    const handleAccept = (id) => {
        const recommendationToAccept = displayedRecs.find(rec => rec.id === id);
        if (recommendationToAccept && !acceptedRecs.some(rec => rec.id === id)) {
            setAcceptedRecs(prev => [...prev, recommendationToAccept]);
        }
    };

        const handleSave = () => {
        if (acceptedRecs.length === 0) {
            Alert.alert("No Outfits Selected", "Please accept at least one outfit to save.");
            return;
        }

        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
            const db = getDatabase();
            const savedOutfitsRef = ref(db, `users/${user.uid}/saved_outfits`);
            
            set(savedOutfitsRef, acceptedRecs)
                .then(() => {
                    Alert.alert("Success", "Your selected outfits have been saved!");
                    navigation.navigate('saved');
                })
                .catch((error) => {
                    console.error("Error saving outfits: ", error);
                    Alert.alert("Error", "Could not save your outfits. Please try again.");
                });
        } else {
            Alert.alert("Not Logged In", "You need to be logged in to save outfits.");
        }
    };

    const renderOutfit = ({ item }) => {
        const isAccepted = acceptedRecs.some(rec => rec.id === item.id);
        if (fromWardrobe) {
            return renderWardrobeOutfit(item, handleAccept, handleReject, isAccepted);
        } else {
            return renderAIOutfit(item, handleAccept, handleReject, isAccepted);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2c1d1a" />
            <LinearGradient colors={['#2c1d1a', '#4a302d']} style={styles.gradient}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Outfit Recommendations</Text>
                    <View style={{ width: 28 }} />
                </View>
                
                {/* Main Content */}
                <FlatList
                    data={displayedRecs}
                    renderItem={renderOutfit}
                    keyExtractor={(item) => item.id.toString()}
                    ListHeaderComponent={
                        <View style={styles.titleContainer}>
                            <Ionicons name="sparkles" size={28} color="#C4704F" />
                            <View style={{flex: 1}}>
                                <Text style={styles.title}>Here are your Recommended Outfits!</Text>
                                <Text style={styles.subtitle}>Curated just for you</Text>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="shirt-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
                            <Text style={styles.noItemsText}>No recommendations available.</Text>
                            <Text style={styles.noItemsSubtext}>Try adjusting your preferences</Text>
                        </View>
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                />
                {acceptedRecs.length > 0 && (
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save Selected Outfits ({acceptedRecs.length})</Text>
                    </TouchableOpacity>
                )}
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2c1d1a',
    },
    gradient: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginLeft: 10,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginLeft: 10,
    },
    outfitCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    outfitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(196, 112, 79, 0.3)',
    },
    outfitName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
        marginLeft: 8,
    },
    wardrobeBadge: {
        backgroundColor: 'rgba(196, 112, 79, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C4704F',
    },
    aiBadge: {
        backgroundColor: 'rgba(196, 112, 79, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C4704F',
    },
    badgeText: {
        fontSize: 12,
        color: '#C4704F',
        fontWeight: '600',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 15,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(196, 112, 79, 0.2)',
    },
    imageContainer: {
        position: 'relative',
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(196, 112, 79, 0.4)',
    },
    imageOverlay: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 2,
    },
    itemDetailsContainer: {
        flex: 1,
        marginLeft: 15,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginLeft: 8,
        flex: 1,
    },
    detailLabel: {
        fontWeight: 'bold',
        color: '#C4704F',
    },
    aiRecommendationContainer: {
        marginTop: 10,
    },
    aiItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        padding: 12,
        borderRadius: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#C4704F',
    },
    aiItemText: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        marginLeft: 10,
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    noItemsText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '600',
    },
    noItemsSubtext: {
        textAlign: 'center',
        marginTop: 8,
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.4)',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(196, 112, 79, 0.3)',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        borderWidth: 1,
    },
    actionButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    rejectButton: {
        borderColor: '#E74C3C',
    },
    acceptButton: {
        borderColor: '#2ECC71',
    },
    acceptedButton: {
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
    },
    saveButton: {
        backgroundColor: '#C4704F',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 30,
        marginHorizontal: 20,
        marginVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default RecommendationScreen;
