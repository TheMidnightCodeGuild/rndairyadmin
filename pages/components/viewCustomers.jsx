import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function ViewCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    mobile: '',
    address: '',
    dailyDeliveryItems: []
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersSnapshot = await getDocs(collection(db, 'Customers'));
        const customersData = customersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomers(customersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching customers: ", error);
        setLoading(false);
      }
    };

    const fetchItems = async () => {
      try {
        const itemsCollection = collection(db, 'Items');
        const itemsSnapshot = await getDocs(itemsCollection);
        const itemsList = itemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setItems(itemsList);
      } catch (error) {
        console.error("Error fetching items: ", error);
      }
    };

    fetchCustomers();
    fetchItems();
  }, []);

  const handleDeleteCustomer = async (customerId) => {
    try {
      await deleteDoc(doc(db, 'Customers', customerId));
      setCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== customerId));
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Failed to delete customer. Please try again.");
    }
  };

  const handleEditClick = (customer) => {
    setEditingCustomer(customer.id);
    setFormData({
      customerName: customer.customerName,
      email: customer.email,
      mobile: customer.mobile,
      address: customer.address,
      dailyDeliveryItems: customer.dailyDeliveryItems || []
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (customerId) => {
    try {
      const updatedData = {
        customerName: formData.customerName,
        email: formData.email,
        mobile: formData.mobile,
        address: formData.address,
        dailyDeliveryItems: formData.dailyDeliveryItems
      };

      await updateDoc(doc(db, 'Customers', customerId), updatedData);
      setCustomers(prevCustomers => 
        prevCustomers.map(customer => 
          customer.id === customerId ? { ...customer, ...updatedData } : customer
        )
      );
      setEditingCustomer(null);
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("Failed to update customer. Please try again.");
    }
  };

  const handleItemSelection = (itemId, quantity) => {
    setFormData(prev => {
      const existing = prev.dailyDeliveryItems.find(item => item.itemId === itemId);
      if (existing) {
        return {
          ...prev,
          dailyDeliveryItems: prev.dailyDeliveryItems.map(item =>
            item.itemId === itemId ? { ...item, quantity } : item
          )
        };
      }
      const item = items.find(i => i.id === itemId);
      return {
        ...prev,
        dailyDeliveryItems: [...prev.dailyDeliveryItems, { itemId, itemName: item.itemName, quantity }]
      };
    });
  };

  if (loading) {
    return <div className="text-center mt-8">Loading customers...</div>;
  }

  if (customers.length === 0) {
    return <div className="text-center mt-8">No customers found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <h2 className="text-2xl font-bold mb-6">Customers</h2>
      <div className="grid gap-6">
        {customers.map((customer) => (
          <div key={customer.id} className="bg-white shadow rounded-lg p-6">
            {editingCustomer === customer.id ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                    Mobile
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Delivery Items
                  </label>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <div className="flex-grow">
                          <label className="text-sm text-gray-600">{item.itemName}</label>
                        </div>
                        <input
                          type="number"
                          min="0"
                          placeholder="Quantity"
                          className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          onChange={(e) => handleItemSelection(item.id, parseInt(e.target.value) || 0)}
                          value={formData.dailyDeliveryItems.find(i => i.itemId === item.id)?.quantity || ''}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingCustomer(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave(customer.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">{customer.customerName}</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">{customer.mobile}</span>
                    <button
                      onClick={() => handleEditClick(customer)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-gray-600">
                  <p>{customer.address}</p>
                  <p className="mt-1">Email: {customer.email}</p>
                  {customer.dailyDeliveryItems && customer.dailyDeliveryItems.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Daily Delivery Items:</p>
                      <ul className="list-disc list-inside">
                        {customer.dailyDeliveryItems.map((item, index) => (
                          <li key={index}>
                            {item.itemName}: {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
