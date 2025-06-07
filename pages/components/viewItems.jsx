import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function ViewItems({ onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedRate, setEditedRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const itemsSnapshot = await getDocs(collection(db, 'Items'));
      const itemsList = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemsList);
    } catch (error) {
      console.error("Error fetching items: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditedName(item.itemName);
    setEditedRate(item.ratePerUnit.toString());
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    setIsSubmitting(true);

    try {
      const itemRef = doc(db, "Items", editingItem.id);
      await updateDoc(itemRef, {
        itemName: editedName,
        ratePerUnit: Number(editedRate)
      });

      // Update local state
      setItems(items.map(item => 
        item.id === editingItem.id 
          ? { ...item, itemName: editedName, ratePerUnit: Number(editedRate) }
          : item
      ));

      setShowSuccess('Item updated successfully!');
      setTimeout(() => setShowSuccess(''), 3000);
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating item: ", error);
      setShowSuccess('Error updating item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await deleteDoc(doc(db, "Items", itemId));
      setItems(items.filter(item => item.id !== itemId));
      setShowSuccess('Item deleted successfully!');
      setTimeout(() => setShowSuccess(''), 3000);
    } catch (error) {
      console.error("Error deleting item: ", error);
      setShowSuccess('Error deleting item');
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditedName('');
    setEditedRate('');
  };

  return (
    <div className="max-w-4xl mx-auto mt-2 border border-gray-800 p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#2D2D2D]">Manage Items</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#2D2D2D] text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:ring-offset-2 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
      </div>

      {showSuccess && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {showSuccess}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D2D2D]"></div>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate Per Unit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingItem?.id === item.id ? (
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-[#2D2D2D] focus:ring-[#2D2D2D] sm:text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{item.itemName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingItem?.id === item.id ? (
                      <input
                        type="number"
                        value={editedRate}
                        onChange={(e) => setEditedRate(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-[#2D2D2D] focus:ring-[#2D2D2D] sm:text-sm"
                        step="0.01"
                        min="0"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">₹{item.ratePerUnit}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {editingItem?.id === item.id ? (
                      <>
                        <button
                          onClick={handleUpdate}
                          disabled={isSubmitting}
                          className="text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 