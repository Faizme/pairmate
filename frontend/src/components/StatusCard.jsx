import React from 'react';

export const StatusCard = ({ 
  myName, 
  myStatus, 
  myNotifyMode, 
  updateStatus, 
  updateNotifyMode, 
  accentColor, 
  shadowAccent, 
  textAccent 
}) => {
  return (
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
  );
};
