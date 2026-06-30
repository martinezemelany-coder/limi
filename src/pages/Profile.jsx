import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Camera,
  Edit3,
  LogOut,
  ShieldCheck,
  Settings,
  MapPin,
  Heart,
  Sparkles,
  Save,
  X,
  Lock,
  Bell,
  Trash2,
  Coffee,
  Zap,
  Newspaper,
  MessageCircleHeart,
} from "lucide-react";

import { auth, db, storage } from "../lib/firebase";
import { signOut, deleteUser } from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  arrayRemove,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const interestOptions = [
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
  "Technology",
  "Business",
  "Healthcare",
  "Legal",
  "Creative",
  "Education",
  "Engineering",
  "Entrepreneur",
  "Side Hustle",
  "Content Creator",
  "Student",
  "Single",
  "Glow Up",
  "Relationship",
];

function getDefaultProfile() {
  const user = auth.currentUser;

  return {
    uid: user?.uid || "",
    email: user?.email || "",
    name: user?.displayName || user?.email?.split("@")[0] || "Limi Girl",
    age: "",
    city: "Miami, FL",
    bio: "Excited to meet new girlies 💕",
    interests: [],
    friendActivities: [],
    activities: [],
    socialEnergy: "",
    vibes: [],
    vibe: [],
    photoURL: user?.photoURL || "",
    profileImage: "",
    verified: false,
    verificationStatus: "not_verified",
    completedOnboarding: false,
    notifications: true,
    showCity: true,
  };
}

function getArrayValue(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length) return value;
    if (typeof value === "string" && value.trim()) return [value];
  }

  return [];
}

function formatPostDate(value) {
  if (!value) return "";

  try {
    if (value.toDate) {
      return value.toDate().toLocaleDateString();
    }

    return new Date(value).toLocaleDateString();
  } catch {
    return "";
  }
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

function InterestButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-black transition ${
        active
          ? "border-transparent bg-gradient-to-r from-[#f4a1bd] to-[#f06aa8] text-white"
          : "border-[#f1d8e3] bg-white text-[#80636f]"
      }`}
    >
      {label}
    </button>
  );
}

function EditProfileModal({ open, onClose, profile, onSave }) {
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(profile);
  }, [open, profile]);

  const toggleInterest = (interest) => {
    const current = form.interests || [];

    if (current.includes(interest)) {
      setForm({
        ...form,
        interests: current.filter((item) => item !== interest),
      });
    } else {
      setForm({
        ...form,
        interests: [...current, interest],
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Edit Profile">
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-black text-[#80636f]">
            Name
          </label>
          <input
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-black text-[#80636f]">
              Age
            </label>
            <input
              value={form.age || ""}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-[#80636f]">
              City
            </label>
            <input
              value={form.city || ""}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-[#80636f]">
            Bio
          </label>
          <textarea
            rows={4}
            value={form.bio || ""}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full resize-none rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
          />
        </div>

        <div>
          <p className="mb-3 text-sm font-black text-[#80636f]">Interests</p>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((interest) => (
              <InterestButton
                key={interest}
                label={interest}
                active={(form.interests || []).includes(interest)}
                onClick={() => toggleInterest(interest)}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white shadow-[0_12px_24px_rgba(237,102,157,0.22)] disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </ModalShell>
  );
}

function SettingsModal({
  open,
  onClose,
  profile,
  onToggleNotifications,
  onToggleCity,
  onLogout,
  onDeleteAccount,
  onVerify,
  isOwnProfile,
}) {
  if (!isOwnProfile) return null;

  return (
    <ModalShell open={open} onClose={onClose} title="Settings">
      <div className="space-y-3">
        <button
          onClick={onVerify}
          className="flex w-full items-center justify-between rounded-[24px] bg-white p-4 text-left shadow-sm"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-[#ec64a8]" size={22} />
            <div>
              <p className="font-black text-[#2b1d28]">Identity Verification</p>
              <p className="text-sm font-semibold text-[#80636f]">
                {profile.verificationStatus === "verified"
                  ? "Verified"
                  : profile.verificationStatus === "pending"
                  ? "Pending review"
                  : "Verify your account"}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={onToggleNotifications}
          className="flex w-full items-center justify-between rounded-[24px] bg-white p-4 text-left shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Bell className="text-[#ec64a8]" size={22} />
            <div>
              <p className="font-black text-[#2b1d28]">Notifications</p>
              <p className="text-sm font-semibold text-[#80636f]">
                {profile.notifications ? "On" : "Off"}
              </p>
            </div>
          </div>

          <span
            className={`relative h-8 w-14 rounded-full ${
              profile.notifications ? "bg-[#ec64a8]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                profile.notifications ? "right-1" : "left-1"
              }`}
            />
          </span>
        </button>

        <button
          onClick={onToggleCity}
          className="flex w-full items-center justify-between rounded-[24px] bg-white p-4 text-left shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Lock className="text-[#ec64a8]" size={22} />
            <div>
              <p className="font-black text-[#2b1d28]">Show City</p>
              <p className="text-sm font-semibold text-[#80636f]">
                {profile.showCity ? "Visible on profile" : "Hidden"}
              </p>
            </div>
          </div>

          <span
            className={`relative h-8 w-14 rounded-full ${
              profile.showCity ? "bg-[#ec64a8]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                profile.showCity ? "right-1" : "left-1"
              }`}
            />
          </span>
        </button>

        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-[24px] bg-white p-4 font-black text-[#d94b93] shadow-sm"
        >
          <LogOut size={22} />
          Log Out
        </button>

        <button
          onClick={onDeleteAccount}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-white py-4 text-lg font-black text-red-500"
        >
          <Trash2 size={18} />
          Delete Account
        </button>
      </div>
    </ModalShell>
  );
}

function ProfileInfoCard({ icon, title, items, emptyText }) {
  const cleanItems = Array.isArray(items)
    ? items.filter(Boolean)
    : items
    ? [items]
    : [];

  return (
    <div className="mt-6 rounded-[34px] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-xl font-black text-[#2b1d28]">{title}</h3>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {cleanItems.length ? (
          cleanItems.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="rounded-full bg-[#fff2f7] px-4 py-2 text-sm font-black text-[#d94b93]"
            >
              {item}
            </span>
          ))
        ) : (
          <p className="text-sm font-semibold text-[#80636f]">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function FeedPostsCard({ posts }) {
  const recentPosts = posts.slice(0, 3);

  return (
    <div className="mt-6 rounded-[34px] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Newspaper size={20} className="text-[#ec64a8]" />
        <h3 className="text-xl font-black text-[#2b1d28]">Recent Posts</h3>
      </div>

      <div className="mt-4">
        {recentPosts.length ? (
          <div className="space-y-3">
            {recentPosts.map((post) => {
              const postText =
                post.text ||
                post.caption ||
                post.content ||
                post.message ||
                "";

              const postImage =
                post.image ||
                post.imageURL ||
                post.imageUrl ||
                "";

              return (
                <div
                  key={post.id}
                  className="rounded-[26px] border border-[#f7dce8] bg-[#fff6fa] p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {post.photoURL ? (
                        <img
                          src={post.photoURL}
                          alt="profile"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffe6f0] text-sm font-black text-[#d94b93]">
                          {post.avatar || "L"}
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-black text-[#2b1d28]">
                          {post.username || "Limi Girl"}
                        </p>
                        <p className="text-xs font-bold text-[#ad8a99]">
                          {post.group || post.groupType || "Post"}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-[#ad8a99]">
                      {formatPostDate(post.createdAt)}
                    </span>
                  </div>

                  {postText && (
                    <p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-[#80636f]">
                      {postText}
                    </p>
                  )}

                  {postImage && (
                    <img
                      src={postImage}
                      alt="Feed post"
                      className="mt-3 max-h-48 w-full rounded-[22px] object-cover"
                    />
                  )}

                  <div className="mt-3 flex items-center gap-4 text-xs font-black text-[#ad8a99]">
                    <span className="flex items-center gap-1">
                      <Heart size={14} className="text-[#ec64a8]" />
                      {post.likesBy?.length || post.likes?.length || post.likeCount || 0}
                    </span>

                    <span className="flex items-center gap-1">
                      <MessageCircleHeart size={14} className="text-[#ec64a8]" />
                      {post.comments?.length || post.commentCount || 0}
                    </span>
                  </div>
                </div>
              );
            })}

            {posts.length > 3 && (
              <p className="pt-2 text-center text-sm font-black text-[#ec64a8]">
                Showing 3 most recent posts 💕
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm font-semibold text-[#80636f]">
            No feed posts yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { uid } = useParams();
  const user = auth.currentUser;

  const profileUid = uid || user?.uid;
  const isOwnProfile = !uid || uid === user?.uid;

  const [profile, setProfile] = useState(getDefaultProfile());
  const [feedPosts, setFeedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const profilePhoto = profile.profileImage || profile.photoURL || "";

  const friendActivities = useMemo(
    () =>
      getArrayValue(
        profile.friendActivities,
        profile.activities,
        profile.friendOptions,
        profile.whatDoYouDoWithFriends
      ),
    [profile]
  );

  const socialEnergy = useMemo(
    () => getArrayValue(profile.socialEnergy, profile.energy),
    [profile]
  );

  const vibes = useMemo(
    () => getArrayValue(profile.vibes, profile.vibe),
    [profile]
  );

  useEffect(() => {
    async function loadProfile() {
      if (!profileUid) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", profileUid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          setProfile({
            ...getDefaultProfile(),
            ...snap.data(),
            uid: profileUid,
            email: snap.data().email || "",
          });
        } else if (isOwnProfile && user) {
          const defaultProfile = getDefaultProfile();

          await setDoc(
            userRef,
            {
              ...defaultProfile,
              uid: user.uid,
              email: user.email || "",
              completedOnboarding: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          setProfile(defaultProfile);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        alert("Could not load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [profileUid, isOwnProfile, user]);

  useEffect(() => {
  async function loadUserPosts() {
    if (!profileUid) return;

    try {
      const postsQuery = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc")
      );

      const postsSnap = await getDocs(postsQuery);

      const allPosts = postsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const userPosts = allPosts.filter((post) => {
        return (
          post.uid === profileUid ||
          post.userEmail === profile.email ||
          post.username === profile.name
        );
      });

      setFeedPosts(userPosts);
    } catch (error) {
      console.error("Error loading profile posts:", error);
    }
  }

  loadUserPosts();
}, [profileUid, profile.email, profile.name]);

  const saveProfile = async (newProfile) => {
    if (!user || !isOwnProfile) return;

    const cleanProfile = {
      ...newProfile,
      age: newProfile.age || "",
      interests: newProfile.interests || [],
      friendActivities: newProfile.friendActivities || [],
      activities: newProfile.activities || [],
      socialEnergy: newProfile.socialEnergy || "",
      vibes: newProfile.vibes || [],
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", user.uid), cleanProfile, { merge: true });
    setProfile((prev) => ({ ...prev, ...cleanProfile }));
  };

  const uploadProfilePhoto = async (file) => {
    if (!file || !user || !isOwnProfile) return;

    try {
      setUploadingPhoto(true);

      const photoRef = ref(
        storage,
        `profilePictures/${user.uid}/${Date.now()}-${file.name}`
      );

      await uploadBytes(photoRef, file);

      const photoURL = await getDownloadURL(photoRef);

      await updateDoc(doc(db, "users", user.uid), {
        profileImage: photoURL,
        photoURL,
        updatedAt: serverTimestamp(),
      });

      setProfile((prev) => ({
        ...prev,
        profileImage: photoURL,
        photoURL,
      }));
    } catch (error) {
      console.error(error);
      alert("Could not upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const deleteAccount = async () => {
    if (!user || !isOwnProfile) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your Limi account? This will delete your profile, matches, chats, and hangout data. This cannot be undone."
    );

    if (!confirmed) return;

    const typed = window.prompt("Type DELETE to confirm.");

    if (typed !== "DELETE") {
      alert("Account deletion cancelled.");
      return;
    }

    try {
      await setDoc(
        doc(db, "deletedAccounts", user.uid),
        {
          uid: user.uid,
          email: user.email || "",
          deletedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await deleteDoc(doc(db, "users", user.uid));
      await deleteDoc(doc(db, "matchActivity", user.uid));

      const chatsQuery = query(
        collection(db, "chats"),
        where("members", "array-contains", user.uid)
      );

      const chatsSnap = await getDocs(chatsQuery);

      await Promise.all(
        chatsSnap.docs.map(async (chatDoc) => {
          const chat = chatDoc.data();

          if ((chat.members || []).length <= 1) {
            await deleteDoc(doc(db, "chats", chatDoc.id));
          } else {
            await updateDoc(doc(db, "chats", chatDoc.id), {
              members: arrayRemove(user.uid),
              updatedAt: serverTimestamp(),
            });
          }
        })
      );

      const hangoutsSnap = await getDocs(collection(db, "hangouts"));

      await Promise.all(
        hangoutsSnap.docs.map(async (hangoutDoc) => {
          const hangout = hangoutDoc.data();

          if (hangout.hostId === user.uid) {
            await deleteDoc(doc(db, "hangouts", hangoutDoc.id));
            return;
          }

          const cleanedRequests = (hangout.requests || []).filter(
            (request) => request.uid !== user.uid
          );

          await updateDoc(doc(db, "hangouts", hangoutDoc.id), {
            requests: cleanedRequests,
            updatedAt: serverTimestamp(),
          });
        })
      );

      await deleteUser(user);

      alert("Your Limi account has been deleted.");
      navigate("/login");
    } catch (error) {
      console.error("Delete account error:", error);

      if (error.code === "auth/requires-recent-login") {
        alert("Please log out and log back in, then try deleting your account again.");
        return;
      }

      alert(error.message || "Could not delete account.");
    }
  };

  const toggleNotifications = async () => {
    await saveProfile({
      ...profile,
      notifications: !profile.notifications,
    });
  };

  const toggleCity = async () => {
    await saveProfile({
      ...profile,
      showCity: !profile.showCity,
    });
  };

  const stats = useMemo(
    () => [
      { label: "Interests", value: profile.interests?.length || 0 },
      { label: "Verified", value: profile.verified ? "Yes" : "No" },
      {
        label: "City",
        value: profile.showCity ? profile.city || "Hidden" : "Hidden",
      },
    ],
    [profile]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff6fa]">
        <p className="text-xl font-black text-[#ec64a8]">Loading profile 💕</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff6fa] pb-28">
      <div className="mx-auto max-w-md px-4 pt-5">
        <div className="overflow-hidden rounded-[40px] bg-white shadow-[0_14px_36px_rgba(239,148,181,0.16)]">
          <div className="relative bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] px-6 pb-24 pt-8 text-white">
            <div className="absolute -left-10 bottom-[-40px] h-36 w-36 rounded-full bg-white/10" />
            <div className="absolute right-[-35px] top-[-35px] h-44 w-44 rounded-full bg-white/15" />

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <h1
                  className="text-[54px] leading-none tracking-[-0.06em]"
                  style={{ fontWeight: 1000 }}
                >
                  Profile
                </h1>
                <p className="mt-2 text-lg font-bold text-white/90">
                  your Limi identity 💕
                </p>
              </div>

              {isOwnProfile && (
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur"
                >
                  <Settings size={24} />
                </button>
              )}
            </div>
          </div>

          <div className="-mt-20 px-6 pb-6">
            <div className="relative z-20 flex flex-col items-center">
              <label className={`relative ${isOwnProfile ? "cursor-pointer" : ""}`}>
                <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-[38px] border-4 border-white bg-gradient-to-br from-[#f5a2bc] to-[#d94b93] text-5xl font-black text-white shadow-xl">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    profile.name?.charAt(0)?.toUpperCase() || "L"
                  )}
                </div>

                {isOwnProfile && (
                  <>
                    <div className="absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-white bg-[#ec64a8] text-white shadow-md">
                      <Camera size={18} />
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => uploadProfilePhoto(e.target.files?.[0])}
                    />
                  </>
                )}
              </label>

              {uploadingPhoto && (
                <p className="mt-3 text-sm font-black text-[#ec64a8]">
                  Uploading photo...
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <h2 className="text-center text-3xl font-black text-[#2b1d28]">
                  {profile.name}
                  {profile.age ? `, ${profile.age}` : ""}
                </h2>

                {(profile.verified ||
                  profile.verificationStatus === "verified") && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#eef9ee] px-3 py-1 text-xs font-black text-green-600">
                    <ShieldCheck size={14} />
                    Verified
                  </span>
                )}
              </div>

              {profile.showCity && (
                <div className="mt-2 flex items-center gap-2 text-sm font-black text-[#80636f]">
                  <MapPin size={16} className="text-[#ec64a8]" />
                  {profile.city}
                </div>
              )}

              <p className="mt-4 text-center text-sm font-semibold leading-6 text-[#80636f]">
                {profile.bio || "No bio yet."}
              </p>

              <div className="mt-5 grid w-full grid-cols-3 gap-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[24px] bg-[#fff6fa] p-4 text-center"
                  >
                    <p className="text-lg font-black text-[#ec64a8]">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs font-black text-[#80636f]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {isOwnProfile && (
                <div className="mt-5 grid w-full grid-cols-2 gap-3">
                  <button
                    onClick={() => setEditOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(237,102,157,0.20)]"
                  >
                    <Edit3 size={17} />
                    Edit Profile
                  </button>

                  <button
                    onClick={() => navigate("/verify")}
                    className="flex items-center justify-center gap-2 rounded-full border border-[#f1d8e3] bg-white py-4 text-sm font-black text-[#d94b93]"
                  >
                    <ShieldCheck size={17} />
                    Verify
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <ProfileInfoCard
          icon={<Heart size={20} className="text-[#ec64a8]" />}
          title="Interests"
          items={profile.interests || []}
          emptyText="Add your interests so better matches can find you 💕"
        />

        <ProfileInfoCard
          icon={<Coffee size={20} className="text-[#ec64a8]" />}
          title="What I’d Do With Friends"
          items={friendActivities}
          emptyText="No friend activities added yet."
        />

        <ProfileInfoCard
          icon={<Zap size={20} className="text-[#ec64a8]" />}
          title="Social Energy"
          items={socialEnergy}
          emptyText="No social energy added yet."
        />

        <ProfileInfoCard
          icon={<Sparkles size={20} className="text-[#ec64a8]" />}
          title="Vibe"
          items={vibes}
          emptyText="No vibe added yet."
        />

        <FeedPostsCard posts={feedPosts} />

        {isOwnProfile && (
          <div className="mt-6 rounded-[34px] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-[#ec64a8]" />
              <h3 className="text-xl font-black text-[#2b1d28]">
                Account Status
              </h3>
            </div>

            <p className="mt-3 text-sm font-semibold leading-6 text-[#80636f]">
              Verification status:{" "}
              <span className="font-black text-[#ec64a8]">
                {profile.verificationStatus === "verified"
                  ? "Verified"
                  : profile.verificationStatus === "pending"
                  ? "Pending Review"
                  : profile.verificationStatus === "rejected"
                  ? "Rejected"
                  : "Not Verified"}
              </span>
            </p>
          </div>
        )}
      </div>

      {isOwnProfile && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={profile}
          onSave={saveProfile}
        />
      )}

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profile={profile}
        onToggleNotifications={toggleNotifications}
        onToggleCity={toggleCity}
        onLogout={logout}
        onDeleteAccount={deleteAccount}
        onVerify={() => navigate("/verify")}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
}