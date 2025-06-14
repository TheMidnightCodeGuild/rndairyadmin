import { db } from '../lib/firebase.js';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

async function deleteOldCollection() {
  try {
    console.log('Starting deletion of old Customers collection...');
    
    // Get all documents from the old Customers collection
    const snapshot = await getDocs(collection(db, 'Customers'));
    
    // Delete each document
    const deletePromises = snapshot.docs.map(async (document) => {
      console.log(`Deleting customer document: ${document.id}`);
      await deleteDoc(doc(db, 'Customers', document.id));
    });
    
    // Wait for all deletions to complete
    await Promise.all(deletePromises);
    
    console.log('Successfully deleted all documents from old Customers collection!');
  } catch (error) {
    console.error('Error deleting collection:', error);
  }
}

// Run the deletion
deleteOldCollection(); 