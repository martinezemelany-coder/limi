import { getFriendlyFirebaseErrorMessage } from "../lib/firebaseError";
import React, { useEffect, useMemo, useState } from "react";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Plus,
  X,
  Play,
  Send,
  Trash2,
  Flag,
  MoreHorizontal,
  Upload,
  Sparkles,
} from "lucide-react";

import { auth, db, storage } from "../lib/firebase";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const reelGroups = {
  Hobbies: [
    "Beach",
    "Study",
    "Gym",
    "Self Care",
    "Night Out",
    "Cafe",
    "Pilates",
    "Anime",
    "Art",
    "Fashion",
    "Foodie",
    "Travel",
  ],
  Career: [
    "Technology",
    "Business",
    "Healthcare",
    "Legal",
    "Creative",
    "Education",
    "Engineering",
    "Entrepreneur",
    "Media",
    "Science",
  ],
  Life: [
    "Side Hustle",
    "Content Creator",
    "9-5 Corporate",
    "Remote Work",
    "Student",
    "Single",
    "Glow Up",
    "Relationship",
  ],
};

const topFilters = [
  { label: "All", emoji: "🌸" },
  { label: "Saved", emoji: "🔖" },
  { label: "Mine", emoji: "💕" },
  { label: "Hobbies", emoji: "🎀" },
  { label: "Career", emoji: "💼" },
  { label: "Life", emoji: "✨" },
];

function getCurrentUser() {
  return auth.currentUser;
}

function getUserDisplay() {
  const user = getCurrentUser();

  return {
    uid: user?.uid || "guest",
    name: user?.displayName || user?.email?.split("@")[0] || "Limi Girl",
    email: user?.email || "",
    avatar: (user?.displayName || user?.email || "L").charAt(0).toUpperCase(),
    photoURL: user?.photoURL || "",
    city: "Miami",
  };
}

function formatTime(timestamp) {
  if (!timestamp?.toDate) return "Just now";

  const date = timestamp.toDate();
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

async function uploadReelVideo(file) {
  if (!file) return "";

  const user = getCurrentUser();
  if (!user) throw new Error("You need to be logged in.");

  const safeName = file.name.replace(/\s+/g, "-");
  const videoRef = ref(storage, `reels/${user.uid}/${Date.now()}-${safeName}`);

  await uploadBytes(videoRef, file);
  return await getDownloadURL(videoRef);
}

function ModalShell({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 px-3 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[34px] bg-[#fff8fb] p-5 shadow-2xl sm:rounded-[34px]">
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-3xl leading-none tracking-[-0.05em] text-[#ec64a8]"
            style={{ fontWeight: 1000 }}
          >
            {title}
          </h2>

          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffe4ef] text-[#d94b93]"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function CreateReelModal({ open, onClose, currentUser }) {
  const [videoFile, setVideoFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [audio, setAudio] = useState("");
  const [groupType, setGroupType] = useState("Hobbies");
  const [group, setGroup] = useState(reelGroups.Hobbies[0]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setVideoFile(null);
      setCaption("");
      setAudio("");
      setGroupType("Hobbies");
      setGroup(reelGroups.Hobbies[0]);
      setUploading(false);
    }
  }, [open]);

  const handleGroupTypeChange = (value) => {
    setGroupType(value);
    setGroup(reelGroups[value][0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!videoFile) {
      alert("Choose a video from your camera roll first 💕");
      return;
    }

    if (!caption.trim()) {
      alert("Add a caption first 💕");
      return;
    }

    try {
      setUploading(true);

      const videoUrl = await uploadReelVideo(videoFile);

      await addDoc(collection(db, "reels"), {
        uid: currentUser.uid,
        username: currentUser.name,
        userEmail: currentUser.email,
        avatar: currentUser.avatar,
        photoURL: currentUser.photoURL,
        city: currentUser.city,
        video: videoUrl,
        caption: caption.trim(),
        audio: audio.trim() || "original sound ✨",
        groupType,
        group,
        likesBy: [],
        savedBy: [],
        comments: [],
        reports: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Upload Reel">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-black text-[#80636f]">
            Choose Video
          </label>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[#f1cddd] bg-white px-4 py-8 text-center">
            <Upload size={34} className="mb-3 text-[#e85da2]" />

            <p className="text-base font-black text-[#e85da2]">
              Upload from camera roll
            </p>

            <p className="mt-1 text-sm font-semibold text-[#80636f]">
              MP4, MOV, or phone video
            </p>

            {videoFile && (
              <p className="mt-3 rounded-full bg-[#ffe4ef] px-4 py-2 text-xs font-black text-[#d95c9f]">
                {videoFile.name}
              </p>
            )}

            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-[#80636f]">
            Caption
          </label>

          <textarea
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Tell us the vibe 💕"
            className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-[#80636f]">
            Audio Name
          </label>

          <input
            value={audio}
            onChange={(e) => setAudio(e.target.value)}
            placeholder="cute coffee day ✨"
            className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-[#80636f]">
            Category
          </label>

          <select
            value={groupType}
            onChange={(e) => handleGroupTypeChange(e.target.value)}
            className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
          >
            <option>Hobbies</option>
            <option>Career</option>
            <option>Life</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-[#80636f]">
            Group
          </label>

          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
          >
            {reelGroups[groupType].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white shadow-[0_10px_24px_rgba(231,91,150,0.24)] disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "Post Reel 💕"}
        </button>
      </form>
    </ModalShell>
  );
}

function CommentsModal({ open, onClose, reel, currentUser }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  if (!open || !reel) return null;

  const addComment = async (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    const comment = {
      id: `${Date.now()}`,
      uid: currentUser.uid,
      user: currentUser.name,
      avatar: currentUser.avatar,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, "reels", reel.id), {
      comments: arrayUnion(comment),
      updatedAt: serverTimestamp(),
    });

    setText("");
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Comments">
      <div className="space-y-4">
        <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
          {reel.comments?.length ? (
            reel.comments.map((comment) => (
              <div key={comment.id} className="rounded-[24px] bg-white p-4 shadow-sm">
                <p className="text-sm font-black text-[#e85da2]">{comment.user}</p>
                <p className="mt-1 text-sm leading-6 text-[#80636f]">{comment.text}</p>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] bg-white p-4 text-sm font-semibold text-[#80636f] shadow-sm">
              No comments yet. Be the first one 💕
            </div>
          )}
        </div>

        <form onSubmit={addComment} className="flex gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 rounded-full border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
          />

          <button
            type="submit"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] text-white"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </ModalShell>
  );
}

function ReelMenuModal({ open, onClose, reel, currentUser }) {
  if (!open || !reel) return null;

  const isOwner = reel.uid === currentUser.uid;

  const deleteReel = async () => {
    const confirmed = window.confirm("Delete this reel?");
    if (!confirmed) return;

    await deleteDoc(doc(db, "reels", reel.id));
    onClose();
  };

  const reportReel = async () => {
    await updateDoc(doc(db, "reels", reel.id), {
      reports: arrayUnion(currentUser.uid),
    });

    alert("Reel reported.");
    onClose();
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Reel Options">
      <div className="space-y-3">
        {isOwner ? (
          <button
            onClick={deleteReel}
            className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 font-black text-[#ff4d6d] shadow-sm"
          >
            <Trash2 size={18} />
            Delete Reel
          </button>
        ) : (
          <button
            onClick={reportReel}
            className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 font-black text-[#ff8c42] shadow-sm"
          >
            <Flag size={18} />
            Report Reel
          </button>
        )}
      </div>
    </ModalShell>
  );
}

function ReelCard({ reel, currentUser, onOpenComments, onOpenMenu }) {
  const liked = reel.likesBy?.includes(currentUser.uid);
  const saved = reel.savedBy?.includes(currentUser.uid);

  const toggleLike = async () => {
    await updateDoc(doc(db, "reels", reel.id), {
      likesBy: liked
        ? arrayRemove(currentUser.uid)
        : arrayUnion(currentUser.uid),
    });
  };

  const toggleSave = async () => {
    await updateDoc(doc(db, "reels", reel.id), {
      savedBy: saved
        ? arrayRemove(currentUser.uid)
        : arrayUnion(currentUser.uid),
    });
  };

  return (
    <div className="overflow-hidden rounded-[36px] bg-black shadow-[0_12px_35px_rgba(239,148,181,0.16)]">
      <div className="relative h-[620px] bg-black">
        <video
          src={reel.video}
          controls
          playsInline
          className="h-full w-full object-cover"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        <div className="absolute left-5 top-5 flex items-center gap-3">
          {reel.photoURL ? (
            <img
              src={reel.photoURL}
              alt=""
              className="h-13 w-13 rounded-full border-2 border-white object-cover"
            />
          ) : (
            <div className="flex h-13 w-13 items-center justify-center rounded-full border-2 border-white bg-white/25 text-lg font-black text-white">
              {reel.avatar}
            </div>
          )}

          <div>
            <p className="text-lg font-black text-white">{reel.username}</p>
            <p className="text-sm font-semibold text-white/85">
              {reel.group}
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenMenu(reel)}
          className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur"
        >
          <MoreHorizontal size={20} />
        </button>

        <div className="absolute bottom-6 left-5 right-20">
          <div className="mb-3 inline-flex rounded-full bg-white/20 px-4 py-2 text-xs font-black text-white backdrop-blur">
            {reel.groupType} • {formatTime(reel.createdAt)}
          </div>

          <p className="whitespace-pre-wrap text-lg font-semibold leading-7 text-white">
            {reel.caption}
          </p>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-black text-white backdrop-blur">
            <Play size={14} fill="currentColor" />
            {reel.audio || "original sound ✨"}
          </div>
        </div>

        <div className="absolute bottom-6 right-5 flex flex-col items-center gap-4 text-white">
          <button onClick={toggleLike} className="flex flex-col items-center gap-1">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                liked ? "bg-[#e85da2]" : "bg-white/20"
              } backdrop-blur`}
            >
              <Heart size={22} fill={liked ? "currentColor" : "none"} />
            </div>
            <span className="text-xs font-black">{reel.likesBy?.length || 0}</span>
          </button>

          <button
            onClick={() => onOpenComments(reel)}
            className="flex flex-col items-center gap-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <MessageCircle size={22} />
            </div>
            <span className="text-xs font-black">{reel.comments?.length || 0}</span>
          </button>

          <button onClick={toggleSave} className="flex flex-col items-center gap-1">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                saved ? "bg-[#e85da2]" : "bg-white/20"
              } backdrop-blur`}
            >
              <Bookmark size={22} fill={saved ? "currentColor" : "none"} />
            </div>
            <span className="text-[11px] font-black">
              {saved ? "Saved" : "Save"}
            </span>
          </button>

          <button
            onClick={() => alert("Reel shared 💕")}
            className="flex flex-col items-center gap-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <Share2 size={22} />
            </div>
            <span className="text-[11px] font-black">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Reels() {
  const currentUser = useMemo(() => getUserDisplay(), []);

  const [reels, setReels] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedGroupType, setSelectedGroupType] = useState("Hobbies");
  const [selectedGroup, setSelectedGroup] = useState("All");

  const [createOpen, setCreateOpen] = useState(false);
  const [commentsReel, setCommentsReel] = useState(null);
  const [menuReel, setMenuReel] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "reels"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setReels(data);
    });

    return () => unsubscribe();
  }, []);

  const filteredReels = useMemo(() => {
    let result = reels;

    if (activeFilter === "Saved") {
      result = result.filter((reel) => reel.savedBy?.includes(currentUser.uid));
    }

    if (activeFilter === "Mine") {
      result = result.filter((reel) => reel.uid === currentUser.uid);
    }

    if (["Hobbies", "Career", "Life"].includes(activeFilter)) {
      result = result.filter((reel) => reel.groupType === activeFilter);
    }

    if (selectedGroup !== "All") {
      result = result.filter((reel) => reel.group === selectedGroup);
    }

    return result;
  }, [reels, activeFilter, selectedGroup, currentUser.uid]);

  const handleGroupTypeBrowse = (value) => {
    setSelectedGroupType(value);
    setSelectedGroup("All");
    setActiveFilter(value);
  };

  return (
    <div className="min-h-screen bg-[#fff6fa] pb-44">
      <div className="mx-auto max-w-md px-4 pt-5">
        <div className="rounded-[38px] bg-[#fffdfd] p-5 shadow-[0_10px_35px_rgba(244,168,194,0.14)]">
          <div className="flex items-start justify-between">
            <div>
              <h1
                className="text-[58px] leading-none tracking-[-0.06em] text-[#eb6aaa]"
                style={{ fontWeight: 1000 }}
              >
                Reels
              </h1>

              <p className="mt-2 text-lg font-bold text-[#80636f]">
                watch your groups 💕
              </p>
            </div>

            <button
              onClick={() => setCreateOpen(true)}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] text-white shadow-[0_12px_24px_rgba(237,102,157,0.3)]"
            >
              <Plus size={34} />
            </button>
          </div>

          <button
            onClick={() => setCreateOpen(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-5 text-xl font-black text-white shadow-[0_12px_24px_rgba(237,102,157,0.22)]"
          >
            <Upload size={22} />
            Upload Reel
          </button>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-black text-[#80636f]">
                Browse Category
              </label>
              <select
                value={selectedGroupType}
                onChange={(e) => handleGroupTypeBrowse(e.target.value)}
                className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 text-sm font-black text-[#80636f] outline-none"
              >
                <option>Hobbies</option>
                <option>Career</option>
                <option>Life</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black text-[#80636f]">
                Group
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 text-sm font-black text-[#80636f] outline-none"
              >
                <option>All</option>
                {reelGroups[selectedGroupType].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
            {topFilters.map((filter) => (
              <button
                key={filter.label}
                onClick={() => {
                  setActiveFilter(filter.label);
                  if (["All", "Saved", "Mine"].includes(filter.label)) {
                    setSelectedGroup("All");
                  }
                }}
                className={`whitespace-nowrap rounded-full px-5 py-3 text-sm font-black transition ${
                  activeFilter === filter.label
                    ? "bg-gradient-to-r from-[#f29dbc] to-[#f06aa8] text-white"
                    : "border border-[#f1d8e3] bg-white text-[#6f5d66]"
                }`}
              >
                {filter.emoji} {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {filteredReels.length ? (
            filteredReels.map((reel) => (
              <ReelCard
                key={reel.id}
                reel={reel}
                currentUser={currentUser}
                onOpenComments={setCommentsReel}
                onOpenMenu={setMenuReel}
              />
            ))
          ) : (
            <div className="rounded-[36px] bg-white p-10 text-center shadow-sm">
              <Sparkles size={44} className="mx-auto mb-4 text-[#f089b0]" />

              <h3 className="text-2xl font-black text-[#e85da2]">
                No reels yet
              </h3>

              <p className="mt-2 text-sm font-semibold text-[#80636f]">
                Upload the first reel for this group 💕
              </p>
            </div>
          )}
        </div>
      </div>

      <CreateReelModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        currentUser={currentUser}
      />

      <CommentsModal
        open={!!commentsReel}
        onClose={() => setCommentsReel(null)}
        reel={commentsReel}
        currentUser={currentUser}
      />

      <ReelMenuModal
        open={!!menuReel}
        onClose={() => setMenuReel(null)}
        reel={menuReel}
        currentUser={currentUser}
      />
    </div>
  );
}