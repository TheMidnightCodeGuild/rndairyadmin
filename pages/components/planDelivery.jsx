import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { db } from '../../lib/firebase';
import { collection, getDocs, setDoc, doc, Timestamp, query, where, getDoc } from 'firebase/firestore';
import { generateBillForCustomer } from '@/utils/generateBill';

export default function DeliveryPlanner({ selectedMonth }) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState('');
  const [month, setMonth] = useState(selectedMonth || dayjs().format('YYYY-MM'));
  const [days, setDays] = useState([]);
  const [overridesMap, setOverridesMap] = useState({});
  const [customerData, setCustomerData] = useState(null);
  const [isLoadingOverrides, setIsLoadingOverrides] = useState(true);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [customer, setCustomer] = useState('');

  // Utility function for date string
  const getDateStr = (day) => `${month}-${String(day).padStart(2, '0')}`;

  // Read from query params if available
  useEffect(() => {
    if (router.isReady) {
      const queryCustomer = router.query.customer;
      const queryMonth = router.query.month;
      const queryCustomerId = router.query.customerId;

      if (queryCustomer) setCustomer(queryCustomer);
      if (queryMonth) setMonth(queryMonth);
      if (queryCustomerId) setCustomerId(queryCustomerId);
    }
  }, [router.isReady, router.query.customer, router.query.month, router.query.customerId]);

  // Set days in month
  useEffect(() => {
    const [year, monthNum] = month.split('-');
    const totalDays = dayjs(`${year}-${monthNum}-01`).daysInMonth();
    setDays(Array.from({ length: totalDays }, (_, i) => i + 1));
  }, [month]);

  // Fetch overrides for the month
  useEffect(() => {
    const fetchOverrides = async () => {
      if (!customerId || !month) return;
      setIsLoadingOverrides(true);
      const startDate = `${month}-01`;
      const endDate = `${month}-${String(dayjs(month + '-01').daysInMonth()).padStart(2, '0')}`;

      const q = query(
        collection(db, 'overrides'),
        where('customerId', '==', customerId),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );

      const snapshot = await getDocs(q);
      const map = {};
      snapshot.forEach(doc => {
        // Always use lowercase for status
        const data = doc.data();
        map[data.date] = { ...data, status: data.status?.toLowerCase() };
      });
      setOverridesMap(map);
      setIsLoadingOverrides(false);
    };

    fetchOverrides();
  }, [customerId, month]);

  // Fetch customer data
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) return;
      const customerRef = doc(db, 'Customers', customerId);
      const snap = await getDoc(customerRef);
      if (snap.exists()) {
        setCustomerData({ id: snap.id, ...snap.data() });
      } else {
        setCustomerData(null);
      }
    };
    fetchCustomer();
  }, [customerId]);

  // Ensure customerId is always from customerData after fetch
  useEffect(() => {
    if (customerData?.id && customerId !== customerData.id) {
      setCustomerId(customerData.id);
    }
  }, [customerData, customerId]);

  const handleMarkDelivered = async (day) => {
    if (!customerData) return;
  
    const dateStr = getDateStr(day);
    const docId = `${customerId}_${dateStr}`;
  
    try {
      // 1. Build enriched items with price
      const enrichedItems = await Promise.all(
        (customerData.dailyDeliveryItems || []).map(async (item) => {
          const itemRef = doc(db, 'Items', item.itemId);
          const itemSnap = await getDoc(itemRef);
          const itemData = itemSnap.exists() ? itemSnap.data() : {};
          return {
            ...item,
            ratePerUnit: itemData.ratePerUnit || 0
          };
        })
      );
  
      // 2. Save with enriched items
      await setDoc(doc(collection(db, 'overrides'), docId), {
        customerId,
        date: dateStr,
        status: 'delivered',
        items: enrichedItems,
        updatedAt: Timestamp.now(),
      });
  
      console.log('Marked as delivered!');
      setOverridesMap((prev) => ({
        ...prev,
        [dateStr]: {
          customerId,
          date: dateStr,
          status: 'delivered',
          items: enrichedItems,
          updatedAt: Timestamp.now(),
        },
      }));
    } catch (err) {
      console.log('Failed to mark as delivered.', err);
    }
  };

  const handleMarkRejected = async (day) => {
    if (!customerData) return;
  
    const dateStr = getDateStr(day);
    const docId = `${customerId}_${dateStr}`;
  
    try {
      const enrichedItems = await Promise.all(
        (customerData.dailyDeliveryItems || []).map(async (item) => {
          const itemRef = doc(db, 'Items', item.itemId);
          const itemSnap = await getDoc(itemRef);
          const itemData = itemSnap.exists() ? itemSnap.data() : {};
          return {
            ...item,
            ratePerUnit: itemData.ratePerUnit || 0
          };
        })
      );
  
      await setDoc(doc(collection(db, 'overrides'), docId), {
        customerId,
        date: dateStr,
        status: 'skipped',
        items: enrichedItems,
        updatedAt: Timestamp.now(),
      });
  
      console.log('Marked as skipped!');
      setOverridesMap((prev) => ({
        ...prev,
        [dateStr]: {
          customerId,
          date: dateStr,
          status: 'skipped',
          items: enrichedItems,
          updatedAt: Timestamp.now(),
        },
      }));
    } catch (err) {
      console.log('Failed to mark as skipped.', err);
    }
  };

  const handleGenerateBill = async () => {
    if (!customerId || !month) {
      // TODO: replace with toast
      console.log("Missing customer ID or month.");
      return;
    }
    const startDate = `${month}-01`;
    const endDate = `${month}-${String(dayjs(month + '-01').daysInMonth()).padStart(2, '0')}`;
    setIsGeneratingBill(true);
    try {
      const bill = await generateBillForCustomer(customerId, startDate, endDate);
      if (bill) {
        // TODO: replace with toast
        console.log("Bill generated successfully!");
      } else {
        // TODO: replace with toast
        console.log("No new billable deliveries found.");
      }
    } catch (err) {
      // TODO: replace with toast
      console.log("Failed to generate bill.");
    } finally {
      setIsGeneratingBill(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
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
        <div className="grid grid-cols-7 gap-px bg-gray-100">
          {(() => {
            const firstDayOfWeek = dayjs(month + '-01').day();
            return Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white border border-gray-200 min-w-[90px] min-h-[90px]" />
            ));
          })()}
          {days.map((day) => {
            const isToday = dayjs().isSame(dayjs(getDateStr(day)), 'day');
            const dateStr = getDateStr(day);
            const override = overridesMap[dateStr];

            return (
              <div
                key={day}
                className={`relative bg-white border border-gray-200 min-w-[90px] min-h-[90px] flex flex-col items-center justify-start p-1 transition-colors duration-150 hover:bg-gray-50 ${isToday ? 'border-blue-500' : ''} ${override?.status === 'delivered' ? 'bg-green-100' : override?.status === 'skipped' ? 'bg-red-100' : ''}`}
              >
                {override?.status}
                <span className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>{day}</span>
                <div className="flex flex-row gap-1 items-center mt-auto mb-1">
                  <button
                    type="button"
                    onClick={() => handleMarkDelivered(day)}
                    className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors duration-150"
                    disabled={override?.status === 'delivered'}
                  >
                    ✅
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkRejected(day)}
                    className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors duration-150"
                    disabled={override?.status === 'skipped'}
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