const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

exports.billGenerator = functions.https.onCall(async (data, context) => {
  const { customerId } = data;
  const db = admin.firestore();
  
  try {
    // Validate customerId
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    // Get customer document first to validate existence
    const customerDoc = await db.collection('customers').doc(customerId).get();
    if (!customerDoc.exists) {
      throw new Error('Customer not found');
    }

    // 1. Get last bill or subscription start date
    const lastBillQuery = await db
      .collection(`bills/${customerId}/customerBills`)
      .orderBy('toDate', 'desc')
      .limit(1)
      .get();

    let startDate;
    if (!lastBillQuery.empty) {
      // Get day after last bill's toDate
      startDate = new Date(lastBillQuery.docs[0].data().toDate);
      startDate.setDate(startDate.getDate() + 1);
    } else {
      // Get customer's first subscription date or fallback to 30 days ago
      const customerData = customerDoc.data();
      startDate = customerData.subscriptionStartDate ? 
        new Date(customerData.subscriptionStartDate) : 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    }

    const endDate = new Date(); // Today
    
    // Validate date range
    if (startDate > endDate) {
      throw new Error('Invalid date range: start date is after end date');
    }

    const items = new Map(); // Map to store aggregated quantities per item

    // 2. Loop through each day from startDate to endDate
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const overrideId = `${customerId}_${dateStr}`;

      try {
        // Try to get override for this date
        const overrideDoc = await db.collection('overrides').doc(overrideId).get();
        
        if (overrideDoc.exists) {
          const override = overrideDoc.data();
          
          // Skip if cancelled delivery
          if (override.type === 'notDelivered') continue;
          
          // Add subscription items from override
          if (Array.isArray(override.subscriptionItems)) {
            override.subscriptionItems.forEach(item => {
              if (!item?.id || !item?.quantity) return;
              
              const existing = items.get(item.id) || { 
                itemId: item.id,
                quantity: 0,
                itemName: item.itemName || 'Unknown Item'
              };
              existing.quantity += Number(item.quantity) || 0;
              items.set(item.id, existing);
            });
          }

          // Add extra items from override
          if (Array.isArray(override.extraItems)) {
            override.extraItems.forEach(item => {
              if (!item?.id || !item?.quantity) return;
              
              const existing = items.get(item.id) || {
                itemId: item.id,
                quantity: 0,
                itemName: item.name || 'Unknown Item'
              };
              existing.quantity += Number(item.quantity) || 0;
              items.set(item.id, existing);
            });
          }

        } else {
          // No override - use subscription
          const subscriptionDoc = await db
            .collection('customers')
            .doc(customerId)
            .get();

          const subscriptionData = subscriptionDoc.data()?.subscriptions?.current;
          
          if (subscriptionData?.items && Array.isArray(subscriptionData.items)) {
            subscriptionData.items.forEach(item => {
              if (!item?.id || !item?.quantity) return;
              
              const existing = items.get(item.id) || {
                itemId: item.id,
                quantity: 0,
                itemName: item.itemName || 'Unknown Item'
              };
              existing.quantity += Number(item.quantity) || 0;
              items.set(item.id, existing);
            });
          }
        }
      } catch (error) {
        console.error(`Error processing date ${dateStr}:`, error);
        // Continue with next date instead of failing entire bill generation
        continue;
      }
    }

    // Validate if we have any items
    if (items.size === 0) {
      throw new Error('No billable items found for the given period');
    }

    // 3. Get current rates for all items
    const itemRates = new Map();
    const itemsSnapshot = await db.collection('Items').get();
    itemsSnapshot.docs.forEach(doc => {
      itemRates.set(doc.id, {
        ratePerUnit: Number(doc.data().ratePerUnit) || 0,
        itemName: doc.data().itemName || 'Unknown Item'
      });
    });

    // 4. Calculate totals and prepare bill items
    let totalAmount = 0;
    const billItems = Array.from(items.values()).map(item => {
      const rate = itemRates.get(item.itemId)?.ratePerUnit || 0;
      const quantity = Number(item.quantity) || 0;
      const total = quantity * rate;
      totalAmount += total;

      return {
        itemId: item.itemId,
        itemName: item.itemName || itemRates.get(item.itemId)?.itemName || 'Unknown Item',
        quantity,
        rate,
        total
      };
    });

    // 5. Create bill document
    const billData = {
      fromDate: startDate.toISOString().split('T')[0],
      toDate: endDate.toISOString().split('T')[0],
      items: billItems,
      totalAmount,
      isPaid: false,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      customerId
    };

    // 6. Save bill
    const billRef = await db
      .collection(`bills/${customerId}/customerBills`)
      .add(billData);

    // 7. Mark overrides as paid in smaller batches to avoid limits
    const batchSize = 500; // Firestore limit is 500 operations per batch
    let batchCount = 0;
    let currentBatch = db.batch();
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const overrideId = `${customerId}_${dateStr}`;
      const overrideRef = db.collection('overrides').doc(overrideId);
      
      const overrideDoc = await overrideRef.get();
      if (overrideDoc.exists && overrideDoc.data().type !== 'notDelivered') {
        currentBatch.update(overrideRef, { 
          status: 'paid',
          billId: billRef.id
        });
        batchCount++;

        // Commit batch if we hit the limit and start a new one
        if (batchCount === batchSize) {
          await currentBatch.commit();
          currentBatch = db.batch();
          batchCount = 0;
        }
      }
    }

    // Commit any remaining operations
    if (batchCount > 0) {
      await currentBatch.commit();
    }

    return {
      success: true,
      billId: billRef.id,
      data: billData
    };

  } catch (error) {
    console.error('Error generating bill:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 