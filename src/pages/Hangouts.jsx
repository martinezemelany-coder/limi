import { getFriendlyFirebaseErrorMessage } from "../lib/firebaseError";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  CalendarDays,
  Clock3,
  UserRound,
  Plus,
  X,
  Check,
  Ban,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";

import { auth, db } from "../lib/firebase";
import {
  addDoc,
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

const hangoutGroups = {
  Social: ["Brunch", "Coffee / Cafe", "Dinner", "Night Out", "Movie"],
  Activities: ["Beach", "Shopping", "Workout", "Pilates / Yoga", "Study"],
  Interests: ["Art / Creative", "Travel", "Events"],
  Other: ["Other"],
};

const starterFilters = [
  { label: "All", emoji: "🌸" },
  { label: "Social", emoji: "💕" },
  { label: "Activities", emoji: "🎀" },
  { label: "Interests", emoji: "✨" },
  { label: "Mine", emoji: "💗" },
];

function getFallbackUserDisplay() {
  const user = auth.currentUser;

  return {
    uid: user?.uid || "guest",
    name: user?.displayName || user?.email?.split("@")[0] || "Limi Girl",
    email: user?.email || "",
    avatar: (user?.displayName || user?.email || "L").charAt(0).toUpperCase(),
    photoURL: user?.photoURL || "",
    city: "",
    age: "",
    bio: "",
    interests: [],
    verified: false,
  };
}

async function getUserDisplayFromProfile() {
  const user = auth.currentUser;
  if (!user) return getFallbackUserDisplay();

  const fallback = getFallbackUserDisplay();
  const profileSnap = await getDoc(doc(db, "users", user.uid));

  if (!profileSnap.exists()) return fallback;

  const profile = profileSnap.data();
  const name = profile.name || profile.displayName || fallback.name;

  return {
    ...fallback,
    name,
    avatar: (name || "L").charAt(0).toUpperCase(),
    photoURL:
      profile.profileImage ||
      profile.profilePhotoURL ||
      profile.profilePhoto ||
      profile.avatarUrl ||
      profile.avatarURL ||
      profile.imageUrl ||
      profile.imageURL ||
      profile.photoURL ||
      fallback.photoURL,
    city: profile.city || fallback.city,
    age: profile.age || fallback.age,
    bio: profile.bio || fallback.bio,
    interests: profile.interests || profile.hobbies || fallback.interests,
    verified: profile.verified || false,
  };
}

function formatDateDisplay(dateValue) {
  if (!dateValue) return "";

  const date = new Date(`${dateValue}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getEmoji(group) {
  const map = {
    Beach: "🏖️",
    Brunch: "🥞",
    "Coffee / Cafe": "☕",
    Shopping: "🛍️",
    Workout: "💪",
    "Pilates / Yoga": "🧘‍♀️",
    Study: "📚",
    Movie: "🎬",
    Dinner: "🍽️",
    "Night Out": "🌙",
    "Art / Creative": "🎨",
    Travel: "✈️",
    Events: "🎟️",
    Other: "🌸",
  };

  return map[group] || "🌸";
}

function getApprovedMembers(item) {
  return (item.requests || []).filter((r) => r.status === "approved");
}

function getPendingMembers(item) {
  return (item.requests || []).filter((r) => r.status === "pending");
}

function getUserRequest(item, currentUser) {
  return (item.requests || []).find((r) => r.uid === currentUser.uid) || null;
}

function isHost(item, currentUser) {
  return item.hostId === currentUser.uid;
}

function hasRequested(item, currentUser) {
  return (item.requests || []).some((r) => r.uid === currentUser.uid);
}

async function createNotification({
  toUid,
  fromUid,
  type,
  title,
  message,
  hangoutId = "",
  chatId = "",
}) {
  if (!toUid) return;

  await addDoc(collection(db, "notifications"), {
    toUid,
    fromUid: fromUid || "",
    type,
    title,
    message,
    hangoutId,
    chatId,
    read: false,
    createdAt: serverTimestamp(),
  });
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
            type="button"
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

function Input({ label, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-[#80636f]">
        {label}
      </label>

      <input
        {...props}
        className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
      />
    </div>
  );
}

function CreateHangoutModal({ open, onClose, currentUser }) {
  const [title, setTitle] = useState("");
  const [groupType, setGroupType] = useState("Social");
  const [group, setGroup] = useState(hangoutGroups.Social[0]);
  const [customGroup, setCustomGroup] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState(6);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setGroupType("Social");
      setGroup(hangoutGroups.Social[0]);
      setCustomGroup("");
      setLocation("");
      setDate("");
      setTime("");
      setDescription("");
      setCapacity(6);
      setSaving(false);
    }
  }, [open]);

  const handleGroupTypeChange = (value) => {
    setGroupType(value);
    setGroup(hangoutGroups[value][0]);
    setCustomGroup("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalGroup = group === "Other" ? customGroup.trim() : group;

    if (
      !title.trim() ||
      !location.trim() ||
      !date ||
      !time ||
      !description.trim() ||
      !finalGroup
    ) {
      alert("Fill out all the hangout details 💕");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "hangouts"), {
        title: title.trim(),
        emoji: getEmoji(group),
        displayGroup: finalGroup,
        groupType,
        group,
        customGroup: group === "Other" ? customGroup.trim() : "",
        location: location.trim(),
        date: formatDateDisplay(date),
        rawDate: date,
        time,
        description: description.trim(),
        capacity: Number(capacity),
        hostId: currentUser.uid,
        host: currentUser.name,
        hostAvatar: currentUser.avatar,
        hostPhotoURL: currentUser.photoURL,
        hostCity: currentUser.city,
        isLocked: false,
        chatId: "",
        requests: [
          {
            id: `host-${currentUser.uid}`,
            uid: currentUser.uid,
            name: currentUser.name,
            age: currentUser.age,
            city: currentUser.city,
            bio: currentUser.bio,
            interests: currentUser.interests,
            avatar: currentUser.avatar,
            photoURL: currentUser.photoURL,
            verified: currentUser.verified,
            status: "approved",
            isHost: true,
          },
        ],
        reports: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message || "Could not create hangout. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Create Hangout">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Hangout Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Cafe date, study session, beach walk..."
        />

        <div>
          <label className="mb-2 block text-sm font-black text-[#80636f]">
            Category
          </label>

          <select
            value={groupType}
            onChange={(e) => handleGroupTypeChange(e.target.value)}
            className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
          >
            <option>Social</option>
            <option>Activities</option>
            <option>Interests</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-[#80636f]">
            Hangout Type
          </label>

          <select
            value={group}
            onChange={(e) => {
              setGroup(e.target.value);
              if (e.target.value !== "Other") setCustomGroup("");
            }}
            className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
          >
            {hangoutGroups[groupType].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        {group === "Other" && (
          <Input
            label="Describe the hangout"
            value={customGroup}
            onChange={(e) => setCustomGroup(e.target.value)}
            placeholder="Picnic, karaoke, pottery class..."
          />
        )}

        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Cafe name, park, campus, mall..."
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <Input
            label="Time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <Input
          label="Capacity"
          type="number"
          min="2"
          max="50"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />

        <div>
          <label className="mb-2 block text-sm font-black text-[#80636f]">
            Description
          </label>

          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell everyone the vibe 💕"
            className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white shadow-[0_10px_24px_rgba(231,91,150,0.24)] disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create Hangout 💕"}
        </button>
      </form>
    </ModalShell>
  );
}

function PersonProfileModal({ open, onClose, person }) {
  if (!open || !person) return null;

  return (
    <ModalShell open={open} onClose={onClose} title="Profile">
      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {person.photoURL ? (
            <img
              src={person.photoURL}
              alt=""
              className="h-20 w-20 rounded-[24px] object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-b from-[#cf5c8d] to-[#b94e80] text-3xl font-black text-white">
              {person.avatar || person.name?.charAt(0) || "L"}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-black text-[#1f1720]">
                {person.name}
                {person.age ? `, ${person.age}` : ""}
              </h3>

              {person.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eef9ee] px-3 py-1 text-xs font-black text-[#5f9d62]">
                  <ShieldCheck size={14} />
                  Verified
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#96607f]">
              <MapPin size={15} className="text-[#d86592]" />
              <span>{person.city || "No city yet"}</span>
            </div>
          </div>
        </div>

        <p className="mt-5 text-[1rem] leading-7 text-gray-700">
          {person.bio || "No bio yet."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(person.interests || []).map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#f0d8e2] bg-white px-4 py-2 text-sm font-black text-[#cd678f]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

function ManageRequestsModal({
  open,
  onClose,
  hangout,
  currentUser,
  onApprove,
  onReject,
  onViewProfile,
  onStartHangout,
  onOpenChat,
  onDeleteHangout,
}) {
  if (!open || !hangout) return null;

  const approved = getApprovedMembers(hangout);
  const pending = getPendingMembers(hangout);
  const host = isHost(hangout, currentUser);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={host ? "Manage Requests" : "Who Joined"}
    >
      <div className="space-y-5">
        <div className="rounded-[26px] bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-[#80636f]">
            Approved
          </h3>

          <div className="space-y-3">
            {approved.length ? (
              approved.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between gap-3 rounded-[20px] bg-[#fff8fb] p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {person.photoURL ? (
                      <img
                        src={person.photoURL}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e85da2] text-sm font-black text-white">
                        {person.avatar}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate font-black text-[#1f1720]">
                        {person.name}
                      </p>
                      <p className="truncate text-sm font-semibold text-[#80636f]">
                        {person.city}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewProfile(person)}
                    className="rounded-full border border-[#f0d8e2] bg-white px-4 py-2 text-xs font-black text-[#d35a91]"
                  >
                    View
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm font-semibold text-[#80636f]">
                No approved members yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[26px] bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-[#80636f]">
            Pending
          </h3>

          <div className="space-y-3">
            {pending.length ? (
              pending.map((person) => (
                <div key={person.id} className="rounded-[20px] bg-[#fff8fb] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {person.photoURL ? (
                        <img
                          src={person.photoURL}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e85da2] text-sm font-black text-white">
                          {person.avatar}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate font-black text-[#1f1720]">
                          {person.name}
                        </p>
                        <p className="truncate text-sm font-semibold text-[#80636f]">
                          {person.city}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onViewProfile(person)}
                      className="rounded-full border border-[#f0d8e2] bg-white px-4 py-2 text-xs font-black text-[#d35a91]"
                    >
                      View
                    </button>
                  </div>

                  {host && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => onApprove(hangout.id, person.id)}
                        className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ef9ca2] via-[#eb7aa0] to-[#d94b93] py-3 text-sm font-black text-white"
                      >
                        <Check size={16} />
                        Accept
                      </button>

                      <button
                        type="button"
                        onClick={() => onReject(hangout.id, person.id)}
                        className="flex items-center justify-center gap-2 rounded-full border border-[#f0d8e2] bg-white py-3 text-sm font-black text-[#b66b88]"
                      >
                        <Ban size={16} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm font-semibold text-[#80636f]">
                No pending requests.
              </p>
            )}
          </div>
        </div>

        {host && !hangout.isLocked && approved.length > 1 && (
          <button
            type="button"
            onClick={() => onStartHangout(hangout)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white"
          >
            <Lock size={18} />
            Lock In + Create Group Chat
          </button>
        )}

        {hangout.isLocked && (
          <button
            type="button"
            onClick={() => onOpenChat(hangout)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 text-lg font-black text-[#d35a91]"
          >
            <MessageCircle size={18} />
            Open Group Chat
          </button>
        )}

        {host && (
          <button
            type="button"
            onClick={() => onDeleteHangout(hangout)}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-white py-4 text-lg font-black text-red-500"
          >
            <Trash2 size={18} />
            Delete Hangout
          </button>
        )}
      </div>
    </ModalShell>
  );
}

function InfoPill({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#fbf7f8] px-4 py-3 text-gray-700">
      <Icon size={18} className="shrink-0 text-[#d86592]" />
      <span className="truncate text-base font-black">{text}</span>
    </div>
  );
}

function HangoutCard({ item, currentUser, onRequestJoin, onManage, onOpenChat }) {
  const approved = getApprovedMembers(item);
  const request = getUserRequest(item, currentUser);
  const host = isHost(item, currentUser);
  const joinedCount = approved.length;
  const spotsLeft = Math.max(Number(item.capacity || 0) - joinedCount, 0);

  let actionButton;

  if (host) {
    actionButton = (
      <button
        type="button"
        onClick={() => onManage(item)}
        className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white"
      >
        Manage Requests 💕
      </button>
    );
  } else if (item.isLocked && request?.status === "approved") {
    actionButton = (
      <button
        type="button"
        onClick={() => onOpenChat(item)}
        className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white"
      >
        Open Group Chat 💬
      </button>
    );
  } else if (!request) {
    actionButton = (
      <button
        type="button"
        onClick={() => onRequestJoin(item)}
        disabled={item.isLocked || spotsLeft <= 0}
        className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white disabled:opacity-50"
      >
        {item.isLocked ? "Hangout Locked" : spotsLeft <= 0 ? "Full" : "Request to Join 💕"}
      </button>
    );
  } else if (request.status === "pending") {
    actionButton = (
      <button
        type="button"
        disabled
        className="w-full rounded-full bg-gray-300 py-4 text-lg font-black text-white"
      >
        Request Pending ⏳
      </button>
    );
  } else if (request.status === "approved") {
    actionButton = (
      <button
        type="button"
        disabled
        className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] to-[#fb8f9f] py-4 text-lg font-black text-white"
      >
        Approved 💖
      </button>
    );
  } else {
    actionButton = (
      <button
        type="button"
        disabled
        className="w-full rounded-full bg-gray-300 py-4 text-lg font-black text-white"
      >
        Request Rejected
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-[36px] bg-white shadow-[0_12px_35px_rgba(239,148,181,0.14)]">
      <div className="relative min-h-[250px] bg-gradient-to-r from-[#ee9ab7] via-[#f18bab] to-[#fb8f9f] p-8 text-white">
        <div className="text-4xl">{item.emoji}</div>

        <div className="mt-6 max-w-[70%]">
          <h3 className="text-[2.35rem] font-black leading-tight tracking-[-0.05em]">
            {item.title}
          </h3>

          <p className="mt-5 text-xl font-black text-white/90">
            {item.displayGroup || item.group}
          </p>
        </div>

        <div className="absolute right-6 top-7 flex flex-col items-center">
          <div className="rounded-full bg-white/20 px-5 py-3 text-2xl font-black">
            {joinedCount}/{item.capacity}
          </div>

          <p className="mt-3 text-lg font-black">{spotsLeft} spots left</p>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoPill icon={MapPin} text={item.location} />
          <InfoPill icon={CalendarDays} text={item.date} />
          <InfoPill icon={Clock3} text={item.time} />
          <InfoPill icon={UserRound} text={`By ${item.host}`} />
        </div>

        <p className="text-[1.05rem] leading-7 text-[#5f4b56]">
          {item.description}
        </p>

        {item.isLocked && (
          <div className="rounded-2xl bg-[#fff1f6] px-4 py-3 text-sm font-black text-[#d35a91]">
            🔒 This hangout is locked in. Approved members can join the chat.
          </div>
        )}

        {actionButton}
      </div>
    </div>
  );
}

export default function Hangouts() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(getFallbackUserDisplay());
  const [hangouts, setHangouts] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [manageHangout, setManageHangout] = useState(null);
  const [profilePerson, setProfilePerson] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setCurrentUser(getFallbackUserDisplay());
        return;
      }

      const profileUser = await getUserDisplayFromProfile();
      setCurrentUser(profileUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "hangouts"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setHangouts(data);

      if (manageHangout) {
        const updated = data.find((item) => item.id === manageHangout.id);
        if (updated) setManageHangout(updated);
      }
    });

    return () => unsubscribe();
  }, [manageHangout]);

  const filteredHangouts = useMemo(() => {
    if (activeFilter === "All") return hangouts;

    if (activeFilter === "Mine") {
      return hangouts.filter((item) => item.hostId === currentUser.uid);
    }

    return hangouts.filter((item) => item.groupType === activeFilter);
  }, [hangouts, activeFilter, currentUser.uid]);

  const deleteHangout = async (hangout) => {
    const confirmed = window.confirm(
      "Delete this hangout? This will remove it for everyone."
    );

    if (!confirmed) return;

    if (hangout.hostId !== currentUser.uid) {
      alert("Only the host can delete this hangout.");
      return;
    }

    try {
      await deleteDoc(doc(db, "hangouts", hangout.id));

      if (hangout.chatId) {
        await deleteDoc(doc(db, "chats", hangout.chatId));
      }

      setManageHangout(null);
      alert("Hangout deleted 💕");
    } catch (error) {
      console.error("Error deleting hangout:", error);
      alert(error.message || "Could not delete hangout.");
    }
  };

  const requestJoin = async (hangout) => {
    if (hasRequested(hangout, currentUser)) return;

    const request = {
      id: `req-${currentUser.uid}-${Date.now()}`,
      uid: currentUser.uid,
      name: currentUser.name,
      age: currentUser.age,
      city: currentUser.city,
      bio: currentUser.bio,
      interests: currentUser.interests,
      avatar: currentUser.avatar,
      photoURL: currentUser.photoURL,
      verified: currentUser.verified,
      status: "pending",
      isHost: false,
    };

    try {
      await updateDoc(doc(db, "hangouts", hangout.id), {
        requests: arrayUnion(request),
        updatedAt: serverTimestamp(),
      });

      await createNotification({
        toUid: hangout.hostId,
        fromUid: currentUser.uid,
        type: "hangout_join_request",
        title: "New hangout request 💕",
        message: `${currentUser.name} wants to join "${hangout.title}".`,
        hangoutId: hangout.id,
      });

      alert("Request sent 💕");
    } catch (error) {
      console.error("Could not request to join:", error);
      alert(error.message || "Could not send request.");
    }
  };

  const approveRequest = async (hangoutId, requestId) => {
    const hangout = hangouts.find((item) => item.id === hangoutId);
    if (!hangout) return;

    const selectedRequest = (hangout.requests || []).find(
      (request) => request.id === requestId
    );

    const updatedRequests = (hangout.requests || []).map((request) =>
      request.id === requestId ? { ...request, status: "approved" } : request
    );

    try {
      await updateDoc(doc(db, "hangouts", hangoutId), {
        requests: updatedRequests,
        updatedAt: serverTimestamp(),
      });

      if (selectedRequest?.uid) {
        await createNotification({
          toUid: selectedRequest.uid,
          fromUid: currentUser.uid,
          type: "hangout_approved",
          title: "You were approved 💖",
          message: `You were approved for "${hangout.title}".`,
          hangoutId,
        });
      }
    } catch (error) {
      console.error("Could not approve request:", error);
      alert(error.message || "Could not approve request.");
    }
  };

  const rejectRequest = async (hangoutId, requestId) => {
    const hangout = hangouts.find((item) => item.id === hangoutId);
    if (!hangout) return;

    const updatedRequests = (hangout.requests || []).map((request) =>
      request.id === requestId ? { ...request, status: "rejected" } : request
    );

    try {
      await updateDoc(doc(db, "hangouts", hangoutId), {
        requests: updatedRequests,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Could not reject request:", error);
      alert(error.message || "Could not reject request.");
    }
  };

  const startHangout = async (hangout) => {
    if (hangout.hostId !== currentUser.uid) {
      alert("Only the host can lock in this hangout.");
      return;
    }

    if (hangout.chatId) {
      await updateDoc(doc(db, "hangouts", hangout.id), {
        isLocked: true,
        updatedAt: serverTimestamp(),
      });

      navigate(`/hangout-chat/${hangout.id}`);
      return;
    }

    const approvedMembers = getApprovedMembers(hangout);
    const memberIds = approvedMembers.map((member) => member.uid);
    const memberProfiles = approvedMembers.map((member) => ({
      uid: member.uid,
      name: member.name,
      avatar: member.avatar,
      photoURL: member.photoURL || "",
      isHost: member.uid === hangout.hostId,
    }));

    try {
      const chatRef = await addDoc(collection(db, "chats"), {
        type: "hangout",
        chatType: "group",
        title: hangout.title,
        name: hangout.title,
        hangoutId: hangout.id,
        memberIds,
        members: memberIds,
        memberProfiles,
        createdBy: currentUser.uid,
        hostId: hangout.hostId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: "Group chat created 💕",
        lastMessageAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "hangouts", hangout.id), {
        isLocked: true,
        chatId: chatRef.id,
        updatedAt: serverTimestamp(),
      });

      await Promise.all(
        memberIds
          .filter((uid) => uid !== currentUser.uid)
          .map((uid) =>
            createNotification({
              toUid: uid,
              fromUid: currentUser.uid,
              type: "group_chat_invite",
              title: "Your group chat is ready 💬",
              message: `The group chat for "${hangout.title}" is ready.`,
              hangoutId: hangout.id,
              chatId: chatRef.id,
            })
          )
      );

      setManageHangout(null);
      navigate(`/hangout-chat/${hangout.id}`);
    } catch (error) {
      console.error("Could not start hangout:", error);
      alert(error.message || "Could not create group chat.");
    }
  };

  const openChat = (hangout) => {
    navigate(`/hangout-chat/${hangout.id}`);
  };

  return (
    <div className="min-h-screen bg-[#fff6fa] pb-28">
      <div className="mx-auto max-w-md px-4 pt-5">
        <div className="rounded-[38px] bg-[#fffdfd] p-5 shadow-[0_10px_35px_rgba(244,168,194,0.14)]">
          <div className="flex items-start justify-between">
            <div>
              <h1
                className="text-[54px] leading-none tracking-[-0.06em] text-[#eb6aaa]"
                style={{ fontWeight: 1000 }}
              >
                Hangouts
              </h1>

              <p className="mt-2 text-lg font-bold text-[#80636f]">
                find friends to hang with 💕
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] text-white shadow-[0_12px_24px_rgba(237,102,157,0.3)]"
            >
              <Plus size={34} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-5 text-xl font-black text-white shadow-[0_12px_24px_rgba(237,102,157,0.22)]"
          >
            <Sparkles size={22} />
            Create Hangout
          </button>

          <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
            {starterFilters.map((filter) => (
              <button
                key={filter.label}
                type="button"
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
          {filteredHangouts.length ? (
            filteredHangouts.map((item) => (
              <HangoutCard
                key={item.id}
                item={item}
                currentUser={currentUser}
                onRequestJoin={requestJoin}
                onManage={setManageHangout}
                onOpenChat={openChat}
              />
            ))
          ) : (
            <div className="rounded-[36px] bg-white p-10 text-center shadow-sm">
              <Sparkles size={44} className="mx-auto mb-4 text-[#f089b0]" />

              <h3 className="text-2xl font-black text-[#e85da2]">
                No hangouts yet
              </h3>

              <p className="mt-2 text-sm font-semibold text-[#80636f]">
                Create the first cute meetup 💕
              </p>
            </div>
          )}
        </div>
      </div>

      <CreateHangoutModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        currentUser={currentUser}
      />

      <ManageRequestsModal
        open={!!manageHangout}
        onClose={() => setManageHangout(null)}
        hangout={manageHangout}
        currentUser={currentUser}
        onApprove={approveRequest}
        onReject={rejectRequest}
        onViewProfile={setProfilePerson}
        onStartHangout={startHangout}
        onOpenChat={openChat}
        onDeleteHangout={deleteHangout}
      />

      <PersonProfileModal
        open={!!profilePerson}
        onClose={() => setProfilePerson(null)}
        person={profilePerson}
      />
    </div>
  );
}