import { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function CreateDeliveryMan({ onBack }) {
  const [deliveryManName, setDeliveryManName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Add document to Delivery collection
      await addDoc(collection(db, "Delivery"), {
        deliveryManName: deliveryManName,
        createdAt: new Date(),
      });

      // Reset form
      setDeliveryManName('');
      alert('Delivery man created successfully!');
    } catch (error) {
      console.error('Error creating delivery man:', error);
      alert('Error creating delivery man. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Create Delivery Man</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Back
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="deliveryManName" 
            className="block text-sm font-medium text-gray-700"
          >
            Delivery Man Name
          </label>
          <input
            type="text"
            id="deliveryManName"
            value={deliveryManName}
            onChange={(e) => setDeliveryManName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Delivery Man'}
        </button>
      </form>
    </div>
  );
}

