import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  MapPin,
  Star,
  Eye,
  TrendingUp,
  Crown,
  Globe,
  ArrowRight,
} from 'lucide-react';
import { adminApi } from '../api/admin';
import type { DashboardStats, LocationStats } from '../types';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [locationStats, setLocationStats] = useState<LocationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [dashboardData, locationData] = await Promise.all([
          adminApi.getDashboardStats(),
          adminApi.getLocationStats(),
        ]);
        setStats(dashboardData);
        setLocationStats(locationData);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.users.total || 0}
          icon={Users}
          color="blue"
          subtitle={`${stats?.users.premium || 0} premium`}
        />
        <StatCard
          title="Premium Users"
          value={stats?.users.premium || 0}
          icon={Crown}
          color="amber"
          subtitle={`${Math.round(((stats?.users.premium || 0) / (stats?.users.total || 1)) * 100)}% of users`}
        />
        <StatCard
          title="Attractions"
          value={stats?.attractions.total || 0}
          icon={MapPin}
          color="pink"
          subtitle={`${locationStats?.countries || 0} countries`}
        />
        <StatCard
          title="Total Reviews"
          value={stats?.engagement.reviews || 0}
          icon={Star}
          color="green"
        />
      </div>

      {/* Location Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <LocationStatCard
          label="Continents"
          value={locationStats?.continents || 0}
          icon={Globe}
        />
        <LocationStatCard
          label="Countries"
          value={locationStats?.countries || 0}
          icon={Globe}
        />
        <LocationStatCard
          label="Cities"
          value={locationStats?.cities || 0}
          icon={MapPin}
        />
        <LocationStatCard
          label="Total Visits"
          value={stats?.engagement.visits || 0}
          icon={Eye}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
            <Link
              to="/users"
              className="text-pink-500 hover:text-pink-600 text-sm font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            {stats?.recent.users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.subscriptionTier === 'premium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {user.subscriptionTier}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attractions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Attractions
            </h2>
            <Link
              to="/attractions"
              className="text-pink-500 hover:text-pink-600 text-sm font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            {stats?.recent.attractions.map((attraction) => (
              <div
                key={attraction.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{attraction.name}</p>
                    <p className="text-sm text-gray-500">
                      {attraction.city?.name}, {attraction.city?.country?.name}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {attraction.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'amber' | 'pink' | 'green';
  subtitle?: string;
}) {
  const colors = {
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    pink: 'bg-pink-500',
    green: 'bg-green-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${colors[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <TrendingUp className="w-5 h-5 text-green-500" />
      </div>
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-1">
        {value.toLocaleString()}
      </p>
      {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function LocationStatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
