import { useState } from "react";
import AddItems from "./components/addItems";
import ViewItems from "./components/viewItems";
import AddCustomer from "./components/addCustomer";
import CreateDeliveryMan from "./components/createDeliveryMan";
import CreateRoute from "./components/createRoute";
import ViewRoutes from "./components/viewRoutes";
import ViewCustomers from "./components/viewCustomers";

export default function Home() {
  const [showAddItems, setShowAddItems] = useState(false);
  const [showViewItems, setShowViewItems] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddDeliveryMan, setShowAddDeliveryMan] = useState(false);
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [showViewRoutes, setShowViewRoutes] = useState(false);
  const [showViewCustomers, setShowViewCustomers] = useState(false);

  const handleBack = () => {
    setShowAddItems(false);
    setShowViewItems(false);
    setShowAddCustomer(false);
    setShowAddDeliveryMan(false);
    setShowCreateRoute(false);
    setShowViewRoutes(false);
    setShowViewCustomers(false);
  };

  return (
    <div className="min-h-screen border-[15px] border-gray-800 bg-[url('/images/bg.png')] bg-cover bg-center bg-fixed">
      <nav className="top-0 z-50 w-full bg-white border border-gray-800">
        <div className="mx-auto lg:max-w-[1300px] px-4 md:px-8 py-4">
          <h1 className="text-center italic text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
            Dairy Management System
          </h1>
        </div>
      </nav>

      <main className="mx-auto lg:max-w-[1300px] p-4 md:p-8">
        {!showAddItems && !showViewItems && !showAddCustomer && !showAddDeliveryMan && !showCreateRoute && !showViewRoutes && !showViewCustomers ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Add Item",
                onClick: () => setShowAddItems(true),
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              },
              {
                title: "View Items",
                onClick: () => setShowViewItems(true),
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              },
              {
                title: "Add Customer",
                onClick: () => setShowAddCustomer(true),
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              },
              {
                title: "View Customers",
                onClick: () => setShowViewCustomers(true),
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              },
              {
                title: "Add Delivery Man",
                onClick: () => setShowAddDeliveryMan(true),
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              },
              {
                title: "Create Route",
                onClick: () => setShowCreateRoute(true),
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              },
              {
                title: "View Routes",
                onClick: () => setShowViewRoutes(true),
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              }
            ].map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center rounded-xl bg-white/90 backdrop-blur-sm p-4 sm:p-6 shadow-lg border border-gray-800 hover:bg-white/10 transition-all duration-300"
              >
                <svg className="h-8 w-8 sm:h-10 sm:w-10 text-[#2D2D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
                <span className="mt-3 text-sm sm:text-base font-semibold text-gray-800">{item.title}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white/20 backdrop-blur-sm px-4 sm:px-6 md:px-10 py-6 sm:py-8 md:py-10 mt-5 shadow-lg border border-gray-800 overflow-x-auto">
            {showAddItems ? <AddItems onBack={handleBack} /> :
             showViewItems ? <ViewItems onBack={handleBack} /> :
             showAddCustomer ? <AddCustomer onBack={handleBack} /> :
             showViewCustomers ? <ViewCustomers onBack={handleBack} /> :
             showCreateRoute ? <CreateRoute onBack={handleBack} /> :
             showViewRoutes ? <ViewRoutes onBack={handleBack} /> :
             <CreateDeliveryMan onBack={handleBack} />}
          </div>
        )}
      </main>
    </div>
  );
}
