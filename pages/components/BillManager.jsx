import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { 
  doc, 
  collection, 
  getDocs,
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';

export default function BillManager({ customerId }) {
  const [bills, setBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [generatingBill, setGeneratingBill] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (customerId) {
      loadBills();
    }
  }, [customerId]);

  const loadBills = async () => {
    if (!customerId) return;

    try {
      setLoadingBills(true);
      const billsSnapshot = await getDocs(collection(db, `bills/${customerId}/customerBills`));
      const billsData = billsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.generatedAt?.toDate()) - new Date(a.generatedAt?.toDate()));
      setBills(billsData);
    } catch (error) {
      console.error('Error loading bills:', error);
      setMessage({ text: 'Failed to load bills', type: 'error' });
    } finally {
      setLoadingBills(false);
    }
  };

  const calculateBillPeriod = async () => {
    // Get the last bill to determine start date
    const lastBillQuery = query(
      collection(db, `bills/${customerId}/customerBills`),
      orderBy('toDate', 'desc'),
      limit(1)
    );
    
    const lastBillSnapshot = await getDocs(lastBillQuery);
    let startDate;
    
    if (!lastBillSnapshot.empty) {
      // Get day after last bill's toDate
      const lastBill = lastBillSnapshot.docs[0].data();
      startDate = new Date(lastBill.toDate);
      startDate.setDate(startDate.getDate() + 1);
    } else {
      // If no previous bill, get customer's subscription start date or default to 30 days ago
      const customerDocRef = doc(db, 'customers', customerId);
      const customerDoc = await getDoc(customerDocRef);
      const customerData = customerDoc.data();
      startDate = customerData?.subscriptionStartDate ? 
        new Date(customerData.subscriptionStartDate) : 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const endDate = new Date(); // Today
    return { startDate, endDate };
  };

  const handleGenerateBill = async () => {
    if (!customerId) return;

    try {
      setGeneratingBill(true);
      setMessage({ text: 'Generating bill...', type: 'info' });

      // 1. Calculate bill period
      const { startDate, endDate } = await calculateBillPeriod();

      // 2. Get customer's subscription data
      const subscriptionDocRef = doc(db, 'customers', customerId, 'subscriptions', 'current');
      const subscriptionDoc = await getDoc(subscriptionDocRef);
      const subscriptionData = subscriptionDoc.data();

      if (!subscriptionData?.items?.length) {
        throw new Error('No subscription items found');
      }

      // 3. Get all delivery overrides for the period
      const items = new Map();
      
      // Loop through each day in the billing period
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const overrideId = `${customerId}_${dateStr}`;

        try {
          // Check for override
          const overrideDocRef = doc(db, 'overrides', overrideId);
          const overrideDoc = await getDoc(overrideDocRef);
          
          if (overrideDoc.exists()) {
            const override = overrideDoc.data();
            
            // Skip if delivery was cancelled
            if (override.type === 'notDelivered') continue;
            
            // Process override items
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

            // Process extra items
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
            // No override - use subscription items
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
        } catch (error) {
          console.error(`Error processing date ${dateStr}:`, error);
          // Continue with next date instead of failing entire bill generation
          continue;
        }
      }

      // 4. Get current rates for all items
      const itemRates = new Map();
      const itemsSnapshot = await getDocs(collection(db, 'Items'));
      itemsSnapshot.docs.forEach(doc => {
        itemRates.set(doc.id, {
          ratePerUnit: Number(doc.data().ratePerUnit) || 0,
          itemName: doc.data().itemName || 'Unknown Item'
        });
      });

      // 5. Calculate totals
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

      // 6. Create bill document
      const billData = {
        fromDate: startDate.toISOString().split('T')[0],
        toDate: endDate.toISOString().split('T')[0],
        items: billItems,
        totalAmount,
        isPaid: false,
        generatedAt: serverTimestamp(),
        customerId
      };

      // 7. Save bill
      const billRef = await addDoc(
        collection(db, `bills/${customerId}/customerBills`),
        billData
      );

      // 8. Mark overrides as processed
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const overrideId = `${customerId}_${dateStr}`;
        
        try {
          const overrideDocRef = doc(db, 'overrides', overrideId);
          const overrideDoc = await getDoc(overrideDocRef);
          if (overrideDoc.exists() && overrideDoc.data().type !== 'notDelivered') {
            await updateDoc(overrideDocRef, {
              status: 'billed',
              billId: billRef.id
            });
          }
        } catch (error) {
          console.error(`Error updating override ${overrideId}:`, error);
          // Continue with next override
          continue;
        }
      }

      setMessage({ text: 'Bill generated successfully', type: 'success' });
      await loadBills();
      window.open(`/bills/${customerId}/${billRef.id}`, '_blank');

    } catch (error) {
      console.error('Error generating bill:', error);
      setMessage({ text: error.message || 'Error generating bill', type: 'error' });
    } finally {
      setGeneratingBill(false);
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleMarkAsPaid = async (billId) => {
    if (!customerId || !billId) return;

    try {
      await updateDoc(doc(db, `bills/${customerId}/customerBills`, billId), {
        isPaid: true,
        paidAt: serverTimestamp()
      });
      setMessage({ text: 'Bill marked as paid', type: 'success' });
      await loadBills();
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      setMessage({ text: 'Failed to mark bill as paid', type: 'error' });
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {message.text && (
          <div className={`px-4 py-2 rounded text-sm ${
            message.type === 'error' ? 'bg-red-100 text-red-800' :
            message.type === 'success' ? 'bg-green-100 text-green-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {message.text}
          </div>
        )}
        <div className="flex gap-4">
          <button
            onClick={() => setShowBillModal(true)}
            className="px-4 py-2 bg-[#2D2D2D] text-white rounded hover:bg-gray-700"
          >
            View Bills
          </button>
          <button
            onClick={handleGenerateBill}
            disabled={generatingBill}
            className={`px-4 py-2 rounded ${
              generatingBill
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {generatingBill ? 'Generating...' : 'Generate Bill'}
          </button>
        </div>
      </div>

      {showBillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Bills History</h2>
                <button
                  onClick={() => setShowBillModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingBills ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : bills.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No bills generated yet
                </div>
              ) : (
                <div className="divide-y">
                  {bills.map(bill => (
                    <div key={bill.id} className="py-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">
                            Bill Period: {bill.fromDate} to {bill.toDate}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Generated: {new Date(bill.generatedAt?.toDate()).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-2 py-1 text-sm rounded ${
                            bill.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {bill.isPaid ? 'Paid' : 'Pending'}
                          </span>
                          <span className="font-medium">₹{bill.totalAmount}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => window.open(`/bills/${customerId}/${bill.id}`, '_blank')}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Bill
                        </button>
                        {!bill.isPaid && (
                          <button
                            onClick={() => handleMarkAsPaid(bill.id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
