const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,50}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}
