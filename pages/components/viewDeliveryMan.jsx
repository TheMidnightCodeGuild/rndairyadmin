import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';

export default function ViewDeliveryMan({ onBack }) {
  const [deliveryMen, setDeliveryMen] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    deliveryManName: '',
    phone: '',
    address: '',
    route: ''
  });
  const [editForm, setEditForm] = useState({
    deliveryManName: '',
    phone: '',
    address: '',
    route: ''
  });

  useEffect(() => {
    fetchDeliveryMen();
  }, []);

  // Show message for 3 seconds
  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
  };

  const fetchDeliveryMen = async () => {
    try {
      console.log('Fetching delivery men...');
      const querySnapshot = await getDocs(collection(db, 'Delivery'));
      console.log('Query snapshot:', querySnapshot);
      
      const deliveryMenData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Document data:', data);
        return {
          id: doc.id,
          ...data
        };
      });
      
      console.log('Processed delivery men data:', deliveryMenData);
      setDeliveryMen(deliveryMenData);
      
      if (deliveryMenData.length === 0) {
        showMessage('No delivery men found in the database', 'error');
      }
    } catch (error) {
      console.error('Error fetching delivery men:', error);
      showMessage('Failed to load delivery men: ' + error.message, 'error');
    }
  };

  const handleEdit = (deliveryMan) => {
    setEditingId(deliveryMan.id);
    setEditForm({
      deliveryManName: deliveryMan.deliveryManName || '',
      phone: deliveryMan.phone || '',
      address: deliveryMan.address || '',
      route: deliveryMan.route || ''
    });
  };

  const handleUpdate = async () => {
    try {
      const deliveryManRef = doc(db, 'Delivery', editingId);
      await updateDoc(deliveryManRef, editForm);
      showMessage('Delivery man updated successfully', 'success');
      setEditingId(null);
      fetchDeliveryMen();
    } catch (error) {
      console.error('Error updating delivery man:', error);
      showMessage('Failed to update delivery man: ' + error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this delivery man?')) {
      try {
        await deleteDoc(doc(db, 'Delivery', id));
        showMessage('Delivery man deleted successfully', 'success');
        fetchDeliveryMen();
      } catch (error) {
        console.error('Error deleting delivery man:', error);
        showMessage('Failed to delete delivery man: ' + error.message, 'error');
      }
    }
  };

  const handleCreate = async () => {
    try {
      // Validate form fields
      if (!createForm.deliveryManName || !createForm.phone) {
        showMessage('Name and phone are required', 'error');
        return;
      }

      const docRef = await addDoc(collection(db, 'Delivery'), createForm);
      showMessage('Delivery man created successfully', 'success');
      setShowCreateForm(false);
      setCreateForm({
        deliveryManName: '',
        phone: '',
        address: '',
        route: ''
      });
      fetchDeliveryMen();
    } catch (error) {
      console.error('Error creating delivery man:', error);
      showMessage('Failed to create delivery man: ' + error.message, 'error');
    }
  };

  return (
    <div className="container mx-auto px-4">
      {message.text && (
        <div 
          className={`fixed top-4 right-4 p-4 rounded shadow-lg ${
            message.type === 'error' ? 'bg-red-500' : 'bg-green-500'
          } text-white`}
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Delivery Men</h2>
        <div className="space-x-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {showCreateForm ? 'Cancel' : 'Add New Delivery Man'}
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white p-6 rounded shadow-md mb-6">
          <h3 className="text-xl font-semibold mb-4">Add New Delivery Man</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                value={createForm.deliveryManName}
                onChange={(e) => setCreateForm({ ...createForm, deliveryManName: e.target.value })}
                className="border rounded px-3 py-2 w-full"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Phone *</label>
              <input
                type="text"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                className="border rounded px-3 py-2 w-full"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={createForm.address}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                className="border rounded px-3 py-2 w-full"
                placeholder="Enter address"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Route</label>
              <input
                type="text"
                value={createForm.route}
                onChange={(e) => setCreateForm({ ...createForm, route: e.target.value })}
                className="border rounded px-3 py-2 w-full"
                placeholder="Enter route"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Delivery Man
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        {deliveryMen.length === 0 ? (
          <p className="text-center text-gray-600 my-4">No delivery men found</p>
        ) : (
          <table className="min-w-full bg-white shadow-md rounded">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Phone</th>
                <th className="py-3 px-4 text-left">Address</th>
                <th className="py-3 px-4 text-left">Route</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveryMen.map((deliveryMan) => (
                <tr key={deliveryMan.id} className="border-b hover:bg-gray-100">
                  <td className="py-3 px-4">
                    {editingId === deliveryMan.id ? (
                      <input
                        type="text"
                        value={editForm.deliveryManName}
                        onChange={(e) => setEditForm({ ...editForm, deliveryManName: e.target.value })}
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      deliveryMan.deliveryManName || 'N/A'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingId === deliveryMan.id ? (
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      deliveryMan.phone || 'N/A'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingId === deliveryMan.id ? (
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      deliveryMan.address || 'N/A'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingId === deliveryMan.id ? (
                      <input
                        type="text"
                        value={editForm.route}
                        onChange={(e) => setEditForm({ ...editForm, route: e.target.value })}
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      deliveryMan.route || 'N/A'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingId === deliveryMan.id ? (
                      <div className="space-x-2">
                        <button
                          onClick={handleUpdate}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleEdit(deliveryMan)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(deliveryMan.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 