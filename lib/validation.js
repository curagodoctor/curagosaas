// Validation utility functions for booking APIs

// Validate Indian phone number (10 digits)
export const validatePhone = (phone) => {
  if (!phone) {
    return { valid: false, error: "Phone number is required" };
  }

  const cleanPhone = phone.toString().replace(/\D/g, '');

  // Remove country code if present (91 for India)
  const phoneWithoutCode = cleanPhone.startsWith('91') && cleanPhone.length === 12
    ? cleanPhone.substring(2)
    : cleanPhone;

  if (phoneWithoutCode.length !== 10) {
    return { valid: false, error: "Phone number must be 10 digits" };
  }

  // Check if it starts with valid Indian mobile prefixes (6-9)
  if (!/^[6-9]/.test(phoneWithoutCode)) {
    return { valid: false, error: "Invalid Indian phone number format" };
  }

  return { valid: true, cleanPhone: phoneWithoutCode };
};

// Validate email format
export const validateEmail = (email) => {
  if (!email) {
    return { valid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  // Check for reasonable length
  if (email.length > 254) {
    return { valid: false, error: "Email address is too long" };
  }

  return { valid: true };
};

// Validate date (YYYY-MM-DD format, not in the past)
export const validateDate = (dateString) => {
  if (!dateString) {
    return { valid: false, error: "Date is required" };
  }

  // Check format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return { valid: false, error: "Invalid date format. Use YYYY-MM-DD" };
  }

  // Parse the date
  const inputDate = new Date(dateString + 'T00:00:00');

  // Check if it's a valid date
  if (isNaN(inputDate.getTime())) {
    return { valid: false, error: "Invalid date" };
  }

  // Check if date is not in the past (compare dates only, not time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (inputDate < today) {
    return { valid: false, error: "Date cannot be in the past" };
  }

  // Check if date is not too far in the future (e.g., max 6 months)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);

  if (inputDate > maxDate) {
    return { valid: false, error: "Date cannot be more than 6 months in the future" };
  }

  return { valid: true };
};

// Validate time format (HH:MM)
export const validateTime = (timeString) => {
  if (!timeString) {
    return { valid: false, error: "Time is required" };
  }

  // Check format (HH:MM)
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(timeString)) {
    return { valid: false, error: "Invalid time format. Use HH:MM" };
  }

  return { valid: true };
};

// Validate name (non-empty, reasonable length)
export const validateName = (name) => {
  if (!name) {
    return { valid: false, error: "Name is required" };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters" };
  }

  if (trimmedName.length > 100) {
    return { valid: false, error: "Name must be less than 100 characters" };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-'.]+$/.test(trimmedName)) {
    return { valid: false, error: "Name contains invalid characters" };
  }

  return { valid: true, cleanName: trimmedName };
};

// Validate age (1-120)
export const validateAge = (age) => {
  if (!age && age !== 0) {
    return { valid: false, error: "Age is required" };
  }

  const numAge = parseInt(age, 10);

  if (isNaN(numAge)) {
    return { valid: false, error: "Age must be a number" };
  }

  if (numAge < 1 || numAge > 120) {
    return { valid: false, error: "Age must be between 1 and 120" };
  }

  return { valid: true, cleanAge: numAge };
};

// Validate gender
export const validateGender = (gender) => {
  if (!gender) {
    return { valid: false, error: "Gender is required" };
  }

  const validGenders = ['male', 'female', 'other', 'Male', 'Female', 'Other'];

  if (!validGenders.includes(gender)) {
    return { valid: false, error: "Invalid gender selection" };
  }

  return { valid: true };
};

// Validate all booking fields at once
export const validateBookingData = (data) => {
  const errors = [];

  const nameResult = validateName(data.name);
  if (!nameResult.valid) errors.push(nameResult.error);

  const ageResult = validateAge(data.age);
  if (!ageResult.valid) errors.push(ageResult.error);

  const genderResult = validateGender(data.gender);
  if (!genderResult.valid) errors.push(genderResult.error);

  const phoneResult = validatePhone(data.whatsapp || data.phone);
  if (!phoneResult.valid) errors.push(phoneResult.error);

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) errors.push(emailResult.error);

  const dateResult = validateDate(data.date);
  if (!dateResult.valid) errors.push(dateResult.error);

  const timeResult = validateTime(data.time);
  if (!timeResult.valid) errors.push(timeResult.error);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    cleanData: {
      name: nameResult.cleanName || data.name?.trim(),
      age: ageResult.cleanAge || parseInt(data.age, 10),
      gender: data.gender,
      whatsapp: phoneResult.cleanPhone,
      email: data.email?.toLowerCase().trim(),
      date: data.date,
      time: data.time,
    }
  };
};
