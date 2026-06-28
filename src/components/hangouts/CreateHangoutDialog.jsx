import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { db, auth } from '@/api/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const categories = ['brunch', 'shopping', 'movie', 'workout', 'study', 'party', 'cafe', 'spa', 'travel', 'other'];

export default function CreateHangoutDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    location: '',
    date: '',
    time: '',
    description: '',
    category: 'cafe',
    max_attendees: 10,
  });

  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const user = auth.currentUser;

      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      await addDoc(collection(db, 'hangouts'), {
        ...form,
        max_attendees: Number(form.max_attendees),

        author_name:
          user.displayName ||
          user.email?.split('@')[0] ||
          'Anonymous',

        author_email: user.email,
        author_id: user.uid,

        attendees: [
          {
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
          },
        ],

        created_at: serverTimestamp(),
      });

      setOpen(false);
      setForm({
        title: '',
        location: '',
        date: '',
        time: '',
        description: '',
        category: 'cafe',
        max_attendees: 10,
      });

      queryClient.invalidateQueries({ queryKey: ['hangouts'] });
      toast.success('Hangout created! 🎉');
    } catch (error) {
      console.error('Error creating hangout:', error);
      toast.error('Failed to create hangout');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30">
          <Plus className="w-6 h-6" />
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-2xl max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-outfit">Create Hangout</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Title</Label>
            <Input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Girls Night Out ✨" className="rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Location</Label>
            <Input value={form.location} onChange={e => update('location', e.target.value)} placeholder="Cafe Latte, Downtown" className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Date</Label>
              <Input type="date" value={form.date} onChange={e => update('date', e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Time</Label>
              <Input type="time" value={form.time} onChange={e => update('time', e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category</Label>
              <Select value={form.category} onValueChange={v => update('category', v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Max Girlies</Label>
              <Input
                type="number"
                min={2}
                max={50}
                value={form.max_attendees}
                onChange={e => update('max_attendees', e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Description</Label>
            <Textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="What's the plan?"
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!form.title || !form.location || !form.date || !form.time || loading}
            className="w-full rounded-xl h-11 font-semibold"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Create Hangout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}