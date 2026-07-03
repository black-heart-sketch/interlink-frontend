import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { messageService } from '../../services/messageService';

const fullName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Contact';
const apiBase = (import.meta.env.VITE_API_URL || 'https://interiilink.com/api/api/').replace(/\/api\/?$/, '');
const assetUrl = (url) => /^https?:\/\//i.test(url || '') ? url : `${apiBase}${url}`;
const avatarUrl = (user) => user?.avatar ? assetUrl(user.avatar) : '';

function Avatar({ user, size = 'h-10 w-10', active = false }) {
  const src = avatarUrl(user);
  return (
    <div className={`${size} grid shrink-0 place-items-center overflow-hidden rounded-xl ${active ? 'bg-slate-900/20 text-slate-950' : 'bg-slate-900/50 text-cyan-100'} font-black uppercase ring-1 ring-white/10`}>
      {src ? (
        <img src={src} alt={fullName(user)} className="h-full w-full object-cover" />
      ) : (
        <span>{fullName(user).slice(0, 1)}</span>
      )}
    </div>
  );
}

export default function ManageMessages() {
  const userId = useSelector((state) => state.auth.userId) || sessionStorage.getItem('userId') || localStorage.getItem('userId');
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const socketClient = useMemo(() => {
    const url = apiBase;
    return io(url, { transports: ['websocket', 'polling'], autoConnect: false });
  }, []);

  useEffect(() => {
    socketClient.connect();
    if (userId) socketClient.emit('identify_user', { userId });
    socketClient.on('message:new', (message) => {
      if (String(message.sender?._id || message.sender) === String(activeContact?._id)) {
        setMessages((current) => [...current, message]);
        messageService.markRead(activeContact._id).catch(() => {});
      }
    });
    socketClient.on('message:sent', (message) => {
      if (String(message.receiver?._id || message.receiver) === String(activeContact?._id)) {
        setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]);
      }
    });
    return () => socketClient.disconnect();
  }, [activeContact?._id, socketClient, userId]);

  const loadContacts = async () => {
    try {
      const rows = await messageService.getContacts();
      setContacts(rows || []);
      if (!activeContact && rows?.length) setActiveContact(rows[0]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContacts(); }, []);

  useEffect(() => {
    if (!activeContact) return;
    messageService.getConversation(activeContact._id)
      .then((rows) => {
        setMessages(rows || []);
        return messageService.markRead(activeContact._id);
      })
      .catch((error) => toast.error(error.response?.data?.message || 'Unable to load conversation.'));
  }, [activeContact?._id]);

  const send = async (event) => {
    event.preventDefault();
    if (!activeContact) return;
    if (!content.trim() && attachments.length === 0) return;
    setSending(true);
    try {
      const message = await messageService.sendMessage({ receiverId: activeContact._id, content, attachments });
      setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]);
      setContent('');
      setAttachments([]);
      event.target.reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">Loading messages...</div>;

  return (
    <div className="grid min-h-[680px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="border-b border-white/10 bg-slate-950/35 p-4 lg:border-b-0 lg:border-r">
        <h3 className="text-lg font-black text-white">Direct Messages</h3>
        <p className="mt-1 text-sm text-slate-500">Students, supervisors, and admins.</p>
        <div className="mt-5 grid gap-2">
          {contacts.length === 0 ? (
            <div className="rounded-2xl border border-white/10 p-4 text-sm text-slate-400">No available contacts.</div>
          ) : contacts.map((contact) => {
            const active = activeContact?._id === contact._id;
            return (
              <button key={contact._id} type="button" onClick={() => setActiveContact(contact)} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${active ? 'border-cyan-300/30 bg-cyan-400 text-slate-950' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'}`}>
                <Avatar user={contact} active={active} />
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-black">{fullName(contact)}</strong>
                  <small className={`block truncate text-xs capitalize ${active ? 'text-slate-700' : 'text-slate-500'}`}>{contact.role}</small>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-h-[680px] flex-col">
        <header className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            {activeContact && <Avatar user={activeContact} size="h-12 w-12" />}
            <div>
              <h3 className="text-xl font-black text-white">{activeContact ? fullName(activeContact) : 'Select a contact'}</h3>
              <p className="mt-1 text-sm text-slate-500">Real-time Socket.IO transport with persisted message history.</p>
            </div>
          </div>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-slate-500">No messages yet.</div>
          ) : messages.map((message) => {
            const mine = String(message.sender?._id || message.sender) === String(userId);
            return (
              <article key={message._id} className={`flex max-w-[86%] items-end gap-3 ${mine ? 'ml-auto flex-row-reverse' : ''}`}>
                <Avatar user={mine ? message.sender : activeContact} size="h-9 w-9" />
                <div className={`rounded-2xl border p-4 ${mine ? 'border-cyan-400/20 bg-cyan-500/10' : 'border-white/10 bg-slate-950/40'}`}>
                  <p className="whitespace-pre-line text-sm leading-6 text-slate-200">{message.content}</p>
                  {message.attachments?.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {message.attachments.map((file) => (
                        <a key={file.url} href={assetUrl(file.url)} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-white/10">
                          <i className="fa-solid fa-paperclip mr-2" />{file.name}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-right text-[0.65rem] font-bold text-slate-500">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{mine && (message.isRead ? ' · Read' : ' · Sent')}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <form onSubmit={send} className="border-t border-white/10 p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_120px]">
            <input value={content} onChange={(e) => setContent(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60" placeholder="Write a message..." />
            <input type="file" multiple onChange={(e) => setAttachments(Array.from(e.target.files || []))} className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300" />
            <button disabled={sending || !activeContact} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">Send</button>
          </div>
        </form>
      </section>
    </div>
  );
}
