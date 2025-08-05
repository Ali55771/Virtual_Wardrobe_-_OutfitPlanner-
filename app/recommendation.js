import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

const RecommendationScreen = () => {
    const { recommendations, fromWardrobe } = useLocalSearchParams();

    // Since params are strings, we need to parse them back into objects/booleans
    const parsedRecommendations = recommendations ? JSON.parse(recommendations) : [];
    const isFromWardrobe = fromWardrobe === 'true';

    const renderOutfit = ({ item }) => {
        if (isFromWardrobe) {
            // Render outfits from the user's wardrobe
            return (
                <View style={styles.outfitCard}>
                    <Text style={styles.outfitName}>{item.outfit_name}</Text>
                    <View style={styles.itemContainer}>
                        <Image source={{ uri: item.wardrobe_items.dress.imageUrl }} style={styles.itemImage} />
                        <Text style={styles.itemName}>{item.wardrobe_items.dress.clothingType}</Text>
                    </View>
                    <View style={styles.itemContainer}>
                        <Image source={{ uri: item.wardrobe_items.shoes.imageUrl }} style={styles.itemImage} />
                        <Text style={styles.itemName}>{item.wardrobe_items.shoes.clothingType}</Text>
                    </View>
                </View>
            );
        }

        // Render AI-generated recommendations
        return (
            <View style={styles.outfitCard}>
                <Text style={styles.outfitName}>{item.outfit_name}</Text>
                <Text style={styles.itemText}>{`Dress: ${item.dress_item} (${item.dress_color})`}</Text>
                <Text style={styles.itemText}>{`Shoes: ${item.shoe_item} (${item.shoe_color})`}</Text>
                <Text style={styles.itemText}>{`Occasion: ${item.occasion}`}</Text>
                <Text style={styles.itemText}>{`Weather: ${item.weather_suitability}`}</Text>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: 'Your Recommendations' }} />
            <Text style={styles.title}>Here are your outfits!</Text>
            {parsedRecommendations.length > 0 ? (
                <FlatList
                    data={parsedRecommendations}
                    renderItem={renderOutfit}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            ) : (
                <Text style={styles.noItemsText}>No recommendations available.</Text>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
        padding: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
    },
    outfitCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    outfitName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 10,
    },
    itemName: {
        fontSize: 16,
    },
    itemText: {
        fontSize: 16,
        marginBottom: 5,
    },
    noItemsText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
});

export default RecommendationScreen;
