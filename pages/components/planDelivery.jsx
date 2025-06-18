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
            <h2 className="text-xl font-bold">Customer: {customerData?.customerName || customer}</h2>
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
          className="px-4 py-2 border rounded w-full md:w-1/2"
        />
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-4 py-2 border rounded"
        />
      </div>

      <div className="grid grid-cols-7 gap-4">
        {days.map((day) => (
          <div
            key={day}
            className="border p-4 text-center rounded hover:bg-blue-100 cursor-pointer"
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}