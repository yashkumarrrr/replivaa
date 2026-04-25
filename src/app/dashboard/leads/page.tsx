'use client';
import { useEffect, useState } from 'react';
import { Users, Mail, Phone, MessageSquare, TrendingUp, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import { cn, timeAgo, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Lead {
  id: string;
  igUsername?: string;
  igUserId: string;
  name?: string;
  email?: string;
  phone?: string;
  status: string;
  source: string;
  notes?: string;
  createdAt: string;
  conversation?: { messageCount: number; lastMessageAt: string };
}

const STATUS_COLORS: Record<string, string> = {
  new: 'badge-blue',
  contacted: 'badge-yellow',
  qualified: 'badge-green',
  converted: 'bg-green-100 text-green-800',
  lost: 'badge-gray',
};

const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/leads').then(r => {
      setLeads(r.data.leads);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const updateLead = async (id: string, data: Partial<Lead>) => {
    try {
      const res = await api.patch(`/leads/${id}`, data);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...res.data } : l));
      toast.success('Lead updated');
    } catch {
      toast.error('Failed to update lead');
    }
  };

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);
  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: leads.filter(l => l.status === s).length }), {} as Record<string, number>);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="page-title">Leads</h1>
        <p className="page-subtitle">Instagram users detected as potential leads by your AI.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: leads.length, color: 'text-blue-600 bg-blue-50' },
          { label: 'Qualified', value: counts.qualified || 0, color: 'text-green-600 bg-green-50' },
          { label: 'Converted', value: counts.converted || 0, color: 'text-purple-600 bg-purple-50' },
          { label: 'New', value: counts.new || 0, color: 'text-yellow-600 bg-yellow-50' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
              filter === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && counts[s] ? ` (${counts[s]})` : s === 'all' ? ` (${leads.length})` : ''}
          </button>
        ))}
      </div>

      {/* Leads Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading leads…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={36} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 text-sm">No leads yet. Enable automation to start detecting leads.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Source</th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Messages</th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Added</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                          {(lead.igUsername || lead.igUserId)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">@{lead.igUsername || lead.igUserId}</p>
                          {lead.name && <p className="text-xs text-gray-400">{lead.name}</p>}
                          {lead.email && <p className="text-xs text-gray-400">{lead.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={lead.status}
                        onChange={e => updateLead(lead.id, { status: e.target.value })}
                        className={cn('badge border-0 cursor-pointer', STATUS_COLORS[lead.status] || 'badge-gray')}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge-gray">{lead.source}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {lead.conversation?.messageCount || 0} msgs
                    </td>
                    <td className="px-6 py-4 text-gray-400">{timeAgo(lead.createdAt)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setEditingId(editingId === lead.id ? null : lead.id)}
                        className="text-xs text-brand-600 hover:text-brand-700"
                      >
                        Edit notes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
