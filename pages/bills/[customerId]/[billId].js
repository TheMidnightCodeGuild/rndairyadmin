import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function BillPreview() {
  const router = useRouter();
  const { customerId, billId } = router.query;
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBill = async () => {
      if (!customerId || !billId) return;

      try {
        setLoading(true);
        const billDoc = await getDoc(doc(db, `bills/${customerId}/customerBills`, billId));
        
        if (!billDoc.exists()) {
          setError('Bill not found');
          return;
        }

        setBill(billDoc.data());
      } catch (err) {
        console.error('Error loading bill:', err);
        setError('Failed to load bill');
      } finally {
        setLoading(false);
      }
    };

    loadBill();
  }, [customerId, billId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!bill) return null;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white shadow-lg rounded-lg p-6">
        {/* Header */}
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold mb-2">Bill Details</h1>
          <div className="text-gray-600">
            <p>Period: {bill.fromDate} to {bill.toDate}</p>
            <p>Generated: {new Date(bill.generatedAt?.toDate()).toLocaleString()}</p>
            <p>Status: {bill.isPaid ? 'Paid' : 'Pending'}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Item</th>
                <th className="text-right py-2">Quantity</th>
                <th className="text-right py-2">Rate</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{item.itemName}</td>
                  <td className="text-right py-2">{item.quantity}</td>
                  <td className="text-right py-2">₹{item.rate}</td>
                  <td className="text-right py-2">₹{item.total}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan="3" className="text-right py-4">Total Amount:</td>
                <td className="text-right py-4">₹{bill.totalAmount}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
          >
            Print Bill
          </button>
          {!bill.isPaid && (
            <button
              onClick={() => {/* Add payment handling */}}
              className="px-4 py-2 bg-[#2D2D2D] text-white rounded hover:bg-gray-700"
            >
              Mark as Paid
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 