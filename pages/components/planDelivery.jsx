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

      <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-gray-800 rounded-xl p-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((wd) => (
            <div key={wd} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {wd}
            </div>
          ))}
        </div>
        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Add empty divs for days before the 1st of the month */}
          {(() => {
            const firstDayOfWeek = dayjs(month + '-01').day();
            return Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="" />
            ));
          })()}
          {days.map((day) => {
            const isToday = dayjs().isSame(dayjs(`${month}-${String(day).padStart(2, '0')}`), 'day');
            return (
              <div
                key={day}
                className={`relative border border-gray-200 bg-white rounded-lg p-4 text-center font-medium cursor-pointer transition-all duration-200 shadow-sm hover:bg-blue-50 hover:border-blue-400 group flex flex-col items-center justify-between min-h-[110px]`}
              >
                <span className={`text-lg ${isToday ? 'text-blue-700 font-bold' : 'text-gray-800'}`}>{day}</span>
                {isToday && (
                  <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full shadow">Today</span>
                )}
                {/* Action buttons */}
                <div className="flex justify-center gap-2 mt-4">
                  {/* Tick (Complete) */}
                  <button
                    type="button"
                    className="p-1.5 rounded-full bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-900 transition-colors duration-200 shadow-sm"
                    title="Mark as Complete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  {/* Cross (Rejected) */}
                  <button
                    type="button"
                    className="p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-900 transition-colors duration-200 shadow-sm"
                    title="Mark as Rejected"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {/* Pencil (Edit) */}
                  <button
                    type="button"
                    className="p-1.5 rounded-full bg-yellow-100 hover:bg-yellow-200 text-yellow-700 hover:text-yellow-900 transition-colors duration-200 shadow-sm"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m2-2l-6 6" />
                    </svg>
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