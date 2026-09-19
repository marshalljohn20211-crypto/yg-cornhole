export type ShippingDetails = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: "US" | "CA";
  deliveryNotes: string;
};

type ShippingInput = Partial<Record<keyof ShippingDetails, unknown>>;

function requiredText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw new Error(`Enter a valid ${label}.`);
  }
  return value.trim();
}

function optionalText(value: unknown, label: string, maxLength: number) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new Error(`Enter a valid ${label}.`);
  }
  return value.trim();
}

export function cleanShipping(raw: unknown): ShippingDetails {
  if (!raw || typeof raw !== "object") throw new Error("Enter your delivery details before paying.");
  const shipping = raw as ShippingInput;
  const email = requiredText(shipping.email, "email address", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");

  const phone = requiredText(shipping.phone, "contact number", 30);
  if (!/^\+?[0-9][0-9 ()-]{6,28}[0-9]$/.test(phone)) {
    throw new Error("Enter a valid contact number, including area code.");
  }

  const countryCode = requiredText(shipping.countryCode, "country", 2).toUpperCase();
  if (countryCode !== "US" && countryCode !== "CA") {
    throw new Error("Choose a supported delivery country.");
  }
  const state = requiredText(shipping.state, "state or province", 120).toUpperCase();
  const postalCode = requiredText(shipping.postalCode, "postal code", 60).toUpperCase();

  if (!/^[A-Z]{2}$/.test(state)) {
    throw new Error(`Enter a 2-letter ${countryCode === "US" ? "state" : "province"} abbreviation.`);
  }
  if (countryCode === "US" && !/^\d{5}(?:-\d{4})?$/.test(postalCode)) {
    throw new Error("Enter a valid US ZIP code, such as 75001.");
  }
  if (countryCode === "CA" && !/^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/.test(postalCode)) {
    throw new Error("Enter a valid Canadian postal code, such as M5V 2T6.");
  }

  return {
    fullName: requiredText(shipping.fullName, "full name", 300),
    email,
    phone,
    addressLine1: requiredText(shipping.addressLine1, "street address", 300),
    addressLine2: optionalText(shipping.addressLine2, "apartment or suite", 300),
    city: requiredText(shipping.city, "city", 120),
    state,
    postalCode,
    countryCode,
    deliveryNotes: optionalText(shipping.deliveryNotes, "delivery note", 500),
  };
}
