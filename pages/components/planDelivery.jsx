import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { db } from '../../lib/firebase';
import { collection, getDocs, setDoc, doc, Timestamp, query, where } from 'firebase/firestore';
import { generateBillForCustomer } from '@/utils/generateBill';
import { getDoc } from 'firebase/firestore';
import CustomerBills from './customerBills';

export default function DeliveryPlanner({ customerName, selectedMonth }) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState('');
  const [month, setMonth] = useState(selectedMonth || dayjs().format('YYYY-MM'));
  const [days, setDays] = useState([]);
  const [overridesMap, setOverridesMap] = useState({});
  const [customerData, setCustomerData] = useState(null);
  const [isLoadingOverrides, setIsLoadingOverrides] = useState(true);
  const [generatedBill, setGeneratedBill] = useState(null);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [customer, setCustomer] = useState('');
  // Read from query params if available
  useEffect(() => {
    if (router.isReady) {
      const queryCustomer = router.query.customer;
      const queryMonth = router.query.month;
      const queryCustomerId = router.query.customerId;
    
      if (queryCustomer) {
        setCustomer(queryCustomer);
      }
      if (queryMonth) {
        setMonth(queryMonth);
      }
      if (queryCustomerId) {
        setCustomerId(queryCustomerId);
        setCustomerData((prev) => ({ ...prev, id: queryCustomerId }));
      }
    }
  }, [router.isReady, router.query.customer, router.query.month]);

  useEffect(() => {
    const [year, monthNum] = month.split('-');
    const totalDays = dayjs(`${year}-${monthNum}-01`).daysInMonth();
    const daysArr = Array.from({ length: totalDays }, (_, i) => i + 1);
    setDays(daysArr);
  }, [month]);

  useEffect(() => {
    const fetchOverrides = async () => {
      if (!customerId || !month) {
        console.log("No customerId or month");
        return;
      }
      setIsLoadingOverrides(true);
      const startDate = `${month}-01`;
      const endDate = `${month}-${String(dayjs(month + '-01').daysInMonth()).padStart(2, '0')}`;
  
      console.log("Querying overrides for ID:", customerData.id);
      console.log("Start:", startDate, "End:", endDate);
  
      const q = query(
        collection(db, 'overrides'),
        where('customerId', '==', customerId),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
  
      const snapshot = await getDocs(q);
      console.log("Overrides fetched:", snapshot.size);
  
      const map = {};
      snapshot.forEach(doc => {
        map[doc.data().date] = doc.data();
      });
      setOverridesMap(map);
      setIsLoadingOverrides(false);
    };
  
    fetchOverrides();
  }, [customerId, month]); // ← changed dependency!

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) return;
  
      const customerRef = doc(db, 'Customers', customerId);
      const snap = await getDoc(customerRef);
      if (snap.exists()) {
        setCustomerData({ id: snap.id, ...snap.data() });
      } else {
        console.warn('Customer not found');
      }
    };
    fetchCustomer();
  }, [customerId]);

  const handleMarkDelivered = async (day) => {
    if (!customerData) {
      alert('No customer data found!');
      return;
    }
    if (!customerData.dailyDeliveryItems || customerData.dailyDeliveryItems.length === 0) {
      alert('No daily items found for this customer.');
      return;
    }
    // You may need to manually set the customerId if not present in customerData
    const idToUse = customerId || customerData?.id || 'SET_THIS_MANUALLY';
    const dateStr = `${month}-${String(day).padStart(2, '0')}`;
    const docId = `${idToUse}_${dateStr}`;
    try {
      await setDoc(
        doc(collection(db, 'overrides'), docId),
        {
          customerId: idToUse,
          date: dateStr,
          status: 'delivered',
          items: customerData.dailyDeliveryItems || [],
          updatedAt: Timestamp.now(),
        }
      );
      alert('Marked as delivered!');
    } catch (err) {
      console.error('Error marking as delivered:', err);
      alert('Failed to mark as delivered.');
    }
  };

  const handleMarkRejected = async (day) => {
    if (!customerData) {
      alert('No customer data found!');
      return;
    }
  
    const idToUse = customerId || customerData?.id || 'SET_THIS_MANUALLY';
    const dateStr = `${month}-${String(day).padStart(2, '0')}`;
    const docId = `${idToUse}_${dateStr}`;
  
    try {
      await setDoc(
        doc(collection(db, 'overrides'), docId),
        {
          customerId: idToUse,
          date: dateStr,
          status: 'skipped',
          items: customerData.dailyDeliveryItems || [],
          updatedAt: Timestamp.now(),
        }
      );
      alert('Marked as skipped!');
      // Refresh override state manually if needed
      setOverridesMap((prev) => ({
        ...prev,
        [dateStr]: {
          customerId: idToUse,
          date: dateStr,
          status: 'skipped',
          items: customerData.dailyDeliveryItems || [],
          updatedAt: Timestamp.now(),
        },
      }));
    } catch (err) {
      console.error('Error marking as skipped:', err);
      alert('Failed to mark as skipped.');
    }
  };

  const handleGenerateBill = async () => {
    if (!customerId || !month) {
      alert("Missing customer ID or month.");
      return;
    }
  
    const startDate = `${month}-01`;
    const endDate = `${month}-${String(dayjs(month + '-01').daysInMonth()).padStart(2, '0')}`;
  
    setIsGeneratingBill(true);
    try {
      const bill = await generateBillForCustomer(customerId, startDate, endDate);
      if (bill) {
        alert("Bill generated successfully!");
        setGeneratedBill(bill);
      } else {
        alert("No new billable deliveries found.");
      }
    } catch (err) {
      console.error("Failed to generate bill:", err);
      alert("Failed to generate bill.");
    } finally {
      setIsGeneratingBill(false);
    }
  };
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Show customer and month-year heading if available */}
      {(customer || month) && (
        <div className="mb-4 text-center">
          {customer && (
            <h2 className="text-xl font-bold text-[#2D2D2D]">Customer: {customerData?.customerName || customer}</h2>
          )}
          {month && (
            <div className="text-lg text-gray-700">Month: {dayjs(month + '-01').format('MMMM YYYY')}</div>
          )}
        </div>
      )}
    
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search Customer"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm w-full md:w-1/2 focus:border-[#2D2D2D] focus:ring-2 focus:ring-[#2D2D2D] transition-all duration-200"
        />
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-[#2D2D2D] focus:ring-2 focus:ring-[#2D2D2D] transition-all duration-200"
        />
            <button
              onClick={handleGenerateBill}
              disabled={isGeneratingBill}
              className="px-4 py-2 bg-[#2D2D2D] text-white rounded-md shadow hover:bg-[#444] transition disabled:opacity-50"
            >
              {isGeneratingBill ? 'Generating Bill...' : 'Generate Bill'}
            </button>
            <button
                className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
                onClick={() => router.push(`/bills?customerId=${customerId}`)}
              >
                💳 View Bills
              </button>
      </div>

      <div className="mt-2">
        {/* Weekday headers */}
        {isLoadingOverrides ? (
            <div>Loading...</div>
                 ) : Object.keys(overridesMap).length > 0 ? (
        <div>Overrides Loaded</div>
        ) : (
            <div>No Overrides</div>
            )}

        <div className="grid grid-cols-7 gap-px mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((wd) => (
            <div key={wd} className="text-center text-xs font-medium text-gray-500 py-2">
              {wd}
            </div>
          ))}
        </div>
        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-100">
          {/* Add empty divs for days before the 1st of the month */}
          {(() => {
            const firstDayOfWeek = dayjs(month + '-01').day();
            return Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white border border-gray-200 min-w-[90px] min-h-[90px]" />
            ));
          })()}
          {days.map((day) => {
            const isToday = dayjs().isSame(dayjs(`${month}-${String(day).padStart(2, '0')}`), 'day');
            const dateStr = `${month}-${String(day).padStart(2, '0')}`;
            const override = overridesMap[dateStr];
            const thisDate = dayjs(dateStr);
            const currentDate = dayjs();
            const isPastOrToday = thisDate.isSame(currentDate, 'day') || thisDate.isBefore(currentDate, 'day');
            let dayBg = '';
            if (override?.status === 'delivered') dayBg = 'bg-green-100';
            else if (override?.status === 'skipped') dayBg = 'bg-red-100';

            return (
              <div
                key={day}
                className={`relative bg-white border border-gray-200 min-w-[90px] min-h-[90px] flex flex-col items-center justify-start p-1 transition-colors duration-150 hover:bg-gray-50 ${isToday ? 'border-blue-500' : ''} ${dayBg}`}
              >
                {override?.status}
                <span className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>{day}</span>
                <div className="flex flex-row gap-1 items-center mt-auto mb-1">
                <button
                  type="button"
                  onClick={() => handleMarkDelivered(day)}
                  className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors duration-150"
                >
                  ✅
                </button>
                  <button
                   type="button"
                   onClick={() => handleMarkRejected(day)}
                   className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors duration-150"
                  >
                  ❌
                 </button>
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-colors duration-150"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}