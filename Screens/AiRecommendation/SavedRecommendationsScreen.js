import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getDatabase, ref, onValue, set, off } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import BottomNav from '../../components/BottomNav';
import { UserContext } from '../../context/UserContext';

const renderWardrobeItem = (itemData) => {
    if (!itemData) return null;
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

const renderWardrobeOutfit = (item) => {
    return (
        <View>
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
        </View>
    );
};

const renderAIItem = (label, name, color, imageUrl) => {
    if (!name) return null;
    return (
        <View style={styles.itemContainer}>
            <Image source={{ uri: imageUrl }} style={styles.itemImage} />
            <View style={styles.itemDetailsContainer}>
                <Text style={styles.detailText}><Text style={styles.detailLabel}>{label}:</Text> {name}</Text>
                <Text style={styles.detailText}><Text style={styles.detailLabel}>Color:</Text> {color}</Text>
            </View>
        </View>
    );
};

const renderAIOutfit = (item) => {
    return (
        <View>
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
        </View>
    );
};

export default function SavedRecommendationsScreen() {
    const navigation = useNavigation();
    const { user } = useContext(UserContext);
    const [savedOutfits, setSavedOutfits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const db = getDatabase();
            const savedOutfitsRef = ref(db, `users/${user.uid}/saved_outfits`);
            
            const listener = onValue(savedOutfitsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const loadedOutfits = Object.keys(data).map(key => ({ ...data[key], id: key }));
                    setSavedOutfits(loadedOutfits);
                } else {
                    setSavedOutfits([]);
                }
                setLoading(false); // Ensure loading is stopped after processing
            }, (error) => {
                console.error("Firebase onValue error:", error);
                setLoading(false);
            });

            return () => off(savedOutfitsRef, 'value', listener);
        } else {
            setLoading(false);
            setSavedOutfits([]);
        }
    }, [user]);

    const handleDelete = (outfitId) => {
        if (!user) return;
        Alert.alert(
            "Confirm Deletion",
            "Are you sure you want to remove this outfit?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                        const db = getDatabase();
                        const outfitRef = ref(db, `users/${user.uid}/saved_outfits/${outfitId}`);
                        set(outfitRef, null).catch((error) => {
                            Alert.alert("Error", "Could not remove outfit.");
                            console.error("Error removing outfit: ", error);
                        });
                    },
                },
            ]
        );
    };

    const renderOutfit = ({ item }) => {
        const isFromWardrobe = item.fromWardrobe || (item.wardrobe_items && Object.values(item.wardrobe_items).some(i => i !== null));

        return (
            <View style={styles.outfitCard}>
                {isFromWardrobe ? renderWardrobeOutfit(item) : renderAIOutfit(item)}

                <TouchableOpacity
                    style={[styles.actionButton, styles.removeButton]}
                    onPress={() => handleDelete(item.id)}
                >
                    <Ionicons name="trash-outline" size={16} color="#E74C3C" />
                    <Text style={[styles.actionButtonText, { color: '#E74C3C' }]}>Remove</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <LinearGradient colors={['#2c1d1a', '#4a302d']} style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </LinearGradient>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#2c1d1a' }}>
            <LinearGradient colors={['#2c1d1a', '#4a302d']} style={{ flex: 1 }}>
                <SafeAreaView style={styles.container}>
                    <View style={styles.headerContainer}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.header}>Saved Outfits</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <FlatList
                        data={savedOutfits}
                        renderItem={renderOutfit}
                        keyExtractor={(item) => item.id.toString()}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="heart-dislike-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
                                <Text style={styles.noItemsText}>No Saved Outfits</Text>
                                <Text style={styles.noItemsSubtext}>Your accepted recommendations will appear here.</Text>
                            </View>
                        }
                        contentContainerStyle={{ paddingBottom: 80 }}
                    />
                </SafeAreaView>
                <BottomNav />
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        paddingTop: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        padding: 5,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
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
    outfitCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
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
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: 15,
    },
    actionButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    removeButton: {
        borderColor: '#E74C3C',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
    },
});
