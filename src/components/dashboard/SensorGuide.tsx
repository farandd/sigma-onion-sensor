import React from 'react';
import { SENSOR_CONFIGS } from '../../constants/sensors';
import { BookOpen } from 'lucide-react';

const SENSOR_KNOWLEDGE: Record<string, { low_reason: string; high_reason: string; tip: string }> = {
  moisture: { 
    low_reason: 'Tanah kering, irigasi kurang.',
    high_reason: 'Drainase buruk, air menggenang.',
    tip: 'Jaga kelembaban stabil agar akar tidak stres.' 
  },
  nitrogen: { 
    low_reason: 'Unsur hara habis terserap.',
    high_reason: 'Pemupukan urea berlebihan.',
    tip: 'Sesuaikan dosis pupuk dengan fase pertumbuhan.' 
  },
  phosphorus: { 
    low_reason: 'pH tanah tidak sesuai.',
    high_reason: 'Akumulasi residu pupuk.',
    tip: 'Pastikan Fosfor tercukupi saat fase awal perakaran.' 
  },
  potassium: { 
    low_reason: 'Nutrisi sering tercuci air.',
    high_reason: 'Pemupukan K berlebihan.',
    tip: 'Penting untuk pembesaran umbi bawang.' 
  },
  temperature: { 
    low_reason: 'Cuaca dingin/mendung.',
    high_reason: 'Sinar matahari ekstrem.',
    tip: 'Gunakan mulsa untuk stabilkan suhu tanah.' 
  },
  ph: { 
    low_reason: 'Tanah terlalu asam.',
    high_reason: 'Tanah terlalu basa.',
    tip: 'Gunakan dolomit untuk menaikkan pH.' 
  },
  conductivity: { 
    low_reason: 'Nutrisi tanah sangat minim.',
    high_reason: 'Garam/pupuk terlalu tinggi.',
    tip: 'Bilas tanah jika EC terlalu tinggi.' 
  },
};

export default function SensorGuide() {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-black/[0.03] p-6 space-y-6">
      <h3 className="text-xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-tight">
        <BookOpen className="w-6 h-6 text-primary" /> Keterangan Parameter Sensor
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SENSOR_CONFIGS.map((config) => {
          const knowledge = SENSOR_KNOWLEDGE[config.key] || { low_reason: '-', high_reason: '-', tip: '-' };
          return (
            <div key={config.key} className="bg-gray-50 p-4 rounded-2xl border border-black/[0.03] space-y-3">
              <p className="text-sm font-black text-gray-800">{config.label === 'pH Tanah' ? 'pH Tanah' : `${config.label} (${config.unit})`}</p>
              
              <div className="space-y-2 text-[10px] font-medium text-gray-600">
                {/* Rendah */}
                <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <div>
                        <span className="font-bold text-amber-600">Rendah (&lt;{config.goodMin}): </span>
                        <span>{knowledge.low_reason}</span>
                    </div>
                </div>
                {/* Optimal */}
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-bold text-emerald-600">Optimal ({config.goodMin}-{config.goodMax})</span>
                </div>
                {/* Tinggi */}
                <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
                    <div>
                        <span className="font-bold text-red-600">Tinggi (&gt;{config.goodMax}): </span>
                        <span>{knowledge.high_reason}</span>
                    </div>
                </div>
              </div>

              <div className="text-[10px] text-gray-700 bg-white p-2 rounded-lg border border-black/[0.02]">
                <p className="font-black text-primary">Tips:</p>
                <p className="italic">{knowledge.tip}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
