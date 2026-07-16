import { getFriendlyFirebaseErrorMessage } from "../lib/firebaseError";
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  Ban,
  Check,
  Heart,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Send,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { auth, db } from "../lib/firebase";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

/* -------------------------------------------------------
   GENERAL HELPERS
------------------------------------------------------- */

function getInitials(text = "L") {
  return String(text)
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getProfileName(data = {}, fallbackUser = null) {
  return (
    data.name ||
    data.displayName ||
    data.fullName ||
    fallbackUser?.displayName ||
    fallbackUser?.email?.split("@")[0] ||
    "Limi User"
  );
}

function getProfilePhoto(data = {}, fallbackUser = null) {
  return (
    data.profileImage ||
    data.profilePhotoURL ||
    data.profilePhoto ||
    data.avatarURL ||
    data.imageURL ||
    data.photoURL ||
    fallbackUser?.photoURL ||
    ""
  );
}

function formatChatTime(value) {
  if (!value) return "";

  try {
    const date = value?.toDate
      ? value.toDate()
      : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();

    if (
      date.toDateString() ===
      now.toDateString()
    ) {
      return date.toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      );
    }

    return date.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    );
  } catch {
    return "";
  }
}

function defaultMatchActivity() {
  return {
    liked: [],
    superLiked: [],
    likedBy: [],
    superLikedBy: [],
    passed: [],
    matches: [],
    blocked: [],
    reported: [],
  };
}

function getHangoutChatId(hangoutId) {
  return `hangout_${hangoutId}`;
}

function getApprovedMembers(hangout = {}) {
  return (hangout.requests || []).filter(
    (request) =>
      request.status === "approved"
  );
}

function userCanAccessHangout(
  hangout,
  uid
) {
  if (!hangout || !uid) return false;

  if (hangout.hostId === uid) {
    return true;
  }

  return getApprovedMembers(hangout).some(
    (member) => member.uid === uid
  );
}

/* -------------------------------------------------------
   NOTIFICATION HELPER
------------------------------------------------------- */

async function createNotification({
  toUid,
  fromUid,
  type,
  title,
  message,
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
      chatId,
      read: false,
      createdAt: serverTimestamp(),
    }
  );
}

/* -------------------------------------------------------
   PROFILE LOADER
------------------------------------------------------- */

async function loadUserProfile(uid) {
  if (!uid) return null;

  const snapshot = await getDoc(
    doc(db, "users", uid)
  );

  if (!snapshot.exists()) {
    return {
      uid,
      id: uid,
      name: "Limi User",
      avatar: "L",
      photoURL: "",
      city: "",
      age: "",
    };
  }

  const data = snapshot.data();
  const name = getProfileName(data);

  return {
    id: uid,
    uid,
    ...data,
    name,
    avatar:
      data.avatar ||
      getInitials(name),
    photoURL: getProfilePhoto(data),
    city:
      data.city ||
      data.displayLocation ||
      data.location?.displayLocation ||
      data.location?.city ||
      "",
    age: data.age || "",
  };
}

/* -------------------------------------------------------
   DETERMINISTIC MATCH CHAT
------------------------------------------------------- */

function getDirectChatId(
  firstUid,
  secondUid
) {
  return [firstUid, secondUid]
    .sort()
    .join("_");
}

async function ensureDirectMatchChat({
  currentUser,
  currentProfile,
  person,
}) {
  if (
    !currentUser?.uid ||
    !person?.uid
  ) {
    throw new Error(
      "This match is missing user information."
    );
  }

  const chatId = getDirectChatId(
    currentUser.uid,
    person.uid
  );

  const chatReference = doc(
    db,
    "chats",
    chatId
  );

  const chatSnapshot = await getDoc(
    chatReference
  );

  const myName =
    currentProfile?.name ||
    currentUser.displayName ||
    currentUser.email?.split("@")[0] ||
    "Limi User";

  const myPhoto =
    currentProfile?.photoURL ||
    currentUser.photoURL ||
    "";

  const memberIds = [
    currentUser.uid,
    person.uid,
  ];

  const chatData = {
    id: chatId,
    type: "match",
    chatType: "direct",

    memberIds,
    members: memberIds,

    memberNames: {
      [currentUser.uid]: myName,
      [person.uid]:
        person.name || "Limi User",
    },

    memberPhotos: {
      [currentUser.uid]: myPhoto,
      [person.uid]:
        person.photoURL || "",
    },

    memberProfiles: [
      {
        uid: currentUser.uid,
        name: myName,
        photoURL: myPhoto,
        avatar: getInitials(myName),
      },
      {
        uid: person.uid,
        name:
          person.name || "Limi User",
        photoURL:
          person.photoURL || "",
        avatar:
          person.avatar ||
          getInitials(
            person.name || "L"
          ),
      },
    ],

    updatedAt: serverTimestamp(),
  };

  if (!chatSnapshot.exists()) {
    await setDoc(chatReference, {
      ...chatData,
      createdAt: serverTimestamp(),
      lastMessage:
        "You matched 💕 Say hi!",
      lastMessageAt:
        serverTimestamp(),
    });
  } else {
    await setDoc(
      chatReference,
      chatData,
      { merge: true }
    );
  }

  return chatId;
}

/* -------------------------------------------------------
   HANGOUT CHAT REPAIR

   This is what makes approved locked-in hangout chats
   remain available after refreshing MainChat.
------------------------------------------------------- */

async function repairHangoutChat(
  hangout
) {
  if (!hangout?.id) return null;

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
          member.name || "L"
        ),
      photoURL:
        member.photoURL || "",
      city: member.city || "",
      isHost:
        member.uid ===
        hangout.hostId,
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

    location:
      hangout.location || "",

    date:
      hangout.date || "",

    rawDate:
      hangout.rawDate || "",

    time:
      hangout.time || "",

    formattedTime:
      hangout.formattedTime || "",

    description:
      hangout.description || "",

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
      createdAt: serverTimestamp(),
      lastMessage:
        "Group chat created 💕",
      lastMessageAt:
        serverTimestamp(),
    });
  } else {
    await setDoc(
      chatReference,
      chatData,
      { merge: true }
    );
  }

  if (hangout.chatId !== chatId) {
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
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/40 px-3 sm:items-center">
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
   PERSON AVATAR
------------------------------------------------------- */

function PersonAvatar({
  person,
  size = "medium",
}) {
  const sizeClass =
    size === "large"
      ? "h-16 w-16 rounded-[22px] text-xl"
      : "h-12 w-12 rounded-[18px] text-sm";

  if (person?.photoURL) {
    return (
      <img
        src={person.photoURL}
        alt={person.name || "Limi User"}
        className={`${sizeClass} shrink-0 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] font-black text-white`}
    >
      {person?.avatar ||
        getInitials(
          person?.name || "L"
        )}
    </div>
  );
}

/* -------------------------------------------------------
   CHAT AVATAR
------------------------------------------------------- */

function ChatAvatar({
  chat,
  currentUid,
}) {
  const isHangout =
    chat.type === "hangout";

  const isGroup =
    chat.chatType === "group" ||
    chat.type === "friends_group";

  if (isHangout || isGroup) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] text-white">
        {chat.emoji ? (
          <span className="text-2xl">
            {chat.emoji}
          </span>
        ) : (
          <Users size={24} />
        )}
      </div>
    );
  }

  const otherProfile =
    (chat.memberProfiles || []).find(
      (member) =>
        member.uid !== currentUid
    );

  const otherPhoto =
    otherProfile?.photoURL ||
    Object.entries(
      chat.memberPhotos || {}
    ).find(
      ([uid]) => uid !== currentUid
    )?.[1] ||
    chat.photoURL ||
    "";

  const otherName =
    otherProfile?.name ||
    Object.entries(
      chat.memberNames || {}
    ).find(
      ([uid]) => uid !== currentUid
    )?.[1] ||
    chat.title ||
    chat.name ||
    "Limi User";

  if (otherPhoto) {
    return (
      <img
        src={otherPhoto}
        alt={otherName}
        className="h-14 w-14 shrink-0 rounded-[20px] object-cover"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#d85fa0] to-[#b94e80] text-lg font-black text-white">
      {getInitials(otherName)}
    </div>
  );
}

/* -------------------------------------------------------
   CHAT CARD
------------------------------------------------------- */

function ChatCard({
  chat,
  currentUid,
  onClick,
}) {
  const isHangout =
    chat.type === "hangout";

  const isGroup =
    chat.chatType === "group" ||
    chat.type === "friends_group";

  const otherName =
    (chat.memberProfiles || []).find(
      (member) =>
        member.uid !== currentUid
    )?.name ||
    Object.entries(
      chat.memberNames || {}
    ).find(
      ([uid]) => uid !== currentUid
    )?.[1];

  const displayedTitle =
    isHangout || isGroup
      ? chat.title ||
        chat.name ||
        "Limi Group"
      : otherName ||
        chat.title ||
        chat.name ||
        "Limi Chat";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[28px] bg-white p-4 text-left shadow-[0_10px_28px_rgba(239,148,181,0.13)] transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <ChatAvatar
          chat={chat}
          currentUid={currentUid}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate text-lg font-black text-[#1f1720]">
                  {displayedTitle}
                </h3>

                <span className="shrink-0 rounded-full bg-[#fff0f6] px-2 py-1 text-[9px] font-black uppercase text-[#d85fa0]">
                  {isHangout
                    ? "Hangout"
                    : isGroup
                      ? "Group"
                      : "Chat"}
                </span>
              </div>

              {chat.location && (
                <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[#96607f]">
                  <MapPin size={13} />

                  <span className="truncate">
                    {chat.location}
                  </span>
                </div>
              )}
            </div>

            <p className="shrink-0 text-xs font-black text-[#b8839a]">
              {formatChatTime(
                chat.lastMessageAt ||
                  chat.updatedAt ||
                  chat.createdAt
              )}
            </p>
          </div>

          <p className="mt-2 truncate text-sm font-semibold text-[#80636f]">
            {chat.lastMessage ||
              "Say hi 💕"}
          </p>
        </div>
      </div>
    </button>
  );
}

/* -------------------------------------------------------
   CHAT SECTION
------------------------------------------------------- */

function ChatSection({
  title,
  subtitle,
  icon: Icon,
  chats,
  currentUid,
  onOpenChat,
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ffe4ef] text-[#d94b93]">
          <Icon size={21} />
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[#1f1720]">
            {title}
          </h2>

          <p className="text-sm font-bold text-[#80636f]">
            {subtitle}
          </p>
        </div>
      </div>

      {chats.length ? (
        <div className="space-y-3">
          {chats.map((chat) => (
            <ChatCard
              key={chat.id}
              chat={chat}
              currentUid={currentUid}
              onClick={() =>
                onOpenChat(chat)
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-[#80636f]">
            Nothing here yet 💕
          </p>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------
   MATCHED PERSON CARD
------------------------------------------------------- */

function MatchedPersonCard({
  person,
  friendshipStatus,
  onMessage,
  onAddFriend,
}) {
  return (
    <div className="rounded-[28px] bg-white p-4 shadow-[0_10px_28px_rgba(239,148,181,0.13)]">
      <div className="flex items-center gap-4">
        <PersonAvatar
          person={person}
          size="large"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-black text-[#1f1720]">
              {person.name}
              {person.age
                ? `, ${person.age}`
                : ""}
            </h3>

            <span className="rounded-full bg-[#fff0f6] px-2 py-1 text-[9px] font-black uppercase text-[#d85fa0]">
              Match
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[#96607f]">
            <MapPin size={13} />

            <span className="truncate">
              {person.city ||
                "Location unavailable"}
            </span>
          </div>

          <p className="mt-2 text-sm font-semibold text-[#80636f]">
            You matched — start a
            conversation 💕
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() =>
            onMessage(person)
          }
          className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-3 text-sm font-black text-white"
        >
          <MessageCircle size={16} />
          Message
        </button>

        <button
          type="button"
          onClick={() =>
            friendshipStatus === "none" &&
            onAddFriend(person)
          }
          disabled={
            friendshipStatus !== "none"
          }
          className="flex items-center justify-center gap-2 rounded-full border border-[#f0d8e2] bg-white py-3 text-sm font-black text-[#d94b93] disabled:bg-[#fff6fa] disabled:text-[#aa8797]"
        >
          {friendshipStatus ===
          "friends" ? (
            <>
              <Check size={16} />
              Friends
            </>
          ) : friendshipStatus ===
            "pending" ? (
            <>
              <UserPlus size={16} />
              Requested
            </>
          ) : (
            <>
              <UserPlus size={16} />
              Add Friend
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   MATCHED PEOPLE SECTION
------------------------------------------------------- */

function MatchedPeopleSection({
  people,
  friendshipStatuses,
  onMessage,
  onAddFriend,
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffe4ef] text-[#d94b93]">
          <Heart size={21} />
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[#1f1720]">
            Matched People
          </h2>

          <p className="text-sm font-bold text-[#80636f]">
            message your matches or
            become friends
          </p>
        </div>
      </div>

      {people.length ? (
        <div className="space-y-3">
          {people.map((person) => (
            <MatchedPersonCard
              key={person.uid}
              person={person}
              friendshipStatus={
                friendshipStatuses[
                  person.uid
                ] || "none"
              }
              onMessage={onMessage}
              onAddFriend={onAddFriend}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] bg-white p-7 text-center shadow-sm">
          <Heart
            size={34}
            className="mx-auto text-[#f089b0]"
          />

          <p className="mt-3 text-sm font-bold text-[#80636f]">
            Your new matches will
            appear here 💕
          </p>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------
   FRIEND REQUEST CARD
------------------------------------------------------- */

function FriendRequestCard({
  request,
  onAccept,
  onDecline,
}) {
  return (
    <div className="rounded-[24px] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {request.fromPhotoURL ? (
          <img
            src={request.fromPhotoURL}
            alt={request.fromName || "Limi User"}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] font-black text-white">
            {request.fromAvatar ||
              getInitials(
                request.fromName || "L"
              )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-black text-[#1f1720]">
            {request.fromName ||
              "Limi User"}
          </p>

          <p className="text-sm font-bold text-[#80636f]">
            wants to be friends 💕
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() =>
            onAccept(request)
          }
          className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-3 text-sm font-black text-white"
        >
          <Check size={16} />
          Accept
        </button>

        <button
          type="button"
          onClick={() =>
            onDecline(request)
          }
          className="flex items-center justify-center gap-2 rounded-full border border-[#f0d8e2] bg-white py-3 text-sm font-black text-[#b66b88]"
        >
          <Ban size={16} />
          Decline
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   FRIEND REQUESTS MODAL
------------------------------------------------------- */

function FriendRequestsModal({
  open,
  onClose,
  requests,
  onAccept,
  onDecline,
}) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Friend Requests"
    >
      <div className="space-y-3">
        {requests.length ? (
          requests.map((request) => (
            <FriendRequestCard
              key={request.id}
              request={request}
              onAccept={onAccept}
              onDecline={onDecline}
            />
          ))
        ) : (
          <div className="rounded-[28px] bg-white p-7 text-center shadow-sm">
            <UserPlus
              size={38}
              className="mx-auto text-[#f089b0]"
            />

            <p className="mt-3 font-bold text-[#80636f]">
              No friend requests yet 💕
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------
   FRIEND CARD
------------------------------------------------------- */

function FriendCard({
  friend,
  onMessage,
}) {
  return (
    <div className="rounded-[24px] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <PersonAvatar person={friend} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-black text-[#1f1720]">
            {friend.name ||
              "Limi Friend"}
          </p>

          <p className="truncate text-sm font-bold text-[#80636f]">
            {friend.city ||
              "Limi friend"}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onMessage(friend)
          }
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#f4a1bd] to-[#f06aa8] text-white"
          aria-label={`Message ${
            friend.name || "friend"
          }`}
        >
          <MessageCircle size={18} />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   FRIENDS MODAL
------------------------------------------------------- */

function FriendsModal({
  open,
  onClose,
  friends,
  onMessage,
  onFindFriends,
}) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Your Friends"
    >
      <div className="space-y-3">
        {friends.length ? (
          friends.map((friend) => (
            <FriendCard
              key={
                friend.uid ||
                friend.id
              }
              friend={friend}
              onMessage={onMessage}
            />
          ))
        ) : (
          <div className="rounded-[28px] bg-white p-7 text-center shadow-sm">
            <Heart
              size={38}
              className="mx-auto text-[#f089b0]"
            />

            <h3 className="mt-3 text-xl font-black text-[#e85da2]">
              No friends yet
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-[#80636f]">
              Send a request to someone
              you matched with or search
              for another Limi user.
            </p>

            <button
              type="button"
              onClick={onFindFriends}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 font-black text-white"
            >
              <Search size={17} />
              Find Friends
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------
   USER SEARCH MODAL
------------------------------------------------------- */

function UserSearchModal({
  open,
  onClose,
  searchValue,
  setSearchValue,
  searchResults,
  searching,
  onSearch,
  onAddFriend,
  currentUid,
  friendshipStatuses,
}) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Find Friends"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-full border border-[#f1d8e3] bg-white px-4 py-3">
          <Search
            size={18}
            className="text-[#d86592]"
          />

          <input
            value={searchValue}
            onChange={(event) =>
              setSearchValue(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                searchValue.trim()
              ) {
                onSearch();
              }
            }}
            placeholder="Search name or username..."
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#5f4b56] outline-none placeholder:text-[#bd91a4]"
          />
        </div>

        <button
          type="button"
          onClick={onSearch}
          disabled={
            searching ||
            !searchValue.trim()
          }
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white disabled:opacity-50"
        >
          <Search size={18} />

          {searching
            ? "Searching..."
            : "Search Users"}
        </button>

        <div className="space-y-3">
          {searchResults.length ? (
            searchResults
              .filter(
                (user) =>
                  user.uid !== currentUid
              )
              .map((user) => {
                const status =
                  friendshipStatuses[
                    user.uid
                  ] || "none";

                return (
                  <div
                    key={user.uid}
                    className="rounded-[24px] bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <PersonAvatar
                        person={user}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black text-[#1f1720]">
                          {user.name ||
                            "Limi User"}
                        </p>

                        <p className="truncate text-sm font-bold text-[#80636f]">
                          {user.city ||
                            "No city yet"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          status === "none"
                        ) {
                          onAddFriend(user);
                        }
                      }}
                      disabled={
                        status !== "none"
                      }
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#fff0f6] py-3 text-sm font-black text-[#d94b93] disabled:text-[#a88997]"
                    >
                      {status ===
                      "friends" ? (
                        <>
                          <Check size={16} />
                          Friends
                        </>
                      ) : status ===
                        "pending" ? (
                        <>
                          <UserPlus
                            size={16}
                          />
                          Requested
                        </>
                      ) : (
                        <>
                          <UserPlus
                            size={16}
                          />
                          Add Friend
                        </>
                      )}
                    </button>
                  </div>
                );
              })
          ) : (
            <div className="rounded-[28px] bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-bold text-[#80636f]">
                Search for another
                Limi user 💕
              </p>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------
   CREATE GROUP CHAT MODAL
------------------------------------------------------- */

function CreateGroupChatModal({
  open,
  onClose,
  friends,
  selectedFriends,
  setSelectedFriends,
  groupName,
  setGroupName,
  onCreateGroup,
  creating,
}) {
  const toggleFriend = (friendUid) => {
    setSelectedFriends(
      (previousFriends) =>
        previousFriends.includes(
          friendUid
        )
          ? previousFriends.filter(
              (uid) =>
                uid !== friendUid
            )
          : [
              ...previousFriends,
              friendUid,
            ]
    );
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="New Group Chat"
    >
      <div className="space-y-4">
        <input
          value={groupName}
          onChange={(event) =>
            setGroupName(
              event.target.value
            )
          }
          placeholder="Group chat name..."
          className="w-full rounded-2xl border border-[#f3dbe4] bg-white px-4 py-3 font-bold text-[#5f4b56] outline-none focus:border-[#ef9ab9]"
        />

        <div className="rounded-[26px] bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-[#80636f]">
            Add Friends
          </h3>

          <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
            {friends.length ? (
              friends.map((friend) => {
                const selected =
                  selectedFriends.includes(
                    friend.uid
                  );

                return (
                  <button
                    type="button"
                    key={friend.uid}
                    onClick={() =>
                      toggleFriend(
                        friend.uid
                      )
                    }
                    className={`flex w-full items-center justify-between gap-3 rounded-[20px] p-3 text-left transition ${
                      selected
                        ? "bg-[#ffe4ef]"
                        : "bg-[#fff8fb]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <PersonAvatar
                        person={friend}
                      />

                      <div className="min-w-0">
                        <p className="truncate font-black text-[#1f1720]">
                          {friend.name ||
                            "Limi Friend"}
                        </p>

                        <p className="truncate text-sm font-semibold text-[#80636f]">
                          {friend.city ||
                            ""}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        selected
                          ? "bg-[#d94b93] text-white"
                          : "border border-[#f0d8e2] bg-white text-transparent"
                      }`}
                    >
                      <Check size={15} />
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-center text-sm font-bold leading-6 text-[#80636f]">
                Add friends first to
                make a group chat 💕
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateGroup}
          disabled={
            creating ||
            !groupName.trim() ||
            selectedFriends.length < 1
          }
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white disabled:opacity-50"
        >
          <Send size={18} />

          {creating
            ? "Creating..."
            : "Create Group Chat"}
        </button>
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------
   MAIN CHAT PAGE
------------------------------------------------------- */

export default function MainChat() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] =
    useState(auth.currentUser);

  const [
    currentProfile,
    setCurrentProfile,
  ] = useState(null);

  const [chats, setChats] =
    useState([]);

  const [friends, setFriends] =
    useState([]);

  const [
    friendRequests,
    setFriendRequests,
  ] = useState([]);

  const [
    matchedPeople,
    setMatchedPeople,
  ] = useState([]);

  const [
    friendshipStatuses,
    setFriendshipStatuses,
  ] = useState({});

  const [
    loadingChats,
    setLoadingChats,
  ] = useState(true);

  const [
    loadingMatches,
    setLoadingMatches,
  ] = useState(true);

  const [
    repairingHangouts,
    setRepairingHangouts,
  ] = useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [
    requestsOpen,
    setRequestsOpen,
  ] = useState(false);

  const [
    friendsOpen,
    setFriendsOpen,
  ] = useState(false);

  const [
    findFriendsOpen,
    setFindFriendsOpen,
  ] = useState(false);

  const [
    createGroupOpen,
    setCreateGroupOpen,
  ] = useState(false);

  const [
    userSearchValue,
    setUserSearchValue,
  ] = useState("");

  const [
    userSearchResults,
    setUserSearchResults,
  ] = useState([]);

  const [
    searchingUsers,
    setSearchingUsers,
  ] = useState(false);

  const [
    selectedFriends,
    setSelectedFriends,
  ] = useState([]);

  const [groupName, setGroupName] =
    useState("");

  const [
    creatingGroup,
    setCreatingGroup,
  ] = useState(false);

  const currentUid =
    currentUser?.uid || "";

  /* -------------------------------------------------------
     AUTH + CURRENT PROFILE
  ------------------------------------------------------- */

  useEffect(() => {
    const unsubscribe =
      auth.onAuthStateChanged(
        async (user) => {
          setCurrentUser(user);

          if (!user) {
            setCurrentProfile(null);
            return;
          }

          try {
            const profile =
              await loadUserProfile(
                user.uid
              );

            setCurrentProfile(profile);
          } catch (error) {
            console.error(
              "Could not load current profile:",
              error
            );

            const fallbackName =
              user.displayName ||
              user.email?.split("@")[0] ||
              "Limi User";

            setCurrentProfile({
              uid: user.uid,
              id: user.uid,
              name: fallbackName,
              avatar:
                getInitials(
                  fallbackName
                ),
              photoURL:
                user.photoURL || "",
              city: "",
            });
          }
        }
      );

    return () => unsubscribe();
  }, []);

  /* -------------------------------------------------------
     LIVE CHAT LIST
  ------------------------------------------------------- */

  useEffect(() => {
    if (!currentUid) {
      setChats([]);
      setLoadingChats(false);
      return undefined;
    }

    setLoadingChats(true);

    const chatsQuery = query(
      collection(db, "chats"),
      where(
        "memberIds",
        "array-contains",
        currentUid
      ),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const loadedChats =
          snapshot.docs.map(
            (chatDocument) => ({
              id: chatDocument.id,
              ...chatDocument.data(),
            })
          );

        setChats(loadedChats);
        setLoadingChats(false);
      },
      (error) => {
        console.error(
          "Could not load chats:",
          error
        );

        setChats([]);
        setLoadingChats(false);
      }
    );

    return () => unsubscribe();
  }, [currentUid]);

  /* -------------------------------------------------------
     REPAIR APPROVED HANGOUT CHATS

     Runs whenever MainChat opens so a locked hangout
     does not disappear after refreshing.
  ------------------------------------------------------- */

  useEffect(() => {
    if (
      !currentUid ||
      repairingHangouts
    ) {
      return;
    }

    let cancelled = false;

    async function repairMyHangoutChats() {
      try {
        setRepairingHangouts(true);

        const hangoutsSnapshot =
          await getDocs(
            collection(db, "hangouts")
          );

        const myHangouts =
          hangoutsSnapshot.docs
            .map(
              (hangoutDocument) => ({
                id: hangoutDocument.id,
                ...hangoutDocument.data(),
              })
            )
            .filter(
              (hangout) =>
                hangout.isLocked ===
                  true &&
                userCanAccessHangout(
                  hangout,
                  currentUid
                )
            );

        await Promise.all(
          myHangouts.map((hangout) =>
            repairHangoutChat(hangout)
          )
        );
      } catch (error) {
        console.error(
          "Could not repair hangout chats:",
          error
        );
      } finally {
        if (!cancelled) {
          setRepairingHangouts(false);
        }
      }
    }

    repairMyHangoutChats();

    return () => {
      cancelled = true;
    };
  }, [currentUid]);

  /* -------------------------------------------------------
     LIVE FRIENDS
  ------------------------------------------------------- */

  useEffect(() => {
    if (!currentUid) {
      setFriends([]);
      return undefined;
    }

    const friendsQuery = query(
      collection(
        db,
        "users",
        currentUid,
        "friends"
      )
    );

    const unsubscribe = onSnapshot(
      friendsQuery,
      (snapshot) => {
        const loadedFriends =
          snapshot.docs.map(
            (friendDocument) => {
              const data =
                friendDocument.data();

              const name =
                data.name ||
                "Limi Friend";

              return {
                id:
                  friendDocument.id,
                uid:
                  data.uid ||
                  friendDocument.id,
                ...data,
                name,
                avatar:
                  data.avatar ||
                  getInitials(name),
                photoURL:
                  data.photoURL ||
                  data.profileImage ||
                  "",
              };
            }
          );

        setFriends(loadedFriends);
      },
      (error) => {
        console.error(
          "Could not load friends:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, [currentUid]);

  /* -------------------------------------------------------
     LIVE FRIEND REQUESTS
  ------------------------------------------------------- */

  useEffect(() => {
    if (!currentUid) {
      setFriendRequests([]);
      return undefined;
    }

    const requestsQuery = query(
      collection(db, "friendRequests"),
      where(
        "toUid",
        "==",
        currentUid
      ),
      where(
        "status",
        "==",
        "pending"
      )
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const requests =
          snapshot.docs.map(
            (requestDocument) => ({
              id: requestDocument.id,
              ...requestDocument.data(),
            })
          );

        setFriendRequests(requests);
      },
      (error) => {
        console.error(
          "Could not load friend requests:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, [currentUid]);

  /* -------------------------------------------------------
     LOAD MATCHED PEOPLE
  ------------------------------------------------------- */

  useEffect(() => {
    if (!currentUid) {
      setMatchedPeople([]);
      setLoadingMatches(false);
      return undefined;
    }

    const activityReference = doc(
      db,
      "matchActivity",
      currentUid
    );

    const unsubscribe = onSnapshot(
      activityReference,
      async (snapshot) => {
        try {
          setLoadingMatches(true);

          const activity =
            snapshot.exists()
              ? {
                  ...defaultMatchActivity(),
                  ...snapshot.data(),
                }
              : defaultMatchActivity();

          const matchIds = [
            ...new Set(
              activity.matches || []
            ),
          ].filter(Boolean);

          const profiles =
            await Promise.all(
              matchIds.map((matchUid) =>
                loadUserProfile(matchUid)
              )
            );

          setMatchedPeople(
            profiles.filter(Boolean)
          );
        } catch (error) {
          console.error(
            "Could not load matched people:",
            error
          );

          setMatchedPeople([]);
        } finally {
          setLoadingMatches(false);
        }
      },
      (error) => {
        console.error(
          "Could not load match activity:",
          error
        );

        setMatchedPeople([]);
        setLoadingMatches(false);
      }
    );

    return () => unsubscribe();
  }, [currentUid]);

  /* -------------------------------------------------------
     FRIENDSHIP STATUS MAP
  ------------------------------------------------------- */

  useEffect(() => {
    if (!currentUid) {
      setFriendshipStatuses({});
      return;
    }

    let cancelled = false;

    async function loadStatuses() {
      const peopleToCheck = [
        ...matchedPeople,
        ...userSearchResults,
      ];

      const uniquePeople = Array.from(
        new Map(
          peopleToCheck
            .filter(
              (person) =>
                person?.uid &&
                person.uid !==
                  currentUid
            )
            .map((person) => [
              person.uid,
              person,
            ])
        ).values()
      );

      const nextStatuses = {};

      await Promise.all(
        uniquePeople.map(
          async (person) => {
            const friendExists =
              friends.some(
                (friend) =>
                  friend.uid ===
                  person.uid
              );

            if (friendExists) {
              nextStatuses[
                person.uid
              ] = "friends";
              return;
            }

            try {
              const sentSnapshot =
                await getDocs(
                  query(
                    collection(
                      db,
                      "friendRequests"
                    ),
                    where(
                      "fromUid",
                      "==",
                      currentUid
                    ),
                    where(
                      "toUid",
                      "==",
                      person.uid
                    ),
                    where(
                      "status",
                      "==",
                      "pending"
                    )
                  )
                );

              const receivedSnapshot =
                await getDocs(
                  query(
                    collection(
                      db,
                      "friendRequests"
                    ),
                    where(
                      "fromUid",
                      "==",
                      person.uid
                    ),
                    where(
                      "toUid",
                      "==",
                      currentUid
                    ),
                    where(
                      "status",
                      "==",
                      "pending"
                    )
                  )
                );

              nextStatuses[
                person.uid
              ] =
                !sentSnapshot.empty ||
                !receivedSnapshot.empty
                  ? "pending"
                  : "none";
            } catch (error) {
              console.error(
                "Could not check friendship status:",
                error
              );

              nextStatuses[
                person.uid
              ] = "none";
            }
          }
        )
      );

      if (!cancelled) {
        setFriendshipStatuses(
          (previousStatuses) => ({
            ...previousStatuses,
            ...nextStatuses,
          })
        );
      }
    }

    loadStatuses();

    return () => {
      cancelled = true;
    };
  }, [
    currentUid,
    matchedPeople,
    userSearchResults,
    friends,
  ]);

  /* -------------------------------------------------------
     FILTERED DATA
  ------------------------------------------------------- */

  const filteredChats = useMemo(() => {
    if (!searchText.trim()) {
      return chats;
    }

    const search =
      searchText
        .trim()
        .toLowerCase();

    return chats.filter((chat) => {
      const memberNames =
        Object.values(
          chat.memberNames || {}
        ).join(" ");

      const profileNames =
        (chat.memberProfiles || [])
          .map(
            (member) =>
              member.name || ""
          )
          .join(" ");

      return `${chat.title || ""} ${
        chat.name || ""
      } ${chat.lastMessage || ""} ${
        chat.location || ""
      } ${memberNames} ${profileNames}`
        .toLowerCase()
        .includes(search);
    });
  }, [chats, searchText]);

  const filteredMatchedPeople =
    useMemo(() => {
      if (!searchText.trim()) {
        return matchedPeople;
      }

      const search =
        searchText
          .trim()
          .toLowerCase();

      return matchedPeople.filter(
        (person) =>
          `${person.name || ""} ${
            person.city || ""
          }`
            .toLowerCase()
            .includes(search)
      );
    }, [
      matchedPeople,
      searchText,
    ]);

  const directMessages =
    filteredChats.filter(
      (chat) =>
        chat.type !== "hangout" &&
        chat.type !==
          "friends_group" &&
        chat.chatType !== "group"
    );

  const hangoutGroupChats =
    filteredChats.filter(
      (chat) =>
        chat.type === "hangout"
    );

  const friendGroupChats =
    filteredChats.filter(
      (chat) =>
        chat.type ===
          "friends_group"
    );

const totalGroups =
    hangoutGroupChats.length +
    friendGroupChats.length;

  const pageLoading =
    loadingChats || loadingMatches;

  /* -------------------------------------------------------
     SEARCH USERS
  ------------------------------------------------------- */

  const searchUsers = async () => {
    if (!userSearchValue.trim()) {
      return;
    }

    try {
      setSearchingUsers(true);

      const search =
        userSearchValue
          .trim()
          .toLowerCase();

      const usersSnapshot =
        await getDocs(
          query(
            collection(db, "users"),
            limit(50)
          )
        );

      const results =
        usersSnapshot.docs
          .map((userDocument) => {
            const data =
              userDocument.data();

            const name =
              data.name ||
              data.displayName ||
              data.fullName ||
              "Limi User";

            return {
              id: userDocument.id,
              uid: userDocument.id,
              ...data,
              name,
              avatar:
                data.avatar ||
                getInitials(name),
              photoURL:
                getProfilePhoto(data),
              city:
                data.city ||
                data.displayLocation ||
                data.location?.city ||
                "",
            };
          })
          .filter((user) => {
            if (
              user.uid === currentUid
            ) {
              return false;
            }

            const name =
              `${user.name || ""}`.toLowerCase();

            const username =
              `${user.username || ""}`.toLowerCase();

            const email =
              `${user.email || ""}`.toLowerCase();

            return (
              name.includes(search) ||
              username.includes(search) ||
              email.includes(search)
            );
          });

      setUserSearchResults(results);
    } catch (error) {
      console.error(
        "User search failed:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "Could not search users."
      );
    } finally {
      setSearchingUsers(false);
    }
  };

  /* -------------------------------------------------------
     SEND FRIEND REQUEST
  ------------------------------------------------------- */

  const sendFriendRequest = async (
    person
  ) => {
    const personUid =
      person?.uid || person?.id;

    if (
      !currentUid ||
      !personUid ||
      personUid === currentUid
    ) {
      return;
    }

    const existingStatus =
      friendshipStatuses[
        personUid
      ] || "none";

    if (
      existingStatus === "friends"
    ) {
      window.alert(
        "You are already friends 💕"
      );

      return;
    }

    if (
      existingStatus === "pending"
    ) {
      window.alert(
        "A friend request is already pending."
      );

      return;
    }

    try {
      const myName =
        currentProfile?.name ||
        currentUser?.displayName ||
        currentUser?.email?.split(
          "@"
        )[0] ||
        "Limi User";

      const requestId = [
        currentUid,
        personUid,
      ]
        .sort()
        .join("_");

      await setDoc(
        doc(
          db,
          "friendRequests",
          requestId
        ),
        {
          fromUid: currentUid,
          toUid: personUid,

          fromName: myName,

          fromAvatar:
            currentProfile?.avatar ||
            getInitials(myName),

          fromPhotoURL:
            currentProfile?.photoURL ||
            currentUser?.photoURL ||
            "",

          fromCity:
            currentProfile?.city || "",

          toName:
            person.name ||
            "Limi User",

          toPhotoURL:
            person.photoURL || "",

          status: "pending",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
        { merge: true }
      );

      await createNotification({
        toUid: personUid,
        fromUid: currentUid,
        type: "friend_request",
        title:
          "New friend request 💕",
        message: `${myName} wants to be friends.`,
      });

      setFriendshipStatuses(
        (previousStatuses) => ({
          ...previousStatuses,
          [personUid]: "pending",
        })
      );

      window.alert(
        "Friend request sent 💕"
      );
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
    }
  };

  /* -------------------------------------------------------
     ACCEPT FRIEND REQUEST
  ------------------------------------------------------- */

  const acceptFriendRequest = async (
    request
  ) => {
    if (
      !currentUid ||
      !request?.fromUid
    ) {
      return;
    }

    try {
      const myName =
        currentProfile?.name ||
        currentUser?.displayName ||
        currentUser?.email?.split(
          "@"
        )[0] ||
        "Limi User";

      const myPhoto =
        currentProfile?.photoURL ||
        currentUser?.photoURL ||
        "";

      const myCity =
        currentProfile?.city || "";

      await setDoc(
        doc(
          db,
          "users",
          currentUid,
          "friends",
          request.fromUid
        ),
        {
          uid: request.fromUid,

          name:
            request.fromName ||
            "Limi Friend",

          avatar:
            request.fromAvatar ||
            getInitials(
              request.fromName ||
                "L"
            ),

          photoURL:
            request.fromPhotoURL ||
            "",

          city:
            request.fromCity || "",

          friendSince:
            serverTimestamp(),

          createdAt:
            serverTimestamp(),
        },
        { merge: true }
      );

      await setDoc(
        doc(
          db,
          "users",
          request.fromUid,
          "friends",
          currentUid
        ),
        {
          uid: currentUid,
          name: myName,

          avatar:
            currentProfile?.avatar ||
            getInitials(myName),

          photoURL: myPhoto,
          city: myCity,

          friendSince:
            serverTimestamp(),

          createdAt:
            serverTimestamp(),
        },
        { merge: true }
      );

      await updateDoc(
        doc(
          db,
          "friendRequests",
          request.id
        ),
        {
          status: "accepted",
          acceptedAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp(),
        }
      );

      await createNotification({
        toUid: request.fromUid,
        fromUid: currentUid,
        type:
          "friend_request_accepted",
        title:
          "Friend request accepted 💖",
        message: `${myName} accepted your friend request.`,
      });

      setFriendshipStatuses(
        (previousStatuses) => ({
          ...previousStatuses,
          [request.fromUid]:
            "friends",
        })
      );

      window.alert(
        `You and ${
          request.fromName ||
          "this Limi user"
        } are now friends 💕`
      );
    } catch (error) {
      console.error(
        "Could not accept friend request:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "Could not accept the request."
      );
    }
  };

  /* -------------------------------------------------------
     DECLINE FRIEND REQUEST
  ------------------------------------------------------- */

  const declineFriendRequest = async (
    request
  ) => {
    if (!request?.id) return;

    try {
      await updateDoc(
        doc(
          db,
          "friendRequests",
          request.id
        ),
        {
          status: "declined",
          declinedAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(
        "Could not decline friend request:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "Could not decline the request."
      );
    }
  };

  /* -------------------------------------------------------
     CREATE OR OPEN DIRECT CHAT
  ------------------------------------------------------- */

  const openDirectChat = async (
    person
  ) => {
    const personUid =
      person?.uid || person?.id;

    if (
      !currentUid ||
      !personUid ||
      personUid === currentUid
    ) {
      return;
    }

    try {
      const chatId = [
        currentUid,
        personUid,
      ]
        .sort()
        .join("_");

      const chatReference = doc(
        db,
        "chats",
        chatId
      );

      const chatSnapshot =
        await getDoc(chatReference);

      const myName =
        currentProfile?.name ||
        currentUser?.displayName ||
        currentUser?.email?.split(
          "@"
        )[0] ||
        "Limi User";

      const personName =
        person.name ||
        "Limi User";

      const memberProfiles = [
        {
          uid: currentUid,
          name: myName,

          avatar:
            currentProfile?.avatar ||
            getInitials(myName),

          photoURL:
            currentProfile?.photoURL ||
            currentUser?.photoURL ||
            "",

          city:
            currentProfile?.city || "",
        },
        {
          uid: personUid,
          name: personName,

          avatar:
            person.avatar ||
            getInitials(personName),

          photoURL:
            person.photoURL || "",

          city:
            person.city || "",
        },
      ];

      if (!chatSnapshot.exists()) {
        await setDoc(
          chatReference,
          {
            id: chatId,
            type: "match",
            chatType: "direct",

            memberIds: [
              currentUid,
              personUid,
            ],

            members: [
              currentUid,
              personUid,
            ],

            memberProfiles,

            memberNames: {
              [currentUid]:
                myName,
              [personUid]:
                personName,
            },

            memberPhotos: {
              [currentUid]:
                currentProfile?.photoURL ||
                currentUser?.photoURL ||
                "",

              [personUid]:
                person.photoURL || "",
            },

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),

            lastMessage:
              "You connected on Limi 💕",

            lastMessageAt:
              serverTimestamp(),
          }
        );
      } else {
        await setDoc(
          chatReference,
          {
            memberIds: [
              currentUid,
              personUid,
            ],

            members: [
              currentUid,
              personUid,
            ],

            memberProfiles,

            memberNames: {
              [currentUid]:
                myName,
              [personUid]:
                personName,
            },

            memberPhotos: {
              [currentUid]:
                currentProfile?.photoURL ||
                currentUser?.photoURL ||
                "",

              [personUid]:
                person.photoURL || "",
            },
          },
          { merge: true }
        );
      }

      navigate(`/chat/${chatId}`);
    } catch (error) {
      console.error(
        "Could not open direct chat:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "Could not open the chat."
      );
    }
  };

  /* -------------------------------------------------------
     CREATE FRIEND GROUP CHAT
  ------------------------------------------------------- */

  const createGroupChat = async () => {
    if (
      !currentUid ||
      !groupName.trim() ||
      selectedFriends.length < 1
    ) {
      return;
    }

    try {
      setCreatingGroup(true);

      const selectedProfiles =
        friends.filter((friend) =>
          selectedFriends.includes(
            friend.uid
          )
        );

      const memberIds = [
        currentUid,
        ...selectedProfiles.map(
          (friend) => friend.uid
        ),
      ];

      const myName =
        currentProfile?.name ||
        currentUser?.displayName ||
        currentUser?.email?.split(
          "@"
        )[0] ||
        "Me";

      const memberProfiles = [
        {
          uid: currentUid,
          name: myName,

          photoURL:
            currentProfile?.photoURL ||
            currentUser?.photoURL ||
            "",

          avatar:
            currentProfile?.avatar ||
            getInitials(myName),

          city:
            currentProfile?.city || "",
        },

        ...selectedProfiles.map(
          (friend) => ({
            uid: friend.uid,

            name:
              friend.name ||
              "Limi Friend",

            photoURL:
              friend.photoURL || "",

            avatar:
              friend.avatar ||
              getInitials(
                friend.name || "L"
              ),

            city:
              friend.city || "",
          })
        ),
      ];

      const groupReference =
        await addDoc(
          collection(db, "chats"),
          {
            type: "friends_group",
            chatType: "group",

            title:
              groupName.trim(),

            name:
              groupName.trim(),

            memberIds,
            members: memberIds,
            memberProfiles,

            createdBy: currentUid,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),

            lastMessage:
              "Group chat created 💕",

            lastMessageAt:
              serverTimestamp(),
          }
        );

      await Promise.all(
        selectedProfiles.map(
          (friend) =>
            createNotification({
              toUid: friend.uid,
              fromUid: currentUid,

              type:
                "friend_group_chat_invite",

              title:
                "New group chat 💬",

              message: `You were added to "${groupName.trim()}".`,

              chatId:
                groupReference.id,
            })
        )
      );

      setGroupName("");
      setSelectedFriends([]);
      setCreateGroupOpen(false);

      navigate(
        `/chat/${groupReference.id}`
      );
    } catch (error) {
      console.error(
        "Could not create group chat:",
        error
      );

      window.alert(
        getFriendlyFirebaseErrorMessage?.(
          error
        ) ||
          error.message ||
          "Could not create the group chat."
      );
    } finally {
      setCreatingGroup(false);
    }
  };

  /* -------------------------------------------------------
     OPEN EXISTING CHAT
  ------------------------------------------------------- */

  const openChat = (chatItem) => {
    if (
      chatItem.type === "hangout"
    ) {
      const hangoutId =
        chatItem.hangoutId ||
        String(chatItem.id).replace(
          /^hangout_/,
          ""
        );

      navigate(
        `/hangout-chat/${hangoutId}`
      );

      return;
    }

    navigate(`/chat/${chatItem.id}`);
  };

  /* -------------------------------------------------------
     PAGE
  ------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#fff6fa] pb-28">
      <div className="mx-auto max-w-md px-4 pt-5">
        {/* HEADER CARD */}

        <div className="relative overflow-hidden rounded-[38px] bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] p-5 text-white shadow-[0_12px_35px_rgba(237,102,157,0.22)]">
          <div className="absolute -left-14 bottom-[-70px] h-48 w-48 rounded-full bg-white/10" />

          <div className="absolute right-[-45px] top-[-55px] h-48 w-48 rounded-full bg-white/10" />

          <div className="relative z-10">
       

            <div className="flex items-center gap-3 rounded-full bg-white/20 px-4 py-3 backdrop-blur">
              <Search
                size={18}
                className="shrink-0 text-white"
              />

              <input
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value
                  )
                }
                placeholder="Search chats or matches..."
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/75"
              />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() =>
                  setRequestsOpen(true)
                }
                className="rounded-[24px] bg-white/18 p-4 text-center backdrop-blur"
              >
                <UserPlus
                  size={22}
                  className="mx-auto"
                />

                <p className="mt-2 text-2xl font-black">
                  {
                    friendRequests.length
                  }
                </p>

                <p className="text-[10px] font-black uppercase tracking-wide text-white/90">
                  Requests
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFriendsOpen(true)
                }
                className="rounded-[24px] bg-white/18 p-4 text-center backdrop-blur"
              >
                <Heart
                  size={22}
                  className="mx-auto"
                />

                <p className="mt-2 text-2xl font-black">
                  {friends.length}
                </p>

                <p className="text-[10px] font-black uppercase tracking-wide text-white/90">
                  Friends
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setCreateGroupOpen(
                    true
                  )
                }
                className="rounded-[24px] bg-white/18 p-4 text-center backdrop-blur"
              >
                <Plus
                  size={22}
                  className="mx-auto"
                />

                <p className="mt-2 text-2xl font-black">
                  {totalGroups}
                </p>

                <p className="text-[10px] font-black uppercase tracking-wide text-white/90">
                  Groups
                </p>
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                setFindFriendsOpen(true)
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-black text-[#d94b93]"
            >
              <UserPlus size={17} />
              Find More Friends
            </button>
          </div>
        </div>

        {/* PAGE CONTENT */}

        <div className="mt-7 space-y-8">
          {pageLoading ? (
            <div className="rounded-[36px] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#f7c5d7] border-t-[#eb6aaa]" />

              <p className="mt-4 font-black text-[#80636f]">
                Loading your chats...
              </p>
            </div>
          ) : (
            <>
              <MatchedPeopleSection
                people={
                  filteredMatchedPeople
                }
                friendshipStatuses={
                  friendshipStatuses
                }
                onMessage={
                  openDirectChat
                }
                onAddFriend={
                  sendFriendRequest
                }
              />

              <ChatSection
                title="Messages"
                subtitle="private chats with your matches and friends"
                icon={Heart}
                chats={directMessages}
                currentUid={
                  currentUid
                }
                onOpenChat={openChat}
              />

              <ChatSection
                title="Hangout Groups"
                subtitle="group chats from plans you joined"
                icon={Users}
                chats={
                  hangoutGroupChats
                }
                currentUid={
                  currentUid
                }
                onOpenChat={openChat}
              />

              <ChatSection
                title="Friend Groups"
                subtitle="group chats you made with friends"
                icon={
                  MessageCircle
                }
                chats={
                  friendGroupChats
                }
                currentUid={
                  currentUid
                }
                onOpenChat={openChat}
              />
            </>
          )}
        </div>
      </div>

      {/* FRIEND REQUESTS */}

      <FriendRequestsModal
        open={requestsOpen}
        onClose={() =>
          setRequestsOpen(false)
        }
        requests={friendRequests}
        onAccept={
          acceptFriendRequest
        }
        onDecline={
          declineFriendRequest
        }
      />

      {/* FRIENDS */}

      <FriendsModal
        open={friendsOpen}
        onClose={() =>
          setFriendsOpen(false)
        }
        friends={friends}
        onMessage={openDirectChat}
        onFindFriends={() => {
          setFriendsOpen(false);
          setFindFriendsOpen(true);
        }}
      />

      {/* FIND FRIENDS */}

      <UserSearchModal
        open={findFriendsOpen}
        onClose={() =>
          setFindFriendsOpen(false)
        }
        searchValue={
          userSearchValue
        }
        setSearchValue={
          setUserSearchValue
        }
        searchResults={
          userSearchResults
        }
        searching={
          searchingUsers
        }
        onSearch={searchUsers}
        onAddFriend={
          sendFriendRequest
        }
        currentUid={currentUid}
        friendshipStatuses={
          friendshipStatuses
        }
      />

      {/* CREATE GROUP */}

      <CreateGroupChatModal
        open={createGroupOpen}
        onClose={() =>
          setCreateGroupOpen(false)
        }
        friends={friends}
        selectedFriends={
          selectedFriends
        }
        setSelectedFriends={
          setSelectedFriends
        }
        groupName={groupName}
        setGroupName={setGroupName}
        onCreateGroup={
          createGroupChat
        }
        creating={
          creatingGroup
        }
      />
    </div>
  );
}