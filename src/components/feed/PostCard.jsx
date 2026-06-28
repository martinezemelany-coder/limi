import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/api/client';
import { doc, updateDoc } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';

export default function PostCard({ post, currentUserEmail }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [heartBurst, setHeartBurst] = useState(false);

  const isLiked = post.likes?.includes(currentUserEmail);

  const handleLike = async () => {
    try {
      const newLikes = isLiked
        ? post.likes.filter(e => e !== currentUserEmail)
        : [...(post.likes || []), currentUserEmail];

      if (!isLiked) setHeartBurst(true);

      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, { likes: newLikes });

      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      const newComments = [
        ...(post.comments || []),
        {
          user_email: currentUserEmail,
          user_name: currentUserEmail?.split('@')[0],
          text: commentText,
          timestamp: new Date().toISOString(),
        },
      ];

      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, { comments: newComments });

      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (err) {
      console.error('Error commenting:', err);
    }
  };

  const authorInitial = (post.author_name || '?')[0].toUpperCase();
  const authorName = post.author_name || 'User';

  const timeAgo = post.created_at?.seconds
    ? formatDistanceToNow(new Date(post.created_at.seconds * 1000), { addSuffix: true })
    : '';

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-border/40 hover:shadow-md transition-shadow">
      
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="relative">
          <div className="w-11 h-11 rounded-2xl gradient-warm flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {authorInitial}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-400 border-2 border-white" />
        </div>

        <div className="flex-1">
          <p className="font-bold text-sm">{authorName}</p>
          <p className="text-[11px] text-muted-foreground">{timeAgo}</p>
        </div>

        <button className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
          <span className="text-muted-foreground text-base leading-none">···</span>
        </button>
      </div>

      {/* Image */}
      {post.image_url && (
        <div
          className="relative mx-3 rounded-2xl overflow-hidden"
          onDoubleClick={handleLike}
        >
          <img src={post.image_url} alt="" className="w-full aspect-square object-cover" />

          <AnimatePresence>
            {heartBurst && (
              <motion.div
                initial={{ scale: 0.3, opacity: 1 }}
                animate={{ scale: 1.4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                onAnimationComplete={() => setHeartBurst(false)}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-sm leading-relaxed">
            <span className="font-bold mr-1.5">{authorName}</span>
            <span className="text-foreground/80">{post.caption}</span>
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center px-4 py-3 gap-3">
        <button onClick={handleLike} className="flex items-center gap-1.5 group">
          <motion.div whileTap={{ scale: 1.3 }}>
            <Heart
              className={`w-6 h-6 ${
                isLiked
                  ? 'text-pink-500 fill-pink-500'
                  : 'text-foreground/70 group-hover:text-pink-500'
              }`}
            />
          </motion.div>
          <span className="text-sm font-bold text-foreground/70">
            {post.likes?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 group"
        >
          <MessageCircle className="w-6 h-6 text-foreground/70 group-hover:text-primary" />
          <span className="text-sm font-bold text-foreground/70">
            {post.comments?.length || 0}
          </span>
        </button>

        <button className="group">
          <Share2 className="w-5 h-5 text-foreground/70 group-hover:text-primary" />
        </button>

        <button className="ml-auto group">
          <Bookmark className="w-5 h-5 text-foreground/70 group-hover:text-primary" />
        </button>
      </div>

      {/* Comments (unchanged UI) */}
      {/* keep your existing comments JSX exactly the same */}
    </div>
  );
}