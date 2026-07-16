import {
  getFriendlyFirebaseErrorMessage,
} from "../lib/firebaseError";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  Upload,
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

  Other: ["Other"],
};

/* -------------------------------------------------------
   POST TYPES
------------------------------------------------------- */

const postTypes = {
  general: {
    label: "Share",
    fullLabel: "General",
    emoji: "✨",
    icon: Sparkles,

    gradient:
      "from-[#ee8eb1] via-[#e979a6] to-[#d95f98]",

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
    fullLabel: "Question",
    emoji: "❓",
    icon: HelpCircle,

    gradient:
      "from-[#8fd8e8] via-[#f6c7b4] to-[#e9a6c4]",

    softBackground:
      "bg-[#fff4fa]",

    border:
      "border-[#eccfe2]",

    badgeBackground:
      "bg-[#f8e8f5]",

    badgeText:
      "text-[#b867a2]",

    buttonText:
      "Ask Question",

    placeholder:
      "Ask for advice, opinions, recommendations, beauty help, school help, or anything else...",
  },

  hangout: {
    label: "Make Plans",
    fullLabel: "Hangout",
    emoji: "📍",
    icon: MapPin,

    gradient:
      "from-[#f5aaab] via-[#f18f9f] to-[#e87991]",

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

/* -------------------------------------------------------
   FILTERS
------------------------------------------------------- */

const feedFilters = [
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
  {
    label: "Saved",
    type: "saved",
  },
  {
    label: "Mine",
    type: "mine",
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
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[180] flex items-end justify-center bg-black/45 px-3 sm:items-center">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="relative z-10 max-h-[94vh] w-full max-w-md overflow-y-auto rounded-t-[34px] bg-[#fff8fb] p-5 shadow-2xl sm:rounded-[34px]">
        <div className="mb-5 flex items-center justify-between gap-3">
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
  photoURL,
  name,
  size = "medium",
}) {
  const sizeClasses =
    size === "small"
      ? "h-10 w-10 text-xs"
      : size === "large"
        ? "h-14 w-14 text-lg"
        : "h-12 w-12 text-sm";

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name || "Profile"}
        className={`${sizeClasses} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a2bc] via-[#ef87ad] to-[#d94b93] font-black text-white`}
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
    <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/85 p-4">
      <button
        type="button"
        aria-label="Close image"
        onClick={onClose}
        className="absolute inset-0"
      />

      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur"
      >
        <X size={22} />
      </button>

      <img
        src={imageURL}
        alt="Preview"
        className="relative z-10 max-h-[86vh] max-w-full rounded-[28px] object-contain"
      />
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
    setPostType
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

    setPostType("general");
    setText("");
    setImageFile(null);
    setPreviewURL("");
    setGroupType("Hobbies");

    setGroup(
      feedGroups.Hobbies[0]
    );

    setUploading(false);
  }, [open, defaultType]);

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
      title="Create a Post"
    >
      <form
        onSubmit={submitPost}
        className="space-y-5"
      >
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(
            postTypes
          ).map(
            ([
              typeKey,
              type,
            ]) => {
              const Icon =
                type.icon;

              const active =
                postType ===
                typeKey;

              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() =>
                    setPostType(
                      typeKey
                    )
                  }
                  className={`rounded-[22px] border px-2 py-3 text-center transition ${
                    active
                      ? `border-transparent bg-gradient-to-br ${type.gradient} text-white shadow-md`
                      : "border-[#f1dce5] bg-white text-[#80636f]"
                  }`}
                >
                  <Icon
                    size={19}
                    className="mx-auto"
                  />

                  <p className="mt-2 text-xs font-black">
                    {type.label}
                  </p>
                </button>
              );
            }
          )}
        </div>

        {postType ===
          "hangout" && (
          <div className="flex items-start gap-3 rounded-[22px] bg-[#fff0ed] p-4">
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
          className={`rounded-[26px] border ${selectedType.border} ${selectedType.softBackground} p-4`}
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
          <div className="relative overflow-hidden rounded-[28px] bg-[#fff0f6]">
            <img
              src={previewURL}
              alt="Post preview"
              className="max-h-[380px] w-full object-cover"
            />

            <button
              type="button"
              onClick={() =>
                setImageFile(null)
              }
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[22px] border border-[#f1d8e3] bg-white px-4 py-4 text-sm font-black text-[#d94b93] shadow-sm">
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
          className={`flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r ${selectedType.gradient} py-4 text-lg font-black text-white shadow-[0_10px_24px_rgba(231,91,150,0.24)] disabled:opacity-60`}
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
      className="mt-3 block overflow-hidden rounded-[18px] bg-[#f7edf2]"
    >
      <img
        src={imageURL}
        alt="Comment attachment"
        loading="lazy"
        className="max-h-[190px] w-auto max-w-[180px] object-cover"
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
    <div className="rounded-[24px] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() =>
            onOpenProfile(
              comment.uid
            )
          }
          className="shrink-0"
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
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff5f8] text-[#c884a1]"
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
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500"
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
              <div className="rounded-[28px] bg-white p-8 text-center shadow-sm">
                <MessageCircle
                  size={38}
                  className="mx-auto text-[#f089b0]"
                />

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
            <div className="relative w-fit overflow-hidden rounded-[18px] bg-[#fff0f6]">
              <img
                src={previewURL}
                alt="Comment preview"
                className="max-h-[150px] max-w-[170px] object-cover"
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
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <form
            onSubmit={
              submitComment
            }
            className="rounded-[26px] border border-[#f2dce6] bg-white p-3 shadow-sm"
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0f6] text-[#d94b93] disabled:opacity-50"
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

              <div className="min-w-0 flex-1 rounded-[20px] bg-[#fff7fa] px-4 py-2">
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] text-white disabled:opacity-40"
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
            className="flex w-full items-center gap-3 rounded-[22px] bg-white p-4 text-left text-red-500 shadow-sm disabled:opacity-50"
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
            className="flex w-full items-center gap-3 rounded-[22px] bg-white p-4 text-left text-[#c56d92] shadow-sm disabled:opacity-50"
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
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black transition ${
        active
          ? "bg-[#ffe4ef] text-[#d94b93]"
          : "text-[#90717f] hover:bg-[#fff3f7]"
      }`}
    >
      {icon}
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
  const navigate = useNavigate();

  const typeKey =
    post.postType || "general";

  const type =
    postTypes[typeKey] ||
    postTypes.general;

  const likes =
    Array.isArray(post.likesBy)
      ? post.likesBy
      : [];

  const saves =
    Array.isArray(post.savedBy)
      ? post.savedBy
      : [];

  const comments =
    Array.isArray(post.comments)
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
        if (navigator.share) {
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
    <article className="overflow-hidden rounded-[34px] bg-white shadow-[0_14px_38px_rgba(239,148,181,0.14)]">
      {/* TYPE HEADER */}

      <div
        className={`relative overflow-hidden bg-gradient-to-r ${type.gradient} p-5 text-white`}
      >
        <div className="absolute -left-16 bottom-[-70px] h-48 w-48 rounded-full bg-white/10" />

        <div className="absolute right-[-55px] top-[-55px] h-44 w-44 rounded-full bg-white/10" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={openProfile}
            className="flex min-w-0 items-center gap-3 text-left"
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
                <h3 className="truncate text-lg font-black">
                  {post.username ||
                    "Limi User"}
                </h3>

                {post.uid ===
                  currentUser?.uid && (
                  <span className="rounded-full bg-white/20 px-2 py-1 text-[9px] font-black uppercase backdrop-blur">
                    You
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-white/85">
                {post.group && (
                  <span>
                    {post.group}
                  </span>
                )}

                <span>•</span>

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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/15 text-white backdrop-blur"
            aria-label="Post options"
          >
            <MoreHorizontal
              size={20}
            />
          </button>
        </div>

        <div className="relative z-10 mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-black backdrop-blur">
            {type.emoji}{" "}
            {type.fullLabel}
          </span>

          {typeKey ===
            "hangout" &&
            post.expiresAt && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/15 px-3 py-1.5 text-xs font-black backdrop-blur">
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
          <p className="whitespace-pre-wrap break-words text-[16px] font-semibold leading-7 text-[#604d57]">
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
            className="block w-full overflow-hidden rounded-[28px] bg-[#fff0f6]"
          >
            <img
              src={
                post.imageURL ||
                post.image
              }
              alt="Post attachment"
              loading="lazy"
              className="max-h-[520px] w-full object-cover"
            />
          </button>
        )}

        {post.city && (
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff5f9] px-3 py-2 text-xs font-black text-[#9b6b81]">
            <MapPin size={14} />

            {post.city}
          </div>
        )}

        {/* ACTIONS */}

        <div className="flex items-center justify-between border-t border-[#f5e2ea] pt-4">
          <div className="flex min-w-0 items-center gap-1">
            <PostActionButton
              active={liked}
              onClick={toggleLike}
              label={String(
                likes.length
              )}
              icon={
                <Heart
                  size={19}
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
                onOpenComments(post)
              }
              label={String(
                comments.length
              )}
              icon={
                <MessageCircle
                  size={19}
                />
              }
            />

            <PostActionButton
              onClick={sharePost}
              label="Share"
              icon={
                <Share2 size={19} />
              }
            />
          </div>

          <button
            type="button"
            onClick={toggleSave}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
              saved
                ? "bg-[#ffe4ef] text-[#d94b93]"
                : "bg-[#fff6fa] text-[#967480]"
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
   CREATE ACTION CARD
------------------------------------------------------- */

function CreateActionCard({
  onCreate,
}) {
  return (
    <div className="relative overflow-hidden rounded-[36px] bg-white/80 p-5 shadow-[0_12px_35px_rgba(239,148,181,0.14)] backdrop-blur-xl">
      <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-[#ffe4ef]/70" />

      <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-[#fff0f6]/80" />

      <div className="relative z-10">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] text-white shadow-[0_10px_24px_rgba(237,102,157,0.22)]">
            <Sparkles
              size={24}
            />
          </div>

          <h1 className="mt-4 text-[30px] font-black leading-none tracking-[-0.05em] text-[#eb6aaa]">
            Share, ask, or make plans
          </h1>

          <p className="mx-auto mt-3 max-w-[300px] text-sm font-semibold leading-6 text-[#80636f]">
            Post an update, ask the
            community, or find someone
            to do something with.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            {
              key: "general",
              label: "Share",
              icon: Sparkles,
            },
            {
              key: "question",
              label: "Ask",
              icon: HelpCircle,
            },
            {
              key: "hangout",
              label:
                "Make Plans",
              icon: MapPin,
            },
          ].map(
            ({
              key,
              label,
              icon: Icon,
            }) => {
              const type =
                postTypes[key];

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    onCreate(key)
                  }
                  className={`rounded-[24px] bg-gradient-to-br ${type.gradient} px-2 py-4 text-center text-white shadow-sm transition active:scale-[0.98]`}
                >
                  <Icon
                    size={21}
                    className="mx-auto"
                  />

                  <p className="mt-2 text-xs font-black">
                    {label}
                  </p>
                </button>
              );
            }
          )}
        </div>
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
          }
        }
      );

    return () => unsubscribe();
  }, []);

  /* -------------------------------------------------------
     LOAD GLOBAL FEED
  ------------------------------------------------------- */

  useEffect(() => {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const loadedPosts =
          snapshot.docs
            .map(
              (postDocument) => ({
                id:
                  postDocument.id,

                ...postDocument.data(),
              })
            )
            .filter(
              isPostVisible
            );

        setPosts(loadedPosts);
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

    return () => unsubscribe();
  }, []);

  /* -------------------------------------------------------
     KEEP MODALS LIVE
  ------------------------------------------------------- */

  useEffect(() => {
    if (commentsPost?.id) {
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
            currentUser.uid
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

  const openCreateModal = (
    type = "general"
  ) => {
    setDefaultCreateType(type);
    setCreateOpen(true);
  };

  if (
    loading ||
    !currentUser
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff6fa] px-5 pb-28">
        <div className="w-full max-w-md rounded-[34px] bg-white p-9 text-center shadow-sm">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#f7c5d7] border-t-[#eb6aaa]" />

          <p className="mt-4 font-black text-[#80636f]">
            Loading your feed...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff6fa] pb-36">
      <div className="mx-auto max-w-md px-4 pt-5">
        {/* CREATION CARD */}

        <CreateActionCard
          onCreate={
            openCreateModal
          }
        />

        {/* FILTERS */}

        <div className="mt-5 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-3">
            {feedFilters.map(
              (filter) => (
                <button
                  key={
                    filter.type
                  }
                  type="button"
                  onClick={() =>
                    setActiveFilter(
                      filter.type
                    )
                  }
                  className={`rounded-full px-5 py-3 text-sm font-black transition ${
                    activeFilter ===
                    filter.type
                      ? "bg-gradient-to-r from-[#f29dbc] to-[#f06aa8] text-white shadow-sm"
                      : "border border-[#f1d8e3] bg-white/80 text-[#6f5d66] backdrop-blur"
                  }`}
                >
                  {filter.label}
                </button>
              )
            )}
          </div>
        </div>

        {/* POSTS */}

        <main className="mt-6 space-y-6">
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
            <div className="relative overflow-hidden rounded-[36px] bg-white p-10 text-center shadow-sm">
              <div className="absolute -left-14 -bottom-14 h-44 w-44 rounded-full bg-[#fff0f6]" />

              <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-[#ffe8f0]" />

              <div className="relative z-10">
                <Sparkles
                  size={44}
                  className="mx-auto text-[#f089b0]"
                />

                <h3 className="mt-4 text-2xl font-black text-[#e85da2]">
                  Nothing here yet
                </h3>

                <p className="mx-auto mt-3 max-w-[260px] text-sm font-semibold leading-6 text-[#80636f]">
                  Be the first person
                  to share something in
                  this section.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    openCreateModal(
                      activeFilter ===
                        "question"
                        ? "question"
                        : activeFilter ===
                            "hangout"
                          ? "hangout"
                          : "general"
                    )
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 font-black text-white"
                >
                  <Plus size={18} />
                  Create a Post
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* FLOATING CREATE BUTTON */}

      <button
        type="button"
        onClick={() =>
          openCreateModal(
            "general"
          )
        }
        className="fixed bottom-28 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] text-white shadow-[0_12px_28px_rgba(217,75,147,0.35)]"
        aria-label="Create post"
      >
        <Plus size={25} />
      </button>

      {/* CREATE */}

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

      {/* COMMENTS */}

      <CommentsModal
        open={Boolean(
          commentsPost
        )}
        onClose={() =>
          setCommentsPost(null)
        }
        post={commentsPost}
        currentUser={
          currentUser
        }
      />

      {/* OPTIONS */}

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

      {/* IMAGE PREVIEW */}

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
