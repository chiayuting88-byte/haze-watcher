import React from 'react';
import { CloudRain, Flame, Radio, ShieldCheck, Sparkles, Wind } from 'lucide-react';
import { SIMULATION_SCENARIOS } from '../services/psiApi';

interface SimulationControlsProps {
  currentSource: 'live_gov_sg' | 'simulation' | 'cached';
  activeScenario: string | null;
  onSelectScenario: (scenario: keyof typeof SIMULATION_SCENARIOS | null) => void;
  lastUpdated: string;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  currentSource,
  activeScenario,
  onSelectScenario,
  lastUpdated,
}) => {
  return (
    <div className="bg-neutral-900 text-white border-b border-neutral-800 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Data Feed:</span>
          </span>
          <span className="font-mono text-neutral-400">
            {currentSource === 'live_gov_sg' ? 'Live data.gov.sg API' : 'Scenario Simulation'}
          </span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-400 text-[11px] font-mono">
            Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Quick Simulation Trigger Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] text-neutral-400 mr-1 hidden sm:inline">
            Test Alert State:
          </span>

          <button
            type="button"
            onClick={() => onSelectScenario(null)}
            className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              currentSource === 'live_gov_sg' && !activeScenario
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
          >
            Live Gov Feed
          </button>

          <button
            type="button"
            onClick={() => onSelectScenario('unhealthy_alert')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 whitespace-nowrap ${
              activeScenario === 'unhealthy_alert'
                ? 'bg-orange-600 text-white font-semibold shadow-xs'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
          >
            <Flame className="w-3 h-3 text-orange-400" />
            <span>Simulate Unhealthy (PSI 126)</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectScenario('severe_haze')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 whitespace-nowrap ${
              activeScenario === 'severe_haze'
                ? 'bg-red-700 text-white font-semibold shadow-xs'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
          >
            <Flame className="w-3 h-3 text-red-400" />
            <span>Simulate Severe (PSI 218)</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectScenario('clean')}
            className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              activeScenario === 'clean'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
          >
            Clean Marine (PSI 28)
          </button>
        </div>
      </div>
    </div>
  );
};
