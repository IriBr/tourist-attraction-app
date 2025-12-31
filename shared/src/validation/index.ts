import { VALIDATION } from '../constants';

// Email validation regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password must contain: 1 uppercase, 1 lowercase, 1 number, 1 special char
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email) && email.length <= VALIDATION.EMAIL_MAX_LENGTH;
};

export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`);
  }

  if (password.length > VALIDATION.PASSWORD_MAX_LENGTH) {
    errors.push(`Password must be at most ${VALIDATION.PASSWORD_MAX_LENGTH} characters`);
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  return errors;
};

export const validateName = (name: string): string[] => {
  const errors: string[] = [];

  if (name.length < VALIDATION.NAME_MIN_LENGTH) {
    errors.push(`Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`);
  }

  if (name.length > VALIDATION.NAME_MAX_LENGTH) {
    errors.push(`Name must be at most ${VALIDATION.NAME_MAX_LENGTH} characters`);
  }

  return errors;
};

export const validateRating = (rating: number): boolean => {
  return (
    Number.isInteger(rating) &&
    rating >= VALIDATION.RATING_MIN &&
    rating <= VALIDATION.RATING_MAX
  );
};

export const validateReviewTitle = (title: string): string[] => {
  const errors: string[] = [];

  if (title.length < VALIDATION.REVIEW_TITLE_MIN_LENGTH) {
    errors.push(`Title must be at least ${VALIDATION.REVIEW_TITLE_MIN_LENGTH} characters`);
  }

  if (title.length > VALIDATION.REVIEW_TITLE_MAX_LENGTH) {
    errors.push(`Title must be at most ${VALIDATION.REVIEW_TITLE_MAX_LENGTH} characters`);
  }

  return errors;
};

export const validateReviewContent = (content: string): string[] => {
  const errors: string[] = [];

  if (content.length < VALIDATION.REVIEW_CONTENT_MIN_LENGTH) {
    errors.push(`Content must be at least ${VALIDATION.REVIEW_CONTENT_MIN_LENGTH} characters`);
  }

  if (content.length > VALIDATION.REVIEW_CONTENT_MAX_LENGTH) {
    errors.push(`Content must be at most ${VALIDATION.REVIEW_CONTENT_MAX_LENGTH} characters`);
  }

  return errors;
};

export const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};
