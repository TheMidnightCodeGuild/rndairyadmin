import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingBills, setGeneratingBills] = useState({});

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const customersSnapshot = await getDocs(collection(db, 'customers'));
      const customersData = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const calculateBillPeriod = async (customerId) => {
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
      const customerDoc = await doc(db, 'customers', customerId).get();
      const customerData = customerDoc.data();
      startDate = customerData?.subscriptionStartDate ? 
        new Date(customerData.subscriptionStartDate) : 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const endDate = new Date(); // Today
    return { startDate, endDate };
  };

  const handleGenerateBill = async (customerId, customerName) => {
    try {
      setGeneratingBills(prev => ({ ...prev, [customerId]: true }));
      toast.loading(`Generating bill for ${customerName}...`);

      // 1. Calculate bill period
      const { startDate, endDate } = await calculateBillPeriod(customerId);

      // 2. Get customer's subscription data
      const customerDoc = await doc(db, 'customers', customerId).get();
      const subscriptionData = customerDoc.data()?.subscriptions?.current;

      if (!subscriptionData?.items?.length) {
        throw new Error('No subscription items found');
      }

      // 3. Calculate quantities and amounts
      let totalAmount = 0;
      const billItems = [];

      // Get current rates for all items
      const itemsSnapshot = await getDocs(collection(db, 'Items'));
      const itemRates = new Map();
      itemsSnapshot.docs.forEach(doc => {
        itemRates.set(doc.id, {
          ratePerUnit: Number(doc.data().ratePerUnit) || 0,
          itemName: doc.data().itemName || 'Unknown Item'
        });
      });

      // Calculate for each subscription item
      for (const item of subscriptionData.items) {
        const rate = itemRates.get(item.id)?.ratePerUnit || 0;
        const quantity = Number(item.quantity) || 0;
        const total = quantity * rate;
        totalAmount += total;

        billItems.push({
          itemId: item.id,
          itemName: item.itemName || itemRates.get(item.id)?.itemName || 'Unknown Item',
          quantity,
          rate,
          total
        });
      }

      // 4. Create bill document
      const billData = {
        fromDate: startDate.toISOString().split('T')[0],
        toDate: endDate.toISOString().split('T')[0],
        items: billItems,
        totalAmount,
        isPaid: false,
        generatedAt: serverTimestamp(),
        customerId
      };

      // 5. Save bill
      const billRef = await addDoc(
        collection(db, `bills/${customerId}/customerBills`),
        billData
      );

      toast.success(`Bill generated successfully for ${customerName}`);
      window.open(`/bills/${customerId}/${billRef.id}`, '_blank');

    } catch (error) {
      console.error('Error generating bill:', error);
      toast.error(`Error generating bill for ${customerName}: ${error.message}`);
    } finally {
      setGeneratingBills(prev => ({ ...prev, [customerId]: false }));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Dashboard</h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map(customer => (
            <div key={customer.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{customer.name}</h2>
                  <p className="text-gray-600">{customer.phone}</p>
                  <p className="text-gray-600">{customer.address}</p>
                </div>

                {/* Subscription Items */}
                <div>
                  <h3 className="font-medium mb-2">Current Subscription</h3>
                  {customer.subscriptions?.current?.items?.map((item, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {item.itemName}: {item.quantity} units
                    </div>
                  ))}
                </div>

                {/* Generate Bill Button */}
                <div className="mt-auto">
                  <button
                    onClick={() => handleGenerateBill(customer.id, customer.name)}
                    disabled={generatingBills[customer.id]}
                    className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                      generatingBills[customer.id]
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-[#2D2D2D] text-white hover:bg-gray-700'
                    }`}
                  >
                    {generatingBills[customer.id] ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      'Generate Bill'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 