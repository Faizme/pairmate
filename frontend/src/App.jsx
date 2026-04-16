import React from 'react';
import { Heart, LogOut, Copy, Check } from 'lucide-react';
import { usePairMate } from './hooks/usePairMate';
import { StatusCard } from './components/StatusCard';
import { PartnerCard } from './components/PartnerCard';

const App = () => {
  const {
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
    copyPairId,
    perfectMoment
  } = usePairMate();

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
    const myStatus = pairData[`user${userId}_status`] || 'BUSY';
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
          
          {/* Perfect Moment Banner */}
          {perfectMoment && (
             <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-in-out">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-0.5 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.4)] animate-pulse">
                   <div className="bg-black/90 backdrop-blur-xl px-8 py-5 rounded-xl flex flex-col items-center gap-4">
                      <span className="text-sm font-bold tracking-widest text-white uppercase text-center">👀 You both are free right now!</span>
                      <a href="tel:" className="w-full bg-white text-black font-bold tracking-widest py-3 px-6 rounded-lg text-xs hover:bg-green-100 transition-colors text-center shadow-lg">
                         CALL NOW
                      </a>
                   </div>
                </div>
             </div>
          )}

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
             <StatusCard
               myName={myName}
               myStatus={myStatus}
               myNotifyMode={myNotifyMode}
               updateStatus={updateStatus}
               updateNotifyMode={updateNotifyMode}
               accentColor={accentColor}
               shadowAccent={shadowAccent}
               textAccent={textAccent}
             />
             <PartnerCard
               partnerName={partnerName}
               partnerStatus={partnerStatus}
               partnerLastActive={pairData[`user${partnerId}_last_active`]}
               glowRGB={glowRGB}
               accentColor={accentColor}
               textAccent={textAccent}
             />
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
