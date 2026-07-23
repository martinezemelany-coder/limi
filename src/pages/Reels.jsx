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
  Flag,
  Heart,
  Image,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Plus,
  Send,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
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
  updateDoc,
} from "firebase/firestore";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function getInitials(name = "L") {
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

function formatTime(timestamp) {
  if (!timestamp) {
    return "Just now";
  }

  try {
    const date =
      timestamp?.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

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

function getVideoStoragePath(
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

async function loadUserProfile(
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

    const data =
      profileSnapshot.data();

    const name =
      getProfileName(
        data,
        user
      );

    return {
      ...fallback,
      uid: user.uid,
      name,
      avatar:
        data.avatar ||
        getInitials(name),
      photoURL:
        getProfilePhoto(
          data,
          user
        ),
      city:
        data.city ||
        data.displayLocation ||
        data.location
          ?.displayLocation ||
        data.location?.city ||
        "",
    };
  } catch (error) {
    console.error(
      "Could not load reel profile:",
      error
    );

    return fallback;
  }
}

async function uploadReelVideo(
  file,
  uid
) {
  if (!file || !uid) {
    throw new Error(
      "The reel is missing its video or user."
    );
  }

  const safeFileName =
    file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    );

  const storagePath =
    `reels/${uid}/${Date.now()}-${safeFileName}`;

  const videoReference =
    ref(
      storage,
      storagePath
    );

  await uploadBytes(
    videoReference,
    file,
    {
      contentType:
        file.type ||
        "video/mp4",
    }
  );

  const videoURL =
    await getDownloadURL(
      videoReference
    );

  return {
    videoURL,
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
    <div className="fixed inset-0 z-[180] flex items-end justify-center bg-black/55 px-3 sm:items-center">
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
    size === "large"
      ? "h-16 w-16 text-xl"
      : size === "small"
        ? "h-10 w-10 text-xs"
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
   CREATE REEL MODAL
------------------------------------------------------- */

function CreateReelModal({
  open,
  onClose,
  currentUser,
}) {
  const [
    videoFile,
    setVideoFile,
  ] = useState(null);

  const [
    previewURL,
    setPreviewURL,
  ] = useState("");

  const [
    caption,
    setCaption,
  ] = useState("");

  const [
    audio,
    setAudio,
  ] = useState("");

  const [
    uploading,
    setUploading,
  ] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setVideoFile(null);
    setPreviewURL("");
    setCaption("");
    setAudio("");
    setUploading(false);
  }, [open]);

  useEffect(() => {
    if (!videoFile) {
      setPreviewURL("");
      return undefined;
    }

    const nextPreviewURL =
      URL.createObjectURL(
        videoFile
      );

    setPreviewURL(
      nextPreviewURL
    );

    return () => {
      URL.revokeObjectURL(
        nextPreviewURL
      );
    };
  }, [videoFile]);

  const selectVideo = (
    file
  ) => {
    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "video/"
      )
    ) {
      window.alert(
        "Please choose a video file."
      );

      return;
    }

    const maximumSize =
      100 * 1024 * 1024;

    if (
      file.size >
      maximumSize
    ) {
      window.alert(
        "Please choose a video smaller than 100 MB."
      );

      return;
    }

    setVideoFile(file);
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (!currentUser?.uid) {
        window.alert(
          "Please sign in again."
        );

        return;
      }

      if (!videoFile) {
        window.alert(
          "Choose a video first 💕"
        );

        return;
      }

      if (!caption.trim()) {
        window.alert(
          "Add a caption first 💕"
        );

        return;
      }

      try {
        setUploading(true);

        const {
          videoURL,
          storagePath,
        } =
          await uploadReelVideo(
            videoFile,
            currentUser.uid
          );

        await addDoc(
          collection(
            db,
            "reels"
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

            video:
              videoURL,

            videoURL,

            storagePath,

            caption:
              caption.trim(),

            audio:
              audio.trim() ||
              "original sound",

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
          "Could not upload reel:",
          error
        );

        window.alert(
          getFriendlyFirebaseErrorMessage?.(
            error
          ) ||
            error.message ||
            "The reel could not be uploaded."
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
      title="Post a Reel"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label className="mb-2 block text-sm font-black text-[#80636f]">
            Video
          </label>

          {previewURL ? (
            <div className="relative overflow-hidden rounded-[28px] bg-black">
              <video
                src={previewURL}
                controls
                playsInline
                className="h-[420px] w-full object-cover"
              />

              <label className="absolute right-3 top-3 flex cursor-pointer items-center gap-2 rounded-full bg-black/45 px-4 py-2 text-xs font-black text-white backdrop-blur">
                <Upload size={15} />
                Change

                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(
                    event
                  ) =>
                    selectVideo(
                      event.target
                        .files?.[0]
                    )
                  }
                />
              </label>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[#f1cddd] bg-white px-5 py-10 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ffe4ef] text-[#e85da2]">
                <Upload size={28} />
              </div>

              <p className="mt-4 text-lg font-black text-[#e85da2]">
                Choose a video
              </p>

              <p className="mt-2 max-w-[250px] text-sm font-semibold leading-6 text-[#80636f]">
                Upload a vertical video
                from your camera roll.
              </p>

              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(
                  event
                ) =>
                  selectVideo(
                    event.target
                      .files?.[0]
                  )
                }
              />
            </label>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-[#80636f]">
            Caption
          </label>

          <textarea
            rows={4}
            maxLength={500}
            value={caption}
            onChange={(
              event
            ) =>
              setCaption(
                event.target.value
              )
            }
            placeholder="What’s happening? 💕"
            className="w-full resize-none rounded-[22px] border border-[#f3dbe4] bg-white px-4 py-3 font-semibold text-[#5f4b56] outline-none focus:border-[#ef9ab9]"
          />

          <p className="mt-2 text-right text-xs font-bold text-[#b08a9b]">
            {caption.length}/500
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-[#80636f]">
            Sound name
          </label>

          <div className="flex items-center gap-3 rounded-[22px] border border-[#f3dbe4] bg-white px-4 py-3">
            <Music2
              size={18}
              className="shrink-0 text-[#d94b93]"
            />

            <input
              value={audio}
              onChange={(
                event
              ) =>
                setAudio(
                  event.target.value
                )
              }
              placeholder="original sound"
              className="min-w-0 flex-1 bg-transparent font-semibold text-[#5f4b56] outline-none placeholder:text-[#bd91a4]"
            />
          </div>
        </div>

        <div className="rounded-[22px] bg-[#fff0f6] p-4">
          <div className="flex items-start gap-3">
            <Sparkles
              size={19}
              className="mt-0.5 shrink-0 text-[#d94b93]"
            />

            <p className="text-sm font-bold leading-6 text-[#8c6276]">
              Your reel can be viewed by
              Limi users everywhere, not
              only people near your
              location.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white shadow-[0_10px_24px_rgba(231,91,150,0.24)] disabled:opacity-60"
        >
          {uploading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Posting...
            </>
          ) : (
            <>
              <Upload size={19} />
              Post Reel
            </>
          )}
        </button>
      </form>
    </ModalShell>
  );
}

/* -------------------------------------------------------
   COMMENTS MODAL
------------------------------------------------------- */

function CommentsModal({
  open,
  onClose,
  reel,
  currentUser,
}) {
  const [
    commentText,
    setCommentText,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  useEffect(() => {
    if (open) {
      setCommentText("");
      setSubmitting(false);
    }
  }, [open]);

  if (!open || !reel) {
    return null;
  }

  const comments = Array.isArray(
    reel.comments
  )
    ? reel.comments
    : [];

  const submitComment =
    async (event) => {
      event.preventDefault();

      const cleanComment =
        commentText.trim();

      if (
        !cleanComment ||
        submitting ||
        !currentUser?.uid
      ) {
        return;
      }

      const newComment = {
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
          cleanComment,

        createdAt:
          new Date().toISOString(),
      };

      try {
        setSubmitting(true);

        await updateDoc(
          doc(
            db,
            "reels",
            reel.id
          ),
          {
            comments:
              arrayUnion(
                newComment
              ),

            updatedAt:
              serverTimestamp(),
          }
        );

        setCommentText("");
      } catch (error) {
        console.error(
          "Could not post comment:",
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

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Comments"
    >
      <div className="space-y-4">
        <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
          {comments.length ? (
            comments.map(
              (comment) => (
                <div
                  key={
                    comment.id ||
                    `${comment.uid}-${comment.createdAt}`
                  }
                  className="rounded-[24px] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
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

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="truncate text-sm font-black text-[#2b1d28]">
                          {comment.user ||
                            comment.username ||
                            "Limi User"}
                        </p>

                        <p className="text-[10px] font-bold text-[#b08a9b]">
                          {formatTime(
                            comment.createdAt
                          )}
                        </p>
                      </div>

                      <p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-[#80636f]">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )
          ) : (
            <div className="rounded-[26px] bg-white p-8 text-center shadow-sm">
              <MessageCircle
                size={38}
                className="mx-auto text-[#f089b0]"
              />

              <h3 className="mt-4 text-xl font-black text-[#e85da2]">
                No comments yet
              </h3>

              <p className="mt-2 text-sm font-semibold leading-6 text-[#80636f]">
                Be the first person to
                leave some love 💕
              </p>
            </div>
          )}
        </div>

        <form
          onSubmit={submitComment}
          className="rounded-[26px] border border-[#f2dce6] bg-white p-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <ProfileAvatar
              photoURL={
                currentUser?.photoURL
              }
              name={
                currentUser?.name
              }
              size="small"
            />

            <input
              value={commentText}
              disabled={submitting}
              maxLength={300}
              onChange={(event) =>
                setCommentText(
                  event.target.value
                )
              }
              placeholder="Add a comment..."
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#5f4b56] outline-none placeholder:text-[#bd91a4] disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={
                submitting ||
                !commentText.trim()
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] text-white disabled:opacity-40"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Send size={17} />
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------
   REEL OPTIONS MODAL
------------------------------------------------------- */

function ReelMenuModal({
  open,
  onClose,
  reel,
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

  if (!open || !reel) {
    return null;
  }

  const isOwner =
    reel.uid === currentUser?.uid;

  const deleteReel =
    async () => {
      const confirmed =
        window.confirm(
          "Delete this reel? This cannot be undone."
        );

      if (!confirmed) {
        return;
      }

      try {
        setProcessing(true);

        const storagePath =
          reel.storagePath ||
          getVideoStoragePath(
            reel.videoURL ||
              reel.video
          );

        if (storagePath) {
          try {
            await deleteObject(
              ref(
                storage,
                storagePath
              )
            );
          } catch (storageError) {
            console.warn(
              "The reel document will still be deleted, but its video could not be removed from Storage:",
              storageError
            );
          }
        }

        await deleteDoc(
          doc(
            db,
            "reels",
            reel.id
          )
        );

        onClose();
      } catch (error) {
        console.error(
          "Could not delete reel:",
          error
        );

        window.alert(
          getFriendlyFirebaseErrorMessage?.(
            error
          ) ||
            error.message ||
            "The reel could not be deleted."
        );
      } finally {
        setProcessing(false);
      }
    };

  const reportReel =
    async () => {
      if (!currentUser?.uid) {
        return;
      }

      const alreadyReported =
        Array.isArray(
          reel.reports
        ) &&
        reel.reports.includes(
          currentUser.uid
        );

      if (alreadyReported) {
        window.alert(
          "You already reported this reel."
        );

        onClose();
        return;
      }

      const confirmed =
        window.confirm(
          "Report this reel for review?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setProcessing(true);

        await updateDoc(
          doc(
            db,
            "reels",
            reel.id
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
            type: "reel",

            reelId:
              reel.id,

            reelOwnerId:
              reel.uid || "",

            reporterId:
              currentUser.uid,

            status:
              "pending",

            createdAt:
              serverTimestamp(),
          }
        );

        window.alert(
          "Reel reported. Thank you for helping keep Limi safe."
        );

        onClose();
      } catch (error) {
        console.error(
          "Could not report reel:",
          error
        );

        window.alert(
          getFriendlyFirebaseErrorMessage?.(
            error
          ) ||
            error.message ||
            "The reel could not be reported."
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
      title="Reel Options"
    >
      <div className="space-y-3">
        {isOwner ? (
          <button
            type="button"
            disabled={processing}
            onClick={deleteReel}
            className="flex w-full items-center gap-3 rounded-[22px] bg-white px-4 py-4 text-left font-black text-red-500 shadow-sm disabled:opacity-50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
              <Trash2 size={19} />
            </div>

            <div>
              <p>Delete Reel</p>

              <p className="mt-1 text-xs font-semibold text-red-400">
                Remove this reel
                permanently
              </p>
            </div>
          </button>
        ) : (
          <button
            type="button"
            disabled={processing}
            onClick={reportReel}
            className="flex w-full items-center gap-3 rounded-[22px] bg-white px-4 py-4 text-left font-black text-[#d26487] shadow-sm disabled:opacity-50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff0f6]">
              <Flag size={19} />
            </div>

            <div>
              <p>Report Reel</p>

              <p className="mt-1 text-xs font-semibold text-[#a87c90]">
                Send this reel for
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
   REEL VIDEO
------------------------------------------------------- */

function ReelVideo({
  videoURL,
  reelId,
}) {
  const videoReference =
    useRef(null);

  const [
    isPlaying,
    setIsPlaying,
  ] = useState(false);

  const [
    muted,
    setMuted,
  ] = useState(true);

  const [
    videoReady,
    setVideoReady,
  ] = useState(false);

  useEffect(() => {
    const videoElement =
      videoReference.current;

    if (!videoElement) {
      return undefined;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (
            entry.isIntersecting &&
            entry.intersectionRatio >=
              0.65
          ) {
            videoElement
              .play()
              .then(() => {
                setIsPlaying(true);
              })
              .catch(() => {
                setIsPlaying(false);
              });
          } else {
            videoElement.pause();
            setIsPlaying(false);
          }
        },
        {
          threshold: [
            0,
            0.25,
            0.65,
            0.9,
          ],
        }
      );

    observer.observe(videoElement);

    return () => {
      observer.disconnect();
      videoElement.pause();
    };
  }, [reelId]);

  const togglePlayback = () => {
    const videoElement =
      videoReference.current;

    if (!videoElement) {
      return;
    }

    if (videoElement.paused) {
      videoElement
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  };

  const toggleMuted = (
    event
  ) => {
    event.stopPropagation();

    const videoElement =
      videoReference.current;

    if (!videoElement) {
      return;
    }

    const nextMuted =
      !videoElement.muted;

    videoElement.muted =
      nextMuted;

    setMuted(nextMuted);
  };

  return (
    <div
      className="absolute inset-0 bg-black"
      onClick={togglePlayback}
    >
      {!videoReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-white" />
        </div>
      )}

      <video
        ref={videoReference}
        src={videoURL}
        playsInline
        muted={muted}
        loop
        preload="metadata"
        onCanPlay={() =>
          setVideoReady(true)
        }
        onPlay={() =>
          setIsPlaying(true)
        }
        onPause={() =>
          setIsPlaying(false)
        }
        className="h-full w-full object-cover"
      />

      {!isPlaying &&
        videoReady && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md">
              <Play
                size={34}
                fill="currentColor"
                className="ml-1"
              />
            </div>
          </div>
        )}

      <button
        type="button"
        onClick={toggleMuted}
        aria-label={
          muted
            ? "Turn sound on"
            : "Mute video"
        }
        className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md"
      >
        {muted ? (
          <VolumeX size={19} />
        ) : (
          <Volume2 size={19} />
        )}
      </button>
    </div>
  );
}

/* -------------------------------------------------------
   REEL ACTION BUTTON
------------------------------------------------------- */

function ReelActionButton({
  icon,
  label,
  active = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-white"
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-sm backdrop-blur-md transition ${
          active
            ? "bg-[#ec64a8]"
            : "bg-black/30"
        }`}
      >
        {icon}
      </div>

      <span className="max-w-[58px] truncate text-[11px] font-black drop-shadow">
        {label}
      </span>
    </button>
  );
}

/* -------------------------------------------------------
   REEL CARD
------------------------------------------------------- */

function ReelCard({
  reel,
  currentUser,
  onOpenComments,
  onOpenMenu,
  onOpenProfile,
}) {
  const likes = Array.isArray(
    reel.likesBy
  )
    ? reel.likesBy
    : [];

  const saves = Array.isArray(
    reel.savedBy
  )
    ? reel.savedBy
    : [];

  const comments = Array.isArray(
    reel.comments
  )
    ? reel.comments
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

  const videoURL =
    reel.videoURL ||
    reel.video ||
    "";

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
            "reels",
            reel.id
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
          "Could not update reel like:",
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
            "reels",
            reel.id
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
          "Could not save reel:",
          error
        );
      } finally {
        setChangingSave(false);
      }
    };

  const shareReel =
    async () => {
      const shareText = `${
        reel.username ||
        "A Limi user"
      } posted on Limi 💕\n${
        reel.caption || ""
      }`;

      try {
        if (navigator.share) {
          await navigator.share({
            title:
              "Limi Reel",
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
            "Reel details copied 💕"
          );

          return;
        }

        window.prompt(
          "Copy this reel:",
          shareText
        );
      } catch (error) {
        if (
          error?.name !==
          "AbortError"
        ) {
          console.error(
            "Could not share reel:",
            error
          );
        }
      }
    };

  return (
    <article className="relative h-[calc(100svh-8.5rem)] min-h-[610px] w-full snap-start overflow-hidden rounded-[34px] bg-black shadow-[0_14px_38px_rgba(231,91,150,0.2)]">
      {videoURL ? (
        <ReelVideo
          videoURL={videoURL}
          reelId={reel.id}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] px-8 text-center text-white">
          <Image size={44} />

          <p className="mt-4 text-lg font-black">
            Video unavailable
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-black/30" />

      <button
        type="button"
        onClick={() =>
          onOpenMenu(reel)
        }
        className="absolute left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md"
        aria-label="Reel options"
      >
        <MoreHorizontal
          size={21}
        />
      </button>

      <div className="absolute bottom-5 left-5 right-[78px] z-30 text-white">
        <button
          type="button"
          onClick={() =>
            onOpenProfile(
              reel.uid
            )
          }
          className="flex max-w-full items-center gap-3 text-left"
        >
          <ProfileAvatar
            photoURL={
              reel.photoURL
            }
            name={
              reel.username
            }
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-black drop-shadow">
                {reel.username ||
                  "Limi User"}
              </p>

              {reel.uid ===
                currentUser?.uid && (
                <span className="rounded-full bg-white/20 px-2 py-1 text-[9px] font-black uppercase backdrop-blur">
                  You
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs font-bold text-white/80">
              {formatTime(
                reel.createdAt
              )}
            </p>
          </div>
        </button>

        {reel.caption && (
          <p className="mt-4 whitespace-pre-wrap break-words text-[15px] font-semibold leading-6 text-white drop-shadow">
            {reel.caption}
          </p>
        )}

        <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-xs font-black backdrop-blur-md">
          <Music2
            size={14}
            className="shrink-0"
          />

          <span className="truncate">
            {reel.audio ||
              "original sound"}
          </span>
        </div>
      </div>

      <div className="absolute bottom-5 right-4 z-40 flex flex-col items-center gap-4">
        <ReelActionButton
          active={liked}
          onClick={toggleLike}
          label={String(
            likes.length
          )}
          icon={
            <Heart
              size={22}
              fill={
                liked
                  ? "currentColor"
                  : "none"
              }
            />
          }
        />

        <ReelActionButton
          onClick={() =>
            onOpenComments(reel)
          }
          label={String(
            comments.length
          )}
          icon={
            <MessageCircle
              size={22}
            />
          }
        />

        <ReelActionButton
          active={saved}
          onClick={toggleSave}
          label={
            saved
              ? "Saved"
              : "Save"
          }
          icon={
            <Bookmark
              size={22}
              fill={
                saved
                  ? "currentColor"
                  : "none"
              }
            />
          }
        />

        <ReelActionButton
          onClick={shareReel}
          label="Share"
          icon={
            <Share2 size={22} />
          }
        />
      </div>
    </article>
  );
}

/* -------------------------------------------------------
   MAIN REELS PAGE
------------------------------------------------------- */

export default function Reels() {
  const navigate = useNavigate();

  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);

  const [
    reels,
    setReels,
  ] = useState([]);

  const [
    reelProfiles,
    setReelProfiles,
  ] = useState({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);

  const [
    commentsReel,
    setCommentsReel,
  ] = useState(null);

  const [
    menuReel,
    setMenuReel,
  ] = useState(null);

  /* -------------------------------------------------------
     LOAD CURRENT USER PROFILE
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
              await loadUserProfile(
                user
              );

            setCurrentUser(profile);
          } catch (error) {
            console.error(
              "Could not load current reel user:",
              error
            );

            const fallbackName =
              user.displayName ||
              user.email?.split("@")[0] ||
              "Limi User";

            setCurrentUser({
              uid: user.uid,
              name: fallbackName,
              email:
                user.email || "",
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
     LOAD ALL REELS GLOBALLY

     There is no location query here. Every posted reel
     can appear for every Limi user.
  ------------------------------------------------------- */

  useEffect(() => {
    const reelsQuery = query(
      collection(db, "reels"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      reelsQuery,
      (snapshot) => {
        const loadedReels =
          snapshot.docs.map(
            (reelDocument) => ({
              id:
                reelDocument.id,

              ...reelDocument.data(),
            })
          );

        setReels(loadedReels);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Could not load global reels:",
          error
        );

        setReels([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

/* -------------------------------------------------------
   LOAD CURRENT PROFILE INFORMATION FOR REEL OWNERS
------------------------------------------------------- */

useEffect(() => {
  const loadReelProfiles = async () => {
    const uniqueUserIds = [
      ...new Set(
        reels
          .map((reel) => reel.uid)
          .filter(Boolean)
      ),
    ];

    if (!uniqueUserIds.length) {
      setReelProfiles({});
      return;
    }

    try {
      const profileEntries =
        await Promise.all(
          uniqueUserIds.map(
            async (uid) => {
              const profileSnapshot =
                await getDoc(
                  doc(
                    db,
                    "users",
                    uid
                  )
                );

              if (
                !profileSnapshot.exists()
              ) {
                return [
                  uid,
                  null,
                ];
              }

              const profileData =
                profileSnapshot.data();

              return [
                uid,
                {
                  name:
                    getProfileName(
                      profileData
                    ),

                  photoURL:
                    getProfilePhoto(
                      profileData
                    ),

                  city:
                    profileData.city ||
                    profileData
                      .displayLocation ||
                    profileData.location
                      ?.displayLocation ||
                    profileData.location
                      ?.city ||
                    "",
                },
              ];
            }
          )
        );

      setReelProfiles(
        Object.fromEntries(
          profileEntries
        )
      );
    } catch (error) {
      console.error(
        "Could not load reel owner profiles:",
        error
      );
    }
  };

  loadReelProfiles();
}, [reels]);

  /* -------------------------------------------------------
     KEEP OPEN MODALS LIVE

     When likes or comments change in Firestore, the
     currently open reel modal receives the newest data.
  ------------------------------------------------------- */

  useEffect(() => {
    if (commentsReel?.id) {
      const updatedReel =
        reels.find(
          (reel) =>
            reel.id ===
            commentsReel.id
        );

      if (updatedReel) {
        setCommentsReel(
          updatedReel
        );
      }
    }

    if (menuReel?.id) {
      const updatedReel =
        reels.find(
          (reel) =>
            reel.id ===
            menuReel.id
        );

      if (updatedReel) {
        setMenuReel(
          updatedReel
        );
      }
    }
  }, [
    reels,
    commentsReel?.id,
    menuReel?.id,
  ]);

  const openProfile = (
    profileUid
  ) => {
    if (!profileUid) {
      return;
    }

    if (
      profileUid ===
      currentUser?.uid
    ) {
      navigate("/profile");
      return;
    }

    navigate(
      `/profile/${profileUid}`
    );
  };

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-5 pb-28">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-white/25 border-t-white" />

          <p className="mt-4 font-black text-white">
            Loading reels...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-28">
      {/* MINIMAL TOP CONTROLS */}

      <div className="pointer-events-none fixed left-1/2 top-4 z-[80] flex w-full max-w-md -translate-x-1/2 items-center justify-between px-5">
        <div className="pointer-events-auto rounded-full bg-black/35 px-5 py-2.5 text-sm font-black text-white shadow-lg backdrop-blur-xl">
          For You
        </div>

        <button
          type="button"
          onClick={() =>
            setCreateOpen(true)
          }
          aria-label="Post a reel"
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] text-white shadow-[0_10px_25px_rgba(236,100,168,0.35)]"
        >
          <Plus size={23} />
        </button>
      </div>

      {/* VERTICAL REEL FEED */}

      {reels.length ? (
        <main className="mx-auto h-[calc(100svh-6.5rem)] max-w-md snap-y snap-mandatory overflow-y-auto bg-black px-2">
          <div className="space-y-3 py-2">
           {reels.map((reel) => {
  const ownerProfile =
    reelProfiles[reel.uid];

  const reelWithCurrentProfile = {
    ...reel,

    username:
      ownerProfile?.name ||
      reel.username ||
      "Limi User",

    photoURL:
      ownerProfile?.photoURL ||
      reel.photoURL ||
      "",

    city:
      ownerProfile?.city ||
      reel.city ||
      "",
  };

  return (
    <ReelCard
      key={reel.id}
      reel={
        reelWithCurrentProfile
      }
      currentUser={
        currentUser
      }
      onOpenComments={
        setCommentsReel
      }
      onOpenMenu={
        setMenuReel
      }
      onOpenProfile={
        openProfile
      }
    />
  );
})}
          </div>
        </main>
      ) : (
        <div className="mx-auto flex min-h-[calc(100svh-7rem)] max-w-md items-center justify-center px-5">
          <div className="relative w-full overflow-hidden rounded-[38px] bg-gradient-to-br from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] p-9 text-center text-white shadow-[0_16px_40px_rgba(236,100,168,0.28)]">
            <div className="absolute -left-16 -bottom-16 h-52 w-52 rounded-full bg-white/10" />

            <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-white/10" />

            <div className="relative z-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <Play
                  size={34}
                  fill="currentColor"
                />
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-[-0.05em]">
                Start the feed
              </h2>

              <p className="mx-auto mt-3 max-w-[280px] text-sm font-bold leading-6 text-white/90">
                Be the first person to
                share a reel with the
                entire Limi community.
              </p>

              <button
                type="button"
                onClick={() =>
                  setCreateOpen(true)
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 font-black text-[#d94b93]"
              >
                <Upload size={18} />
                Post the First Reel
              </button>
            </div>
          </div>
        </div>
      )}

   
      {/* CREATE REEL */}

      <CreateReelModal
        open={createOpen}
        onClose={() =>
          setCreateOpen(false)
        }
        currentUser={
          currentUser
        }
      />

      {/* COMMENTS */}

      <CommentsModal
        open={Boolean(
          commentsReel
        )}
        onClose={() =>
          setCommentsReel(null)
        }
        reel={commentsReel}
        currentUser={
          currentUser
        }
      />

      {/* OPTIONS */}

      <ReelMenuModal
        open={Boolean(
          menuReel
        )}
        onClose={() =>
          setMenuReel(null)
        }
        reel={menuReel}
        currentUser={
          currentUser
        }
      />
    </div>
  );
}