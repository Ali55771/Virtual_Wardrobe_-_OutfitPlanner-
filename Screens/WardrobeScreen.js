import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';

const WardrobeScreen = () => {
    const navigation = useNavigation();
    const [wardrobeItems, setWardrobeItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            setLoading(false);
            Alert.alert("Not Logged In", "Please log in to view your wardrobe.");
            return;
        }

        const db = getDatabase();
        const itemsRef = ref(db, `users/${user.uid}/wardrobe/items`);

        const unsubscribe = onValue(itemsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const itemsArray = Object.keys(data).map(key => ({ ...data[key], id: key }));
                setWardrobeItems(itemsArray);

                const uniqueCategories = ['All', ...new Set(itemsArray.map(item => item.clothingType))];
                setCategories(uniqueCategories);
            } else {
                setWardrobeItems([]);
                setCategories(['All']);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (selectedCategory === 'All') {
            setFilteredItems(wardrobeItems);
        } else {
            setFilteredItems(wardrobeItems.filter(item => item.clothingType === selectedCategory));
        }
    }, [selectedCategory, wardrobeItems]);

    const handleDelete = (itemId) => {
        Alert.alert(
            "Delete Item",
            "Are you sure you want to delete this item from your wardrobe?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: () => {
                        const auth = getAuth();
                        const user = auth.currentUser;
                        if (user) {
                            const db = getDatabase();
                            const itemRef = ref(db, `users/${user.uid}/wardrobe/items/${itemId}`);
                            remove(itemRef);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => {
        const displayOutfitType = item.clothingType === 'Sandals' ? 'Formal' : item.outfitType;

        return (
            <View style={styles.itemContainer}>
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemInfo}>{item.Colour} &bull; {displayOutfitType}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#C4704F" style={{ flex: 1, backgroundColor: '#2c1d1a' }} />;
    }

    return (
        <LinearGradient colors={['#2c1d1a', '#4a302d']} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Wardrobe</Text>
            </View>

            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {categories.map(category => (
                        <TouchableOpacity 
                            key={category}
                            style={[styles.tab, selectedCategory === category && styles.activeTab]}
                            onPress={() => setSelectedCategory(category)}>
                            <Text style={[styles.tabText, selectedCategory === category && styles.activeTabText]}>{category}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredItems}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="sad-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
                        <Text style={styles.emptyText}>Your wardrobe is empty.</Text>
                        <Text style={styles.emptySubtext}>Add items to see them here.</Text>
                    </View>
                }
            />
            <View style={{ position: 'absolute', bottom: 0, width: '100%' }}>
                <BottomNav />
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
    tabsContainer: { paddingVertical: 10, paddingLeft: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
    tab: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginRight: 10, backgroundColor: 'rgba(255,255,255,0.1)' },
    activeTab: { backgroundColor: '#C4704F' },
    tabText: { color: 'rgba(255,255,255,0.7)' },
    activeTabText: { color: '#fff', fontWeight: 'bold' },
    listContainer: { paddingHorizontal: 15, paddingTop: 20, paddingBottom: 80 },
    itemContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
        alignItems: 'center',
    },
    itemImage: { width: 70, height: 70, borderRadius: 8 },
    itemDetails: { flex: 1, marginLeft: 15 },
    itemName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    itemInfo: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', marginTop: 4 },
    deleteButton: { padding: 8, backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: 20 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyText: { marginTop: 20, fontSize: 18, color: 'rgba(255, 255, 255, 0.6)' },
    emptySubtext: { marginTop: 8, fontSize: 14, color: 'rgba(255, 255, 255, 0.4)' },
});

export default WardrobeScreen;