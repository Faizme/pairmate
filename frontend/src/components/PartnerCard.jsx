import React from 'react';
import { Heart } from 'lucide-react';

export const PartnerCard = ({ 
  partnerName, 
  partnerStatus, 
  glowRGB, 
  accentColor, 
  textAccent 
}) => {
  return (
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
                  {/* The heart icon will later be replaced by One-Tap Signals! */}
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
  );
};
