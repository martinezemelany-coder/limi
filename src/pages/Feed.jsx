import {
  getFriendlyFirebaseErrorMessage,
} from "../lib/firebaseError";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom"; 

import {
  useNavigate,
} from "react-router-dom";

import {
  Bookmark,
  Camera,
  Clock3,
  Flag,
  Heart,
  HelpCircle,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import {
  auth,
  db,
  storage,
} from "../lib/firebase";

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
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

/* -------------------------------------------------------
   FEED GROUPS
------------------------------------------------------- */

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
    "Other",
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
    "Other",
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
    "Other",
  ],

  Other: [
    "Other",
  ],
};

/* -------------------------------------------------------
   POST TYPES
------------------------------------------------------- */

const postTypes = {
  general: {
    label: "Share",
    shortLabel: "Share",
    fullLabel: "General",
    emoji: "✨",
    icon: Sparkles,

    gradient:
      "from-[#f45c9b] via-[#ed72aa] to-[#fa899c]",

    softBackground:
      "bg-[#fff2f7]",

    border:
      "border-[#f3c6da]",

    badgeBackground:
      "bg-[#ffe4ef]",

    badgeText:
      "text-[#d94b93]",

    buttonText:
      "Share Post",

    placeholder:
      "Share a thought, update, photo, story, or something cute...",
  },

  question: {
    label: "Ask",
    shortLabel: "Ask",
    fullLabel: "Question",
    emoji: "❓",
    icon: HelpCircle,

    gradient:
      "from-[#68c9df] via-[#74cfdd] to-[#8ad8d7]",

    softBackground:
      "bg-[#f0fbfd]",

    border:
      "border-[#caebf0]",

    badgeBackground:
      "bg-[#e2f8fb]",

    badgeText:
      "text-[#368fa6]",

    buttonText:
      "Ask Question",

    placeholder:
      "Ask for advice, opinions, recommendations, beauty help, school help, or anything else...",
  },

  hangout: {
    label: "Make Plans",
    shortLabel: "Plans",
    fullLabel: "Hangout",
    emoji: "📍",
    icon: MapPin,

    gradient:
      "from-[#f8aa7f] via-[#fa9691] to-[#ef79a5]",

    softBackground:
      "bg-[#fff3f1]",

    border:
      "border-[#f4d0ca]",

    badgeBackground:
      "bg-[#ffe8e3]",

    badgeText:
      "text-[#d96867]",

    buttonText:
      "Make Plans",

    placeholder:
      "Ask who wants to get coffee, study, shop, work out, go out, or make plans...",
  },
};

const createOptions = [
  {
    type: "general",
    label: "Share",
    icon: Sparkles,
  },
  {
    type: "question",
    label: "Ask",
    icon: HelpCircle,
  },
  {
    type: "hangout",
    label: "Plans",
    icon: MapPin,
  },
];

const primaryFeedFilters = [
  {
    label: "All",
    type: "all",
  },
  {
    label: "Share",
    type: "general",
  },
  {
    label: "Ask",
    type: "question",
  },
  {
    label: "Plans",
    type: "hangout",
  },
];

/* -------------------------------------------------------
   GENERAL HELPERS
------------------------------------------------------- */

function getInitials(
  name = "L"
) {
  return String(name)
    .trim()
    .split(/\s+/)
    .map((word) =>
      word.charAt(0)
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getProfileName(
  data = {},
  user = null
) {
  return (
    data.name ||
    data.displayName ||
    data.fullName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Limi User"
  );
}

function getProfilePhoto(
  data = {},
  user = null
) {
  return (
    data.profileImage ||
    data.profilePhotoURL ||
    data.profilePhoto ||
    data.avatarURL ||
    data.imageURL ||
    data.photoURL ||
    user?.photoURL ||
    ""
  );
}

function formatTime(
  value
) {
  if (!value) {
    return "Just now";
  }

  try {
    const date =
      value?.toDate
        ? value.toDate()
        : new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Just now";
    }

    const difference =
      Date.now() -
      date.getTime();

    const minute =
      60 * 1000;

    const hour =
      60 * minute;

    const day =
      24 * hour;

    if (difference < minute) {
      return "Just now";
    }

    if (difference < hour) {
      return `${Math.floor(
        difference / minute
      )}m`;
    }

    if (difference < day) {
      return `${Math.floor(
        difference / hour
      )}h`;
    }

    if (
      difference <
      day * 7
    ) {
      return `${Math.floor(
        difference / day
      )}d`;
    }

    return date.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    );
  } catch {
    return "Just now";
  }
}

function getTimeLeft(
  expiresAt
) {
  if (!expiresAt) {
    return "";
  }

  try {
    const expirationDate =
      expiresAt?.toDate
        ? expiresAt.toDate()
        : new Date(expiresAt);

    const difference =
      expirationDate.getTime() -
      Date.now();

    if (difference <= 0) {
      return "Expired";
    }

    const totalMinutes =
      Math.floor(
        difference /
          (60 * 1000)
      );

    const hours =
      Math.floor(
        totalMinutes / 60
      );

    const minutes =
      totalMinutes % 60;

    if (hours >= 24) {
      const days =
        Math.floor(
          hours / 24
        );

      return `${days} ${
        days === 1
          ? "day"
          : "days"
      } left`;
    }

    if (hours > 0) {
      return `${hours}h ${
        minutes > 0
          ? `${minutes}m`
          : ""
      } left`;
    }

    return `${Math.max(
      minutes,
      1
    )}m left`;
  } catch {
    return "";
  }
}

function isPostVisible(
  post
) {
  if (
    post.postType !==
    "hangout"
  ) {
    return true;
  }

  if (!post.expiresAt) {
    return true;
  }

  try {
    const expirationDate =
      post.expiresAt?.toDate
        ? post.expiresAt.toDate()
        : new Date(
            post.expiresAt
          );

    return (
      expirationDate.getTime() >
      Date.now()
    );
  } catch {
    return true;
  }
}

function getStoragePathFromURL(
  downloadURL = ""
) {
  if (!downloadURL) {
    return "";
  }

  try {
    const decodedURL =
      decodeURIComponent(
        downloadURL
      );

    const match =
      decodedURL.match(
        /\/o\/(.+?)\?/
      );

    return match?.[1] || "";
  } catch {
    return "";
  }
}

/* -------------------------------------------------------
   CURRENT USER PROFILE
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
    email: user.email || "",
    avatar:
      getInitials(
        fallbackName
      ),
    photoURL:
      user.photoURL || "",
    city: "",
  };

  try {
    const profileSnapshot =
      await getDoc(
        doc(
          db,
          "users",
          user.uid
        )
      );

    if (
      !profileSnapshot.exists()
    ) {
      return fallback;
    }

    const profile =
      profileSnapshot.data();

    const name =
      getProfileName(
        profile,
        user
      );

    return {
      ...fallback,

      uid: user.uid,
      name,

      email:
        profile.email ||
        user.email ||
        "",

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
    };
  } catch (error) {
    console.error(
      "Could not load feed profile:",
      error
    );

    return fallback;
  }
}

/* -------------------------------------------------------
   IMAGE UPLOAD HELPERS
------------------------------------------------------- */

function validateImageFile(
  file,
  maximumMegabytes = 10
) {
  if (!file) {
    return;
  }

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "Please choose an image file."
    );
  }

  const maximumSize =
    maximumMegabytes *
    1024 *
    1024;

  if (
    file.size >
    maximumSize
  ) {
    throw new Error(
      `Please choose an image smaller than ${maximumMegabytes} MB.`
    );
  }
}

async function uploadPostImage({
  file,
  uid,
}) {
  validateImageFile(
    file,
    10
  );

  const safeFileName =
    file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    );

  const storagePath =
    `feed/${uid}/${Date.now()}-${safeFileName}`;

  const imageReference =
    ref(
      storage,
      storagePath
    );

  await uploadBytes(
    imageReference,
    file,
    {
      contentType:
        file.type,
    }
  );

  const imageURL =
    await getDownloadURL(
      imageReference
    );

  return {
    imageURL,
    storagePath,
  };
}

async function uploadCommentImage({
  file,
  postId,
  uid,
}) {
  validateImageFile(
    file,
    8
  );

  const safeFileName =
    file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    );

  const storagePath =
    `feedCommentImages/${postId}/${uid}/${Date.now()}-${safeFileName}`;

  const imageReference =
    ref(
      storage,
      storagePath
    );

  await uploadBytes(
    imageReference,
    file,
    {
      contentType:
        file.type,
    }
  );

  const imageURL =
    await getDownloadURL(
      imageReference
    );

  return {
    imageURL,
    storagePath,
  };
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
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleEscape = (
      event
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open, onClose]);

  if (
    !open ||
    typeof document ===
      "undefined"
  ) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#2c1621]/45 px-3 pt-8 backdrop-blur-[3px] sm:items-center sm:p-4">
      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      {/* MODAL PANEL */}

      <div
        className="relative z-10 flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[34px] border border-white/80 bg-[#fffafd]/95 shadow-[0_-25px_90px_rgba(90,35,65,0.30)] backdrop-blur-2xl sm:max-h-[90vh] sm:rounded-[34px]"
        style={{
          animation:
            "limiModalEnter 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* MOBILE HANDLE */}

        <div className="flex shrink-0 justify-center pb-1 pt-3 sm:hidden">
          <div className="h-1.5 w-11 rounded-full bg-[#decbd4]" />
        </div>

        {/* HEADER */}

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#f2e0e8] bg-white/80 px-5 py-4 backdrop-blur-xl">
          <h2
            className="text-3xl leading-none tracking-[-0.05em] text-[#e85fa3]"
            style={{
              fontWeight: 1000,
            }}
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white bg-[#ffe7f0] text-[#d94b93] shadow-sm transition duration-200 active:scale-95"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(36px,env(safe-area-inset-bottom))] pt-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* -------------------------------------------------------
   PROFILE AVATAR
------------------------------------------------------- */

function ProfileAvatar({
  photoURL,
  name,
  size = "medium",
}) {
  const sizeClasses =
    size === "small"
      ? "h-10 w-10 text-xs"
      : size === "large"
        ? "h-[58px] w-[58px] text-lg"
        : "h-12 w-12 text-sm";

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name || "Profile"}
        className={`${sizeClasses} shrink-0 rounded-full border-2 border-white/80 object-cover shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} flex shrink-0 items-center justify-center rounded-full border-2 border-white/70 bg-gradient-to-br from-[#f5a2bc] via-[#ef87ad] to-[#d94b93] font-black text-white shadow-sm`}
    >
      {getInitials(
        name || "L"
      )}
    </div>
  );
}

/* -------------------------------------------------------
   IMAGE PREVIEW MODAL
------------------------------------------------------- */

function ImagePreviewModal({
  imageURL,
  onClose,
}) {
  if (!imageURL) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[240] flex items-center justify-center bg-[#140a10]/90 p-4 backdrop-blur-md">
      <button
        type="button"
        aria-label="Close image"
        onClick={onClose}
        className="absolute inset-0"
      />

      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white shadow-lg backdrop-blur-xl transition active:scale-95"
      >
        <X size={22} />
      </button>

      <img
        src={imageURL}
        alt="Preview"
        className="relative z-10 max-h-[86vh] max-w-full rounded-[30px] object-contain shadow-[0_30px_90px_rgba(0,0,0,0.42)]"
        style={{
          animation:
            "limiImageEnter 300ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------
   PREMIUM CREATE CONTROL
------------------------------------------------------- */

function PremiumCreateControl({
  activeType,
  onSelect,
}) {
  const selectedIndex =
    Math.max(
      createOptions.findIndex(
        (option) =>
          option.type ===
          activeType
      ),
      0
    );

  const activeDetails =
    postTypes[activeType] ||
    postTypes.general;

  return (
    <section className="relative">
      <div className="relative overflow-hidden rounded-[30px] border border-white/90 bg-white/75 p-2 shadow-[0_16px_45px_rgba(210,103,150,0.16)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/90 via-white/30 to-[#ffeaf3]/50" />

        <div
          className={`pointer-events-none absolute bottom-2 left-2 top-2 rounded-[23px] bg-gradient-to-br ${activeDetails.gradient} shadow-[0_12px_28px_rgba(218,83,145,0.25)]`}
          style={{
            width:
              "calc((100% - 16px) / 3)",

            transform: `translateX(${selectedIndex * 100}%)`,

            transition:
              "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        <div className="relative z-10 grid grid-cols-3">
          {createOptions.map(
            ({
              type,
              label,
              icon: Icon,
            }) => {
              const active =
                activeType === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    onSelect(type)
                  }
                  className={`flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-[23px] px-2 transition duration-300 active:scale-[0.97] ${
                    active
                      ? "text-white"
                      : "text-[#765f6b]"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition duration-300 ${
                      active
                        ? "bg-white/20"
                        : "bg-[#fff1f6]"
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={2.3}
                    />
                  </span>

                  <span className="text-[12px] font-black">
                    {label}
                  </span>
                </button>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   PREMIUM FEED FILTER
------------------------------------------------------- */

function PremiumFeedFilter({
  activeFilter,
  onChange,
}) {
  const activePrimaryIndex =
    primaryFeedFilters.findIndex(
      (filter) =>
        filter.type ===
        activeFilter
    );

  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-full border border-[#f0dce5] bg-white/80 p-1.5 shadow-[0_8px_24px_rgba(201,120,151,0.1)] backdrop-blur-xl">
        {activePrimaryIndex >=
          0 && (
          <div
            className="pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 rounded-full bg-gradient-to-r from-[#f49aba] via-[#ee78aa] to-[#f7859b] shadow-[0_7px_18px_rgba(218,83,145,0.2)]"
            style={{
              width:
                "calc((100% - 12px) / 4)",

              transform: `translateX(${activePrimaryIndex * 100}%)`,

              transition:
                "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        )}

        <div className="relative z-10 grid grid-cols-4">
          {primaryFeedFilters.map(
            (filter) => {
              const active =
                activeFilter ===
                filter.type;

              return (
                <button
                  key={filter.type}
                  type="button"
                  onClick={() =>
                    onChange(
                      filter.type
                    )
                  }
                  className={`rounded-full px-1 py-2.5 text-[12px] font-black transition duration-300 ${
                    active
                      ? "text-white"
                      : "text-[#735e69]"
                  }`}
                >
                  {filter.label}
                </button>
              );
            }
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onChange("saved")
        }
        aria-label="Saved posts"
        className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border shadow-[0_8px_24px_rgba(201,120,151,0.1)] backdrop-blur-xl transition duration-300 active:scale-95 ${
          activeFilter === "saved"
            ? "border-transparent bg-gradient-to-br from-[#f49aba] to-[#e768a4] text-white"
            : "border-[#f0dce5] bg-white/80 text-[#826b77]"
        }`}
      >
        <Bookmark
          size={18}
          fill={
            activeFilter === "saved"
              ? "currentColor"
              : "none"
          }
        />
      </button>

      <button
        type="button"
        onClick={() =>
          onChange("mine")
        }
        className={`flex h-[46px] shrink-0 items-center justify-center rounded-full border px-3.5 text-[11px] font-black shadow-[0_8px_24px_rgba(201,120,151,0.1)] backdrop-blur-xl transition duration-300 active:scale-95 ${
          activeFilter === "mine"
            ? "border-transparent bg-gradient-to-br from-[#f49aba] to-[#e768a4] text-white"
            : "border-[#f0dce5] bg-white/80 text-[#826b77]"
        }`}
      >
        Mine
      </button>
    </div>
  );
}

/* -------------------------------------------------------
   CREATE POST MODAL
------------------------------------------------------- */

function CreatePostModal({
  open,
  onClose,
  currentUser,
  defaultType = "general",
}) {
  const [
    postType,
    setPostType,
  ] = useState(
    postTypes[defaultType]
      ? defaultType
      : "general"
  );

  const [
    text,
    setText,
  ] = useState("");

  const [
    imageFile,
    setImageFile,
  ] = useState(null);

  const [
    previewURL,
    setPreviewURL,
  ] = useState("");

  const [
    groupType,
    setGroupType,
  ] = useState("Hobbies");

  const [
    group,
    setGroup,
  ] = useState(
    feedGroups.Hobbies[0]
  );

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const selectedType =
    postTypes[postType] ||
    postTypes.general;

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextType =
      postTypes[defaultType]
        ? defaultType
        : "general";

    setPostType(nextType);
    setText("");
    setImageFile(null);
    setPreviewURL("");
    setGroupType("Hobbies");

    setGroup(
      feedGroups.Hobbies[0]
    );

    setUploading(false);
  }, [
    open,
    defaultType,
  ]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewURL("");
      return undefined;
    }

    const localPreview =
      URL.createObjectURL(
        imageFile
      );

    setPreviewURL(
      localPreview
    );

    return () => {
      URL.revokeObjectURL(
        localPreview
      );
    };
  }, [imageFile]);

  const selectImage = (
    file
  ) => {
    if (!file) {
      return;
    }

    try {
      validateImageFile(
        file,
        10
      );

      setImageFile(file);
    } catch (error) {
      window.alert(
        error.message
      );
    }
  };

  const changeGroupType = (
    nextGroupType
  ) => {
    setGroupType(
      nextGroupType
    );

    setGroup(
      feedGroups[
        nextGroupType
      ][0]
    );
  };

  const submitPost =
    async (event) => {
      event.preventDefault();

      if (!currentUser?.uid) {
        window.alert(
          "Please sign in again."
        );

        return;
      }

      if (
        !text.trim() &&
        !imageFile
      ) {
        window.alert(
          "Write something or add a photo first 💕"
        );

        return;
      }

      try {
        setUploading(true);

        let imageURL = "";
        let imageStoragePath = "";

        if (imageFile) {
          const uploadResult =
            await uploadPostImage({
              file: imageFile,
              uid:
                currentUser.uid,
            });

          imageURL =
            uploadResult.imageURL;

          imageStoragePath =
            uploadResult.storagePath;
        }

        const expiresAt =
          postType === "hangout"
            ? Timestamp.fromDate(
                new Date(
                  Date.now() +
                    48 *
                      60 *
                      60 *
                      1000
                )
              )
            : null;

        await addDoc(
          collection(
            db,
            "posts"
          ),
          {
            uid:
              currentUser.uid,

            username:
              currentUser.name,

            userEmail:
              currentUser.email ||
              "",

            avatar:
              currentUser.avatar ||
              getInitials(
                currentUser.name
              ),

            photoURL:
              currentUser.photoURL ||
              "",

            city:
              currentUser.city ||
              "",

            text:
              text.trim(),

            image:
              imageURL,

            imageURL,

            imageStoragePath,

            postType,

            groupType,
            group,

            expiresAt,

            likesBy: [],
            savedBy: [],
            comments: [],
            reports: [],

            visibility:
              "global",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

        onClose();
      } catch (error) {
        console.error(
          "Could not create feed post:",
          error
        );

        window.alert(
          getFriendlyFirebaseErrorMessage?.(
            error
          ) ||
            error.message ||
            "The post could not be created."
        );
      } finally {
        setUploading(false);
      }
    };

  return (
    <ModalShell
      open={open}
      onClose={() => {
        if (!uploading) {
          onClose();
        }
      }}
      title={
        postType === "question"
          ? "Ask Something"
          : postType === "hangout"
            ? "Make Plans"
            : "Share Something"
      }
    >
      <form
        onSubmit={submitPost}
        className="space-y-5"
      >
        <div className="relative overflow-hidden rounded-[27px] border border-[#f0dce5] bg-white/80 p-1.5 shadow-sm">
          <div
            className={`pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 rounded-[21px] bg-gradient-to-br ${selectedType.gradient} shadow-md`}
            style={{
              width:
                "calc((100% - 12px) / 3)",

              transform: `translateX(${
                Math.max(
                  createOptions.findIndex(
                    (option) =>
                      option.type ===
                      postType
                  ),
                  0
                ) * 100
              }%)`,

              transition:
                "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />

          <div className="relative z-10 grid grid-cols-3">
            {createOptions.map(
              ({
                type,
                label,
                icon: Icon,
              }) => {
                const active =
                  postType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setPostType(type)
                    }
                    className={`flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-[21px] px-1 transition duration-300 ${
                      active
                        ? "text-white"
                        : "text-[#80636f]"
                    }`}
                  >
                    <Icon
                      size={18}
                    />

                    <span className="text-[11px] font-black">
                      {label}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {postType ===
          "hangout" && (
          <div className="flex items-start gap-3 rounded-[22px] border border-[#f7d6cf] bg-[#fff1ed] p-4">
            <Clock3
              size={18}
              className="mt-0.5 shrink-0 text-[#dc726d]"
            />

            <p className="text-sm font-bold leading-6 text-[#a66564]">
              Plan posts disappear
              from the feed after 48
              hours so the feed stays
              current.
            </p>
          </div>
        )}

        <div
          className={`rounded-[28px] border ${selectedType.border} ${selectedType.softBackground} p-4 shadow-inner`}
        >
          <textarea
            rows={5}
            maxLength={1000}
            value={text}
            onChange={(event) =>
              setText(
                event.target.value
              )
            }
            placeholder={
              selectedType.placeholder
            }
            className="w-full resize-none bg-transparent text-[15px] font-semibold leading-7 text-[#5f4b56] outline-none placeholder:text-[#b58f9f]"
          />

          <p className="mt-2 text-right text-xs font-bold text-[#b08a9b]">
            {text.length}/1000
          </p>
        </div>

        {previewURL && (
          <div
            className="relative overflow-hidden rounded-[30px] border border-white bg-[#fff0f6] shadow-[0_18px_45px_rgba(124,66,92,0.16)]"
            style={{
              animation:
                "limiImageEnter 260ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <img
              src={previewURL}
              alt="Post preview"
              className="max-h-[420px] w-full object-cover"
            />

            <button
              type="button"
              onClick={() =>
                setImageFile(null)
              }
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur-md transition active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[22px] border border-[#f1d8e3] bg-white px-4 py-4 text-sm font-black text-[#d94b93] shadow-sm transition duration-200 hover:bg-[#fff8fb] active:scale-[0.99]">
          <Camera size={18} />

          {imageFile
            ? "Change Photo"
            : "Add Photo"}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) =>
              selectImage(
                event.target
                  .files?.[0]
              )
            }
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[#9a6b80]">
              Category
            </label>

            <select
              value={groupType}
              onChange={(event) =>
                changeGroupType(
                  event.target
                    .value
                )
              }
              className="w-full rounded-[20px] border border-[#f1d8e3] bg-white px-4 py-3 text-sm font-bold text-[#5f4b56] outline-none"
            >
              {Object.keys(
                feedGroups
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
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[#9a6b80]">
              Topic
            </label>

            <select
              value={group}
              onChange={(event) =>
                setGroup(
                  event.target
                    .value
                )
              }
              className="w-full rounded-[20px] border border-[#f1d8e3] bg-white px-4 py-3 text-sm font-bold text-[#5f4b56] outline-none"
            >
              {feedGroups[
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
        </div>

        <button
          type="submit"
          disabled={uploading}
          className={`flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r ${selectedType.gradient} py-4 text-lg font-black text-white shadow-[0_14px_30px_rgba(231,91,150,0.24)] transition duration-200 active:scale-[0.985] disabled:opacity-60`}
        >
          {uploading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />

              Posting...
            </>
          ) : (
            <>
              <Plus size={19} />

              {
                selectedType.buttonText
              }
            </>
          )}
        </button>
      </form>
    </ModalShell>
  );
}

/* -------------------------------------------------------
   COMMENT IMAGE PREVIEW
------------------------------------------------------- */

function CommentImage({
  imageURL,
  onOpen,
}) {
  if (!imageURL) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() =>
        onOpen(imageURL)
      }
      className="mt-3 block overflow-hidden rounded-[20px] border border-[#f5e2ea] bg-[#f7edf2] shadow-sm transition duration-300 active:scale-[0.98]"
    >
      <img
        src={imageURL}
        alt="Comment attachment"
        loading="lazy"
        className="max-h-[210px] w-auto max-w-[190px] object-cover transition duration-500 hover:scale-[1.02]"
      />
    </button>
  );
}

/* -------------------------------------------------------
   COMMENT ROW
------------------------------------------------------- */

function CommentRow({
  comment,
  currentUser,
  postOwnerUid,
  onOpenProfile,
  onOpenImage,
  onDelete,
  onReport,
}) {
  const canDelete =
    comment.uid ===
      currentUser?.uid ||
    postOwnerUid ===
      currentUser?.uid;

  const canReport =
    comment.uid &&
    comment.uid !==
      currentUser?.uid;

  return (
    <div className="rounded-[26px] border border-white/90 bg-white/90 p-4 shadow-[0_10px_26px_rgba(192,105,144,0.08)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() =>
            onOpenProfile(
              comment.uid
            )
          }
          className="shrink-0 transition active:scale-95"
        >
          <ProfileAvatar
            photoURL={
              comment.photoURL
            }
            name={
              comment.user ||
              comment.username
            }
            size="small"
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                onOpenProfile(
                  comment.uid
                )
              }
              className="min-w-0 text-left"
            >
              <p className="truncate text-sm font-black text-[#2b1d28]">
                {comment.user ||
                  comment.username ||
                  "Limi User"}
              </p>

              <p className="mt-1 text-[10px] font-bold text-[#b08a9b]">
                {formatTime(
                  comment.createdAt
                )}
              </p>
            </button>

            {(canDelete ||
              canReport) && (
              <div className="flex shrink-0 items-center gap-1">
                {canReport && (
                  <button
                    type="button"
                    onClick={() =>
                      onReport(
                        comment
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff5f8] text-[#c884a1] transition duration-200 active:scale-90"
                    aria-label="Report comment"
                  >
                    <Flag size={15} />
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() =>
                      onDelete(
                        comment
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 transition duration-200 active:scale-90"
                    aria-label="Delete comment"
                  >
                    <Trash2
                      size={15}
                    />
                  </button>
                )}
              </div>
            )}
          </div>

          {comment.text && (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-[#6f5964]">
              {comment.text}
            </p>
          )}

          <CommentImage
            imageURL={
              comment.imageURL ||
              comment.image ||
              ""
            }
            onOpen={
              onOpenImage
            }
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   COMMENTS MODAL
------------------------------------------------------- */

function CommentsModal({
  open,
  onClose,
  post,
  currentUser,
}) {
  const navigate =
    useNavigate();

  const [
    commentText,
    setCommentText,
  ] = useState("");

  const [
    imageFile,
    setImageFile,
  ] = useState(null);

  const [
    previewURL,
    setPreviewURL,
  ] = useState("");

  const [
    livePost,
    setLivePost,
  ] = useState(post);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    previewImage,
    setPreviewImage,
  ] = useState("");

  const imageInputRef =
    useRef(null);

  useEffect(() => {
    if (
      !open ||
      !post?.id
    ) {
      return undefined;
    }

    setCommentText("");
    setImageFile(null);
    setPreviewURL("");
    setLivePost(post);
    setSubmitting(false);

    const unsubscribe =
      onSnapshot(
        doc(
          db,
          "posts",
          post.id
        ),
        (snapshot) => {
          if (
            snapshot.exists()
          ) {
            setLivePost({
              id:
                snapshot.id,
              ...snapshot.data(),
            });
          } else {
            onClose();
          }
        },
        (error) => {
          console.error(
            "Could not load comments:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, [
    open,
    post?.id,
    onClose,
  ]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewURL("");
      return undefined;
    }

    const localURL =
      URL.createObjectURL(
        imageFile
      );

    setPreviewURL(localURL);

    return () => {
      URL.revokeObjectURL(
        localURL
      );
    };
  }, [imageFile]);

  if (
    !open ||
    !livePost
  ) {
    return null;
  }

  const comments =
    Array.isArray(
      livePost.comments
    )
      ? livePost.comments
      : [];

  const selectCommentImage = (
    file
  ) => {
    if (!file) {
      return;
    }

    try {
      validateImageFile(
        file,
        8
      );

      setImageFile(file);
    } catch (error) {
      window.alert(
        error.message
      );
    }
  };

  const openProfile = (
    uid
  ) => {
    if (!uid) {
      return;
    }

    if (
      uid ===
      currentUser?.uid
    ) {
      navigate("/profile");
      return;
    }

    navigate(
      `/profile/${uid}`
    );
  };

  const submitComment =
    async (event) => {
      event.preventDefault();

      const cleanText =
        commentText.trim();

      if (
        submitting ||
        !currentUser?.uid ||
        (!cleanText &&
          !imageFile)
      ) {
        return;
      }

      try {
        setSubmitting(true);

        let imageURL = "";
        let imageStoragePath = "";

        if (imageFile) {
          const uploadResult =
            await uploadCommentImage({
              file:
                imageFile,

              postId:
                livePost.id,

              uid:
                currentUser.uid,
            });

          imageURL =
            uploadResult.imageURL;

          imageStoragePath =
            uploadResult.storagePath;
        }

        const comment = {
          id: `${currentUser.uid}-${Date.now()}`,

          uid:
            currentUser.uid,

          user:
            currentUser.name ||
            "Limi User",

          username:
            currentUser.name ||
            "Limi User",

          avatar:
            currentUser.avatar ||
            getInitials(
              currentUser.name
            ),

          photoURL:
            currentUser.photoURL ||
            "",

          text:
            cleanText,

          imageURL,
          image:
            imageURL,

          imageStoragePath,

          createdAt:
            new Date().toISOString(),
        };

        await updateDoc(
          doc(
            db,
            "posts",
            livePost.id
          ),
          {
            comments:
              arrayUnion(
                comment
              ),

            updatedAt:
              serverTimestamp(),
          }
        );

        setCommentText("");
        setImageFile(null);

        if (
          imageInputRef.current
        ) {
          imageInputRef.current.value =
            "";
        }
      } catch (error) {
        console.error(
          "Could not add comment:",
          error
        );

        window.alert(
          getFriendlyFirebaseErrorMessage?.(
            error
          ) ||
            error.message ||
            "The comment could not be posted."
        );
      } finally {
        setSubmitting(false);
      }
    };

  const deleteComment =
    async (comment) => {
      const canDelete =
        comment.uid ===
          currentUser?.uid ||
        livePost.uid ===
          currentUser?.uid;

      if (!canDelete) {
        return;
      }

      const confirmed =
        window.confirm(
          "Delete this comment?"
        );

      if (!confirmed) {
        return;
      }

      try {
        await updateDoc(
          doc(
            db,
            "posts",
            livePost.id
          ),
          {
            comments:
              arrayRemove(
                comment
              ),

            updatedAt:
              serverTimestamp(),
          }
        );

        const storagePath =
          comment.imageStoragePath ||
          getStoragePathFromURL(
            comment.imageURL ||
              comment.image
          );

        if (storagePath) {
          try {
            await deleteObject(
              ref(
                storage,
                storagePath
              )
            );
          } catch (error) {
            console.warn(
              "Comment was removed but its image could not be deleted from Storage:",
              error
            );
          }
        }
      } catch (error) {
        console.error(
          "Could not delete comment:",
          error
        );

        window.alert(
          getFriendlyFirebaseErrorMessage?.(
            error
          ) ||
            error.message ||
            "The comment could not be deleted."
        );
      }
    };

  const reportComment =
    async (comment) => {
      if (
        !currentUser?.uid ||
        !comment?.uid
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Report this comment for review?"
        );

      if (!confirmed) {
        return;
      }

      try {
        await addDoc(
          collection(
            db,
            "reports"
          ),
          {
            type:
              "feed_comment",

            postId:
              livePost.id,

            postOwnerId:
              livePost.uid ||
              "",

            commentId:
              comment.id ||
              "",

            commentOwnerId:
              comment.uid ||
              "",

            commentText:
              comment.text ||
              "",

            commentImageURL:
              comment.imageURL ||
              comment.image ||
              "",

            reporterId:
              currentUser.uid,

            status:
              "pending",

            createdAt:
              serverTimestamp(),
          }
        );

        window.alert(
          "Comment reported. Thank you for helping keep Limi safe."
        );
      } catch (error) {
        console.error(
          "Could not report comment:",
          error
        );

        window.alert(
          getFriendlyFirebaseErrorMessage?.(
            error
          ) ||
            error.message ||
            "The comment could not be reported."
        );
      }
    };

  return (
    <>
      <ModalShell
        open={open}
        onClose={() => {
          if (!submitting) {
            onClose();
          }
        }}
        title="Comments"
      >
        <div className="space-y-4">
          <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
            {comments.length ? (
              comments.map(
                (comment) => (
                  <CommentRow
                    key={
                      comment.id ||
                      `${comment.uid}-${comment.createdAt}`
                    }
                    comment={
                      comment
                    }
                    currentUser={
                      currentUser
                    }
                    postOwnerUid={
                      livePost.uid
                    }
                    onOpenProfile={
                      openProfile
                    }
                    onOpenImage={
                      setPreviewImage
                    }
                    onDelete={
                      deleteComment
                    }
                    onReport={
                      reportComment
                    }
                  />
                )
              )
            ) : (
              <div className="rounded-[30px] border border-white/90 bg-white/90 p-8 text-center shadow-[0_12px_30px_rgba(192,105,144,0.08)] backdrop-blur-xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0f6] text-[#f089b0]">
                  <MessageCircle
                    size={27}
                  />
                </div>

                <h3 className="mt-4 text-xl font-black text-[#e85da2]">
                  No comments yet
                </h3>

                <p className="mt-2 text-sm font-semibold leading-6 text-[#80636f]">
                  Be the first person
                  to reply or share a
                  helpful photo 💕
                </p>
              </div>
            )}
          </div>

          {previewURL && (
            <div
              className="relative w-fit overflow-hidden rounded-[20px] border border-white bg-[#fff0f6] shadow-sm"
              style={{
                animation:
                  "limiImageEnter 240ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <img
                src={previewURL}
                alt="Comment preview"
                className="max-h-[160px] max-w-[180px] object-cover"
              />

              <button
                type="button"
                onClick={() => {
                  setImageFile(null);

                  if (
                    imageInputRef.current
                  ) {
                    imageInputRef.current.value =
                      "";
                  }
                }}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition active:scale-90"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <form
            onSubmit={
              submitComment
            }
            className="rounded-[28px] border border-[#f2dce6] bg-white/95 p-3 shadow-[0_10px_26px_rgba(192,105,144,0.08)] backdrop-blur-xl"
          >
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() =>
                  imageInputRef.current?.click()
                }
                disabled={
                  submitting
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0f6] text-[#d94b93] transition duration-200 active:scale-90 disabled:opacity-50"
                aria-label="Add image to comment"
              >
                <ImageIcon
                  size={19}
                />
              </button>

              <input
                ref={
                  imageInputRef
                }
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(
                  event
                ) =>
                  selectCommentImage(
                    event.target
                      .files?.[0]
                  )
                }
              />

              <div className="min-w-0 flex-1 rounded-[21px] bg-[#fff7fa] px-4 py-2">
                <textarea
                  rows={1}
                  maxLength={300}
                  value={
                    commentText
                  }
                  disabled={
                    submitting
                  }
                  onChange={(
                    event
                  ) =>
                    setCommentText(
                      event.target
                        .value
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                        "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();

                      if (
                        commentText.trim() ||
                        imageFile
                      ) {
                        submitComment(
                          event
                        );
                      }
                    }
                  }}
                  placeholder="Add a comment..."
                  className="max-h-24 min-h-[30px] w-full resize-none bg-transparent py-1 text-sm font-semibold leading-6 text-[#5f4b56] outline-none placeholder:text-[#bd91a4]"
                />
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  (!commentText.trim() &&
                    !imageFile)
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] text-white shadow-[0_8px_20px_rgba(231,91,150,0.22)] transition duration-200 active:scale-90 disabled:opacity-40"
              >
                {submitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Send
                    size={17}
                  />
                )}
              </button>
            </div>
          </form>
        </div>
      </ModalShell>

      <ImagePreviewModal
        imageURL={
          previewImage
        }
        onClose={() =>
          setPreviewImage("")
        }
      />
    </>
  );
}

/* -------------------------------------------------------
   POST OPTIONS MODAL
------------------------------------------------------- */

function PostMenuModal({
  open,
  onClose,
  post,
  currentUser,
}) {
  const [
    processing,
    setProcessing,
  ] = useState(false);

  useEffect(() => {
    if (open) {
      setProcessing(false);
    }
  }, [open]);

  if (
    !open ||
    !post
  ) {
    return null;
  }

  const isOwner =
    post.uid ===
      currentUser?.uid ||
    (post.userEmail &&
      post.userEmail ===
        currentUser?.email);

  const deletePost =
    async () => {
      if (!isOwner) {
        return;
      }

      const confirmed =
        window.confirm(
          "Delete this post? This cannot be undone."
        );

      if (!confirmed) {
        return;
      }

      try {
        setProcessing(true);

        const postImagePath =
          post.imageStoragePath ||
          getStoragePathFromURL(
            post.imageURL ||
              post.image
          );

        if (postImagePath) {
          try {
            await deleteObject(
              ref(
                storage,
                postImagePath
              )
            );
          } catch (error) {
            console.warn(
              "Post will still be deleted, but its image could not be removed:",
              error
            );
          }
        }

        const comments =
          Array.isArray(
            post.comments
          )
            ? post.comments
            : [];

        await Promise.all(
          comments.map(
            async (
              comment
            ) => {
              const commentPath =
                comment.imageStoragePath ||
                getStoragePathFromURL(
                  comment.imageURL ||
                    comment.image
                );

              if (!commentPath) {
                return;
              }

              try {
                await deleteObject(
                  ref(
                    storage,
                    commentPath
                  )
                );
              } catch (error) {
                console.warn(
                  "A comment image could not be removed:",
                  error
                );
              }
            }
          )
        );

        await deleteDoc(
          doc(
            db,
            "posts",
            post.id
          )
        );

        onClose();
      } catch (error) {
        console.error(
          "Could not delete post:",
          error
        );

        window.alert(
          getFriendlyFirebaseErrorMessage?.(
            error
          ) ||
            error.message ||
            "The post could not be deleted."
        );
      } finally {
        setProcessing(false);
      }
    };

  const reportPost =
    async () => {
      if (
        !currentUser?.uid
      ) {
        return;
      }

      const alreadyReported =
        Array.isArray(
          post.reports
        ) &&
        post.reports.includes(
          currentUser.uid
        );

      if (
        alreadyReported
      ) {
        window.alert(
          "You already reported this post."
        );

        onClose();
        return;
      }

      const confirmed =
        window.confirm(
          "Report this post for review?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setProcessing(true);

        await updateDoc(
          doc(
            db,
            "posts",
            post.id
          ),
          {
            reports:
              arrayUnion(
                currentUser.uid
              ),

            updatedAt:
              serverTimestamp(),
          }
        );

        await addDoc(
          collection(
            db,
            "reports"
          ),
          {
            type:
              "feed_post",

            postId:
              post.id,

            postOwnerId:
              post.uid ||
              "",

            reporterId:
              currentUser.uid,

            status:
              "pending",

            createdAt:
              serverTimestamp(),
          }
        );

        window.alert(
          "Post reported. Thank you for helping keep Limi safe."
        );

        onClose();
      } catch (error) {
        console.error(
          "Could not report post:",
          error
        );

        window.alert(
          getFriendlyFirebaseErrorMessage?.(
            error
          ) ||
            error.message ||
            "The post could not be reported."
        );
      } finally {
        setProcessing(false);
      }
    };

  return (
    <ModalShell
      open={open}
      onClose={() => {
        if (!processing) {
          onClose();
        }
      }}
      title="Post Options"
    >
      <div className="space-y-3">
        {isOwner ? (
          <button
            type="button"
            onClick={deletePost}
            disabled={
              processing
            }
            className="flex w-full items-center gap-3 rounded-[24px] border border-red-100 bg-white p-4 text-left text-red-500 shadow-sm transition duration-200 active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
              <Trash2
                size={19}
              />
            </div>

            <div>
              <p className="font-black">
                Delete Post
              </p>

              <p className="mt-1 text-xs font-semibold text-red-400">
                Remove this post
                permanently
              </p>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={reportPost}
            disabled={
              processing
            }
            className="flex w-full items-center gap-3 rounded-[24px] border border-[#f4dce7] bg-white p-4 text-left text-[#c56d92] shadow-sm transition duration-200 active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff0f6]">
              <Flag size={19} />
            </div>

            <div>
              <p className="font-black">
                Report Post
              </p>

              <p className="mt-1 text-xs font-semibold text-[#a67f91]">
                Send this post for
                review
              </p>
            </div>
          </button>
        )}
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------
   POST ACTION BUTTON
------------------------------------------------------- */

function PostActionButton({
  icon,
  label,
  active = false,
  disabled = false,
  onClick,
  animationClass = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black transition duration-200 active:scale-90 disabled:cursor-not-allowed disabled:opacity-60 ${
        active
          ? "bg-[#ffe4ef] text-[#d94b93]"
          : "text-[#90717f] hover:bg-[#fff3f7]"
      }`}
    >
      <span
        className={`flex items-center justify-center ${animationClass}`}
      >
        {icon}
      </span>

      <span>{label}</span>
    </button>
  );
}

/* -------------------------------------------------------
   POST CARD
------------------------------------------------------- */

function PostCard({
  post,
  currentUser,
  onOpenComments,
  onOpenMenu,
  onOpenImage,
}) {
  const navigate =
    useNavigate();

  const typeKey =
    post.postType ||
    "general";

  const type =
    postTypes[typeKey] ||
    postTypes.general;

  const likes =
    Array.isArray(
      post.likesBy
    )
      ? post.likesBy
      : [];

  const saves =
    Array.isArray(
      post.savedBy
    )
      ? post.savedBy
      : [];

  const comments =
    Array.isArray(
      post.comments
    )
      ? post.comments
      : [];

  const liked =
    likes.includes(
      currentUser?.uid
    );

  const saved =
    saves.includes(
      currentUser?.uid
    );

  const [
    changingLike,
    setChangingLike,
  ] = useState(false);

  const [
    changingSave,
    setChangingSave,
  ] = useState(false);

  const [
    likeAnimating,
    setLikeAnimating,
  ] = useState(false);

  const [
    saveAnimating,
    setSaveAnimating,
  ] = useState(false);

  const openProfile = () => {
    if (!post.uid) {
      return;
    }

    if (
      post.uid ===
      currentUser?.uid
    ) {
      navigate("/profile");
      return;
    }

    navigate(
      `/profile/${post.uid}`
    );
  };

  const toggleLike =
    async () => {
      if (
        !currentUser?.uid ||
        changingLike
      ) {
        return;
      }

      try {
        setChangingLike(true);

        if (!liked) {
          setLikeAnimating(true);

          window.setTimeout(
            () => {
              setLikeAnimating(
                false
              );
            },
            330
          );
        }

        await updateDoc(
          doc(
            db,
            "posts",
            post.id
          ),
          {
            likesBy: liked
              ? arrayRemove(
                  currentUser.uid
                )
              : arrayUnion(
                  currentUser.uid
                ),

            updatedAt:
              serverTimestamp(),
          }
        );
      } catch (error) {
        console.error(
          "Could not update post like:",
          error
        );
      } finally {
        setChangingLike(false);
      }
    };

  const toggleSave =
    async () => {
      if (
        !currentUser?.uid ||
        changingSave
      ) {
        return;
      }

      try {
        setChangingSave(true);
        setSaveAnimating(true);

        window.setTimeout(
          () => {
            setSaveAnimating(
              false
            );
          },
          300
        );

        await updateDoc(
          doc(
            db,
            "posts",
            post.id
          ),
          {
            savedBy: saved
              ? arrayRemove(
                  currentUser.uid
                )
              : arrayUnion(
                  currentUser.uid
                ),

            updatedAt:
              serverTimestamp(),
          }
        );
      } catch (error) {
        console.error(
          "Could not save post:",
          error
        );
      } finally {
        setChangingSave(false);
      }
    };

  const sharePost =
    async () => {
      const shareText = `${
        post.username ||
        "A Limi user"
      } posted on Limi 💕\n${
        post.text || ""
      }`;

      try {
        if (
          navigator.share
        ) {
          await navigator.share({
            title:
              "Limi Post",
            text:
              shareText,
          });

          return;
        }

        if (
          navigator.clipboard
            ?.writeText
        ) {
          await navigator.clipboard.writeText(
            shareText
          );

          window.alert(
            "Post copied 💕"
          );

          return;
        }

        window.prompt(
          "Copy this post:",
          shareText
        );
      } catch (error) {
        if (
          error?.name !==
          "AbortError"
        ) {
          console.error(
            "Could not share post:",
            error
          );
        }
      }
    };

  return (
    <article
      className="group overflow-hidden rounded-[34px] border border-white/90 bg-white/95 shadow-[0_16px_44px_rgba(205,105,148,0.13)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(205,105,148,0.17)]"
      style={{
        animation:
          "limiFeedCardEnter 330ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* TYPE HEADER */}

      <div
        className={`relative overflow-hidden bg-gradient-to-r ${type.gradient} px-5 pb-5 pt-5 text-white`}
      >
        <div className="absolute -left-16 bottom-[-70px] h-48 w-48 rounded-full bg-white/10 blur-[1px]" />

        <div className="absolute right-[-55px] top-[-55px] h-44 w-44 rounded-full bg-white/10 blur-[1px]" />

        <div className="absolute left-[45%] top-[-80px] h-36 w-36 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={
              openProfile
            }
            className="flex min-w-0 items-center gap-3 text-left transition active:scale-[0.98]"
          >
            <ProfileAvatar
              photoURL={
                post.photoURL
              }
              name={
                post.username
              }
              size="large"
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-[18px] font-black tracking-[-0.02em]">
                  {post.username ||
                    "Limi User"}
                </h3>

                {post.uid ===
                  currentUser?.uid && (
                  <span className="rounded-full border border-white/20 bg-white/20 px-2 py-1 text-[9px] font-black uppercase tracking-wide backdrop-blur-md">
                    You
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-white/85">
                {post.group && (
                  <span className="max-w-[130px] truncate">
                    {post.group}
                  </span>
                )}

                {post.group && (
                  <span>•</span>
                )}

                <span>
                  {formatTime(
                    post.createdAt
                  )}
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              onOpenMenu(post)
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/10 text-white shadow-sm backdrop-blur-xl transition duration-200 hover:bg-black/15 active:scale-90"
            aria-label="Post options"
          >
            <MoreHorizontal
              size={20}
            />
          </button>
        </div>

        <div className="relative z-10 mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 bg-white/20 px-3 py-1.5 text-xs font-black shadow-sm backdrop-blur-md">
            {type.emoji}{" "}
            {type.fullLabel}
          </span>

          {post.groupType && (
            <span className="rounded-full border border-white/15 bg-black/10 px-3 py-1.5 text-xs font-black text-white/90 backdrop-blur-md">
              {post.groupType}
            </span>
          )}

          {typeKey ===
            "hangout" &&
            post.expiresAt && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/15 px-3 py-1.5 text-xs font-black backdrop-blur-md">
                <Clock3
                  size={13}
                />

                {getTimeLeft(
                  post.expiresAt
                )}
              </span>
            )}
        </div>
      </div>

      {/* POST CONTENT */}

      <div className="space-y-4 p-5">
        {post.text && (
          <p className="whitespace-pre-wrap break-words text-[16px] font-semibold leading-[1.75] text-[#604d57]">
            {post.text}
          </p>
        )}

        {(post.imageURL ||
          post.image) && (
          <button
            type="button"
            onClick={() =>
              onOpenImage(
                post.imageURL ||
                  post.image
              )
            }
            className="block w-full overflow-hidden rounded-[30px] border border-[#f8e8ef] bg-[#fff0f6] shadow-[0_10px_30px_rgba(179,103,135,0.11)]"
          >
            <img
              src={
                post.imageURL ||
                post.image
              }
              alt="Post attachment"
              loading="lazy"
              className="min-h-[260px] max-h-[560px] w-full object-cover transition duration-500 group-hover:scale-[1.012]"
            />
          </button>
        )}

        {post.city && (
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f7e1ea] bg-[#fff5f9] px-3 py-2 text-xs font-black text-[#9b6b81]">
            <MapPin
              size={14}
            />

            {post.city}
          </div>
        )}

        {/* ACTIONS */}

        <div className="flex items-center justify-between border-t border-[#f5e2ea] pt-4">
          <div className="flex min-w-0 items-center gap-1">
            <PostActionButton
              active={liked}
              disabled={
                changingLike
              }
              onClick={
                toggleLike
              }
              label={String(
                likes.length
              )}
              animationClass={
                likeAnimating
                  ? "animate-[limiHeartPop_320ms_cubic-bezier(0.22,1,0.36,1)]"
                  : ""
              }
              icon={
                <Heart
                  size={20}
                  fill={
                    liked
                      ? "currentColor"
                      : "none"
                  }
                />
              }
            />

            <PostActionButton
              onClick={() =>
                onOpenComments(
                  post
                )
              }
              label={String(
                comments.length
              )}
              icon={
                <MessageCircle
                  size={20}
                />
              }
            />

            <PostActionButton
              onClick={
                sharePost
              }
              label="Share"
              icon={
                <Share2
                  size={19}
                />
              }
            />
          </div>

          <button
            type="button"
            onClick={
              toggleSave
            }
            disabled={
              changingSave
            }
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition duration-200 active:scale-90 disabled:opacity-60 ${
              saved
                ? "bg-[#ffe4ef] text-[#d94b93] shadow-[0_8px_20px_rgba(217,75,147,0.13)]"
                : "bg-[#fff6fa] text-[#967480] hover:bg-[#ffedf4]"
            } ${
              saveAnimating
                ? "animate-[limiBookmarkPop_300ms_cubic-bezier(0.22,1,0.36,1)]"
                : ""
            }`}
            aria-label={
              saved
                ? "Unsave post"
                : "Save post"
            }
          >
            <Bookmark
              size={20}
              fill={
                saved
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------
   EMPTY FEED STATE
------------------------------------------------------- */

function EmptyFeedState({
  activeFilter,
  onCreate,
}) {
  const emptyType =
    activeFilter ===
    "question"
      ? "question"
      : activeFilter ===
          "hangout"
        ? "hangout"
        : "general";

  const emptyDetails =
    postTypes[emptyType];

  let heading =
    "Nothing here yet";

  let description =
    "Be the first person to share something in this section.";

  if (
    activeFilter ===
    "saved"
  ) {
    heading =
      "No saved posts yet";

    description =
      "Tap the bookmark on a post to save it here.";
  }

  if (
    activeFilter ===
    "mine"
  ) {
    heading =
      "You haven’t posted yet";

    description =
      "Share something, ask a question, or make plans with the community.";
  }

  return (
    <div
      className="relative overflow-hidden rounded-[36px] border border-white/90 bg-white/90 p-9 text-center shadow-[0_16px_44px_rgba(205,105,148,0.11)] backdrop-blur-xl"
      style={{
        animation:
          "limiFeedCardEnter 330ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#fff0f6]" />

      <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[#ffe8f0]" />

      <div className="relative z-10">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${emptyDetails.gradient} text-white shadow-[0_12px_28px_rgba(217,75,147,0.2)]`}
        >
          {activeFilter ===
          "saved" ? (
            <Bookmark
              size={27}
            />
          ) : (
            <Sparkles
              size={27}
            />
          )}
        </div>

        <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[#e85da2]">
          {heading}
        </h3>

        <p className="mx-auto mt-3 max-w-[270px] text-sm font-semibold leading-6 text-[#80636f]">
          {description}
        </p>

        {activeFilter !==
          "saved" && (
          <button
            type="button"
            onClick={() =>
              onCreate(
                emptyType
              )
            }
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r ${emptyDetails.gradient} py-4 font-black text-white shadow-[0_12px_28px_rgba(231,91,150,0.2)] transition duration-200 active:scale-[0.985]`}
          >
            <Plus size={18} />

            Create a Post
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   MAIN FEED PAGE
------------------------------------------------------- */

export default function Feed() {
  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);

  const [
    posts,
    setPosts,
  ] = useState([]);

  const [
    activeFilter,
    setActiveFilter,
  ] = useState("all");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);

  const [
    defaultCreateType,
    setDefaultCreateType,
  ] = useState("general");

  const [
    selectedCreateType,
    setSelectedCreateType,
  ] = useState("general");

  const [
    commentsPost,
    setCommentsPost,
  ] = useState(null);

  const [
    menuPost,
    setMenuPost,
  ] = useState(null);

  const [
    previewImage,
    setPreviewImage,
  ] = useState("");

  /* -------------------------------------------------------
     LOAD CURRENT USER
  ------------------------------------------------------- */

  useEffect(() => {
    const unsubscribe =
      auth.onAuthStateChanged(
        async (user) => {
          if (!user) {
            setCurrentUser(null);
            setLoading(false);
            return;
          }

          try {
            const profile =
              await loadCurrentUserProfile(
                user
              );

            setCurrentUser(profile);
          } catch (error) {
            console.error(
              "Could not load current feed user:",
              error
            );

            setCurrentUser(null);
          }
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* -------------------------------------------------------
     LOAD GLOBAL FEED
  ------------------------------------------------------- */

  useEffect(() => {
    const postsQuery =
      query(
        collection(
          db,
          "posts"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const unsubscribe =
      onSnapshot(
        postsQuery,
        (snapshot) => {
          const loadedPosts =
            snapshot.docs
              .map(
                (
                  postDocument
                ) => ({
                  id:
                    postDocument.id,

                  ...postDocument.data(),
                })
              )
              .filter(
                isPostVisible
              );

          setPosts(
            loadedPosts
          );

          setLoading(false);
        },
        (error) => {
          console.error(
            "Could not load feed:",
            error
          );

          setPosts([]);
          setLoading(false);
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* -------------------------------------------------------
     REMOVE EXPIRED PLAN POSTS FROM VIEW
  ------------------------------------------------------- */

  useEffect(() => {
    const interval =
      window.setInterval(
        () => {
          setPosts(
            (
              currentPosts
            ) =>
              currentPosts.filter(
                isPostVisible
              )
          );
        },
        60 * 1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, []);

  /* -------------------------------------------------------
     KEEP MODALS LIVE
  ------------------------------------------------------- */

  useEffect(() => {
    if (
      commentsPost?.id
    ) {
      const updatedPost =
        posts.find(
          (post) =>
            post.id ===
            commentsPost.id
        );

      if (updatedPost) {
        setCommentsPost(
          updatedPost
        );
      } else {
        setCommentsPost(
          null
        );
      }
    }

    if (menuPost?.id) {
      const updatedPost =
        posts.find(
          (post) =>
            post.id ===
            menuPost.id
        );

      if (updatedPost) {
        setMenuPost(
          updatedPost
        );
      } else {
        setMenuPost(
          null
        );
      }
    }
  }, [
    posts,
    commentsPost?.id,
    menuPost?.id,
  ]);

  /* -------------------------------------------------------
     FILTER POSTS
  ------------------------------------------------------- */

  const filteredPosts =
    useMemo(() => {
      if (!currentUser) {
        return [];
      }

      if (
        activeFilter ===
        "all"
      ) {
        return posts;
      }

      if (
        activeFilter ===
        "saved"
      ) {
        return posts.filter(
          (post) =>
            Array.isArray(
              post.savedBy
            ) &&
            post.savedBy.includes(
              currentUser.uid
            )
        );
      }

      if (
        activeFilter ===
        "mine"
      ) {
        return posts.filter(
          (post) =>
            post.uid ===
              currentUser.uid ||
            (post.userEmail &&
              post.userEmail ===
                currentUser.email)
        );
      }

      return posts.filter(
        (post) =>
          (post.postType ||
            "general") ===
          activeFilter
      );
    }, [
      posts,
      activeFilter,
      currentUser,
    ]);

  /* -------------------------------------------------------
     CREATE MODAL
  ------------------------------------------------------- */

  const openCreateModal = (
    type = "general"
  ) => {
    const validType =
      postTypes[type]
        ? type
        : "general";

    setSelectedCreateType(
      validType
    );

    setDefaultCreateType(
      validType
    );

    setCreateOpen(true);
  };

  const handleCreateSelection = (
    type
  ) => {
    openCreateModal(type);
  };

  /* -------------------------------------------------------
     LOADING STATE
  ------------------------------------------------------- */

  if (
    loading ||
    !currentUser
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fff0f6_0%,#fff8fb_42%,#fff6fa_100%)] px-5 pb-28">
        <style>
          {`
            @keyframes limiLoadingPulse {
              0%, 100% {
                transform: scale(1);
                opacity: 0.7;
              }

              50% {
                transform: scale(1.08);
                opacity: 1;
              }
            }
          `}
        </style>

        <div className="relative w-full max-w-md overflow-hidden rounded-[36px] border border-white/90 bg-white/85 p-9 text-center shadow-[0_24px_60px_rgba(200,105,145,0.14)] backdrop-blur-2xl">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ffe5ef]" />

          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#fff0f6]" />

          <div className="relative z-10">
            <div className="relative mx-auto h-16 w-16">
              <div
                className="absolute inset-0 rounded-full bg-[#f7bfd4]/50"
                style={{
                  animation:
                    "limiLoadingPulse 1.3s ease-in-out infinite",
                }}
              />

              <div className="absolute inset-[8px] animate-spin rounded-full border-4 border-[#f8d1df] border-t-[#eb6aaa]" />
            </div>

            <p className="mt-5 font-black text-[#80636f]">
              Loading your feed...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     PAGE
  ------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff0f6_0%,#fff8fb_38%,#fff6fa_100%)] pb-36">
      <style>
        {`
          @keyframes limiModalEnter {
            from {
              opacity: 0;
              transform: translateY(28px) scale(0.97);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes limiImageEnter {
            from {
              opacity: 0;
              transform: scale(0.94);
            }

            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes limiFeedCardEnter {
            from {
              opacity: 0;
              transform: translateY(18px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes limiHeartPop {
            0% {
              transform: scale(1);
            }

            35% {
              transform: scale(1.42) rotate(-8deg);
            }

            65% {
              transform: scale(0.88) rotate(4deg);
            }

            100% {
              transform: scale(1) rotate(0);
            }
          }

          @keyframes limiBookmarkPop {
            0% {
              transform: scale(1);
            }

            45% {
              transform: scale(1.28) translateY(-2px);
            }

            100% {
              transform: scale(1) translateY(0);
            }
          }
        `}
      </style>

      <div className="mx-auto max-w-md px-4 pt-4">
        {/* CREATE SEGMENTED CONTROL */}

        <PremiumCreateControl
          activeType={
            selectedCreateType
          }
          onSelect={
            handleCreateSelection
          }
        />

        {/* FEED FILTERS */}

        <div className="sticky top-0 z-40 -mx-4 mt-4 border-b border-white/40 bg-[#fff6fa]/80 px-4 pb-3 pt-2 backdrop-blur-2xl">
          <PremiumFeedFilter
            activeFilter={
              activeFilter
            }
            onChange={
              setActiveFilter
            }
          />
        </div>

        {/* POSTS */}

        <main className="mt-5 space-y-6">
          {filteredPosts.length ? (
            filteredPosts.map(
              (post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={
                    currentUser
                  }
                  onOpenComments={
                    setCommentsPost
                  }
                  onOpenMenu={
                    setMenuPost
                  }
                  onOpenImage={
                    setPreviewImage
                  }
                />
              )
            )
          ) : (
            <EmptyFeedState
              activeFilter={
                activeFilter
              }
              onCreate={
                openCreateModal
              }
            />
          )}
        </main>
      </div>

      {/* CREATE POST MODAL */}

      <CreatePostModal
        open={createOpen}
        onClose={() =>
          setCreateOpen(false)
        }
        currentUser={
          currentUser
        }
        defaultType={
          defaultCreateType
        }
      />

      {/* COMMENTS MODAL */}

      <CommentsModal
        open={Boolean(
          commentsPost
        )}
        onClose={() =>
          setCommentsPost(
            null
          )
        }
        post={
          commentsPost
        }
        currentUser={
          currentUser
        }
      />

      {/* POST OPTIONS MODAL */}

      <PostMenuModal
        open={Boolean(
          menuPost
        )}
        onClose={() =>
          setMenuPost(null)
        }
        post={menuPost}
        currentUser={
          currentUser
        }
      />

      {/* FULL IMAGE PREVIEW */}

      <ImagePreviewModal
        imageURL={
          previewImage
        }
        onClose={() =>
          setPreviewImage("")
        }
      />
    </div>
  );
}