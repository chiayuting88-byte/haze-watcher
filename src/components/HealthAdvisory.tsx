import React, { useState } from 'react';
import { AlertCircle, Check, HeartPulse, Home, Shield, Sparkles, UserCheck, Users } from 'lucide-react';
import { AirQualityBand, SingaporeRegion } from '../types/psi';
import { PSI_BANDS, getPsiBand, getRegionDisplayName } from '../utils/constants';

interface HealthAdvisoryProps {
  currentPsi: number;
  currentPm25: number;
  region: SingaporeRegion;
}

export const HealthAdvisory: React.FC<HealthAdvisoryProps> = ({
  currentPsi,
  currentPm25,
  region,
}) => {
  const [selectedPersona, setSelectedPersona] = useState<'healthy' | 'vulnerable' | 'chronic'>('healthy');
  const currentBand = getPsiBand(currentPsi);
  const bandMeta = PSI_BANDS[currentBand];

  return (
    <div id="advisory-section" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Official NEA Health Advisory
            </h2>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{ backgroundColor: `${bandMeta.color}20`, color: bandMeta.color }}
            >
              Current: {bandMeta.label} ({currentPsi} PSI)
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Guidance based on Singapore Ministry of Health (MOH) & NEA haze guidelines for {getRegionDisplayName(region)}
          </p>
        </div>

        {/* Persona Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setSelectedPersona('healthy')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedPersona === 'healthy'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Healthy Persons</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPersona('vulnerable')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedPersona === 'vulnerable'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Elderly & Children</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPersona('chronic')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedPersona === 'chronic'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Chronic Illness</span>
          </button>
        </div>
      </div>

      {/* Advisory Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {/* Card 1: Outdoor Activity */}
        <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Outdoor Exertion</span>
          </div>

          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
            {currentBand === 'good' && 'Normal Outdoor Activities'}
            {currentBand === 'moderate' && (selectedPersona === 'chronic' ? 'Reduce Strenuous Exertion' : 'Normal Activities')}
            {currentBand === 'unhealthy' && (
              selectedPersona === 'healthy'
                ? 'Reduce Prolonged Strenuous Exertion'
                : 'Minimise Outdoor Exertion'
            )}
            {currentBand === 'very_unhealthy' && (
              selectedPersona === 'healthy'
                ? 'Avoid Prolonged Strenuous Exertion'
                : 'Strictly Avoid Outdoor Activity'
            )}
            {currentBand === 'hazardous' && 'Minimise All Outdoor Activity'}
          </h3>

          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {selectedPersona === 'healthy' && (
              currentPsi <= 100
                ? 'No restrictions on running, cycling, or outdoor sports. Enjoy normal activities.'
                : currentPsi <= 200
                ? 'Take frequent indoor hydration breaks. Avoid long marathon runs or intense outdoor workouts in mid-afternoon peak hours.'
                : 'Move training indoors or into gym facilities with air filtration.'
            )}

            {selectedPersona === 'vulnerable' && (
              currentPsi <= 50
                ? 'Safe for school recesses, playground activities, and outdoor walks.'
                : currentPsi <= 100
                ? 'Children and elderly should stay hydrated and take rests if feeling breathlessness.'
                : 'Limit outdoor playtime and outdoor excursions. Keep school activities within sheltered, air-conditioned areas.'
            )}

            {selectedPersona === 'chronic' && (
              currentPsi <= 50
                ? 'Normal routine permitted. Keep prescribed reliever inhalers accessible.'
                : currentPsi <= 100
                ? 'Monitor for chest tightness or wheezing. Avoid heavy outdoor physical labour.'
                : 'Stay indoors in air-conditioned environments. Consult your physician if respiratory symptoms worsen.'
            )}
          </p>
        </div>

        {/* Card 2: N95 Mask Guidance */}
        <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>N95 Mask Recommendation</span>
          </div>

          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
            {currentBand === 'good' && 'No Mask Needed'}
            {currentBand === 'moderate' && 'No Mask Needed for General Public'}
            {currentBand === 'unhealthy' && 'N95 Advised for Prolonged Outdoor Work'}
            {currentBand === 'very_unhealthy' && 'N95 Respirator Strongly Recommended'}
            {currentBand === 'hazardous' && 'N95 Mask Mandatory Outdoors'}
          </h3>

          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {currentPsi <= 100 ? (
              'Surgical or cloth masks do not filter fine PM2.5 particulates. Given current good air quality, no respiratory protection is required.'
            ) : currentPsi <= 200 ? (
              'An N95 mask is appropriate for individuals requiring prolonged exposure outdoors (e.g. delivery riders, traffic officers, construction workers).'
            ) : (
              'Ensure a snug facial seal. N95 respirators increase breathing resistance; elderly and pregnant women should rest if feeling light-headed.'
            )}
          </p>
        </div>

        {/* Card 3: Indoor Environment & Windows */}
        <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
            <Home className="w-3.5 h-3.5 text-blue-600" />
            <span>Indoor Environment</span>
          </div>

          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
            {currentPsi <= 100 ? 'Natural Ventilation Permitted' : 'Close Windows & Run HEPA Filters'}
          </h3>

          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {currentPsi <= 50 ? (
              'Windows and louvers can remain open for fresh tropical ventilation.'
            ) : currentPsi <= 100 ? (
              'Air conditioning or fans can be used normally. Run air purifiers on auto mode.'
            ) : (
              'Keep windows and doors closed. Use air-conditioners set to internal air recirculation and turn HEPA air purifiers to high setting.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
