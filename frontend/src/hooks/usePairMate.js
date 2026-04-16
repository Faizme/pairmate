import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';

const API_BASE = 'https://pairmate-backend.onrender.com/api';

export function usePairMate() {
  const [view, setView] = useState('home'); 
  const [userName, setUserName] = useState('');
  const [pairId, setPairId] = useState('');
  const [userId, setUserId] = useState(null); 
  const [pairData, setPairData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const prevPartnerStatusRef = useRef(null);
  const pushActiveRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const expoToken = params.get('expo_token');
    if (expoToken) {
       window.EXPO_PUSH_TOKEN = expoToken;
    }

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

  const handleStatusChange = (newData, currentUserId) => {
    if (!currentUserId) return;
    const partnerId = currentUserId === 1 ? 2 : 1;
    const newPartnerStatus = newData[`user${partnerId}_status`];
    
    if (prevPartnerStatusRef.current === 'BUSY' && newPartnerStatus === 'FREE') {
      const myNotifyMode = newData[`user${currentUserId}_notify_mode`];
      if (myNotifyMode === 'BROWSER') {
        const pName = newData[`user${partnerId}_name`] || 'Partner';
        const message = `Hey! ${pName} is now FREE! ✨`;
        
        let blink = false;
        const blinker = setInterval(() => { document.title = blink ? message : "PairMate"; blink = !blink; }, 1000);
        setTimeout(() => clearInterval(blinker), 12000);

        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(()=>{});

        if (!pushActiveRef.current) {
           setTimeout(() => alert(message), 500);
        }
      }
    }
    prevPartnerStatusRef.current = newPartnerStatus;
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

  const saveSession = (pId, uId, uName) => { 
    localStorage.setItem('pairmate_session', JSON.stringify({pair_id: pId, user_id: uId, user_name: uName})); 
  }

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
       const permission = window.EXPO_PUSH_TOKEN ? 'granted' : await Notification.requestPermission();
       if (permission === 'granted') {
          try {
             if (window.EXPO_PUSH_TOKEN) {
                 fcmToken = window.EXPO_PUSH_TOKEN;
                 pushActiveRef.current = true;
                 alert("Native Push Notifications activated!");
             } else {
                 fcmToken = await getToken(messaging, { vapidKey: "BIWqAKnUvsGYv9GOWZIn2GShpBV8mhzSWF-NAo8OzrLLmI3hu875KENOynHmsDiMvSP0b-0K_cVQD_PCaBKsPXY" });
                 pushActiveRef.current = true;
                 new Notification('PairMate', { body: "Background push notifications successfully enabled!" });
             }
          } catch (e) {
             console.error("FCM Token fetch failed", e);
             pushActiveRef.current = false;
             alert("Background push blocked by your browser! We will use an in-browser alarm instead. Please keep this tab open!");
          }
       } else {
          alert("Notification permission denied! Please allow them in your browser Settings.");
          finalMode = 'SILENT';
       }
    } else if (mode === 'BROWSER' && window.EXPO_PUSH_TOKEN) {
       try {
           fcmToken = window.EXPO_PUSH_TOKEN;
           pushActiveRef.current = true;
           alert("Native Push Notifications activated!");
       } catch (e) {
           pushActiveRef.current = false;
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

  return {
    view, setView,
    userName, setUserName,
    pairId, setPairId,
    userId,
    pairData,
    error,
    copied,
    handleCreate,
    handleJoin,
    handleLeave,
    updateStatus,
    updateNotifyMode,
    copyPairId
  };
}
