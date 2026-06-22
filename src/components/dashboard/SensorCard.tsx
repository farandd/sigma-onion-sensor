import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import SensorGauge from './SensorGauge';
import { SensorConfig } from '../../types';

interface SensorCardProps {
  config: SensorConfig;
  value: number;
  prevValue?: number;
  index: number;
}

export default function SensorCard({ config, value, prevValue, index }: SensorCardProps) {
  const { label, unit, min, max, goodMin, goodMax } = config;
  const diff = prevValue !== undefined ? value - prevValue : 0;

  const TrendIcon = diff > 0.5 ? TrendingUp : diff < -0.5 ? TrendingDown : Minus;
  const trendColor = diff > 0.5 ? 'text-primary' : diff < -0.5 ? 'text-red-500' : 'text-neutral-muted';

  const displayValue = value != null 
  ? (config.key === 'conductivity'
      ? value.toFixed(3)
      : config.key === 'ph'
      ? value.toFixed(2)
      : value.toFixed(1))
  : '0.0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="bg-white rounded-3xl p-5 shadow-sm border border-black/[0.03] hover:shadow-x1 hover:shadow-black/5 transition-all duration-300 group"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
      </div>

      <div className="flex flex-col items-center">
        <SensorGauge value={value} min={min} max={max} goodMin={goodMin} goodMax={goodMax} size={150} />
        <div className="text-center mt-2">
          <div className="flex items-baseline gap-1 justify-center">
            <span className="text-4xl font-semibold text-gray-800 tracking-tighter" style={{ transition: 'all 1s ease' }}>
              {displayValue}
            </span>
            <span className="text-sm text-gray-400 font-medium">{unit}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
