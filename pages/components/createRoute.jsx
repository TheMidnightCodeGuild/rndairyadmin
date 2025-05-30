import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function CreateRoute() {
  const [shift, setShift] = useState('Morning');
  const [deliveryManName, setDeliveryManName] = useState('');
  const [selectedDeliveryManId, setSelectedDeliveryManId] = useState('');
  const [deliveryMen, setDeliveryMen] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch delivery men
    const fetchDeliveryMen = async () => {
      try {
        const deliverySnapshot = await getDocs(collection(db, 'Delivery'));
        const deliveryList = deliverySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDeliveryMen(deliveryList);
      } catch (error) {
        console.error("Error fetching delivery men: ", error);
      }
    };

    // Fetch customers
    const fetchCustomers = async () => {
      try {
        const customersSnapshot = await getDocs(collection(db, 'Customers'));
        const customersList = customersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomers(customersList);
      } catch (error) {
        console.error("Error fetching customers: ", error);
      }
    };

    fetchDeliveryMen();
    fetchCustomers();
  }, []);

  const handleDeliveryManChange = (e) => {
    const selectedMan = deliveryMen.find(man => man.deliveryManName === e.target.value);
    setDeliveryManName(e.target.value);
    setSelectedDeliveryManId(selectedMan?.id || '');
  };

  const handleCustomerSelect = (customerId) => {
    if (selectedDeliveries.includes(customerId)) {
      setSelectedDeliveries(selectedDeliveries.filter(id => id !== customerId));
    } else {
      setSelectedDeliveries([...selectedDeliveries, customerId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const deliveryManRef = doc(db, "Delivery", selectedDeliveryManId);
      const routeField = shift.toLowerCase() + 'Route';
      
      await updateDoc(deliveryManRef, {
        [routeField]: selectedDeliveries
      });

      // Reset form
      setSelectedDeliveries([]);
      alert('Route created successfully!');
    } catch (error) {
      console.error("Error creating route: ", error);
      alert('Error creating route. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="shift" className="block text-sm font-medium text-gray-700">
            Shift
          </label>
          <select
            id="shift"
            value={shift}
            onChange={(e) => setShift(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
          </select>
        </div>

        <div>
          <label htmlFor="deliveryMan" className="block text-sm font-medium text-gray-700">
            Delivery Man
          </label>
          <select
            id="deliveryMan"
            value={deliveryManName}
            onChange={handleDeliveryManChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Delivery Man</option>
            {deliveryMen.map((man) => (
              <option key={man.id} value={man.deliveryManName}>
                {man.deliveryManName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Customers
          </label>
          <div className="max-h-60 overflow-y-auto border rounded-md p-2">
            {customers.map((customer) => (
              <div key={customer.id} className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id={customer.id}
                  checked={selectedDeliveries.includes(customer.id)}
                  onChange={() => handleCustomerSelect(customer.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={customer.id} className="text-sm text-gray-700">
                  {customer.customerName}
                </label>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating Route...' : 'Create Route'}
        </button>
      </form>
    </div>
  );
}
