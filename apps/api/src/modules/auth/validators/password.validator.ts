export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_DIGIT: true,
  REQUIRE_SYMBOL: true,
};

export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < PASSWORD_RULES.MIN_LENGTH) {
    errors.push(`Password must be at least ${String(PASSWORD_RULES.MIN_LENGTH)} characters`);
  }
  if (password.length > PASSWORD_RULES.MAX_LENGTH) {
    errors.push(`Password must not exceed ${String(PASSWORD_RULES.MAX_LENGTH)} characters`);
  }
  if (PASSWORD_RULES.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (PASSWORD_RULES.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (PASSWORD_RULES.REQUIRE_DIGIT && !/\d/.test(password)) {
    errors.push('Password must contain at least one digit');
  }
  if (PASSWORD_RULES.REQUIRE_SYMBOL && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { isValid: errors.length === 0, errors };
}
