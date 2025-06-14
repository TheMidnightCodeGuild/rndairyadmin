import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import DeliveryCalendar from './DeliveryCalendar';
import DeliveryModal from './DeliveryModal';
import BillManager from './BillManager';

export default function DeliveryPlanner({ customerId, onBack }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subscriptionItems, setSubscriptionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubscriptionItems() {
      if (!customerId) return;

      try {
        const customerDoc = await getDoc(doc(db, 'customers', customerId));
        if (customerDoc.exists()) {
          const data = customerDoc.data();
          setSubscriptionItems(data.subscriptions?.current?.items || []);
        }
      } catch (error) {
        console.error('Error loading subscription items:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSubscriptionItems();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Delivery Planner</h1>
        <div className="flex items-center gap-4">
          <BillManager customerId={customerId} />
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Back
            </button>
          )}
        </div>
      </div>

      <div className="mb-8">
        <DeliveryCalendar
          customerId={customerId}
          selectedMonth={selectedDate.getMonth() + 1}
          selectedYear={selectedDate.getFullYear()}
          onDayClick={(date) => {
            setSelectedDate(date);
            setIsModalOpen(true);
          }}
        />
      </div>

      {isModalOpen && (
        <DeliveryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          customerId={customerId}
          selectedDate={selectedDate}
          subscriptionItems={subscriptionItems}
        />
      )}
    </div>
  );
} 