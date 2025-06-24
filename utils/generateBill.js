import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

/**
 * Generates a bill for a customer for a given date range.
 * @param {string} customerId
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Object|null>} The bill document or null if nothing to bill.
 */
export async function generateBillForCustomer(customerId, startDate, endDate) {
  try {
    // 1. Fetch all delivered overrides for the customer in the date range
    const overridesRef = collection(db, 'overrides');
    const overridesQuery = query(
      overridesRef,
      where('customerId', '==', customerId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      where('status', '==', 'delivered')
    );
    const overridesSnapshot = await getDocs(overridesQuery);

    const overrides = [];
    overridesSnapshot.forEach(docSnap => {
      overrides.push({ id: docSnap.id, ...docSnap.data() });
    });
    console.log('Fetched overrides:', overrides);

    if (overrides.length === 0) {
      console.log('No delivered overrides found.');
      return null;
    }

    // 2. Exclude overrides already billed (by date)
    const billsSnapshot = await getDocs(
      query(collection(db, 'bills'), where('customerId', '==', customerId))
    );
    const billedDates = new Set();
    billsSnapshot.forEach(billSnap => {
      const bill = billSnap.data();
      if (Array.isArray(bill.itemsBreakdown)) {
        bill.itemsBreakdown.forEach(item => {
          billedDates.add(item.date);
        });
      }
    });

    const filteredOverrides = overrides.filter(o => !billedDates.has(o.date));
    console.log('Filtered overrides (not already billed):', filteredOverrides);

    if (filteredOverrides.length === 0) {
      console.log('All overrides already billed.');
      return null;
    }

    // 3. Build itemsBreakdown and calculate totalAmount
    const itemsBreakdown = [];
    let totalAmount = 0;

    for (const override of filteredOverrides) {
      if (!Array.isArray(override.items)) {
        console.log('Override has no items array:', override);
        continue;
      }
      for (const item of override.items) {
        // Get current price from Items collection
        const itemSnap = await getDoc(doc(db, 'Items', item.itemId));
        if (!itemSnap.exists()) {
          console.log('Item not found in Items collection:', item.itemId);
          continue;
        }
        const itemData = itemSnap.data();
        const price = itemData.price || 0;
        const quantity = item.quantity || 1;
        const total = price * quantity;

        itemsBreakdown.push({
          date: override.date,
          itemId: item.itemId,
          itemName: item.itemName || itemData.name || '',
          quantity,
          price,
          total,
        });

        totalAmount += total;
      }
    }

    console.log('Final itemsBreakdown:', itemsBreakdown);

    // 4. Save bill document
    const billDoc = {
      billId: `${customerId}_${startDate}_${endDate}`,
      customerId,
      startDate,
      endDate,
      totalAmount,
      paidAmount: 0,
      status: 'unpaid',
      itemsBreakdown,
      generatedAt: Timestamp.now(),
    };

    await addDoc(collection(db, 'bills'), billDoc);
    return billDoc;
  } catch (err) {
    console.error('Error generating bill:', err.message, err.stack); // <-- add this
    throw err;
  }
} 