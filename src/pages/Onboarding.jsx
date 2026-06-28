import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { auth, db, storage } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

const socialEnergyOptions = ["Introvert", "Ambivert", "Extrovert"];

export default function Onboarding() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState("");

  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState("");

  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [socialEnergy, setSocialEnergy] = useState("");

  const totalSteps = 5;
  const progress = useMemo(() => `${(step / totalSteps) * 100}%`, [step]);

  const toggleUnlimited = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const toggleLimited = (item, list, setList, limit) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
      return;
    }

    if (list.length >= limit) {
      alert(`You can only choose up to ${limit}.`);
      return;
    }

    setList([...list, item]);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleIdChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIdFile(file);
    setIdPreview(URL.createObjectURL(file));
  };

  const handleSelfieChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
  };

  const canContinue = () => {
    if (step === 1) return name.trim() && age.trim() && city.trim();
    if (step === 2) return photoFile || photoPreview;
    if (step === 3) return selectedInterests.length >= 1;

    if (step === 4) {
      return (
        selectedActivities.length >= 1 &&
        selectedVibes.length >= 1 &&
        socialEnergy
      );
    }

    return true;
  };

  const nextStep = () => {
    if (!canContinue()) {
      alert("Please complete this step first.");
      return;
    }

    if (step < totalSteps) setStep(step + 1);
  };

  const backStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const uploadMainProfilePhoto = async () => {
    if (!photoFile) return photoPreview || "";

    const photoRef = ref(
      storage,
      `profileImages/${user.uid}/${Date.now()}-${photoFile.name}`
    );

    await uploadBytes(photoRef, photoFile);
    return await getDownloadURL(photoRef);
  };

  const saveBaseProfile = async ({
    verificationStatus = "not_started",
    idImage = "",
    selfieImage = "",
  }) => {
    if (!user) {
      throw new Error("Please sign in again.");
    }

    const photoURL = await uploadMainProfilePhoto();

    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email || "",

        name: name.trim(),
        age: Number(age),
        city: city.trim(),
        bio: bio.trim(),
        profileImage: photoURL,

        interests: selectedInterests,
        activities: selectedActivities,
        vibes: selectedVibes,
        socialEnergy,

        verified: false,
        verificationStatus,
        idImage,
        selfieImage,

        onboardingComplete: true,
        completedOnboarding: true,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const skipVerification = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        alert("Please sign in again.");
        return;
    }

    try {
      setSaving(true);

      await saveBaseProfile({
        verificationStatus: "skipped",
      });

      navigate("/profile", { replace: true });
    } catch (error) {
      console.error("Skip verification error:", error);
      alert(error.message || "Something went wrong while saving your profile.");
      setSaving(false);
    }
  };

  const submitVerification = async () => {
    if (!user) {
      alert("Please sign in again.");
      return;
    }

    if (!idFile || !selfieFile) {
      alert("Please upload your ID and take a selfie first.");
      return;
    }

    try {
      setSaving(true);

      const idRef = ref(
        storage,
        `verification/${user.uid}/id-${Date.now()}-${idFile.name}`
      );

      await uploadBytes(idRef, idFile);
      const idURL = await getDownloadURL(idRef);

      const selfieRef = ref(
        storage,
        `verification/${user.uid}/selfie-${Date.now()}-${selfieFile.name}`
      );

      await uploadBytes(selfieRef, selfieFile);
      const selfieURL = await getDownloadURL(selfieRef);

      await saveBaseProfile({
        verificationStatus: "pending",
        idImage: idURL,
        selfieImage: selfieURL,
      });

      navigate("/profile", { replace: true });
    } catch (error) {
      console.error("Verification error:", error);
      alert("Something went wrong while submitting verification.");
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Welcome</h1>
            <p style={styles.subtitle}>let’s build your vibe 💕</p>
          </div>
          <Sparkles size={30} color="white" />
        </div>

        <div style={styles.progressOuter}>
          <div style={{ ...styles.progressInner, width: progress }} />
        </div>

        <p style={styles.stepText}>
          Step {step} of {totalSteps}
        </p>

        {step === 1 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Your Profile</h2>

            <input
              style={styles.input}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <textarea
              style={styles.textarea}
              placeholder="Short bio — tell people what you're like 💗"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
        )}

        {step === 2 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Profile Photo</h2>

            <label style={styles.photoBox}>
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={styles.photoPreview}
                />
              ) : (
                <div style={styles.photoPlaceholder}>
                  <Camera size={40} color="#ec5ca8" />
                  <p>Upload your photo</p>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>What are you into?</h2>
            <p style={styles.helper}>Choose as many as you want.</p>

            <div style={styles.grid}>
              {interestsOptions.map((interest) => {
                const active = selectedInterests.includes(interest);

                return (
                  <button
                    key={interest}
                    type="button"
                    style={{
                      ...styles.pill,
                      ...(active ? styles.pillActive : {}),
                    }}
                    onClick={() =>
                      toggleUnlimited(
                        interest,
                        selectedInterests,
                        setSelectedInterests
                      )
                    }
                  >
                    {active && <Check size={14} />}
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              What would you do with friends?
            </h2>
            <p style={styles.helper}>Choose as many as you want.</p>

            <div style={styles.grid}>
              {activityOptions.map((activity) => {
                const active = selectedActivities.includes(activity);

                return (
                  <button
                    key={activity}
                    type="button"
                    style={{
                      ...styles.pill,
                      ...(active ? styles.pillActive : {}),
                    }}
                    onClick={() =>
                      toggleUnlimited(
                        activity,
                        selectedActivities,
                        setSelectedActivities
                      )
                    }
                  >
                    {active && <Check size={14} />}
                    {activity}
                  </button>
                );
              })}
            </div>

            <h2 style={{ ...styles.sectionTitle, marginTop: 24 }}>
              Social Energy
            </h2>

            <div style={styles.grid}>
              {socialEnergyOptions.map((energy) => {
                const active = socialEnergy === energy;

                return (
                  <button
                    key={energy}
                    type="button"
                    style={{
                      ...styles.pill,
                      ...(active ? styles.pillActive : {}),
                    }}
                    onClick={() => setSocialEnergy(energy)}
                  >
                    {active && <Check size={14} />}
                    {energy}
                  </button>
                );
              })}
            </div>

            <h2 style={{ ...styles.sectionTitle, marginTop: 24 }}>
              Choose Your Vibe
            </h2>
            <p style={styles.helper}>Choose up to 3.</p>

            <div style={styles.grid}>
              {vibeOptions.map((vibe) => {
                const active = selectedVibes.includes(vibe);

                return (
                  <button
                    key={vibe}
                    type="button"
                    style={{
                      ...styles.pill,
                      ...(active ? styles.pillActive : {}),
                    }}
                    onClick={() =>
                      toggleLimited(vibe, selectedVibes, setSelectedVibes, 3)
                    }
                  >
                    {active && <Check size={14} />}
                    {vibe}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={styles.section}>
            <div style={styles.verifyBox}>
              <ShieldCheck size={52} color="#ec5ca8" />

              <h2 style={styles.sectionTitle}>Verify Your Identity</h2>

              <p style={styles.verifyText}>
                Verification is optional. It helps build trust and adds a
                Verified badge to your profile. You can verify now or later from
                your profile settings.
              </p>

              {!showVerificationForm ? (
                <div style={styles.verifyActions}>
                  <button
                    type="button"
                    style={styles.nextButton}
                    onClick={() => setShowVerificationForm(true)}
                    disabled={saving}
                  >
                    Verify Now
                    <ShieldCheck size={18} />
                  </button>

                  <button
                    type="button"
                    style={styles.skipButton}
                    onClick={skipVerification}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Skip For Now"}
                    {!saving && <ArrowRight size={18} />}
                  </button>
                </div>
              ) : (
                <>
                  <label style={styles.uploadBox}>
                    {idPreview ? (
                      <img
                        src={idPreview}
                        alt="ID Preview"
                        style={styles.photoPreview}
                      />
                    ) : (
                      <div>
                        <Camera size={34} color="#ec5ca8" />
                        <p>Upload ID photo</p>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIdChange}
                      style={{ display: "none" }}
                    />
                  </label>

                  <label style={styles.uploadBox}>
                    {selfiePreview ? (
                      <img
                        src={selfiePreview}
                        alt="Selfie Preview"
                        style={styles.photoPreview}
                      />
                    ) : (
                      <div>
                        <Camera size={34} color="#ec5ca8" />
                        <p>Take real-time selfie</p>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleSelfieChange}
                      style={{ display: "none" }}
                    />
                  </label>

                  <button
                    type="button"
                    style={styles.nextButtonFull}
                    onClick={submitVerification}
                    disabled={saving}
                  >
                    {saving ? "Submitting..." : "Submit Verification"}
                    {!saving && <ArrowRight size={18} />}
                  </button>

                  <button
                    type="button"
                    style={styles.skipTextButton}
                    onClick={skipVerification}
                    disabled={saving}
                  >
                    Skip and verify later
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {step < totalSteps && (
          <div style={styles.footer}>
            {step > 1 ? (
              <button type="button" style={styles.backButton} onClick={backStep}>
                <ArrowLeft size={18} />
                Back
              </button>
            ) : (
              <div />
            )}

            <button type="button" style={styles.nextButton} onClick={nextStep}>
              Continue
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === totalSteps && (
          <div style={styles.footer}>
            <button type="button" style={styles.backButton} onClick={backStep}>
              <ArrowLeft size={18} />
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #fff6fb 0%, #ffeaf4 45%, #ffd6e8 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  card: {
    width: "100%",
    maxWidth: "430px",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "34px",
    padding: "24px",
    boxShadow: "0 22px 55px rgba(236, 92, 168, 0.18)",
    border: "1px solid rgba(255, 214, 232, 0.95)",
  },

  header: {
    background: "linear-gradient(135deg, #ec5ca8, #f27bb7)",
    margin: "-24px -24px 22px",
    padding: "34px 28px",
    borderRadius: "34px 34px 0 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    margin: 0,
    fontSize: "42px",
    fontWeight: "950",
    color: "white",
    letterSpacing: "-1.5px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "rgba(255,255,255,0.9)",
    fontSize: "17px",
    fontWeight: "800",
  },

  progressOuter: {
    height: "9px",
    background: "#ffe1ef",
    borderRadius: "999px",
    overflow: "hidden",
  },

  progressInner: {
    height: "100%",
    background: "linear-gradient(90deg, #ec5ca8, #f27bb7)",
    borderRadius: "999px",
    transition: "width 0.25s ease",
  },

  stepText: {
    fontSize: "13px",
    color: "#8c6676",
    marginTop: "10px",
    marginBottom: "18px",
    fontWeight: "800",
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "23px",
    fontWeight: "950",
    color: "#ec5ca8",
  },

  helper: {
    margin: "0 0 4px",
    color: "#8c6676",
    fontSize: "13px",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #f5c8dc",
    background: "#fff8fc",
    borderRadius: "18px",
    padding: "15px 16px",
    fontSize: "15px",
    outline: "none",
    color: "#2b1b23",
    fontWeight: "700",
  },

  textarea: {
    width: "100%",
    minHeight: "110px",
    boxSizing: "border-box",
    border: "1px solid #f5c8dc",
    background: "#fff8fc",
    borderRadius: "18px",
    padding: "15px 16px",
    fontSize: "15px",
    outline: "none",
    resize: "none",
    color: "#2b1b23",
    fontWeight: "700",
  },

  photoBox: {
    height: "260px",
    borderRadius: "28px",
    border: "2px dashed #ef8ec0",
    background: "#fff8fc",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    cursor: "pointer",
  },

  photoPlaceholder: {
    textAlign: "center",
    color: "#8c6676",
    fontWeight: "800",
  },

  photoPreview: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  uploadBox: {
    height: "180px",
    borderRadius: "24px",
    border: "2px dashed #ef8ec0",
    background: "#fff8fc",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    cursor: "pointer",
    color: "#8c6676",
    fontWeight: "850",
    textAlign: "center",
    marginTop: "12px",
  },

  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },

  pill: {
    border: "1px solid #f5c8dc",
    background: "#fff8fc",
    color: "#6f5360",
    borderRadius: "999px",
    padding: "11px 15px",
    fontSize: "14px",
    fontWeight: "850",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
  },

  pillActive: {
    background: "linear-gradient(135deg, #ec5ca8, #f27bb7)",
    color: "white",
    border: "1px solid #ec5ca8",
    boxShadow: "0 8px 18px rgba(236, 92, 168, 0.28)",
  },

  verifyBox: {
    background: "#fff8fc",
    border: "1px solid #f5c8dc",
    borderRadius: "28px",
    padding: "28px",
    textAlign: "center",
  },

  verifyText: {
    color: "#8c6676",
    fontSize: "14px",
    lineHeight: 1.5,
    marginBottom: "20px",
    fontWeight: "650",
  },

  verifyActions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "24px",
    gap: "12px",
  },

  backButton: {
    border: "none",
    background: "#fff0f7",
    color: "#ec5ca8",
    borderRadius: "999px",
    padding: "13px 18px",
    fontSize: "15px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
  },

  nextButton: {
    border: "none",
    background: "linear-gradient(135deg, #ec5ca8, #f27bb7)",
    color: "white",
    borderRadius: "999px",
    padding: "13px 20px",
    fontSize: "15px",
    fontWeight: "950",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(236, 92, 168, 0.35)",
  },

  nextButtonFull: {
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg, #ec5ca8, #f27bb7)",
    color: "white",
    borderRadius: "999px",
    padding: "14px 20px",
    fontSize: "15px",
    fontWeight: "950",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(236, 92, 168, 0.35)",
    marginTop: "14px",
  },

  skipButton: {
    border: "1px solid #f5c8dc",
    background: "#fff0f7",
    color: "#ec5ca8",
    borderRadius: "999px",
    padding: "13px 20px",
    fontSize: "15px",
    fontWeight: "950",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    cursor: "pointer",
  },

  skipTextButton: {
    border: "none",
    background: "transparent",
    color: "#8c6676",
    fontSize: "14px",
    fontWeight: "850",
    marginTop: "8px",
    cursor: "pointer",
  },
};