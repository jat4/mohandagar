import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode, ExternalLink, Printer } from 'lucide-react';
import { Checkpoint, Race } from '../../types/race';
import { formatDistance } from '../../utils/raceCalculations';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  race: Race;
  checkpoint: Checkpoint;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  race,
  checkpoint
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  // Production domain clean URL format: https://mohandagar.in/join/{JOIN_CODE}
  const domain = 'https://mohandagar.in';
  const joinUrl = `${domain}/join/${encodeURIComponent(checkpoint.joinCode)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(checkpoint.joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePrint = () => {
    window.print();
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
        <div className="flex items-center gap-2.5 mb-1 text-cyan-400">
          <QrCode className="w-5 h-5" />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">Checkpoint Join Code & QR</span>
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-0.5">
          {checkpoint.name} ({formatDistance(checkpoint.distanceMeters, race.displayUnit)})
        </h3>
        <p className="text-xs text-slate-400 mb-5 font-mono">
          Race: <strong className="text-slate-200">{race.name}</strong> • Runner: <strong className="text-slate-200">{race.runnerName}</strong>
        </p>

        {/* QR Code Container */}
        <div className="bg-white p-6 rounded-2xl flex flex-col items-center justify-center shadow-inner mx-auto mb-5">
          <QRCodeSVG
            value={joinUrl}
            size={210}
            level="H"
            includeMargin={true}
            className="w-full max-w-[210px] h-auto"
          />
          <div className="mt-2 text-[11px] font-mono text-slate-700 font-semibold tracking-wider text-center">
            SCAN WITH PHONE CAMERA TO JOIN
          </div>
        </div>

        {/* Big Join Code Box */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Manual Join Code</div>
            <div className="text-2xl font-mono font-black text-cyan-300 tracking-wider">
              {checkpoint.joinCode}
            </div>
          </div>
          <button
            onClick={handleCopyCode}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleCopyLink}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied' : 'Copy Join Link'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print QR Card</span>
          </button>
        </div>

      </div>
    </div>
  );
};
