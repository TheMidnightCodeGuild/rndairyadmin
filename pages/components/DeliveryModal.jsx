import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, setDoc, collection, getDocs, getDoc } from 'firebase/firestore';

export default function DeliveryModal({ 
  isOpen, 
  onClose, 
  customerId, 
  selectedDate,
  subscriptionItems = []
}) {
  const [deliveryDetails, setDeliveryDetails] = useState({
    subscriptionItems: [],
    extraItems: [],
    type: 'custom',
    note: ''
  });
  const [availableExtraItems, setAvailableExtraItems] = useState([]);
  const [newExtraItem, setNewExtraItem] = useState({ itemId: '', quantity: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load existing override if any
        const dateStr = selectedDate.toISOString().split('T')[0];
        const overrideRef = doc(db, 'overrides', `${customerId}_${dateStr}`);
        const overrideSnap = await getDoc(overrideRef);
        
        // Load available extra items from Items collection
        const itemsSnapshot = await getDocs(collection(db, 'Items'));
        const itemsList = itemsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().itemName,
          ratePerUnit: doc.data().ratePerUnit,
          ...doc.data()
        }));
        setAvailableExtraItems(itemsList);

        if (overrideSnap.exists()) {
          // If override exists, use its data
          const overrideData = overrideSnap.data();
          setDeliveryDetails({
            subscriptionItems: overrideData.subscriptionItems || [],
            extraItems: overrideData.extraItems || [],
            type: overrideData.type || 'custom',
            note: overrideData.note || ''
          });
        } else {
          // If no override, initialize with subscription items
          setDeliveryDetails(prev => ({
            ...prev,
            subscriptionItems: subscriptionItems.map(item => ({
              ...item,
              quantity: item.quantity || 0
            }))
          }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [customerId, selectedDate, subscriptionItems]);

  const handleStatusChange = async (type) => {
    try {
      let updatedDetails;
      if (type === 'delivered') {
        // Keep current subscription quantities
        updatedDetails = {
          ...deliveryDetails,
          type,
          extraItems: []
        };
      } else if (type === 'notDelivered') {
        // Set all quantities to 0
        updatedDetails = {
          ...deliveryDetails,
          type,
          subscriptionItems: deliveryDetails.subscriptionItems.map(item => ({
            ...item,
            quantity: 0
          })),
          extraItems: []
        };
      } else {
        // Custom - keep current state
        updatedDetails = {
          ...deliveryDetails,
          type: 'custom'
        };
      }
      setDeliveryDetails(updatedDetails);
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Failed to change delivery status');
    }
  };

  const handleSubscriptionItemChange = (itemId, quantity) => {
    setDeliveryDetails(prev => ({
      ...prev,
      type: 'custom', // Change to custom type when modifying quantities
      subscriptionItems: prev.subscriptionItems.map(item =>
        item.id === itemId ? { ...item, quantity: parseInt(quantity) || 0 } : item
      )
    }));
  };

  const handleAddExtraItem = () => {
    if (newExtraItem.itemId && newExtraItem.quantity > 0) {
      const item = availableExtraItems.find(i => i.id === newExtraItem.itemId);
      if (item) {
        setDeliveryDetails(prev => ({
          ...prev,
          type: 'custom', // Change to custom type when adding extra items
          extraItems: [...prev.extraItems, { 
            id: item.id,
            name: item.itemName,
            quantity: newExtraItem.quantity,
            ratePerUnit: item.ratePerUnit
          }]
        }));
        setNewExtraItem({ itemId: '', quantity: 1 });
      }
    }
  };

  const handleRemoveExtraItem = (itemId) => {
    setDeliveryDetails(prev => ({
      ...prev,
      extraItems: prev.extraItems.filter(item => item.id !== itemId)
    }));
  };

  const handleSave = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const overrideRef = doc(db, 'overrides', `${customerId}_${dateStr}`);
      await setDoc(overrideRef, {
        ...deliveryDetails,
        date: dateStr,
        customerId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      onClose();
    } catch (error) {
      console.error('Error saving delivery override:', error);
      alert('Failed to save delivery details. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Delivery Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              {/* Delivery Status */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Delivery Status</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange('delivered')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      deliveryDetails.type === 'delivered'
                        ? 'bg-green-100 text-green-800 border-2 border-green-500'
                        : 'bg-gray-100 text-gray-800 hover:bg-green-50'
                    }`}
                  >
                    ✅ Completed
                  </button>
                  <button
                    onClick={() => handleStatusChange('notDelivered')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      deliveryDetails.type === 'notDelivered'
                        ? 'bg-red-100 text-red-800 border-2 border-red-500'
                        : 'bg-gray-100 text-gray-800 hover:bg-red-50'
                    }`}
                  >
                    ❌ Cancelled
                  </button>
                  <button
                    onClick={() => handleStatusChange('custom')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      deliveryDetails.type === 'custom'
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                        : 'bg-gray-100 text-gray-800 hover:bg-blue-50'
                    }`}
                  >
                    📝 Custom
                  </button>
                </div>
              </div>

              {/* Subscription Items */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Subscription Items</h3>
                {deliveryDetails.subscriptionItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 mb-2">
                    <span className="flex-1">{item.itemName}</span>
                    <input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleSubscriptionItemChange(item.id, e.target.value)}
                      className="border rounded px-2 py-1 w-20"
                      disabled={deliveryDetails.type === 'notDelivered'}
                    />
                    <span className="w-20">₹{item.ratePerUnit}/unit</span>
                  </div>
                ))}
              </div>

              {/* Extra Items - Only show if not cancelled */}
              {deliveryDetails.type !== 'notDelivered' && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Extra Items</h3>
                  <div className="flex gap-4 mb-4">
                    <select
                      value={newExtraItem.itemId}
                      onChange={(e) => setNewExtraItem(prev => ({ ...prev, itemId: e.target.value }))}
                      className="flex-1 border rounded px-3 py-2"
                    >
                      <option value="">Select Item</option>
                      {availableExtraItems.map(item => (
                        <option key={item.id} value={item.id}>{item.itemName}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={newExtraItem.quantity}
                      onChange={(e) => setNewExtraItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      className="w-24 border rounded px-3 py-2"
                    />
                    <button
                      onClick={handleAddExtraItem}
                      className="bg-[#2D2D2D] text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                      Add
                    </button>
                  </div>
                  {deliveryDetails.extraItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 mb-2">
                      <span className="flex-1">{item.name}</span>
                      <span>{item.quantity} × ₹{item.ratePerUnit}</span>
                      <button
                        onClick={() => handleRemoveExtraItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Note */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Note</h3>
                <textarea
                  value={deliveryDetails.note}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full border rounded px-3 py-2 h-24 resize-none"
                  placeholder="Add any special instructions or notes here..."
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="bg-[#2D2D2D] text-white px-6 py-2 rounded hover:bg-gray-700"
                >
                  Save Changes
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 