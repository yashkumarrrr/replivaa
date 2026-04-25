'use client';
import { useEffect, useState, useRef } from 'react';
import { MessageSquare, Send, Pause, Play, Search, Bot, User } from 'lucide-react';
import api from '@/lib/api';
import { cn, timeAgo, truncate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  senderType: 'user' | 'ai' | 'human';
  content: string;
  sentAt: string;
}

interface Conversation {
  id: string;
  igUsername?: string;
  igUserId: string;
  source: string;
  status: string;
  automationOn: boolean;
  lastMessageAt: string;
  messageCount: number;
  isLead: boolean;
  messages: Message[];
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/conversations').then(r => {
      setConversations(r.data.conversations);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.get(`/conversations/${selected.id}`).then(r => {
      setMessages(r.data.messages);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  }, [selected]);

  const toggleAutomation = async () => {
    if (!selected) return;
    try {
      const newVal = !selected.automationOn;
      await api.patch(`/conversations/${selected.id}`, { automationOn: newVal });
      setSelected(prev => prev ? { ...prev, automationOn: newVal } : prev);
      setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, automationOn: newVal } : c));
      toast.success(`Automation ${newVal ? 'resumed' : 'paused'}`);
    } catch {
      toast.error('Failed to update');
    }
  };

  const sendMessage = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const { data } = await api.post(`/conversations/${selected.id}/send`, { message: reply });
      setMessages(prev => [...prev, data]);
      setReply('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter(c =>
    !search || c.igUsername?.toLowerCase().includes(search.toLowerCase()) ||
    c.igUserId.includes(search)
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="page-title">Conversations</h1>
        <p className="page-subtitle">All DMs and comment threads managed by your AI.</p>
      </div>

      <div className="card overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Conversation List */}
          <div className="w-72 border-r border-gray-100 flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="p-4 space-y-2 animate-pulse">
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-2.5 bg-gray-100 rounded w-full" />
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No conversations yet</div>
              ) : (
                filtered.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={cn(
                      'w-full text-left p-4 hover:bg-gray-50 transition-colors',
                      selected?.id === c.id && 'bg-brand-50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 text-sm font-medium">
                        {(c.igUsername || c.igUserId)[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            @{c.igUsername || c.igUserId}
                          </p>
                          <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(c.lastMessageAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {c.isLead && <span className="badge-purple text-xs">Lead</span>}
                          {!c.automationOn && <span className="badge-yellow text-xs">Paused</span>}
                          <span className="text-xs text-gray-400">{c.messageCount} messages</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message Panel */}
          {selected ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                    {(selected.igUsername || selected.igUserId)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">@{selected.igUsername || selected.igUserId}</p>
                    <p className="text-xs text-gray-400">{selected.source} · {selected.messageCount} messages</p>
                  </div>
                </div>
                <button
                  onClick={toggleAutomation}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all',
                    selected.automationOn
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  )}
                >
                  {selected.automationOn ? <><Bot size={12} /> AI Active</> : <><Pause size={12} /> AI Paused</>}
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn('flex message-bubble', msg.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm',
                      msg.direction === 'outbound'
                        ? 'bg-gray-900 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    )}>
                      <p className="leading-relaxed">{msg.content}</p>
                      <div className={cn('flex items-center gap-1 mt-1', msg.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
                        {msg.senderType === 'ai' && (
                          <span className={cn('text-xs', msg.direction === 'outbound' ? 'text-gray-400' : 'text-gray-400')}>
                            <Bot size={10} className="inline" /> AI
                          </span>
                        )}
                        <span className={cn('text-xs', msg.direction === 'outbound' ? 'text-gray-400' : 'text-gray-400')}>
                          {timeAgo(msg.sentAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-end gap-3">
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Type a manual reply… (Enter to send)"
                    rows={2}
                    className="flex-1 input resize-none py-2.5"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !reply.trim()}
                    className="btn-primary px-4 py-2.5 flex-shrink-0"
                  >
                    <Send size={15} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Manual replies are sent as you, not the AI.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
