import { getFriendlyFirebaseErrorMessage } from "../lib/firebaseError";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Search,
  Users,
  Heart,
  MapPin,
  Sparkles,
  UserPlus,
  X,
  Check,
  Ban,
  Plus,
  Send,
} from "lucide-react";

import { auth, db } from "../lib/firebase";

import {
  addDoc,
  collection,
  doc,
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

function getInitials(text = "L") {
  return text
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatChatTime(value) {
  if (!value) return "";

  const date = value?.toDate ? value.toDate() : new Date(value);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

async function createNotification({
  toUid,
  fromUid,
  type,
  title,
  message,
  chatId = "",
}) {
  if (!toUid) return;

  await addDoc(collection(db, "notifications"), {
    toUid,
    fromUid: fromUid || "",
    type,
    title,
    message,
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

function ChatAvatar({ chat }) {
  const isHangout = chat.type === "hangout";
  const isGroup = chat.chatType === "group" || chat.type === "friends_group";

  if (chat.photoURL) {
    return (
      <img
        src={chat.photoURL}
        alt=""
        className="h-14 w-14 rounded-[20px] object-cover"
      />
    );
  }

  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-[20px] text-xl font-black text-white ${
        isHangout || isGroup
          ? "bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b]"
          : "bg-gradient-to-br from-[#d85fa0] to-[#b94e80]"
      }`}
    >
      {isHangout || isGroup ? <Users size={24} /> : getInitials(chat.title || "L")}
    </div>
  );
}

function ChatCard({ chat, onClick }) {
  const isHangout = chat.type === "hangout";
  const isGroup = chat.chatType === "group" || chat.type === "friends_group";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[28px] bg-white p-4 text-left shadow-[0_10px_28px_rgba(239,148,181,0.13)] transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <ChatAvatar chat={chat} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-lg font-black text-[#1f1720]">
                  {chat.title || chat.name || "Limi Chat"}
                </h3>

                <span className="rounded-full bg-[#fff0f6] px-2 py-1 text-[10px] font-black uppercase text-[#d85fa0]">
                  {isHangout ? "Hangout" : isGroup ? "Group" : "DM"}
                </span>
              </div>

              {chat.location && (
                <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[#96607f]">
                  <MapPin size={13} />
                  <span className="truncate">{chat.location}</span>
                </div>
              )}
            </div>

            <p className="shrink-0 text-xs font-black text-[#b8839a]">
              {formatChatTime(chat.updatedAt || chat.createdAt)}
            </p>
          </div>

          <p className="mt-2 truncate text-sm font-semibold text-[#80636f]">
            {chat.lastMessage || "Say hi 💕"}
          </p>
        </div>
      </div>
    </button>
  );
}

function ChatSection({ title, subtitle, icon: Icon, chats, onOpenChat }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffe4ef] text-[#d94b93]">
          <Icon size={21} />
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[#1f1720]">
            {title}
          </h2>
          <p className="text-sm font-bold text-[#80636f]">{subtitle}</p>
        </div>
      </div>

      {chats.length ? (
        <div className="space-y-3">
          {chats.map((chat) => (
            <ChatCard key={chat.id} chat={chat} onClick={() => onOpenChat(chat)} />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-[#80636f]">Nothing here yet 💕</p>
        </div>
      )}
    </div>
  );
}

function FriendRequestCard({ request, onAccept, onDecline }) {
  return (
    <div className="rounded-[24px] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {request.fromPhotoURL ? (
          <img
            src={request.fromPhotoURL}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e85da2] font-black text-white">
            {request.fromAvatar || getInitials(request.fromName || "L")}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-black text-[#1f1720]">
            {request.fromName || "Limi User"}
          </p>
          <p className="text-sm font-bold text-[#80636f]">
            wants to be friends 💕
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onAccept(request)}
          className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-3 text-sm font-black text-white"
        >
          <Check size={16} />
          Accept
        </button>

        <button
          type="button"
          onClick={() => onDecline(request)}
          className="flex items-center justify-center gap-2 rounded-full border border-[#f0d8e2] bg-white py-3 text-sm font-black text-[#b66b88]"
        >
          <Ban size={16} />
          Decline
        </button>
      </div>
    </div>
  );
}

function FriendRequestsModal({
  open,
  onClose,
  requests,
  onAccept,
  onDecline,
}) {
  return (
    <ModalShell open={open} onClose={onClose} title="Friend Requests">
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
          <div className="rounded-[28px] bg-white p-6 text-center shadow-sm">
            <Sparkles size={38} className="mx-auto mb-3 text-[#f089b0]" />
            <p className="font-bold text-[#80636f]">
              No friend requests yet 💕
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function UserSearchModal({
  open,
  onClose,
  searchValue,
  setSearchValue,
  searchResults,
  searching,
  onSearch,
  onAddFriend,
  currentUser,
}) {
  return (
    <ModalShell open={open} onClose={onClose} title="Find Friends">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-full border border-[#f1d8e3] bg-white px-4 py-3">
          <Search size={18} className="text-[#d86592]" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search name or username..."
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#5f4b56] outline-none placeholder:text-[#bd91a4]"
          />
        </div>

        <button
          type="button"
          onClick={onSearch}
          disabled={searching || !searchValue.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white disabled:opacity-50"
        >
          <Search size={18} />
          {searching ? "Searching..." : "Search Users"}
        </button>

        <div className="space-y-3">
          {searchResults.length ? (
            searchResults
              .filter((user) => user.id !== currentUser?.uid)
              .map((user) => (
                <div
                  key={user.id}
                  className="rounded-[24px] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {user.profileImage || user.photoURL ? (
                      <img
                        src={user.profileImage || user.photoURL}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e85da2] font-black text-white">
                        {getInitials(user.name || user.displayName || "L")}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-[#1f1720]">
                        {user.name || user.displayName || "Limi User"}
                      </p>
                      <p className="truncate text-sm font-bold text-[#80636f]">
                        {user.city || "No city yet"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddFriend(user)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#fff0f6] py-3 text-sm font-black text-[#d94b93]"
                  >
                    <UserPlus size={16} />
                    Add Friend
                  </button>
                </div>
              ))
          ) : (
            <div className="rounded-[28px] bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-bold text-[#80636f]">
                Search for another Limi user 💕
              </p>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

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
    setSelectedFriends((prev) =>
      prev.includes(friendUid)
        ? prev.filter((uid) => uid !== friendUid)
        : [...prev, friendUid]
    );
  };

  return (
    <ModalShell open={open} onClose={onClose} title="New Group Chat">
      <div className="space-y-4">
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
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
                const selected = selectedFriends.includes(friend.uid);

                return (
                  <button
                    type="button"
                    key={friend.uid}
                    onClick={() => toggleFriend(friend.uid)}
                    className={`flex w-full items-center justify-between gap-3 rounded-[20px] p-3 text-left transition ${
                      selected ? "bg-[#ffe4ef]" : "bg-[#fff8fb]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {friend.photoURL ? (
                        <img
                          src={friend.photoURL}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e85da2] text-sm font-black text-white">
                          {friend.avatar || getInitials(friend.name || "L")}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate font-black text-[#1f1720]">
                          {friend.name || "Limi Friend"}
                        </p>
                        <p className="truncate text-sm font-semibold text-[#80636f]">
                          {friend.city || ""}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
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
              <p className="text-center text-sm font-bold text-[#80636f]">
                Add friends first to make a group chat 💕
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateGroup}
          disabled={creating || !groupName.trim() || selectedFriends.length < 1}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white disabled:opacity-50"
        >
          <Send size={18} />
          {creating ? "Creating..." : "Create Group Chat"}
        </button>
      </div>
    </ModalShell>
  );
}

export default function MainChat() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [chats, setChats] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);

  const [searchText, setSearchText] = useState("");

  const [requestsOpen, setRequestsOpen] = useState(false);
  const [findFriendsOpen, setFindFriendsOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const [userSearchValue, setUserSearchValue] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [selectedFriends, setSelectedFriends] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "chats"),
      where("memberIds", "array-contains", currentUser.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setChats(data);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(collection(db, "users", currentUser.uid, "friends"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setFriends(data);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "friendRequests"),
      where("toUid", "==", currentUser.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setFriendRequests(data);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const filteredChats = useMemo(() => {
    if (!searchText.trim()) return chats;

    const search = searchText.toLowerCase();

    return chats.filter((chat) =>
      `${chat.title || ""} ${chat.name || ""} ${chat.lastMessage || ""} ${
        chat.location || ""
      }`
        .toLowerCase()
        .includes(search)
    );
  }, [chats, searchText]);

  const directMessages = filteredChats.filter(
    (chat) => chat.type !== "hangout" && chat.type !== "friends_group"
  );

  const hangoutGroups = filteredChats.filter((chat) => chat.type === "hangout");

  const friendGroups = filteredChats.filter(
    (chat) => chat.type === "friends_group"
  );

  const searchUsers = async () => {
    if (!userSearchValue.trim()) return;

    try {
      setSearchingUsers(true);

      const search = userSearchValue.trim().toLowerCase();

      const usersSnap = await getDocs(
        query(collection(db, "users"), limit(50))
      );

      const results = usersSnap.docs
        .map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }))
        .filter((user) => {
          const name = `${user.name || ""} ${user.displayName || ""}`.toLowerCase();
          const username = `${user.username || ""}`.toLowerCase();
          const email = `${user.email || ""}`.toLowerCase();

          return (
            name.includes(search) ||
            username.includes(search) ||
            email.includes(search)
          );
        });

      setUserSearchResults(results);
    } catch (error) {
      console.error("User search failed:", error);
      alert(error.message || "Could not search users.");
    } finally {
      setSearchingUsers(false);
    }
  };

  const sendFriendRequest = async (user) => {
    if (!currentUser?.uid || user.id === currentUser.uid) return;

    try {
      const myProfileSnap = await getDocs(
        query(collection(db, "users"), limit(1))
      );

      const currentProfile = myProfileSnap.docs
        .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
        .find((item) => item.id === currentUser.uid);

      const fromName =
        currentProfile?.name ||
        currentProfile?.displayName ||
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "Limi User";

      await addDoc(collection(db, "friendRequests"), {
        fromUid: currentUser.uid,
        toUid: user.id,
        fromName,
        fromAvatar: fromName.charAt(0).toUpperCase(),
        fromPhotoURL:
          currentProfile?.profileImage ||
          currentProfile?.photoURL ||
          currentUser.photoURL ||
          "",
        toName: user.name || user.displayName || "Limi User",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await createNotification({
        toUid: user.id,
        fromUid: currentUser.uid,
        type: "friend_request",
        title: "New friend request 💕",
        message: `${fromName} wants to be friends.`,
      });

      alert("Friend request sent 💕");
    } catch (error) {
      console.error("Could not send friend request:", error);
      alert(error.message || "Could not send friend request.");
    }
  };

  const acceptFriendRequest = async (request) => {
    if (!currentUser?.uid) return;

    try {
      const myProfileName =
        currentUser.displayName || currentUser.email?.split("@")[0] || "Limi User";

      await setDoc(doc(db, "users", currentUser.uid, "friends", request.fromUid), {
        uid: request.fromUid,
        name: request.fromName || "Limi Friend",
        avatar: request.fromAvatar || getInitials(request.fromName || "L"),
        photoURL: request.fromPhotoURL || "",
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, "users", request.fromUid, "friends", currentUser.uid), {
        uid: currentUser.uid,
        name: myProfileName,
        avatar: getInitials(myProfileName),
        photoURL: currentUser.photoURL || "",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "friendRequests", request.id), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      });

      await createNotification({
        toUid: request.fromUid,
        fromUid: currentUser.uid,
        type: "friend_request_accepted",
        title: "Friend request accepted 💖",
        message: `${myProfileName} accepted your friend request.`,
      });
    } catch (error) {
      console.error("Could not accept friend request:", error);
      alert(error.message || "Could not accept request.");
    }
  };

  const declineFriendRequest = async (request) => {
    try {
      await updateDoc(doc(db, "friendRequests", request.id), {
        status: "declined",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Could not decline friend request:", error);
      alert(error.message || "Could not decline request.");
    }
  };

  const createGroupChat = async () => {
    if (!currentUser?.uid || !groupName.trim() || selectedFriends.length < 1) {
      return;
    }

    try {
      setCreatingGroup(true);

      const selectedProfiles = friends.filter((friend) =>
        selectedFriends.includes(friend.uid)
      );

      const memberIds = [currentUser.uid, ...selectedFriends];

      const memberProfiles = [
        {
          uid: currentUser.uid,
          name:
            currentUser.displayName ||
            currentUser.email?.split("@")[0] ||
            "Me",
          photoURL: currentUser.photoURL || "",
          avatar: getInitials(
            currentUser.displayName || currentUser.email || "Me"
          ),
        },
        ...selectedProfiles.map((friend) => ({
          uid: friend.uid,
          name: friend.name || "Limi Friend",
          photoURL: friend.photoURL || "",
          avatar: friend.avatar || getInitials(friend.name || "L"),
        })),
      ];

      const chatRef = await addDoc(collection(db, "chats"), {
        type: "friends_group",
        chatType: "group",
        title: groupName.trim(),
        name: groupName.trim(),
        memberIds,
        members: memberIds,
        memberProfiles,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: "Group chat created 💕",
        lastMessageAt: serverTimestamp(),
      });

      await Promise.all(
        selectedFriends.map((uid) =>
          createNotification({
            toUid: uid,
            fromUid: currentUser.uid,
            type: "friend_group_chat_invite",
            title: "New group chat 💬",
            message: `You were added to "${groupName.trim()}".`,
            chatId: chatRef.id,
          })
        )
      );

      setGroupName("");
      setSelectedFriends([]);
      setCreateGroupOpen(false);
      navigate(`/chat/${chatRef.id}`);
    } catch (error) {
      console.error("Could not create group chat:", error);
      alert(error.message || "Could not create group chat.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const openChat = (chat) => {
    if (chat.type === "hangout") {
      navigate(`/hangout-chat/${chat.hangoutId || chat.id}`);
      return;
    }

    navigate(`/chat/${chat.id}`);
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
                Chats
              </h1>

              <p className="mt-2 text-lg font-bold text-[#80636f]">
                keep the friendship going 💕
              </p>
            </div>

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] text-white shadow-[0_12px_24px_rgba(237,102,157,0.3)]">
              <MessageCircle size={34} />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-full border border-[#f1d8e3] bg-white px-4 py-3">
            <Search size={18} className="text-[#d86592]" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search chats..."
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#5f4b56] outline-none placeholder:text-[#bd91a4]"
            />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setRequestsOpen(true)}
              className="rounded-[24px] bg-[#fff0f6] p-4 text-center"
            >
              <UserPlus size={22} className="mx-auto text-[#d94b93]" />
              <p className="mt-2 text-2xl font-black text-[#d94b93]">
                {friendRequests.length}
              </p>
              <p className="text-xs font-black uppercase text-[#96607f]">
                Requests
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFindFriendsOpen(true)}
              className="rounded-[24px] bg-[#fff0f6] p-4 text-center"
            >
              <Heart size={22} className="mx-auto text-[#d94b93]" />
              <p className="mt-2 text-2xl font-black text-[#d94b93]">
                {friends.length}
              </p>
              <p className="text-xs font-black uppercase text-[#96607f]">
                Friends
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCreateGroupOpen(true)}
              className="rounded-[24px] bg-[#fff0f6] p-4 text-center"
            >
              <Plus size={22} className="mx-auto text-[#d94b93]" />
              <p className="mt-2 text-2xl font-black text-[#d94b93]">
                {friendGroups.length + hangoutGroups.length}
              </p>
              <p className="text-xs font-black uppercase text-[#96607f]">
                Groups
              </p>
            </button>
          </div>
        </div>

        <div className="mt-7 space-y-8">
          {filteredChats.length ? (
            <>
              <ChatSection
                title="Messages"
                subtitle="one-on-one chats from matches"
                icon={Heart}
                chats={directMessages}
                onOpenChat={openChat}
              />

              <ChatSection
                title="Hangout Groups"
                subtitle="group chats from plans you joined"
                icon={Users}
                chats={hangoutGroups}
                onOpenChat={openChat}
              />

              <ChatSection
                title="Friend Groups"
                subtitle="group chats you made with friends"
                icon={MessageCircle}
                chats={friendGroups}
                onOpenChat={openChat}
              />
            </>
          ) : (
            <div className="rounded-[36px] bg-white p-10 text-center shadow-sm">
              <Sparkles size={48} className="mx-auto mb-4 text-[#f089b0]" />

              <h3 className="text-2xl font-black text-[#e85da2]">
                No chats yet
              </h3>

              <p className="mt-2 text-sm font-semibold text-[#80636f]">
                Match, add friends, or join a hangout to start chatting 💕
              </p>
            </div>
          )}
        </div>
      </div>

      <FriendRequestsModal
        open={requestsOpen}
        onClose={() => setRequestsOpen(false)}
        requests={friendRequests}
        onAccept={acceptFriendRequest}
        onDecline={declineFriendRequest}
      />

      <UserSearchModal
        open={findFriendsOpen}
        onClose={() => setFindFriendsOpen(false)}
        searchValue={userSearchValue}
        setSearchValue={setUserSearchValue}
        searchResults={userSearchResults}
        searching={searchingUsers}
        onSearch={searchUsers}
        onAddFriend={sendFriendRequest}
        currentUser={currentUser}
      />

      <CreateGroupChatModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        friends={friends}
        selectedFriends={selectedFriends}
        setSelectedFriends={setSelectedFriends}
        groupName={groupName}
        setGroupName={setGroupName}
        onCreateGroup={createGroupChat}
        creating={creatingGroup}
      />
    </div>
  );
}