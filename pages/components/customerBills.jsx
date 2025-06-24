import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';

export default function CustomerBills({ customerId: propCustomerId }) {
  const router = useRouter();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [filter, setFilter] = useState('all'); // 'all', 'paid', 'unpaid'

  // Get customerId from prop or query param
  const customerId = propCustomerId || router.query.customerId;

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    const fetchBills = async () => {
      try {
        const billsRef = collection(db, 'bills');
        const q = query(
          billsRef,
          where('customerId', '==', customerId),
          orderBy('generatedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const billsArr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBills(billsArr);
      } catch (err) {
        setError('Failed to fetch bills.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, [customerId]);

  const toggleExpand = (billId) => {
    setExpanded(prev => ({ ...prev, [billId]: !prev[billId] }));
  };

  const filteredBills = bills.filter(bill => {
    if (filter === 'all') return true;
    return bill.status === filter;
  });

  if (!customerId) {
    return <div className="text-center text-gray-500">No customer selected.</div>;
  }

  if (loading) {
    return <div className="text-center text-gray-500">Loading bills...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div>
      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6 justify-center">
        <button
          className={`px-4 py-2 rounded border shadow-sm text-sm font-medium transition-colors duration-150 ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'}`}
          onClick={() => setFilter('all')}
        >
          All Bills
        </button>
        <button
          className={`px-4 py-2 rounded border shadow-sm text-sm font-medium transition-colors duration-150 ${filter === 'paid' ? 'bg-green-600 text-white' : 'bg-white text-green-600 border-green-600 hover:bg-green-50'}`}
          onClick={() => setFilter('paid')}
        >
          Paid Bills
        </button>
        <button
          className={`px-4 py-2 rounded border shadow-sm text-sm font-medium transition-colors duration-150 ${filter === 'unpaid' ? 'bg-red-600 text-white' : 'bg-white text-red-600 border-red-600 hover:bg-red-50'}`}
          onClick={() => setFilter('unpaid')}
        >
          Unpaid Bills
        </button>
      </div>
      {filteredBills.length === 0 ? (
        <div className="text-center text-gray-500">No bills found.</div>
      ) : (
        <div className="space-y-6">
          {filteredBills.map((bill) => (
            <div key={bill.id} className="border rounded-lg shadow bg-white p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm text-gray-500">Bill ID: <span className="font-mono">{bill.billId || bill.id}</span></div>
                  <div className="text-base font-semibold">Period: {dayjs(bill.startDate).format('DD MMM YYYY')} - {dayjs(bill.endDate).format('DD MMM YYYY')}</div>
                </div>
                <div className="flex flex-col md:items-end">
                  <div className="text-lg font-bold text-blue-700">₹{bill.totalAmount}</div>
                  <div className={`text-xs font-semibold mt-1 ${bill.status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>{bill.status}</div>
                </div>
              </div>
              <button
                className="text-sm text-blue-600 hover:underline focus:outline-none mb-2"
                onClick={() => toggleExpand(bill.id)}
              >
                {expanded[bill.id] ? 'Hide' : 'Show'} item breakdown
              </button>
              {expanded[bill.id] && bill.itemsBreakdown && bill.itemsBreakdown.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-2 py-1">Date</th>
                        <th className="border px-2 py-1">Item</th>
                        <th className="border px-2 py-1">Qty</th>
                        <th className="border px-2 py-1">Price</th>
                        <th className="border px-2 py-1">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bill.itemsBreakdown.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border px-2 py-1">{dayjs(item.date).format('DD MMM')}</td>
                          <td className="border px-2 py-1">{item.itemName}</td>
                          <td className="border px-2 py-1">{item.quantity}</td>
                          <td className="border px-2 py-1">₹{item.price}</td>
                          <td className="border px-2 py-1">₹{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="text-xs text-gray-400 mt-2">Generated: {bill.generatedAt && bill.generatedAt.seconds ? dayjs.unix(bill.generatedAt.seconds).format('DD MMM YYYY, HH:mm') : ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 