import { motion } from 'framer-motion';
import { Activity, BookOpen, TrendingUp, Zap, Leaf, Smartphone, MonitorSpeaker, BrainCircuit } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

const navigationCards = [
  {
    id: 'portable',
    title: 'Monitoring Lahan',
    description: 'Pantau data sensor IoT real-time dari lahan Anda',
    shortDesc: 'Data Real-Time',
    icon: Smartphone,
    color: 'from-accent-straken via-accent-rosemary to-secondary',
    accentColor: 'straken',
    bgGradient: 'from-neutral-surface/70 to-accent-rosemary/20',
    iconBg: 'bg-accent-rosemary/20',
    iconColor: 'text-accent-straken',
    mode: 'portable' as const,
  },
  {
    id: 'panel',
    title: 'Monitoring Lapangan',
    description: 'Monitoring terpusat dari semua sensor IoT lahan',
    shortDesc: 'Data Real-Time',
    icon: MonitorSpeaker,
    color: 'from-secondary-light via-tertiary to-accent-straken',
    accentColor: 'rosemary',
    bgGradient: 'from-secondary-light/25 to-neutral-surface/70',
    iconBg: 'bg-tertiary/15',
    iconColor: 'text-tertiary',
    mode: 'panel' as const,
  },
  {
    id: 'ai-analysis',
    title: 'Analisis Lapangan',
    description: 'Deteksi penyakit tanaman menggunakan Machine Learning',
    shortDesc: 'AI Detection',
    icon: BrainCircuit,
    color: 'from-accent-texture via-accent-viola to-accent-melrose',
    accentColor: 'viola',
    bgGradient: 'from-accent-melrose/25 to-neutral-surface/80',
    iconBg: 'bg-accent-melrose/30',
    iconColor: 'text-accent-texture',
  },
  {
    id: 'history',
    title: 'Rekam Medis Tanaman',
    description: 'Lihat riwayat hasil deteksi dan data monitoring',
    shortDesc: 'Historical Data',
    icon: BookOpen,
    color: 'from-accent-rosemary via-accent-straken to-secondary',
    accentColor: 'texture',
    bgGradient: 'from-accent-rosemary/20 to-neutral-surface/80',
    iconBg: 'bg-accent-rosemary/20',
    iconColor: 'text-accent-straken',
  },
] as const;

type CardId = 'portable' | 'panel' | 'ai-analysis' | 'history';

export default function HomePage() {
  const { setActivePage, setActiveMode } = useApp();
  const { profile } = useAuth();

  const handleNavigate = (cardId: CardId) => {
    if (cardId === 'portable' || cardId === 'panel') {
      setActiveMode(cardId);
      setActivePage('dashboard');
    } else if (cardId === 'ai-analysis') {
      setActivePage('ai-analysis');
    } else if (cardId === 'history') {
      setActivePage('history');
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 19 ? 'Selamat Sore' : 'Selamat Malam';
  const fullName = profile?.full_name?.trim() || 'Petani';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  const statVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-accent-melrose/30 to-accent-viola/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-accent-rosemary/25 to-accent-straken/20 rounded-full blur-3xl"
        />
      </div>

      <div className="space-y-12 pb-12">
        {/* Hero Section with Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 60 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-straken/10 via-accent-viola/15 to-accent-melrose/20 rounded-3xl blur-2xl" />
          <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl border border-white/20 p-10 shadow-2xl shadow-black/5">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-br from-accent-melrose to-accent-viola rounded-full shadow-lg"
            />

            <div className="space-y-4">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm font-bold uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-accent-straken to-accent-texture"
              >
                🧑‍🌾 Pantau kondisi lahan hari ini
              </motion.p>

              <div className="space-y-2">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter leading-tight"
                >
                  {greeting}, <span className="bg-gradient-to-r from-accent-straken to-accent-texture bg-clip-text text-transparent">{fullName}</span>! 
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="text-lg text-gray-600 max-w-2xl leading-relaxed font-medium"
                >
                  Kelola lahan dengan presisi tinggi menggunakan teknologi{' '}
                  <span className="font-bold text-accent-straken">IoT Terintegrasi</span> dan{' '}
                  <span className="font-bold text-accent-texture">AI Model</span> untuk hasil panen optimal.
                </motion.p>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Main Navigation Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {navigationCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                variants={cardVariants}
                whileHover={{ y: -12, scale: 1.02 }}
                onClick={() => handleNavigate(card.id as CardId)}
                className="group cursor-pointer relative"
              >
                {/* Animated Gradient Border */}
                <motion.div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-100 blur`}
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />

                <div className={`relative rounded-2xl bg-gradient-to-br ${card.bgGradient} backdrop-blur-sm border border-white/30 overflow-hidden shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:border-white/50 h-full`}>
                  {/* Gradient Overlay on Hover */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  />

                  <div className="relative p-8 h-full flex flex-col">
                    {/* Header with Icon and Stats */}
                    <div className="flex items-start justify-between mb-6">
                      <motion.div
                        className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center transition-all duration-300 group-hover:scale-125 group-hover:rotate-12`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Icon className={`w-7 h-7 ${card.iconColor}`} />
                      </motion.div>
                    </div>

                    {/* Title and Description */}
                    <div className="flex-1 mb-6">
                      <h3 className="text-2xl font-black text-gray-900 mb-2">
                        {card.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed font-medium">{card.description}</p>
                    </div>

                    {/* Footer CTA */}
                    <div className="flex items-center justify-between pt-6 border-t border-white/40">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">{card.shortDesc}</span>
                      <motion.div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:scale-110`}
                        whileHover={{ x: 6, rotate: 90 }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Features Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12"
        >
          {[
            { icon: Activity, label: 'Real-time Monitoring', desc: 'Pantau Perubahan', color: 'straken' },
            { icon: Zap, label: 'AI Deteksi Akurat', desc: '99% Presisi', color: 'viola' },
            { icon: Leaf, label: 'Data Sensor IoT', desc: 'Multi-parameter', color: 'rosemary' },
            { icon: TrendingUp, label: 'Insights Analytics', desc: 'Prediksi Akurat', color: 'texture' },
          ].map((feature, idx) => {
            const Icon = feature.icon;
            const colorMap: Record<string, string> = {
              straken: 'from-accent-straken to-secondary',
              viola: 'from-accent-viola to-accent-texture',
              rosemary: 'from-accent-rosemary to-accent-straken',
              texture: 'from-accent-texture to-accent-melrose',
            };

            return (
              <motion.div
                key={idx}
                variants={statVariants}
                className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl p-5 hover:border-white/60 transition-all duration-300 group cursor-pointer"
              >
                <motion.div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[feature.color]} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}
                  whileHover={{ rotate: 12 }}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
                <p className="font-bold text-gray-900 text-sm">{feature.label}</p>
                <p className="text-xs text-gray-500 mt-1">{feature.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-straken via-accent-rosemary to-accent-viola rounded-3xl" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl"
          />

          <div className="relative bg-black/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center text-white">
            <h2 className="text-3xl font-black mb-2">Siap Mulai?</h2>
            <p className="text-white/90 mb-6">Pilih salah satu modul di atas untuk memulai optimalisasi lahan Anda</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigate('portable')}
              className="px-8 py-3 bg-neutral-surface text-primary font-bold rounded-xl hover:shadow-xl transition-all duration-300"
            >
              Mulai Sekarang →
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
