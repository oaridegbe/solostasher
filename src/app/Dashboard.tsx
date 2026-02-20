import React, { useState, useEffect, useCallback } from 'react';

// Types
interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  history?: number[];
}

interface TrackedValue {
  id: string;
  name: string;
  category: 'financial' | 'performance' | 'custom';
  currentValue: number;
  targetValue: number;
  unit: string;
  history: { timestamp: number; value: number; note?: string }[];
  createdAt: number;
  color: string;
}

interface ValueAlert {
  id: string;
  valueId: string;
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  message: string;
  active: boolean;
}

interface HistoryEntry {
  timestamp: number;
  value: number;
  note?: string;
  index?: number;
}

type ValueCategory = 'financial' | 'performance' | 'custom';

// SVG Icons as components since lucide-react is not installed
const Icons = {
  TrendingUp: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  DollarSign: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  ),
  Activity: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  ),
  Bell: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  ),
  Menu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
  ChevronDown: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
  ),
  MoreHorizontal: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
  ),
  ArrowUpRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
  ),
  ArrowDownRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/></svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  ),
  Filter: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
  ),
  Target: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  ),
  Trash2: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
  ),
  Edit2: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
  ),
  Save: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
  ),
  History: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  TrendingDown: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
  ),
  Wallet: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>
  ),
  PiggyBank: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h0"/></svg>
  )
};

// Mock Data
const initialTrackedValues: TrackedValue[] = [
  {
    id: '1',
    name: 'Monthly Revenue',
    category: 'financial',
    currentValue: 48294,
    targetValue: 50000,
    unit: '$',
    history: Array.from({ length: 30 }, (_, i) => ({
      timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
      value: 40000 + Math.random() * 15000,
      note: i === 29 ? 'End of month surge' : undefined
    })),
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    color: '#3b82f6'
  },
  {
    id: '2',
    name: 'Active Users',
    category: 'performance',
    currentValue: 2543,
    targetValue: 3000,
    unit: '',
    history: Array.from({ length: 30 }, (_, i) => ({
      timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
      value: 2000 + Math.random() * 800
    })),
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    color: '#10b981'
  },
  {
    id: '3',
    name: 'Conversion Rate',
    category: 'performance',
    currentValue: 3.2,
    targetValue: 5.0,
    unit: '%',
    history: Array.from({ length: 30 }, (_, i) => ({
      timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
      value: 2.5 + Math.random() * 1.5
    })),
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    color: '#8b5cf6'
  }
];

// Simple Chart Components (since recharts is not installed)
const SimpleLineChart: React.FC<{ data: HistoryEntry[]; color: string; unit?: string }> = ({ data, color }) => {
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-12 w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};

const SimpleAreaChart: React.FC<{ data: HistoryEntry[]; color: string }> = ({ data, color }) => {
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="h-48 w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <polygon
          fill={color}
          fillOpacity="0.1"
          points={areaPoints}
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};

// Components
const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive, icon, history }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 group-hover:scale-105 transition-transform origin-left">{value}</h3>
        <div className={`flex items-center mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <Icons.ArrowUpRight /> : <Icons.ArrowDownRight />}
          <span className="font-medium ml-1">{change}</span>
          <span className="text-gray-400 ml-1">vs last month</span>
        </div>
      </div>
      <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        {icon}
      </div>
    </div>
    
    {history && history.length > 0 && (
      <SimpleLineChart 
        data={history.map((v, i) => ({ value: v, timestamp: Date.now() - (history.length - i) * 1000 }))} 
        color={isPositive ? '#10b981' : '#ef4444'} 
      />
    )}
  </div>
);

const NavItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick: () => void;
  collapsed?: boolean;
}> = ({ icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {icon}
    {!collapsed && <span className="font-medium">{label}</span>}
  </button>
);

const ValueTrackerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  values: TrackedValue[];
  onUpdateValue: (id: string, newValue: number, note?: string) => void;
  onAddValue: (value: Omit<TrackedValue, 'id' | 'history' | 'createdAt'>) => void;
  onDeleteValue: (id: string) => void;
  onAddAlert: (alert: Omit<ValueAlert, 'id'>) => void;
}> = ({ isOpen, onClose, values, onUpdateValue, onAddValue, onDeleteValue }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'history'>('list');
  const [selectedValue, setSelectedValue] = useState<TrackedValue | null>(null);
  const [newValueInput, setNewValueInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  
  const [newValueForm, setNewValueForm] = useState<{
    name: string;
    category: ValueCategory;
    currentValue: number;
    targetValue: number;
    unit: string;
    color: string;
  }>({
    name: '',
    category: 'custom',
    currentValue: 0,
    targetValue: 0,
    unit: '',
    color: '#3b82f6'
  });

  if (!isOpen) return null;

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedValue && newValueInput) {
      onUpdateValue(selectedValue.id, parseFloat(newValueInput), noteInput);
      setNewValueInput('');
      setNoteInput('');
      setSelectedValue(null);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddValue(newValueForm);
    setNewValueForm({ name: '', category: 'custom', currentValue: 0, targetValue: 0, unit: '', color: '#3b82f6' });
    setActiveTab('list');
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.Target />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Value Tracker</h2>
              <p className="text-sm text-gray-500">Monitor and manage your key metrics</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <Icons.X />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          {(['list', 'history', 'add'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab === 'list' && 'Active Values'}
              {tab === 'history' && 'Value History'}
              {tab === 'add' && 'Add New Value'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'list' && (
            <div className="space-y-4">
              {values.map((value) => (
                <div key={value.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: value.color }} />
                      <div>
                        <h3 className="font-semibold text-gray-900">{value.name}</h3>
                        <p className="text-xs text-gray-500 capitalize">{value.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setSelectedValue(value)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Update Value"
                      >
                        <Icons.Edit2 />
                      </button>
                      <button 
                        onClick={() => onDeleteValue(value.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Icons.Trash2 />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Current</p>
                      <p className="text-lg font-bold text-gray-900">
                        {value.unit}{value.currentValue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Target</p>
                      <p className="text-lg font-bold text-gray-900">
                        {value.unit}{value.targetValue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Progress</p>
                      <p className={`text-lg font-bold ${
                        getProgressPercentage(value.currentValue, value.targetValue) >= 100 ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {getProgressPercentage(value.currentValue, value.targetValue).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${getProgressPercentage(value.currentValue, value.targetValue)}%`,
                        backgroundColor: value.color
                      }}
                    />
                  </div>

                  {selectedValue?.id === value.id && (
                    <form onSubmit={handleUpdateSubmit} className="mt-4 p-4 bg-white rounded-lg border border-blue-200 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Value</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newValueInput}
                          onChange={(e) => setNewValueInput(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Current: ${value.currentValue}`}
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                        <input
                          type="text"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Why did this change?"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                          <Icons.Save />
                          <span>Save Update</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setSelectedValue(null)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              {values.map((value) => (
                <div key={value.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icons.History />
                      <h3 className="font-semibold text-gray-900">{value.name}</h3>
                    </div>
                    <span className="text-sm text-gray-500">{value.history.length} entries</span>
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <SimpleAreaChart data={value.history.slice(-30)} color={value.color} />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {[...value.history].reverse().slice(0, 10).map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                          <div className="flex items-center space-x-3">
                            <Icons.Clock />
                            <span className="text-gray-600">
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-gray-900">
                              {value.unit}{entry.value.toLocaleString()}
                            </span>
                            {entry.note && (
                              <p className="text-xs text-gray-500 mt-1">{entry.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'add' && (
            <form onSubmit={handleAddSubmit} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value Name</label>
                <input
                  type="text"
                  required
                  value={newValueForm.name}
                  onChange={(e) => setNewValueForm({...newValueForm, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Daily Active Users"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newValueForm.category}
                    onChange={(e) => setNewValueForm({...newValueForm, category: e.target.value as ValueCategory})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="financial">Financial</option>
                    <option value="performance">Performance</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newValueForm.unit}
                    onChange={(e) => setNewValueForm({...newValueForm, unit: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="$ or % or empty"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newValueForm.currentValue}
                    onChange={(e) => setNewValueForm({...newValueForm, currentValue: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newValueForm.targetValue}
                    onChange={(e) => setNewValueForm({...newValueForm, targetValue: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex space-x-3">
                  {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewValueForm({...newValueForm, color})}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newValueForm.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Icons.Plus />
                <span>Add Value Tracker</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState(3);
  const [timeRange, setTimeRange] = useState('7d');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isValueTrackerOpen, setIsValueTrackerOpen] = useState(false);
  
  // Value Tracking State
  const [trackedValues, setTrackedValues] = useState<TrackedValue[]>(initialTrackedValues);
  const [alerts, setAlerts] = useState<ValueAlert[]>([]);

  // Update value with history tracking
  const handleUpdateValue = useCallback((id: string, newValue: number, note?: string) => {
    setTrackedValues(prev => prev.map(val => {
      if (val.id === id) {
        const updatedHistory = [...val.history, {
          timestamp: Date.now(),
          value: newValue,
          note
        }];
        return { ...val, currentValue: newValue, history: updatedHistory };
      }
      return val;
    }));
    
    // Check alerts
    alerts.forEach(alert => {
      if (alert.valueId === id && alert.active) {
        const value = trackedValues.find(v => v.id === id);
        if (value) {
          let triggered = false;
          if (alert.condition === 'above' && newValue > alert.threshold) triggered = true;
          if (alert.condition === 'below' && newValue < alert.threshold) triggered = true;
          if (alert.condition === 'equals' && newValue === alert.threshold) triggered = true;
          
          if (triggered) {
            console.log('Alert triggered:', alert.message);
          }
        }
      }
    });
  }, [alerts, trackedValues]);

  const handleAddValue = useCallback((newValue: Omit<TrackedValue, 'id' | 'history' | 'createdAt'>) => {
    const value: TrackedValue = {
      ...newValue,
      id: Date.now().toString(),
      createdAt: Date.now(),
      history: [{ timestamp: Date.now(), value: newValue.currentValue, note: 'Initial value' }]
    };
    setTrackedValues(prev => [...prev, value]);
  }, []);

  const handleDeleteValue = useCallback((id: string) => {
    setTrackedValues(prev => prev.filter(v => v.id !== id));
  }, []);

  const handleAddAlert = useCallback((alert: Omit<ValueAlert, 'id'>) => {
    setAlerts(prev => [...prev, { ...alert, id: Date.now().toString() }]);
  }, []);

  // Calculate summary metrics from tracked values
  const financialValues = trackedValues.filter(v => v.category === 'financial');
  const totalRevenue = financialValues.reduce((sum, v) => sum + v.currentValue, 0);
  const avgProgress = trackedValues.length > 0 
    ? trackedValues.reduce((sum, v) => sum + (v.currentValue / v.targetValue), 0) / trackedValues.length * 100 
    : 0;

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTrackedValues(prev => prev.map(val => ({
        ...val,
        currentValue: val.currentValue + (Math.random() - 0.5) * (val.currentValue * 0.02)
      })));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <Icons.Activity />, action: undefined as (() => void) | undefined },
    { id: 'analytics', label: 'Analytics', icon: <Icons.TrendingUp />, action: undefined },
    { id: 'values', label: 'Value Tracking', icon: <Icons.Target />, action: () => setIsValueTrackerOpen(true) },
    { id: 'customers', label: 'Customers', icon: <Icons.Users />, action: undefined },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Value Tracker Modal */}
      <ValueTrackerModal
        isOpen={isValueTrackerOpen}
        onClose={() => setIsValueTrackerOpen(false)}
        values={trackedValues}
        onUpdateValue={handleUpdateValue}
        onAddValue={handleAddValue}
        onDeleteValue={handleDeleteValue}
        onAddAlert={handleAddAlert}
      />

      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-20`}
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold text-gray-900">DashPro</span>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <Icons.X /> : <Icons.Menu />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {sidebarItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id && !item.action}
              onClick={() => item.action ? item.action() : setActiveTab(item.id)}
              collapsed={!sidebarOpen}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 ${!sidebarOpen && 'hidden'}`}>
            <p className="text-white text-sm font-medium mb-2">Value Tracking</p>
            <p className="text-blue-100 text-xs mb-3">{trackedValues.length} active trackers</p>
            <button 
              onClick={() => setIsValueTrackerOpen(true)}
              className="w-full py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Manage Values
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center flex-1 max-w-xl">
              <div className="relative w-full">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5">
                  <Icons.Search />
                </div>
                <input 
                  type="text" 
                  placeholder="Search analytics, reports, customers..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 ml-4">
              <button 
                onClick={() => setIsValueTrackerOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Icons.Target />
                <span className="hidden sm:inline font-medium">{trackedValues.length} Values</span>
              </button>
              
              <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Icons.Bell />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {notifications}
                  </span>
                )}
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 hover:bg-gray-100 rounded-xl p-2 transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    JD
                  </div>
                  {sidebarOpen && (
                    <>
                      <div className="text-left hidden md:block">
                        <p className="text-sm font-medium text-gray-900">John Doe</p>
                        <p className="text-xs text-gray-500">Admin</p>
                      </div>
                      <div className="w-4 h-4 text-gray-400">
                        <Icons.ChevronDown />
                      </div>
                    </>
                  )}
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile Settings</button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Billing</button>
                    <hr className="my-2" />
                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Value Tracking Summary Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-lg shadow-blue-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">Value Tracking Overview</h2>
                <p className="text-blue-100">Monitor {trackedValues.length} key metrics with real-time updates</p>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{avgProgress.toFixed(1)}%</p>
                  <p className="text-sm text-blue-100">Avg Progress</p>
                </div>
                <div className="h-12 w-px bg-blue-400/50" />
                <div className="text-center">
                  <p className="text-3xl font-bold">${(totalRevenue / 1000).toFixed(1)}k</p>
                  <p className="text-sm text-blue-100">Total Tracked</p>
                </div>
                <button 
                  onClick={() => setIsValueTrackerOpen(true)}
                  className="px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors shadow-lg"
                >
                  Open Tracker
                </button>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {trackedValues.slice(0, 4).map((value) => (
              <MetricCard 
                key={value.id}
                title={value.name}
                value={`${value.unit}${value.currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                change={`${((value.currentValue / value.targetValue - 1) * 100).toFixed(1)}%`}
                isPositive={value.currentValue >= value.targetValue}
                icon={value.category === 'financial' ? <Icons.DollarSign /> : <Icons.Target />}
                history={value.history.slice(-7).map(h => h.value)}
              />
            ))}
            {trackedValues.length < 4 && (
              <button 
                onClick={() => setIsValueTrackerOpen(true)}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                <div className="w-8 h-8 mb-2"><Icons.Plus /></div>
                <span className="font-medium">Add New Value</span>
              </button>
            )}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Tracked Values History</h3>
                  <p className="text-sm text-gray-500">Compare your key metrics over time</p>
                </div>
                <div className="flex space-x-2">
                  {trackedValues.map(v => (
                    <div key={v.id} className="flex items-center space-x-1 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v.color }} />
                      <span className="text-gray-600">{v.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-80 relative">
                {trackedValues.map((value, idx) => (
                  <div key={value.id} className="absolute inset-0" style={{ zIndex: trackedValues.length - idx }}>
                    <SimpleAreaChart data={value.history.slice(-30)} color={value.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* Target Progress */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Target Progress</h3>
                  <p className="text-sm text-gray-500">How close to your goals</p>
                </div>
                <Icons.Target />
              </div>
              <div className="space-y-6">
                {trackedValues.map((value) => {
                  const percentage = Math.min((value.currentValue / value.targetValue) * 100, 100);
                  return (
                    <div key={value.id}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{value.name}</span>
                        <span className="text-sm font-bold text-gray-900">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: value.color
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>Current: {value.unit}{value.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        <span>Target: {value.unit}{value.targetValue.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Update Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Quick Value Update</h3>
                <p className="text-sm text-gray-500">Update your tracked values without opening the full tracker</p>
              </div>
              <button 
                onClick={() => setIsValueTrackerOpen(true)}
                className="text-blue-600 text-sm font-medium hover:text-blue-700"
              >
                Open Full Tracker →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trackedValues.slice(0, 3).map((value) => (
                <div key={value.id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: value.color }}>
                    {value.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{value.name}</p>
                    <p className="text-xs text-gray-500">{value.unit}{value.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <button 
                    onClick={() => setIsValueTrackerOpen(true)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Icons.Edit2 />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;