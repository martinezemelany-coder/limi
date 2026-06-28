import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Upload,
  Check,
  X,
  ArrowLeft,
} from "lucide-react";

import { auth, db, storage } from "../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

function FileUploadBox({ label, description, file, preview, onChange }) {
  return (
    <label className="block cursor-pointer rounded-[30px] border border-[#f4dce7] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0f6] text-[#ec64a8]">
          {preview ? <Check size={24} /> : <Upload size={24} />}
        </div>

        <div className="flex-1">
          <p className="text-lg font-black text-[#2b1d28]">{label}</p>
          <p className="mt-1 text-sm font-semibold text-[#80636f]">
            {file ? file.name : description}
          </p>
        </div>
      </div>

      {preview && (
        <img
          src={preview}
          alt=""
          className="mt-4 h-44 w-full rounded-[24px] object-cover"
        />
      )}

      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </label>
  );
}

export default function Verify() {
  const navigate = useNavigate();

  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);

  const [idPreview, setIdPreview] = useState("");
  const [selfiePreview, setSelfiePreview] = useState("");

  const [status, setStatus] = useState("not_verified");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists()) {
        setStatus(snap.data().verificationStatus || "not_verified");
      }
    }

    loadStatus();
  }, []);

  const handleIdUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIdFile(file);
    setIdPreview(URL.createObjectURL(file));
  };

  const handleSelfieUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
  };

  const skipVerification = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("You need to be logged in.");
      return;
    }

    try {
      setLoading(true);

      await setDoc(
        doc(db, "users", user.uid),
        {
          onboardingComplete: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      navigate("/profile", { replace: true });
    } catch (error) {
      console.error("Skip verification error:", error);
      alert(error.message || "Could not continue. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitVerification = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("You need to be logged in.");
      return;
    }

    if (!idFile || !selfieFile) {
      alert("Please upload both your ID and selfie 💕");
      return;
    }

    try {
      setLoading(true);

      console.log("Starting verification upload...");

      const timestamp = Date.now();

      const idRef = ref(storage, `verification/${user.uid}/id-${timestamp}.jpg`);
      const selfieRef = ref(
        storage,
        `verification/${user.uid}/selfie-${timestamp}`
      );

      console.log("Uploading ID...");
      await uploadBytes(idRef, idFile);

      console.log("Uploading selfie...");
      await uploadBytes(selfieRef, selfieFile);

      console.log("Getting ID URL...");
      const idUrl = await getDownloadURL(idRef);

      console.log("Getting selfie URL...");
      const selfieUrl = await getDownloadURL(selfieRef);

      console.log("Saving verification request...");
      await setDoc(
        doc(db, "verificationRequests", user.uid),
        {
          uid: user.uid,
          email: user.email || "",
          idUrl,
          selfieUrl,
          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log("Saving user profile status...");
      await setDoc(
        doc(db, "users", user.uid),
        {
          verificationStatus: "pending",
          verified: false,
          onboardingComplete: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log("Going to profile...");
      navigate("/profile", { replace: true });
    } catch (error) {
      console.error("Verification error:", error);
      alert(error.message || "Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff6fa] pb-28">
      <div className="mx-auto max-w-md px-4 pt-5">
        <div className="rounded-[38px] bg-[#fffdfd] p-5 shadow-[0_10px_35px_rgba(244,168,194,0.14)]">
          <button
            onClick={() => navigate("/onboarding")}
            disabled={loading}
            className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#fff0f6] text-[#ec64a8] disabled:opacity-60"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className="text-[50px] leading-none tracking-[-0.06em] text-[#eb6aaa]"
                style={{ fontWeight: 1000 }}
              >
                Verify
              </h1>

              <p className="mt-2 text-lg font-bold text-[#80636f]">
                keep Limi safer 💕
              </p>
            </div>

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#d94b93] text-white shadow-[0_12px_24px_rgba(237,102,157,0.25)]">
              <ShieldCheck size={34} />
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-[#f4dce7] bg-[#fff8fb] p-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#80636f]">
              Status
            </p>

            <p className="mt-2 text-2xl font-black text-[#2b1d28]">
              {status === "verified"
                ? "Verified"
                : status === "pending"
                ? "Pending Review"
                : status === "rejected"
                ? "Rejected"
                : "Not Verified"}
            </p>

            <p className="mt-3 text-sm font-semibold leading-6 text-[#80636f]">
              Your ID is private and will never be shown on your public profile.
              Only your verification badge is visible.
            </p>
          </div>
        </div>

        {status === "pending" ? (
          <div className="mt-6 rounded-[36px] bg-white p-8 text-center shadow-sm">
            <ShieldCheck size={46} className="mx-auto text-[#ec64a8]" />
            <h2 className="mt-4 text-2xl font-black text-[#e85da2]">
              Verification pending
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#80636f]">
              Your request was submitted. Once reviewed, your profile badge will
              update.
            </p>

            <button
              onClick={() => navigate("/profile", { replace: true })}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white shadow-[0_12px_24px_rgba(237,102,157,0.22)]"
            >
              Go To Profile
            </button>
          </div>
        ) : status === "verified" ? (
          <div className="mt-6 rounded-[36px] bg-white p-8 text-center shadow-sm">
            <Check size={46} className="mx-auto text-green-500" />
            <h2 className="mt-4 text-2xl font-black text-[#e85da2]">
              You’re verified
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#80636f]">
              Your profile now shows a verified badge 💕
            </p>

            <button
              onClick={() => navigate("/profile", { replace: true })}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-lg font-black text-white shadow-[0_12px_24px_rgba(237,102,157,0.22)]"
            >
              Go To Profile
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <FileUploadBox
              label="Upload Government ID"
              description="Driver’s license, passport, or state ID"
              file={idFile}
              preview={idPreview}
              onChange={handleIdUpload}
            />

            <FileUploadBox
              label="Upload Selfie"
              description="A clear selfie to match your ID"
              file={selfieFile}
              preview={selfiePreview}
              onChange={handleSelfieUpload}
            />

            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="flex gap-3">
                <Check className="mt-1 shrink-0 text-[#ec64a8]" size={20} />
                <p className="text-sm font-semibold leading-6 text-[#80636f]">
                  Verification is optional, but it helps other users know you’re
                  real.
                </p>
              </div>

              <div className="mt-3 flex gap-3">
                <X className="mt-1 shrink-0 text-[#ec64a8]" size={20} />
                <p className="text-sm font-semibold leading-6 text-[#80636f]">
                  Your ID will not appear on your profile.
                </p>
              </div>
            </div>

            <button
              onClick={submitVerification}
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-5 text-lg font-black text-white shadow-[0_12px_24px_rgba(237,102,157,0.22)] disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Verification 💕"}
            </button>

            <button
              onClick={skipVerification}
              disabled={loading}
              className="w-full rounded-full border border-[#f1d8e3] bg-white py-4 text-lg font-black text-[#d94b93] disabled:opacity-60"
            >
              Skip For Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}