import { motion } from 'framer-motion';
import maskot from '../assets/maskot-sigma.png';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-neutral-surface flex items-center justify-center p-6 font-sans">
      <div className="flex flex-col items-center max-w-sm w-full text-center">
        {/* MASKOT DENGAN ANIMASI MENGAPUNG (Floating Animation) */}
        <motion.img
          src={maskot}
          alt="SIGMA Mascot"
          className="w-64 h-64 md:w-72 md:h-72 object-contain mb-8 drop-shadow-2xl"
          /* Efek animasi mascot bergerak naik turun perlahan */
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* TEKS LOADING PROFESIONAL GAYA REFERENSI */}
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-primary tracking-tighter uppercase italic">
            Mohon tunggu sebentar
          </h3>
          <p className="text-neutral-muted font-bold text-xs md:text-sm tracking-widest italic opacity-60 px-4 leading-relaxed">
            SIGMA sedang menyiapkan data lahan <br className="hidden md:block"/> paling akurat untuk anda! 🌿💤
          </p>
        </div>

        {/* INDICATOR PROGRESS BAR MINIMALIS */}
        <div className="w-32 h-1 bg-black/5 rounded-full overflow-hidden mt-10">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 italic opacity-50">
          Secure Infrastructure Loading
        </p>
      </div>
    </div>
  );
}
