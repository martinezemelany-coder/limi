import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  X,
  Star,
  MessageCircle,
  MapPin,
  SlidersHorizontal,
  ShieldCheck,
  Flag,
  Ban,
  Sparkles,
  RotateCcw,
} from "lucide-react";

import { auth, db } from "../lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

const interestFilters = [
  "All",
  "Fashion",
  "Art",
  "Travel",
  "Skincare",
  "Fitness",
  "Brunch",
  "Study",
  "Anime",
  "Foodie",
  "Technology",
  "Business",
  "Student",
  "Glow Up",
];

const demoPeople = [
  {
    uid: "demo-ava",
    name: "Ava",
    age: 20,
    city: "Miami, FL",
    bio: "Cafe dates, fashion, pilates, and spontaneous beach days 💕",
    interests: ["Fashion", "Cafe", "Pilates", "Travel"],
    photoURL:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
    verified: true,
  },
  {
    uid: "demo-luna",
    name: "Luna",
    age: 21,
    city: "Miami, FL",
    bio: "Study girlie by day, skincare and sushi lover by night ✨",
    interests: ["Study", "Skincare", "Foodie", "Self Care"],
    photoURL:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
    verified: false,
  },
  {
    uid: "demo-mia",
    name: "Mia",
    age: 19,
    city: "Miami, FL",
    bio: "Gym girlie, beach walks, matcha, and cute reset days 🎀",
    interests: ["Fitness", "Beach", "Glow Up", "Cafe"],
    photoURL:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80",
    verified: true,
  },
];

function normalizeCity(city = "") {
  return city.trim().toLowerCase().split(",")[0];
}

function getAuthProfile() {
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

function defaultActivity() {
  return {
    liked: [],
    superLiked: [],
    passed: [],
    matches: [],
    blocked: [],
    reported: [],
  };
}

function ProfileAvatar({ person, size = "large" }) {
  const classes =
    size === "small"
      ? "h-12 w-12 rounded-2xl text-lg"
      : "h-16 w-16 rounded-[22px] text-2xl";

  if (person.photoURL) {
    return (
      <img
        src={person.photoURL}
        alt={person.name}
        className={`${classes} object-cover`}
      />
    );
  }

  return (
    <div
      className={`${classes} flex items-center justify-center bg-gradient-to-br from-[#f5a2bc] via-[#ef87ad] to-[#d94b93] font-black text-white`}
    >
      {(person.name || "L").charAt(0).toUpperCase()}
    </div>
  );
}

function ActionPill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-5 py-3 text-sm font-black transition ${
        active
          ? "border-transparent bg-gradient-to-r from-[#f29dbc] to-[#f06aa8] text-white shadow-sm"
          : "border-[#f1d8e3] bg-white text-[#6f5d66]"
      }`}
    >
      {children}
    </button>
  );
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

function MatchModal({ person, open, onMessage, onKeepMatching }) {
  if (!open || !person) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/50 px-3 sm:items-center">
      <div className="w-full max-w-md rounded-t-[38px] bg-[#fff8fb] p-6 text-center shadow-2xl sm:rounded-[38px]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] text-white shadow-[0_12px_24px_rgba(237,102,157,0.3)]">
          <Heart size={38} fill="currentColor" />
        </div>

        <h2
          className="mt-4 text-[44px] leading-none tracking-[-0.06em] text-[#eb6aaa]"
          style={{ fontWeight: 1000 }}
        >
          It’s a Match!
        </h2>

        <p className="mt-3 text-base font-bold text-[#80636f]">
          You and {person.name} liked each other 💕
        </p>

        <div className="mt-6 rounded-[30px] bg-white p-5 shadow-sm">
          <div className="flex justify-center">
            <ProfileAvatar person={person} />
          </div>

          <h3 className="mt-3 text-2xl font-black text-[#1f1720]">
            {person.name}, {person.age}
          </h3>

          <p className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-[#96607f]">
            <MapPin size={15} />
            {person.city}
          </p>

          <p className="mt-3 text-sm font-semibold leading-6 text-[#80636f]">
            {person.bio}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <button
            onClick={onMessage}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white shadow-[0_10px_24px_rgba(231,91,150,0.24)]"
          >
            <MessageCircle size={20} />
            Send Message
          </button>

          <button
            onClick={onKeepMatching}
            className="w-full rounded-full border border-[#f0d8e2] bg-white py-4 text-lg font-black text-[#d35a91]"
          >
            Keep Matching
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonCard({
  person,
  onLike,
  onSuperLike,
  onPass,
  onReport,
  onBlock,
}) {
  return (
    <div className="overflow-hidden rounded-[38px] bg-white shadow-[0_14px_36px_rgba(239,148,181,0.16)]">
      <div className="relative h-[30rem] overflow-hidden bg-[#f8dce6]">
        {person.photoURL ? (
          <img
            src={person.photoURL}
            alt={person.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f5a2bc] via-[#ef87ad] to-[#f78e9b] text-8xl font-black text-white">
            {(person.name || "L").charAt(0).toUpperCase()}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute left-5 right-5 top-5 flex justify-end gap-3">
          <button
            onClick={() => onReport(person)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur"
          >
            <Flag size={18} />
          </button>

          <button
            onClick={() => onBlock(person)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur"
          >
            <Ban size={18} />
          </button>
        </div>

        <div className="absolute bottom-5 left-5 right-5 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-4xl font-black tracking-[-0.05em]">
              {person.name}, {person.age}
            </h2>

            {person.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur">
                <ShieldCheck size={14} />
                Verified
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm font-black text-white/90">
            <MapPin size={16} />
            {person.city}
          </div>

          <p className="mt-4 text-base font-semibold leading-7 text-white/95">
            {person.bio}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(person.interests || []).slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 p-5">
        <button
          onClick={() => onPass(person)}
          className="flex items-center justify-center gap-2 rounded-full border border-[#f1d8e3] bg-white py-4 text-lg font-black text-[#80636f]"
        >
          <X size={22} />
        </button>

        <button
          onClick={() => onSuperLike(person)}
          className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4c1d2] to-[#f6a9c3] py-4 text-lg font-black text-white"
        >
          <Star size={22} fill="currentColor" />
        </button>

        <button
          onClick={() => onLike(person)}
          className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white"
        >
          <Heart size={22} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}

function PersonListModal({
  open,
  onClose,
  title,
  people,
  emptyText,
  onChat,
  showChat,
}) {
  return (
    <ModalShell open={open} onClose={onClose} title={title}>
      <div className="space-y-3">
        {people.length ? (
          people.map((person) => (
            <div
              key={person.uid}
              className="flex items-center justify-between gap-3 rounded-[26px] bg-white p-4 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ProfileAvatar person={person} size="small" />

                <div className="min-w-0">
                  <p className="truncate text-base font-black text-[#1f1720]">
                    {person.name}, {person.age}
                  </p>
                  <p className="truncate text-sm font-semibold text-[#80636f]">
                    {person.city}
                  </p>
                </div>
              </div>

              {showChat && (
                <button
                  onClick={() => onChat(person)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-[#f4a1bd] to-[#f06aa8] text-white"
                >
                  <MessageCircle size={18} />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-[26px] bg-white p-6 text-center shadow-sm">
            <Sparkles size={34} className="mx-auto mb-3 text-[#f089b0]" />
            <p className="font-black text-[#80636f]">{emptyText}</p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

export default function Match() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(getAuthProfile());
  const [people, setPeople] = useState([]);
  const [activity, setActivity] = useState(defaultActivity());

  const [interestFilter, setInterestFilter] = useState("All");
  const [areaEnabled, setAreaEnabled] = useState(true);

  const [likedOpen, setLikedOpen] = useState(false);
  const [superLikedOpen, setSuperLikedOpen] = useState(false);
  const [passedOpen, setPassedOpen] = useState(false);
  const [matchesOpen, setMatchesOpen] = useState(false);
  const [newMatch, setNewMatch] = useState(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const userRef = doc(db, "users", uid);

    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();

        const profilePhoto =
          data.profileImage ||
          data.profilePhotoURL ||
          data.profilePhoto ||
          data.photoURL ||
          auth.currentUser?.photoURL ||
          "";

        setCurrentUser({
          ...getAuthProfile(),
          ...data,
          uid,
          photoURL: profilePhoto,
          city: data.city || "",
          interests: data.interests || [],
        });
      }
    });

    return () => unsubUser();
  }, [uid]);

  useEffect(() => {
    const q = query(collection(db, "users"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realUsers = snapshot.docs
        .map((item) => {
          const data = item.data();

          return {
            uid: item.id,
            ...data,
            photoURL:
              data.profileImage ||
              data.profilePhotoURL ||
              data.profilePhoto ||
              data.photoURL ||
              "",
          };
        })
        .filter((person) => {
          const sameUid = person.uid === uid;
          const sameEmail = 
             person.email &&
             auth.currentUser?.email &&
             person.email.toLowerCase() === auth.currentUser.email.toLoweCase();

          return !sameUid && !sameEmail;

        });

      setPeople(realUsers.length ? realUsers : demoPeople);
    });

    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const activityRef = doc(db, "matchActivity", uid);

    const unsubscribe = onSnapshot(activityRef, async (snap) => {
      if (snap.exists()) {
        setActivity({
          ...defaultActivity(),
          ...snap.data(),
        });
      } else {
        await setDoc(activityRef, defaultActivity());
      }
    });

    return () => unsubscribe();
  }, [uid]);

  const updateActivity = async (nextActivity) => {
    if (!uid) return;

    await setDoc(
      doc(db, "matchActivity", uid),
      {
        ...nextActivity,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const createChatWithPerson = async (person) => {
    if (!uid) return null;

    const chatId = [uid, person.uid].sort().join("_");
    const chatRef = doc(db, "chats", chatId);
    const snap = await getDoc(chatRef);

    if (!snap.exists()) {
      await setDoc(chatRef, {
        id: chatId,
        type: "match",
        title: person.name,
        members: [uid, person.uid],
        memberNames: {
          [uid]: currentUser.name,
          [person.uid]: person.name,
        },
        memberPhotos: {
          [uid]: currentUser.photoURL || "",
          [person.uid]: person.photoURL || "",
        },
        lastMessage: "You matched 💕 Say hi!",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return chatId;
  };

  const openChatWithPerson = async (person) => {
    const chatId = await createChatWithPerson(person);
    if (chatId) navigate(`/chat/${chatId}`);
  };

  const markLiked = async (person, type) => {
    const next = {
      ...activity,
      liked: activity.liked || [],
      superLiked: activity.superLiked || [],
      passed: activity.passed || [],
      matches: activity.matches || [],
    };

    next.passed = next.passed.filter((id) => id !== person.uid);

    if (type === "like" && !next.liked.includes(person.uid)) {
      next.liked.push(person.uid);
    }

    if (type === "superLike" && !next.superLiked.includes(person.uid)) {
      next.superLiked.push(person.uid);
    }

    const personActivitySnap = await getDoc(doc(db, "matchActivity", person.uid));
    const personActivity = personActivitySnap.exists()
      ? personActivitySnap.data()
      : defaultActivity();

    const theyLikedMe =
      personActivity.liked?.includes(uid) ||
      personActivity.superLiked?.includes(uid);

    if (theyLikedMe && !next.matches.includes(person.uid)) {
      next.matches.push(person.uid);

      await setDoc(
        doc(db, "matchActivity", person.uid),
        {
          matches: [...new Set([...(personActivity.matches || []), uid])],
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await createChatWithPerson(person);
      setNewMatch(person);
    }

    await updateActivity(next);
  };

  const passPerson = async (person) => {
    const next = {
      ...activity,
      passed: [...new Set([...(activity.passed || []), person.uid])],
      liked: (activity.liked || []).filter((id) => id !== person.uid),
      superLiked: (activity.superLiked || []).filter((id) => id !== person.uid),
    };

    await updateActivity(next);
  };

  const blockPerson = async (person) => {
    const confirmed = window.confirm(`Block ${person.name}?`);
    if (!confirmed) return;

    const next = {
      ...activity,
      blocked: [...new Set([...(activity.blocked || []), person.uid])],
    };

    await updateActivity(next);
  };

  const reportPerson = async (person) => {
    await addDoc(collection(db, "reports"), {
      type: "user",
      reportedUserId: person.uid,
      reportedUserName: person.name,
      reporterId: uid,
      createdAt: serverTimestamp(),
      status: "pending",
    });

    const next = {
      ...activity,
      reported: [...new Set([...(activity.reported || []), person.uid])],
    };

    await updateActivity(next);
    alert("Profile reported. Thank you for helping keep Limi safe.");
  };

  const cityPeople = useMemo(() => {
    const currentCity = normalizeCity(currentUser.city);

    return people.filter((person) => {
      if ((activity.blocked || []).includes(person.uid)) return false;

      if (areaEnabled && normalizeCity(person.city) !== currentCity) {
        return false;
      }

      if (interestFilter !== "All") {
        return (person.interests || []).includes(interestFilter);
      }

      return true;
    });
  }, [people, currentUser.city, areaEnabled, interestFilter, activity.blocked]);

  const discoverPeople = useMemo(() => {
    return cityPeople.filter(
      (person) =>
        !(activity.liked || []).includes(person.uid) &&
        !(activity.superLiked || []).includes(person.uid) &&
        !(activity.passed || []).includes(person.uid) &&
        !(activity.matches || []).includes(person.uid)
    );
  }, [cityPeople, activity]);

  const likedPeople = people.filter((p) => (activity.liked || []).includes(p.uid));
  const superLikedPeople = people.filter((p) =>
    (activity.superLiked || []).includes(p.uid)
  );
  const passedPeople = people.filter((p) => (activity.passed || []).includes(p.uid));
  const matchedPeople = people.filter((p) => (activity.matches || []).includes(p.uid));

  const currentCard = discoverPeople[0];

  return (
    <div className="min-h-screen bg-[#fff6fa] pb-28">
      <div className="mx-auto max-w-md px-4 pt-5">
        <div className="rounded-[38px] bg-[#fffdfd] p-5 shadow-[0_10px_35px_rgba(244,168,194,0.14)]">
          <div className="flex items-start justify-between">
            <div>
              <h1
                className="text-[58px] leading-none tracking-[-0.06em] text-[#eb6aaa]"
                style={{ fontWeight: 1000 }}
              >
                Match
              </h1>

              <p className="mt-2 text-lg font-bold text-[#80636f]">
                find your new friends 💕
              </p>
            </div>

            <button
              onClick={() => setAreaEnabled((prev) => !prev)}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#d94b93] text-white shadow-[0_12px_24px_rgba(237,102,157,0.25)]"
            >
              <SlidersHorizontal size={25} />
            </button>
          </div>

          <div className="mt-6 rounded-[28px] border border-[#f1d8e3] bg-white/80 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#80636f]">
                  Matching Area
                </p>

                <p className="mt-2 text-2xl font-black text-[#2b1d28]">
                  {currentUser.city || "Your city"}
                </p>
              </div>

              <button
                onClick={() => setAreaEnabled((prev) => !prev)}
                className={`relative h-9 w-16 rounded-full transition ${
                  areaEnabled ? "bg-[#d94b93]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-7 w-7 rounded-full bg-white transition ${
                    areaEnabled ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            <p className="mt-4 text-sm font-semibold leading-6 text-[#80636f]">
              Uses the city saved in your profile so you can meet people nearby.
            </p>
          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
            {interestFilters.map((filter) => (
              <ActionPill
                key={filter}
                active={interestFilter === filter}
                onClick={() => setInterestFilter(filter)}
              >
                {filter}
              </ActionPill>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-4 gap-3">
            <button
              onClick={() => setLikedOpen(true)}
              className="rounded-2xl bg-[#fff2f7] px-2 py-4 text-center"
            >
              <Heart size={20} className="mx-auto text-[#ec64a8]" />
              <p className="mt-1 text-[11px] font-black text-[#80636f]">
                Liked {likedPeople.length}
              </p>
            </button>

            <button
              onClick={() => setSuperLikedOpen(true)}
              className="rounded-2xl bg-[#fff2f7] px-2 py-4 text-center"
            >
              <Star size={20} className="mx-auto text-[#ec64a8]" />
              <p className="mt-1 text-[11px] font-black text-[#80636f]">
                Super {superLikedPeople.length}
              </p>
            </button>

            <button
              onClick={() => setPassedOpen(true)}
              className="rounded-2xl bg-[#fff2f7] px-2 py-4 text-center"
            >
              <RotateCcw size={20} className="mx-auto text-[#ec64a8]" />
              <p className="mt-1 text-[11px] font-black text-[#80636f]">
                Passed {passedPeople.length}
              </p>
            </button>

            <button
              onClick={() => setMatchesOpen(true)}
              className="rounded-2xl bg-[#fff2f7] px-2 py-4 text-center"
            >
              <MessageCircle size={20} className="mx-auto text-[#ec64a8]" />
              <p className="mt-1 text-[11px] font-black text-[#80636f]">
                Matches {matchedPeople.length}
              </p>
            </button>
          </div>
        </div>

        <div className="mt-6">
          {currentCard ? (
            <PersonCard
              person={currentCard}
              onLike={(person) => markLiked(person, "like")}
              onSuperLike={(person) => markLiked(person, "superLike")}
              onPass={passPerson}
              onReport={reportPerson}
              onBlock={blockPerson}
            />
          ) : (
            <div className="rounded-[36px] bg-white p-10 text-center shadow-sm">
              <Sparkles size={44} className="mx-auto mb-4 text-[#f089b0]" />

              <h3 className="text-2xl font-black text-[#e85da2]">
                No more profiles
              </h3>

              <p className="mt-2 text-sm font-semibold leading-6 text-[#80636f]">
                Try another interest filter or turn off city-only matching 💕
              </p>
            </div>
          )}
        </div>
      </div>

      <PersonListModal
        open={likedOpen}
        onClose={() => setLikedOpen(false)}
        title="Liked"
        people={likedPeople}
        emptyText="No liked profiles yet."
      />

      <PersonListModal
        open={superLikedOpen}
        onClose={() => setSuperLikedOpen(false)}
        title="Super Liked"
        people={superLikedPeople}
        emptyText="No super likes yet."
      />

      <PersonListModal
        open={passedOpen}
        onClose={() => setPassedOpen(false)}
        title="Passed"
        people={passedPeople}
        emptyText="No passed profiles yet."
      />

      <PersonListModal
        open={matchesOpen}
        onClose={() => setMatchesOpen(false)}
        title="Matches"
        people={matchedPeople}
        emptyText="No matches yet. Keep discovering 💕"
        showChat
        onChat={openChatWithPerson}
      />

      <MatchModal
        open={!!newMatch}
        person={newMatch}
        onMessage={() => {
          if (newMatch) openChatWithPerson(newMatch);
        }}
        onKeepMatching={() => setNewMatch(null)}
      />
    </div>
  );
}