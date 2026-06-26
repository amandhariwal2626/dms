const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

export function isValidPhoneNumber(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}
