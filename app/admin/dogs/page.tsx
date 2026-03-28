"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

interface Dog {
  id: number;
  name: string;
  type: string;
  status: string;
  price?: number;
  age?: string;
  color?: string;
  images?: string[];
  featured?: boolean;
  created_at?: string;
}

export default function AdminDogsPage() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Reservation modal state
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [reservationForm, setReservationForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    deposit_amount: 100000,
    payment_method: 'transfer',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingReservation, setPendingReservation] = useState<any>(null);
  
  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastReservation, setLastReservation] = useState<any>(null);

  useEffect(() => {
    fetchDogs();
  }, [filterType, filterStatus]);

  const fetchDogs = async () => {
    setLoading(true);
    let query = supabase.from('dogs').select('*');
    if (filterType !== 'all') query = query.eq('type', filterType);
    if (filterStatus !== 'all') query = query.eq('status', filterStatus);
    
    const { data } = await query.order('created_at', { ascending: false });
    setDogs((data as Dog[]) || []);
    setLoading(false);
  };

  // Open reservation form when "Reserved" is selected
  const handleReserveClick = (dog: Dog) => {
    setSelectedDog(dog);
    setReservationForm({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      deposit_amount: 100000,
      payment_method: 'transfer',
      notes: ''
    });
    setShowReservationModal(true);
  };

  // Generate unique reservation reference
  const generateReference = () => {
    return `RES-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  // Submit reservation
  const submitReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDog) return;
    
    setSubmitting(true);
    
    const reference = generateReference();
    const totalPrice = selectedDog.price || 0;
    const depositAmount = reservationForm.deposit_amount;
    const remainingBalance = totalPrice - depositAmount;
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // 1. Insert into reservations table
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert([{
          reference: reference,
          dog_id: selectedDog.id,
          dog_name: selectedDog.name,
          customer_name: reservationForm.customer_name,
          customer_email: reservationForm.customer_email || null,
          customer_phone: reservationForm.customer_phone,
          deposit_amount: depositAmount,
          total_price: totalPrice,
          remaining_balance: remainingBalance,
          status: 'pending',
          payment_method: reservationForm.payment_method,
          payment_status: 'partial',
          reservation_date: today,
          notes: reservationForm.notes || null
        }])
        .select()
        .single();
      
      if (reservationError) throw reservationError;
      
      // 2. Update dog status to 'reserved'
      await supabase
        .from('dogs')
        .update({ status: 'reserved' })
        .eq('id', selectedDog.id);
      
      // 3. Insert deposit into sales table
      await supabase.from('sales').insert([{
        source: 'dog_reserve',
        item_type: 'dog',
        item_id: selectedDog.id,
        item_name: selectedDog.name,
        price: depositAmount,
        customer_name: reservationForm.customer_name,
        customer_phone: reservationForm.customer_phone,
        payment_status: 'partial',
        sale_date: today,
        notes: `Reservation ${reference} - Deposit for ${selectedDog.name}`
      }]);
      
      setLastReservation(reservation);
      setShowReservationModal(false);
      setShowSuccessModal(true);
      
      fetchDogs();
      
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      alert('Error creating reservation: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm reservation and complete sale
  const confirmReservationAndSell = async () => {
    if (!pendingReservation) return;
    
    setSubmitting(true);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // 1. Update reservation status to 'completed'
      await supabase
        .from('reservations')
        .update({ 
          status: 'completed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', pendingReservation.id);
      
      // 2. Update dog status to 'sold'
      await supabase
        .from('dogs')
        .update({ status: 'sold' })
        .eq('id', pendingReservation.dog_id);
      
      // 3. Insert final payment into sales table
      if (pendingReservation.remaining_balance > 0) {
        await supabase.from('sales').insert([{
          source: 'dog_sold',
          item_type: 'dog',
          item_id: pendingReservation.dog_id,
          item_name: pendingReservation.dog_name,
          price: pendingReservation.remaining_balance,
          customer_name: pendingReservation.customer_name,
          customer_phone: pendingReservation.customer_phone,
          payment_status: 'paid',
          sale_date: today,
          notes: `Reservation ${pendingReservation.reference} - Final payment for ${pendingReservation.dog_name}`
        }]);
      }
      
      alert(`✅ ${pendingReservation.dog_name} marked as SOLD. Final payment recorded.`);
      setShowConfirmModal(false);
      setPendingReservation(null);
      fetchDogs();
      
    } catch (error: any) {
      console.error('Error confirming sale:', error);
      alert('Error confirming sale: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string, dog: Dog) => {
    if (newStatus === 'reserved') {
      handleReserveClick(dog);
    } else if (newStatus === 'sold') {
      // Check if there's a pending reservation for this dog
      const { data: reservation } = await supabase
        .from('reservations')
        .select('*')
        .eq('dog_id', id)
        .eq('status', 'pending')
        .single();
      
      if (reservation) {
        setPendingReservation(reservation);
        setShowConfirmModal(true);
      } else {
        // Direct sale without reservation
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('sales').insert([{
          source: 'dog_sold',
          item_type: 'dog',
          item_id: id,
          item_name: dog.name,
          price: dog.price || 0,
          customer_name: 'Walk-in Customer',
          payment_status: 'paid',
          sale_date: today,
          notes: `Direct sale for ${dog.name}`
        }]);
        
        await supabase
          .from('dogs')
          .update({ status: 'sold' })
          .eq('id', id);
        
        alert(`✅ ${dog.name} marked as SOLD. Full payment recorded.`);
        fetchDogs();
      }
    } else {
      // Other status changes (available, retired)
      await supabase
        .from('dogs')
        .update({ status: newStatus })
        .eq('id', id);
      fetchDogs();
    }
  };

  const deleteDog = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      const { error } = await supabase.from('dogs').delete().eq('id', id);
      if (!error) {
        alert(`✅ ${name} deleted successfully.`);
        fetchDogs();
      }
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-gray-100 text-gray-800';
      case 'retired': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'puppy': return '🐕';
      case 'stud': return '👑';
      case 'female': return '🐩';
      default: return '🐕';
    }
  };

  const filteredDogs = dogs.filter((dog: Dog) => 
    dog.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dog.color?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: dogs.length,
    available: dogs.filter((d) => d.status === 'available').length,
    reserved: dogs.filter((d) => d.status === 'reserved').length,
    sold: dogs.filter((d) => d.status === 'sold').length,
    puppies: dogs.filter((d) => d.type === 'puppy').length,
    studs: dogs.filter((d) => d.type === 'stud').length,
    females: dogs.filter((d) => d.type === 'female').length
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
      <p className="animate-pulse text-xl font-semibold">Loading Kennel Records...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - same as before */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🐕 Dog Management</h1>
            <p className="text-gray-600 text-sm mt-1">Manage all dogs, reservations, and sales</p>
          </div>
          <Link 
            href="/admin/dogs/new" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:scale-105"
          >
            <span>➕</span> <span>Add New Dog</span>
          </Link>
        </div>

        {/* Stats Cards - same as before */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6 text-center">
          {[
            { label: 'Total', val: stats.total, color: 'bg-white' },
            { label: 'Available', val: stats.available, color: 'border-l-4 border-green-500 bg-white', text: 'text-green-600' },
            { label: 'Reserved', val: stats.reserved, color: 'border-l-4 border-yellow-500 bg-white', text: 'text-yellow-600' },
            { label: 'Sold', val: stats.sold, color: 'border-l-4 border-gray-500 bg-white', text: 'text-gray-600' },
            { label: '🐕 Puppies', val: stats.puppies, color: 'bg-white' },
            { label: '👑 Studs', val: stats.studs, color: 'bg-white' },
            { label: '🐩 Females', val: stats.females, color: 'bg-white' },
          ].map((s, i) => (
            <div key={i} className={`${s.color} p-3 rounded-lg shadow-sm`}>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold ${s.text || ''}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Filters - same as before */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 grid md:grid-cols-3 gap-4">
          <input 
            type="text" 
            placeholder="Search by name or color..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
          />
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)} 
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Types</option>
            <option value="puppy">🐕 Puppies</option>
            <option value="stud">👑 Studs</option>
            <option value="female">🐩 Females</option>
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)} 
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="available">✅ Available</option>
            <option value="reserved">⏳ Reserved</option>
            <option value="sold">💰 Sold</option>
            <option value="retired">👴 Retired</option>
          </select>
        </div>

        {/* Dogs Table - Updated status dropdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Dog</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Type</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Price</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Details</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDogs.map((dog) => (
                  <tr key={dog.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden relative flex-shrink-0">
                          {dog.images?.[0] ? (
                            <Image src={dog.images[0]} alt={dog.name} fill className="object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full text-lg">
                              {getTypeIcon(dog.type)}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">{dog.name}</span>
                        {dog.featured && <span className="text-yellow-500 text-xs">⭐</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="capitalize text-gray-700">{dog.type}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor(dog.status)}`}>
                        {dog.status}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      {dog.price ? `₦${dog.price.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {dog.color && <span className="mr-2">🎨 {dog.color}</span>}
                      {dog.age && <span>📅 {dog.age}</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <select 
                          value={dog.status} 
                          onChange={(e) => updateStatus(dog.id, e.target.value, dog)}
                          className="text-xs border rounded-lg p-1.5 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="available">✅ Available</option>
                          <option value="reserved">⏳ Reserved</option>
                          <option value="sold">💰 Sold</option>
                          <option value="retired">👴 Retired</option>
                        </select>
                        <div className="flex gap-3 text-xs">
                          <Link href={`/admin/dogs/edit/${dog.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                            Edit
                          </Link>
                          <button 
                            onClick={() => deleteDog(dog.id, dog.name)} 
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredDogs.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">No dogs found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Reservation Modal */}
      {showReservationModal && selectedDog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Reserve {selectedDog.name}</h2>
              <p className="text-gray-600 mb-4">Complete the reservation details below</p>
              
              <form onSubmit={submitReservation} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Dog Price</label>
                  <input
                    type="text"
                    readOnly
                    value={`₦${(selectedDog.price || 0).toLocaleString()}`}
                    className="w-full p-2 border rounded bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={reservationForm.customer_name}
                    onChange={(e) => setReservationForm({...reservationForm, customer_name: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={reservationForm.customer_phone}
                    onChange={(e) => setReservationForm({...reservationForm, customer_phone: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={reservationForm.customer_email}
                    onChange={(e) => setReservationForm({...reservationForm, customer_email: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Deposit Amount (₦)</label>
                  <input
                    type="number"
                    required
                    value={reservationForm.deposit_amount}
                    onChange={(e) => setReservationForm({...reservationForm, deposit_amount: Number(e.target.value)})}
                    className="w-full p-2 border rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: ₦100,000</p>
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Payment Method</label>
                  <select
                    value={reservationForm.payment_method}
                    onChange={(e) => setReservationForm({...reservationForm, payment_method: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="pos">POS</option>
                  </select>
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={reservationForm.notes}
                    onChange={(e) => setReservationForm({...reservationForm, notes: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Any special notes..."
                  />
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Summary:</p>
                  <p className="text-sm">Total Price: ₦{(selectedDog.price || 0).toLocaleString()}</p>
                  <p className="text-sm">Deposit: ₦{reservationForm.deposit_amount.toLocaleString()}</p>
                  <p className="text-sm font-bold">Remaining: ₦{((selectedDog.price || 0) - reservationForm.deposit_amount).toLocaleString()}</p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-yellow-500 text-black py-2 rounded-lg font-bold hover:bg-yellow-400 disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Reservation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReservationModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && lastReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Reservation Created!</h2>
              <p className="text-gray-600 mb-4">Reservation details have been saved.</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm font-mono font-bold">{lastReservation.reference}</p>
                <p className="text-sm mt-2">Dog: {lastReservation.dog_name}</p>
                <p className="text-sm">Customer: {lastReservation.customer_name}</p>
                <p className="text-sm">Deposit: ₦{lastReservation.deposit_amount.toLocaleString()}</p>
                <p className="text-sm font-bold">Remaining: ₦{lastReservation.remaining_balance.toLocaleString()}</p>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                When the customer pays the remaining balance, go to <strong>Reservations</strong> page to mark as sold.
              </p>
              
              <div className="flex gap-3">
                <Link
                  href="/admin/reservations"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700"
                >
                  View Reservations
                </Link>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Sale Modal */}
      {showConfirmModal && pendingReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Confirm Sale</h2>
              <p className="text-gray-600 mb-4">Complete the sale for this reservation</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="font-medium">Reservation: {pendingReservation.reference}</p>
                <p className="text-sm mt-2">Dog: {pendingReservation.dog_name}</p>
                <p className="text-sm">Customer: {pendingReservation.customer_name}</p>
                <p className="text-sm">Phone: {pendingReservation.customer_phone}</p>
                <p className="text-sm">Deposit Paid: ₦{pendingReservation.deposit_amount.toLocaleString()}</p>
                <p className="text-sm font-bold text-green-600">
                  Remaining Balance: ₦{pendingReservation.remaining_balance.toLocaleString()}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={confirmReservationAndSell}
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Confirm Sale & Record Payment'}
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}