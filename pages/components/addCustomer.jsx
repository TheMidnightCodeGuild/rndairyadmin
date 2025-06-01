import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function AddCustomer({ onBack }) {
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
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
    setIsSubmitting(true);
    
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
        dailyDeliveryItems,
        createdAt: new Date()
      });

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reset form
      setCustomerName('');
      setAddress('');
      setEmail('');
      setMobile('');
      setSelectedItems([]);
    } catch (error) {
      console.error("Error adding customer: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#2D2D2D]">Add New Customer</h2>
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
          Customer added successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 w-full rounded-xl shadow-lg">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="customerName" className="block text-sm font-semibold text-gray-700 mb-2">
              Customer Name
            </label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 bg-gray-50 text-gray-900 shadow-sm focus:border-[#2D2D2D] focus:ring-2 focus:ring-[#2D2D2D] transition-all duration-200 placeholder:text-gray-400"
              placeholder="Enter customer name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 bg-gray-50 text-gray-900 shadow-sm focus:border-[#2D2D2D] focus:ring-2 focus:ring-[#2D2D2D] transition-all duration-200 placeholder:text-gray-400"
              placeholder="Enter email"
              required
            />
          </div>

          <div>
            <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700 mb-2">
              Mobile
            </label>
            <input
              type="tel"
              id="mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 bg-gray-50 text-gray-900 shadow-sm focus:border-[#2D2D2D] focus:ring-2 focus:ring-[#2D2D2D] transition-all duration-200 placeholder:text-gray-400"
              placeholder="Enter mobile number"
              required
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
              Address
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 bg-gray-50 text-gray-900 shadow-sm focus:border-[#2D2D2D] focus:ring-2 focus:ring-[#2D2D2D] transition-all duration-200 placeholder:text-gray-400"
              placeholder="Enter address"
              required
              rows="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Daily Delivery Items
          </label>
          <div className="grid grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-grow">
                  <label className="text-sm text-gray-600">{item.itemName}</label>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="Quantity"
                  className="w-24 rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 shadow-sm focus:border-[#2D2D2D] focus:ring-2 focus:ring-[#2D2D2D] transition-all duration-200"
                  onChange={(e) => handleItemSelection(item.id, parseInt(e.target.value) || 0)}
                  value={selectedItems.find(i => i.itemId === item.id)?.quantity || ''}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full rounded-lg bg-[#2D2D2D] py-4 px-6 text-white font-semibold hover:bg-[#2D2D2D]/80 focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Customer
            </>
          )}
        </button>
      </form>
    </div>
  );
}
