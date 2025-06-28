export default function getAvatarText(name?: string | null): string {
  if (!name) return "U";

  if (name.includes('@')) {
    return name.charAt(0).toUpperCase();
  }

  const nameParts = name.trim().split(/\s+/); // Split names by whitespace by any amount
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }

  const firstInitial = nameParts[0].charAt(0).toUpperCase();
  const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();

  return `${firstInitial}${lastInitial}`;
}
