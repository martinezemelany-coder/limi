import { getFriendlyFirebaseErrorMessage } from "../lib/firebaseError";

import React, { useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  Camera,
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
  MapPin,
  Plus,
  X,
} from "lucide-react";

import { auth, db, storage } from "../lib/firebase";

import { updateCurrentUserLocation } from "../lib/location";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

/* -------------------------------------------------------
   INTEREST OPTIONS
------------------------------------------------------- */

const interestsOptions = [
  "Anime",
  "Movies",
  "TV Shows",
  "Music",
  "Gaming",
  "Books",
  "Podcasts",
  "K-Pop",
  "Art",
  "Photography",
  "Fashion",
  "Content Creation",
  "Business",
  "Technology",
  "Entrepreneurship",
  "Self Development",
  "Travel",
  "Beauty",
  "Skincare",
  "Pets",
];

/* -------------------------------------------------------
   FRIEND ACTIVITY OPTIONS
------------------------------------------------------- */

const activityOptions = [
  "Cafe Hopping",
  "Brunch",
  "Shopping",
  "Trying New Restaurants",
  "Gym",
  "Pilates",
  "Walks",
  "Running",
  "Beach Days",
  "Movie Nights",
  "Painting & Crafts",
  "Concerts",
  "Traveling",
  "Road Trips",
  "Hiking",
  "Nail Dates",
  "Spa Days",
  "Skincare Nights",
  "Night Out",
  "Dancing",
  "Live Events",
];

/* -------------------------------------------------------
   VIBE OPTIONS
------------------------------------------------------- */

const vibeOptions = [
  "Chill",
  "Adventurous",
  "Fitness Girlie",
  "Study Buddy",
  "Creative",
  "Cafe Lover",
  "Travel Girlie",
  "Foodie",
  "Career Focused",
  "Social Butterfly",
  "Homebody",
  "Deep Conversations",
];

/* -------------------------------------------------------
   SOCIAL ENERGY
------------------------------------------------------- */

const socialEnergyOptions = [
  "Introvert",
  "Ambivert",
  "Extrovert",
];

/* -------------------------------------------------------
   ONBOARDING
------------------------------------------------------- */

export default function Onboarding() {
  const navigate = useNavigate();

  /* -------------------------------------------------------
     GENERAL STATE
  ------------------------------------------------------- */

  const [step, setStep] = useState(1);

  const [saving, setSaving] =
    useState(false);

  const [
    showVerificationForm,
    setShowVerificationForm,
  ] = useState(false);

  /* -------------------------------------------------------
     PROFILE STATE
  ------------------------------------------------------- */

  const [name, setName] =
    useState("");

  const [age, setAge] =
    useState("");

  const [city, setCity] =
    useState("");

  const [bio, setBio] =
    useState("");

  /* -------------------------------------------------------
     LOCATION STATE
  ------------------------------------------------------- */

  const [location, setLocation] =
    useState({
      city: "",
      state: "",
      country: "US",
      lat: null,
      lng: null,
    });

  const [
    radiusMiles,
    setRadiusMiles,
  ] = useState(25);

  const [
    gettingLocation,
    setGettingLocation,
  ] = useState(false);

  /* -------------------------------------------------------
     PROFILE PHOTOS

     0 = required main photo
     1 = optional
     2 = optional
  ------------------------------------------------------- */

  const [
    photoFiles,
    setPhotoFiles,
  ] = useState([
    null,
    null,
    null,
  ]);

  const [
    photoPreviews,
    setPhotoPreviews,
  ] = useState([
    "",
    "",
    "",
  ]);

  /* -------------------------------------------------------
     VERIFICATION
  ------------------------------------------------------- */

  const [idFile, setIdFile] =
    useState(null);

  const [
    idPreview,
    setIdPreview,
  ] = useState("");

  const [
    selfieFile,
    setSelfieFile,
  ] = useState(null);

  const [
    selfiePreview,
    setSelfiePreview,
  ] = useState("");

  /* -------------------------------------------------------
     PERSONALITY / INTERESTS
  ------------------------------------------------------- */

  const [
    selectedInterests,
    setSelectedInterests,
  ] = useState([]);

  const [
    selectedActivities,
    setSelectedActivities,
  ] = useState([]);

  const [
    selectedVibes,
    setSelectedVibes,
  ] = useState([]);

  const [
    socialEnergy,
    setSocialEnergy,
  ] = useState("");

  /* -------------------------------------------------------
     STEPS

     1 Profile
     2 Interests
     3 Activities / Social Energy / Vibes
     4 Photos
     5 Location
     6 Verification
  ------------------------------------------------------- */

  const totalSteps = 6;

  const progress =
    `${(step / totalSteps) * 100}%`;

  const numberOfPhotos =
    photoPreviews.filter(Boolean).length;

  /* -------------------------------------------------------
     OPTION HELPERS
  ------------------------------------------------------- */

  const toggleUnlimited = (
    item,
    list,
    setList
  ) => {
    if (list.includes(item)) {
      setList(
        list.filter(
          (selectedItem) =>
            selectedItem !== item
        )
      );

      return;
    }

    setList([
      ...list,
      item,
    ]);
  };

  const toggleLimited = (
    item,
    list,
    setList,
    limit
  ) => {
    if (list.includes(item)) {
      setList(
        list.filter(
          (selectedItem) =>
            selectedItem !== item
        )
      );

      return;
    }

    if (list.length >= limit) {
      window.alert(
        `You can only choose up to ${limit}.`
      );

      return;
    }

    setList([
      ...list,
      item,
    ]);
  };

  /* -------------------------------------------------------
     PROFILE PHOTO CHANGE
  ------------------------------------------------------- */

  const handleProfilePhotoChange = (
    event,
    photoIndex
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

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

    const maximumFileSize =
      10 * 1024 * 1024;

    if (
      file.size >
      maximumFileSize
    ) {
      window.alert(
        "Please choose an image smaller than 10 MB."
      );

      return;
    }

    const previewURL =
      URL.createObjectURL(file);

    setPhotoFiles(
      (currentFiles) => {
        const updatedFiles = [
          ...currentFiles,
        ];

        updatedFiles[
          photoIndex
        ] = file;

        return updatedFiles;
      }
    );

    setPhotoPreviews(
      (currentPreviews) => {
        const updatedPreviews = [
          ...currentPreviews,
        ];

        const previousPreview =
          updatedPreviews[
            photoIndex
          ];

        if (
          previousPreview &&
          previousPreview.startsWith(
            "blob:"
          )
        ) {
          URL.revokeObjectURL(
            previousPreview
          );
        }

        updatedPreviews[
          photoIndex
        ] = previewURL;

        return updatedPreviews;
      }
    );

    /*
      Lets the user select the
      same image again after removing it.
    */

    event.target.value = "";
  };

  /* -------------------------------------------------------
     REMOVE PROFILE PHOTO
  ------------------------------------------------------- */

  const removeProfilePhoto = (
    photoIndex
  ) => {
    const previewToRemove =
      photoPreviews[
        photoIndex
      ];

    if (
      previewToRemove &&
      previewToRemove.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        previewToRemove
      );
    }

    setPhotoFiles(
      (currentFiles) => {
        const updatedFiles = [
          ...currentFiles,
        ];

        updatedFiles[
          photoIndex
        ] = null;

        return updatedFiles;
      }
    );

    setPhotoPreviews(
      (currentPreviews) => {
        const updatedPreviews = [
          ...currentPreviews,
        ];

        updatedPreviews[
          photoIndex
        ] = "";

        return updatedPreviews;
      }
    );
  };

  /* -------------------------------------------------------
     VERIFICATION ID
  ------------------------------------------------------- */

  const handleIdChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

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

    if (
      idPreview &&
      idPreview.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        idPreview
      );
    }

    setIdFile(file);

    setIdPreview(
      URL.createObjectURL(
        file
      )
    );
  };

  /* -------------------------------------------------------
     VERIFICATION SELFIE
  ------------------------------------------------------- */

  const handleSelfieChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

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

    if (
      selfiePreview &&
      selfiePreview.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        selfiePreview
      );
    }

    setSelfieFile(file);

    setSelfiePreview(
      URL.createObjectURL(
        file
      )
    );
  };

  /* -------------------------------------------------------
     LOCATION
  ------------------------------------------------------- */

  const useMyLocation =
    async () => {
      try {
        setGettingLocation(
          true
        );

        const savedLocation =
          await updateCurrentUserLocation(
            {
              distancePreference:
                radiusMiles,
            }
          );

        setLocation({
          city:
            savedLocation.city ||
            "",

          state:
            savedLocation.state ||
            "",

          country:
            savedLocation.countryCode ||
            savedLocation.country ||
            "US",

          lat:
            savedLocation.latitude,

          lng:
            savedLocation.longitude,
        });

        setCity(
          savedLocation.displayLocation ||
          [
            savedLocation.city,
            savedLocation.stateCode,
          ]
            .filter(Boolean)
            .join(", ")
        );
      } catch (error) {
        console.error(
          "Location error:",
          error
        );

        window.alert(
          error.message ||
          "We couldn't access your location. Please enter your city manually."
        );
      } finally {
        setGettingLocation(
          false
        );
      }
    };

  /* -------------------------------------------------------
     VALIDATION
  ------------------------------------------------------- */

  const canContinue = () => {
    /* PROFILE */

    if (step === 1) {
      return Boolean(
        name.trim() &&
        age.trim()
      );
    }

    /* INTERESTS */

    if (step === 2) {
      return (
        selectedInterests.length >= 1
      );
    }

    /* FRIENDSHIP STYLE */

    if (step === 3) {
      return Boolean(
        selectedActivities.length >=
          1 &&
        selectedVibes.length >=
          1 &&
        socialEnergy
      );
    }

    /* PHOTO */

    if (step === 4) {
      return Boolean(
        photoFiles[0] ||
        photoPreviews[0]
      );
    }

    /* LOCATION */

    if (step === 5) {
      return Boolean(
        city.trim()
      );
    }

    /*
      Verification is optional.
    */

    return true;
  };

  /* -------------------------------------------------------
     NEXT STEP
  ------------------------------------------------------- */

  const nextStep = () => {
    if (!canContinue()) {
      if (step === 1) {
        window.alert(
          "Please add your name and age first."
        );

        return;
      }

      if (step === 2) {
        window.alert(
          "Choose at least one interest."
        );

        return;
      }

      if (step === 3) {
        window.alert(
          "Choose at least one activity, one vibe, and your social energy."
        );

        return;
      }

      if (step === 4) {
        window.alert(
          "Please add a main profile photo first."
        );

        return;
      }

      if (step === 5) {
        window.alert(
          "Please add your city first."
        );

        return;
      }

      return;
    }

    if (
      step <
      totalSteps
    ) {
      setStep(
        (currentStep) =>
          currentStep + 1
      );
    }
  };

  /* -------------------------------------------------------
     BACK STEP
  ------------------------------------------------------- */

  const backStep = () => {
    if (step > 1) {
      setStep(
        (currentStep) =>
          currentStep - 1
      );
    }
  };

  /* -------------------------------------------------------
     UPLOAD PROFILE PHOTOS
  ------------------------------------------------------- */

  const uploadProfilePhotos =
    async () => {
      const currentUser =
        auth.currentUser;

      if (!currentUser) {
        throw new Error(
          "Please sign in again."
        );
      }

      const uploads =
        photoFiles.map(
          async (
            file,
            photoIndex
          ) => {
            /*
              If this photo already has
              a URL, keep it.
            */

            if (!file) {
              return (
                photoPreviews[
                  photoIndex
                ] || ""
              );
            }

            const safeFileName =
              file.name.replace(
                /[^a-zA-Z0-9._-]/g,
                "-"
              );

            const photoReference =
              ref(
                storage,

                `profileImages/${
                  currentUser.uid
                }/photo-${
                  photoIndex + 1
                }-${Date.now()}-${safeFileName}`
              );

            await uploadBytes(
              photoReference,
              file
            );

            return await getDownloadURL(
              photoReference
            );
          }
        );

      const uploadedPhotos =
        await Promise.all(
          uploads
        );

      return uploadedPhotos.filter(
        Boolean
      );
    };

  /* -------------------------------------------------------
     SAVE PROFILE

     IMPORTANT:
     membership is NOT written here.

     FirebaseAuthContext created the user
     membership before onboarding.

     Using merge:true keeps that field.
  ------------------------------------------------------- */

  const saveBaseProfile =
    async ({
      verificationStatus =
        "not_started",

      idImage = "",
      selfieImage = "",
    }) => {
      const currentUser =
        auth.currentUser;

      if (!currentUser) {
        throw new Error(
          "Please sign in again."
        );
      }

      const profilePhotos =
        await uploadProfilePhotos();

      const mainPhotoURL =
        profilePhotos[0] ||
        "";

      if (!mainPhotoURL) {
        throw new Error(
          "Please add a main profile photo."
        );
      }

      await setDoc(
        doc(
          db,
          "users",
          currentUser.uid
        ),
        {
          /* -----------------------------------------------
             ACCOUNT
          ----------------------------------------------- */

          uid:
            currentUser.uid,

          email:
            currentUser.email ||
            "",

          /* -----------------------------------------------
             PROFILE
          ----------------------------------------------- */

          name:
            name.trim(),

          age:
            Number(age),

          city:
            city.trim(),

          bio:
            bio.trim(),

          /* -----------------------------------------------
             PROFILE PHOTOS

             Keep old single-photo fields
             because other Limi pages may
             still read them.
          ----------------------------------------------- */

          profileImage:
            mainPhotoURL,

          profilePhotoURL:
            mainPhotoURL,

          photoURL:
            mainPhotoURL,

          profilePhotos,

          /* -----------------------------------------------
             LOCATION
          ----------------------------------------------- */

          location: {
            city:
              location.city ||
              city.trim(),

            state:
              location.state ||
              "",

            country:
              location.country ||
              "US",

            displayLocation:
              city.trim(),

            latitude:
              location.lat,

            longitude:
              location.lng,

            /*
              Compatibility with older
              Limi pages.
            */

            lat:
              location.lat,

            lng:
              location.lng,
          },

          displayLocation:
            city.trim(),

          radiusMiles,

          distancePreference:
            radiusMiles,

          /* -----------------------------------------------
             PERSONALITY / MATCH DATA
          ----------------------------------------------- */

          interests:
            selectedInterests,

          activities:
            selectedActivities,

          friendActivities:
            selectedActivities,

          vibes:
            selectedVibes,

          socialEnergy,

          /* -----------------------------------------------
             VERIFICATION
          ----------------------------------------------- */

          verified: false,

          verificationStatus,

          idImage,

          selfieImage,

          /* -----------------------------------------------
             ONBOARDING COMPLETE

             ProtectedRoute currently checks
             completedOnboarding.
          ----------------------------------------------- */

          completedOnboarding:
            true,

          onboardingComplete:
            true,

          updatedAt:
            serverTimestamp(),
        },
        {
          /*
            EXTREMELY IMPORTANT:

            This keeps fields already
            created by signup, including:

            membership: "free"

            or eventually:

            membership: "plus"
          */

          merge: true,
        }
      );
    };

  /* -------------------------------------------------------
     SKIP VERIFICATION
  ------------------------------------------------------- */

  const skipVerification =
    async () => {
      const currentUser =
        auth.currentUser;

      if (!currentUser) {
        window.alert(
          "Please sign in again."
        );

        return;
      }

      try {
        setSaving(true);

        await saveBaseProfile({
          verificationStatus:
            "skipped",
        });

        /*
          Onboarding is complete.

          Go directly into Limi.
        */

        navigate(
          "/profile",
          {
            replace: true,
          }
        );
      } catch (error) {
        console.error(
          "Skip verification error:",
          error
        );

        window.alert(
          getFriendlyFirebaseErrorMessage?.(
            error
          ) ||
          error.message ||
          "Something went wrong while saving your profile."
        );

        setSaving(false);
      }
    };

  /* -------------------------------------------------------
     SUBMIT VERIFICATION
  ------------------------------------------------------- */

  const submitVerification =
    async () => {
      const currentUser =
        auth.currentUser;

      if (!currentUser) {
        window.alert(
          "Please sign in again."
        );

        return;
      }

      if (
        !idFile ||
        !selfieFile
      ) {
        window.alert(
          "Please upload your ID and take a selfie first."
        );

        return;
      }

      try {
        setSaving(true);

        /* ID */

        const safeIdFileName =
          idFile.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
          );

        const idReference =
          ref(
            storage,

            `verification/${currentUser.uid}/id-${Date.now()}-${safeIdFileName}`
          );

        await uploadBytes(
          idReference,
          idFile
        );

        const idURL =
          await getDownloadURL(
            idReference
          );

        /* SELFIE */

        const safeSelfieFileName =
          selfieFile.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
          );

        const selfieReference =
          ref(
            storage,

            `verification/${currentUser.uid}/selfie-${Date.now()}-${safeSelfieFileName}`
          );

        await uploadBytes(
          selfieReference,
          selfieFile
        );

        const selfieURL =
          await getDownloadURL(
            selfieReference
          );

        await saveBaseProfile({
          verificationStatus:
            "pending",

          idImage:
            idURL,

          selfieImage:
            selfieURL,
        });

        navigate(
          "/profile",
          {
            replace: true,
          }
        );
      } catch (error) {
        console.error(
          "Verification error:",
          error
        );

        window.alert(
          getFriendlyFirebaseErrorMessage?.(
            error
          ) ||
          error.message ||
          "Something went wrong while submitting verification."
        );

        setSaving(false);
      }
    };

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* LOGO */}

        <div style={styles.logoBox}>
          <div style={styles.logo}>
            L
          </div>
        </div>

        <h1 style={styles.title}>
          Welcome
        </h1>

        <p style={styles.subtitle}>
          let’s build your Limi identity 💕
        </p>

        {/* PROGRESS */}

        <div style={styles.progressOuter}>
          <div
            style={{
              ...styles.progressInner,
              width: progress,
            }}
          />
        </div>

        <p style={styles.stepText}>
          Step {step} of{" "}
          {totalSteps}
        </p>

        {/* =================================================
            STEP 1
            PROFILE
        ================================================= */}

        {step === 1 && (
          <div style={styles.section}>

            <h2
              style={
                styles.sectionTitle
              }
            >
              Tell us about yourself
            </h2>

            <p style={styles.helper}>
              This is what people will
              see on your profile.
            </p>

            <input
              style={styles.input}
              placeholder="Your name"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
            />

            <input
              style={styles.input}
              placeholder="Age"
              type="number"
              min="18"
              max="120"
              value={age}
              onChange={(event) =>
                setAge(
                  event.target.value
                )
              }
            />

            <textarea
              style={styles.textarea}
              placeholder="Short bio — tell people what you're like 💗"
              value={bio}
              onChange={(event) =>
                setBio(
                  event.target.value
                )
              }
            />

          </div>
        )}

        {/* =================================================
            STEP 2
            INTERESTS
        ================================================= */}

        {step === 2 && (
          <div style={styles.section}>

            <h2
              style={
                styles.sectionTitle
              }
            >
              What are you into?
            </h2>

            <p style={styles.helper}>
              Choose as many as you want.
            </p>

            <div style={styles.grid}>

              {interestsOptions.map(
                (interest) => {
                  const active =
                    selectedInterests.includes(
                      interest
                    );

                  return (
                    <button
                      key={interest}
                      type="button"
                      style={{
                        ...styles.pill,

                        ...(active
                          ? styles.pillActive
                          : {}),
                      }}
                      onClick={() =>
                        toggleUnlimited(
                          interest,
                          selectedInterests,
                          setSelectedInterests
                        )
                      }
                    >
                      {active && (
                        <Check
                          size={14}
                        />
                      )}

                      {interest}

                    </button>
                  );
                }
              )}

            </div>

          </div>
        )}

        {/* =================================================
            STEP 3
            ACTIVITIES + ENERGY + VIBES
        ================================================= */}

        {step === 3 && (
          <div style={styles.section}>

            <h2
              style={
                styles.sectionTitle
              }
            >
              What would you do with friends?
            </h2>

            <p style={styles.helper}>
              Choose as many as you want.
            </p>

            <div style={styles.grid}>

              {activityOptions.map(
                (activity) => {
                  const active =
                    selectedActivities.includes(
                      activity
                    );

                  return (
                    <button
                      key={activity}
                      type="button"
                      style={{
                        ...styles.pill,

                        ...(active
                          ? styles.pillActive
                          : {}),
                      }}
                      onClick={() =>
                        toggleUnlimited(
                          activity,
                          selectedActivities,
                          setSelectedActivities
                        )
                      }
                    >
                      {active && (
                        <Check
                          size={14}
                        />
                      )}

                      {activity}

                    </button>
                  );
                }
              )}

            </div>

            {/* SOCIAL ENERGY */}

            <h2
              style={{
                ...styles.sectionTitle,
                marginTop: 24,
              }}
            >
              Social Energy
            </h2>

            <p style={styles.helper}>
              What feels most like you?
            </p>

            <div style={styles.grid}>

              {socialEnergyOptions.map(
                (energy) => {
                  const active =
                    socialEnergy ===
                    energy;

                  return (
                    <button
                      key={energy}
                      type="button"
                      style={{
                        ...styles.pill,

                        ...(active
                          ? styles.pillActive
                          : {}),
                      }}
                      onClick={() =>
                        setSocialEnergy(
                          energy
                        )
                      }
                    >
                      {active && (
                        <Check
                          size={14}
                        />
                      )}

                      {energy}

                    </button>
                  );
                }
              )}

            </div>

            {/* VIBES */}

            <h2
              style={{
                ...styles.sectionTitle,
                marginTop: 24,
              }}
            >
              Choose your vibe
            </h2>

            <p style={styles.helper}>
              Choose up to 3.
            </p>

            <div style={styles.grid}>

              {vibeOptions.map(
                (vibe) => {
                  const active =
                    selectedVibes.includes(
                      vibe
                    );

                  return (
                    <button
                      key={vibe}
                      type="button"
                      style={{
                        ...styles.pill,

                        ...(active
                          ? styles.pillActive
                          : {}),
                      }}
                      onClick={() =>
                        toggleLimited(
                          vibe,
                          selectedVibes,
                          setSelectedVibes,
                          3
                        )
                      }
                    >
                      {active && (
                        <Check
                          size={14}
                        />
                      )}

                      {vibe}

                    </button>
                  );
                }
              )}

            </div>

          </div>
        )}

        {/* =================================================
            STEP 4
            PHOTOS
        ================================================= */}

        {step === 4 && (
          <div style={styles.section}>

            <h2
              style={
                styles.sectionTitle
              }
            >
              Add your photos
            </h2>

            <p style={styles.helper}>
              Add one main profile photo
              and up to two optional
              photos. People can swipe
              through them on your Match
              profile.
            </p>

            <div
              style={
                styles.photoCountRow
              }
            >
              <span
                style={
                  styles.photoCount
                }
              >
                {numberOfPhotos} of 3
                photos added
              </span>

              <span
                style={
                  styles.optionalText
                }
              >
                Only the first is
                required
              </span>
            </div>

            {/* MAIN PHOTO */}

            <div
              style={
                styles.mainPhotoContainer
              }
            >
              <div
                style={
                  styles.mainBadge
                }
              >
                Main photo
              </div>

              <label
                style={
                  styles.photoBox
                }
              >
                {photoPreviews[0] ? (
                  <img
                    src={
                      photoPreviews[0]
                    }
                    alt="Main profile preview"
                    style={
                      styles.photoPreview
                    }
                  />
                ) : (
                  <div
                    style={
                      styles.photoPlaceholder
                    }
                  >
                    <div
                      style={
                        styles.cameraCircle
                      }
                    >
                      <Camera
                        size={34}
                        color="#d94b93"
                      />
                    </div>

                    <p
                      style={
                        styles.photoPlaceholderTitle
                      }
                    >
                      Add your main photo
                    </p>

                    <span
                      style={
                        styles.photoPlaceholderText
                      }
                    >
                      This will be the
                      first photo people
                      see.
                    </span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleProfilePhotoChange(
                      event,
                      0
                    )
                  }
                  style={{
                    display: "none",
                  }}
                />
              </label>

              {photoPreviews[0] && (
                <>
                  <label
                    style={
                      styles.replacePhotoButton
                    }
                  >
                    <Camera
                      size={16}
                    />

                    Replace

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        handleProfilePhotoChange(
                          event,
                          0
                        )
                      }
                      style={{
                        display:
                          "none",
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    aria-label="Remove main photo"
                    style={
                      styles.removePhotoButton
                    }
                    onClick={() =>
                      removeProfilePhoto(
                        0
                      )
                    }
                  >
                    <X
                      size={17}
                    />
                  </button>
                </>
              )}
            </div>

            {/* EXTRA PHOTOS */}

            <p
              style={
                styles.extraPhotosTitle
              }
            >
              Extra photos
            </p>

            <p
              style={
                styles.extraPhotosHelper
              }
            >
              Optional — show more of
              your personality!
            </p>

            <div
              style={
                styles.optionalPhotosGrid
              }
            >
              {[1, 2].map(
                (photoIndex) => (
                  <div
                    key={photoIndex}
                    style={
                      styles.optionalPhotoContainer
                    }
                  >
                    <label
                      style={
                        styles.optionalPhotoBox
                      }
                    >
                      {photoPreviews[
                        photoIndex
                      ] ? (
                        <img
                          src={
                            photoPreviews[
                              photoIndex
                            ]
                          }
                          alt={`Optional profile preview ${
                            photoIndex +
                            1
                          }`}
                          style={
                            styles.photoPreview
                          }
                        />
                      ) : (
                        <div
                          style={
                            styles.optionalPhotoPlaceholder
                          }
                        >
                          <Plus
                            size={27}
                            color="#d94b93"
                          />

                          <span>
                            Optional
                          </span>
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(
                          event
                        ) =>
                          handleProfilePhotoChange(
                            event,
                            photoIndex
                          )
                        }
                        style={{
                          display:
                            "none",
                        }}
                      />
                    </label>

                    {photoPreviews[
                      photoIndex
                    ] && (
                      <button
                        type="button"
                        aria-label={`Remove optional photo ${
                          photoIndex +
                          1
                        }`}
                        style={
                          styles.smallRemoveButton
                        }
                        onClick={() =>
                          removeProfilePhoto(
                            photoIndex
                          )
                        }
                      >
                        <X
                          size={15}
                        />
                      </button>
                    )}
                  </div>
                )
              )}
            </div>

            <div
              style={
                styles.photoTip
              }
            >
              <ShieldCheck
                size={18}
                color="#d94b93"
              />

              <p
                style={
                  styles.photoTipText
                }
              >
                Use clear, recent photos
                that show you. Your main
                photo should clearly show
                your face.
              </p>
            </div>

          </div>
        )}

        {/* =================================================
            STEP 5
            LOCATION
        ================================================= */}

        {step === 5 && (
          <div style={styles.section}>

            <div
              style={
                styles.locationIcon
              }
            >
              <MapPin
                size={34}
                color="#d94b93"
              />
            </div>

            <h2
              style={
                styles.sectionTitle
              }
            >
              Find people near you
            </h2>

            <p style={styles.helper}>
              Limi uses your area to
              show nearby feed posts,
              matches, reels, and
              hangouts. Your exact
              location is never shown
              publicly.
            </p>

            <button
              type="button"
              style={{
                ...styles.locationButton,

                ...(gettingLocation
                  ? styles.disabledButton
                  : {}),
              }}
              onClick={
                useMyLocation
              }
              disabled={
                gettingLocation
              }
            >
              <MapPin
                size={18}
              />

              {gettingLocation
                ? "Getting location..."
                : "Use my location"}
            </button>

            {location.lat !== null &&
              location.lng !==
                null && (
                <p
                  style={
                    styles.locationSaved
                  }
                >
                  Location saved
                  privately 💕
                  {city &&
                    ` You’re in ${city}.`}
                </p>
              )}

            <input
              style={styles.input}
              placeholder="Public city, example: Orlando, FL"
              value={city}
              onChange={(event) => {
                const newCity =
                  event.target.value;

                setCity(
                  newCity
                );

                setLocation(
                  (
                    currentLocation
                  ) => ({
                    ...currentLocation,

                    city:
                      newCity,
                  })
                );
              }}
            />

            <label
              style={
                styles.radiusLabel
              }
            >
              Show me people within{" "}
              {radiusMiles} miles
            </label>

            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={
                radiusMiles
              }
              onChange={(event) =>
                setRadiusMiles(
                  Number(
                    event.target
                      .value
                  )
                )
              }
              style={styles.range}
            />

            <div
              style={
                styles.radiusOptions
              }
            >
              <span>
                5 mi
              </span>

              <span>
                50 mi
              </span>

              <span>
                100 mi
              </span>
            </div>

          </div>
        )}

        {/* =================================================
            STEP 6
            OPTIONAL VERIFICATION
        ================================================= */}

        {step === 6 && (
          <div style={styles.section}>

            <div
              style={
                styles.verifyBox
              }
            >
              <ShieldCheck
                size={52}
                color="#d94b93"
              />

              <h2
                style={
                  styles.sectionTitle
                }
              >
                Get verified
              </h2>

              <p
                style={
                  styles.verifyText
                }
              >
                Verification is
                optional. It helps
                build trust and adds a
                Verified badge to your
                profile. You can verify
                now or later from your
                profile settings.
              </p>

              {!showVerificationForm ? (
                <div
                  style={
                    styles.verifyActions
                  }
                >
                  <button
                    type="button"
                    style={{
                      ...styles.nextButtonFull,

                      ...(saving
                        ? styles.disabledButton
                        : {}),
                    }}
                    onClick={() =>
                      setShowVerificationForm(
                        true
                      )
                    }
                    disabled={
                      saving
                    }
                  >
                    Verify Now

                    <ShieldCheck
                      size={18}
                    />
                  </button>

                  <button
                    type="button"
                    style={{
                      ...styles.skipButton,

                      ...(saving
                        ? styles.disabledButton
                        : {}),
                    }}
                    onClick={
                      skipVerification
                    }
                    disabled={
                      saving
                    }
                  >
                    {saving
                      ? "Saving..."
                      : "Skip For Now"}

                    {!saving && (
                      <ArrowRight
                        size={18}
                      />
                    )}
                  </button>
                </div>
              ) : (
                <>
                  {/* ID */}

                  <label
                    style={
                      styles.uploadBox
                    }
                  >
                    {idPreview ? (
                      <img
                        src={
                          idPreview
                        }
                        alt="ID Preview"
                        style={
                          styles.photoPreview
                        }
                      />
                    ) : (
                      <div>
                        <Camera
                          size={34}
                          color="#d94b93"
                        />

                        <p>
                          Upload ID photo
                        </p>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleIdChange
                      }
                      style={{
                        display:
                          "none",
                      }}
                    />
                  </label>

                  {/* SELFIE */}

                  <label
                    style={
                      styles.uploadBox
                    }
                  >
                    {selfiePreview ? (
                      <img
                        src={
                          selfiePreview
                        }
                        alt="Selfie Preview"
                        style={
                          styles.photoPreview
                        }
                      />
                    ) : (
                      <div>
                        <Camera
                          size={34}
                          color="#d94b93"
                        />

                        <p>
                          Take real-time
                          selfie
                        </p>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={
                        handleSelfieChange
                      }
                      style={{
                        display:
                          "none",
                      }}
                    />
                  </label>

                  {/* SUBMIT */}

                  <button
                    type="button"
                    style={{
                      ...styles.nextButtonFull,

                      ...(saving
                        ? styles.disabledButton
                        : {}),
                    }}
                    onClick={
                      submitVerification
                    }
                    disabled={
                      saving
                    }
                  >
                    {saving
                      ? "Submitting..."
                      : "Submit Verification"}

                    {!saving && (
                      <ArrowRight
                        size={18}
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    style={
                      styles.skipTextButton
                    }
                    onClick={
                      skipVerification
                    }
                    disabled={
                      saving
                    }
                  >
                    Skip and verify later
                  </button>
                </>
              )}
            </div>

          </div>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        {step < totalSteps && (
          <div style={styles.footer}>

            {step > 1 ? (
              <button
                type="button"
                style={
                  styles.backButton
                }
                onClick={
                  backStep
                }
              >
                <ArrowLeft
                  size={18}
                />

                Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              style={
                styles.nextButton
              }
              onClick={
                nextStep
              }
            >
              Continue

              <ArrowRight
                size={18}
              />
            </button>

          </div>
        )}

        {step ===
          totalSteps && (
          <div style={styles.footer}>

            <button
              type="button"
              style={
                styles.backButton
              }
              onClick={
                backStep
              }
              disabled={
                saving
              }
            >
              <ArrowLeft
                size={18}
              />

              Back
            </button>

          </div>
        )}

      </div>
    </div>
  );
}

/* -------------------------------------------------------
   STYLES
------------------------------------------------------- */

const styles = {
  page: {
    minHeight: "100vh",

    background:
      "linear-gradient(135deg, #fdeef4 0%, #f8dce6 45%, #f4b7c8 100%)",

    display:
      "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

    padding:
      "24px",

    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  card: {
    width:
      "100%",

    maxWidth:
      "430px",

    background:
      "rgba(255, 250, 250, 0.96)",

    borderRadius:
      "38px",

    padding:
      "32px",

    boxSizing:
      "border-box",

    boxShadow:
      "0 18px 45px rgba(231, 91, 150, 0.18)",

    border:
      "1px solid rgba(255,255,255,0.7)",
  },

  logoBox: {
    display:
      "flex",

    justifyContent:
      "center",

    marginBottom:
      "20px",
  },

  logo: {
    width:
      "82px",

    height:
      "82px",

    borderRadius:
      "28px",

    background:
      "linear-gradient(135deg, #f5a2bc, #ef87ad, #f78e9b)",

    color:
      "white",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    fontSize:
      "40px",

    fontWeight:
      "950",

    boxShadow:
      "0 12px 28px rgba(231,91,150,0.25)",
  },

  title: {
    margin:
      0,

    textAlign:
      "center",

    fontSize:
      "46px",

    fontWeight:
      "1000",

    color:
      "#ec64a8",

    letterSpacing:
      "-0.05em",
  },

  subtitle: {
    margin:
      "10px 0 26px",

    textAlign:
      "center",

    color:
      "#80636f",

    fontSize:
      "16px",

    fontWeight:
      "850",
  },

  progressOuter: {
    height:
      "9px",

    background:
      "#ffe1ef",

    borderRadius:
      "999px",

    overflow:
      "hidden",
  },

  progressInner: {
    height:
      "100%",

    background:
      "linear-gradient(90deg, #f5a2bc, #ef87ad, #d94b93)",

    borderRadius:
      "999px",

    transition:
      "width 0.25s ease",
  },

  stepText: {
    fontSize:
      "13px",

    color:
      "#80636f",

    marginTop:
      "10px",

    marginBottom:
      "20px",

    fontWeight:
      "850",
  },

  section: {
    display:
      "flex",

    flexDirection:
      "column",

    gap:
      "12px",
  },

  sectionTitle: {
    margin:
      0,

    fontSize:
      "25px",

    fontWeight:
      "950",

    color:
      "#d94b93",

    letterSpacing:
      "-0.03em",
  },

  helper: {
    margin:
      "0 0 4px",

    color:
      "#80636f",

    fontSize:
      "13px",

    fontWeight:
      "750",

    lineHeight:
      1.5,
  },

  input: {
    width:
      "100%",

    boxSizing:
      "border-box",

    border:
      "1px solid #f0d8e2",

    background:
      "white",

    borderRadius:
      "18px",

    padding:
      "15px 16px",

    fontSize:
      "15px",

    outline:
      "none",

    color:
      "#2b1b23",

    fontWeight:
      "750",
  },

  textarea: {
    width:
      "100%",

    minHeight:
      "110px",

    boxSizing:
      "border-box",

    border:
      "1px solid #f0d8e2",

    background:
      "white",

    borderRadius:
      "18px",

    padding:
      "15px 16px",

    fontSize:
      "15px",

    outline:
      "none",

    resize:
      "none",

    color:
      "#2b1b23",

    fontWeight:
      "750",
  },

  grid: {
    display:
      "flex",

    flexWrap:
      "wrap",

    gap:
      "10px",
  },

  pill: {
    border:
      "1px solid #f0d8e2",

    background:
      "white",

    color:
      "#6f5360",

    borderRadius:
      "999px",

    padding:
      "11px 15px",

    fontSize:
      "14px",

    fontWeight:
      "850",

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "6px",

    cursor:
      "pointer",
  },

  pillActive: {
    background:
      "linear-gradient(135deg, #f5a2bc, #ef87ad, #d94b93)",

    color:
      "white",

    border:
      "1px solid transparent",

    boxShadow:
      "0 8px 18px rgba(231,91,150,0.22)",
  },

  /* -------------------------------------------------------
     PHOTOS
  ------------------------------------------------------- */

  photoCountRow: {
    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    gap:
      "10px",

    marginTop:
      "4px",
  },

  photoCount: {
    color:
      "#d94b93",

    fontSize:
      "13px",

    fontWeight:
      "950",
  },

  optionalText: {
    color:
      "#9b7a89",

    fontSize:
      "11px",

    fontWeight:
      "800",

    textAlign:
      "right",
  },

  mainPhotoContainer: {
    position:
      "relative",

    marginTop:
      "4px",
  },

  mainBadge: {
    position:
      "absolute",

    zIndex:
      4,

    top:
      "14px",

    left:
      "14px",

    background:
      "rgba(217, 75, 147, 0.92)",

    color:
      "white",

    borderRadius:
      "999px",

    padding:
      "7px 12px",

    fontSize:
      "11px",

    fontWeight:
      "950",

    boxShadow:
      "0 6px 16px rgba(66, 22, 45, 0.18)",
  },

  photoBox: {
    height:
      "280px",

    borderRadius:
      "30px",

    border:
      "2px dashed #f0b7cc",

    background:
      "#fff8fc",

    display:
      "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

    overflow:
      "hidden",

    cursor:
      "pointer",
  },

  photoPreview: {
    width:
      "100%",

    height:
      "100%",

    objectFit:
      "cover",

    display:
      "block",
  },

  photoPlaceholder: {
    padding:
      "30px",

    textAlign:
      "center",

    color:
      "#80636f",

    fontWeight:
      "850",

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",
  },

  cameraCircle: {
    width:
      "66px",

    height:
      "66px",

    borderRadius:
      "24px",

    background:
      "#ffe8f1",

    display:
      "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

    marginBottom:
      "12px",
  },

  photoPlaceholderTitle: {
    margin:
      0,

    fontSize:
      "16px",

    color:
      "#d94b93",

    fontWeight:
      "950",
  },

  photoPlaceholderText: {
    marginTop:
      "7px",

    maxWidth:
      "220px",

    color:
      "#8a6c79",

    fontSize:
      "12px",

    lineHeight:
      1.5,

    fontWeight:
      "750",
  },

  replacePhotoButton: {
    position:
      "absolute",

    zIndex:
      5,

    right:
      "14px",

    bottom:
      "14px",

    height:
      "39px",

    borderRadius:
      "999px",

    border:
      "1px solid rgba(255,255,255,0.5)",

    background:
      "rgba(255,255,255,0.92)",

    color:
      "#d94b93",

    padding:
      "0 13px",

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "6px",

    fontSize:
      "12px",

    fontWeight:
      "950",

    cursor:
      "pointer",

    boxShadow:
      "0 8px 18px rgba(48,20,34,0.18)",
  },

  removePhotoButton: {
    position:
      "absolute",

    zIndex:
      5,

    top:
      "13px",

    right:
      "13px",

    width:
      "38px",

    height:
      "38px",

    borderRadius:
      "50%",

    border:
      "1px solid rgba(255,255,255,0.45)",

    background:
      "rgba(30,20,25,0.55)",

    color:
      "white",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    cursor:
      "pointer",

    backdropFilter:
      "blur(8px)",
  },

  extraPhotosTitle: {
    margin:
      "8px 0 0",

    color:
      "#d94b93",

    fontSize:
      "16px",

    fontWeight:
      "950",
  },

  extraPhotosHelper: {
    margin:
      "-5px 0 1px",

    color:
      "#80636f",

    fontSize:
      "12px",

    lineHeight:
      1.5,

    fontWeight:
      "750",
  },

  optionalPhotosGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "1fr 1fr",

    gap:
      "12px",
  },

  optionalPhotoContainer: {
    position:
      "relative",
  },

  optionalPhotoBox: {
    width:
      "100%",

    height:
      "170px",

    borderRadius:
      "24px",

    border:
      "2px dashed #f0b7cc",

    background:
      "#fff8fc",

    display:
      "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

    overflow:
      "hidden",

    cursor:
      "pointer",

    boxSizing:
      "border-box",
  },

  optionalPhotoPlaceholder: {
    color:
      "#d94b93",

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    gap:
      "7px",

    fontSize:
      "12px",

    fontWeight:
      "950",
  },

  smallRemoveButton: {
    position:
      "absolute",

    zIndex:
      4,

    top:
      "9px",

    right:
      "9px",

    width:
      "33px",

    height:
      "33px",

    borderRadius:
      "50%",

    border:
      "1px solid rgba(255,255,255,0.5)",

    background:
      "rgba(30,20,25,0.55)",

    color:
      "white",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    cursor:
      "pointer",

    backdropFilter:
      "blur(8px)",
  },

  photoTip: {
    display:
      "flex",

    alignItems:
      "flex-start",

    gap:
      "10px",

    background:
      "#fff0f6",

    borderRadius:
      "18px",

    padding:
      "13px",

    marginTop:
      "4px",
  },

  photoTipText: {
    margin:
      0,

    color:
      "#80636f",

    fontSize:
      "12px",

    lineHeight:
      1.5,

    fontWeight:
      "750",
  },

  /* -------------------------------------------------------
     LOCATION
  ------------------------------------------------------- */

  locationIcon: {
    width:
      "74px",

    height:
      "74px",

    borderRadius:
      "26px",

    background:
      "#fff0f7",

    display:
      "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

    margin:
      "0 auto 8px",
  },

  locationButton: {
    border:
      "none",

    background:
      "linear-gradient(135deg, #f5a2bc, #ef87ad, #d94b93)",

    color:
      "white",

    borderRadius:
      "999px",

    padding:
      "14px 18px",

    fontSize:
      "15px",

    fontWeight:
      "950",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "8px",

    cursor:
      "pointer",

    boxShadow:
      "0 10px 24px rgba(231,91,150,0.24)",
  },

  locationSaved: {
    margin:
      0,

    color:
      "#16a34a",

    fontSize:
      "13px",

    fontWeight:
      "900",
  },

  radiusLabel: {
    marginTop:
      "8px",

    color:
      "#80636f",

    fontSize:
      "14px",

    fontWeight:
      "900",
  },

  range: {
    width:
      "100%",

    accentColor:
      "#ef87ad",
  },

  radiusOptions: {
    display:
      "flex",

    justifyContent:
      "space-between",

    color:
      "#80636f",

    fontSize:
      "12px",

    fontWeight:
      "800",
  },

  /* -------------------------------------------------------
     VERIFICATION
  ------------------------------------------------------- */

  verifyBox: {
    background:
      "#fff8fc",

    border:
      "1px solid #f0d8e2",

    borderRadius:
      "30px",

    padding:
      "28px",

    textAlign:
      "center",
  },

  verifyText: {
    color:
      "#80636f",

    fontSize:
      "14px",

    lineHeight:
      1.5,

    marginBottom:
      "20px",

    fontWeight:
      "650",
  },

  verifyActions: {
    display:
      "flex",

    flexDirection:
      "column",

    gap:
      "12px",
  },

  uploadBox: {
    height:
      "180px",

    borderRadius:
      "24px",

    border:
      "2px dashed #f0b7cc",

    background:
      "#fff8fc",

    display:
      "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

    overflow:
      "hidden",

    cursor:
      "pointer",

    color:
      "#80636f",

    fontWeight:
      "850",

    textAlign:
      "center",

    marginTop:
      "12px",
  },

  /* -------------------------------------------------------
     FOOTER
  ------------------------------------------------------- */

  footer: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    marginTop:
      "24px",

    gap:
      "12px",
  },

  backButton: {
    border:
      "none",

    background:
      "#fff0f7",

    color:
      "#d94b93",

    borderRadius:
      "999px",

    padding:
      "13px 18px",

    fontSize:
      "15px",

    fontWeight:
      "900",

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "6px",

    cursor:
      "pointer",
  },

  nextButton: {
    border:
      "none",

    background:
      "linear-gradient(135deg, #f5a2bc, #ef87ad, #d94b93)",

    color:
      "white",

    borderRadius:
      "999px",

    padding:
      "13px 20px",

    fontSize:
      "15px",

    fontWeight:
      "950",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "6px",

    cursor:
      "pointer",

    boxShadow:
      "0 10px 24px rgba(231,91,150,0.24)",
  },

  nextButtonFull: {
    width:
      "100%",

    border:
      "none",

    background:
      "linear-gradient(135deg, #f5a2bc, #ef87ad, #d94b93)",

    color:
      "white",

    borderRadius:
      "999px",

    padding:
      "14px 20px",

    fontSize:
      "15px",

    fontWeight:
      "950",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "6px",

    cursor:
      "pointer",

    boxShadow:
      "0 10px 24px rgba(231,91,150,0.24)",

    marginTop:
      "14px",
  },

  skipButton: {
    border:
      "1px solid #f0d8e2",

    background:
      "white",

    color:
      "#d94b93",

    borderRadius:
      "999px",

    padding:
      "13px 20px",

    fontSize:
      "15px",

    fontWeight:
      "950",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "6px",

    cursor:
      "pointer",
  },

  skipTextButton: {
    border:
      "none",

    background:
      "transparent",

    color:
      "#80636f",

    fontSize:
      "14px",

    fontWeight:
      "850",

    marginTop:
      "8px",

    cursor:
      "pointer",
  },

  disabledButton: {
    opacity:
      0.6,

    cursor:
      "not-allowed",
  },
};