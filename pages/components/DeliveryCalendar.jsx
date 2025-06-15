import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy, startAt, endAt } from 'firebase/firestore';
import { saveOverride } from '../../utils/firebaseHelpers';

export default function DeliveryCalendar({ 
  customerId, 
  selectedMonth, 
  selectedYear,
  onDayClick 
}) {
  const [deliveryOverrides, setDeliveryOverrides] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeliveryOverrides = async () => {
      try {
        setLoading(true);
        
        // Format month with leading zero if needed
        const monthStr = selectedMonth.toString().padStart(2, '0');
        // Create the prefix for the current month
        //const prefixStart = `${customerId}_${selectedYear}-${monthStr}`;
        const prefixStart = `${customerId}_${selectedYear}-${monthStr}-01`;
        // Create the prefix for the next month (for range end)
        const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
        const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
        //const prefixEnd = `${customerId}_${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
        const prefixEnd = `${customerId}_${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

        // Query for documents where ID starts with the prefix
        const q = query(
          collection(db, 'overrides'),
          orderBy('__name__'),
          startAt(prefixStart),
          endAt(prefixEnd)
        );

        const querySnapshot = await getDocs(q);
        const overrides = {};
        
        querySnapshot.forEach((doc) => {
          // Extract date from document ID (format: customerId_YYYY-MM-DD)
          const date = doc.id.split('_')[1];
          const data = doc.data();
          overrides[date] = {
            ...data,
            id: doc.id,
            date
          };
        });

        setDeliveryOverrides(overrides);
      } catch (error) {
        console.error('Error loading delivery overrides:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDeliveryOverrides();
  }, [customerId, selectedMonth, selectedYear]);

  const handleOverride = async (date, type) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      await saveOverride(customerId, dateStr, type);
      
      // Refresh the calendar data
      const updatedOverrides = { ...deliveryOverrides };
      updatedOverrides[dateStr] = {
        type,
        date: dateStr,
        customerId,
        id: `${customerId}_${dateStr}`
      };
      setDeliveryOverrides(updatedOverrides);
    } catch (error) {
      console.error('Error saving override:', error);
      alert('Failed to save delivery status. Please try again.');
    }
  };

  const getOverrideColor = (override) => {
    if (!override) return 'bg-white';
    switch (override.type) {
      case 'delivered':
        return 'bg-green-50';
      case 'notDelivered':
        return 'bg-red-50';
      case 'custom':
        return 'bg-blue-50';
      default:
        return 'bg-white';
    }
  };

  const getStatusText = (override) => {
    if (!override) return null;
    switch (override.type) {
      case 'delivered':
        return '✅';
      case 'notDelivered':
        return '❌';
      case 'custom':
        return '📝';
      default:
        return null;
    }
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-28 border border-gray-200"></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const override = deliveryOverrides[dateStr];
      const statusText = getStatusText(override);

      days.push(
        <div
          key={day}
          className={`h-28 border border-gray-200 p-2 relative transition-colors duration-200 ${getOverrideColor(override)}`}
        >
          <div className="flex flex-col h-full">
            {/* Date and status */}
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center">
                <span className="font-medium">{day}</span>
                {override && (
                  <span className={`ml-1 w-2 h-2 rounded-full ${
                    override.type === 'delivered' ? 'bg-green-500' :
                    override.type === 'notDelivered' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                )}
              </div>
              {statusText && (
                <span className="text-sm">{statusText}</span>
              )}
            </div>
            
            {/* Extra items indicator */}
            {override?.type === 'custom' && override.extraItems?.length > 0 && (
              <div className="text-xs text-blue-600 mb-1">
                +{override.extraItems.length} extra
              </div>
            )}
            
            {/* Action buttons */}
            <div className="mt-auto flex flex-wrap gap-1">
              {!override ? (
                <>
                  <button
                    onClick={() => handleOverride(date, 'delivered')}
                    className="text-xs px-2 py-1 bg-green-100 hover:bg-green-200 rounded-md transition-colors duration-200"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => handleOverride(date, 'notDelivered')}
                    className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 rounded-md transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </>
              ) : null}
              <button
                onClick={() => onDayClick(date)}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200 inline-flex items-center"
                title={override ? "Edit delivery status" : "Add delivery details"}
              >
                <span className="mr-1">✏️</span>
                {!override ? 'Edit' : ''}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="h-8 flex items-center justify-center font-medium text-gray-500">
          {day}
        </div>
      ))}
      {renderCalendar()}
    </div>
  );
} 