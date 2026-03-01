import { useState, useEffect } from 'react';
import { X, Users, Landmark, Mail, Phone, Globe, User, Briefcase, Save, ExternalLink } from 'lucide-react';
import type { Lead } from '../types';
import { formatCurrency, statusColors, formatStatus, PIPELINE_STAGES } from '../types';
import ActivityTimeline from './ActivityTimeline';
import ContactsCard from './ContactsCard';

interface LeadDetailPanelProps {
  lead: Lead;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onClose: () => void;
  onComposeEmail: () => void;
}

export default function LeadDetailPanel({ lead, onUpdateLead, onClose, onComposeEmail }: LeadDetailPanelProps) {
  const [contact, setContact] = useState(lead.contact);
  const [title, setTitle] = useState(lead.title);
  const [email, setEmail] = useState(lead.email);
  const [phone, setPhone] = useState(lead.phone);
  const [notes, setNotes] = useState(lead.notes);
  const [dirty, setDirty] = useState(false);

  // Sync when lead changes
  useEffect(() => {
    setContact(lead.contact);
    setTitle(lead.title);
    setEmail(lead.email);
    setPhone(lead.phone);
    setNotes(lead.notes);
    setDirty(false);
  }, [lead.id, lead.contact, lead.title, lead.email, lead.phone, lead.notes]);

  const handleSave = () => {
    const updates: Partial<Lead> = {
      contact, title, email, phone, notes,
      lastContact: new Date().toISOString(),
    };
    onUpdateLead(lead.id, updates);
    setDirty(false);
  };

  const markDirty = () => setDirty(true);

  const handleStatusChange = (newStatus: string) => {
    onUpdateLead(lead.id, { status: newStatus });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-slate-700 to-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              lead.type === 'Credit Union' ? 'bg-blue-500/20' : 'bg-green-500/20'
            }`}>
              {lead.type === 'Credit Union'
                ? <Users className="w-4 h-4 text-blue-300" />
                : <Landmark className="w-4 h-4 text-green-300" />
              }
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{lead.name}</h3>
              <p className="text-xs text-slate-300">{lead.city}, {lead.state} | {formatCurrency(lead.assets)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={lead.status}
            onChange={e => handleStatusChange(e.target.value)}
            className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColors[lead.status]}`}
          >
            {PIPELINE_STAGES.map(s => (
              <option key={s} value={s}>{formatStatus(s)}</option>
            ))}
          </select>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            lead.score >= 85 ? 'bg-green-500/20 text-green-300' : lead.score >= 70 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'
          }`}>
            Score: {lead.score}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Contact Info */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Contact Info</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={contact}
                onChange={e => { setContact(e.target.value); markDirty(); }}
                placeholder="Contact name"
                className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={title}
                onChange={e => { setTitle(e.target.value); markDirty(); }}
                placeholder="Job title"
                className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); markDirty(); }}
                placeholder="Email address"
                className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); markDirty(); }}
                placeholder="Phone number"
                className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Decision Makers (Apollo) */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            Decision Makers
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">Apollo</span>
          </h4>
          <ContactsCard institutionId={lead.id} companyName={lead.name} compact={true} />
        </div>

        {/* Notes */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
          <textarea
            value={notes}
            onChange={e => { setNotes(e.target.value); markDirty(); }}
            placeholder="Add notes about this lead..."
            rows={3}
            className="w-full px-2.5 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Save Button */}
        {dirty && (
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={onComposeEmail}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            Compose Email
          </button>
          {lead.website && (
            <a
              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              Website
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Lead Details (read-only) */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Institution Details</h4>
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium text-gray-700">{lead.type}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Assets</span><span className="font-medium text-gray-700">{formatCurrency(lead.assets)}</span></div>
            {lead.members > 0 && <div className="flex justify-between"><span className="text-gray-500">Members</span><span className="font-medium text-gray-700">{lead.members.toLocaleString()}</span></div>}
            {lead.deposits > 0 && <div className="flex justify-between"><span className="text-gray-500">Deposits</span><span className="font-medium text-gray-700">{formatCurrency(lead.deposits)}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">ROA</span><span className="font-medium text-gray-700">{lead.roa.toFixed(2)}%</span></div>
            {lead.branches > 0 && <div className="flex justify-between"><span className="text-gray-500">Branches</span><span className="font-medium text-gray-700">{lead.branches}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Source</span><span className="font-medium text-gray-700">{lead.source}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Products</span><span className="font-medium text-gray-700 text-right">{lead.recommendedProducts.join(', ')}</span></div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="border-t pt-4">
          <ActivityTimeline leadId={lead.id} />
        </div>
      </div>
    </div>
  );
}
