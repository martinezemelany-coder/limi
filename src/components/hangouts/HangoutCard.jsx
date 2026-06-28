import React from 'react';
import { MapPin, Clock, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { db } from '@/api/client';
import { doc, updateDoc } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const categoryEmojis = {
  brunch: '🥞', shopping: '🛍️', movie: '🎬', workout: '💪',
  study: '📚', party: '🎉', cafe: '☕', spa: '🧖‍♀️', travel: '✈️', other: '✨'
};

const categoryGradients = {
  brunch: 'from-pink-300 to-rose-300',
  shopping: 'from-rose-300 to-pink-400',
  movie: 'from-pink-400 to-pink-300',
  workout: 'from-rose-400 to-pink-300',
  study: 'from-pink-200 to-rose-300',
  party: 'from-pink-300 to-rose-400',
  cafe: 'from-rose-200 to-pink-300',
  spa: 'from-pink-200 to-pink-300',
  travel: 'from-rose-300 to-pink-400',
  other: 'from-pink-300 to-rose-300',
};

export default function HangoutCard({ hangout, currentUserEmail }) {
  const queryClient = useQueryClient();

  const isAttending = hangout.attendees?.some(a => a.email === currentUserEmail);
  const isFull = hangout.attendees?.length >= (hangout.max_attendees || 10);
  const spotsLeft = (hangout.max_attendees || 10) - (hangout.attendees?.length || 0);
  const grad = categoryGradients[hangout.category] || 'from-primary to-chart-2';

  const handleJoin = async () => {
    try {
      const postRef = doc(db, 'hangouts', hangout.id);

      if (isAttending) {
        const newAttendees = hangout.attendees.filter(a => a.email !== currentUserEmail);

        await updateDoc(postRef, { attendees: newAttendees });
        toast.success('Left the hangout');
      } else {
        const newAttendees = [
          ...(hangout.attendees || []),
          {
            email: currentUserEmail,
            name: currentUserEmail?.split('@')[0],
          },
        ];

        await updateDoc(postRef, { attendees: newAttendees });
        toast.success("You're going! 🎉");
      }

      queryClient.invalidateQueries({ queryKey: ['hangouts'] });

    } catch (error) {
      console.error('Error updating attendees:', error);
      toast.error('Something went wrong');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-border/40 hover:shadow-md transition-all"
    >
      {/* (UI stays EXACTLY the same below) */}

      <div className={`bg-gradient-to-r ${grad} p-5 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/10 translate-y-6 -translate-x-4" />
        
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="text-3xl mb-1">{categoryEmojis[hangout.category] || '✨'}</div>
            <h3 className="font-outfit font-bold text-white text-lg">{hangout.title}</h3>
            <span className="inline-block mt-1.5 text-[11px] font-semibold text-white/80 bg-white/20 rounded-full px-2.5 py-0.5 capitalize">
              {hangout.category}
            </span>
          </div>

          <div className="text-right">
            <div className="text-white/90 text-xs font-semibold bg-white/20 rounded-xl px-3 py-1.5">
              {hangout.attendees?.length || 0}/{hangout.max_attendees || 10}
            </div>
            <p className="text-white/70 text-[10px] mt-1">
              {isFull ? 'Full 😔' : `${spotsLeft} spots left`}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* keep the rest EXACTLY the same */}

        <Button
          onClick={handleJoin}
          disabled={isFull && !isAttending}
          className={`w-full rounded-2xl h-11 font-bold ${
            isAttending
              ? 'bg-muted text-muted-foreground'
              : `bg-gradient-to-r ${grad} text-white`
          }`}
        >
          {isAttending ? 'Leave Hangout' : isFull ? 'Full 😔' : 'Join Hangout 💕'}
        </Button>
      </div>
    </motion.div>
  );
}