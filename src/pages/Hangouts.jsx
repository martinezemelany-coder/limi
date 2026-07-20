import { getFriendlyFirebaseErrorMessage } from "../lib/firebaseError";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  MoreVertical,
  Pencil,
  Crown,
  Users,
  UserPlus,
  Share2,
  CheckCircle2,
  Hourglass,
} from "lucide-react";

import { auth, db } from "../lib/firebase";

import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";


/* -------------------------------------------------------
   HANGOUT OPTIONS
------------------------------------------------------- */

const hangoutGroups = {
  Social: [
    "Brunch",
    "Coffee / Cafe",
    "Dinner",
    "Night Out",
    "Movie",
  ],

  Activities: [
    "Beach",
    "Shopping",
    "Workout",
    "Pilates / Yoga",
    "Study",
  ],

  Interests: [
    "Art / Creative",
    "Travel",
    "Events",
  ],

  Other: ["Other"],
};

const starterFilters = [
  { label: "All", emoji: "🌸" },
  { label: "Social", emoji: "💕" },
  { label: "Activities", emoji: "🎀" },
  { label: "Interests", emoji: "✨" },
  { label: "Mine", emoji: "💗" },
];

const hangoutThemes = {
  lagoon: {
    card:
      "bg-gradient-to-br from-[#4ed6d3] via-[#73e2d8] to-[#a6f1e5]",

    circles: [
      "-right-16 -top-16 h-52 w-52 bg-white/10",
      "-bottom-20 -left-16 h-60 w-60 bg-[#ffd4e5]/20",
      "left-[42%] top-[38%] h-28 w-28 bg-white/5",
    ],
  },

  mango: {
    card:
      "bg-gradient-to-br from-[#fec66a] via-[#ffab72] to-[#ff8e87]",

    circles: [
      "-left-20 -top-16 h-60 w-60 bg-[#ffd8d1]/20",
      "-bottom-10 right-[-35px] h-40 w-40 bg-white/10",
      "right-[30%] top-[42%] h-20 w-20 bg-[#ffc7c7]/15",
    ],
  },

  glimmer: {
    card:
      "bg-gradient-to-br from-[#ee99c5] via-[#f195b5] to-[#f895a5]",

    circles: [
      "right-[-55px] top-[22%] h-48 w-48 bg-[#ffe1d6]/20",
      "-bottom-24 left-[8%] h-64 w-64 bg-white/10",
      "left-[-25px] top-[-30px] h-24 w-24 bg-[#ffd2ca]/20",
    ],
  },

  sunset: {
    card:
      "bg-gradient-to-br from-[#f8aa7f] via-[#fa9691] to-[#ef79a5]",

    circles: [
      "-left-12 top-[25%] h-40 w-40 bg-white/10",
      "-right-20 -top-20 h-64 w-64 bg-[#ffd8ed]/20",
      "bottom-[12%] right-[25%] h-24 w-24 bg-[#f6bfdd]/15",
    ],
  },

  hibiscus: {
    card:
      "bg-gradient-to-br from-[#f45c9b] via-[#ed72aa] to-[#fa899c]",

    circles: [
      "left-[12%] -top-20 h-52 w-52 bg-[#f7cde4]/15",
      "-bottom-20 -right-16 h-64 w-64 bg-white/10",
      "-left-8 bottom-[18%] h-28 w-28 bg-[#ebb4d2]/15",
    ],
  },

  bahama: {
    card:
      "bg-gradient-to-br from-[#68c9df] via-[#74cfdd] to-[#8ad8d7]",

    circles: [
      "-right-10 top-[12%] h-36 w-36 bg-white/10",
      "-left-24 -bottom-24 h-72 w-72 bg-[#ffe1e9]/20",
      "left-[38%] -top-8 h-24 w-24 bg-[#fac4d7]/15",
      "right-[28%] bottom-[8%] h-16 w-16 bg-white/5",
    ],
  },
};

function getRandomHangoutTheme() {
    const themeNames = Object.keys(hangoutThemes);

    return themeNames[Math.floor(Math.random() * themeNames.length)];
} 

function getHangoutTheme(item = {}) {
  if (item.themeId && hangoutThemes[item.themeId]) {
    return hangoutThemes[item.themeId];
  }

  const themeNames = Object.keys(hangoutThemes);
  const stableText = item.id || item.title || "limi";

  let total = 0;

  for (let index = 0; index < stableText.length; index += 1) {
    total += stableText.charCodeAt(index);
  }

  const fallbackThemeName =
    themeNames[total % themeNames.length];

  return hangoutThemes[fallbackThemeName];
}

/* -------------------------------------------------------
   USER HELPERS
------------------------------------------------------- */

function getFallbackUserDisplay(userOverride = null) {
  const user = userOverride || auth.currentUser;

  const name =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Limi Girl";

  return {
    uid: user?.uid || "",
    name,
    email: user?.email || "",
    avatar: name.charAt(0).toUpperCase(),
    photoURL: user?.photoURL || "",
    city: "",
    age: "",
    bio: "",
    interests: [],
    verified: false,
  };
}

async function getUserDisplayFromProfile(userOverride = null) {
  const user = userOverride || auth.currentUser;

  if (!user) {
    return getFallbackUserDisplay();
  }

  const fallback = getFallbackUserDisplay(user);

  const profileSnapshot = await getDoc(
    doc(db, "users", user.uid)
  );

  if (!profileSnapshot.exists()) {
    return fallback;
  }

  const profile = profileSnapshot.data();

  const name =
    profile.name ||
    profile.displayName ||
    fallback.name;

  return {
    ...fallback,

    uid: user.uid,
    name,

    avatar: (name || "L")
      .charAt(0)
      .toUpperCase(),

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

    city:
      profile.city ||
      profile.displayLocation ||
      profile.location?.displayLocation ||
      profile.location?.city ||
      fallback.city,

    age: profile.age || fallback.age,
    bio: profile.bio || fallback.bio,

    interests: Array.isArray(profile.interests)
      ? profile.interests
      : Array.isArray(profile.hobbies)
        ? profile.hobbies
        : fallback.interests,

    verified:
      profile.verified === true ||
      profile.isVerified === true ||
      profile.verificationStatus === "verified" ||
      profile.verificationStatus === "approved",
  };
}

/* -------------------------------------------------------
   DATE AND TIME HELPERS
------------------------------------------------------- */

function parseHangoutDateTime(hangout) {
  if (!hangout?.rawDate) {
    return null;
  }

  const rawTime = hangout.time || "00:00";

  const date = new Date(
    `${hangout.rawDate}T${rawTime}:00`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDateDisplay(dateValue) {
  if (!dateValue) return "";

  const date = new Date(
    `${dateValue}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime12Hour(timeValue) {
  if (!timeValue) return "";

  const [hoursPart, minutesPart = "0"] =
    String(timeValue).split(":");

  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return timeValue;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getCountdownText(hangout, now = new Date()) {
  const startTime = parseHangoutDateTime(hangout);

  if (!startTime) {
    return "";
  }

  const difference =
    startTime.getTime() - now.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (difference < -6 * hour) {
    return "Hangout ended";
  }

  if (difference <= 0) {
    return "Happening now";
  }

  if (difference < hour) {
    const minutes = Math.max(
      1,
      Math.ceil(difference / minute)
    );

    return `Starts in ${minutes} ${
      minutes === 1 ? "minute" : "minutes"
    }`;
  }

  if (difference < day) {
    const hours = Math.ceil(
      difference / hour
    );

    return `Starts in ${hours} ${
      hours === 1 ? "hour" : "hours"
    }`;
  }

  const days = Math.ceil(
    difference / day
  );

  return `Starts in ${days} ${
    days === 1 ? "day" : "days"
  }`;
}

/* -------------------------------------------------------
   GENERAL HELPERS
------------------------------------------------------- */

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
  return (item?.requests || []).filter(
    (request) => request.status === "approved"
  );
}

function getPendingMembers(item) {
  return (item?.requests || []).filter(
    (request) => request.status === "pending"
  );
}

function getUserRequest(item, currentUser) {
  if (!currentUser?.uid) return null;

  return (
    (item?.requests || []).find(
      (request) =>
        request.uid === currentUser.uid
    ) || null
  );
}

function isHost(item, currentUser) {
  return Boolean(
    item?.hostId &&
      currentUser?.uid &&
      item.hostId === currentUser.uid
  );
}

function hasRequested(item, currentUser) {
  return Boolean(
    (item?.requests || []).some(
      (request) =>
        request.uid === currentUser.uid
    )
  );
}

function getHangoutChatId(hangoutId) {
  return `hangout_${hangoutId}`;
}

function buildMemberIds(hangout) {
  return [
    ...new Set(
      getApprovedMembers(hangout)
        .map((member) => member.uid)
        .filter(Boolean)
    ),
  ];
}

function buildMemberProfiles(hangout) {
  return getApprovedMembers(hangout).map(
    (member) => ({
      uid: member.uid,

      name:
        member.name ||
        "Limi User",

      avatar:
        member.avatar ||
        member.name
          ?.charAt(0)
          ?.toUpperCase() ||
        "L",

      photoURL:
        member.photoURL || "",

      city:
        member.city || "",

      isHost:
        member.uid === hangout.hostId,
    })
  );
}

/* -------------------------------------------------------
   NOTIFICATIONS
------------------------------------------------------- */

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

  await addDoc(
    collection(db, "notifications"),
    {
      toUid,
      fromUid: fromUid || "",
      type,
      title,
      message,
      hangoutId,
      chatId,
      read: false,
      createdAt: serverTimestamp(),
    }
  );
}

async function notifyMembers({
  members,
  excludedUid = "",
  fromUid = "",
  type,
  title,
  message,
  hangoutId,
  chatId = "",
}) {
  const recipientIds = [
    ...new Set(
      (members || [])
        .map((member) => member.uid)
        .filter(
          (uid) =>
            uid &&
            uid !== excludedUid
        )
    ),
  ];

  await Promise.all(
    recipientIds.map((toUid) =>
      createNotification({
        toUid,
        fromUid,
        type,
        title,
        message,
        hangoutId,
        chatId,
      })
    )
  );
}

/* -------------------------------------------------------
   GROUP CHAT SYNCHRONIZATION
------------------------------------------------------- */

async function ensureHangoutChat(
  hangout,
  {
    lockHangout = false,
    currentUser = null,
  } = {}
) {
  if (!hangout?.id) {
    throw new Error(
      "This hangout is missing its ID."
    );
  }

  const chatId =
    hangout.chatId ||
    getHangoutChatId(hangout.id);

  const memberIds =
    buildMemberIds(hangout);

  const memberProfiles =
    buildMemberProfiles(hangout);

  if (
    currentUser?.uid &&
    !memberIds.includes(currentUser.uid)
  ) {
    throw new Error(
      "You are not an approved member of this hangout."
    );
  }

  const chatReference = doc(
    db,
    "chats",
    chatId
  );

  const chatSnapshot = await getDoc(
    chatReference
  );

  const formattedDate =
    formatDateDisplay(hangout.rawDate);

  const formattedTime =
    formatTime12Hour(hangout.time);

  const chatData = {
    id: chatId,

    type: "hangout",
    chatType: "group",

    hangoutId: hangout.id,

    title:
      hangout.title ||
      "Limi Hangout",

    name:
      hangout.title ||
      "Limi Hangout",

    emoji:
      hangout.emoji ||
      getEmoji(hangout.group),

    description:
      hangout.description || "",

    location:
      hangout.location || "",

    rawDate:
      hangout.rawDate || "",

    date:
      formattedDate ||
      hangout.date ||
      "",

    time:
      hangout.time || "",

    formattedTime,

    hostId:
      hangout.hostId || "",

    hostName:
      hangout.host ||
      "Limi Host",

    createdBy:
      hangout.hostId || "",

    memberIds,
    members: memberIds,
    memberProfiles,

    memberCount:
      memberIds.length,

    isLocked:
      lockHangout ||
      hangout.isLocked === true,

    updatedAt:
      serverTimestamp(),
  };

  if (!chatSnapshot.exists()) {
    await setDoc(chatReference, {
      ...chatData,

      lastMessage:
        "Group chat created 💕",

      lastMessageAt:
        serverTimestamp(),

      createdAt:
        serverTimestamp(),
    });
  } else {
    await setDoc(
      chatReference,
      chatData,
      { merge: true }
    );
  }

  await updateDoc(
    doc(db, "hangouts", hangout.id),
    {
      chatId,

      ...(lockHangout
        ? { isLocked: true }
        : {}),

      updatedAt:
        serverTimestamp(),
    }
  );

  return chatId;
}

/* -------------------------------------------------------
   FRIEND REQUEST HELPERS
------------------------------------------------------- */

async function getFriendRelationshipStatus(
  firstUid,
  secondUid
) {
  if (!firstUid || !secondUid) {
    return "none";
  }

  const friendDocument = await getDoc(
    doc(
      db,
      "users",
      firstUid,
      "friends",
      secondUid
    )
  );

  if (friendDocument.exists()) {
    return "friends";
  }

  const sentRequestsSnapshot =
    await getDocs(
      query(
        collection(db, "friendRequests"),
        where("fromUid", "==", firstUid),
        where("toUid", "==", secondUid)
      )
    );

  const receivedRequestsSnapshot =
    await getDocs(
      query(
        collection(db, "friendRequests"),
        where("fromUid", "==", secondUid),
        where("toUid", "==", firstUid)
      )
    );

  const requests = [
    ...sentRequestsSnapshot.docs,
    ...receivedRequestsSnapshot.docs,
  ].map((requestDocument) => ({
    id: requestDocument.id,
    ...requestDocument.data(),
  }));

  if (
    requests.some(
      (request) =>
        request.status === "accepted"
    )
  ) {
    return "friends";
  }

  if (
    requests.some(
      (request) =>
        request.status === "pending"
    )
  ) {
    return "pending";
  }

  return "none";
}

/* -------------------------------------------------------
   SHARED MODAL AND INPUT
------------------------------------------------------- */

function ModalShell({
  open,
  onClose,
  title,
  children,
}) {
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

function Input({
  label,
  className = "",
  ...props
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-[#80636f]">
        {label}
      </label>

      <input
        {...props}
        className={`w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9] ${className}`}
      />
    </div>
  );
}

/* -------------------------------------------------------
   HANGOUT FORM
------------------------------------------------------- */

function HangoutForm({
  initialHangout = null,
  currentUser,
  onSubmit,
  saving,
  submitText,
}) {
  const defaultGroupType =
    initialHangout?.groupType &&
    hangoutGroups[
      initialHangout.groupType
    ]
      ? initialHangout.groupType
      : "Social";

  const defaultGroup =
    initialHangout?.group ||
    hangoutGroups[
      defaultGroupType
    ][0];

  const [title, setTitle] = useState(
    initialHangout?.title || ""
  );

  const [
    groupType,
    setGroupType,
  ] = useState(defaultGroupType);

  const [group, setGroup] = useState(
    defaultGroup
  );

  const [
    customGroup,
    setCustomGroup,
  ] = useState(
    initialHangout?.customGroup || ""
  );

  const [
    location,
    setLocation,
  ] = useState(
    initialHangout?.location || ""
  );

  const [date, setDate] = useState(
    initialHangout?.rawDate || ""
  );

  const [time, setTime] = useState(
    initialHangout?.time || ""
  );

  const [
    description,
    setDescription,
  ] = useState(
    initialHangout?.description || ""
  );

  const [
    capacity,
    setCapacity,
  ] = useState(
    Number(
      initialHangout?.capacity || 6
    )
  );

  useEffect(() => {
    const nextGroupType =
      initialHangout?.groupType &&
      hangoutGroups[
        initialHangout.groupType
      ]
        ? initialHangout.groupType
        : "Social";

    const nextGroup =
      initialHangout?.group ||
      hangoutGroups[nextGroupType][0];

    setTitle(
      initialHangout?.title || ""
    );

    setGroupType(nextGroupType);
    setGroup(nextGroup);

    setCustomGroup(
      initialHangout?.customGroup || ""
    );

    setLocation(
      initialHangout?.location || ""
    );

    setDate(
      initialHangout?.rawDate || ""
    );

    setTime(
      initialHangout?.time || ""
    );

    setDescription(
      initialHangout?.description || ""
    );

    setCapacity(
      Number(
        initialHangout?.capacity || 6
      )
    );
  }, [initialHangout]);

  const handleGroupTypeChange = (
    nextGroupType
  ) => {
    setGroupType(nextGroupType);

    setGroup(
      hangoutGroups[
        nextGroupType
      ][0]
    );

    setCustomGroup("");
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const finalGroup =
      group === "Other"
        ? customGroup.trim()
        : group;

    if (
      !title.trim() ||
      !location.trim() ||
      !date ||
      !time ||
      !description.trim() ||
      !finalGroup
    ) {
      window.alert(
        "Fill out all the hangout details 💕"
      );

      return;
    }

    const approvedCount =
      initialHangout
        ? getApprovedMembers(
            initialHangout
          ).length
        : 1;

    if (
      Number(capacity) <
      approvedCount
    ) {
      window.alert(
        `Capacity cannot be lower than the ${approvedCount} people already approved.`
      );

      return;
    }

    await onSubmit({
      title: title.trim(),

      emoji:
        getEmoji(group),

      displayGroup:
        finalGroup,

      groupType,
      group,

      customGroup:
        group === "Other"
          ? customGroup.trim()
          : "",

      location:
        location.trim(),

      rawDate:
        date,

      date:
        formatDateDisplay(date),

      time,

      formattedTime:
        formatTime12Hour(time),

      description:
        description.trim(),

      capacity: Math.max(
        2,
        Math.min(
          50,
          Number(capacity) || 6
        )
      ),

      hostId:
        initialHangout?.hostId ||
        currentUser.uid,

      host:
        initialHangout?.host ||
        currentUser.name,

      hostAvatar:
        initialHangout?.hostAvatar ||
        currentUser.avatar,

      hostPhotoURL:
        initialHangout?.hostPhotoURL ||
        currentUser.photoURL,

      hostCity:
        initialHangout?.hostCity ||
        currentUser.city,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <Input
        label="Hangout Title"
        value={title}
        onChange={(event) =>
          setTitle(event.target.value)
        }
        placeholder="Cafe date, study session, beach walk..."
      />

      <div>
        <label className="mb-2 block text-sm font-black text-[#80636f]">
          Category
        </label>

        <select
          value={groupType}
          onChange={(event) =>
            handleGroupTypeChange(
              event.target.value
            )
          }
          className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
        >
          {Object.keys(
            hangoutGroups
          ).map((type) => (
            <option
              key={type}
              value={type}
            >
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-black text-[#80636f]">
          Hangout Type
        </label>

        <select
          value={group}
          onChange={(event) => {
            const nextGroup =
              event.target.value;

            setGroup(nextGroup);

            if (
              nextGroup !== "Other"
            ) {
              setCustomGroup("");
            }
          }}
          className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
        >
          {hangoutGroups[
            groupType
          ].map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>
      </div>

      {group === "Other" && (
        <Input
          label="Describe the hangout"
          value={customGroup}
          onChange={(event) =>
            setCustomGroup(
              event.target.value
            )
          }
          placeholder="Picnic, karaoke, pottery class..."
        />
      )}

      <Input
        label="Location"
        value={location}
        onChange={(event) =>
          setLocation(
            event.target.value
          )
        }
        placeholder="Cafe name, park, campus, mall..."
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(event) =>
            setDate(
              event.target.value
            )
          }
        />

        <Input
          label="Time"
          type="time"
          value={time}
          onChange={(event) =>
            setTime(
              event.target.value
            )
          }
        />
      </div>

      <Input
        label="Capacity"
        type="number"
        min="2"
        max="50"
        value={capacity}
        onChange={(event) =>
          setCapacity(
            event.target.value
          )
        }
      />

      <div>
        <label className="mb-2 block text-sm font-black text-[#80636f]">
          Description
        </label>

        <textarea
          rows={4}
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          placeholder="Tell everyone the vibe 💕"
          className="w-full resize-none rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 outline-none focus:border-[#ef9ab9]"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white shadow-[0_10px_24px_rgba(231,91,150,0.24)] disabled:opacity-60"
      >
        {saving
          ? "Saving..."
          : submitText}
      </button>
    </form>
  );
}

/* -------------------------------------------------------
   CREATE HANGOUT MODAL
------------------------------------------------------- */

function CreateHangoutModal({
  open,
  onClose,
  currentUser,
  onCreate,
}) {
  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (open) {
      setSaving(false);
    }
  }, [open]);

  const handleCreate = async (
    formData
  ) => {
    try {
      setSaving(true);

      await onCreate(formData);

      onClose();
    } catch (error) {
      console.error(
        "Could not create hangout:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "Could not create hangout."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Create Hangout"
    >
      {open && (
        <HangoutForm
          key="create-hangout-form"
          currentUser={currentUser}
          onSubmit={handleCreate}
          saving={saving}
          submitText="Create Hangout 💕"
        />
      )}
    </ModalShell>
  );
}

/* -------------------------------------------------------
   EDIT HANGOUT MODAL
------------------------------------------------------- */

function EditHangoutModal({
  open,
  onClose,
  hangout,
  currentUser,
  onSave,
}) {
  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (open) {
      setSaving(false);
    }
  }, [open]);

  if (!open || !hangout) {
    return null;
  }

  const handleSave = async (
    formData
  ) => {
    try {
      setSaving(true);

      await onSave(
        hangout,
        formData
      );

      onClose();
    } catch (error) {
      console.error(
        "Could not edit hangout:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "Could not update hangout."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Edit Hangout"
    >
      <HangoutForm
        key={`edit-${hangout.id}`}
        initialHangout={hangout}
        currentUser={currentUser}
        onSubmit={handleSave}
        saving={saving}
        submitText="Save Changes"
      />
    </ModalShell>
  );
}
/* -------------------------------------------------------
   PERSON PROFILE MODAL
------------------------------------------------------- */

function PersonProfileModal({
  open,
  onClose,
  person,
}) {
  if (!open || !person) {
    return null;
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Profile"
    >
      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {person.photoURL ? (
            <img
              src={person.photoURL}
              alt={person.name || "Profile"}
              className="h-20 w-20 rounded-[24px] object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-b from-[#cf5c8d] to-[#b94e80] text-3xl font-black text-white">
              {person.avatar ||
                person.name
                  ?.charAt(0)
                  ?.toUpperCase() ||
                "L"}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-black text-[#1f1720]">
                {person.name || "Limi User"}
                {person.age
                  ? `, ${person.age}`
                  : ""}
              </h3>

              {person.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eef9ee] px-3 py-1 text-xs font-black text-[#5f9d62]">
                  <ShieldCheck size={14} />
                  Verified
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#96607f]">
              <MapPin
                size={15}
                className="text-[#d86592]"
              />

              <span>
                {person.city ||
                  "No city yet"}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-5 text-[1rem] leading-7 text-gray-700">
          {person.bio || "No bio yet."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(person.interests || []).length ? (
            person.interests.map(
              (interest, index) => (
                <span
                  key={`${interest}-${index}`}
                  className="rounded-full border border-[#f0d8e2] bg-white px-4 py-2 text-sm font-black text-[#cd678f]"
                >
                  {interest}
                </span>
              )
            )
          ) : (
            <p className="text-sm font-semibold text-[#80636f]">
              No interests added yet.
            </p>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------
   FRIEND REQUEST BUTTON
------------------------------------------------------- */

function AddFriendButton({
  person,
  currentUser,
  onSendFriendRequest,
}) {
  const [status, setStatus] =
    useState("loading");

  const [sending, setSending] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      if (
        !person?.uid ||
        !currentUser?.uid ||
        person.uid === currentUser.uid
      ) {
        setStatus("self");
        return;
      }

      try {
        setStatus("loading");

        const relationshipStatus =
          await getFriendRelationshipStatus(
            currentUser.uid,
            person.uid
          );

        if (!cancelled) {
          setStatus(
            relationshipStatus
          );
        }
      } catch (error) {
        console.error(
          "Could not check friendship:",
          error
        );

        if (!cancelled) {
          setStatus("none");
        }
      }
    }

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, [
    person?.uid,
    currentUser?.uid,
  ]);

  const handleAddFriend = async () => {
    if (
      sending ||
      status !== "none"
    ) {
      return;
    }

    try {
      setSending(true);

      await onSendFriendRequest(
        person
      );

      setStatus("pending");
    } catch (error) {
      console.error(
        "Could not send friend request:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "Could not send friend request."
      );
    } finally {
      setSending(false);
    }
  };

  if (
    status === "self" ||
    !person?.uid
  ) {
    return null;
  }

  if (status === "friends") {
    return (
      <button
        type="button"
        disabled
        className="flex items-center justify-center gap-2 rounded-full bg-[#eef9ee] px-4 py-2 text-xs font-black text-green-600"
      >
        <Check size={14} />
        Friends
      </button>
    );
  }

  if (
    status === "pending" ||
    status === "loading"
  ) {
    return (
      <button
        type="button"
        disabled
        className="flex items-center justify-center gap-2 rounded-full border border-[#f0d8e2] bg-white px-4 py-2 text-xs font-black text-[#9b7a89]"
      >
        <Hourglass size={14} />

        {status === "loading"
          ? "Checking..."
          : "Requested"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAddFriend}
      disabled={sending}
      className="flex items-center justify-center gap-2 rounded-full bg-[#fff0f6] px-4 py-2 text-xs font-black text-[#d35a91] disabled:opacity-60"
    >
      <UserPlus size={14} />

      {sending
        ? "Sending..."
        : "Add Friend"}
    </button>
  );
}

/* -------------------------------------------------------
   PERSON ROW
------------------------------------------------------- */

function PersonRequestRow({
  person,
  currentUser,
  host,
  pending = false,
  onApprove,
  onReject,
  onViewProfile,
  onSendFriendRequest,
}) {
  return (
    <div className="rounded-[20px] bg-[#fff8fb] p-3">
      <div className="flex items-center gap-3">
        {person.photoURL ? (
          <img
            src={person.photoURL}
            alt={person.name || ""}
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e85da2] text-sm font-black text-white">
            {person.avatar ||
              person.name
                ?.charAt(0)
                ?.toUpperCase() ||
              "L"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-black text-[#1f1720]">
              {person.name ||
                "Limi User"}
            </p>

            {person.isHost && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0d6] px-2 py-1 text-[10px] font-black uppercase text-[#b7791f]">
                <Crown size={11} />
                Host
              </span>
            )}
          </div>

          <p className="truncate text-sm font-semibold text-[#80636f]">
            {person.city ||
              "No city added"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onViewProfile(person)
          }
          className="flex-1 rounded-full border border-[#f0d8e2] bg-white px-4 py-2 text-xs font-black text-[#d35a91]"
        >
          View Profile
        </button>

        <AddFriendButton
          person={person}
          currentUser={currentUser}
          onSendFriendRequest={
            onSendFriendRequest
          }
        />
      </div>

      {host && pending && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onApprove}
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ef9ca2] via-[#eb7aa0] to-[#d94b93] py-3 text-sm font-black text-white"
          >
            <Check size={16} />
            Accept
          </button>

          <button
            type="button"
            onClick={onReject}
            className="flex items-center justify-center gap-2 rounded-full border border-[#f0d8e2] bg-white py-3 text-sm font-black text-[#b66b88]"
          >
            <Ban size={16} />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   MANAGE REQUESTS MODAL
------------------------------------------------------- */

function ManageRequestsModal({
  open,
  onClose,
  hangout,
  currentUser,
  onApprove,
  onReject,
  onViewProfile,
  onLockHangout,
  onOpenChat,
  onSendFriendRequest,
}) {
  if (!open || !hangout) {
    return null;
  }

  const approved =
    getApprovedMembers(hangout);

  const pending =
    getPendingMembers(hangout);

  const host =
    isHost(hangout, currentUser);

  const approvedNonHost =
    approved.filter(
      (person) =>
        person.uid !==
        hangout.hostId
    );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={
        host
          ? "Manage Requests"
          : "Who Joined"
      }
    >
      <div className="space-y-5">
        <div className="rounded-[26px] bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] p-5 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/20 text-2xl">
              {hangout.emoji ||
                getEmoji(
                  hangout.group
                )}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-xl font-black">
                {hangout.title}
              </h3>

              <p className="mt-1 text-sm font-bold text-white/90">
                {approved.length}/
                {hangout.capacity} joined
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[#80636f]">
              Approved
            </h3>

            <span className="rounded-full bg-[#fff0f6] px-3 py-1 text-xs font-black text-[#d94b93]">
              {approved.length}
            </span>
          </div>

          <div className="space-y-3">
            {approved.length ? (
              approved.map((person) => (
                <PersonRequestRow
                  key={
                    person.id ||
                    person.uid
                  }
                  person={person}
                  currentUser={
                    currentUser
                  }
                  host={host}
                  onViewProfile={
                    onViewProfile
                  }
                  onSendFriendRequest={
                    onSendFriendRequest
                  }
                />
              ))
            ) : (
              <p className="text-sm font-semibold text-[#80636f]">
                No approved members yet.
              </p>
            )}
          </div>
        </div>

        {host && (
          <div className="rounded-[26px] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[#80636f]">
                Pending
              </h3>

              <span className="rounded-full bg-[#fff0f6] px-3 py-1 text-xs font-black text-[#d94b93]">
                {pending.length}
              </span>
            </div>

            <div className="space-y-3">
              {pending.length ? (
                pending.map((person) => (
                  <PersonRequestRow
                    key={
                      person.id ||
                      person.uid
                    }
                    person={person}
                    currentUser={
                      currentUser
                    }
                    host
                    pending
                    onApprove={() =>
                      onApprove(
                        hangout.id,
                        person.id
                      )
                    }
                    onReject={() =>
                      onReject(
                        hangout.id,
                        person.id
                      )
                    }
                    onViewProfile={
                      onViewProfile
                    }
                    onSendFriendRequest={
                      onSendFriendRequest
                    }
                  />
                ))
              ) : (
                <div className="rounded-[20px] bg-[#fff8fb] p-5 text-center">
                  <Sparkles 
                    size={30}
                    className="mx-auto text-[#f089b0]"
                  />

                  <p className="mt-2 text-sm font-semibold text-[#80636f]">
                    No pending requests.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!host &&
          approvedNonHost.length ===
            0 && (
            <div className="rounded-[24px] bg-white p-5 text-center shadow-sm">
              <Users
                size={34}
                className="mx-auto text-[#f089b0]"
              />

              <p className="mt-3 text-sm font-semibold text-[#80636f]">
                Nobody else has joined yet.
              </p>
            </div>
          )}

        {host &&
          !hangout.isLocked &&
          approved.length > 1 && (
            <button
              type="button"
              onClick={() =>
                onLockHangout(
                  hangout
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white"
            >
              <Lock size={18} />
              Lock In + Open Chat
            </button>
          )}

        {host &&
          !hangout.isLocked &&
          approved.length <= 1 && (
            <div className="rounded-[24px] bg-[#fff0f6] p-4 text-center">
              <p className="text-sm font-bold leading-6 text-[#9a6b80]">
                Approve at least one
                person before locking in
                the hangout.
              </p>
            </div>
          )}

        {hangout.isLocked && (
          <button
            type="button"
            onClick={() =>
              onOpenChat(hangout)
            }
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white"
          >
            <MessageCircle size={18} />
            Open Group Chat
          </button>
        )}
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------
   INFO PILL
------------------------------------------------------- */

function InfoPill({
  icon: Icon,
  text,
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-[#fbf7f8] px-4 py-3 text-gray-700">
      <Icon
        size={18}
        className="shrink-0 text-[#d86592]"
      />

      <span className="truncate text-sm font-black">
        {text}
      </span>
    </div>
  );
}

/* -------------------------------------------------------
   HOST THREE-DOT MENU
------------------------------------------------------- */

function HostMenu({
  onEdit,
  onDelete,
}) {
  const [open, setOpen] =
    useState(false);

  const menuReference =
    useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const closeMenu = (event) => {
      if (
        menuReference.current &&
        !menuReference.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      closeMenu
    );

    document.addEventListener(
      "touchstart",
      closeMenu
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeMenu
      );

      document.removeEventListener(
        "touchstart",
        closeMenu
      );
    };
  }, [open]);

  return (
    <div
      ref={menuReference}
      className="relative z-30"
    >
      <button
        type="button"
        aria-label="Hangout options"
        onClick={() =>
          setOpen(
            (currentOpen) =>
              !currentOpen
          )
        }
        className="flex h-11 w-11 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur"
      >
        <MoreVertical size={21} />
      </button>

      {open && (
        <div className="absolute right-0 top-13 w-44 overflow-hidden rounded-[20px] bg-white p-2 text-[#2b1d28] shadow-2xl">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm font-black hover:bg-[#fff0f6]"
          >
            <Pencil
              size={17}
              className="text-[#d94b93]"
            />

            Edit Hangout
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm font-black text-red-500 hover:bg-red-50"
          >
            <Trash2 size={17} />
            Delete Hangout
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   HANGOUT CARD
------------------------------------------------------- */

function HangoutCard({
  item,
  currentUser,
  now,
  onRequestJoin,
  onManage,
  onOpenChat,
  onEdit,
  onDelete,
  onShare,
}) {

  const cardTheme = getHangoutTheme(item); 

  const approved =
    getApprovedMembers(item);

  const request =
    getUserRequest(
      item,
      currentUser
    );

  const host =
    isHost(item, currentUser);

  const joinedCount =
    approved.length;

  const capacity =
    Number(item.capacity || 0);

  const spotsLeft = Math.max(
    capacity - joinedCount,
    0
  );

  const isFull =
    capacity > 0 &&
    spotsLeft <= 0;

  const countdown =
    getCountdownText(
      item,
      now
    );

  const approvedMember =
    request?.status === "approved";

  let actionButton;

  if (host) {
    actionButton = (
      <button
        type="button"
        onClick={() =>
          onManage(item)
        }
        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white"
      >
        <Users size={19} />
        Manage Requests
      </button>
    );
  } else if (
    item.isLocked &&
    approvedMember
  ) {
    actionButton = (
      <button
        type="button"
        onClick={() =>
          onOpenChat(item)
        }
        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white"
      >
        <MessageCircle size={19} />
        Open Group Chat
      </button>
    );
  } else if (!request) {
    actionButton = (
      <button
        type="button"
        onClick={() =>
          onRequestJoin(item)
        }
        disabled={
          item.isLocked ||
          isFull
        }
        className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white disabled:opacity-50"
      >
        {item.isLocked
          ? "Hangout Locked"
          : isFull
            ? "Hangout Full"
            : "Request to Join 💕"}
      </button>
    );
  } else if (
    request.status === "pending"
  ) {
    actionButton = (
      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#eadde3] py-4 text-lg font-black text-[#9b7a89]"
      >
        <Hourglass size={19} />
        Request Pending
      </button>
    );
  } else if (
    request.status === "approved"
  ) {
    actionButton = (
      <button
        type="button"
        onClick={() =>
          onManage(item)
        }
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#fff0f6] py-4 text-lg font-black text-[#d94b93]"
      >
        <CheckCircle2 size={19} />
        You’re In!
      </button>
    );
  } else {
    actionButton = (
      <button
        type="button"
        disabled
        className="w-full rounded-full bg-gray-200 py-4 text-lg font-black text-gray-500"
      >
        Request Declined
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-[36px] bg-white shadow-[0_12px_35px_rgba(239,148,181,0.14)]">
      <div
  className={`relative min-h-[250px] overflow-hidden p-7 text-white ${cardTheme.card}`}
>
  {cardTheme.circles.map((circleClasses, index) => (
  <div
    key={`${item.id}-circle-${index}`}
    className={`pointer-events-none absolute rounded-full ${circleClasses}`}
  />
))}

        <div className="flex items-start justify-between gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/20 text-3xl backdrop-blur">
            {item.emoji ||
              getEmoji(
                item.group
              )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onShare(item)
              }
              aria-label="Share hangout"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/15 text-white backdrop-blur"
            >
              <Share2 size={19} />
            </button>

            {host && (
              <HostMenu
                onEdit={() =>
                  onEdit(item)
                }
                onDelete={() =>
                  onDelete(item)
                }
              />
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex flex-wrap gap-2">
            {host && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur">
                <Crown size={13} />
                You’re the Host
              </span>
            )}

            {!host &&
              approvedMember && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur">
                  <CheckCircle2
                    size={13}
                  />
                  You’re In
                </span>
              )}

            {item.isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/15 px-3 py-1 text-xs font-black backdrop-blur">
                <Lock size={13} />
                Locked In
              </span>
            )}

            {isFull && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#d94b93]">
                FULL
              </span>
            )}
          </div>

          <h3 className="mt-4 text-[2.2rem] font-black leading-tight tracking-[-0.05em]">
            {item.title}
          </h3>

          <p className="mt-3 text-lg font-black text-white/90">
            {item.displayGroup ||
              item.group}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[20px] bg-white/18 px-4 py-3 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/80">
              Joined
            </p>

            <p className="mt-1 text-xl font-black">
              {joinedCount}/
              {capacity}
            </p>
          </div>

          <div className="rounded-[20px] bg-white/18 px-4 py-3 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/80">
              Availability
            </p>

            <p className="mt-1 text-xl font-black">
              {isFull
                ? "Full"
                : `${spotsLeft} ${
                    spotsLeft === 1
                      ? "spot"
                      : "spots"
                  }`}
            </p>
          </div>
        </div>

        {countdown && (
          <div className="mt-3 rounded-[20px] bg-black/15 px-4 py-3 text-center text-sm font-black backdrop-blur">
            {countdown}
          </div>
        )}

      </div>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoPill
            icon={MapPin}
            text={
              item.location ||
              "Location not set"
            }
          />

          <InfoPill
            icon={CalendarDays}
            text={
              formatDateDisplay(
                item.rawDate
              ) ||
              item.date ||
              "Date not set"
            }
          />

          <InfoPill
            icon={Clock3}
            text={
              formatTime12Hour(
                item.time
              ) ||
              item.formattedTime ||
              "Time not set"
            }
          />

          <InfoPill
            icon={UserRound}
            text={`By ${
              item.host ||
              "Limi Host"
            }`}
          />
        </div>

        <p className="text-[1.02rem] leading-7 text-[#5f4b56]">
          {item.description}
        </p>

        {item.isLocked && (
          <div className="rounded-2xl bg-[#fff1f6] px-4 py-3 text-sm font-black leading-6 text-[#d35a91]">
            🔒 This hangout is locked
            in. Approved members can
            access the shared group
            chat.
          </div>
        )}

        {actionButton}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   MAIN HANGOUTS PAGE
------------------------------------------------------- */

export default function Hangouts() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] =
    useState(getFallbackUserDisplay());

  const [hangouts, setHangouts] =
    useState([]);

  const [activeFilter, setActiveFilter] =
    useState("All");

  const [createOpen, setCreateOpen] =
    useState(false);

  const [
    manageHangout,
    setManageHangout,
  ] = useState(null);

  const [
    editHangout,
    setEditHangout,
  ] = useState(null);

  const [
    profilePerson,
    setProfilePerson,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [now, setNow] = useState(
    new Date()
  );

  /* -------------------------------------------------------
     LOAD CURRENT USER
  ------------------------------------------------------- */

  useEffect(() => {
    const unsubscribe =
      auth.onAuthStateChanged(
        async (user) => {
          if (!user) {
            setCurrentUser(
              getFallbackUserDisplay()
            );

            return;
          }

          try {
            const profileUser =
              await getUserDisplayFromProfile(
                user
              );

            setCurrentUser(
              profileUser
            );
          } catch (error) {
            console.error(
              "Could not load user profile:",
              error
            );

            setCurrentUser(
              getFallbackUserDisplay(
                user
              )
            );
          }
        }
      );

    return () => unsubscribe();
  }, []);

  /* -------------------------------------------------------
     LOAD HANGOUTS LIVE
  ------------------------------------------------------- */

  useEffect(() => {
    const hangoutsQuery = query(
      collection(db, "hangouts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      hangoutsQuery,
      (snapshot) => {
        const loadedHangouts =
          snapshot.docs.map(
            (documentItem) => ({
              id: documentItem.id,
              ...documentItem.data(),
            })
          );

        setHangouts(
          loadedHangouts
        );

        setManageHangout(
          (currentManagedHangout) => {
            if (
              !currentManagedHangout
            ) {
              return null;
            }

            return (
              loadedHangouts.find(
                (hangout) =>
                  hangout.id ===
                  currentManagedHangout.id
              ) || null
            );
          }
        );

        setEditHangout(
          (currentEditHangout) => {
            if (!currentEditHangout) {
              return null;
            }

            return (
              loadedHangouts.find(
                (hangout) =>
                  hangout.id ===
                  currentEditHangout.id
              ) || null
            );
          }
        );

        setLoading(false);
      },
      (error) => {
        console.error(
          "Could not load hangouts:",
          error
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /* -------------------------------------------------------
     UPDATE COUNTDOWNS
  ------------------------------------------------------- */

  useEffect(() => {
    const interval = window.setInterval(
      () => {
        setNow(new Date());
      },
      60 * 1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /* -------------------------------------------------------
     FILTER HANGOUTS
  ------------------------------------------------------- */

  const filteredHangouts =
    useMemo(() => {
      if (activeFilter === "All") {
        return hangouts;
      }

      if (activeFilter === "Mine") {
        return hangouts.filter(
          (hangout) =>
            hangout.hostId ===
              currentUser.uid ||
            getUserRequest(
              hangout,
              currentUser
            )?.status === "approved"
        );
      }

      return hangouts.filter(
        (hangout) =>
          hangout.groupType ===
          activeFilter
      );
    }, [
      hangouts,
      activeFilter,
      currentUser,
    ]);

  /* -------------------------------------------------------
     CREATE HANGOUT
  ------------------------------------------------------- */

  const createHangout = async (
    formData
  ) => {
    if (!currentUser.uid) {
      throw new Error(
        "Please sign in again."
      );
    }

  const themeId = getRandomHangoutTheme();

    await addDoc(
      collection(db, "hangouts"),
      {
        ...formData,

        themeId: themeId,
        isLocked: false,
        chatId: "",

        /*
          Reserved for the future
          Limi+ cover-photo feature.
        */
        coverPhotoURL: "",

        requests: [
          {
            id: `host-${currentUser.uid}`,

            uid:
              currentUser.uid,

            name:
              currentUser.name,

            age:
              currentUser.age || "",

            city:
              currentUser.city || "",

            bio:
              currentUser.bio || "",

            interests:
              currentUser.interests || [],

            avatar:
              currentUser.avatar,

            photoURL:
              currentUser.photoURL || "",

            verified:
              currentUser.verified ===
              true,

            status: "approved",
            isHost: true,

            requestedAt:
              new Date().toISOString(),
          },
        ],

        reports: [],

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      }
    );
  };

  /* -------------------------------------------------------
     EDIT HANGOUT
  ------------------------------------------------------- */

  const saveEditedHangout = async (
    originalHangout,
    formData
  ) => {
    if (
      originalHangout.hostId !==
      currentUser.uid
    ) {
      throw new Error(
        "Only the host can edit this hangout."
      );
    }

    const updatedHangout = {
      ...originalHangout,
      ...formData,
    };

    await updateDoc(
      doc(
        db,
        "hangouts",
        originalHangout.id
      ),
      {
        ...formData,
        updatedAt:
          serverTimestamp(),
      }
    );

    if (
      originalHangout.chatId ||
      originalHangout.isLocked
    ) {
      await ensureHangoutChat(
        updatedHangout
      );
    }

    const approvedMembers =
      getApprovedMembers(
        originalHangout
      );

    await notifyMembers({
      members: approvedMembers,

      excludedUid:
        currentUser.uid,

      fromUid:
        currentUser.uid,

      type:
        "hangout_updated",

      title:
        "Hangout updated ✨",

      message: `"${formData.title}" has updated details. Check the new date, time, or location.`,

      hangoutId:
        originalHangout.id,

      chatId:
        originalHangout.chatId || "",
    });

    setEditHangout(null);
  };

  /* -------------------------------------------------------
     DELETE HANGOUT
  ------------------------------------------------------- */

  const deleteHangout = async (
    hangout
  ) => {
    if (
      hangout.hostId !==
      currentUser.uid
    ) {
      window.alert(
        "Only the host can delete this hangout."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${hangout.title}"?\n\nThis removes the hangout and its group chat for everyone. This cannot be undone.`
      );

    if (!confirmed) return;

    try {
      const approvedMembers =
        getApprovedMembers(hangout);

      await notifyMembers({
        members:
          approvedMembers,

        excludedUid:
          currentUser.uid,

        fromUid:
          currentUser.uid,

        type:
          "hangout_deleted",

        title:
          "Hangout cancelled",

        message: `"${hangout.title}" was cancelled by the host.`,

        hangoutId:
          hangout.id,

        chatId:
          hangout.chatId || "",
      });

      if (hangout.chatId) {
        const chatReference = doc(
          db,
          "chats",
          hangout.chatId
        );

        const chatSnapshot =
          await getDoc(
            chatReference
          );

        if (
          chatSnapshot.exists()
        ) {
          await deleteDoc(
            chatReference
          );
        }
      }

      const deterministicChatId =
        getHangoutChatId(
          hangout.id
        );

      if (
        deterministicChatId !==
        hangout.chatId
      ) {
        const fallbackChatReference =
          doc(
            db,
            "chats",
            deterministicChatId
          );

        const fallbackSnapshot =
          await getDoc(
            fallbackChatReference
          );

        if (
          fallbackSnapshot.exists()
        ) {
          await deleteDoc(
            fallbackChatReference
          );
        }
      }

      await deleteDoc(
        doc(
          db,
          "hangouts",
          hangout.id
        )
      );

      setManageHangout(null);
      setEditHangout(null);

      window.alert(
        "Hangout deleted."
      );
    } catch (error) {
      console.error(
        "Error deleting hangout:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "Could not delete the hangout."
      );
    }
  };

  /* -------------------------------------------------------
     REQUEST TO JOIN
  ------------------------------------------------------- */

  const requestJoin = async (
    hangout
  ) => {
    if (!currentUser.uid) {
      window.alert(
        "Please sign in again."
      );

      return;
    }

    if (
      hasRequested(
        hangout,
        currentUser
      )
    ) {
      return;
    }

    if (hangout.isLocked) {
      window.alert(
        "This hangout is already locked."
      );

      return;
    }

    const approvedMembers =
      getApprovedMembers(hangout);

    if (
      approvedMembers.length >=
      Number(hangout.capacity || 0)
    ) {
      window.alert(
        "This hangout is already full."
      );

      return;
    }

    const request = {
      id: `req-${currentUser.uid}-${Date.now()}`,

      uid:
        currentUser.uid,

      name:
        currentUser.name,

      age:
        currentUser.age || "",

      city:
        currentUser.city || "",

      bio:
        currentUser.bio || "",

      interests:
        currentUser.interests || [],

      avatar:
        currentUser.avatar,

      photoURL:
        currentUser.photoURL || "",

      verified:
        currentUser.verified ===
        true,

      status: "pending",
      isHost: false,

      requestedAt:
        new Date().toISOString(),
    };

    try {
      await updateDoc(
        doc(
          db,
          "hangouts",
          hangout.id
        ),
        {
          requests:
            arrayUnion(request),

          updatedAt:
            serverTimestamp(),
        }
      );

      await createNotification({
        toUid:
          hangout.hostId,

        fromUid:
          currentUser.uid,

        type:
          "hangout_join_request",

        title:
          "New hangout request 💕",

        message: `${currentUser.name} wants to join "${hangout.title}".`,

        hangoutId:
          hangout.id,
      });

      window.alert(
        "Request sent 💕"
      );
    } catch (error) {
      console.error(
        "Could not request to join:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "Could not send the request."
      );
    }
  };

  /* -------------------------------------------------------
     APPROVE REQUEST
  ------------------------------------------------------- */

  const approveRequest = async (
    hangoutId,
    requestId
  ) => {
    const hangout =
      hangouts.find(
        (item) =>
          item.id === hangoutId
      );

    if (!hangout) return;

    if (
      hangout.hostId !==
      currentUser.uid
    ) {
      window.alert(
        "Only the host can approve requests."
      );

      return;
    }

    const approvedMembers =
      getApprovedMembers(hangout);

    if (
      approvedMembers.length >=
      Number(hangout.capacity || 0)
    ) {
      window.alert(
        "This hangout is already full."
      );

      return;
    }

    const selectedRequest = (
      hangout.requests || []
    ).find(
      (request) =>
        request.id === requestId
    );

    if (!selectedRequest) return;

    const updatedRequests = (
      hangout.requests || []
    ).map((request) =>
      request.id === requestId
        ? {
            ...request,
            status: "approved",
            approvedAt:
              new Date().toISOString(),
          }
        : request
    );

    const updatedHangout = {
      ...hangout,
      requests:
        updatedRequests,
    };

    try {
      await updateDoc(
        doc(
          db,
          "hangouts",
          hangoutId
        ),
        {
          requests:
            updatedRequests,

          updatedAt:
            serverTimestamp(),
        }
      );

      let chatId =
        hangout.chatId || "";

      /*
        If the hangout is already locked,
        immediately add the newly approved
        person to its existing group chat.
      */
      if (
        hangout.isLocked ||
        hangout.chatId
      ) {
        chatId =
          await ensureHangoutChat(
            updatedHangout
          );
      }

      await createNotification({
        toUid:
          selectedRequest.uid,

        fromUid:
          currentUser.uid,

        type:
          "hangout_approved",

        title:
          "You’re in! 💖",

        message: `You were approved for "${hangout.title}".${
          hangout.isLocked
            ? " The group chat is ready."
            : ""
        }`,

        hangoutId,

        chatId,
      });

      window.alert(
        `${selectedRequest.name} was approved.`
      );
    } catch (error) {
      console.error(
        "Could not approve request:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "Could not approve the request."
      );
    }
  };

  /* -------------------------------------------------------
     REJECT REQUEST
  ------------------------------------------------------- */

  const rejectRequest = async (
    hangoutId,
    requestId
  ) => {
    const hangout =
      hangouts.find(
        (item) =>
          item.id === hangoutId
      );

    if (!hangout) return;

    if (
      hangout.hostId !==
      currentUser.uid
    ) {
      return;
    }

    const selectedRequest = (
      hangout.requests || []
    ).find(
      (request) =>
        request.id === requestId
    );

    const updatedRequests = (
      hangout.requests || []
    ).map((request) =>
      request.id === requestId
        ? {
            ...request,
            status: "rejected",
            rejectedAt:
              new Date().toISOString(),
          }
        : request
    );

    try {
      await updateDoc(
        doc(
          db,
          "hangouts",
          hangoutId
        ),
        {
          requests:
            updatedRequests,

          updatedAt:
            serverTimestamp(),
        }
      );

      if (
        selectedRequest?.uid
      ) {
        await createNotification({
          toUid:
            selectedRequest.uid,

          fromUid:
            currentUser.uid,

          type:
            "hangout_rejected",

          title:
            "Hangout update",

          message: `Your request for "${hangout.title}" was not accepted this time.`,

          hangoutId,
        });
      }
    } catch (error) {
      console.error(
        "Could not reject request:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "Could not reject the request."
      );
    }
  };

  /* -------------------------------------------------------
     SEND FRIEND REQUEST
  ------------------------------------------------------- */

  const sendFriendRequest = async (
    person
  ) => {
    if (
      !currentUser.uid ||
      !person?.uid ||
      person.uid === currentUser.uid
    ) {
      return;
    }

    const relationshipStatus =
      await getFriendRelationshipStatus(
        currentUser.uid,
        person.uid
      );

    if (
      relationshipStatus ===
      "friends"
    ) {
      window.alert(
        "You are already friends 💕"
      );

      return;
    }

    if (
      relationshipStatus ===
      "pending"
    ) {
      window.alert(
        "A friend request is already pending."
      );

      return;
    }

    await addDoc(
      collection(
        db,
        "friendRequests"
      ),
      {
        fromUid:
          currentUser.uid,

        toUid:
          person.uid,

        fromName:
          currentUser.name,

        fromAvatar:
          currentUser.avatar,

        fromPhotoURL:
          currentUser.photoURL || "",

        toName:
          person.name ||
          "Limi User",

        status: "pending",

        source:
          "hangout_request",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      }
    );

    await createNotification({
      toUid:
        person.uid,

      fromUid:
        currentUser.uid,

      type:
        "friend_request",

      title:
        "New friend request 💕",

      message: `${currentUser.name} wants to be friends.`,
    });

    window.alert(
      "Friend request sent 💕"
    );
  };

  /* -------------------------------------------------------
     LOCK HANGOUT AND CREATE CHAT
  ------------------------------------------------------- */

  const lockHangout = async (
    hangout
  ) => {
    if (
      hangout.hostId !==
      currentUser.uid
    ) {
      window.alert(
        "Only the host can lock in this hangout."
      );

      return;
    }

    const approvedMembers =
      getApprovedMembers(hangout);

    if (
      approvedMembers.length <= 1
    ) {
      window.alert(
        "Approve at least one person before locking in the hangout."
      );

      return;
    }

    try {
      const chatId =
        await ensureHangoutChat(
          {
            ...hangout,
            isLocked: true,
          },
          {
            lockHangout: true,
            currentUser,
          }
        );

      await notifyMembers({
        members:
          approvedMembers,

        excludedUid:
          currentUser.uid,

        fromUid:
          currentUser.uid,

        type:
          "group_chat_invite",

        title:
          "Your group chat is ready 💬",

        message: `The group chat for "${hangout.title}" is ready.`,

        hangoutId:
          hangout.id,

        chatId,
      });

      setManageHangout(null);

      navigate(
        `/hangout-chat/${hangout.id}`
      );
    } catch (error) {
      console.error(
        "Could not start hangout:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "Could not create the group chat."
      );
    }
  };

  /* -------------------------------------------------------
     OPEN GROUP CHAT
  ------------------------------------------------------- */

  const openChat = async (
    hangout
  ) => {
    const userRequest =
      getUserRequest(
        hangout,
        currentUser
      );

    const allowed =
      isHost(
        hangout,
        currentUser
      ) ||
      userRequest?.status ===
        "approved";

    if (!allowed) {
      window.alert(
        "Only approved members can open this group chat."
      );

      return;
    }

    try {
      /*
        Repairs older hangouts whose chat
        document was never created correctly.
      */
      await ensureHangoutChat(
        hangout,
        {
          lockHangout:
            hangout.isLocked === true,

          currentUser,
        }
      );

      setManageHangout(null);

      navigate(
        `/hangout-chat/${hangout.id}`
      );
    } catch (error) {
      console.error(
        "Could not open group chat:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "Could not open the group chat."
      );
    }
  };

  /* -------------------------------------------------------
     SHARE HANGOUT
  ------------------------------------------------------- */

  const shareHangout = async (
    hangout
  ) => {
    const dateText =
      formatDateDisplay(
        hangout.rawDate
      ) ||
      hangout.date ||
      "";

    const timeText =
      formatTime12Hour(
        hangout.time
      ) ||
      hangout.formattedTime ||
      "";

    const shareText = `${hangout.title} on Limi 💕\n${dateText} at ${timeText}\n${hangout.location}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title:
            hangout.title,

          text:
            shareText,
        });

        return;
      }

      if (
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(
          shareText
        );

        window.alert(
          "Hangout details copied 💕"
        );

        return;
      }

      window.prompt(
        "Copy these hangout details:",
        shareText
      );
    } catch (error) {
      if (
        error?.name !==
        "AbortError"
      ) {
        console.error(
          "Could not share hangout:",
          error
        );
      }
    }
  };

 /* -------------------------------------------------------
     PAGE UI
  ------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#fff6fa] pb-28">
      <div className="mx-auto max-w-md px-4 pt-5">
        {/* HERO / HEADER */}

        <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] px-5 pb-6 pt-7 text-white shadow-[0_14px_36px_rgba(239,148,181,0.22)]">
          {/* Decorative background circles */}

          <div className="pointer-events-none absolute -left-14 bottom-[-70px] h-48 w-48 rounded-full bg-white/10" />

          <div className="pointer-events-none absolute right-[-55px] top-[-55px] h-48 w-48 rounded-full bg-white/15" />

          <div className="pointer-events-none absolute left-[48%] top-[-75px] h-36 w-36 rounded-full bg-white/5" />

          <div className="relative z-10">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white shadow-[0_10px_24px_rgba(91,35,62,0.13)] backdrop-blur-md">
                <MapPin size={25} />
              </div>

              <h1
                className="mt-4 text-[40px] leading-none tracking-[-0.05em] text-white"
                style={{
                  fontWeight: 1000,
                }}
              >
                Make some plans
              </h1>

              <p className="mx-auto mt-3 max-w-[320px] text-sm font-semibold leading-6 text-white/90">
                Find nearby people to study, eat, explore, or have a cute day
                out with.
              </p>
            </div>

            {/* CREATE BUTTON */}

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white py-4 text-lg font-black text-[#e65f9f] shadow-[0_12px_24px_rgba(100,35,65,0.16)] transition active:scale-[0.99]"
            >
              <Plus size={20} />
              Create Hangout
            </button>

            {/* FILTERS */}

            <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
              {starterFilters.map((filter) => {
                const active =
                  activeFilter === filter.label;

                return (
                  <button
                    key={filter.label}
                    type="button"
                    onClick={() =>
                      setActiveFilter(filter.label)
                    }
                    className={`shrink-0 whitespace-nowrap rounded-full border px-5 py-3 text-sm font-black transition ${
                      active
                        ? "border-white bg-white text-[#df5d9a] shadow-sm"
                        : "border-white/25 bg-white/15 text-white backdrop-blur-md"
                    }`}
                  >
                    {filter.emoji} {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* HANGOUT LIST */}

        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="rounded-[36px] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#f7c5d7] border-t-[#eb6aaa]" />

              <p className="mt-4 font-black text-[#80636f]">
                Finding plans near you...
              </p>
            </div>
          ) : filteredHangouts.length ? (
            filteredHangouts.map((item) => (
              <HangoutCard
                key={item.id}
                item={item}
                currentUser={currentUser}
                now={now}
                onRequestJoin={requestJoin}
                onManage={setManageHangout}
                onOpenChat={openChat}
                onEdit={setEditHangout}
                onDelete={deleteHangout}
                onShare={shareHangout}
              />
            ))
          ) : (
            <div className="relative overflow-hidden rounded-[36px] bg-white p-10 text-center shadow-sm">
              <div className="pointer-events-none absolute -left-16 bottom-[-70px] h-44 w-44 rounded-full bg-[#fff0f6]" />

              <div className="pointer-events-none absolute right-[-55px] top-[-55px] h-40 w-40 rounded-full bg-[#fff4f8]" />

              <div className="relative z-10">
                <MapPin
                  size={44}
                  className="mx-auto mb-4 text-[#f089b0]"
                />

                <h3 className="text-2xl font-black text-[#e85da2]">
                  No plans here yet
                </h3>

                <p className="mt-3 text-sm font-semibold leading-6 text-[#80636f]">
                  Be the first person to create a fun meetup in this category.
                </p>

                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 font-black text-white shadow-[0_10px_24px_rgba(237,102,157,0.2)]"
                >
                  <Plus size={18} />
                  Create the First Hangout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}

      <CreateHangoutModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        currentUser={currentUser}
        onCreate={createHangout}
      />

      <EditHangoutModal
        open={Boolean(editHangout)}
        onClose={() => setEditHangout(null)}
        hangout={editHangout}
        currentUser={currentUser}
        onSave={saveEditedHangout}
      />

      <ManageRequestsModal
        open={Boolean(manageHangout)}
        onClose={() => setManageHangout(null)}
        hangout={manageHangout}
        currentUser={currentUser}
        onApprove={approveRequest}
        onReject={rejectRequest}
        onViewProfile={setProfilePerson}
        onLockHangout={lockHangout}
        onOpenChat={openChat}
        onSendFriendRequest={sendFriendRequest}
      />

      <PersonProfileModal
        open={Boolean(profilePerson)}
        onClose={() => setProfilePerson(null)}
        person={profilePerson}
      />
    </div>
  );
}