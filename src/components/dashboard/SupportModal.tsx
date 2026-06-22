import React, { useState } from 'react';
import { X, Star, Send, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { user } = useAuth();
  const { push } = useNotification();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      push({ type: 'warning', title: 'Perhatian', message: 'Mohon berikan rating terlebih dahulu.' });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('feedback').insert([
      { user_id: user?.id, rating, message }
    ]);

    setIsSubmitting(false);
    if (error) {
      push({ type: 'error', title: 'Gagal', message: 'Gagal mengirim feedback.' });
    } else {
      push({ type: 'success', title: 'Terima Kasih', message: 'Feedback Anda telah kami terima.' });
      onClose();
      setRating(0);
      setMessage('');
    }
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/6282331050089', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl relative p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 rounded-full">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-gray-800 mb-4">Support Kami</h3>
        
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-2">Beri penilaian aplikasi:</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-8 h-8 cursor-pointer ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tulis saran atau keluhan Anda..."
          className="w-full h-24 p-3 bg-gray-50 rounded-xl text-sm mb-4 border border-gray-100 focus:border-primary outline-none"
        />

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 mb-6"
        >
          {isSubmitting ? 'Mengirim...' : <><Send className="w-4 h-4" /> Kirim Feedback</>}
        </button>

        <div className="pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Ingin mengetahui kami lebih dalam?</p>
          <button onClick={openWhatsApp} className="w-full py-2 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
            <MessageCircle className="w-4 h-4" /> Chat via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
