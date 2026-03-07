// app/admin/notifications/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Define the Alert interface
interface Alert {
  id: number;
  name: string;
  type: string;
  next_heat?: string;
  status?: string;
  breeding_status?: string;
}

export default function Notifications() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHeatCycles();
  }, []);

  const checkHeatCycles = async () => {
    setLoading(true);
    
    // Check for upcoming heat cycles (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const { data } = await supabase
      .from('dogs')
      .select('id, name, type, next_heat, status, breeding_status')
      .eq('type', 'female')
      .not('next_heat', 'is', null)
      .lte('next_heat', nextWeek.toISOString())
      .gte('next_heat', new Date().toISOString());

    setAlerts((data as Alert[]) || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">🔔 Breeding Alerts</h2>
        <button 
          onClick={checkHeatCycles}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
      
      {alerts.length === 0 ? (
        <div className="bg-green-50 p-4 rounded-lg text-green-700">
          <p>No upcoming heat cycles in the next 7 days.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: Alert) => (
            <div key={alert.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">{alert.name}</p>
                  <p className="text-sm text-gray-600">Female • {alert.breeding_status || 'Available'}</p>
                </div>
                <Link 
                  href={`/admin/dogs/edit/${alert.id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Details
                </Link>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-yellow-600 font-medium">🔥 Heat cycle starting:</span>
                <span className="bg-yellow-100 px-2 py-1 rounded text-sm">
                  {alert.next_heat ? new Date(alert.next_heat).toLocaleDateString() : 'TBD'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Prepare for breeding within the next 7 days
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Additional notification types can be added here */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3">Other Notifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <h4 className="font-medium mb-2">📅 Upcoming Vaccinations</h4>
            <p className="text-sm text-gray-500">Coming soon...</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h4 className="font-medium mb-2">💰 Overdue Payments</h4>
            <p className="text-sm text-gray-500">Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}