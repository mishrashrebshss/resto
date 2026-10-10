import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { 
  Restaurant, Subscription, Order, ActivityLog 
} from '../types';
import { useToast } from '../components/Toast';
import { 
  LayoutDashboard, Store, ShoppingBag, CreditCard, CalendarCheck, 
  Layers, BarChart3, History, Settings, LogOut, Plus, Search, 
  ExternalLink, Eye, EyeOff, ShieldAlert, AlertTriangle, 
  TrendingUp, ArrowUpRight, Copy, Check, Filter, RefreshCw,
  KeyRound, Lock, X, Database, Timer, Ban, CheckCircle2, Calendar,
  Download, Upload, Cloud, CloudOff, FileJson, ArrowDownCircle, ArrowUpCircle
} from 'lucide-react';
import { isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'restaurants' | 'subscriptions' | 'orders' | 'logs' | 'settings'>('dashboard');
  const [metrics, setMetrics] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<(Restaurant & { subscription: Subscription | null; owner: any })[]>([]);
  const [subscriptions, setSubscriptions] = useState<(Subscription & { restaurant_name: string })[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create Restaurant Multi-step Form Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [createdResult, setCreatedResult] = useState<{ restaurant: Restaurant; owner: any } | null>(null);

  // Super Admin Change Password State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminCurrPass, setAdminCurrPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);
  const [showPassText, setShowPassText] = useState(false);

  // Supabase Database & Cloud Sync State
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [supabaseDetails, setSupabaseDetails] = useState<any>(null);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [restoringCloud, setRestoringCloud] = useState(false);
  const [importingBackup, setImportingBackup] = useState(false);

  // Master Admin Ban & Subscription Timer States
  const [selectedRestForTimer, setSelectedRestForTimer] = useState<any | null>(null);
  const [timerDuration, setTimerDuration] = useState<number>(30);
  const [timerUnit, setTimerUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('');
  const [updatingTimer, setUpdatingTimer] = useState(false);

  const [selectedRestForBan, setSelectedRestForBan] = useState<any | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('Service suspended by Master Admin');
  const [updatingBan, setUpdatingBan] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
    cover_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    description: '',
    opening_time: '10:00 AM',
    closing_time: '11:00 PM',
    cuisine_type: 'Italian Bistro & Cafe',
    owner_name: '',
    owner_email: '',
    owner_username: '',
    owner_password: '',
    confirm_password: '',
    status: 'active',
    plan: 'growth'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [m, r, s, l, sb] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminRestaurants(),
        api.getAdminSubscriptions(),
        api.getAdminLogs(),
        api.getSupabaseStatus().catch(() => null)
      ]);
      setMetrics(m);
      setRestaurants(r);
      setSubscriptions(s);
      setActivityLogs(l);
      if (sb) setSupabaseDetails(sb);

      // Emergency browser cache
      if (r && r.length > 0) {
        try {
          localStorage.setItem('restoqr_admin_restaurants_cache', JSON.stringify(r));
        } catch (e) {}
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseStatus(null);
    try {
      const res = await api.getSupabaseStatus();
      setSupabaseDetails(res);
      setSupabaseStatus(res.message);
      showToast(res.message, res.allReady ? 'success' : 'info');
    } catch (e: any) {
      setSupabaseStatus(e.message || 'Check failed');
      showToast(e.message || 'Check failed', 'error');
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleSyncToCloud = async () => {
    setSyncingCloud(true);
    try {
      const res = await api.syncSupabase();
      showToast(res.message || 'Data successfully synced to Supabase!', 'success');
      const updated = await api.getSupabaseStatus();
      setSupabaseDetails(updated);
    } catch (e: any) {
      showToast(e.message || 'Cloud sync failed. Make sure tables are created.', 'error');
    } finally {
      setSyncingCloud(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!confirm('Supabase Cloud se saara data restore karein?')) return;
    setRestoringCloud(true);
    try {
      const res = await api.restoreSupabase();
      showToast(res.message || 'Restored from Supabase Cloud!', 'success');
      await loadData();
    } catch (e: any) {
      showToast(e.message || 'Restore failed', 'error');
    } finally {
      setRestoringCloud(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const token = localStorage.getItem('restoqr_token');
      window.open('/api/admin/backup/export?token=' + encodeURIComponent(token || ''), '_blank');
      showToast('Downloading complete database JSON backup...', 'info');
    } catch (e) {
      showToast('Export failed', 'error');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setImportingBackup(true);
        const json = JSON.parse(event.target?.result as string);
        const res = await api.importBackup(json);
        showToast(res.message, 'success');
        await loadData();
      } catch (err: any) {
        showToast(err.message || 'Invalid JSON backup file', 'error');
      } finally {
        setImportingBackup(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleToggleStatus = async (restaurantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.updateRestaurantStatus(restaurantId, newStatus);
      showToast(`Restaurant ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleApplyTimer = async () => {
    if (!selectedRestForTimer) return;
    try {
      setUpdatingTimer(true);
      let calculatedDays = timerDuration;
      if (customExpiryDate) {
        const diffMs = new Date(customExpiryDate).getTime() - Date.now();
        calculatedDays = Math.max(1, Math.ceil(diffMs / (1000 * 3600 * 24)));
      } else {
        if (timerUnit === 'weeks') calculatedDays = timerDuration * 7;
        else if (timerUnit === 'months') calculatedDays = timerDuration * 30;
      }

      await api.updateRestaurantStatus(selectedRestForTimer.id, {
        duration_days: calculatedDays,
        status: 'active'
      });
      showToast(`Timer set! ${selectedRestForTimer.name} is active for ${calculatedDays} days.`, 'success');
      setSelectedRestForTimer(null);
      setCustomExpiryDate('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update validity timer', 'error');
    } finally {
      setUpdatingTimer(false);
    }
  };

  const handleConfirmBan = async () => {
    if (!selectedRestForBan) return;
    try {
      setUpdatingBan(true);
      await api.updateRestaurantStatus(selectedRestForBan.id, {
        status: 'suspended',
        ban_reason: banReasonInput.trim() || 'Service suspended by Master Admin'
      });
      showToast(`Service for ${selectedRestForBan.name} has been BANNED.`, 'info');
      setSelectedRestForBan(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to ban service', 'error');
    } finally {
      setUpdatingBan(false);
    }
  };

  const handleUnbanService = async (restaurantId: string, restaurantName: string) => {
    try {
      await api.updateRestaurantStatus(restaurantId, {
        status: 'active'
      });
      showToast(`Service for ${restaurantName} has been RESTORED (Active).`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to restore service', 'error');
    }
  };

  const handleUpdatePaymentStatus = async (subId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    try {
      await api.updateSubscription(subId, { payment_status: newStatus });
      showToast(`Subscription marked as ${newStatus.toUpperCase()}`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update subscription', 'error');
    }
  };

  const handleCreateRestaurant = async () => {
    if (formData.owner_password !== formData.confirm_password) {
      showToast('Passwords do not match', 'error');
      return;
    }
    try {
      const res = await api.createRestaurant(formData);
      setCreatedResult(res);
      setCreateStep(5);
      showToast('Restaurant created successfully!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create restaurant', 'error');
    }
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdminChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCurrPass || !adminNewPass) {
      showToast('Please fill in both current and new password', 'error');
      return;
    }
    if (adminNewPass.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }
    if (adminNewPass !== adminConfirmPass) {
      showToast('New password and confirm password do not match', 'error');
      return;
    }
    try {
      setUpdatingPass(true);
      await api.changePassword({ current_password: adminCurrPass, new_password: adminNewPass });
      showToast('Super Admin password updated successfully!', 'success');
      setShowPasswordModal(false);
      setAdminCurrPass('');
      setAdminNewPass('');
      setAdminConfirmPass('');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password. Verify your current password.', 'error');
    } finally {
      setUpdatingPass(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center font-black text-white shadow-lg shadow-orange-500/20">
              R
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white">RestoQR</div>
              <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Super Admin</div>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'dashboard' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('restaurants')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'restaurants' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Restaurants</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {restaurants.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'subscriptions' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Subscriptions</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'orders' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Platform Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'logs' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Activity Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'settings' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Admin Settings</span>
          </button>
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
              SA
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/40 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search restaurants, owners, cities..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Change Password"
            >
              <KeyRound className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Change Password</span>
            </button>

            <button
              onClick={() => {
                setShowCreateModal(true);
                setCreateStep(1);
                setCreatedResult(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE RESTAURANT</span>
            </button>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="p-6 md:p-8 space-y-8 flex-1">
          {activeTab === 'dashboard' && (
            <>
              {/* TOP BANNER: CLOUD STORAGE ACTION REQUIRED */}
              {supabaseDetails?.configured && !supabaseDetails?.allReady && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>Supabase Cloud Database Setup Pending</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">Action Needed</span>
                      </div>
                      <p className="text-xs text-amber-200/80 mt-0.5">
                        Restaurants aur menus ko permanent save rakhne ke liye Supabase me 1-click SQL schema run karein.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Setup Cloud Database Now</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Dashboard Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Restaurants</div>
                  <div className="text-3xl font-black text-white mt-2">{metrics?.totalRestaurants ?? 0}</div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                    <span className="font-semibold">{metrics?.activeRestaurants ?? 0} Active</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-rose-400">{metrics?.suspendedRestaurants ?? 0} Suspended</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Orders</div>
                  <div className="text-3xl font-black text-orange-400 mt-2">{metrics?.todayOrdersCount ?? 0}</div>
                  <div className="text-xs text-slate-400 mt-2">Across all active tenant cafes</div>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Revenue</div>
                  <div className="text-3xl font-black text-emerald-400 mt-2">₹{(metrics?.todayRevenue ?? 0).toLocaleString()}</div>
                  <div className="text-xs text-slate-400 mt-2">Paid customer orders</div>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Payments</div>
                  <div className="text-3xl font-black text-amber-400 mt-2">{metrics?.pendingPayments ?? 0}</div>
                  <div className="text-xs text-slate-400 mt-2">Awaiting subscription confirmation</div>
                </div>
              </div>

              {/* 7-Day Chart Simulation */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-white">Platform Activity & Revenue Trend</h3>
                    <p className="text-xs text-slate-400">Daily revenue and order volume for the past 7 days</p>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-medium">Last 7 Days</span>
                </div>

                <div className="grid grid-cols-7 gap-3 h-44 items-end pt-4 border-b border-slate-800">
                  {metrics?.dailyChart?.map((day: any) => {
                    const maxRev = Math.max(...metrics.dailyChart.map((d: any) => d.revenue), 1000);
                    const heightPercent = Math.max(15, Math.min(100, Math.round((day.revenue / maxRev) * 100)));
                    return (
                      <div key={day.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="text-[11px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition">
                          ₹{day.revenue}
                        </div>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[42px] bg-gradient-to-t from-orange-500 to-amber-400 rounded-t-lg transition-all group-hover:brightness-125"
                        />
                        <div className="text-[10px] text-slate-400 font-mono">
                          {day.date.split('-').slice(1).join('/')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Two Column Grid: Recent Restaurants & Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Restaurants */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base text-white">Recent Restaurants</h3>
                    <button
                      onClick={() => setActiveTab('restaurants')}
                      className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
                    >
                      View All ({restaurants.length})
                    </button>
                  </div>
                  <div className="divide-y divide-slate-800/60">
                    {metrics?.recentRestaurants?.map((r: Restaurant) => (
                      <div key={r.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={r.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100'}
                            alt={r.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-800"
                          />
                          <div>
                            <div className="text-sm font-bold text-white">{r.name}</div>
                            <div className="text-xs text-slate-400">{r.city} • {r.cuisine_type}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            r.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {r.status}
                          </span>
                          <a
                            href={`/menu/${r.slug}/table/1`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base text-white">Recent Customer Orders</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
                    >
                      View All
                    </button>
                  </div>
                  <div className="divide-y divide-slate-800/60">
                    {metrics?.recentOrders?.map((o: Order) => (
                      <div key={o.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">Order #{o.order_number}</span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                              Table {o.table_number}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {o.items?.length || 1} items • {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm text-emerald-400">₹{o.total}</div>
                          <span className={`text-[10px] font-bold uppercase ${
                            o.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {o.payment_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'restaurants' && (
            <div className="space-y-6">
              {/* Header with filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Registered Restaurants</h2>
                  <p className="text-xs text-slate-400">Manage all tenant restaurants, accounts, and live menus</p>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="suspended">Suspended Only</option>
                    <option value="pending">Pending Only</option>
                  </select>
                </div>
              </div>

              {/* Restaurants Table */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/60 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Restaurant</th>
                      <th className="px-6 py-4">Owner / Contact</th>
                      <th className="px-6 py-4">Plan</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Subscription</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredRestaurants.map(r => (
                      <tr key={r.id} className="hover:bg-slate-900/30 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={r.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100'}
                              alt={r.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-800"
                            />
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                <span>{r.name}</span>
                                <span className="text-[10px] font-mono text-slate-500">/{r.slug}</span>
                              </div>
                              <div className="text-xs text-slate-400">{r.address}, {r.city}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-200">{r.owner?.name || 'Owner'}</div>
                          <div className="text-xs text-slate-400">{r.owner?.email || r.email}</div>
                          <div className="text-xs text-slate-500 font-mono">{r.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="uppercase text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                            {r.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                            r.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : r.status === 'suspended'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {r.subscription ? (
                            <div>
                              <div className="text-xs font-bold text-slate-300">
                                {r.subscription.payment_status === 'paid' ? 'Paid' : 'Awaiting Payment'}
                              </div>
                              <div className="text-[11px] text-slate-500">Exp: {r.subscription.expiry_date}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">No plan</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/menu/${r.slug}/table/1`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1"
                              title="Open Customer Menu"
                            >
                              <span>Menu</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            <button
                              onClick={() => handleToggleStatus(r.id, r.status)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                r.status === 'active'
                                  ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                              }`}
                            >
                              {r.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Subscription Plans & Billing Control</h2>
                <p className="text-xs text-slate-400">Authorize payments, renew plans, extend trial or suspend accounts</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptions.map(sub => (
                  <div key={sub.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="uppercase text-xs font-extrabold px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          {sub.plan} Plan
                        </span>
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                          sub.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {sub.payment_status}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg text-white">{sub.restaurant_name}</h3>
                      <div className="text-2xl font-black text-emerald-400 mt-2">₹{sub.price}</div>
                      
                      <div className="mt-4 space-y-2 text-xs text-slate-400 border-t border-slate-800 pt-3">
                        <div className="flex justify-between">
                          <span>Start Date:</span>
                          <span className="font-mono text-slate-300">{sub.start_date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expiry Date:</span>
                          <span className="font-mono text-slate-300">{sub.expiry_date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Method:</span>
                          <span className="text-slate-300">{sub.payment_method}</span>
                        </div>
                        {sub.notes && (
                          <div className="text-[11px] text-slate-500 italic mt-1">Note: {sub.notes}</div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2">
                      <button
                        onClick={() => handleUpdatePaymentStatus(sub.id, sub.payment_status)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
                          sub.payment_status === 'paid'
                            ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        }`}
                      >
                        {sub.payment_status === 'paid' ? 'Mark Awaiting Payment' : 'Confirm Payment (PAID)'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Platform-wide Customer Orders</h2>
                <p className="text-xs text-slate-400">Live stream of dining orders placed across restaurants</p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/60 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Order #</th>
                      <th className="px-6 py-4">Table</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Items Snapshot</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">Payment</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {metrics?.recentOrders?.map((o: Order) => (
                      <tr key={o.id} className="hover:bg-slate-900/30 transition">
                        <td className="px-6 py-4 font-mono font-bold text-white">#{o.order_number}</td>
                        <td className="px-6 py-4 font-bold text-orange-400">Table {o.table_number}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-200">{o.customer_name || 'Guest'}</div>
                          <div className="text-xs text-slate-400">{o.customer_phone || 'No phone'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs space-y-0.5">
                            {o.items?.map((it, idx) => (
                              <div key={idx} className="text-slate-300">
                                {it.quantity} × {it.item_name_snapshot}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-black text-emerald-400">₹{o.total}</td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-slate-200 uppercase">{o.payment_method}</div>
                          <div className={`text-[10px] font-bold uppercase ${
                            o.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {o.payment_status}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-orange-400 border border-slate-700">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">System Audit & Activity Logs</h2>
                <p className="text-xs text-slate-400">Traceability of all admin and restaurant events</p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 shadow-sm divide-y divide-slate-800/60">
                {activityLogs.map(log => (
                  <div key={log.id} className="py-3.5 flex items-start gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-2 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold font-mono text-orange-400 uppercase tracking-wider">{log.action}</span>
                        <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-slate-200 mt-1">{log.details}</div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">By: {log.user_email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADMIN SETTINGS & SECURITY TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl animate-in fade-in">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  <Settings className="w-7 h-7 text-orange-400" />
                  <span>Admin Settings & Security</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Manage platform administrator account credentials, security access, and system configurations.
                </p>
              </div>

              {/* Admin Profile & Role Summary Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-orange-500/25">
                    SA
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-white">{user?.name || 'Platform Super Admin'}</h3>
                      <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Super Administrator
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Full Root Privileges & Multi-Tenant Management</p>
                  </div>
                </div>
              </div>

              {/* CHANGE ADMIN PASSWORD CARD */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-orange-400" />
                    <h3 className="font-bold text-sm text-white">Change Super Admin Password</h3>
                  </div>
                  <span className="text-[10px] text-slate-400">Requires current password confirmation</span>
                </div>

                <form onSubmit={handleAdminChangePassword} className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Current Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassText ? 'text' : 'password'}
                        value={adminCurrPass}
                        onChange={e => setAdminCurrPass(e.target.value)}
                        placeholder="Enter current password"
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassText(!showPassText)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showPassText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        New Password * (Min 6 chars)
                      </label>
                      <input
                        type={showPassText ? 'text' : 'password'}
                        value={adminNewPass}
                        onChange={e => setAdminNewPass(e.target.value)}
                        placeholder="Enter new password"
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Confirm New Password *
                      </label>
                      <input
                        type={showPassText ? 'text' : 'password'}
                        value={adminConfirmPass}
                        onChange={e => setAdminConfirmPass(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={updatingPass || !adminCurrPass || !adminNewPass}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{updatingPass ? 'Updating Password...' : 'UPDATE ADMIN PASSWORD'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* SUPABASE POSTGRESQL & CLOUD PERSISTENCE HUB */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                      supabaseDetails?.allReady
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-white">Supabase Cloud Database (PostgreSQL)</h3>
                        <span className={`text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          supabaseDetails?.allReady
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        }`}>
                          {supabaseDetails?.allReady ? '🟢 100% Synced & Permanent' : '⚠️ SQL Setup Required'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Project URL: <span className="font-mono text-slate-300">{supabaseDetails?.projectUrl || 'https://zrqshdpeofqrcinhqjnm.supabase.co'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestSupabase}
                      disabled={testingSupabase}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin text-orange-400' : 'text-slate-400'}`} />
                      <span>{testingSupabase ? 'Checking...' : 'Check Status'}</span>
                    </button>

                    <a
                      href="https://supabase.com/dashboard/project/zrqshdpeofqrcinhqjnm/sql/new"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                      <span>Open Supabase SQL Editor</span>
                    </a>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/supabase/schema');
                          const text = await res.text();
                          await navigator.clipboard.writeText(text);
                          setCopiedSql(true);
                          showToast('Supabase SQL Schema copied! Paste it into Supabase SQL Editor and click RUN.', 'success');
                          setTimeout(() => setCopiedSql(false), 3000);
                        } catch {
                          showToast('Copied schema definition', 'success');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                    >
                      {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedSql ? 'Copied Full SQL!' : 'Copy SQL Schema'}</span>
                    </button>
                  </div>
                </div>

                {/* HINDI & ENGLISH SETUP GUIDE BANNER (IF TABLES NOT READY) */}
                {!supabaseDetails?.allReady && (
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-amber-300">
                          Data Permanent Save Rakhne Ke Liye: Supabase me SQL Run Karein
                        </h4>
                        <p className="text-xs text-amber-200/90 leading-relaxed">
                          Aapki Supabase API connect hai, par Supabase database me tables abhi create nahi hui hain.
                          Jab tak ye tables create nahi hongi, data cloud me save nahi ho sakega.
                          Sirf <strong>1 baar 30 second</strong> ka ye process karein:
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-1.5">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-black text-xs flex items-center justify-center">1</span>
                          <span>SQL Copy Karein</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Upar diye gaye <strong>"Copy SQL Schema"</strong> button par click karein.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-1.5">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-black text-xs flex items-center justify-center">2</span>
                          <span>Supabase me Paste & RUN</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          <strong>"Open Supabase SQL Editor"</strong> dabayein, new query me paste karein aur green <strong>RUN</strong> button dabayein.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-1.5">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-black text-xs flex items-center justify-center">3</span>
                          <span>Verify & Sync</span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await handleTestSupabase();
                            await handleSyncToCloud();
                          }}
                          disabled={syncingCloud || testingSupabase}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className={`w-3 h-3 ${syncingCloud ? 'animate-spin' : ''}`} />
                          <span>{syncingCloud ? 'Syncing...' : 'Verify & Sync Now'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUCCESS BANNER IF CONNECTED */}
                {supabaseDetails?.allReady && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-white">Supabase Cloud Database Fully Synced!</div>
                        <div className="text-[11px] text-emerald-300/80">
                          All {restaurants.length} restaurants, menus, categories, and orders are permanently saved to Supabase cloud.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSyncToCloud}
                        disabled={syncingCloud}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <ArrowUpCircle className={`w-3.5 h-3.5 ${syncingCloud ? 'animate-spin' : ''}`} />
                        <span>{syncingCloud ? 'Pushing...' : 'Push to Cloud'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRestoreFromCloud}
                        disabled={restoringCloud}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowDownCircle className={`w-3.5 h-3.5 ${restoringCloud ? 'animate-spin text-orange-400' : ''}`} />
                        <span>{restoringCloud ? 'Restoring...' : 'Restore from Cloud'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TABLES HEALTH GRID */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-orange-400" />
                    <span>Supabase PostgreSQL Tables Health</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 text-xs">
                    {[
                      { name: 'restaurants', label: 'Restaurants' },
                      { name: 'menu_items', label: 'Menu Items' },
                      { name: 'categories', label: 'Categories' },
                      { name: 'tables', label: 'Tables' },
                      { name: 'orders', label: 'Orders' },
                      { name: 'coupons', label: 'Coupons' },
                      { name: 'customers', label: 'Customers' },
                      { name: 'profiles', label: 'User Profiles' },
                      { name: 'service_requests', label: 'Service Alerts' },
                      { name: 'restoqr_cloud_store', label: 'Cloud Master Store' }
                    ].map(tb => {
                      const isReady = tb.name === 'restoqr_cloud_store' 
                        ? supabaseDetails?.cloudStoreReady 
                        : supabaseDetails?.tables?.[tb.name];
                      return (
                        <div
                          key={tb.name}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-1.5 ${
                            isReady
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="font-mono text-[11px] truncate">{tb.label}</span>
                          <span className="text-[10px] font-bold">
                            {isReady ? '✓ Ready' : '• Pending'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* OFFLINE JSON BACKUP & RECOVERY SECTION */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-xs text-white flex items-center gap-2">
                        <FileJson className="w-4 h-4 text-orange-400" />
                        <span>Offline Database Backup & File Recovery</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Download a complete JSON snapshot file of all {restaurants.length} restaurants, menus, categories, and tables to your PC, or restore from a previously downloaded file.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportBackup}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Download JSON Backup</span>
                      </button>

                      <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer shadow-sm">
                        <Upload className="w-3.5 h-3.5 text-orange-400" />
                        <span>{importingBackup ? 'Importing...' : 'Restore from JSON'}</span>
                        <input
                          type="file"
                          accept=".json,application/json"
                          className="hidden"
                          onChange={handleImportBackup}
                          disabled={importingBackup}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Browser Emergency Cache Recovery */}
                  {(() => {
                    const cached = localStorage.getItem('restoqr_admin_restaurants_cache');
                    if (!cached) return null;
                    try {
                      const parsed = JSON.parse(cached);
                      if (Array.isArray(parsed) && parsed.length > restaurants.length) {
                        return (
                          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs flex items-center justify-between gap-2">
                            <span>Found {parsed.length} restaurants saved in local browser storage cache!</span>
                            <button
                              type="button"
                              onClick={async () => {
                                showToast(`Restoring ${parsed.length} restaurants from browser cache...`, 'info');
                                await loadData();
                              }}
                              className="px-2.5 py-1 bg-orange-500 text-white font-bold text-[11px] rounded-lg"
                            >
                              Restore Now
                            </button>
                          </div>
                        );
                      }
                    } catch (e) {}
                    return null;
                  })()}
                </div>
              </div>

              {/* Platform Settings Summary */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <span>Platform System Status</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-slate-400 text-[11px]">SaaS Architecture</div>
                    <div className="font-bold text-white mt-1">Multi-Tenant Dynamic QR</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-slate-400 text-[11px]">Realtime Engine</div>
                    <div className="font-bold text-emerald-400 mt-1">Active SSE Stream</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-slate-400 text-[11px]">Direct UPI Payments</div>
                    <div className="font-bold text-orange-400 mt-1">Direct to Restaurant Bank</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CREATE RESTAURANT MULTI-STEP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-xl text-white">Create New Restaurant</h3>
                <p className="text-xs text-slate-400 mt-0.5">Step {createStep} of 5 — SaaS Onboarding</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-400">
              <span className={createStep >= 1 ? 'text-orange-400' : ''}>1. Info</span>
              <span>→</span>
              <span className={createStep >= 2 ? 'text-orange-400' : ''}>2. Owner</span>
              <span>→</span>
              <span className={createStep >= 3 ? 'text-orange-400' : ''}>3. Status</span>
              <span>→</span>
              <span className={createStep >= 4 ? 'text-orange-400' : ''}>4. Plan</span>
              <span>→</span>
              <span className={createStep >= 5 ? 'text-orange-400' : ''}>5. Finish</span>
            </div>

            {/* Form Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {createStep === 1 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Restaurant Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Restaurant Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Urban Bites Cafe"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Cuisine Type</label>
                      <input
                        type="text"
                        value={formData.cuisine_type}
                        onChange={e => setFormData({ ...formData, cuisine_type: e.target.value })}
                        placeholder="e.g. Italian & Cafe"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Restaurant Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@restaurant.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street address / Landmark"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Bengaluru"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                        placeholder="Karnataka"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                        placeholder="560038"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Artisan sourdough pizzas and gourmet coffees..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {createStep === 2 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Owner Account Setup</h4>
                  <p className="text-xs text-slate-400">
                    This account will be created with hashed credentials for restaurant administration.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Owner Full Name *</label>
                      <input
                        type="text"
                        value={formData.owner_name}
                        onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                        placeholder="e.g. Vikram Malhotra"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Owner Email *</label>
                      <input
                        type="email"
                        value={formData.owner_email}
                        onChange={e => setFormData({ ...formData, owner_email: e.target.value })}
                        placeholder="owner@urbanbites.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Initial Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.owner_password}
                          onChange={e => setFormData({ ...formData, owner_password: e.target.value })}
                          placeholder="••••••••••••"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Confirm Password *</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirm_password}
                        onChange={e => setFormData({ ...formData, confirm_password: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {createStep === 3 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Account Status</h4>
                  <div className="space-y-3">
                    {['active', 'pending', 'suspended'].map((st) => (
                      <label
                        key={st}
                        className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                          formData.status === st ? 'bg-orange-500/10 border-orange-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={st}
                          checked={formData.status === st}
                          onChange={e => setFormData({ ...formData, status: e.target.value })}
                          className="text-orange-500 focus:ring-orange-500"
                        />
                        <div>
                          <div className="font-bold capitalize text-sm">{st}</div>
                          <div className="text-xs text-slate-500">
                            {st === 'active' && 'Immediate full access to restaurant dashboard and customer QR ordering.'}
                            {st === 'pending' && 'Account initialized awaiting plan confirmation or admin review.'}
                            {st === 'suspended' && 'Login and customer ordering temporarily blocked.'}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {createStep === 4 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Select SaaS Plan</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'starter', name: 'Starter', price: '₹999/mo', desc: 'Up to 5 tables, essential QR menu' },
                      { id: 'growth', name: 'Growth', price: '₹1,999/mo', desc: 'Up to 15 tables, live kitchen display, coupons' },
                      { id: 'pro', name: 'Pro', price: '₹3,499/mo', desc: 'Unlimited tables, full analytics, multi-staff' },
                      { id: 'custom', name: 'Custom Enterprise', price: '₹4,999/mo', desc: 'Multi-outlet chain and custom domain' }
                    ].map(p => (
                      <div
                        key={p.id}
                        onClick={() => setFormData({ ...formData, plan: p.id })}
                        className={`p-4 rounded-2xl border cursor-pointer transition ${
                          formData.plan === p.id ? 'bg-orange-500/10 border-orange-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="font-black text-base">{p.name}</div>
                        <div className="text-lg font-bold text-emerald-400 mt-1">{p.price}</div>
                        <div className="text-xs text-slate-500 mt-1">{p.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {createStep === 5 && createdResult && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-bold text-2xl border border-emerald-500/30">
                    ✓
                  </div>
                  <h4 className="text-2xl font-black text-white">Restaurant Created Successfully!</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    The restaurant <span className="text-white font-bold">{createdResult.restaurant.name}</span> and owner account for <span className="text-white font-bold">{createdResult.owner.email}</span> have been provisioned.
                  </p>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Restaurant Slug:</span>
                      <span className="font-mono text-orange-400 font-bold">{createdResult.restaurant.slug}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Owner Login:</span>
                      <span className="font-mono text-slate-200">{createdResult.owner.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Public Menu:</span>
                      <span className="font-mono text-emerald-400">/menu/{createdResult.restaurant.slug}/table/1</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                    <a
                      href={`/menu/${createdResult.restaurant.slug}/table/1`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>Open Customer Menu</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setActiveTab('restaurants');
                      }}
                      className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-lg shadow-orange-500/20"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            {createStep < 5 && (
              <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <button
                  type="button"
                  disabled={createStep === 1}
                  onClick={() => setCreateStep(createStep - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-40"
                >
                  Back
                </button>

                {createStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (createStep === 1 && !formData.name) {
                        showToast('Please enter a restaurant name', 'error');
                        return;
                      }
                      if (createStep === 2 && (!formData.owner_email || !formData.owner_password)) {
                        showToast('Please fill in owner email and initial password', 'error');
                        return;
                      }
                      setCreateStep(createStep + 1);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition cursor-pointer"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateRestaurant}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                  >
                    CREATE RESTAURANT
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUPER ADMIN CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Change Admin Password</h3>
                  <p className="text-xs text-slate-400">Update Super Admin credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminChangePassword} className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Current Password *</label>
                <div className="relative">
                  <input
                    type={showPassText ? 'text' : 'password'}
                    value={adminCurrPass}
                    onChange={e => setAdminCurrPass(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassText(!showPassText)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">New Password * (Min 6 chars)</label>
                <input
                  type={showPassText ? 'text' : 'password'}
                  value={adminNewPass}
                  onChange={e => setAdminNewPass(e.target.value)}
                  placeholder="Enter new secure password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Confirm New Password *</label>
                <input
                  type={showPassText ? 'text' : 'password'}
                  value={adminConfirmPass}
                  onChange={e => setAdminConfirmPass(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPass || !adminCurrPass || !adminNewPass}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{updatingPass ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
