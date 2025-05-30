import { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function AddItems() {
  const [itemName, setItemName] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await addDoc(collection(db, "Items"), {
        itemName,
        ratePerUnit: Number(ratePerUnit),
        createdAt: new Date()
      });
      
      // Reset form
      setItemName('');
      setRatePerUnit('');
    } catch (error) {
      console.error("Error adding item: ", error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">
            Item Name
          </label>
          <input
            type="text"
            id="itemName"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="ratePerUnit" className="block text-sm font-medium text-gray-700">
            Rate Per Unit
          </label>
          <input
            type="number"
            id="ratePerUnit"
            value={ratePerUnit}
            onChange={(e) => setRatePerUnit(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Item
        </button>
      </form>
    </div>
  );
}
