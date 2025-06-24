import CustomerBills from './components/CustomerBills';
import { useRouter } from 'next/router';

export default function BillsPage() {
  const router = useRouter();
  const { customerId } = router.query;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Customer Bills</h1>
      {customerId ? (
        <CustomerBills customerId={customerId} />
      ) : (
        <div className="text-center text-gray-500">No customer selected.</div>
      )}
    </div>
  );
}