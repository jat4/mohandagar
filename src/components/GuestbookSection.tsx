import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { 
  db, 
  auth, 
  signInWithGoogle, 
  signOutUser, 
  isUserAdmin, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Trash2, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  Heart,
  User as UserIcon,
  Clock
} from 'lucide-react';

interface GuestbookMessage {
  id: string;
  authorName: string;
  authorEmail?: string;
  authorAvatar?: string;
  message: string;
  roleOrCompany?: string;
  createdAt?: any;
  authorUid?: string;
}

export const GuestbookSection: React.FC = () => {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [messageText, setMessageText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        if (user.displayName && !name) setName(user.displayName);
      }
    });

    const q = query(
      collection(db, 'guestbook'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        const list: GuestbookMessage[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<GuestbookMessage, 'id'>)
        }));
        setMessages(list);
      },
      (err) => {
        console.warn('Guestbook listener notice:', err);
      }
    );

    return () => {
      unsubAuth();
      unsubFirestore();
    };
  }, []);

  const handleSignIn = async () => {
    try {
      setErrorNotice(null);
      await signInWithGoogle();
    } catch (err: any) {
      setErrorNotice(err.message || 'Sign in failed');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !messageText.trim()) return;

    setSubmitting(true);
    setErrorNotice(null);

    const path = 'guestbook';
    try {
      await addDoc(collection(db, path), {
        authorName: name.trim(),
        roleOrCompany: role.trim() || 'Visitor',
        message: messageText.trim(),
        authorUid: currentUser?.uid || 'guest',
        authorEmail: currentUser?.email || '',
        authorAvatar: currentUser?.photoURL || '',
        createdAt: serverTimestamp()
      });

      setMessageText('');
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 4000);
    } catch (err) {
      console.error(err);
      setErrorNotice('Could not post message. Please verify network/permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this guestbook entry?')) return;
    const path = `guestbook/${id}`;
    try {
      await deleteDoc(doc(db, 'guestbook', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const isAdmin = isUserAdmin(currentUser);

  return (
    <section id="guestbook" className="py-20 md:py-28 relative bg-slate-900/40 border-t border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-xs font-mono text-cyan-300 mb-4">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Live Firestore Database</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight mb-3">
            Visitor Guestbook & Greetings
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Leave a note, feedback on my open source work, or say hi! All messages are stored live in Firebase Firestore.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Post Form */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xl shadow-black/40 relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-lg">Leave a Greeting</h3>
              </div>

              {currentUser ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 truncate max-w-[120px]">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Google Sign In</span>
                </button>
              )}
            </div>

            {successNotice && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Thank you! Your greeting was added to the guestbook.</span>
              </div>
            )}

            {errorNotice && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {errorNotice}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Role / Company (Optional)</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Frontend Dev @ TechCorp"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Your Message *</label>
                <textarea
                  required
                  rows={3}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Awesome portfolio Mohan! Loved your GitHub projects..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Posting...' : 'Post to Guestbook'}</span>
              </button>
            </form>
          </div>

          {/* Live Guestbook List */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Firestore Feed ({messages.length} notes)
              </span>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  Admin Mode Active
                </span>
              )}
            </div>

            {messages.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950/50 border border-slate-800/60 text-center flex flex-col items-center justify-center">
                <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-slate-400 text-sm">No messages yet. Be the first to leave a greeting!</p>
              </div>
            ) : (
              <div className="max-h-[480px] overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {messages.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/70 hover:border-slate-700/80 transition-all flex flex-col gap-2 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {item.authorAvatar ? (
                          <img
                            src={item.authorAvatar}
                            alt={item.authorName}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-700/50 text-cyan-300 flex items-center justify-center text-xs font-bold">
                            {item.authorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-100 text-xs sm:text-sm">
                              {item.authorName}
                            </span>
                            {item.roleOrCompany && (
                              <span className="text-[11px] text-slate-400 font-mono">
                                • {item.roleOrCompany}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                            title="Delete entry as Admin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-9">
                      "{item.message}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
