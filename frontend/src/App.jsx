import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { Heart, LogOut, Copy, Check, Bell } from 'lucide-react';

const API_BASE = 'https://pairmate-backend.onrender.com/api';

const App = () => {
  const [view, setView] = useState('home'); 
  const [userName, setUserName] = useState('');
  const [pairId, setPairId] = useState('');
  const [userId, setUserId] = useState(null); 
  const [pairData, setPairData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedSession = localStorage.getItem('pairmate_session');
    if (savedSession) {
      const { pair_id, user_id, user_name } = JSON.parse(savedSession);
      setPairId(pair_id); setUserId(user_id); setUserName(user_name); setView('session');
    }

    if (messaging) {
      onMessage(messaging, (payload) => {
        new Notification(payload.notification.title, { body: payload.notification.body });
      });
    }
  }, []);

  const prevPartnerStatusRef = useRef(null);

  const handleStatusChange = (newData, currentUserId) => {
    if (!currentUserId) return;
    const partnerId = currentUserId === 1 ? 2 : 1;
    prevPartnerStatusRef.current = newData[`user${partnerId}_status`];
  }

  useEffect(() => {
    if (view === 'session' && pairId && userId) {
      const unsub = onSnapshot(doc(db, "pairs", pairId), (docSnap) => {
        if (docSnap.exists()) {
          const newData = docSnap.data();
          handleStatusChange(newData, userId);
          setPairData(newData);
        }
      });
      return () => unsub();
    }
  }, [view, pairId, userId]);

  useEffect(() => {
    if (view === 'session' && pairId && userId && !pairData) {
      const interval = setInterval(async () => {
         try {
           const res = await fetch(`${API_BASE}/pairs/${pairId}`);
           if (res.ok) {
             const newData = await res.json();
             handleStatusChange(newData, userId);
             setPairData(newData);
           }
         } catch(e) {}
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [view, pairId, userId, pairData]);

  const handleCreate = async () => {
    if(!userName) { setError('Name is required'); return; }
    setError('');
    try {
      const res = await fetch(`${API_BASE}/pairs`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({user_name: userName})
      });
      const data = await res.json();
      setPairId(data.pair_id); setUserId(data.user_id);
      saveSession(data.pair_id, data.user_id, userName);
      setView('session');
    } catch(err) { setError("Failed to create pair."); }
  };

  const handleJoin = async () => {
     if(!userName || !pairId) { setError('Name and Pair ID are required'); return; }
     setError('');
     try {
       const res = await fetch(`${API_BASE}/pairs/${pairId}/join`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({user_name: userName})
      });
      if (!res.ok) { setError("Invalid or full pair"); return; }
      const data = await res.json();
      setUserId(data.user_id);
      saveSession(pairId, data.user_id, userName);
      setView('session');
     } catch (err) { setError("Failed to join pair."); }
  };

  const saveSession = (pId, uId, uName) => { localStorage.setItem('pairmate_session', JSON.stringify({pair_id: pId, user_id: uId, user_name: uName})); }

  const handleLeave = () => {
    localStorage.removeItem('pairmate_session');
    setPairId(''); setUserId(null); setUserName(''); setPairData(null); setView('home');
    document.title = "PairMate";
  };

  const updateStatus = async (status) => {
    setPairData(prev => ({...prev, [`user${userId}_status`]: status}));
    await fetch(`${API_BASE}/pairs/${pairId}/status`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({user_id: userId, status})
    });
  };

  const updateNotifyMode = async (mode) => {
    let finalMode = mode;
    let fcmToken = null;

    if (mode === 'BROWSER' && 'Notification' in window) {
       const permission = await Notification.requestPermission();
       if (permission === 'granted') {
          try {
             fcmToken = await getToken(messaging, { vapidKey: "BIWqAKnUvsGYv9GOWZIn2GShpBV8mhzSWF-NAo8OzrLLmI3hu875KENOynHmsDiMvSP0b-0K_cVQD_PCaBKsPXY" });
             new Notification('PairMate', { body: "Background push notifications successfully enabled!" });
          } catch (e) {
             console.error("FCM Token fetch failed", e);
             alert("Could not enable background push. Missing or invalid VAPID Key in codebase.");
          }
       } else {
          alert("Notification permission denied! Please allow them in your browser Settings.");
          finalMode = 'SILENT';
       }
    }
    
    setPairData(prev => ({...prev, [`user${userId}_notify_mode`]: finalMode}));
    await fetch(`${API_BASE}/pairs/${pairId}/notify`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({user_id: userId, mode: finalMode, fcm_token: fcmToken})
    });
  };

  const copyPairId = () => {
    navigator.clipboard.writeText(pairId);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#030303] text-white p-6 font-sans overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-rose-900/20 rounded-full blur-[100px] -top-32 -left-32 animate-[spin_20s_linear_infinite]"></div>
      <div className="absolute w-[400px] h-[400px] bg-indigo-900/20 rounded-full blur-[80px] -bottom-32 -right-32 animate-[spin_15s_reverse_infinite]"></div>
      
      <div className="z-10 max-w-sm w-full bg-black/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/[0.05] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex justify-center mb-8">
           <div className="w-20 h-20 bg-rose-600/10 rounded-full flex items-center justify-center border border-rose-500/20">
              <Heart size={36} className="text-rose-500 animate-pulse" />
           </div>
        </div>
        <h1 className="text-3xl tracking-widest text-center font-light mb-10">PAIR<span className="font-bold text-rose-500">MATE</span></h1>
        
        <div className="space-y-5">
          <input 
            type="text" placeholder="YOUR NAME" value={userName} onChange={(e) => setUserName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 px-5 py-4 text-white placeholder-white/30 focus:border-rose-500 focus:bg-white/10 transition-all text-center tracking-widest uppercase text-sm rounded-2xl outline-none"
          />
          {error && <p className="text-rose-500 text-xs text-center tracking-widest">{error}</p>}
          
          <button onClick={handleCreate} className="w-full bg-gradient-to-r from-rose-700 to-rose-500 hover:from-rose-600 hover:to-rose-400 text-white font-bold tracking-widest text-sm py-4 rounded-2xl shadow-[0_0_20px_rgba(244,63,94,0.2)] transition-all transform hover:scale-[1.02]">
            CREATE NEW PAIR
          </button>
          <button onClick={() => setView('join')} className="w-full bg-white/[0.02] hover:bg-white/5 border border-white/10 text-white/70 hover:text-white font-bold tracking-widest text-sm py-4 rounded-2xl transition-colors mt-2">
            JOIN EXISTING PAIR
          </button>
        </div>
      </div>
    </div>
  );

  const renderJoin = () => (
     <div className="flex flex-col items-center justify-center min-h-screen bg-[#030303] text-white p-6 font-sans overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-[100px] -bottom-32 -left-32 animate-[spin_20s_linear_infinite]"></div>
      
        <div className="z-10 max-w-sm w-full bg-black/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/[0.05] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <h2 className="text-2xl tracking-widest text-center font-light mb-10">JOIN <span className="font-bold text-indigo-500">PAIR</span></h2>
          <div className="space-y-5">
             <input type="text" placeholder="YOUR NAME" value={userName} onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-5 py-4 text-white placeholder-white/30 focus:border-indigo-500 focus:bg-white/10 transition-all text-center tracking-widest uppercase text-sm rounded-2xl outline-none" />
             <input type="text" placeholder="PAIR ID (8 CHARS)" value={pairId} onChange={(e) => setPairId(e.target.value.toUpperCase())} maxLength={8}
              className="w-full bg-white/5 border border-white/10 px-5 py-4 text-white placeholder-white/30 focus:border-indigo-500 focus:bg-white/10 transition-all text-center tracking-[0.3em] font-bold uppercase text-sm rounded-2xl outline-none" />
            
            {error && <p className="text-indigo-500 text-xs text-center tracking-widest">{error}</p>}
             
            <button onClick={handleJoin} className="w-full bg-gradient-to-r from-indigo-700 to-indigo-500 hover:from-indigo-600 hover:to-indigo-400 text-white font-bold tracking-widest text-sm py-4 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all transform hover:scale-[1.02]">
              CONNECT NOW
            </button>
            <button onClick={() => setView('home')} className="w-full text-white/50 hover:text-white font-bold tracking-widest text-sm py-3 transition-colors mt-2">
              CANCEL
            </button>
          </div>
        </div>
     </div>
  );

  const renderSession = () => {
    if (!pairData) return <div className="min-h-screen bg-[#030303] flex items-center justify-center"><Heart size={40} className="text-rose-500 animate-bounce" /></div>;

    const partnerId = userId === 1 ? 2 : 1;
    const myName = pairData[`user${userId}_name`] || userName;
    const myStatus = pairData[`user${userId}_status`] || 'FREE';
    const myNotifyMode = pairData[`user${userId}_notify_mode`];
    const partnerName = pairData[`user${partnerId}_name`];
    const partnerStatus = pairData[`user${partnerId}_status`];

    // Clear Distinction: Creator (1) is Ruby Rose, Joiner (2) is Sapphire Indigo
    const isCreator = userId === 1;
    
    const bgGradient = isCreator 
       ? 'bg-gradient-to-br from-[#1a050a] via-[#050002] to-black' 
       : 'bg-gradient-to-br from-[#050a1a] via-[#000205] to-black';
       
    const accentColor = isCreator ? 'bg-rose-600' : 'bg-indigo-600';
    const textAccent = isCreator ? 'text-rose-400' : 'text-indigo-400';
    const shadowAccent = isCreator ? 'shadow-[0_0_30px_rgba(225,29,72,0.4)]' : 'shadow-[0_0_30px_rgba(79,70,229,0.4)]';
    const glowRGB = isCreator ? '225,29,72' : '79,70,229';

    const blob1 = isCreator ? 'bg-rose-700' : 'bg-indigo-700';
    const blob2 = isCreator ? 'bg-pink-800' : 'bg-blue-800';

    return (
      <div className={`min-h-screen ${bgGradient} text-white flex flex-col items-center p-4 sm:p-8 font-sans overflow-hidden relative`}>
        {/* Ambient Neomorphic Blobs */}
        <div className={`absolute w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full blur-[120px] opacity-20 -top-20 -right-20 animate-pulse ${blob1}`}></div>
        <div className={`absolute w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full blur-[90px] opacity-[0.15] bottom-0 left-0 ${blob2}`}></div>

        <div className="max-w-3xl w-full flex flex-col gap-8 relative z-10 h-full">
          {/* Header */}
          <div className="flex justify-between items-center rounded-3xl p-2">
             <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-full px-5 py-2 flex items-center gap-3 shadow-lg">
               <span className="text-white/40 text-[10px] tracking-[0.3em] uppercase hidden sm:inline">PAIR ID</span>
               <span className={`text-sm tracking-[0.2em] font-bold ${textAccent}`}>{pairId}</span>
               <button onClick={copyPairId} className="ml-2 text-white/50 hover:text-white transition-colors">
                 {copied ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
               </button>
             </div>
             <button onClick={handleLeave} className="bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/5 p-3 rounded-full transition-all text-white/50 hover:text-white shadow-lg">
               <LogOut size={18}/>
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 mt-4">
            {/* My Status Card */}
            <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[3rem] p-8 border border-white/[0.05] flex flex-col items-center relative shadow-[inset_0_2px_20px_rgba(255,255,255,0.02)]">
               <h3 className="text-[10px] font-bold text-white/30 tracking-[0.4em] uppercase mb-10 w-full text-center">Your Status</h3>
               <h2 className="text-2xl font-light tracking-wide text-white mb-10">{myName}</h2>
               
               {/* 3D Neomorphic Toggle Switch container for Status */}
               <div className="bg-black/60 rounded-[2rem] p-2 flex w-full relative shadow-[inset_0_5px_20px_rgba(0,0,0,0.8)] border border-white/5 mb-10">
                 {/* Sliding Background */}
                 <div className={`absolute top-2 bottom-2 w-[calc(50%-8px)] rounded-[1.5rem] transition-all duration-500 ease-out ${myStatus === 'FREE' ? `left-2 ${accentColor} ${shadowAccent}` : 'left-[calc(50%+4px)] bg-neutral-800 shadow-lg'}`}></div>
                 
                 <button onClick={() => updateStatus('FREE')} className={`relative z-10 flex-1 py-5 text-xs tracking-widest font-bold transition-all duration-300 rounded-[1.5rem] ${myStatus === 'FREE' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
                   FREE
                 </button>
                 <button onClick={() => updateStatus('BUSY')} className={`relative z-10 flex-1 py-5 text-xs tracking-widest font-bold transition-all duration-300 rounded-[1.5rem] ${myStatus === 'BUSY' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
                   BUSY
                 </button>
               </div>

               {/* Notifications */}
               <div className="w-full mt-auto pt-8 border-t border-white/5">
                  <label className="flex items-center justify-between cursor-pointer group">
                     <div>
                       <div className={`text-xs font-bold tracking-widest uppercase transition-colors ${myNotifyMode !== 'SILENT' ? textAccent : 'text-white/40'}`}>
                         Notifications
                       </div>
                       <div className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">Ping me when they are free</div>
                     </div>
                     <div className={`w-14 items-center flex rounded-full p-1 transition-all duration-500 ${myNotifyMode !== 'SILENT' ? accentColor : 'bg-white/10'}`}>
                        <div className={`w-6 h-6 rounded-full bg-white shadow-lg transform transition-all duration-500 ${myNotifyMode !== 'SILENT' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                     </div>
                     <input type="checkbox" className="hidden" checked={myNotifyMode !== 'SILENT'} onChange={(e) => updateNotifyMode(e.target.checked ? 'BROWSER' : 'SILENT')} />
                  </label>
               </div>
            </div>

            {/* Partner's Status Card */}
            <div className="bg-white/[0.01] backdrop-blur-3xl rounded-[3rem] p-8 border border-white/[0.03] flex flex-col items-center relative shadow-[inset_0_2px_20px_rgba(255,255,255,0.01)] h-full justify-between">
               <h3 className="text-[10px] font-bold text-white/30 tracking-[0.4em] uppercase w-full text-center">Partner's Status</h3>
               
               {partnerName ? (
                 <>
                   <h2 className="text-2xl font-light tracking-wide text-white mt-6">{partnerName}</h2>
                   
                   <div className="flex-1 flex flex-col items-center justify-center w-full">
                     {/* Ambient representation of partner */}
                     <div className={`relative flex items-center justify-center w-48 h-48 rounded-full transition-all duration-[1500ms] ${partnerStatus === 'FREE' ? `scale-110 shadow-[0_0_80px_rgba(${glowRGB},0.3)]` : 'scale-95 grayscale opacity-30 shadow-none'}`}>
                        <div className={`absolute inset-0 rounded-full border border-white/10 ${partnerStatus === 'FREE' ? 'animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]' : ''}`}></div>
                        <div className={`absolute inset-2 space-y-2 rounded-full border border-white/5 ${partnerStatus === 'FREE' ? 'animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]' : ''}`}></div>
                        
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${partnerStatus === 'FREE' ? accentColor : 'bg-neutral-800'}`}>
                          <Heart size={40} className={`text-white transition-all duration-500 ${partnerStatus === 'FREE' ? 'animate-pulse fill-white' : 'opacity-40'}`} strokeWidth={partnerStatus === 'FREE' ? 0 : 2} />
                        </div>
                     </div>
                     
                     <p className={`mt-12 text-sm font-bold tracking-[0.3em] uppercase transition-colors duration-1000 ${partnerStatus === 'FREE' ? textAccent : 'text-white/30'}`}>
                       {partnerStatus === 'FREE' ? 'IS FREE' : 'IS BUSY'}
                     </p>
                   </div>
                 </>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                   <div className="w-24 h-24 rounded-full border border-dashed border-white/20 flex items-center justify-center mb-6">
                     <Heart size={30} className="opacity-50" />
                   </div>
                   <p className="text-[10px] uppercase tracking-[0.4em] font-bold">Waiting for Partner...</p>
                 </div>
               )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (view === 'home') return renderHome();
  if (view === 'join') return renderJoin();
  if (view === 'session') return renderSession();
  return null;
}

export default App;
