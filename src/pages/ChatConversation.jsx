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
  Check,
  Crown,
  ImageIcon,
  Info,
  MapPin,
  MoreVertical,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import {
  auth,
  db,
  storage,
} from "../lib/firebase";

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

import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

/* -------------------------------------------------------
   GENERAL HELPERS
------------------------------------------------------- */

function getInitials(name = "L") {
  return String(name)
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getProfileName(
  profile = {},
  fallbackUser = null
) {
  return (
    profile.name ||
    profile.displayName ||
    profile.fullName ||
    fallbackUser?.displayName ||
    fallbackUser?.email?.split("@")[0] ||
    "Limi User"
  );
}

function getProfilePhoto(
  profile = {},
  fallbackUser = null
) {
  return (
    profile.profileImage ||
    profile.profilePhotoURL ||
    profile.profilePhoto ||
    profile.avatarURL ||
    profile.imageURL ||
    profile.photoURL ||
    fallbackUser?.photoURL ||
    ""
  );
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

    return date.toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    );
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

function getOtherMember(
  chat = {},
  currentUid = ""
) {
  const profiles = Array.isArray(
    chat.memberProfiles
  )
    ? chat.memberProfiles
    : [];

  const profile = profiles.find(
    (member) =>
      member.uid !== currentUid
  );

  if (profile) {
    return {
      uid: profile.uid || "",
      name:
        profile.name || "Limi User",
      avatar:
        profile.avatar ||
        getInitials(
          profile.name || "L"
        ),
      photoURL:
        profile.photoURL || "",
      city: profile.city || "",
      verified:
        profile.verified === true,
    };
  }

  const otherNameEntry =
    Object.entries(
      chat.memberNames || {}
    ).find(
      ([uid]) => uid !== currentUid
    );

  const otherPhotoEntry =
    Object.entries(
      chat.memberPhotos || {}
    ).find(
      ([uid]) => uid !== currentUid
    );

  const uid =
    otherNameEntry?.[0] ||
    otherPhotoEntry?.[0] ||
    "";

  const name =
    otherNameEntry?.[1] ||
    chat.title ||
    chat.name ||
    "Limi User";

  return {
    uid,
    name,
    avatar: getInitials(name),
    photoURL:
      otherPhotoEntry?.[1] || "",
    city: "",
    verified: false,
  };
}

function normalizeGroupMembers(
  chat = {}
) {
  const profiles = Array.isArray(
    chat.memberProfiles
  )
    ? chat.memberProfiles
    : [];

  if (profiles.length) {
    return profiles.map((member) => ({
      uid: member.uid || "",
      name:
        member.name || "Limi User",
      avatar:
        member.avatar ||
        getInitials(
          member.name || "L"
        ),
      photoURL:
        member.photoURL || "",
      city: member.city || "",
      verified:
        member.verified === true,
    }));
  }

  const names =
    chat.memberNames || {};

  const photos =
    chat.memberPhotos || {};

  return Object.keys(names).map(
    (uid) => ({
      uid,
      name:
        names[uid] || "Limi User",
      avatar: getInitials(
        names[uid] || "L"
      ),
      photoURL:
        photos[uid] || "",
      city: "",
      verified: false,
    })
  );
}

/* -------------------------------------------------------
   CURRENT USER PROFILE
------------------------------------------------------- */

async function loadCurrentUserProfile(
  user
) {
  if (!user) return null;

  const fallbackName =
    user.displayName ||
    user.email?.split("@")[0] ||
    "Limi User";

  const fallbackProfile = {
    uid: user.uid,
    name: fallbackName,
    avatar:
      getInitials(fallbackName),
    photoURL:
      user.photoURL || "",
    city: "",
    verified: false,
  };

  try {
    const profileSnapshot =
      await getDoc(
        doc(db, "users", user.uid)
      );

    if (!profileSnapshot.exists()) {
      return fallbackProfile;
    }

    const profile =
      profileSnapshot.data();

    const name = getProfileName(
      profile,
      user
    );

    return {
      ...fallbackProfile,
      uid: user.uid,
      name,
      avatar:
        profile.avatar ||
        getInitials(name),
      photoURL:
        getProfilePhoto(
          profile,
          user
        ),
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
      "Could not load chat profile:",
      error
    );

    return fallbackProfile;
  }
}

/* -------------------------------------------------------
   MODAL SHELL
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
   PROFILE AVATAR
------------------------------------------------------- */

function ProfileAvatar({
  person,
  size = "medium",
}) {
  const sizeClasses =
    size === "small"
      ? "h-9 w-9 text-xs"
      : size === "large"
        ? "h-16 w-16 text-xl"
        : "h-11 w-11 text-sm";

  if (person?.photoURL) {
    return (
      <img
        src={person.photoURL}
        alt={
          person.name || "Limi User"
        }
        className={`${sizeClasses} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] font-black text-white`}
    >
      {person?.avatar ||
        getInitials(
          person?.name || "L"
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
  currentUid,
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
              <ProfileAvatar
                person={member}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-black text-[#241a22]">
                    {member.name ||
                      "Limi User"}
                  </p>

                  {member.uid ===
                    currentUid && (
                    <span className="rounded-full bg-[#fff0f6] px-2 py-1 text-[10px] font-black text-[#d94b93]">
                      You
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
  otherMember,
  members,
  onViewMembers,
}) {
  if (!open || !chat) return null;

  const isGroup =
    chat.chatType === "group" ||
    chat.type === "friends_group";

  const title = isGroup
    ? chat.title ||
      chat.name ||
      "Limi Group"
    : otherMember?.name ||
      "Limi User";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={
        isGroup
          ? "Group Details"
          : "Chat Details"
      }
    >
      <div className="overflow-hidden rounded-[30px] bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] p-6 text-white">
          <div className="absolute -left-10 bottom-[-45px] h-36 w-36 rounded-full bg-white/10" />

          <div className="absolute right-[-35px] top-[-35px] h-40 w-40 rounded-full bg-white/10" />

          <div className="relative z-10">
            <ProfileAvatar
              person={
                isGroup
                  ? {
                      name: title,
                      avatar: getInitials(
                        title
                      ),
                    }
                  : otherMember
              }
              size="large"
            />

            <h3 className="mt-4 text-3xl font-black tracking-[-0.05em]">
              {title}
            </h3>

            <p className="mt-2 text-sm font-bold text-white/90">
              {isGroup
                ? `${members.length} people in this group`
                : otherMember?.city ||
                  "Connected through Limi"}
            </p>
          </div>
        </div>

        <div className="space-y-3 p-5">
          {!isGroup &&
            otherMember?.city && (
              <div className="flex items-center gap-3 rounded-[20px] bg-[#fff6fa] p-4">
                <MapPin
                  size={19}
                  className="shrink-0 text-[#d94b93]"
                />

                <p className="font-bold text-[#5f4b56]">
                  {otherMember.city}
                </p>
              </div>
            )}

          {isGroup && (
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
          )}
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

function MessageAvatar({
  message,
}) {
  if (message.senderPhotoURL) {
    return (
      <img
        src={message.senderPhotoURL}
        alt={
          message.senderName ||
          "Member"
        }
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

function SystemMessage({
  message,
}) {
  return (
    <div className="mx-auto my-1 max-w-[90%] rounded-full bg-[#fff0f6] px-4 py-2 text-center text-xs font-black leading-5 text-[#b46a87]">
      {message.text ||
        "Chat updated 💕"}
    </div>
  );
}

/* -------------------------------------------------------
   MESSAGE BUBBLE
------------------------------------------------------- */

function MessageBubble({
  message,
  isOwnMessage,
}) {
  if (
    message.type === "system" ||
    message.sender === "system"
  ) {
    return (
      <SystemMessage
        message={message}
      />
    );
  }

  const senderName =
    message.senderName ||
    message.author ||
    "Member";

  const isImage =
    message.type === "image" &&
    message.imageURL;

  return (
    <div
      className={`flex items-end gap-2 ${
        isOwnMessage
          ? "justify-end"
          : "justify-start"
      }`}
    >
      {!isOwnMessage && (
        <MessageAvatar
          message={message}
        />
      )}

      <div
        className={`flex max-w-[78%] flex-col ${
          isOwnMessage
            ? "items-end"
            : "items-start"
        }`}
      >
        {!isOwnMessage && (
          <p className="mb-1 px-2 text-[11px] font-black text-[#9a6b80]">
            {senderName}
          </p>
        )}

        <div
          className={`overflow-hidden rounded-[24px] text-sm leading-6 shadow-sm ${
            isOwnMessage
              ? "rounded-br-[8px] bg-gradient-to-r from-[#ef9ca2] via-[#eb7aa0] to-[#d94b93] text-white"
              : "rounded-bl-[8px] bg-[#fff0f6] text-[#4b3946]"
          } ${
            isImage
              ? "p-1.5"
              : "px-4 py-3"
          }`}
        >
          {isImage ? (
            <img
              src={message.imageURL}
              alt="Chat upload"
              className="max-h-[340px] w-full rounded-[19px] object-cover"
              loading="lazy"
            />
          ) : (
            <p className="whitespace-pre-wrap break-words">
              {message.text}
            </p>
          )}
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

function EmptyChat({
  title,
  isGroup,
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ffe4ef] text-[#d94b93]">
        {isGroup ? (
          <Users size={28} />
        ) : (
          <Sparkles size={28} />
        )}
      </div>

      <h3 className="mt-4 text-xl font-black text-[#2b1d28]">
        Start the conversation
      </h3>

      <p className="mt-2 max-w-[270px] text-sm font-semibold leading-6 text-[#80636f]">
        Say hi to{" "}
        {isGroup
          ? `everyone in ${
              title || "this group"
            }`
          : title || "your new connection"}{" "}
        and keep the friendship going 💕
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
  onImageClick,
  sending,
  uploadingImage,
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
          onClick={onImageClick}
          disabled={
            disabled || uploadingImage
          }
          aria-label="Send an image"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff0f6] text-[#d94b93] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploadingImage ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#f2b5cc] border-t-[#d94b93]" />
          ) : (
            <ImageIcon size={21} />
          )}
        </button>

        <div className="min-w-0 flex-1 rounded-[22px] bg-[#fff7fa] px-4 py-2">
          <textarea
            rows={1}
            value={value}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                event.target.value
              )
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
                : "Message..."
            }
            className="max-h-28 min-h-[32px] w-full resize-none bg-transparent py-1 text-sm font-semibold leading-6 text-[#4b3946] outline-none placeholder:text-[#bd91a4] disabled:opacity-60"
          />
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={sendDisabled}
          aria-label="Send message"
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
  otherMember,
  members,
  currentUid,
  onBack,
  onOpenDetails,
  onOpenMembers,
}) {
  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const isGroup =
    chat?.chatType === "group" ||
    chat?.type === "friends_group";

  const title = isGroup
    ? chat?.title ||
      chat?.name ||
      "Limi Group"
    : otherMember?.name ||
      "Limi User";

  const city =
    otherMember?.city || "";

  const avatarPerson = isGroup
    ? {
        name: title,
        avatar:
          chat?.emoji ||
          getInitials(title),
        photoURL:
          chat?.photoURL || "",
      }
    : otherMember;

  return (
    <header className="relative z-30 rounded-[30px] bg-white p-4 shadow-[0_10px_28px_rgba(239,148,181,0.14)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to chats"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0f6] text-[#d94b93]"
        >
          <ArrowLeft size={20} />
        </button>

        <button
          type="button"
          onClick={onOpenDetails}
          className="shrink-0"
          aria-label="Open chat details"
        >
          {isGroup &&
          chat?.emoji &&
          !chat?.photoURL ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] text-2xl text-white shadow-sm">
              {chat.emoji}
            </div>
          ) : (
            <div className="[&>img]:h-14 [&>img]:w-14 [&>img]:rounded-[18px] [&>div]:h-14 [&>div]:w-14 [&>div]:rounded-[18px]">
              <ProfileAvatar
                person={avatarPerson}
              />
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenDetails}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-black tracking-[-0.03em] text-[#1f1720]">
              {title}
            </h1>

            {!isGroup &&
              otherMember?.verified && (
                <ShieldCheck
                  size={16}
                  className="shrink-0 text-green-600"
                />
              )}
          </div>

          {isGroup ? (
            <p className="mt-1 text-xs font-black text-[#b06d89]">
              {members.length}{" "}
              {members.length === 1
                ? "person"
                : "people"}{" "}
              in chat
            </p>
          ) : (
            <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[#96607f]">
              {city ? (
                <>
                  <MapPin size={13} />

                  <span className="truncate">
                    {city}
                  </span>
                </>
              ) : (
                <span>
                  Connected on Limi 💕
                </span>
              )}
            </div>
          )}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setMenuOpen(
                (current) => !current
              )
            }
            aria-label="Chat options"
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

                Chat Details
              </button>

              {isGroup && (
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
              )}
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
          Opening your chat...
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
              <MessageCircle size={28} />
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
            Back to Chats
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   MAIN CHAT CONVERSATION
------------------------------------------------------- */

export default function ChatConversation() {
  const navigate = useNavigate();

  const { chatId = "" } =
    useParams();

  const [
    firebaseUser,
    setFirebaseUser,
  ] = useState(auth.currentUser);

  const [
    currentProfile,
    setCurrentProfile,
  ] = useState(null);

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

  const [
    uploadingImage,
    setUploadingImage,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

  const [
    membersOpen,
    setMembersOpen,
  ] = useState(false);

  const imageInputReference =
    useRef(null);

  const messagesEndReference =
    useRef(null);

  const currentUid =
    firebaseUser?.uid || "";

  const isGroup =
    chat?.chatType === "group" ||
    chat?.type === "friends_group";

  const otherMember = useMemo(
    () =>
      getOtherMember(
        chat || {},
        currentUid
      ),
    [chat, currentUid]
  );

  const members = useMemo(
    () =>
      normalizeGroupMembers(
        chat || {}
      ),
    [chat]
  );

  const hasAccess = useMemo(
    () =>
      Boolean(
        currentUid &&
          chat &&
          (
            chat.memberIds ||
            chat.members ||
            []
          ).includes(currentUid)
      ),
    [chat, currentUid]
  );

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
              group.dateKey ===
              dateKey
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
            setCurrentProfile(null);

            setErrorMessage(
              "Please sign in again to open this chat."
            );

            setLoading(false);
            return;
          }

          const profile =
            await loadCurrentUserProfile(
              user
            );

          setCurrentProfile(profile);
        }
      );

    return () => unsubscribe();
  }, []);

  /* -------------------------------------------------------
     LOAD CHAT DOCUMENT
  ------------------------------------------------------- */

  useEffect(() => {
    if (!chatId) {
      setErrorMessage(
        "This chat link is missing its ID."
      );

      setLoading(false);
      return undefined;
    }

    const chatReference = doc(
      db,
      "chats",
      chatId
    );

    const unsubscribe = onSnapshot(
      chatReference,
      (snapshot) => {
        if (!snapshot.exists()) {
          setChat(null);

          setErrorMessage(
            "This chat may have been deleted or is no longer available."
          );

          setLoading(false);
          return;
        }

        const loadedChat = {
          id: snapshot.id,
          ...snapshot.data(),
        };

        const memberIds =
          loadedChat.memberIds ||
          loadedChat.members ||
          [];

        if (
          currentUid &&
          !memberIds.includes(
            currentUid
          )
        ) {
          setChat(null);

          setErrorMessage(
            "You do not have access to this chat."
          );

          setLoading(false);
          return;
        }

        setChat(loadedChat);
        setErrorMessage("");
        setLoading(false);
      },
      (error) => {
        console.error(
          "Could not load chat:",
          error
        );

        setErrorMessage(
          getFriendlyFirebaseErrorMessage?.(
            error
          ) ||
            error.message ||
            "The chat could not be loaded."
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatId, currentUid]);

  /* -------------------------------------------------------
     LOAD MESSAGES
  ------------------------------------------------------- */

  useEffect(() => {
    if (!chatId || !hasAccess) {
      setMessages([]);
      setLoadingMessages(false);
      return undefined;
    }

    setLoadingMessages(true);

    const messagesQuery = query(
      collection(
        db,
        "chats",
        chatId,
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
              id:
                messageDocument.id,
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
  }, [chatId, hasAccess]);

  /* -------------------------------------------------------
     AUTO SCROLL
  ------------------------------------------------------- */

  useEffect(() => {
    messagesEndReference.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

/* -------------------------------------------------------
     SEND TEXT MESSAGE
  ------------------------------------------------------- */

  const sendMessage = async () => {
    const cleanMessage = input.trim();

    if (
      !cleanMessage ||
      sending ||
      !chatId ||
      !firebaseUser ||
      !currentProfile ||
      !chat ||
      !hasAccess
    ) {
      return;
    }

    try {
      setSending(true);

      const messageData = {
        type: "text",
        text: cleanMessage,

        senderId: firebaseUser.uid,
        senderUid: firebaseUser.uid,

        senderName:
          currentProfile.name ||
          "Limi User",

        author:
          currentProfile.name ||
          "Limi User",

        senderAvatar:
          currentProfile.avatar ||
          getInitials(
            currentProfile.name ||
              "Limi User"
          ),

        senderPhotoURL:
          currentProfile.photoURL ||
          "",

        senderVerified:
          currentProfile.verified ===
          true,

        createdAt:
          serverTimestamp(),
      };

      await addDoc(
        collection(
          db,
          "chats",
          chatId,
          "messages"
        ),
        messageData
      );

      await updateDoc(
        doc(db, "chats", chatId),
        {
          lastMessage: `${currentProfile.name}: ${cleanMessage}`,

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
     SEND IMAGE MESSAGE
  ------------------------------------------------------- */

  const sendImageMessage = async (
    file
  ) => {
    if (
      !file ||
      uploadingImage ||
      !chatId ||
      !firebaseUser ||
      !currentProfile ||
      !chat ||
      !hasAccess
    ) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      window.alert(
        "Please choose an image file."
      );

      return;
    }

    const maximumSize =
      10 * 1024 * 1024;

    if (file.size > maximumSize) {
      window.alert(
        "Please choose an image smaller than 10 MB."
      );

      return;
    }

    try {
      setUploadingImage(true);

      const safeFileName =
        file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "-"
        );

      const imageReference = ref(
        storage,
        `chatImages/${chatId}/${firebaseUser.uid}/${Date.now()}-${safeFileName}`
      );

      await uploadBytes(
        imageReference,
        file
      );

      const imageURL =
        await getDownloadURL(
          imageReference
        );

      await addDoc(
        collection(
          db,
          "chats",
          chatId,
          "messages"
        ),
        {
          type: "image",
          imageURL,
          text: "",

          senderId:
            firebaseUser.uid,

          senderUid:
            firebaseUser.uid,

          senderName:
            currentProfile.name ||
            "Limi User",

          author:
            currentProfile.name ||
            "Limi User",

          senderAvatar:
            currentProfile.avatar ||
            getInitials(
              currentProfile.name ||
                "Limi User"
            ),

          senderPhotoURL:
            currentProfile.photoURL ||
            "",

          senderVerified:
            currentProfile.verified ===
            true,

          createdAt:
            serverTimestamp(),
        }
      );

      await updateDoc(
        doc(db, "chats", chatId),
        {
          lastMessage: `${currentProfile.name}: 📷 Photo`,

          lastMessageSenderId:
            firebaseUser.uid,

          lastMessageAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(
        "Could not send image:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "The image could not be sent."
      );
    } finally {
      setUploadingImage(false);

      if (
        imageInputReference.current
      ) {
        imageInputReference.current.value =
          "";
      }
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
          navigate("/chats")
        }
      />
    );
  }

  if (
    !firebaseUser ||
    !chat ||
    !hasAccess
  ) {
    return (
      <ChatErrorScreen
        title="Access needed"
        message="You do not have access to this conversation."
        onBack={() =>
          navigate("/chats")
        }
      />
    );
  }

  const displayedTitle = isGroup
    ? chat.title ||
      chat.name ||
      "Limi Group"
    : otherMember?.name ||
      "Limi User";

  /* -------------------------------------------------------
     PAGE
  ------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#fff6fa] pb-6">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pt-5">
        <ChatHeader
          chat={chat}
          otherMember={otherMember}
          members={members}
          currentUid={currentUid}
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

   

        {/* MESSAGE AREA */}

        <main className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-[#f2dce6] bg-white shadow-[0_10px_28px_rgba(239,148,181,0.12)]">
          <div className="border-b border-[#f6e5ec] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#2b1d28]">
                  {isGroup
                    ? "Group conversation"
                    : "Private conversation"}
                </p>

                <p className="mt-1 text-xs font-bold text-[#9a6b80]">
                  {isGroup
                    ? "Everyone in this group can see these messages."
                    : `Only you and ${
                        otherMember?.name ||
                        "this person"
                      } can see these messages.`}
                </p>
              </div>

              {isGroup && (
                <button
                  type="button"
                  onClick={() =>
                    setMembersOpen(true)
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0f6] text-[#d94b93]"
                  aria-label="View group members"
                >
                  <Users size={19} />
                </button>
              )}
            </div>
          </div>

          <div className="flex h-[58vh] min-h-[420px] flex-col overflow-y-auto px-4 py-4">
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
                        label={
                          group.label
                        }
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
                title={displayedTitle}
                isGroup={isGroup}
              />
            )}
          </div>
        </main>

        {/* IMAGE INPUT */}

        <input
          ref={imageInputReference}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file =
              event.target.files?.[0];

            if (file) {
              sendImageMessage(file);
            }
          }}
        />

        {/* MESSAGE COMPOSER */}

        <div className="sticky bottom-3 z-20 mt-4">
          <MessageComposer
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            onImageClick={() =>
              imageInputReference.current?.click()
            }
            sending={sending}
            uploadingImage={
              uploadingImage
            }
            disabled={!hasAccess}
          />
        </div>
      </div>

      {/* CHAT DETAILS */}

      <ChatDetailsModal
        open={detailsOpen}
        onClose={() =>
          setDetailsOpen(false)
        }
        chat={chat}
        otherMember={otherMember}
        members={members}
        isGroup={isGroup}
        onOpenMembers={() => {
          setDetailsOpen(false);
          setMembersOpen(true);
        }}
      />

      {/* GROUP MEMBERS */}

      <MembersModal
        open={membersOpen}
        onClose={() =>
          setMembersOpen(false)
        }
        members={members}
        currentUid={currentUid}
      />
    </div>
  );
}