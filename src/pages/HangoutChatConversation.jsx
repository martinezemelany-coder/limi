import { getFriendlyFirebaseErrorMessage } from "../lib/firebaseError";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Crown,
  Image,
  Info,
  Lock,
  MapPin,
  MoreVertical,
  Send,
  ShieldCheck,
  Smile,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { auth, db } from "../lib/firebase";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

/* -------------------------------------------------------
   GENERAL HELPERS
------------------------------------------------------- */

function getHangoutChatId(hangoutId) {
  return `hangout_${hangoutId}`;
}

function getInitials(name = "L") {
  return String(name)
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

function formatMessageTime(value) {
  if (!value) return "";

  try {
    const date = value?.toDate
      ? value.toDate()
      : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

function formatMessageDay(value) {
  if (!value) return "";

  try {
    const date = value?.toDate
      ? value.toDate()
      : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const today = new Date();

    const yesterday = new Date();
    yesterday.setDate(
      yesterday.getDate() - 1
    );

    if (
      date.toDateString() ===
      today.toDateString()
    ) {
      return "Today";
    }

    if (
      date.toDateString() ===
      yesterday.toDateString()
    ) {
      return "Yesterday";
    }

    return date.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "short",
        day: "numeric",
      }
    );
  } catch {
    return "";
  }
}

function getMessageDateKey(value) {
  if (!value) return "pending";

  try {
    const date = value?.toDate
      ? value.toDate()
      : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "pending";
    }

    return [
      date.getFullYear(),
      String(
        date.getMonth() + 1
      ).padStart(2, "0"),
      String(date.getDate()).padStart(
        2,
        "0"
      ),
    ].join("-");
  } catch {
    return "pending";
  }
}

function getProfilePhoto(data = {}) {
  return (
    data.profileImage ||
    data.profilePhotoURL ||
    data.profilePhoto ||
    data.avatarURL ||
    data.imageURL ||
    data.photoURL ||
    ""
  );
}

function getProfileName(data = {}, user = null) {
  return (
    data.name ||
    data.displayName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Limi User"
  );
}

function getApprovedMembers(hangout = {}) {
  return (hangout.requests || []).filter(
    (request) =>
      request.status === "approved"
  );
}

function getUserRequest(
  hangout = {},
  uid = ""
) {
  if (!uid) return null;

  return (
    (hangout.requests || []).find(
      (request) => request.uid === uid
    ) || null
  );
}

function isApprovedMember(
  hangout = {},
  uid = ""
) {
  if (!uid) return false;

  if (hangout.hostId === uid) {
    return true;
  }

  return (
    getUserRequest(hangout, uid)
      ?.status === "approved"
  );
}

function normalizeMemberProfiles(
  chat = {},
  hangout = {}
) {
  const chatProfiles = Array.isArray(
    chat.memberProfiles
  )
    ? chat.memberProfiles
    : [];

  if (chatProfiles.length) {
    return chatProfiles;
  }

  return getApprovedMembers(hangout).map(
    (member) => ({
      uid: member.uid,
      name:
        member.name || "Limi User",
      avatar:
        member.avatar ||
        getInitials(
          member.name || "Limi User"
        ),
      photoURL:
        member.photoURL || "",
      city: member.city || "",
      verified:
        member.verified === true,
      isHost:
        member.uid === hangout.hostId,
    })
  );
}

/* -------------------------------------------------------
   USER PROFILE LOADER
------------------------------------------------------- */

async function loadCurrentUserProfile(
  user
) {
  if (!user) {
    return null;
  }

  const fallbackName =
    user.displayName ||
    user.email?.split("@")[0] ||
    "Limi User";

  const fallback = {
    uid: user.uid,
    name: fallbackName,
    avatar: getInitials(fallbackName),
    photoURL: user.photoURL || "",
    city: "",
    verified: false,
  };

  try {
    const profileSnapshot = await getDoc(
      doc(db, "users", user.uid)
    );

    if (!profileSnapshot.exists()) {
      return fallback;
    }

    const profile =
      profileSnapshot.data();

    const name = getProfileName(
      profile,
      user
    );

    return {
      ...fallback,
      uid: user.uid,
      name,
      avatar: getInitials(name),
      photoURL:
        getProfilePhoto(profile) ||
        fallback.photoURL,
      city:
        profile.city ||
        profile.displayLocation ||
        profile.location
          ?.displayLocation ||
        profile.location?.city ||
        "",
      verified:
        profile.verified === true ||
        profile.isVerified === true ||
        profile.verificationStatus ===
          "verified" ||
        profile.verificationStatus ===
          "approved",
    };
  } catch (error) {
    console.error(
      "Could not load current chat profile:",
      error
    );

    return fallback;
  }
}

/* -------------------------------------------------------
   CHAT DOCUMENT REPAIR
------------------------------------------------------- */

async function ensureChatDocument(
  hangout
) {
  if (!hangout?.id) {
    throw new Error(
      "This hangout is missing its ID."
    );
  }

  const chatId =
    hangout.chatId ||
    getHangoutChatId(hangout.id);

  const approvedMembers =
    getApprovedMembers(hangout);

  const memberIds = [
    ...new Set(
      approvedMembers
        .map((member) => member.uid)
        .filter(Boolean)
    ),
  ];

  const memberProfiles =
    approvedMembers.map((member) => ({
      uid: member.uid,
      name:
        member.name || "Limi User",
      avatar:
        member.avatar ||
        getInitials(
          member.name || "Limi User"
        ),
      photoURL:
        member.photoURL || "",
      city: member.city || "",
      verified:
        member.verified === true,
      isHost:
        member.uid === hangout.hostId,
    }));

  const chatReference = doc(
    db,
    "chats",
    chatId
  );

  const chatSnapshot = await getDoc(
    chatReference
  );

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
      hangout.emoji || "🌸",

    description:
      hangout.description || "",

    location:
      hangout.location || "",

    rawDate:
      hangout.rawDate || "",

    date:
      formatDateDisplay(
        hangout.rawDate
      ) ||
      hangout.date ||
      "",

    time:
      hangout.time || "",

    formattedTime:
      formatTime12Hour(
        hangout.time
      ) ||
      hangout.formattedTime ||
      "",

    hostId:
      hangout.hostId || "",

    hostName:
      hangout.host ||
      "Limi Host",

    memberIds,
    members: memberIds,
    memberProfiles,
    memberCount: memberIds.length,

    isLocked:
      hangout.isLocked === true,

    updatedAt: serverTimestamp(),
  };

  if (!chatSnapshot.exists()) {
    await setDoc(chatReference, {
      ...chatData,
      lastMessage:
        "Group chat created 💕",
      lastMessageAt:
        serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  } else {
    await setDoc(
      chatReference,
      chatData,
      { merge: true }
    );
  }

  if (
    hangout.chatId !== chatId
  ) {
    await updateDoc(
      doc(
        db,
        "hangouts",
        hangout.id
      ),
      {
        chatId,
        updatedAt:
          serverTimestamp(),
      }
    );
  }

  return chatId;
}

/* -------------------------------------------------------
   SHARED MODAL
------------------------------------------------------- */

function ModalShell({
  open,
  onClose,
  title,
  children,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-end justify-center bg-black/45 px-3 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[34px] bg-[#fff8fb] p-5 shadow-2xl sm:rounded-[34px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            className="text-3xl leading-none tracking-[-0.05em] text-[#ec64a8]"
            style={{
              fontWeight: 1000,
            }}
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ffe4ef] text-[#d94b93]"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   MEMBER AVATAR
------------------------------------------------------- */

function MemberAvatar({
  member,
  size = "medium",
}) {
  const sizeClasses =
    size === "small"
      ? "h-9 w-9 text-xs"
      : size === "large"
        ? "h-16 w-16 text-xl"
        : "h-11 w-11 text-sm";

  if (member.photoURL) {
    return (
      <img
        src={member.photoURL}
        alt={member.name || "Member"}
        className={`${sizeClasses} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a2bc] via-[#ef87ad] to-[#d94b93] font-black text-white`}
    >
      {member.avatar ||
        getInitials(
          member.name || "L"
        )}
    </div>
  );
}

/* -------------------------------------------------------
   MEMBERS MODAL
------------------------------------------------------- */

function MembersModal({
  open,
  onClose,
  members,
  hostId,
}) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Group Members"
    >
      <div className="space-y-3">
        {members.length ? (
          members.map((member) => (
            <div
              key={member.uid}
              className="flex items-center gap-3 rounded-[24px] bg-white p-4 shadow-sm"
            >
              <MemberAvatar
                member={member}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-black text-[#241a22]">
                    {member.name ||
                      "Limi User"}
                  </p>

                  {member.uid ===
                    hostId && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0d6] px-2 py-1 text-[10px] font-black uppercase text-[#b7791f]">
                      <Crown size={11} />
                      Host
                    </span>
                  )}

                  {member.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#eef9ee] px-2 py-1 text-[10px] font-black text-green-600">
                      <ShieldCheck
                        size={11}
                      />
                      Verified
                    </span>
                  )}
                </div>

                {member.city && (
                  <p className="mt-1 truncate text-sm font-semibold text-[#80636f]">
                    {member.city}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[26px] bg-white p-7 text-center shadow-sm">
            <Users
              size={38}
              className="mx-auto text-[#f089b0]"
            />

            <p className="mt-3 font-bold text-[#80636f]">
              No members found.
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------
   CHAT DETAILS MODAL
------------------------------------------------------- */

function ChatDetailsModal({
  open,
  onClose,
  chat,
  hangout,
  members,
  onViewMembers,
}) {
  if (!open) return null;

  const title =
    chat?.title ||
    hangout?.title ||
    "Limi Hangout";

  const emoji =
    chat?.emoji ||
    hangout?.emoji ||
    "🌸";

  const location =
    chat?.location ||
    hangout?.location ||
    "";

  const date =
    formatDateDisplay(
      chat?.rawDate ||
        hangout?.rawDate
    ) ||
    chat?.date ||
    hangout?.date ||
    "";

  const time =
    formatTime12Hour(
      chat?.time ||
        hangout?.time
    ) ||
    chat?.formattedTime ||
    hangout?.formattedTime ||
    "";

  const description =
    chat?.description ||
    hangout?.description ||
    "";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Hangout Details"
    >
      <div className="overflow-hidden rounded-[30px] bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] p-6 text-white">
          <div className="absolute -left-10 bottom-[-45px] h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute right-[-35px] top-[-35px] h-40 w-40 rounded-full bg-white/10" />

          <div className="relative z-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/20 text-3xl backdrop-blur">
              {emoji}
            </div>

            <h3 className="mt-4 text-3xl font-black tracking-[-0.05em]">
              {title}
            </h3>

            <p className="mt-2 text-sm font-bold text-white/90">
              Hosted by{" "}
              {chat?.hostName ||
                hangout?.host ||
                "Limi Host"}
            </p>
          </div>
        </div>

        <div className="space-y-3 p-5">
          {location && (
            <div className="flex items-center gap-3 rounded-[20px] bg-[#fff6fa] p-4">
              <MapPin
                size={19}
                className="shrink-0 text-[#d94b93]"
              />
              <p className="font-bold text-[#5f4b56]">
                {location}
              </p>
            </div>
          )}

          {date && (
            <div className="flex items-center gap-3 rounded-[20px] bg-[#fff6fa] p-4">
              <CalendarDays
                size={19}
                className="shrink-0 text-[#d94b93]"
              />
              <p className="font-bold text-[#5f4b56]">
                {date}
              </p>
            </div>
          )}

          {time && (
            <div className="flex items-center gap-3 rounded-[20px] bg-[#fff6fa] p-4">
              <Clock3
                size={19}
                className="shrink-0 text-[#d94b93]"
              />
              <p className="font-bold text-[#5f4b56]">
                {time}
              </p>
            </div>
          )}

          {description && (
            <div className="rounded-[20px] bg-[#fff6fa] p-4">
              <p className="text-sm font-semibold leading-6 text-[#80636f]">
                {description}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onViewMembers}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 font-black text-white"
          >
            <Users size={18} />
            View {members.length}{" "}
            {members.length === 1
              ? "Member"
              : "Members"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------
   DAY DIVIDER
------------------------------------------------------- */

function DayDivider({ label }) {
  if (!label) return null;

  return (
    <div className="my-3 flex items-center gap-3">
      <div className="h-px flex-1 bg-[#f2dce6]" />

      <span className="rounded-full bg-[#fff0f6] px-4 py-2 text-[11px] font-black text-[#b06d89]">
        {label}
      </span>

      <div className="h-px flex-1 bg-[#f2dce6]" />
    </div>
  );
}

/* -------------------------------------------------------
   MESSAGE AVATAR
------------------------------------------------------- */

function MessageAvatar({ message }) {
  if (message.senderPhotoURL) {
    return (
      <img
        src={message.senderPhotoURL}
        alt={message.senderName || "Member"}
        className="h-9 w-9 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a2bc] via-[#ef87ad] to-[#d94b93] text-xs font-black text-white">
      {message.senderAvatar ||
        getInitials(
          message.senderName ||
            message.author ||
            "L"
        )}
    </div>
  );
}

/* -------------------------------------------------------
   SYSTEM MESSAGE
------------------------------------------------------- */

function SystemMessage({ message }) {
  return (
    <div className="mx-auto my-1 max-w-[90%] rounded-full bg-[#fff0f6] px-4 py-2 text-center text-xs font-black leading-5 text-[#b46a87]">
      {message.text}
    </div>
  );
}

/* -------------------------------------------------------
   REGULAR MESSAGE
------------------------------------------------------- */

function MessageBubble({
  message,
  isOwnMessage,
  isHost,
}) {
  if (
    message.type === "system" ||
    message.sender === "system"
  ) {
    return (
      <SystemMessage message={message} />
    );
  }

  const senderName =
    message.senderName ||
    message.author ||
    "Member";

  return (
    <div
      className={`flex items-end gap-2 ${
        isOwnMessage
          ? "justify-end"
          : "justify-start"
      }`}
    >
      {!isOwnMessage && (
        <MessageAvatar message={message} />
      )}

      <div
        className={`max-w-[78%] ${
          isOwnMessage
            ? "items-end"
            : "items-start"
        }`}
      >
        {!isOwnMessage && (
          <div className="mb-1 flex items-center gap-2 px-2">
            <p className="text-[11px] font-black text-[#9a6b80]">
              {senderName}
            </p>

            {isHost && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0d6] px-2 py-0.5 text-[9px] font-black uppercase text-[#b7791f]">
                <Crown size={9} />
                Host
              </span>
            )}
          </div>
        )}

        <div
          className={`rounded-[24px] px-4 py-3 text-sm leading-6 shadow-sm ${
            isOwnMessage
              ? "rounded-br-[8px] bg-gradient-to-r from-[#ef9ca2] via-[#eb7aa0] to-[#d94b93] text-white"
              : "rounded-bl-[8px] bg-[#fff0f6] text-[#4b3946]"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">
            {message.text}
          </p>
        </div>

        <p
          className={`mt-1 px-2 text-[10px] font-bold text-[#b08a9b] ${
            isOwnMessage
              ? "text-right"
              : "text-left"
          }`}
        >
          {formatMessageTime(
            message.createdAt
          )}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   EMPTY CHAT
------------------------------------------------------- */

function EmptyChat({ title }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ffe4ef] text-[#d94b93]">
        <Sparkles size={28} />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#2b1d28]">
        Start the conversation
      </h3>

      <p className="mt-2 max-w-[260px] text-sm font-semibold leading-6 text-[#80636f]">
        Say hi to everyone in{" "}
        {title || "this hangout"} and start
        planning the details 💕
      </p>
    </div>
  );
}

/* -------------------------------------------------------
   MESSAGE COMPOSER
------------------------------------------------------- */

function MessageComposer({
  value,
  onChange,
  onSend,
  sending,
  disabled,
}) {
  const sendDisabled =
    disabled ||
    sending ||
    !value.trim();

  return (
    <div className="rounded-[28px] border border-[#f2dce6] bg-white p-3 shadow-[0_10px_28px_rgba(239,148,181,0.14)]">
      <div className="flex items-end gap-2">
        <button
          type="button"
          aria-label="Add image"
          onClick={() =>
            window.alert(
              "Image messages can be added later with Firebase Storage 💕"
            )
          }
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0f6] text-[#d94b93]"
        >
          <Image size={19} />
        </button>

        <div className="min-w-0 flex-1 rounded-[22px] bg-[#fff7fa] px-4 py-2">
          <textarea
            rows={1}
            value={value}
            disabled={disabled}
            onChange={(event) =>
              onChange(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();

                if (!sendDisabled) {
                  onSend();
                }
              }
            }}
            placeholder={
              disabled
                ? "Chat unavailable"
                : "Message the group..."
            }
            className="max-h-28 min-h-[32px] w-full resize-none bg-transparent py-1 text-sm font-semibold leading-6 text-[#4b3946] outline-none placeholder:text-[#bd91a4] disabled:opacity-60"
          />
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={sendDisabled}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#ef9ca2] via-[#eb7aa0] to-[#d94b93] text-white shadow-[0_8px_18px_rgba(217,75,147,0.22)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </div>

      <p className="mt-2 px-2 text-[10px] font-bold text-[#b08a9b]">
        Press Enter to send. Use Shift +
        Enter for a new line.
      </p>
    </div>
  );
}

/* -------------------------------------------------------
   CHAT HEADER
------------------------------------------------------- */

function ChatHeader({
  chat,
  hangout,
  members,
  onBack,
  onOpenDetails,
  onOpenMembers,
}) {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const title =
    chat?.title ||
    hangout?.title ||
    "Limi Hangout";

  const emoji =
    chat?.emoji ||
    hangout?.emoji ||
    "🌸";

  const location =
    chat?.location ||
    hangout?.location ||
    "";

  const memberCount =
    members.length ||
    chat?.memberCount ||
    0;

  return (
    <header className="relative z-30 rounded-[30px] bg-white p-4 shadow-[0_10px_28px_rgba(239,148,181,0.14)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0f6] text-[#d94b93]"
        >
          <ArrowLeft size={20} />
        </button>

        <button
          type="button"
          onClick={onOpenDetails}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] text-2xl text-white shadow-sm"
        >
          {emoji}
        </button>

        <button
          type="button"
          onClick={onOpenDetails}
          className="min-w-0 flex-1 text-left"
        >
          <h1 className="truncate text-xl font-black tracking-[-0.03em] text-[#1f1720]">
            {title}
          </h1>

          {location && (
            <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[#96607f]">
              <MapPin size={13} />

              <span className="truncate">
                {location}
              </span>
            </div>
          )}

          <p className="mt-1 text-xs font-black text-[#b06d89]">
            {memberCount}{" "}
            {memberCount === 1
              ? "person"
              : "people"}{" "}
            in chat
          </p>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setMenuOpen(
                (current) => !current
              )
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0f6] text-[#d94b93]"
          >
            <MoreVertical size={20} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-13 z-50 w-48 overflow-hidden rounded-[20px] bg-white p-2 shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenDetails();
                }}
                className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm font-black text-[#5f4b56] hover:bg-[#fff0f6]"
              >
                <Info
                  size={17}
                  className="text-[#d94b93]"
                />
                Hangout Details
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenMembers();
                }}
                className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm font-black text-[#5f4b56] hover:bg-[#fff0f6]"
              >
                <Users
                  size={17}
                  className="text-[#d94b93]"
                />
                Group Members
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------
   LOADING SCREEN
------------------------------------------------------- */

function ChatLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff6fa] px-5">
      <div className="w-full max-w-md rounded-[34px] bg-white p-9 text-center shadow-sm">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#f7c5d7] border-t-[#eb6aaa]" />

        <p className="mt-4 font-black text-[#80636f]">
          Opening your group chat...
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   ERROR SCREEN
------------------------------------------------------- */

function ChatErrorScreen({
  title,
  message,
  onBack,
}) {
  return (
    <div className="min-h-screen bg-[#fff6fa] px-4 py-8">
      <div className="mx-auto max-w-md overflow-hidden rounded-[36px] bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] p-8 text-center text-white">
          <div className="absolute -left-12 bottom-[-50px] h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute right-[-45px] top-[-45px] h-44 w-44 rounded-full bg-white/10" />

          <div className="relative z-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <Lock size={28} />
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">
              {title}
            </h2>
          </div>
        </div>

        <div className="p-6 text-center">
          <p className="text-sm font-semibold leading-6 text-[#80636f]">
            {message}
          </p>

          <button
            type="button"
            onClick={onBack}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 font-black text-white"
          >
            Back to Hangouts
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   MAIN PAGE
------------------------------------------------------- */

export default function HangoutChatConversation() {
  const navigate = useNavigate();

  const { id: hangoutId } =
    useParams();

  const [firebaseUser, setFirebaseUser] =
    useState(auth.currentUser);

  const [
    currentUserProfile,
    setCurrentUserProfile,
  ] = useState(null);

  const [hangout, setHangout] =
    useState(null);

  const [chat, setChat] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    loadingMessages,
    setLoadingMessages,
  ] = useState(true);

  const [sending, setSending] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [membersOpen, setMembersOpen] =
    useState(false);

  const [resolvedChatId, setResolvedChatId] =
    useState("");

  const messagesEndReference =
    useRef(null);

  const currentUid =
    firebaseUser?.uid || "";

  const members = useMemo(
    () =>
      normalizeMemberProfiles(
        chat || {},
        hangout || {}
      ),
    [chat, hangout]
  );

  const hasAccess = useMemo(() => {
    if (!hangout || !currentUid) {
      return false;
    }

    return isApprovedMember(
      hangout,
      currentUid
    );
  }, [hangout, currentUid]);

  const groupedMessages =
    useMemo(() => {
      const groups = [];

      messages.forEach((message) => {
        const dateKey =
          getMessageDateKey(
            message.createdAt
          );

        const existingGroup =
          groups.find(
            (group) =>
              group.dateKey === dateKey
          );

        if (existingGroup) {
          existingGroup.messages.push(
            message
          );
        } else {
          groups.push({
            dateKey,
            label:
              formatMessageDay(
                message.createdAt
              ),
            messages: [message],
          });
        }
      });

      return groups;
    }, [messages]);

  /* -------------------------------------------------------
     AUTH LISTENER
  ------------------------------------------------------- */

  useEffect(() => {
    const unsubscribe =
      auth.onAuthStateChanged(
        async (user) => {
          setFirebaseUser(user);

          if (!user) {
            setCurrentUserProfile(
              null
            );

            setLoading(false);

            setErrorMessage(
              "Please sign in again to open this group chat."
            );

            return;
          }

          const profile =
            await loadCurrentUserProfile(
              user
            );

          setCurrentUserProfile(
            profile
          );
        }
      );

    return () => unsubscribe();
  }, []);

  /* -------------------------------------------------------
     LOAD HANGOUT
  ------------------------------------------------------- */

  useEffect(() => {
    if (!hangoutId) {
      setErrorMessage(
        "This hangout link is missing its ID."
      );

      setLoading(false);

      return undefined;
    }

    const hangoutReference = doc(
      db,
      "hangouts",
      hangoutId
    );

    const unsubscribe = onSnapshot(
      hangoutReference,
      async (snapshot) => {
        if (!snapshot.exists()) {
          setHangout(null);

          setErrorMessage(
            "This hangout may have been deleted or cancelled."
          );

          setLoading(false);

          return;
        }

        const loadedHangout = {
          id: snapshot.id,
          ...snapshot.data(),
        };

        setHangout(
          loadedHangout
        );

        if (
          !currentUid ||
          !isApprovedMember(
            loadedHangout,
            currentUid
          )
        ) {
          setErrorMessage(
            "Only the host and approved members can access this group chat."
          );

          setLoading(false);

          return;
        }

        try {
          const chatId =
            await ensureChatDocument(
              loadedHangout
            );

          setResolvedChatId(
            chatId
          );

          setErrorMessage("");
        } catch (error) {
          console.error(
            "Could not prepare hangout chat:",
            error
          );

          setErrorMessage(
            getFriendlyFirebaseErrorMessage?.(
              error
            ) ||
              error.message ||
              "The group chat could not be opened."
          );
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error(
          "Could not load hangout:",
          error
        );

        setErrorMessage(
          getFriendlyFirebaseErrorMessage?.(
            error
          ) ||
            error.message ||
            "The hangout could not be loaded."
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [hangoutId, currentUid]);

  /* -------------------------------------------------------
     LOAD CHAT DOCUMENT
  ------------------------------------------------------- */

  useEffect(() => {
    if (!resolvedChatId) {
      setChat(null);
      return undefined;
    }

    const chatReference = doc(
      db,
      "chats",
      resolvedChatId
    );

    const unsubscribe = onSnapshot(
      chatReference,
      (snapshot) => {
        if (snapshot.exists()) {
          setChat({
            id: snapshot.id,
            ...snapshot.data(),
          });
        } else {
          setChat(null);
        }
      },
      (error) => {
        console.error(
          "Could not load chat details:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, [resolvedChatId]);

  /* -------------------------------------------------------
     LOAD MESSAGES LIVE
  ------------------------------------------------------- */

  useEffect(() => {
    if (!resolvedChatId) {
      setMessages([]);
      setLoadingMessages(false);
      return undefined;
    }

    setLoadingMessages(true);

    const messagesQuery = query(
      collection(
        db,
        "chats",
        resolvedChatId,
        "messages"
      ),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const loadedMessages =
          snapshot.docs.map(
            (messageDocument) => ({
              id: messageDocument.id,
              ...messageDocument.data(),
            })
          );

        setMessages(
          loadedMessages
        );

        setLoadingMessages(false);
      },
      (error) => {
        console.error(
          "Could not load messages:",
          error
        );

        setLoadingMessages(false);

        setErrorMessage(
          getFriendlyFirebaseErrorMessage?.(
            error
          ) ||
            error.message ||
            "Messages could not be loaded."
        );
      }
    );

    return () => unsubscribe();
  }, [resolvedChatId]);

  /* -------------------------------------------------------
     AUTO-SCROLL
  ------------------------------------------------------- */

  useEffect(() => {
    messagesEndReference.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

  /* -------------------------------------------------------
     SEND MESSAGE
  ------------------------------------------------------- */

  const sendMessage = async () => {
    const cleanMessage =
      input.trim();

    if (
      !cleanMessage ||
      sending ||
      !resolvedChatId ||
      !firebaseUser ||
      !currentUserProfile ||
      !hangout ||
      !hasAccess
    ) {
      return;
    }

    try {
      setSending(true);

      const messageData = {
        text: cleanMessage,
        type: "text",

        senderId:
          firebaseUser.uid,

        senderUid:
          firebaseUser.uid,

        senderName:
          currentUserProfile.name,

        author:
          currentUserProfile.name,

        senderAvatar:
          currentUserProfile.avatar,

        senderPhotoURL:
          currentUserProfile.photoURL ||
          "",

        senderVerified:
          currentUserProfile.verified ===
          true,

        createdAt:
          serverTimestamp(),
      };

      await addDoc(
        collection(
          db,
          "chats",
          resolvedChatId,
          "messages"
        ),
        messageData
      );

      await updateDoc(
        doc(
          db,
          "chats",
          resolvedChatId
        ),
        {
          lastMessage: `${currentUserProfile.name}: ${cleanMessage}`,

          lastMessageSenderId:
            firebaseUser.uid,

          lastMessageAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      setInput("");
    } catch (error) {
      console.error(
        "Could not send message:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "Your message could not be sent."
      );
    } finally {
      setSending(false);
    }
  };

/* -------------------------------------------------------
     PAGE STATES
  ------------------------------------------------------- */

  if (loading) {
    return <ChatLoadingScreen />;
  }

  if (errorMessage) {
    return (
      <ChatErrorScreen
        title="Chat unavailable"
        message={errorMessage}
        onBack={() =>
          navigate("/hangouts")
        }
      />
    );
  }

  if (
    !hangout ||
    !firebaseUser ||
    !hasAccess
  ) {
    return (
      <ChatErrorScreen
        title="Access needed"
        message="Only the host and approved members can access this group chat."
        onBack={() =>
          navigate("/hangouts")
        }
      />
    );
  }

  /* -------------------------------------------------------
     PAGE
  ------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#fff6fa] pb-6">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pt-5">
        <ChatHeader
          chat={chat}
          hangout={hangout}
          members={members}
          onBack={() =>
            navigate("/chats")
          }
          onOpenDetails={() =>
            setDetailsOpen(true)
          }
          onOpenMembers={() =>
            setMembersOpen(true)
          }
        />

        {/* HANGOUT SUMMARY */}

        <button
          type="button"
          onClick={() =>
            setDetailsOpen(true)
          }
          className="relative mt-4 overflow-hidden rounded-[30px] bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] p-5 text-left text-white shadow-[0_10px_28px_rgba(239,148,181,0.18)]"
        >
          <div className="absolute -left-12 bottom-[-55px] h-40 w-40 rounded-full bg-white/10" />

          <div className="absolute right-[-35px] top-[-45px] h-40 w-40 rounded-full bg-white/10" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/80">
                  Hangout details
                </p>

                <h2 className="mt-2 truncate text-2xl font-black tracking-[-0.04em]">
                  {hangout.title ||
                    chat?.title ||
                    "Limi Hangout"}
                </h2>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white/20 text-2xl backdrop-blur">
                {hangout.emoji ||
                  chat?.emoji ||
                  "🌸"}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[18px] bg-white/15 px-3 py-3 backdrop-blur">
                <div className="flex items-center gap-2">
                  <CalendarDays
                    size={15}
                  />

                  <p className="truncate text-xs font-black">
                    {formatDateDisplay(
                      hangout.rawDate
                    ) ||
                      hangout.date ||
                      "Date not set"}
                  </p>
                </div>
              </div>

              <div className="rounded-[18px] bg-white/15 px-3 py-3 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Clock3 size={15} />

                  <p className="truncate text-xs font-black">
                    {formatTime12Hour(
                      hangout.time
                    ) ||
                      hangout.formattedTime ||
                      "Time not set"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-[18px] bg-white/15 px-3 py-3 backdrop-blur">
              <MapPin
                size={15}
                className="shrink-0"
              />

              <p className="truncate text-xs font-black">
                {hangout.location ||
                  "Location not set"}
              </p>
            </div>

            <p className="mt-4 text-xs font-bold text-white/85">
              Tap to view the full plan,
              host, and group members.
            </p>
          </div>
        </button>

        {/* MESSAGE AREA */}

        <main className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-[#f2dce6] bg-white shadow-[0_10px_28px_rgba(239,148,181,0.12)]">
          <div className="border-b border-[#f6e5ec] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#2b1d28]">
                  Group conversation
                </p>

                <p className="mt-1 text-xs font-bold text-[#9a6b80]">
                  Everyone approved for this
                  hangout can see these
                  messages.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMembersOpen(true)
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0f6] text-[#d94b93]"
                aria-label="View members"
              >
                <Users size={19} />
              </button>
            </div>
          </div>

          <div className="flex h-[52vh] min-h-[420px] flex-col overflow-y-auto px-4 py-4">
            {loadingMessages ? (
              <div className="flex flex-1 flex-col items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#f7c5d7] border-t-[#eb6aaa]" />

                <p className="mt-3 text-sm font-black text-[#80636f]">
                  Loading messages...
                </p>
              </div>
            ) : messages.length ? (
              <div className="space-y-3">
                {groupedMessages.map(
                  (group) => (
                    <div
                      key={
                        group.dateKey ||
                        group.label
                      }
                    >
                      <DayDivider
                        label={group.label}
                      />

                      <div className="space-y-3">
                        {group.messages.map(
                          (message) => {
                            const senderId =
                              message.senderId ||
                              message.senderUid ||
                              "";

                            const isOwnMessage =
                              senderId ===
                              currentUid;

                            const isHostMessage =
                              senderId ===
                              hangout.hostId;

                            return (
                              <MessageBubble
                                key={
                                  message.id
                                }
                                message={
                                  message
                                }
                                isOwnMessage={
                                  isOwnMessage
                                }
                                isHost={
                                  isHostMessage
                                }
                              />
                            );
                          }
                        )}
                      </div>
                    </div>
                  )
                )}

                <div
                  ref={
                    messagesEndReference
                  }
                />
              </div>
            ) : (
              <EmptyChat
                title={
                  hangout.title ||
                  chat?.title
                }
              />
            )}
          </div>
        </main>

        {/* COMPOSER */}

        <div className="sticky bottom-3 z-20 mt-4">
          <MessageComposer
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            sending={sending}
            disabled={
              !resolvedChatId ||
              !hasAccess
            }
          />
        </div>
      </div>

      {/* DETAILS MODAL */}

      <HangoutDetailsModal
        open={detailsOpen}
        onClose={() =>
          setDetailsOpen(false)
        }
        hangout={hangout}
        chat={chat}
        members={members}
        currentUid={currentUid}
        onOpenMembers={() => {
          setDetailsOpen(false);
          setMembersOpen(true);
        }}
        onBackToHangouts={() =>
          navigate("/hangouts")
        }
      />

      {/* MEMBERS MODAL */}

      <MembersModal
        open={membersOpen}
        onClose={() =>
          setMembersOpen(false)
        }
        members={members}
        hostId={hangout.hostId}
        currentUid={currentUid}
      />
    </div>
  );
}