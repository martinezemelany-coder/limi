import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Send } from "lucide-react";

function loadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSavedProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem("limi-profile"));
    return {
      name: profile?.name || "You",
      avatar: (profile?.name || "Y").charAt(0).toUpperCase(),
    };
  } catch {
    return {
      name: "You",
      avatar: "Y",
    };
  }
}

export default function HangoutChatConversation() {
  const navigate = useNavigate();
  const { id } = useParams();
  const numericId = Number(id);

  const [threads, setThreads] = useState(() =>
    loadJson("limi-hangout-chat-threads", [])
  );
  const [allMessages, setAllMessages] = useState(() =>
    loadJson("limi-hangout-chat-messages", {})
  );
  const [input, setInput] = useState("");
  const currentUser = getSavedProfile();

  const thread = useMemo(
    () => threads.find((item) => item.id === numericId),
    [threads, numericId]
  );

  const messages = allMessages[numericId] || [];

  useEffect(() => {
    setThreads(loadJson("limi-hangout-chat-threads", []));
    setAllMessages(loadJson("limi-hangout-chat-messages", {}));
  }, [numericId]);

  const sendMessage = () => {
    if (!input.trim() || !thread) return;

    const newMessage = {
      id: Date.now(),
      sender: "me",
      author: currentUser.name,
      avatar: currentUser.avatar,
      text: input.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedThreadMessages = [...messages, newMessage];
    const updatedMessages = {
      ...allMessages,
      [numericId]: updatedThreadMessages,
    };

    const updatedThreads = threads.map((item) =>
      item.id === numericId
        ? {
            ...item,
            lastMessage: `${currentUser.name}: ${newMessage.text}`,
            lastMessageAt: newMessage.createdAt,
          }
        : item
    );

    setAllMessages(updatedMessages);
    setThreads(updatedThreads);
    setInput("");

    saveJson("limi-hangout-chat-messages", updatedMessages);
    saveJson("limi-hangout-chat-threads", updatedThreads);
  };

  if (!thread) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fdf0f3] via-[#fbeaf0] to-[#f9e5ed] p-6">
        <div className="mx-auto max-w-md rounded-[30px] bg-white p-8 text-center shadow">
          <h2 className="text-2xl font-black text-[#d94b93]">Hangout chat not found</h2>
          <Link
            to="/hangouts"
            className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#ef9ca2] via-[#eb7aa0] to-[#d94b93] px-5 py-3 text-sm font-black text-white"
          >
            Back to hangouts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdf0f3] via-[#fbeaf0] to-[#f9e5ed]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pt-6 pb-6">
        <header className="rounded-[28px] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/hangouts")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fdf0f4] text-[#d95a97]"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-r from-[#ef9ca2] via-[#eb7aa0] to-[#d94b93] text-2xl text-white">
              {thread.image}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-black text-[#1f1720]">
                {thread.title}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm font-medium text-[#8e667c]">
                <MapPin size={14} />
                <span className="truncate">{thread.location}</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-[#b06d89]">
                {thread.memberCount} people in chat
              </p>
            </div>
          </div>
        </header>

        <main className="mt-4 flex-1 rounded-[30px] bg-white p-4 shadow-sm">
          <div className="flex h-[58vh] flex-col gap-3 overflow-y-auto pr-1">
            {messages.map((message) => {
              if (message.sender === "system") {
                return (
                  <div
                    key={message.id}
                    className="mx-auto rounded-full bg-[#fdf1f5] px-4 py-2 text-center text-xs font-black text-[#b46a87]"
                  >
                    {message.text}
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className={`max-w-[82%] rounded-[24px] px-4 py-3 text-sm leading-6 ${
                    message.sender === "me"
                      ? "ml-auto bg-gradient-to-r from-[#ef9ca2] via-[#eb7aa0] to-[#d94b93] text-white"
                      : "bg-[#fdf1f5] text-[#4b3946]"
                  }`}
                >
                  <p className="mb-1 text-xs font-black opacity-80">
                    {message.author || "Member"}
                  </p>
                  <p>{message.text}</p>
                </div>
              );
            })}
          </div>
        </main>

        <div className="mt-4 flex items-center gap-3 rounded-[24px] bg-white p-3 shadow-sm">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            placeholder="Message the group..."
            className="flex-1 bg-transparent px-2 outline-none"
          />
          <button
            onClick={sendMessage}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#ef9ca2] via-[#eb7aa0] to-[#d94b93] text-white"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}