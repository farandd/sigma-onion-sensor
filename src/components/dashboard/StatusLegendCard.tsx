import React from 'react';

export default function StatusLegendCard() {
  const items = [
    { label: 'Optimal', color: 'bg-emerald-500' },
    { label: 'Rendah', color: 'bg-amber-500' },
    { label: 'Tinggi', color: 'bg-red-500' },
  ];
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/[0.03] p-4 flex flex-col justify-center items-center w-full sm:w-auto self-start">
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Warna Indikator</h3>
      <div className="flex flex-col gap-2 w-full">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-[11px] font-bold text-gray-500 capitalize">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
