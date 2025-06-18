import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRouter } from 'next/router';

export default function ViewCustomers({ onBack }) {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editedData, setEditedData] = useState({
    customerName: '',
    email: '',
    mobile: '',
    address: '',
    dailyDeliveryItems: []
  });
  const [items, setItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState('');

  useEffect(() => {
    const fetchCustomersAndItems = async () => {
      try {
        const customersSnapshot = await getDocs(collection(db, 'Customers'));
        const customersList = customersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomers(customersList);

        const itemsSnapshot = await getDocs(collection(db, 'Items'));
        const itemsList = itemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setItems(itemsList);
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomersAndItems();
  }, []);

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setEditedData({
      customerName: customer.customerName,
      email: customer.email,
      mobile: customer.mobile,
      address: customer.address,
      dailyDeliveryItems: customer.dailyDeliveryItems || []
    });
  };

  const handleItemQuantityChange = (itemId, quantity) => {
    setEditedData(prev => {
      const updatedItems = [...prev.dailyDeliveryItems];
      const existingItemIndex = updatedItems.findIndex(item => item.itemId === itemId);
      
      if (existingItemIndex !== -1) {
        if (quantity === 0) {
          updatedItems.splice(existingItemIndex, 1);
        } else {
          updatedItems[existingItemIndex].quantity = quantity;
        }
      } else if (quantity > 0) {
        const item = items.find(i => i.id === itemId);
        updatedItems.push({
          itemId,
          itemName: item.itemName,
          quantity
        });
      }

      return {
        ...prev,
        dailyDeliveryItems: updatedItems
      };
    });
  };

  const handleUpdate = async () => {
    if (!editingCustomer) return;
    setIsSubmitting(true);

    try {
      const customerRef = doc(db, "Customers", editingCustomer.id);
      await updateDoc(customerRef, {
        ...editedData,
        updatedAt: new Date()
      });

      setCustomers(customers.map(customer => 
        customer.id === editingCustomer.id 
          ? { ...customer, ...editedData }
          : customer
      ));

      setShowSuccess('Customer updated successfully!');
      setTimeout(() => setShowSuccess(''), 3000);
      setEditingCustomer(null);
    } catch (error) {
      console.error("Error updating customer: ", error);
      setShowSuccess('Error updating customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    try {
      await deleteDoc(doc(db, "Customers", customerId));
      setCustomers(customers.filter(customer => customer.id !== customerId));
      setShowSuccess('Customer deleted successfully!');
      setTimeout(() => setShowSuccess(''), 3000);
    } catch (error) {
      console.error("Error deleting customer: ", error);
      setShowSuccess('Error deleting customer');
    }
  };

  const handleCancel = () => {
    setEditingCustomer(null);
    setEditedData({
      customerName: '',
      email: '',
      mobile: '',
      address: '',
      dailyDeliveryItems: []
    });
  };

  if (loading) {
    return <div className="text-center mt-8">Loading customers...</div>;
  }

  if (customers.length === 0) {
    return <div className="text-center mt-8">No customers found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto mt-2 border border-gray-800 p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#2D2D2D]">Manage Customers</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#2D2D2D] text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:ring-offset-2 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
      </div>

      {showSuccess && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {showSuccess}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D2D2D]"></div>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Items</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCustomer?.id === customer.id ? (
                        <input
                          type="text"
                          value={editedData.customerName}
                          onChange={(e) => setEditedData({...editedData, customerName: e.target.value})}
                          className="rounded-md border-gray-300 shadow-sm focus:border-[#2D2D2D] focus:ring-[#2D2D2D] sm:text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{customer.customerName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingCustomer?.id === customer.id ? (
                        <div className="space-y-2">
                          <input
                            type="email"
                            value={editedData.email}
                            onChange={(e) => setEditedData({...editedData, email: e.target.value})}
                            className="rounded-md border-gray-300 shadow-sm focus:border-[#2D2D2D] focus:ring-[#2D2D2D] sm:text-sm w-full"
                            placeholder="Email"
                          />
                          <input
                            type="tel"
                            value={editedData.mobile}
                            onChange={(e) => setEditedData({...editedData, mobile: e.target.value})}
                            className="rounded-md border-gray-300 shadow-sm focus:border-[#2D2D2D] focus:ring-[#2D2D2D] sm:text-sm w-full"
                            placeholder="Mobile"
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">
                          <div>{customer.email}</div>
                          <div>{customer.mobile}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingCustomer?.id === customer.id ? (
                        <textarea
                          value={editedData.address}
                          onChange={(e) => setEditedData({...editedData, address: e.target.value})}
                          className="rounded-md border-gray-300 shadow-sm focus:border-[#2D2D2D] focus:ring-[#2D2D2D] sm:text-sm w-full"
                          rows="2"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{customer.address}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingCustomer?.id === customer.id ? (
                        <div className="space-y-2">
                          {items.map((item) => {
                            const deliveryItem = editedData.dailyDeliveryItems.find(
                              di => di.itemId === item.id
                            );
                            return (
                              <div key={item.id} className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">{item.itemName}:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={deliveryItem?.quantity || ''}
                                  onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value) || 0)}
                                  className="w-20 rounded-md border-gray-300 shadow-sm focus:border-[#2D2D2D] focus:ring-[#2D2D2D] sm:text-sm"
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">
                          {customer.dailyDeliveryItems?.map((item, index) => (
                            <div key={index}>
                              {item.itemName}: {item.quantity}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {editingCustomer?.id === customer.id ? (
                        <>
                          <button
                            onClick={handleUpdate}
                            disabled={isSubmitting}
                            className="text-green-600 hover:text-green-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(customer)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() =>
                              router.push(
  `/components/planDelivery?customer=${encodeURIComponent(customer.customerName)}&month=${new Date().toISOString().slice(0, 7)}`
)
                            }
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Plan Deliveries
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
