import { useRouter } from 'next/router';
import DeliveryPlanner from '../components/DeliveryPlanner';

export default function DeliveryPlannerPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id) {
    return null;
  }

  return (
    <DeliveryPlanner 
      customerId={id} 
      onBack={() => router.back()}
    />
  );
} 