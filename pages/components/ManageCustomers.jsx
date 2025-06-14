import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';

export default function ManageCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingBills, setGeneratingBills] = useState({});
  const router = useRouter();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
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

  const handleDelete = async (customerId, customerName) => {
    if (window.confirm(`Are you sure you want to delete ${customerName}?`)) {
      try {
        await deleteDoc(doc(db, 'customers', customerId));
        toast.success('Customer deleted successfully');
        loadCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Failed to delete customer');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Customers</h1>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscription Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map(customer => (
              <tr key={customer.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {customer.name}
                </td>
                <td className="px-6 py-4">
                  <div>{customer.phone}</div>
                  <div className="text-sm text-gray-500">{customer.email}</div>
                </td>
                <td className="px-6 py-4">
                  {customer.address}
                </td>
                <td className="px-6 py-4">
                  {customer.subscriptions?.current?.items?.map((item, index) => (
                    <div key={index} className="text-sm">
                      {item.itemName}: {item.quantity}
                    </div>
                  ))}
                </td>
                <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => router.push(`/plan-deliveries/${customer.id}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Plan Deliveries
                  </button>
                  <button
                    onClick={() => handleGenerateBill(customer.id, customer.name)}
                    disabled={generatingBills[customer.id]}
                    className={`text-sm font-medium ${
                      generatingBills[customer.id]
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-green-600 hover:text-green-800'
                    }`}
                  >
                    {generatingBills[customer.id] ? 'Generating...' : 'Generate Bill'}
                  </button>
                  <button
                    onClick={() => router.push(`/edit-customer/${customer.id}`)}
                    className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id, customer.name)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 