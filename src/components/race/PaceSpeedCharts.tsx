import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar,
  Cell
} from 'recharts';
import { MeasuredSegment, ProcessedCheckpointResult } from '../../types/race';
import { formatPace, formatSpeed } from '../../utils/raceCalculations';
import { TrendingUp, Gauge, AlertTriangle, Layers } from 'lucide-react';

interface PaceSpeedChartsProps {
  measuredSegments: MeasuredSegment[];
  processedCheckpoints: ProcessedCheckpointResult[];
}

export const PaceSpeedCharts: React.FC<PaceSpeedChartsProps> = ({
  measuredSegments,
  processedCheckpoints
}) => {
  const [activeTab, setActiveTab] = useState<'pace' | 'speed' | 'splits'>('pace');

  // Format data for chart points
  const paceChartData = measuredSegments.map((seg, idx) => {
    const paceMinutes = seg.segmentPaceSecondsPerKm / 60;
    const label = seg.isMultiCheckpointSpan
      ? `${seg.fromCheckpointName} → ${seg.toCheckpointName} (${seg.segmentDistanceKm} km - Span)`
      : `${seg.toCheckpointName} (${seg.segmentDistanceKm} km)`;

    return {
      index: idx + 1,
      name: seg.toCheckpointName,
      segmentLabel: label,
      distanceKm: (seg.toDistanceMeters / 1000).toFixed(2),
      paceMinutes: Number(paceMinutes.toFixed(2)),
      paceFormatted: seg.segmentPaceFormatted,
      speedKmh: Number(seg.segmentSpeedKmh.toFixed(2)),
      speedFormatted: seg.segmentSpeedFormatted,
      isMultiSpan: seg.isMultiCheckpointSpan,
      missedCount: seg.missedCheckpointsCount
    };
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
      
      {/* Chart Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span>Race Performance Charts</span>
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Actual measured distance segments (Missed checkpoints do not fabricate data)
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('pace')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'pace'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pace (min/km)
          </button>
          <button
            onClick={() => setActiveTab('speed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'speed'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Speed (km/h)
          </button>
          <button
            onClick={() => setActiveTab('splits')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'splits'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Segment Bars
          </button>
        </div>
      </div>

      {paceChartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl">
          <Layers className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-sm text-slate-400 font-mono">No split segments recorded yet.</p>
          <p className="text-xs text-slate-600 font-mono mt-1">Charts will render automatically as checkpoints are recorded.</p>
        </div>
      ) : (
        <div className="h-72 w-full">
          {activeTab === 'pace' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={paceChartData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="distanceKm" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickFormatter={(val) => `${val}km`}
                  label={{ value: 'Distance (km)', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => {
                    const min = Math.floor(val);
                    const sec = Math.round((val - min) * 60);
                    return `${min}:${String(sec).padStart(2, '0')}`;
                  }}
                  label={{ value: 'Pace (min/km)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11, offset: 15 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-mono text-slate-100">
                          <div className="font-bold text-cyan-400 mb-1">{data.segmentLabel}</div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Pace:</span>
                            <span className="font-bold text-slate-100">{data.paceFormatted}</span>
                          </div>
                          <div className="flex justify-between gap-4 mt-0.5">
                            <span className="text-slate-400">Cumulative:</span>
                            <span>{data.distanceKm} km</span>
                          </div>
                          {data.isMultiSpan && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-amber-400 flex items-center gap-1 text-[11px]">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Spans {data.missedCount} missed checkpoint(s)</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="paceMinutes" 
                  stroke="#06b6d4" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'speed' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={paceChartData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="distanceKm" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickFormatter={(val) => `${val}km`}
                  label={{ value: 'Distance (km)', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickFormatter={(val) => `${val} km/h`}
                  label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11, offset: 15 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-mono text-slate-100">
                          <div className="font-bold text-emerald-400 mb-1">{data.segmentLabel}</div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Speed:</span>
                            <span className="font-bold text-slate-100">{data.speedFormatted}</span>
                          </div>
                          <div className="flex justify-between gap-4 mt-0.5">
                            <span className="text-slate-400">Cumulative:</span>
                            <span>{data.distanceKm} km</span>
                          </div>
                          {data.isMultiSpan && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-amber-400 flex items-center gap-1 text-[11px]">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Spans {data.missedCount} missed checkpoint(s)</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="speedKmh" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#34d399' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'splits' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paceChartData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `${val} km/h`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-mono text-slate-100">
                          <div className="font-bold text-cyan-400 mb-1">{data.segmentLabel}</div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Pace:</span>
                            <span className="font-bold text-slate-100">{data.paceFormatted}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Speed:</span>
                            <span className="font-bold text-emerald-400">{data.speedFormatted}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="speedKmh" radius={[6, 6, 0, 0]}>
                  {paceChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isMultiSpan ? '#f59e0b' : '#06b6d4'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Missed Checkpoints Legend Note */}
      {processedCheckpoints.some((p) => p.status === 'MISSED') && (
        <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300 font-mono">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            Note: One or more checkpoints were missed. The charts strictly plot measured spans (e.g. CP1 → CP3) without fabricating fake data.
          </span>
        </div>
      )}

    </div>
  );
};
