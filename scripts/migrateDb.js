import { db } from '../lib/firebase.js';
import { collection, getDocs, doc, setDoc, deleteField, updateDoc } from 'firebase/firestore';

async function migrateDatabase() {
  try {
    // Get all customers
    const customersSnapshot = await getDocs(collection(db, 'Customers'));
    
    for (const customerDoc of customersSnapshot.docs) {
      const customerData = customerDoc.data();
      const customerId = customerDoc.id;
      
      // Create subscription document if dailyDeliveryItems exist
      if (customerData.dailyDeliveryItems && customerData.dailyDeliveryItems.length > 0) {
        await setDoc(
          doc(db, 'customers', customerId, 'subscriptions', 'current'),
          {
            items: customerData.dailyDeliveryItems,
            startDate: customerData.createdAt || new Date(),
            status: 'active'
          }
        );
      }
      
      // Move customer data to new structure
      const newCustomerData = {
        name: customerData.customerName || '',
        createdAt: customerData.createdAt || new Date(),
        updatedAt: new Date()
      };

      // Only add optional fields if they exist
      if (customerData.email) newCustomerData.email = customerData.email;
      if (customerData.mobile) newCustomerData.mobile = customerData.mobile;
      if (customerData.address) newCustomerData.address = customerData.address;
      
      await setDoc(
        doc(db, 'customers', customerId),
        newCustomerData
      );
      
      // Remove old fields if they exist
      const fieldsToDelete = {
        dailyDeliveryItems: deleteField(),
        customerName: deleteField()
      };
      
      await updateDoc(doc(db, 'customers', customerId), fieldsToDelete);
      
      console.log(`Migrated customer: ${customerId}`);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration
migrateDatabase(); 