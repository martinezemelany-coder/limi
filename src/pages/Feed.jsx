import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Image as ImageIcon,
  Plus,
  X,
  User,
  Film,
  MapPin,
  Newspaper,
  Sparkles,
  Share2,
  MoreHorizontal,
  Trash2,
  Send,
} from "lucide-react";

import { auth, db, storage } from "../lib/firebase";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const navItems = [
  { label: "Feed", to: "/", icon: Newspaper },
  { label: "Reels", to: "/reels", icon: Film },
  { label: "Hangouts", to: "/hangouts", icon: MapPin },
  { label: "Match", to: "/match", icon: Heart },
  { label: "Profile", to: "/profile", icon: User },
];

const feedGroups = {
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

const filters = [
  { label: "All", emoji: "🌸" },
  { label: "Saved", emoji: "🔖" },
  { label: "Mine", emoji: "💗" },
  { label: "Hobbies", emoji: "🎀" },
  { label: "Career", emoji: "💼" },
  { label: "Life", emoji: "✨" },
];

function getCurrentUser() {
  return auth.currentUser;
}

function getFallbackUserDisplay() {
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

async function getLimiUserDisplay(uid) {
  const user = getCurrentUser();
  const fallback = getFallbackUserDisplay();

  if (!uid) return fallback;

  try {
    const snap = await getDoc(doc(db, "users", uid));

    if (snap.exists()) {
      const data = snap.data();

      return {
        uid,
        name:
          data.name ||
          data.displayName ||
          user?.displayName ||
          user?.email?.split("@")[0] ||
          "Limi Girl",
        email: data.email || user?.email || "",
        avatar: (
          data.name ||
          data.displayName ||
          user?.displayName ||
          user?.email ||
          "L"
        )
          .charAt(0)
          .toUpperCase(),
        photoURL: data.profileImage || data.photoURL || "",
        city: data.city || "Miami",
      };
    }

    return fallback;
  } catch (error) {
    console.error("Could not get Limi user display:", error);
    return fallback;
  }
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

async function uploadFeedImage(file) {
  if (!file) return "";

  const user = getCurrentUser();
  if (!user) throw new Error("You need to be logged in.");

  const safeName = file.name.replace(/\s+/g, "-");
  const imageRef = ref(storage, `feed/${user.uid}/${Date.now()}-${safeName}`);

  await uploadBytes(imageRef, file);
  return await getDownloadURL(imageRef);
}

function ModalShell({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/35 px-3 sm:items-center">
      <div className="w-full max-w-md rounded-t-[34px] bg-[#fff8fb] p-5 shadow-2xl sm:rounded-[34px]">
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

function CreatePostModal({ open, onClose, currentUser }) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [groupType, setGroupType] = useState("Hobbies");
  const [group, setGroup] = useState(feedGroups.Hobbies[0]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setText("");
      setImageFile(null);
      setGroupType("Hobbies");
      setGroup(feedGroups.Hobbies[0]);
      setUploading(false);
    }
  }, [open]);

  const handleGroupTypeChange = (value) => {
    setGroupType(value);
    setGroup(feedGroups[value][0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim() && !imageFile) {
      alert("Write a thought or add a photo first 💕");
      return;
    }

    try {
      setUploading(true);

      const limiUser = await getLimiUserDisplay(currentUser.uid);
      const imageUrl = imageFile ? await uploadFeedImage(imageFile) : "";

      await addDoc(collection(db, "posts"), {
        uid: currentUser.uid,
        username: limiUser.name,
        userEmail: limiUser.email,
        avatar: limiUser.avatar,
        photoURL: limiUser.photoURL,
        city: limiUser.city,
        text: text.trim(),
        image: imageUrl,
        groupType,
        group,
        likesBy: [],
        savedBy: [],
        comments: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message || "Post failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Create Post">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share a thought, ask a question, post a vibe 💕"
          className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none"
        />

        <select
          value={groupType}
          onChange={(e) => handleGroupTypeChange(e.target.value)}
          className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none"
        >
          <option>Hobbies</option>
          <option>Career</option>
          <option>Life</option>
        </select>

        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none"
        >
          {feedGroups[groupType].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <button
          type="submit"
          disabled={uploading}
          className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white shadow-[0_10px_24px_rgba(231,91,150,0.24)] disabled:opacity-60"
        >
          {uploading ? "Posting..." : "Post to Feed 💕"}
        </button>
      </form>
    </ModalShell>
  );
}

function CommentsModal({ open, onClose, post, currentUser }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  if (!open || !post) return null;

  const addComment = async (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    const limiUser = await getLimiUserDisplay(currentUser.uid);

    const comment = {
      id: `${Date.now()}`,
      uid: currentUser.uid,
      user: limiUser.name,
      avatar: limiUser.avatar,
      photoURL: limiUser.photoURL,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, "posts", post.id), {
      comments: arrayUnion(comment),
      updatedAt: serverTimestamp(),
    });

    setText("");
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Comments">
      <div className="space-y-4">
        <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
          {post.comments?.length ? (
            post.comments.map((comment) => (
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

function PostMenuModal({ open, onClose, post, currentUser }) {
  if (!open || !post) return null;

  const isOwner = 
    post.uid === currentUser.uid ||
    post.userEmail === currentUser.email ||
    post.username === currentUser.name;

  const deletePost = async () => {
    if (!isOwner) {
      onClose();
      return;
    }

    const confirmed = window.confirm("Delete this post? This cannot be undone.");

    if (!confirmed) return;

    await deleteDoc(doc(db, "posts", post.id));
    onClose();
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Post Options">
      <div className="space-y-3">
        {isOwner ? (
          <button
            onClick={deletePost}
            className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 font-black text-[#ff4d6d] shadow-sm"
          >
            <Trash2 size={18} />
            Delete Post
          </button>
        ) : (
          <p className="rounded-2xl bg-white px-4 py-4 text-sm font-bold text-[#80636f] shadow-sm">
            Only the person who made this post can delete it.
          </p>
        )}
      </div>
    </ModalShell>
  );
}

function PostCard({ post, currentUser, onOpenComments, onOpenMenu }) {
  const navigate = useNavigate();

  const liked = post.likesBy?.includes(currentUser.uid);
  const saved = post.savedBy?.includes(currentUser.uid);

  const openProfile = () => {
    if (post.uid) navigate(`/profile/${post.uid}`);
  };

  const toggleLike = async () => {
    const postRef = doc(db, "posts", post.id);

    await updateDoc(postRef, {
      likesBy: liked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
  };

  const toggleSave = async () => {
    const postRef = doc(db, "posts", post.id);

    await updateDoc(postRef, {
      savedBy: saved ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
  };

  return (
    <div className="overflow-hidden rounded-[36px] bg-[#fff9fc] shadow-[0_12px_35px_rgba(239,148,181,0.12)]">
      <div className="bg-gradient-to-r from-[#f5a5be] via-[#f59bb4] to-[#f8a6a6] p-5 text-white">
        <div className="flex items-start justify-between">
          <button
            type="button"
            onClick={openProfile}
            className="flex items-center gap-3 text-left"
          >
            {post.photoURL ? (
              <img
                src={post.photoURL}
                alt=""
                className="h-14 w-14 rounded-full border-2 border-white object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 text-xl font-black">
                {post.avatar || "L"}
              </div>
            )}

            <div>
              <h3 className="text-xl font-black">{post.username || "Limi Girl"}</h3>
              <p className="text-sm font-semibold text-white/85">{post.group}</p>
            </div>
          </button>

          <button
            onClick={() => onOpenMenu(post)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-[#ffe6f0] px-3 py-1 text-xs font-black text-[#e85da2]">
            {post.groupType}
          </div>

          <div className="rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-black text-[#f089b0]">
            {formatTime(post.createdAt)}
          </div>
        </div>

        {post.text && (
          <p className="whitespace-pre-wrap text-[16px] leading-7 text-[#735a66]">
            {post.text}
          </p>
        )}

        {post.image && (
          <img
            src={post.image}
            alt=""
            className="w-full rounded-[28px] object-cover"
          />
        )}

        <div className="flex items-center justify-between border-t border-[#f7dce7] pt-4">
          <div className="flex items-center gap-5">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-2 text-sm font-black transition ${
                liked ? "text-[#ec5ba0]" : "text-[#9a7b87]"
              }`}
            >
              <Heart size={20} className={liked ? "fill-[#ec5ba0]" : ""} />
              {post.likesBy?.length || 0}
            </button>

            <button
              onClick={() => onOpenComments(post)}
              className="flex items-center gap-2 text-sm font-black text-[#9a7b87]"
            >
              <MessageCircle size={20} />
              {post.comments?.length || 0}
            </button>

            <button className="flex items-center gap-2 text-sm font-black text-[#9a7b87]">
              <Share2 size={20} />
            </button>
          </div>

          <button
            onClick={toggleSave}
            className={`transition ${saved ? "text-[#ec5ba0]" : "text-[#9a7b87]"}`}
          >
            <Bookmark size={22} className={saved ? "fill-[#ec5ba0]" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Feed() {
  const currentUser = useMemo(() => getFallbackUserDisplay(), []);

  const [posts, setPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");

  const [createOpen, setCreateOpen] = useState(false);
  const [commentsPost, setCommentsPost] = useState(null);
  const [menuPost, setMenuPost] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setPosts(data);
    });

    return () => unsubscribe();
  }, []);

  const filteredPosts = useMemo(() => {
    if (activeFilter === "All") return posts;

    if (activeFilter === "Saved") {
      return posts.filter((post) => post.savedBy?.includes(currentUser.uid));
    }

    if (activeFilter === "Mine") {
      return posts.filter((post) => post.uid === currentUser.uid);
    }

    if (activeFilter === "Hobbies") {
      return posts.filter((post) => post.groupType === "Hobbies");
    }

    if (activeFilter === "Career") {
      return posts.filter((post) => post.groupType === "Career");
    }

    if (activeFilter === "Life") {
      return posts.filter((post) => post.groupType === "Life");
    }

    return posts;
  }, [posts, activeFilter, currentUser.uid]);

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
                Feed
              </h1>

              <p className="mt-2 text-lg font-bold text-[#80636f]">
                share your world 💕
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
            <ImageIcon size={22} />
            Create Post
          </button>

          <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <button
                key={filter.label}
                onClick={() => setActiveFilter(filter.label)}
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
          {filteredPosts.length ? (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onOpenComments={setCommentsPost}
                onOpenMenu={setMenuPost}
              />
            ))
          ) : (
            <div className="rounded-[36px] bg-white p-10 text-center shadow-sm">
              <Sparkles size={44} className="mx-auto mb-4 text-[#f089b0]" />

              <h3 className="text-2xl font-black text-[#e85da2]">
                No posts yet
              </h3>

              <p className="mt-2 text-sm font-semibold text-[#80636f]">
                Be the first girlie to post something 💕
              </p>
            </div>
          )}
        </div>
      </div>

      <CreatePostModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        currentUser={currentUser}
      />

      <CommentsModal
        open={!!commentsPost}
        onClose={() => setCommentsPost(null)}
        post={commentsPost}
        currentUser={currentUser}
      />

      <PostMenuModal
        open={!!menuPost}
        onClose={() => setMenuPost(null)}
        post={menuPost}
        currentUser={currentUser}
      />
    </div>
  );
}