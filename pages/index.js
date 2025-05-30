import Image from "next/image";
import { Geist } from "next/font/google";
import { useState } from "react";
import AddItems from "./components/addItems";
import AddCustomer from "./components/addCustomer";
import CreateDeliveryMan from "./components/createDeliveryMan";
import CreateRoute from "./components/createRoute";
import ViewRoutes from "./components/viewRoutes";
import ViewCustomers from "./components/viewCustomers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function Home() {
  const [showAddItems, setShowAddItems] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddDeliveryMan, setShowAddDeliveryMan] = useState(false);
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [showViewRoutes, setShowViewRoutes] = useState(false);
  const [showViewCustomers, setShowViewCustomers] = useState(false);

  return (
    <div
      className={`${geistSans.variable} grid place-items-center min-h-screen p-8 font-[family-name:var(--font-geist-sans)]`}
    >
      <main className="flex flex-col items-center">
        {!showAddItems && !showAddCustomer && !showAddDeliveryMan && !showCreateRoute && !showViewRoutes && !showViewCustomers ? (
          <div className="flex gap-4">
            <button
              onClick={() => setShowAddItems(true)}
              className="rounded-full transition-colors flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 text-base h-12 px-6"
            >
              Add Item
            </button>
            <button
              onClick={() => setShowAddCustomer(true)}
              className="rounded-full transition-colors flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 text-base h-12 px-6"
            >
              Add Customer
            </button>
            <button
              onClick={() => setShowAddDeliveryMan(true)}
              className="rounded-full transition-colors flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 text-base h-12 px-6"
            >
              Add Delivery Man
            </button>
            <button
              onClick={() => setShowCreateRoute(true)}
              className="rounded-full transition-colors flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 text-base h-12 px-6"
            >
              Create Route
            </button>
            <button
              onClick={() => setShowViewRoutes(true)}
              className="rounded-full transition-colors flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 text-base h-12 px-6"
            >
              View Routes
            </button>
            <button
              onClick={() => setShowViewCustomers(true)}
              className="rounded-full transition-colors flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 text-base h-12 px-6"
            >
              View Customers
            </button>
          </div>
        ) : showAddItems ? (
          <AddItems />
        ) : showAddCustomer ? (
          <AddCustomer />
        ) : showCreateRoute ? (
          <CreateRoute />
        ) : showViewRoutes ? (
          <ViewRoutes />
        ) : showViewCustomers ? (
          <ViewCustomers />
        ) : (
          <CreateDeliveryMan />
        )}
      </main>
    </div>
  );
}
