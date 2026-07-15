import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  X,
  Star,
  MessageCircle,
  MapPin,
  ShieldCheck,
  Flag,
  Ban,
  Sparkles,
  RotateCcw,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { auth, db } from "../lib/firebase";

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

/* -------------------------------------------------------
   DEFAULT MATCH ACTIVITY
------------------------------------------------------- */

function defaultActivity() {
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

/* -------------------------------------------------------
   PROFILE HELPERS
------------------------------------------------------- */

function getAuthProfile() {
  const user = auth.currentUser;
  const authPhoto = user?.photoURL || "";

  return {
    uid: user?.uid || "",
    name:
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "Limi User",
    email: user?.email || "",
    photoURL: authPhoto,
    profilePhotos: authPhoto ? [authPhoto] : [],
    age: "",
    city: "",
    bio: "",
    interests: [],
    friendActivities: [],
    socialEnergy: "",
    vibes: [],
    verified: false,
    location: null,
    distancePreference: 25,
  };
}

function normalizeText(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        if (item && typeof item === "object") {
          return (
            item.label ||
            item.name ||
            item.title ||
            item.value ||
            ""
          ).trim();
        }

        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function getProfilePhoto(data = {}) {
  return (
    data.profileImage ||
    data.profilePhotoURL ||
    data.profilePhoto ||
    data.photoURL ||
    data.avatarURL ||
    data.imageURL ||
    ""
  );
}

function getProfilePhotos(data = {}) {
  const mainPhoto = getProfilePhoto(data);

  const savedPhotos = Array.isArray(data.profilePhotos)
    ? data.profilePhotos.filter(
        (photo) =>
          typeof photo === "string" &&
          photo.trim()
      )
    : [];

  if (!savedPhotos.length) {
    return mainPhoto ? [mainPhoto] : [];
  }

  if (
    mainPhoto &&
    !savedPhotos.includes(mainPhoto)
  ) {
    return [mainPhoto, ...savedPhotos].slice(0, 3);
  }

  return savedPhotos.slice(0, 3);
}

function getUserName(data = {}) {
  return (
    data.name ||
    data.displayName ||
    data.fullName ||
    data.firstName ||
    "Limi User"
  );
}

function getFriendActivities(data = {}) {
  return normalizeArray(
    data.friendActivities ||
      data.activities ||
      data.activitiesWithFriends ||
      data.friendPlans ||
      data.thingsToDo ||
      data.whatWouldYouDo ||
      data.whatTheyWouldDo ||
      []
  );
}

function getSocialEnergy(data = {}) {
  const value =
    data.socialEnergy ||
    data.energy ||
    data.personality ||
    data.socialStyle ||
    "";

  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function getVibes(data = {}) {
  return normalizeArray(
    data.vibes ||
      data.vibe ||
      data.personalityVibes ||
      data.selectedVibes ||
      []
  );
}

function getDistancePreference(data = {}) {
  const rawDistance =
    data.distancePreference ??
    data.radiusMiles ??
    data.distanceMiles ??
    data.matchDistance ??
    data.maxDistance ??
    data.discoveryDistance ??
    data.radius ??
    data.location?.distancePreference ??
    data.location?.radiusMiles ??
    25;

  const distance = Number(rawDistance);

  if (
    !Number.isFinite(distance) ||
    distance < 5
  ) {
    return 25;
  }

  return Math.min(distance, 100);
}

/* -------------------------------------------------------
   LOCATION HELPERS
------------------------------------------------------- */

function convertCoordinate(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

function getCoordinates(data = {}) {
  const possibleLocations = [
    data.location,
    data.coordinates,
    data.geoLocation,
    data.geolocation,
    data.position,
    data.locationCoordinates,
  ];

  for (const location of possibleLocations) {
    if (!location) continue;

    const latitude = convertCoordinate(
      location.latitude ??
        location.lat ??
        location._lat
    );

    const longitude = convertCoordinate(
      location.longitude ??
        location.lng ??
        location.lon ??
        location._long
    );

    if (
      latitude !== null &&
      longitude !== null
    ) {
      return {
        latitude,
        longitude,
      };
    }
  }

  const latitude = convertCoordinate(
    data.latitude ??
      data.lat ??
      data.locationLatitude
  );

  const longitude = convertCoordinate(
    data.longitude ??
      data.lng ??
      data.lon ??
      data.locationLongitude
  );

  if (
    latitude !== null &&
    longitude !== null
  ) {
    return {
      latitude,
      longitude,
    };
  }

  return null;
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function calculateDistanceMiles(
  firstLocation,
  secondLocation
) {
  if (!firstLocation || !secondLocation) {
    return null;
  }

  const earthRadiusMiles = 3958.8;

  const latitudeDifference =
    degreesToRadians(
      secondLocation.latitude -
        firstLocation.latitude
    );

  const longitudeDifference =
    degreesToRadians(
      secondLocation.longitude -
        firstLocation.longitude
    );

  const firstLatitude = degreesToRadians(
    firstLocation.latitude
  );

  const secondLatitude = degreesToRadians(
    secondLocation.latitude
  );

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusMiles * c;
}

/* -------------------------------------------------------
   COMPATIBILITY HELPERS
------------------------------------------------------- */

function valuesMatch(
  firstValue,
  secondValue
) {
  return (
    normalizeText(firstValue) ===
    normalizeText(secondValue)
  );
}

function includesNormalized(
  list = [],
  value = ""
) {
  return list.some((item) =>
    valuesMatch(item, value)
  );
}

function getSharedProfileData(
  currentUser,
  otherUser
) {
  const sharedInterests = (
    otherUser.interests || []
  ).filter((item) =>
    includesNormalized(
      currentUser.interests || [],
      item
    )
  );

  const sharedActivities = (
    otherUser.friendActivities || []
  ).filter((item) =>
    includesNormalized(
      currentUser.friendActivities || [],
      item
    )
  );

  const sharedVibes = (
    otherUser.vibes || []
  ).filter((item) =>
    includesNormalized(
      currentUser.vibes || [],
      item
    )
  );

  const sameSocialEnergy = Boolean(
    currentUser.socialEnergy &&
      otherUser.socialEnergy &&
      valuesMatch(
        currentUser.socialEnergy,
        otherUser.socialEnergy
      )
  );

  return {
    sharedInterests,
    sharedActivities,
    sharedVibes,
    sameSocialEnergy,
  };
}

function countSharedItems(
  currentUser,
  otherUser
) {
  const shared = getSharedProfileData(
    currentUser,
    otherUser
  );

  return (
    shared.sharedInterests.length +
    shared.sharedActivities.length +
    shared.sharedVibes.length +
    (shared.sameSocialEnergy ? 1 : 0)
  );
}

function calculateCompatibility(
  currentUser,
  otherUser
) {
  const sharedCount = countSharedItems(
    currentUser,
    otherUser
  );

  const otherUserAnswerCount =
    (otherUser.interests || []).length +
    (otherUser.friendActivities || []).length +
    (otherUser.vibes || []).length +
    (otherUser.socialEnergy ? 1 : 0);

  const currentUserAnswerCount =
    (currentUser.interests || []).length +
    (currentUser.friendActivities || []).length +
    (currentUser.vibes || []).length +
    (currentUser.socialEnergy ? 1 : 0);

  const possibleMatches = Math.max(
    1,
    Math.min(
      otherUserAnswerCount,
      currentUserAnswerCount
    )
  );

  const percentage = Math.round(
    (sharedCount / possibleMatches) * 100
  );

  return Math.max(
    0,
    Math.min(100, percentage)
  );
}

/* -------------------------------------------------------
   SMALL COMPONENTS
------------------------------------------------------- */

function ProfileAvatar({
  person,
  size = "large",
}) {
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
      {(person.name || "L")
        .charAt(0)
        .toUpperCase()}
    </div>
  );
}

function ModalShell({
  open,
  onClose,
  title,
  children,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 px-3 sm:items-center">
      <div className="max-h-[94vh] w-full max-w-md overflow-y-auto rounded-t-[34px] bg-[#fff8fb] p-5 shadow-2xl sm:rounded-[34px]">
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

/* -------------------------------------------------------
   MATCH CREATED MODAL
------------------------------------------------------- */

function MatchModal({
  person,
  open,
  onMessage,
  onKeepMatching,
}) {
  if (!open || !person) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-end justify-center bg-black/50 px-3 sm:items-center">
      <div className="w-full max-w-md rounded-t-[38px] bg-[#fff8fb] p-6 text-center shadow-2xl sm:rounded-[38px]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] text-white shadow-[0_12px_24px_rgba(237,102,157,0.3)]">
          <Heart
            size={38}
            fill="currentColor"
          />
        </div>

        <h2
          className="mt-4 text-[44px] leading-none tracking-[-0.06em] text-[#eb6aaa]"
          style={{ fontWeight: 1000 }}
        >
          It’s a Match!
        </h2>

        <p className="mt-3 text-base font-bold text-[#80636f]">
          You and {person.name} liked each
          other 💕
        </p>

        <div className="mt-6 rounded-[30px] bg-white p-5 shadow-sm">
          <div className="flex justify-center">
            <ProfileAvatar person={person} />
          </div>

          <h3 className="mt-3 text-2xl font-black text-[#1f1720]">
            {person.name}
            {person.age
              ? `, ${person.age}`
              : ""}
          </h3>

          <p className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-[#96607f]">
            <MapPin size={15} />

            {person.distanceMiles !== null &&
            person.distanceMiles !== undefined
              ? `${Math.round(
                  person.distanceMiles
                )} miles away`
              : person.city ||
                "Location unavailable"}
          </p>

          {person.bio && (
            <p className="mt-3 text-sm font-semibold leading-6 text-[#80636f]">
              {person.bio}
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={onMessage}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white shadow-[0_10px_24px_rgba(231,91,150,0.24)]"
          >
            <MessageCircle size={20} />
            Send Message
          </button>

          <button
            type="button"
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

/* -------------------------------------------------------
   PROFILE TRAITS
------------------------------------------------------- */

function TraitTag({
  label,
  isShared,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-black transition ${
        isShared
          ? "border-[#ed7dab] bg-gradient-to-r from-[#f6a1bd] to-[#f18bb1] text-white shadow-sm"
          : "border-[#f0dce5] bg-[#fff8fb] text-[#725d67]"
      }`}
    >
      {isShared && (
        <Heart
          size={12}
          fill="currentColor"
        />
      )}

      {label}
    </span>
  );
}

function TraitSection({
  title,
  items,
  currentUserItems,
  emptyText,
}) {
  const cleanItems = normalizeArray(items);

  if (!cleanItems.length) {
    return (
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#bd7897]">
          {title}
        </p>

        <p className="mt-2 text-sm font-semibold text-[#a8919b]">
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#bd7897]">
        {title}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {cleanItems.map((item, index) => (
          <TraitTag
            key={`${title}-${item}-${index}`}
            label={item}
            isShared={includesNormalized(
              currentUserItems,
              item
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   MAIN PERSON CARD
------------------------------------------------------- */

function PersonCard({
  person,
  currentUser,
  mode = "discover",
  superLikedYou = false,
  onLike,
  onSuperLike,
  onLikeBack,
  onPass,
  onReport,
  onBlock,
}) {
  const profilePhotos =
    person.profilePhotos?.length > 0
      ? person.profilePhotos
      : person.photoURL
        ? [person.photoURL]
        : [];

  const [
    activePhotoIndex,
    setActivePhotoIndex,
  ] = useState(0);

  const [touchStartX, setTouchStartX] =
    useState(null);

  useEffect(() => {
    setActivePhotoIndex(0);
    setTouchStartX(null);
  }, [person.uid]);

  const sharedCount = countSharedItems(
    currentUser,
    person
  );

  const compatibility =
    calculateCompatibility(
      currentUser,
      person
    );

  const sharedSocialEnergy =
    currentUser.socialEnergy &&
    person.socialEnergy &&
    valuesMatch(
      currentUser.socialEnergy,
      person.socialEnergy
    );

  const currentPhoto =
    profilePhotos[activePhotoIndex] || "";

  const previousPhoto = () => {
    if (profilePhotos.length <= 1) return;

    setActivePhotoIndex((currentIndex) =>
      currentIndex === 0
        ? profilePhotos.length - 1
        : currentIndex - 1
    );
  };

  const nextPhoto = () => {
    if (profilePhotos.length <= 1) return;

    setActivePhotoIndex((currentIndex) =>
      currentIndex ===
      profilePhotos.length - 1
        ? 0
        : currentIndex + 1
    );
  };

  const handleImageTap = (event) => {
    if (profilePhotos.length <= 1) return;

    const bounds =
      event.currentTarget.getBoundingClientRect();

    const tapPosition =
      event.clientX - bounds.left;

    if (tapPosition < bounds.width / 2) {
      previousPhoto();
    } else {
      nextPhoto();
    }
  };

  const handleTouchStart = (event) => {
    setTouchStartX(
      event.touches[0]?.clientX ?? null
    );
  };

  const handleTouchEnd = (event) => {
    if (
      touchStartX === null ||
      profilePhotos.length <= 1
    ) {
      return;
    }

    const endingX =
      event.changedTouches[0]?.clientX ??
      touchStartX;

    const swipeDistance =
      endingX - touchStartX;

    if (Math.abs(swipeDistance) >= 45) {
      if (swipeDistance < 0) {
        nextPhoto();
      } else {
        previousPhoto();
      }
    }

    setTouchStartX(null);
  };

  return (
    <div className="overflow-hidden rounded-[38px] bg-white shadow-[0_14px_36px_rgba(239,148,181,0.16)]">
      <div
        className="relative h-[30rem] select-none overflow-hidden bg-[#f8dce6]"
        onClick={handleImageTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentPhoto ? (
          <img
            key={currentPhoto}
            src={currentPhoto}
            alt={`${person.name} profile ${
              activePhotoIndex + 1
            }`}
            draggable="false"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f5a2bc] via-[#ef87ad] to-[#f78e9b] text-8xl font-black text-white">
            {(person.name || "L")
              .charAt(0)
              .toUpperCase()}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {profilePhotos.length > 1 && (
          <div
            className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 gap-2"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {profilePhotos.map(
              (photo, index) => (
                <button
                  key={`${photo}-${index}`}
                  type="button"
                  aria-label={`View photo ${
                    index + 1
                  }`}
                  onClick={() =>
                    setActivePhotoIndex(index)
                  }
                  className={`h-2 rounded-full shadow-sm transition-all ${
                    activePhotoIndex === index
                      ? "w-7 bg-white"
                      : "w-2 bg-white/55"
                  }`}
                />
              )
            )}
          </div>
        )}

        <div
          className="absolute right-5 top-5 z-30 flex gap-3"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <button
            type="button"
            onClick={() => onReport(person)}
            aria-label={`Report ${person.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md"
          >
            <Flag size={18} />
          </button>

          <button
            type="button"
            onClick={() => onBlock(person)}
            aria-label={`Block ${person.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md"
          >
            <Ban size={18} />
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-5 left-5 right-5 text-white">
          {mode === "likedYou" &&
            superLikedYou && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f7b5ca] to-[#ec64a8] px-4 py-2 text-xs font-black text-white shadow-lg">
                <Star
                  size={14}
                  fill="currentColor"
                />
                Super liked you
              </div>
            )}

          <div className="mb-3 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f06fa6]/90 px-4 py-2 text-xs font-black shadow-lg backdrop-blur">
              <Sparkles size={14} />
              {compatibility}% compatible
            </div>

            {sharedCount > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-2 text-xs font-black backdrop-blur">
                <Heart
                  size={14}
                  fill="currentColor"
                />

                {sharedCount}{" "}
                {sharedCount === 1
                  ? "thing"
                  : "things"}{" "}
                in common
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-4xl font-black tracking-[-0.05em]">
              {person.name}
              {person.age
                ? `, ${person.age}`
                : ""}
            </h2>

            {person.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur">
                <ShieldCheck size={14} />
                Verified
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-black text-white/90">
            <span className="flex items-center gap-2">
              <MapPin size={16} />

              {person.distanceMiles !== null &&
              person.distanceMiles !==
                undefined
                ? `${Math.round(
                    person.distanceMiles
                  )} miles away`
                : person.city ||
                  "Location unavailable"}
            </span>

            {person.city && (
              <span>{person.city}</span>
            )}
          </div>

          {person.bio && (
            <p className="mt-4 text-base font-semibold leading-7 text-white/95">
              {person.bio}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6 p-5">
        <TraitSection
          title="Interests"
          items={person.interests}
          currentUserItems={
            currentUser.interests || []
          }
          emptyText="No interests added yet."
        />

        <TraitSection
          title="What they’d do with friends"
          items={person.friendActivities}
          currentUserItems={
            currentUser.friendActivities || []
          }
          emptyText="No activities added yet."
        />

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#bd7897]">
            Social energy
          </p>

          {person.socialEnergy ? (
            <div className="mt-3">
              <TraitTag
                label={person.socialEnergy}
                isShared={
                  sharedSocialEnergy
                }
              />
            </div>
          ) : (
            <p className="mt-2 text-sm font-semibold text-[#a8919b]">
              No social energy selected yet.
            </p>
          )}
        </div>

        <TraitSection
          title="Vibes"
          items={person.vibes}
          currentUserItems={
            currentUser.vibes || []
          }
          emptyText="No vibes added yet."
        />

        <div className="rounded-[24px] bg-[#fff5f9] px-4 py-3">
          <p className="text-center text-xs font-bold leading-5 text-[#9a6b80]">
            Pink tags show answers you and{" "}
            {person.name} have in common.
          </p>
        </div>
      </div>

      {mode === "likedYou" ? (
        <div className="grid grid-cols-2 gap-3 border-t border-[#f8e5ed] p-5">
          <button
            type="button"
            onClick={() => onPass(person)}
            className="flex items-center justify-center gap-2 rounded-full border border-[#f1d8e3] bg-white py-4 text-sm font-black text-[#80636f]"
          >
            <X size={21} />
            Pass
          </button>

          <button
            type="button"
            onClick={() =>
              onLikeBack(person)
            }
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-sm font-black text-white"
          >
            <Heart
              size={21}
              fill="currentColor"
            />
            Like Back
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 border-t border-[#f8e5ed] p-5">
          <button
            type="button"
            onClick={() => onPass(person)}
            aria-label={`Pass on ${person.name}`}
            className="flex items-center justify-center rounded-full border border-[#f1d8e3] bg-white py-4 text-lg font-black text-[#80636f]"
          >
            <X size={23} />
          </button>

          <button
            type="button"
            onClick={() =>
              onSuperLike(person)
            }
            aria-label={`Super like ${person.name}`}
            className="flex items-center justify-center rounded-full bg-gradient-to-r from-[#f4c1d2] to-[#f6a9c3] py-4 text-lg font-black text-white"
          >
            <Star
              size={23}
              fill="currentColor"
            />
          </button>

          <button
            type="button"
            onClick={() => onLike(person)}
            aria-label={`Like ${person.name}`}
            className="flex items-center justify-center rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white"
          >
            <Heart
              size={23}
              fill="currentColor"
            />
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   LIKED YOU MODAL
------------------------------------------------------- */

function LikedYouModal({
  open,
  onClose,
  people,
  currentUser,
  superLikedBy,
  onLikeBack,
  onPass,
  onReport,
  onBlock,
}) {
  const [activeIndex, setActiveIndex] =
    useState(0);

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (
      people.length &&
      activeIndex > people.length - 1
    ) {
      setActiveIndex(
        Math.max(0, people.length - 1)
      );
    }
  }, [people, activeIndex]);

  if (!open) return null;

  const currentPerson =
    people[activeIndex];

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Liked You"
    >
      {!currentPerson ? (
        <div className="rounded-[28px] bg-white p-8 text-center shadow-sm">
          <Heart
            size={42}
            className="mx-auto text-[#ec64a8]"
          />

          <h3 className="mt-4 text-xl font-black text-[#2b1d28]">
            No new likes yet
          </h3>

          <p className="mt-2 text-sm font-semibold leading-6 text-[#80636f]">
            When someone likes your profile,
            they’ll appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between rounded-[24px] bg-white px-4 py-3 shadow-sm">
            <button
              type="button"
              disabled={people.length <= 1}
              onClick={() =>
                setActiveIndex((index) =>
                  index === 0
                    ? people.length - 1
                    : index - 1
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0f6] text-[#d94b93] disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="text-center">
              <p className="text-sm font-black text-[#2b1d28]">
                {activeIndex + 1} of{" "}
                {people.length}
              </p>

              <p className="text-xs font-bold text-[#80636f]">
                Review their full profile
              </p>
            </div>

            <button
              type="button"
              disabled={people.length <= 1}
              onClick={() =>
                setActiveIndex((index) =>
                  index === people.length - 1
                    ? 0
                    : index + 1
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0f6] text-[#d94b93] disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <PersonCard
            person={currentPerson}
            currentUser={currentUser}
            mode="likedYou"
            superLikedYou={superLikedBy.includes(
              currentPerson.uid
            )}
            onLikeBack={onLikeBack}
            onPass={onPass}
            onReport={onReport}
            onBlock={onBlock}
          />
        </>
      )}
    </ModalShell>
  );
}

/* -------------------------------------------------------
   PROFILE LIST MODAL
------------------------------------------------------- */

function PersonListModal({
  open,
  onClose,
  title,
  people,
  emptyText,
  onChat,
  showChat = false,
  waitingText = false,
}) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={title}
    >
      <div className="space-y-3">
        {people.length ? (
          people.map((person) => (
            <div
              key={person.uid}
              className="flex items-center justify-between gap-3 rounded-[26px] bg-white p-4 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ProfileAvatar
                  person={person}
                  size="small"
                />

                <div className="min-w-0">
                  <p className="truncate text-base font-black text-[#1f1720]">
                    {person.name}
                    {person.age
                      ? `, ${person.age}`
                      : ""}
                  </p>

                  <p className="truncate text-sm font-semibold text-[#80636f]">
                    {person.distanceMiles !==
                      null &&
                    person.distanceMiles !==
                      undefined
                      ? `${Math.round(
                          person.distanceMiles
                        )} miles away`
                      : person.city ||
                        "Location unavailable"}
                  </p>

                  {waitingText && (
                    <p className="mt-1 text-xs font-black text-[#ec64a8]">
                      Waiting for them to like
                      you back
                    </p>
                  )}
                </div>
              </div>

              {showChat && (
                <button
                  type="button"
                  onClick={() =>
                    onChat(person)
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-[#f4a1bd] to-[#f06aa8] text-white"
                >
                  <MessageCircle size={18} />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-[26px] bg-white p-6 text-center shadow-sm">
            <Sparkles
              size={34}
              className="mx-auto mb-3 text-[#f089b0]"
            />

            <p className="font-black text-[#80636f]">
              {emptyText}
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------
   MAIN MATCH PAGE
------------------------------------------------------- */

export default function Match() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] =
    useState(getAuthProfile());

  const [people, setPeople] = useState([]);

  const [activity, setActivity] = useState(
    defaultActivity()
  );

  const [loadingUser, setLoadingUser] =
    useState(true);

  const [loadingPeople, setLoadingPeople] =
    useState(true);

  const [likedYouOpen, setLikedYouOpen] =
    useState(false);

  const [youLikedOpen, setYouLikedOpen] =
    useState(false);

  const [passedOpen, setPassedOpen] =
    useState(false);

  const [matchesOpen, setMatchesOpen] =
    useState(false);

  const [newMatch, setNewMatch] =
    useState(null);

  const uid = auth.currentUser?.uid || "";

  /* -------------------------------------------------------
     LOAD CURRENT USER
  ------------------------------------------------------- */

  useEffect(() => {
    if (!uid) {
      setLoadingUser(false);
      return undefined;
    }

    const userRef = doc(
      db,
      "users",
      uid
    );

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          setCurrentUser({
            ...getAuthProfile(),
            ...data,
            uid,
            name: getUserName(data),

            photoURL:
              getProfilePhoto(data) ||
              auth.currentUser?.photoURL ||
              "",

            profilePhotos:
              getProfilePhotos(data),

            city:
              data.city ||
              data.displayLocation ||
              data.location
                ?.displayLocation ||
              data.location?.city ||
              "",

            interests: normalizeArray(
              data.interests
            ),

            friendActivities:
              getFriendActivities(data),

            socialEnergy:
              getSocialEnergy(data),

            vibes: getVibes(data),

            location:
              getCoordinates(data),

            distancePreference:
              getDistancePreference(data),

            verified:
              data.verified === true ||
              data.isVerified === true ||
              data.verificationStatus ===
                "approved" ||
              data.verificationStatus ===
                "verified",
          });
        } else {
          setCurrentUser(
            getAuthProfile()
          );
        }

        setLoadingUser(false);
      },
      (error) => {
        console.error(
          "Unable to load current user:",
          error
        );

        setLoadingUser(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  /* -------------------------------------------------------
     LOAD ALL USERS
  ------------------------------------------------------- */

  useEffect(() => {
    if (!uid) {
      setPeople([]);
      setLoadingPeople(false);
      return undefined;
    }

    const usersQuery = query(
      collection(db, "users")
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const signedInEmail =
          auth.currentUser?.email?.toLowerCase() ||
          "";

        const realUsers = snapshot.docs
          .map((userDocument) => {
            const data =
              userDocument.data();

            return {
              ...data,
              uid: userDocument.id,
              name: getUserName(data),
              email: data.email || "",

              photoURL:
                getProfilePhoto(data),

              profilePhotos:
                getProfilePhotos(data),

              city:
                data.city ||
                data.displayLocation ||
                data.location
                  ?.displayLocation ||
                data.location?.city ||
                "",

              interests: normalizeArray(
                data.interests
              ),

              friendActivities:
                getFriendActivities(data),

              socialEnergy:
                getSocialEnergy(data),

              vibes: getVibes(data),

              location:
                getCoordinates(data),

              distanceMiles: null,

              verified:
                data.verified === true ||
                data.isVerified === true ||
                data.verificationStatus ===
                  "approved" ||
                data.verificationStatus ===
                  "verified",
            };
          })
          .filter((person) => {
            const sameUid =
              person.uid === uid;

            const personEmail =
              person.email?.toLowerCase() ||
              "";

            const sameEmail =
              personEmail &&
              signedInEmail &&
              personEmail === signedInEmail;

            const deleted =
              person.deleted === true ||
              person.accountDeleted ===
                true ||
              person.status === "deleted";

            return (
              !sameUid &&
              !sameEmail &&
              !deleted
            );
          });

        setPeople(realUsers);
        setLoadingPeople(false);
      },
      (error) => {
        console.error(
          "Unable to load Match profiles:",
          error
        );

        setPeople([]);
        setLoadingPeople(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  /* -------------------------------------------------------
     LOAD MATCH ACTIVITY
  ------------------------------------------------------- */

  useEffect(() => {
    if (!uid) return undefined;

    const activityRef = doc(
      db,
      "matchActivity",
      uid
    );

    const unsubscribe = onSnapshot(
      activityRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          setActivity({
            ...defaultActivity(),
            ...snapshot.data(),
          });
        } else {
          await setDoc(
            activityRef,
            defaultActivity()
          );
        }
      },
      (error) => {
        console.error(
          "Unable to load Match activity:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, [uid]);

  /* -------------------------------------------------------
     ACTIVITY FUNCTIONS
  ------------------------------------------------------- */

  const updateActivity = async (
    nextActivity
  ) => {
    if (!uid) return;

    await setDoc(
      doc(
        db,
        "matchActivity",
        uid
      ),
      {
        ...nextActivity,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const createChatWithPerson = async (
    person
  ) => {
    if (!uid || !person?.uid) {
      return null;
    }

    const chatId = [uid, person.uid]
      .sort()
      .join("_");

    const chatRef = doc(
      db,
      "chats",
      chatId
    );

    const chatSnapshot =
      await getDoc(chatRef);

    if (!chatSnapshot.exists()) {
      await setDoc(chatRef, {
        id: chatId,
        type: "match",
        title: person.name,
        members: [uid, person.uid],
        memberIds: [uid, person.uid],

        memberNames: {
          [uid]: currentUser.name,
          [person.uid]: person.name,
        },

        memberPhotos: {
          [uid]:
            currentUser.photoURL || "",
          [person.uid]:
            person.photoURL || "",
        },

        lastMessage:
          "You matched 💕 Say hi!",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return chatId;
  };

  const openChatWithPerson = async (
    person
  ) => {
    const chatId =
      await createChatWithPerson(person);

    if (chatId) {
      navigate(`/chat/${chatId}`);
    }
  };

  const markLiked = async (
    person,
    type
  ) => {
    if (!uid || !person?.uid) return;

    const targetActivityRef = doc(
      db,
      "matchActivity",
      person.uid
    );

    const personActivitySnapshot =
      await getDoc(targetActivityRef);

    const personActivity =
      personActivitySnapshot.exists()
        ? {
            ...defaultActivity(),
            ...personActivitySnapshot.data(),
          }
        : defaultActivity();

    const nextActivity = {
      ...activity,
      liked: [...(activity.liked || [])],
      superLiked: [
        ...(activity.superLiked || []),
      ],
      likedBy: [
        ...(activity.likedBy || []),
      ],
      superLikedBy: [
        ...(activity.superLikedBy || []),
      ],
      passed: [...(activity.passed || [])],
      matches: [
        ...(activity.matches || []),
      ],
    };

    nextActivity.passed =
      nextActivity.passed.filter(
        (personId) =>
          personId !== person.uid
      );

    if (
      type === "like" &&
      !nextActivity.liked.includes(
        person.uid
      )
    ) {
      nextActivity.liked.push(
        person.uid
      );
    }

    if (
      type === "superLike" &&
      !nextActivity.superLiked.includes(
        person.uid
      )
    ) {
      nextActivity.superLiked.push(
        person.uid
      );
    }

    await setDoc(
      targetActivityRef,
      {
        likedBy: arrayUnion(uid),

        ...(type === "superLike"
          ? {
              superLikedBy:
                arrayUnion(uid),
            }
          : {}),

        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const theyLikedMe =
      personActivity.liked?.includes(uid) ||
      personActivity.superLiked?.includes(
        uid
      );

    if (
      theyLikedMe &&
      !nextActivity.matches.includes(
        person.uid
      )
    ) {
      nextActivity.matches.push(
        person.uid
      );

      nextActivity.likedBy =
        nextActivity.likedBy.filter(
          (personId) =>
            personId !== person.uid
        );

      nextActivity.superLikedBy =
        nextActivity.superLikedBy.filter(
          (personId) =>
            personId !== person.uid
        );

      await setDoc(
        targetActivityRef,
        {
          matches: arrayUnion(uid),
          likedBy: arrayRemove(uid),
          superLikedBy: arrayRemove(uid),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await createChatWithPerson(person);

      setNewMatch(person);
      setLikedYouOpen(false);
    }

    await updateActivity(nextActivity);
  };

  const passPerson = async (person) => {
    if (!person?.uid) return;

    const previouslyLiked = (
      activity.liked || []
    ).includes(person.uid);

    const previouslySuperLiked = (
      activity.superLiked || []
    ).includes(person.uid);

    const nextActivity = {
      ...activity,

      passed: [
        ...new Set([
          ...(activity.passed || []),
          person.uid,
        ]),
      ],

      liked: (
        activity.liked || []
      ).filter(
        (personId) =>
          personId !== person.uid
      ),

      superLiked: (
        activity.superLiked || []
      ).filter(
        (personId) =>
          personId !== person.uid
      ),

      likedBy: (
        activity.likedBy || []
      ).filter(
        (personId) =>
          personId !== person.uid
      ),

      superLikedBy: (
        activity.superLikedBy || []
      ).filter(
        (personId) =>
          personId !== person.uid
      ),
    };

    if (
      previouslyLiked ||
      previouslySuperLiked
    ) {
      await setDoc(
        doc(
          db,
          "matchActivity",
          person.uid
        ),
        {
          likedBy: arrayRemove(uid),
          superLikedBy:
            arrayRemove(uid),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    await updateActivity(nextActivity);
  };

  const blockPerson = async (person) => {
    const confirmed = window.confirm(
      `Block ${person.name}? They will no longer appear in Match.`
    );

    if (!confirmed) return;

    const nextActivity = {
      ...activity,

      blocked: [
        ...new Set([
          ...(activity.blocked || []),
          person.uid,
        ]),
      ],

      liked: (
        activity.liked || []
      ).filter(
        (personId) =>
          personId !== person.uid
      ),

      superLiked: (
        activity.superLiked || []
      ).filter(
        (personId) =>
          personId !== person.uid
      ),

      likedBy: (
        activity.likedBy || []
      ).filter(
        (personId) =>
          personId !== person.uid
      ),

      superLikedBy: (
        activity.superLikedBy || []
      ).filter(
        (personId) =>
          personId !== person.uid
      ),

      matches: (
        activity.matches || []
      ).filter(
        (personId) =>
          personId !== person.uid
      ),
    };

    await setDoc(
      doc(
        db,
        "matchActivity",
        person.uid
      ),
      {
        likedBy: arrayRemove(uid),
        superLikedBy: arrayRemove(uid),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await updateActivity(nextActivity);
  };

  const reportPerson = async (person) => {
    if (!uid) return;

    const confirmed = window.confirm(
      `Report ${person.name}'s profile?`
    );

    if (!confirmed) return;

    await addDoc(
      collection(db, "reports"),
      {
        type: "user",
        reportedUserId: person.uid,
        reportedUserName: person.name,
        reporterId: uid,
        createdAt: serverTimestamp(),
        status: "pending",
      }
    );

    const nextActivity = {
      ...activity,

      reported: [
        ...new Set([
          ...(activity.reported || []),
          person.uid,
        ]),
      ],

      likedBy: (
        activity.likedBy || []
      ).filter(
        (personId) =>
          personId !== person.uid
      ),

      superLikedBy: (
        activity.superLikedBy || []
      ).filter(
        (personId) =>
          personId !== person.uid
      ),
    };

    await updateActivity(nextActivity);

    window.alert(
      "Profile reported. Thank you for helping keep Limi safe."
    );
  };

  /* -------------------------------------------------------
     DISTANCE CALCULATIONS
  ------------------------------------------------------- */

  const peopleWithDistance =
    useMemo(() => {
      if (!currentUser.location) {
        return people.map((person) => ({
          ...person,
          distanceMiles: null,
        }));
      }

      return people.map((person) => ({
        ...person,

        distanceMiles:
          calculateDistanceMiles(
            currentUser.location,
            person.location
          ),
      }));
    }, [
      people,
      currentUser.location,
    ]);

  const nearbyPeople = useMemo(() => {
    return peopleWithDistance
      .filter((person) => {
        if (
          (
            activity.blocked || []
          ).includes(person.uid)
        ) {
          return false;
        }

        if (
          (
            activity.reported || []
          ).includes(person.uid)
        ) {
          return false;
        }

        if (
          person.distanceMiles === null ||
          person.distanceMiles === undefined
        ) {
          return false;
        }

        return (
          person.distanceMiles <=
          currentUser.distancePreference
        );
      })
      .sort(
        (
          firstPerson,
          secondPerson
        ) => {
          const sharedDifference =
            countSharedItems(
              currentUser,
              secondPerson
            ) -
            countSharedItems(
              currentUser,
              firstPerson
            );

          if (sharedDifference !== 0) {
            return sharedDifference;
          }

          return (
            firstPerson.distanceMiles -
            secondPerson.distanceMiles
          );
        }
      );
  }, [
    peopleWithDistance,
    currentUser,
    activity.blocked,
    activity.reported,
  ]);

  /* -------------------------------------------------------
     LISTS
  ------------------------------------------------------- */

  const discoverPeople = useMemo(() => {
    return nearbyPeople.filter(
      (person) =>
        !(
          activity.liked || []
        ).includes(person.uid) &&
        !(
          activity.superLiked || []
        ).includes(person.uid) &&
        !(
          activity.likedBy || []
        ).includes(person.uid) &&
        !(
          activity.passed || []
        ).includes(person.uid) &&
        !(
          activity.matches || []
        ).includes(person.uid)
    );
  }, [nearbyPeople, activity]);

  const likedYouPeople = useMemo(() => {
    return nearbyPeople
      .filter(
        (person) =>
          (
            activity.likedBy || []
          ).includes(person.uid) &&
          !(
            activity.matches || []
          ).includes(person.uid) &&
          !(
            activity.passed || []
          ).includes(person.uid)
      )
      .sort(
        (
          firstPerson,
          secondPerson
        ) => {
          const firstIsSuper = (
            activity.superLikedBy || []
          ).includes(firstPerson.uid);

          const secondIsSuper = (
            activity.superLikedBy || []
          ).includes(secondPerson.uid);

          if (
            firstIsSuper !== secondIsSuper
          ) {
            return secondIsSuper ? 1 : -1;
          }

          return (
            calculateCompatibility(
              currentUser,
              secondPerson
            ) -
            calculateCompatibility(
              currentUser,
              firstPerson
            )
          );
        }
      );
  }, [
    nearbyPeople,
    activity.likedBy,
    activity.superLikedBy,
    activity.matches,
    activity.passed,
    currentUser,
  ]);

  const youLikedPeople =
    peopleWithDistance.filter(
      (person) =>
        ((
          activity.liked || []
        ).includes(person.uid) ||
          (
            activity.superLiked || []
          ).includes(person.uid)) &&
        !(
          activity.matches || []
        ).includes(person.uid)
    );

  const passedPeople =
    peopleWithDistance.filter((person) =>
      (
        activity.passed || []
      ).includes(person.uid)
    );

  const matchedPeople =
    peopleWithDistance.filter((person) =>
      (
        activity.matches || []
      ).includes(person.uid)
    );

  const currentCard = discoverPeople[0];

  const loading =
    loadingUser || loadingPeople;

  /* -------------------------------------------------------
     PAGE
  ------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#fff6fa] pb-28">
      <div className="mx-auto max-w-md px-4 pt-5">
        {/* PINK MATCH HEADER */}

        <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] p-5 text-white shadow-[0_14px_36px_rgba(239,148,181,0.20)]">
          {/* Profile-style circles */}

          <div className="pointer-events-none absolute -left-12 bottom-[-45px] h-40 w-40 rounded-full bg-white/10" />

          <div className="pointer-events-none absolute right-[-45px] top-[-45px] h-48 w-48 rounded-full bg-white/15" />

          <div className="pointer-events-none absolute right-16 top-32 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative z-10">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white shadow-[0_10px_24px_rgba(100,30,70,0.15)] backdrop-blur-md">
                <Heart size={28} />
              </div>

              <h1
                className="mt-4 text-[40px] leading-none tracking-[-0.05em] text-white"
                style={{ fontWeight: 1000 }}
              >
                Find your people
              </h1>

              <p className="mx-auto mt-3 max-w-[310px] text-sm font-semibold leading-6 text-white/90">
                Discover nearby people who
                share your interests, social
                energy, and vibe.
              </p>
            </div>

            {/* FROSTED LOCATION CARD */}

            <div className="mt-6 rounded-[28px] border border-white/30 bg-white/20 p-5 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
                  <MapPin size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white/80">
                    Discovering near
                  </p>

                  <p className="mt-1 truncate text-xl font-black text-white">
                    {currentUser.city ||
                      "Your location"}
                  </p>
                </div>

                <div className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-black text-[#e85da2] shadow-sm">
                  {
                    currentUser.distancePreference
                  }{" "}
                  mi
                </div>
              </div>

              <p className="mt-4 text-sm font-semibold leading-6 text-white/90">
                Showing profiles within{" "}
                {
                  currentUser.distancePreference
                }{" "}
                miles. Change your distance
                anytime from Edit Profile.
              </p>
            </div>

            {/* MATCH ACTIVITY BUTTONS */}

            <div className="mt-5 grid grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() =>
                  setLikedYouOpen(true)
                }
                className="relative rounded-2xl border border-white/20 bg-white/20 px-2 py-4 text-center backdrop-blur-md transition active:scale-[0.97]"
              >
                {likedYouPeople.length >
                  0 && (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-white ring-2 ring-[#ec64a8]" />
                )}

                <Heart
                  size={20}
                  fill={
                    likedYouPeople.length
                      ? "currentColor"
                      : "none"
                  }
                  className="mx-auto text-white"
                />

                <p className="mt-1 text-[11px] font-black text-white">
                  Liked You{" "}
                  {likedYouPeople.length}
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setYouLikedOpen(true)
                }
                className="rounded-2xl border border-white/20 bg-white/20 px-2 py-4 text-center backdrop-blur-md transition active:scale-[0.97]"
              >
                <Heart
                  size={20}
                  className="mx-auto text-white"
                />

                <p className="mt-1 text-[11px] font-black text-white">
                  You Liked{" "}
                  {youLikedPeople.length}
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setPassedOpen(true)
                }
                className="rounded-2xl border border-white/20 bg-white/20 px-2 py-4 text-center backdrop-blur-md transition active:scale-[0.97]"
              >
                <RotateCcw
                  size={20}
                  className="mx-auto text-white"
                />

                <p className="mt-1 text-[11px] font-black text-white">
                  Passed{" "}
                  {passedPeople.length}
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setMatchesOpen(true)
                }
                className="rounded-2xl border border-white/20 bg-white/20 px-2 py-4 text-center backdrop-blur-md transition active:scale-[0.97]"
              >
                <MessageCircle
                  size={20}
                  className="mx-auto text-white"
                />

                <p className="mt-1 text-[11px] font-black text-white">
                  Matches{" "}
                  {matchedPeople.length}
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* PROFILE DISPLAY AREA */}

        <div className="mt-6">
          {loading ? (
            <div className="rounded-[36px] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#f7c5d7] border-t-[#eb6aaa]" />

              <p className="mt-4 font-black text-[#80636f]">
                Finding people near you...
              </p>
            </div>
          ) : !currentUser.location ? (
            <div className="rounded-[36px] bg-white p-9 text-center shadow-sm">
              <MapPin
                size={44}
                className="mx-auto mb-4 text-[#f089b0]"
              />

              <h3 className="text-2xl font-black text-[#e85da2]">
                Location needed
              </h3>

              <p className="mt-3 text-sm font-semibold leading-6 text-[#80636f]">
                Update your location in Edit
                Profile so Limi can calculate
                the real distance between
                users.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/profile")
                }
                className="mt-6 w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 font-black text-white"
              >
                Go to Profile
              </button>
            </div>
          ) : currentCard ? (
            <PersonCard
              person={currentCard}
              currentUser={currentUser}
              onLike={(person) =>
                markLiked(person, "like")
              }
              onSuperLike={(person) =>
                markLiked(
                  person,
                  "superLike"
                )
              }
              onPass={passPerson}
              onReport={reportPerson}
              onBlock={blockPerson}
            />
          ) : (
            <div className="rounded-[36px] bg-white p-10 text-center shadow-sm">
              <Users
                size={44}
                className="mx-auto mb-4 text-[#f089b0]"
              />

              <h3 className="text-2xl font-black text-[#e85da2]">
                No more profiles nearby
              </h3>

              <p className="mt-3 text-sm font-semibold leading-6 text-[#80636f]">
                There are currently no new
                profiles within{" "}
                {
                  currentUser.distancePreference
                }{" "}
                miles of{" "}
                {currentUser.city ||
                  "your location"}
                .
              </p>

              {likedYouPeople.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setLikedYouOpen(true)
                  }
                  className="mt-6 w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 font-black text-white"
                >
                  Review Who Liked You
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <LikedYouModal
        open={likedYouOpen}
        onClose={() =>
          setLikedYouOpen(false)
        }
        people={likedYouPeople}
        currentUser={currentUser}
        superLikedBy={
          activity.superLikedBy || []
        }
        onLikeBack={(person) =>
          markLiked(person, "like")
        }
        onPass={passPerson}
        onReport={reportPerson}
        onBlock={blockPerson}
      />

      <PersonListModal
        open={youLikedOpen}
        onClose={() =>
          setYouLikedOpen(false)
        }
        title="You Liked"
        people={youLikedPeople}
        emptyText="You haven’t liked anyone yet."
        waitingText
      />

      <PersonListModal
        open={passedOpen}
        onClose={() =>
          setPassedOpen(false)
        }
        title="Passed"
        people={passedPeople}
        emptyText="No passed profiles yet."
      />

      <PersonListModal
        open={matchesOpen}
        onClose={() =>
          setMatchesOpen(false)
        }
        title="Matches"
        people={matchedPeople}
        emptyText="No matches yet. Keep discovering 💕"
        showChat
        onChat={openChatWithPerson}
      />

      <MatchModal
        open={Boolean(newMatch)}
        person={newMatch}
        onMessage={() => {
          if (newMatch) {
            openChatWithPerson(newMatch);
          }
        }}
        onKeepMatching={() =>
          setNewMatch(null)
        }
      />
    </div>
  );
}