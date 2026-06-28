import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ImagePlus, Loader2, Sparkles } from 'lucide-react';
import { db, storage } from '@/api/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function CreatePostDialog({ currentUser }) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      let imageUrl = '';

      if (image) {
        const imageRef = ref(storage, `posts/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, 'posts'), {
        caption,
        image_url: imageUrl,
        author_name: currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Anonymous',
        author_avatar: currentUser?.avatar_url || '',
        author_id: currentUser?.uid || '',
        likes: [],
        comments: [],
        created_at: serverTimestamp(),
      });

      setCaption('');
      setImage(null);
      setPreview(null);
      setOpen(false);

      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Posted! 💕');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-2xl gradient-warm shadow-glow flex items-center justify-center text-white"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </motion.button>
      </DialogTrigger>

      <DialogContent className="rounded-3xl max-w-sm mx-auto border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-outfit font-bold text-xl">New Post ✨</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={preview} alt="Preview" className="w-full aspect-square object-cover" />
              <button
                onClick={() => {
                  setImage(null);
                  setPreview(null);
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-xl glass text-foreground flex items-center justify-center text-sm font-bold"
              >
                ×
              </button>
            </div>
          ) : (
            <label
              className="flex flex-col items-center justify-center h-48 rounded-2xl cursor-pointer transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #fce7f3, #ede9fe)',
                border: '2px dashed #f472b6',
              }}
            >
              <div className="w-12 h-12 rounded-2xl gradient-warm flex items-center justify-center shadow-sm mb-3">
                <ImagePlus className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-muted-foreground">Add a photo</span>
              <span className="text-xs text-muted-foreground mt-1">or leave empty for text post</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}

          <Textarea
            placeholder="What's on your mind, girlie? ✨"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="rounded-2xl resize-none bg-muted/50 border-border/50 focus:bg-white transition-all"
            rows={3}
          />

          <Button
            onClick={handleSubmit}
            disabled={!caption.trim() || loading}
            className="w-full rounded-2xl h-12 gradient-warm border-0 text-white font-bold shadow-glow-sm hover:shadow-glow transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Share with the Girlies
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}