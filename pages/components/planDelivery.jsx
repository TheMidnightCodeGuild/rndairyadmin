import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function DeliveryPlanner({ customerName, selectedMonth }) {
  const router = useRouter();
  const [customer, setCustomer] = useState('');
  const [month, setMonth] = useState(selectedMonth || dayjs().format('YYYY-MM'));
  const [days, setDays] = useState([]);
  const [customerData, setCustomerData] = useState(null);

  // Read from query params if available
  useEffect(() => {
    if (router.isReady) {
      const queryCustomer = router.query.customer;
      const queryMonth = router.query.month;
      if (queryCustomer) {
        setCustomer(queryCustomer);
      }
      if (queryMonth) {
        setMonth(queryMonth);
      }
    }
  }, [router.isReady, router.query.customer, router.query.month]);

  // Fetch customer data if customer name is present
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (customer) {
        const customersSnapshot = await getDocs(collection(db, 'Customers'));
        const found = customersSnapshot.docs.find(doc => doc.data().customerName === customer);
        if (found) {
          setCustomerData(found.data());
        } else {
          setCustomerData(null);
        }
      } else {
        setCustomerData(null);
      }
    };
    fetchCustomerData();
  }, [customer]);

  useEffect(() => {
    const [year, monthNum] = month.split('-');
    const totalDays = dayjs(`${year}-${monthNum}-01`).daysInMonth();
    const daysArr = Array.from({ length: totalDays }, (_, i) => i + 1);
    setDays(daysArr);
  }, [month]);

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
      </div>

      <div className="mt-2">
        {/* Weekday headers */}
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
            return (
              <div
                key={day}
                className={`relative bg-white border border-gray-200 min-w-[90px] min-h-[90px] flex flex-col items-center justify-start p-1 transition-colors duration-150 hover:bg-gray-50 ${isToday ? 'border-blue-500' : ''}`}
              >
                <span className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>{day}</span>
                <div className="flex flex-row gap-1 items-center mt-auto mb-1">
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors duration-150"
                  >
                    ✅
                  </button>
                  <button
                    type="button"
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