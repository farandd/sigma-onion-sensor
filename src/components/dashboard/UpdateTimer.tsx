import { RefreshCw, Clock } from 'lucide-react';

interface UpdateTimerProps {
  nextUpdateIn: number;
  lastUpdated: Date;
  refreshInterval?: number;
  scheduleLabel?: string;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDate(date: Date): string {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function UpdateTimer({
  nextUpdateIn,
  lastUpdated,
  refreshInterval = 6 * 60 * 60 * 1000,
  scheduleLabel = '6h Update Cycle',
}: UpdateTimerProps) {
  const progress = refreshInterval > 0 ? ((refreshInterval - nextUpdateIn) / refreshInterval) * 100 : 100;

  return (
    /* REVISI: Border-gray-100 diubah ke black/5 agar lebih halus sesuai gaya Bento UI profesional */
    <div className="bg-white rounded-[1.5rem] px-5 py-4 shadow-sm border border-black/[0.04] flex items-center gap-4 transition-all hover:shadow-md">
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center w-8 h-8">
          {/* REVISI: Indicator Live diganti ke Hijau Hutan (primary) */}
          <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
          <div className="absolute w-5 h-5 border-2 border-primary rounded-full animate-ping opacity-20" />
        </div>
        <div>
          {/* REVISI: Label menggunakan uppercase, black, dan neutral-muted sesuai desain Vivid Earth */}
          <p className="text-[10px] text-neutral-muted leading-none font-black uppercase italic tracking-widest opacity-50">Status Sistem</p>
          <p className="text-sm font-black text-primary mt-0.5 uppercase italic">MODE AKTIF</p>
        </div>
      </div>

      <div className="w-px h-8 bg-black/[0.05]" />

      <div className="flex items-center gap-2">
        {/* REVISI: Icon Clock mengikuti warna neutral-muted (abu-abu kehijauan) */}
        <Clock className="w-4 h-4 text-neutral-muted" />
        <div>
          <p className="text-[10px] text-neutral-muted leading-none font-black uppercase italic tracking-widest opacity-50">Jadwal Sinkron</p>
          <p className="text-sm font-bold text-gray-800 mt-0.5 font-mono">{formatTime(nextUpdateIn)}</p>
        </div>
      </div>

      <div className="flex-1 hidden sm:block">
        <div className="flex justify-between text-[10px] font-black text-neutral-muted mb-2 uppercase italic tracking-widest opacity-40 px-1">
          <span>{scheduleLabel}</span>
          <span>{Math.round(progress)}% Selesai</span>
        </div>
        <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden border border-black/[0.03]">
          <div
            /* REVISI: Bar pembaruan diganti warnanya ke Secondary (Biru Langit #0288D1) agar terlihat berbeda dengan indikator Status yang sudah Hijau */
            className="h-full bg-secondary rounded-full transition-all duration-1000 shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-neutral-muted shrink-0 pl-2">
        <RefreshCw className="w-3.5 h-3.5 opacity-60" />
        <div className="text-right">
          <p className="text-[9px] font-black uppercase opacity-40 italic tracking-widest leading-none">Catatan Terakhir</p>
          <span className="text-xs font-bold text-gray-500 italic">{formatDate(lastUpdated)}</span>
        </div>
      </div>
    </div>
  );
}
