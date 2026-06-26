const OTP_REGEX = /^\d{4,8}$/;

export function isValidOtp(otp: string): boolean {
  return OTP_REGEX.test(otp);
}
