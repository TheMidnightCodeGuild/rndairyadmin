import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Saves a delivery override for a specific customer and date
 * @param {string} customerId - The ID of the customer
 * @param {string} date - The date in YYYY-MM-DD format
 * @param {string} type - Type of override: "delivered", "notDelivered", or "custom"
 * @param {Object} [data] - Optional override data for custom type
 * @returns {Promise<void>}
 */
export async function saveOverride(customerId, date, type, data = {}) {
  try {
    const overrideRef = doc(db, 'overrides', `${customerId}_${date}`);
    let subscriptionItems = [];

    // Fetch current subscription items if needed for delivered/notDelivered types
    if (type === 'delivered' || type === 'notDelivered') {
      const subscriptionRef = doc(db, 'customers', customerId, 'subscriptions', 'current');
      const subscriptionSnap = await getDoc(subscriptionRef);
      
      if (subscriptionSnap.exists()) {
        subscriptionItems = subscriptionSnap.data().items || [];
        
        // For notDelivered, set all quantities to 0
        if (type === 'notDelivered') {
          subscriptionItems = subscriptionItems.map(item => ({
            ...item,
            quantity: 0
          }));
        }
      }
    }

    // Prepare the data to save based on type
    const dataToSave = {
      type,
      subscriptionItems: type === 'custom' ? (data.subscriptionItems || []) : subscriptionItems,
      extraItems: type === 'custom' ? (data.extraItems || []) : [],
      note: type === 'custom' ? (data.note || '') : '',
      markedBy: data.markedBy || 'admin',
      timestamp: new Date().toISOString(),
      customerId,
      date
    };

    // Save with merge option to preserve any existing fields not included in dataToSave
    await setDoc(overrideRef, dataToSave, { merge: true });
  } catch (error) {
    console.error('Error saving delivery override:', error);
    throw error;
  }
} 