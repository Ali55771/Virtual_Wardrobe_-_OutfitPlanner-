import { db } from '../config/firebaseConfig';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

// A helper function to fetch a single item by its clothingType
const fetchItemByColorAndType = async (itemsRef, type, color) => {
  const q = query(itemsRef, where('clothingType', '==', type), where('Colour', '==', color), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  return null;
};



const fetchItemByType = async (itemsRef, type) => {
  const q = query(itemsRef, where('clothingType', '==', type), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.log(`[WardrobeService] No item found for type: ${type}`);
    return null;
  }
  const doc = snapshot.docs[0];
  const item = { id: doc.id, ...doc.data() };
  console.log(`[WardrobeService] Fetched item by type '${type}':`, JSON.stringify(item, null, 2));
  return item;
};

export const getAqiqaOutfits = async (wardrobeId, temperature) => {
  try {
    console.log(`Fetching special Aqiqa outfits for wardrobeId: ${wardrobeId}`);
    const itemsRef = collection(db, `wardrobes/${wardrobeId}/items`);

    // Fetch all required items in parallel
    const [shalwarKameez, peshawariChappal, jubbah, sandals, brownWaistcoat, blackWaistcoat] = await Promise.all([
      fetchItemByType(itemsRef, 'Shalwar-Kameez'),
      fetchItemByType(itemsRef, 'Peshawari Chappal'),
      fetchItemByType(itemsRef, 'Jubbah'),
      fetchItemByType(itemsRef, 'Sandals'),
      fetchItemByColorAndType(itemsRef, 'Waistcoat', 'Light Brown').then(item => {
        console.log('[WardrobeService DEBUG] Fetched Light Brown Waistcoat:', JSON.stringify(item, null, 2));
        return item;
      }),
      fetchItemByColorAndType(itemsRef, 'Waistcoat', 'Black'),
    ]);

    const recommendations = [];

    // Recommendation 1: Shalwar-Kameez with Peshawari Chappal
    if (shalwarKameez && peshawariChappal) {
      const finalShalwarKameez = { ...shalwarKameez, Colour: shalwarKameez.Colour || 'White' };
      const outfit1 = {
        outfit_name: 'Outfit recommendation 1',
        dress_item: finalShalwarKameez.clothingType,
        dress_color: finalShalwarKameez.Colour,
        shoe_item: peshawariChappal.clothingType,
        shoe_color: peshawariChappal.Colour,
        occasion: 'Aqiqa',
        weather_suitability: 'Warm',
        wardrobe_items: {
          dress: finalShalwarKameez,
          shoes: peshawariChappal,
        },
      };

      // Add waistcoat if temperature is suitable and waistcoat is found
      console.log(`[WardrobeService DEBUG] Temperature for check: ${temperature}`);
      console.log(`[WardrobeService DEBUG] Light Brown waistcoat object found:`, JSON.stringify(brownWaistcoat, null, 2));
      console.log(`[WardrobeService] Checking temp for waistcoat: ${temperature}°C. Light Brown waistcoat found: ${!!brownWaistcoat}`);
      if (temperature >= 21 && temperature <= 30 && brownWaistcoat) {
        console.log('[WardrobeService] Adding Brown Waistcoat to Outfit 1.');
        outfit1.waistcoat_item = brownWaistcoat.clothingType;
        outfit1.waistcoat_color = brownWaistcoat.Colour;
        outfit1.wardrobe_items.waistcoat = brownWaistcoat;
      }

      console.log('[WardrobeService] Final Outfit 1:', JSON.stringify(outfit1, null, 2));
      recommendations.push(outfit1);
    } else {
      console.log('Could not create Outfit 1: Missing Shalwar Kameez or Peshawari Chappal');
    }

    // Outfit 2: Jubbah + Sandals
    if (jubbah && sandals) {
      const finalJubbah = { ...jubbah, Colour: jubbah.Colour || 'White' };
      const outfit2 = {
        outfit_name: 'Outfit recommendation 2',
        dress_item: finalJubbah.clothingType,
        dress_color: finalJubbah.Colour,
        shoe_item: sandals.clothingType,
        shoe_color: sandals.Colour,
        occasion: 'Aqiqa',
        weather_suitability: 'Warm',
        wardrobe_items: {
          dress: finalJubbah,
          shoes: sandals,
        },
      };

      // Add waistcoat if temperature is suitable and waistcoat is found
      console.log(`[WardrobeService] Checking temp for waistcoat: ${temperature}°C. Black waistcoat found: ${!!blackWaistcoat}`);
      if (temperature >= 21 && temperature <= 30 && blackWaistcoat) {
        console.log('[WardrobeService] Adding Black Waistcoat to Outfit 2.');
        outfit2.waistcoat_item = blackWaistcoat.clothingType;
        outfit2.waistcoat_color = blackWaistcoat.Colour;
        outfit2.wardrobe_items.waistcoat = blackWaistcoat;
      }

      console.log('[WardrobeService] Final Outfit 2:', JSON.stringify(outfit2, null, 2));
      recommendations.push(outfit2);
    } else {
      console.log('Could not create Outfit 2: Missing Jubbah or Sandals');
    }
    
    console.log(`Found ${recommendations.length} special Aqiqa outfits.`);
    console.log('[WardrobeService] Final generated Aqiqa recommendations:', JSON.stringify(recommendations, null, 2));
    return recommendations;

  } catch (error) {
    console.error('Error fetching Aqiqa outfits:', error);
    return []; // Return empty array on error
  }
};
export class WardrobeService {
  /**
   * Fetch all wardrobe items for a user
   */
  static async fetchUserWardrobe(wardrobeId) {
    try {
      // Check if wardrobeId is valid
      if (!wardrobeId || wardrobeId === 'undefined') {
        console.error('Invalid wardrobeId:', wardrobeId);
        // Use a default wardrobeId if user's is not available
        wardrobeId = 'QyhbV31coaH2ApWCSbbE'; // A default wardrobeId for testing
        console.log('Using default wardrobeId:', wardrobeId);
      }

      const wardrobeItems = {
        'Shalwar Kameez': [],
        'Shoes': [],
        'Jackets': [],
        'Accessories': []
      };

      // Fetch items from each category
      for (const boxName of Object.keys(wardrobeItems)) {
        console.log(`Fetching items for wardrobeId: ${wardrobeId}, boxName: '${boxName}'`);
        
        const q = query(
          collection(db, 'wardrobes', wardrobeId, 'items'),
          where('selectedBox', '==', boxName)
        );
        
        const querySnapshot = await getDocs(q);
        console.log(`Found ${querySnapshot.size} items in Firestore for ${boxName}.`);
        
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        wardrobeItems[boxName] = items;
        console.log(`Fetched items for ${boxName}:`, items);
      }

      return wardrobeItems;
    } catch (error) {
      console.error('Error fetching wardrobe:', error);
      throw error;
    }
  }

  /**
   * Match AI recommendations with Firebase wardrobe items
   */
  static matchRecommendationsWithWardrobe(aiRecommendations, wardrobeItems) {
    const matchedRecommendations = [];

    for (const recommendation of aiRecommendations) {
      const matchedOutfit = {
        id: recommendation.id || Math.random().toString(36).substr(2, 9),
        originalRecommendation: recommendation,
        matchedItems: {
          dress: null,
          shoes: null,
          upperLayer: null,
          accessories: null
        },
        hasMatches: false
      };

      // Match dress/clothing items
      if (recommendation.dress) {
        const dressMatch = this.findBestMatch(
          recommendation.dress,
          wardrobeItems['Shalwar Kameez'],
          'dress'
        );
        if (dressMatch) {
          matchedOutfit.matchedItems.dress = dressMatch;
          matchedOutfit.hasMatches = true;
        }
      }

      // Match shoes
      if (recommendation.shoes) {
        const shoesMatch = this.findBestMatch(
          recommendation.shoes,
          wardrobeItems['Shoes'],
          'shoes'
        );
        if (shoesMatch) {
          matchedOutfit.matchedItems.shoes = shoesMatch;
          matchedOutfit.hasMatches = true;
        }
      }

      // Match upper layer/jackets
      if (recommendation.upper_layer) {
        const upperLayerMatch = this.findBestMatch(
          recommendation.upper_layer,
          wardrobeItems['Jackets'],
          'upperLayer'
        );
        if (upperLayerMatch) {
          matchedOutfit.matchedItems.upperLayer = upperLayerMatch;
          matchedOutfit.hasMatches = true;
        }
      }

      // Match accessories
      if (recommendation.accessories) {
        const accessoriesMatch = this.findBestMatch(
          recommendation.accessories,
          wardrobeItems['Accessories'],
          'accessories'
        );
        if (accessoriesMatch) {
          matchedOutfit.matchedItems.accessories = accessoriesMatch;
          matchedOutfit.hasMatches = true;
        }
      }

      matchedRecommendations.push(matchedOutfit);
    }

    return matchedRecommendations;
  }

  /**
   * Find best matching item from wardrobe for a recommendation
   */
  static findBestMatch(recommendationItem, wardrobeItems, itemType) {
    if (!wardrobeItems || wardrobeItems.length === 0) {
      return null;
    }

    // Extract recommendation details
    const recColor = this.extractColor(recommendationItem);
    const recType = this.extractType(recommendationItem, itemType);
    const recOutfitType = this.extractOutfitType(recommendationItem);

    let bestMatch = null;
    let bestScore = 0;

    for (const item of wardrobeItems) {
      let score = 0;

      // Color matching (highest priority)
      if (recColor && item.Colour) {
        if (item.Colour.toLowerCase().includes(recColor.toLowerCase()) ||
            recColor.toLowerCase().includes(item.Colour.toLowerCase())) {
          score += 3;
        }
      }

      // Type matching
      if (recType && item.clothingType) {
        if (item.clothingType.toLowerCase().includes(recType.toLowerCase()) ||
            recType.toLowerCase().includes(item.clothingType.toLowerCase())) {
          score += 2;
        }
      }

      // Outfit type matching (formal/casual)
      if (recOutfitType && item.outfitType) {
        if (item.outfitType.toLowerCase() === recOutfitType.toLowerCase()) {
          score += 1;
        }
      }

      // If no specific matches, give a base score for having the item
      if (score === 0) {
        score = 0.5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    return bestMatch;
  }

  /**
   * Extract color from recommendation text
   */
  static extractColor(text) {
    if (!text) return null;
    
    const colors = ['white', 'black', 'brown', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'orange', 'gray', 'grey'];
    const lowerText = text.toLowerCase();
    
    for (const color of colors) {
      if (lowerText.includes(color)) {
        return color;
      }
    }
    
    return null;
  }

  /**
   * Extract type from recommendation text
   */
  static extractType(text, itemType) {
    if (!text) return null;
    
    const lowerText = text.toLowerCase();
    
    if (itemType === 'dress') {
      const dressTypes = ['shalwar-kameez', 'shalwar kameez', 'jubbahs', 'kurta', 'shirt'];
      for (const type of dressTypes) {
        if (lowerText.includes(type)) {
          return type;
        }
      }
    } else if (itemType === 'shoes') {
      const shoeTypes = ['sandals', 'peshawari chappal', 'chappal', 'shoes'];
      for (const type of shoeTypes) {
        if (lowerText.includes(type)) {
          return type;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract outfit type (formal/casual) from recommendation
   */
  static extractOutfitType(text) {
    if (!text) return null;
    
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('formal')) {
      return 'Formal';
    } else if (lowerText.includes('casual')) {
      return 'Casual';
    }
    
    return null;
  }
}
