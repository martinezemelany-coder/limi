// src/lib/location.js

import { doc, GeoPoint, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const LOCATION_TIMEOUT_MS = 15000;
const LOCATION_CACHE_TIME_MS = 5 * 60 * 1000;
const EARTH_RADIUS_MILES = 3958.8;

/*
|--------------------------------------------------------------------------
| Location error messages
|--------------------------------------------------------------------------
*/

function getLocationErrorMessage(error) {
  if (!error) {
    return "We couldn't access your location.";
  }

  switch (error.code) {
    case 1:
      return "Location permission was denied. Please allow location access in your browser or phone settings.";

    case 2:
      return "Your location is currently unavailable. Please check that Location Services are turned on.";

    case 3:
      return "Finding your location took too long. Please try again.";

    default:
      return error.message || "Something went wrong while finding your location.";
  }
}

/*
|--------------------------------------------------------------------------
| Get the user's current GPS coordinates
|--------------------------------------------------------------------------
*/

export function getCurrentLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Location is only available in a browser."));
      return;
    }

    if (!navigator.geolocation) {
      reject(
        new Error("Location services are not supported on this device.")
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || null,
          altitude: position.coords.altitude || null,
          heading: position.coords.heading || null,
          speed: position.coords.speed || null,
          timestamp: position.timestamp || Date.now(),
        });
      },

      (error) => {
        reject(new Error(getLocationErrorMessage(error)));
      },

      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? LOCATION_TIMEOUT_MS,
        maximumAge: options.maximumAge ?? LOCATION_CACHE_TIME_MS,
      }
    );
  });
}

/*
|--------------------------------------------------------------------------
| Check location permission
|--------------------------------------------------------------------------
|
| Possible results:
| "granted"
| "denied"
| "prompt"
| "unsupported"
|
*/

export async function getLocationPermissionStatus() {
  try {
    if (
      typeof navigator === "undefined" ||
      !navigator.permissions ||
      !navigator.permissions.query
    ) {
      return "unsupported";
    }

    const permission = await navigator.permissions.query({
      name: "geolocation",
    });

    return permission.state;
  } catch (error) {
    console.warn("Could not check location permission:", error);
    return "unsupported";
  }
}

/*
|--------------------------------------------------------------------------
| Watch for location-permission changes
|--------------------------------------------------------------------------
|
| Example:
|
| const cleanup = watchLocationPermission((status) => {
|   console.log(status);
| });
|
| cleanup();
|
*/

export async function watchLocationPermission(callback) {
  if (typeof callback !== "function") {
    return () => {};
  }

  try {
    if (
      typeof navigator === "undefined" ||
      !navigator.permissions ||
      !navigator.permissions.query
    ) {
      callback("unsupported");
      return () => {};
    }

    const permission = await navigator.permissions.query({
      name: "geolocation",
    });

    callback(permission.state);

    const handleChange = () => {
      callback(permission.state);
    };

    permission.addEventListener("change", handleChange);

    return () => {
      permission.removeEventListener("change", handleChange);
    };
  } catch (error) {
    console.warn("Could not watch location permission:", error);
    callback("unsupported");

    return () => {};
  }
}

/*
|--------------------------------------------------------------------------
| Reverse geocode coordinates into city/state
|--------------------------------------------------------------------------
|
| This uses OpenStreetMap Nominatim.
|
| GPS:
| 28.5383, -81.3792
|
| Result:
| Orlando, FL
|
*/

export async function reverseGeocode(latitude, longitude) {
  validateCoordinates(latitude, longitude);

  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    addressdetails: "1",
    zoom: "18",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "We found your location but couldn't identify your city."
    );
  }

  const data = await response.json();
  const address = data.address || {};

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.suburb ||
    address.county ||
    "";

  const state = address.state || "";

  const stateCode =
    getStateCodeFromAddress(address) || getUSStateAbbreviation(state);

  const country = address.country || "";
  const countryCode = address.country_code
    ? address.country_code.toUpperCase()
    : "";

  const postalCode = address.postcode || "";

  const displayLocation = createDisplayLocation({
    city,
    state,
    stateCode,
    country,
    countryCode,
  });

  return {
    city,
    state,
    stateCode,
    country,
    countryCode,
    postalCode,
    displayLocation,
    fullAddress: data.display_name || displayLocation,
    neighborhood:
      address.neighbourhood ||
      address.neighborhood ||
      address.quarter ||
      address.suburb ||
      "",
  };
}

/*
|--------------------------------------------------------------------------
| Save location directly to the signed-in user's Firestore profile
|--------------------------------------------------------------------------
*/

export async function saveCurrentUserLocation(locationData, options = {}) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be signed in to save your location.");
  }

  if (!locationData) {
    throw new Error("No location information was provided.");
  }

  const latitude = Number(locationData.latitude);
  const longitude = Number(locationData.longitude);

  validateCoordinates(latitude, longitude);

  const city = locationData.city || "";
  const state = locationData.state || "";
  const stateCode = locationData.stateCode || "";
  const country = locationData.country || "";
  const countryCode = locationData.countryCode || "";
  const postalCode = locationData.postalCode || "";

  const displayLocation =
    locationData.displayLocation ||
    createDisplayLocation({
      city,
      state,
      stateCode,
      country,
      countryCode,
    });

  const locationToSave = {
    city,
    state,
    stateCode,
    country,
    countryCode,
    postalCode,
    displayLocation,

    coordinates: new GeoPoint(latitude, longitude),

    latitude,
    longitude,

    accuracy:
      typeof locationData.accuracy === "number"
        ? locationData.accuracy
        : null,

    source: options.source || locationData.source || "device",
    updatedAt: serverTimestamp(),
  };

  const userUpdates = {
    location: locationToSave,

    // These fields help older pages in your app that may still read
    // user.city or user.displayLocation directly.
    city,
    state,
    stateCode,
    displayLocation,

    locationEnabled: true,
    locationUpdatedAt: serverTimestamp(),
  };

  if (
    options.distancePreference !== undefined &&
    options.distancePreference !== null
  ) {
    userUpdates.distancePreference = normalizeDistancePreference(
      options.distancePreference
    );
  }

  await setDoc(doc(db, "users", currentUser.uid), userUpdates, {
    merge: true,
  });

  return {
    ...locationToSave,
    coordinates: {
      latitude,
      longitude,
    },
  };
}

/*
|--------------------------------------------------------------------------
| Complete location process
|--------------------------------------------------------------------------
|
| This:
| 1. Requests GPS permission
| 2. Gets coordinates
| 3. Converts them into city/state
| 4. Saves everything to Firestore
| 5. Returns the completed location
|
*/

export async function updateCurrentUserLocation(options = {}) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be signed in to update your location.");
  }

  const coordinates = await getCurrentLocation({
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    timeout: options.timeout ?? LOCATION_TIMEOUT_MS,
    maximumAge: options.maximumAge ?? LOCATION_CACHE_TIME_MS,
  });

  let address;

  try {
    address = await reverseGeocode(
      coordinates.latitude,
      coordinates.longitude
    );
  } catch (error) {
    console.error("Reverse geocoding failed:", error);

    // Coordinates can still be saved even if the city lookup fails.
    address = {
      city: "",
      state: "",
      stateCode: "",
      country: "",
      countryCode: "",
      postalCode: "",
      displayLocation: "Current location",
      fullAddress: "",
      neighborhood: "",
    };
  }

  const completeLocation = {
    ...coordinates,
    ...address,
    source: "device",
  };

  const savedLocation = await saveCurrentUserLocation(completeLocation, {
    source: "device",
    distancePreference: options.distancePreference,
  });

  return {
    ...completeLocation,
    ...savedLocation,
  };
}

/*
|--------------------------------------------------------------------------
| Save a manually selected location
|--------------------------------------------------------------------------
|
| Use this when the user searches for or enters a city manually.
|
*/

export async function saveManualLocation({
  latitude,
  longitude,
  city = "",
  state = "",
  stateCode = "",
  country = "",
  countryCode = "",
  postalCode = "",
  displayLocation = "",
  distancePreference,
}) {
  validateCoordinates(latitude, longitude);

  return saveCurrentUserLocation(
    {
      latitude: Number(latitude),
      longitude: Number(longitude),
      city,
      state,
      stateCode,
      country,
      countryCode,
      postalCode,
      displayLocation:
        displayLocation ||
        createDisplayLocation({
          city,
          state,
          stateCode,
          country,
          countryCode,
        }),
      source: "manual",
    },
    {
      source: "manual",
      distancePreference,
    }
  );
}

/*
|--------------------------------------------------------------------------
| Turn a Firestore GeoPoint or regular object into coordinates
|--------------------------------------------------------------------------
*/

export function extractCoordinates(location) {
  if (!location) {
    return null;
  }

  // Full user document
  if (location.location) {
    return extractCoordinates(location.location);
  }

  // Firestore GeoPoint stored at location.coordinates
  if (location.coordinates) {
    return extractCoordinates(location.coordinates);
  }

  // Firestore GeoPoint
  if (
    typeof location.latitude === "number" &&
    typeof location.longitude === "number"
  ) {
    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }

  // Older Firestore data or plain JS objects
  const latitude = Number(
    location.latitude ?? location.lat ?? location._lat
  );

  const longitude = Number(
    location.longitude ?? location.lng ?? location.lon ?? location._long
  );

  if (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    isValidLatitude(latitude) &&
    isValidLongitude(longitude)
  ) {
    return {
      latitude,
      longitude,
    };
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| Calculate distance between two sets of coordinates
|--------------------------------------------------------------------------
|
| Uses the Haversine formula.
|
*/

export function calculateDistanceMiles(
  latitude1,
  longitude1,
  latitude2,
  longitude2
) {
  const lat1 = Number(latitude1);
  const lon1 = Number(longitude1);
  const lat2 = Number(latitude2);
  const lon2 = Number(longitude2);

  validateCoordinates(lat1, lon1);
  validateCoordinates(lat2, lon2);

  const latitudeDifference = toRadians(lat2 - lat1);
  const longitudeDifference = toRadians(lon2 - lon1);

  const firstLatitude = toRadians(lat1);
  const secondLatitude = toRadians(lat2);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
}

/*
|--------------------------------------------------------------------------
| Calculate distance between two user/location objects
|--------------------------------------------------------------------------
*/

export function getDistanceBetweenLocations(firstLocation, secondLocation) {
  const firstCoordinates = extractCoordinates(firstLocation);
  const secondCoordinates = extractCoordinates(secondLocation);

  if (!firstCoordinates || !secondCoordinates) {
    return null;
  }

  try {
    return calculateDistanceMiles(
      firstCoordinates.latitude,
      firstCoordinates.longitude,
      secondCoordinates.latitude,
      secondCoordinates.longitude
    );
  } catch (error) {
    console.error("Could not calculate distance:", error);
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| Add distance to every user
|--------------------------------------------------------------------------
*/

export function addDistanceToUsers(currentUserData, users = []) {
  if (!Array.isArray(users)) {
    return [];
  }

  return users.map((user) => {
    const distanceMiles = getDistanceBetweenLocations(
      currentUserData,
      user
    );

    return {
      ...user,
      distanceMiles,
      formattedDistance:
        distanceMiles === null ? null : formatDistance(distanceMiles),
    };
  });
}

/*
|--------------------------------------------------------------------------
| Filter users by maximum distance
|--------------------------------------------------------------------------
*/

export function filterUsersByDistance(
  currentUserData,
  users = [],
  maximumDistanceMiles = 25
) {
  const maximumDistance = normalizeDistancePreference(
    maximumDistanceMiles
  );

  return addDistanceToUsers(currentUserData, users)
    .filter((user) => {
      if (user.distanceMiles === null) {
        return false;
      }

      return user.distanceMiles <= maximumDistance;
    })
    .sort((firstUser, secondUser) => {
      return firstUser.distanceMiles - secondUser.distanceMiles;
    });
}

/*
|--------------------------------------------------------------------------
| Check whether another user is inside the selected distance range
|--------------------------------------------------------------------------
*/

export function isWithinDistance(
  currentUserData,
  otherUserData,
  maximumDistanceMiles = 25
) {
  const distanceMiles = getDistanceBetweenLocations(
    currentUserData,
    otherUserData
  );

  if (distanceMiles === null) {
    return false;
  }

  return (
    distanceMiles <= normalizeDistancePreference(maximumDistanceMiles)
  );
}

/*
|--------------------------------------------------------------------------
| Format distance for the app
|--------------------------------------------------------------------------
*/

export function formatDistance(distanceMiles) {
  const distance = Number(distanceMiles);

  if (!Number.isFinite(distance) || distance < 0) {
    return "";
  }

  if (distance < 0.25) {
    return "Nearby";
  }

  if (distance < 1) {
    return "Less than 1 mile away";
  }

  const roundedDistance = Math.round(distance);

  return `${roundedDistance} ${
    roundedDistance === 1 ? "mile" : "miles"
  } away`;
}

/*
|--------------------------------------------------------------------------
| Format location name safely
|--------------------------------------------------------------------------
*/

export function getLocationDisplayName(userOrLocation) {
  if (!userOrLocation) {
    return "";
  }

  const location = userOrLocation.location || userOrLocation;

  if (location.displayLocation) {
    return location.displayLocation;
  }

  if (userOrLocation.displayLocation) {
    return userOrLocation.displayLocation;
  }

  const city = location.city || userOrLocation.city || "";
  const stateCode =
    location.stateCode || userOrLocation.stateCode || "";
  const state = location.state || userOrLocation.state || "";

  return [city, stateCode || state].filter(Boolean).join(", ");
}

/*
|--------------------------------------------------------------------------
| Remove exact coordinates before displaying/sharing user data
|--------------------------------------------------------------------------
|
| This is useful if you create public profile objects.
|
*/

export function createPublicLocation(location) {
  if (!location) {
    return null;
  }

  return {
    city: location.city || "",
    state: location.state || "",
    stateCode: location.stateCode || "",
    country: location.country || "",
    countryCode: location.countryCode || "",
    displayLocation: getLocationDisplayName(location),
  };
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function createDisplayLocation({
  city = "",
  state = "",
  stateCode = "",
  country = "",
  countryCode = "",
}) {
  if (city && (stateCode || state)) {
    return `${city}, ${stateCode || state}`;
  }

  if (city && countryCode && countryCode !== "US") {
    return `${city}, ${countryCode}`;
  }

  if (city) {
    return city;
  }

  if (stateCode || state) {
    return stateCode || state;
  }

  return country;
}

function getStateCodeFromAddress(address) {
  const possibleCodes = [
    address["ISO3166-2-lvl4"],
    address["ISO3166-2-lvl3"],
    address["ISO3166-2-lvl2"],
  ].filter(Boolean);

  for (const code of possibleCodes) {
    const pieces = String(code).split("-");

    if (pieces.length > 1) {
      return pieces[pieces.length - 1].toUpperCase();
    }
  }

  return "";
}

function normalizeDistancePreference(value) {
  const distance = Number(value);

  if (!Number.isFinite(distance)) {
    return 25;
  }

  return Math.min(Math.max(Math.round(distance), 1), 500);
}

function validateCoordinates(latitude, longitude) {
  if (!Number.isFinite(Number(latitude))) {
    throw new Error("The latitude is missing or invalid.");
  }

  if (!Number.isFinite(Number(longitude))) {
    throw new Error("The longitude is missing or invalid.");
  }

  if (!isValidLatitude(Number(latitude))) {
    throw new Error("Latitude must be between -90 and 90.");
  }

  if (!isValidLongitude(Number(longitude))) {
    throw new Error("Longitude must be between -180 and 180.");
  }
}

function isValidLatitude(latitude) {
  return latitude >= -90 && latitude <= 90;
}

function isValidLongitude(longitude) {
  return longitude >= -180 && longitude <= 180;
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/*
|--------------------------------------------------------------------------
| US state abbreviations
|--------------------------------------------------------------------------
*/

function getUSStateAbbreviation(stateName) {
  if (!stateName) {
    return "";
  }

  const states = {
    Alabama: "AL",
    Alaska: "AK",
    Arizona: "AZ",
    Arkansas: "AR",
    California: "CA",
    Colorado: "CO",
    Connecticut: "CT",
    Delaware: "DE",
    Florida: "FL",
    Georgia: "GA",
    Hawaii: "HI",
    Idaho: "ID",
    Illinois: "IL",
    Indiana: "IN",
    Iowa: "IA",
    Kansas: "KS",
    Kentucky: "KY",
    Louisiana: "LA",
    Maine: "ME",
    Maryland: "MD",
    Massachusetts: "MA",
    Michigan: "MI",
    Minnesota: "MN",
    Mississippi: "MS",
    Missouri: "MO",
    Montana: "MT",
    Nebraska: "NE",
    Nevada: "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    Ohio: "OH",
    Oklahoma: "OK",
    Oregon: "OR",
    Pennsylvania: "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    Tennessee: "TN",
    Texas: "TX",
    Utah: "UT",
    Vermont: "VT",
    Virginia: "VA",
    Washington: "WA",
    "West Virginia": "WV",
    Wisconsin: "WI",
    Wyoming: "WY",
    "District of Columbia": "DC",
  };

  const normalizedState = String(stateName).trim();

  if (normalizedState.length === 2) {
    return normalizedState.toUpperCase();
  }

  return states[normalizedState] || "";
}