import { isValidUsername } from './github'

export const normalizeUsername = (input: string): string | null => {
  const username = input.trim()
  return isValidUsername(username) ? username : null
}
