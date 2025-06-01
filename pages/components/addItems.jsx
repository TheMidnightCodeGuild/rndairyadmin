import { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function AddItems({ onBack }) {
  const [itemName, setItemName] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "Items"), {
        itemName,
        ratePerUnit: Number(ratePerUnit),
        createdAt: new Date()
      });
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reset form
      setItemName('');
      setRatePerUnit('');
    } catch (error) {
      console.error("Error adding item: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-2 border border-gray-800 p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#2D2D2D]">Add New Item</h2>
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
          Item added successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <label htmlFor="itemName" className="block text-sm font-semibold text-gray-700 mb-2">
            Item Name
          </label>
          <input
            type="text"
            id="itemName"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 bg-gray-50 text-gray-900 shadow-sm focus:border-[#2D2D2D] focus:ring-2 focus:ring-[#2D2D2D] transition-all duration-200 placeholder:text-gray-400"
            placeholder="Enter item name"
            required
          />
        </div>
        
        <div>
          <label htmlFor="ratePerUnit" className="block text-sm font-semibold text-gray-700 mb-2">
            Rate Per Unit
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
            <input
              type="number"
              id="ratePerUnit"
              value={ratePerUnit}
              onChange={(e) => setRatePerUnit(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-8 py-3 bg-gray-50 text-gray-900 shadow-sm focus:border-[#2D2D2D] focus:ring-2 focus:ring-[#2D2D2D] transition-all duration-200 placeholder:text-gray-400"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
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
              Add Item
            </>
          )}
        </button>
      </form>
    </div>
  );
}
