import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function AddCustomer() {
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    // Fetch items from Firestore
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

    fetchItems();
  }, []);

  const handleItemSelection = (itemId, quantity) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.itemId === itemId);
      if (existing) {
        return prev.map(item => 
          item.itemId === itemId ? { ...item, quantity } : item
        );
      }
      return [...prev, { itemId, quantity }];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dailyDeliveryItems = selectedItems.map(selected => {
        const item = items.find(i => i.id === selected.itemId);
        return {
          itemId: selected.itemId,
          itemName: item.itemName,
          quantity: selected.quantity
        };
      });

      await addDoc(collection(db, 'Customers'), {
        customerName,
        address,
        email,
        mobile,
        dailyDeliveryItems
      });

      // Reset form
      setCustomerName('');
      setAddress('');
      setEmail('');
      setMobile('');
      setSelectedItems([]);
    } catch (error) {
      console.error("Error adding customer: ", error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
            Customer Name
          </label>
          <input
            type="text"
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
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
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
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
                  value={selectedItems.find(i => i.itemId === item.id)?.quantity || ''}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Customer
        </button>
      </form>
    </div>
  );
}
