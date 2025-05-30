import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function ViewRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoute, setEditingRoute] = useState(null);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const deliverySnapshot = await getDocs(collection(db, 'Delivery'));
        const deliveryData = [];
        
        // Get all delivery men with routes
        for (const doc of deliverySnapshot.docs) {
          const data = doc.data();
          if (data.morningRoute || data.eveningRoute) {
            // Only include if they have at least one route
            deliveryData.push({
              id: doc.id,
              ...data
            });
          }
        }

        // Get customer details for each route
        const customersSnapshot = await getDocs(collection(db, 'Customers'));
        const customersMap = {};
        const allCustomers = [];
        customersSnapshot.docs.forEach(doc => {
          customersMap[doc.id] = doc.data().customerName;
          allCustomers.push({
            id: doc.id,
            name: doc.data().customerName
          });
        });

        setAvailableCustomers(allCustomers);

        // Add customer names to routes
        const routesWithCustomers = deliveryData.map(delivery => ({
          ...delivery,
          morningCustomers: delivery.morningRoute?.map(customerId => ({
            id: customerId,
            name: customersMap[customerId]
          })) || [],
          eveningCustomers: delivery.eveningRoute?.map(customerId => ({
            id: customerId,
            name: customersMap[customerId]
          })) || []
        }));

        setRoutes(routesWithCustomers);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching routes: ", error);
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  const handleEditRoute = (route) => {
    setEditingRoute(route);
  };

  const handleDeleteRoute = async (routeId) => {
    try {
      await updateDoc(doc(db, 'Delivery', routeId), {
        morningRoute: [],
        eveningRoute: []
      });
      setRoutes(prevRoutes => prevRoutes.filter(route => route.id !== routeId));
    } catch (error) {
      console.error("Error deleting route:", error);
      alert("Failed to delete route. Please try again.");
    }
  };

  const handleAddCustomer = (routeId, timeOfDay, customerId) => {
    setRoutes(prevRoutes => {
      return prevRoutes.map(route => {
        if (route.id === routeId) {
          const customerToAdd = availableCustomers.find(c => c.id === customerId);
          const updatedRoute = { ...route };
          if (timeOfDay === 'morning') {
            updatedRoute.morningCustomers = [...route.morningCustomers, customerToAdd];
          } else {
            updatedRoute.eveningCustomers = [...route.eveningCustomers, customerToAdd];
          }
          return updatedRoute;
        }
        return route;
      });
    });
  };

  const handleRemoveCustomer = (routeId, timeOfDay, customerId) => {
    setRoutes(prevRoutes => {
      return prevRoutes.map(route => {
        if (route.id === routeId) {
          const updatedRoute = { ...route };
          if (timeOfDay === 'morning') {
            updatedRoute.morningCustomers = route.morningCustomers.filter(c => c.id !== customerId);
          } else {
            updatedRoute.eveningCustomers = route.eveningCustomers.filter(c => c.id !== customerId);
          }
          return updatedRoute;
        }
        return route;
      });
    });
  };

  const handleSaveRoute = async (route) => {
    setSaving(true);
    try {
      const morningRoute = route.morningCustomers.map(c => c.id);
      const eveningRoute = route.eveningCustomers.map(c => c.id);
      
      await updateDoc(doc(db, 'Delivery', route.id), {
        morningRoute,
        eveningRoute
      });
      
      setEditingRoute(null);
    } catch (error) {
      console.error("Error saving route:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading routes...</div>;
  }

  if (routes.length === 0) {
    return <div className="text-center mt-8">No routes found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <h2 className="text-2xl font-bold mb-6">Delivery Routes</h2>
      <div className="space-y-6">
        {routes.map((route) => (
          <div key={route.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{route.deliveryManName}</h3>
              <div className="flex gap-2">
                {editingRoute?.id === route.id ? (
                  <button
                    onClick={() => handleSaveRoute(route)}
                    disabled={saving}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleEditRoute(route)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Edit Route
                  </button>
                )}
                <button
                  onClick={() => handleDeleteRoute(route.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete Route
                </button>
              </div>
            </div>
            
            {route.morningCustomers.length > 0 && (
              <div className="mb-4">
                <h4 className="text-lg font-medium text-blue-600 mb-2">Morning Route</h4>
                <ul className="list-disc list-inside space-y-1">
                  {route.morningCustomers.map((customer, index) => (
                    <li key={`morning-${index}`} className="flex items-center justify-between">
                      <span className="text-gray-700">{customer.name}</span>
                      {editingRoute?.id === route.id && (
                        <button
                          onClick={() => handleRemoveCustomer(route.id, 'morning', customer.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {editingRoute?.id === route.id && (
                  <select
                    onChange={(e) => handleAddCustomer(route.id, 'morning', e.target.value)}
                    className="mt-2 p-2 border rounded"
                  >
                    <option value="">Add customer to morning route...</option>
                    {availableCustomers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
            
            {route.eveningCustomers.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-blue-600 mb-2">Evening Route</h4>
                <ul className="list-disc list-inside space-y-1">
                  {route.eveningCustomers.map((customer, index) => (
                    <li key={`evening-${index}`} className="flex items-center justify-between">
                      <span className="text-gray-700">{customer.name}</span>
                      {editingRoute?.id === route.id && (
                        <button
                          onClick={() => handleRemoveCustomer(route.id, 'evening', customer.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {editingRoute?.id === route.id && (
                  <select
                    onChange={(e) => handleAddCustomer(route.id, 'evening', e.target.value)}
                    className="mt-2 p-2 border rounded"
                  >
                    <option value="">Add customer to evening route...</option>
                    {availableCustomers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
