import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode, ExternalLink, Share2, Award, Printer } from 'lucide-react';
import { PublishedResult } from '../../types/race';

interface ResultQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: PublishedResult;
}

export const ResultQrCodeModal: React.FC<ResultQrCodeModalProps> = ({
  isOpen,
  onClose,
  result
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // Clean canonical public result URL: https://mohandagar.in/results/{resultId}
  const domain = window.location.origin.includes('localhost') 
    ? window.location.origin 
    : 'https://mohandagar.in';
  const resultUrl = `${domain}/results/${encodeURIComponent(result.id)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(resultUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${result.raceName} - Official Results for ${result.runnerName}`,
        text: `Official race time: ${result.totalTimeFormatted} over ${result.actualDistanceKm.toFixed(2)} km (Pace: ${result.averagePaceFormatted}).`,
        url: resultUrl
      }).catch(console.error);
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-2xl text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1 text-emerald-400">
          <Award className="w-5 h-5" />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">Public Race Result QR</span>
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-0.5 truncate">
          {result.raceName}
        </h3>
        <p className="text-xs text-slate-400 mb-5 font-mono">
          Runner: <strong className="text-slate-200">{result.runnerName}</strong> • Time: <strong className="text-cyan-400">{result.totalTimeFormatted}</strong>
        </p>

        {/* QR Code Container */}
        <div className="bg-white p-6 rounded-2xl flex flex-col items-center justify-center shadow-inner mx-auto mb-5">
          <QRCodeSVG
            value={resultUrl}
            size={210}
            level="H"
            includeMargin={true}
            className="w-full max-w-[210px] h-auto"
          />
          <div className="mt-2 text-[11px] font-mono text-slate-700 font-semibold tracking-wider text-center">
            SCAN TO VIEW OFFICIAL PUBLIC SPLITS
          </div>
        </div>

        {/* Link Box */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 mb-4">
          <div className="overflow-hidden">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Direct Result Link</div>
            <div className="text-xs font-mono text-cyan-300 truncate">
              {resultUrl}
            </div>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleNativeShare}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Link</span>
          </button>

          <button
            onClick={() => window.print()}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print QR</span>
          </button>
        </div>

      </div>
    </div>
  );
};
