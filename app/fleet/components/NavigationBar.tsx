import React from 'react';
import { Truck, Bell, User } from 'lucide-react';
import { TabSelector } from './TabSelector';
export const NavigationBar = ({
  activeTab,
  setActiveTab
}) => {
  const menuItems = ['Home', 'Orders', 'Booking', 'Trips Board', 'Rates', 'Planning Board'];
  return <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 relative">
            <Truck className="h-12 w-12 text-blue-500 opacity-20 absolute -left-2" />
            <h1 className="text-2xl font-bold text-white relative z-10 pl-10">
              Fleet Manager Pro
            </h1>
          </div>
          <div className="flex items-center space-x-6">
            <button aria-label="Notifications" className="text-gray-400 hover:text-white transition-colors">
              <Bell className="h-6 w-6" />
            </button>
            <button aria-label="Account" className="text-gray-400 hover:text-white transition-colors">
              <User className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {menuItems.map((item, index) => <button key={index} className={`px-6 py-3 text-base font-medium rounded-lg transition-colors ${index === 0 ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}>
                {item}
              </button>)}
          </div>
          <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
    </nav>;
};