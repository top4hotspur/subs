export type SocialPlatformId =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "x-twitter"
  | "linkedin"
  | "youtube";

export type SocialPlatformDefinition = {
  id: SocialPlatformId;
  label: string;
  iconPath: string;
  accessibleLabel: string;
};

export const SOCIAL_PLATFORM_DEFINITIONS: SocialPlatformDefinition[] = [
  {
    id: "facebook",
    label: "Facebook",
    iconPath: "/icons/social/icons8-facebook-50.png",
    accessibleLabel: "Visit us on Facebook",
  },
  {
    id: "instagram",
    label: "Instagram",
    iconPath: "/icons/social/icons8-instagram-50.png",
    accessibleLabel: "Visit us on Instagram",
  },
  {
    id: "tiktok",
    label: "TikTok",
    iconPath: "/icons/social/icons8-tiktok-50.png",
    accessibleLabel: "Visit us on TikTok",
  },
  {
    id: "x-twitter",
    label: "X / Twitter",
    iconPath: "/icons/social/icons8-twitter-50.png",
    accessibleLabel: "Visit us on X / Twitter",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    iconPath: "/icons/social/icons8-linkedin-50.png",
    accessibleLabel: "Visit us on LinkedIn",
  },
  {
    id: "youtube",
    label: "YouTube",
    iconPath: "/icons/social/icons8-youtube-50.png",
    accessibleLabel: "Visit us on YouTube",
  },
];

const SOCIAL_PLATFORM_BY_ID = new Map(
  SOCIAL_PLATFORM_DEFINITIONS.map((platform) => [platform.id, platform]),
);

export function normalizeSocialPlatformId(value: string): SocialPlatformId | null {
  const key = value.trim().toLowerCase();
  if (!key) return null;
  if (key === "x" || key === "twitter" || key === "x-twitter") return "x-twitter";
  if (key === "facebook") return "facebook";
  if (key === "instagram") return "instagram";
  if (key === "tiktok") return "tiktok";
  if (key === "linkedin") return "linkedin";
  if (key === "youtube") return "youtube";
  return null;
}

export function getSocialPlatform(value: string): SocialPlatformDefinition | null {
  const id = normalizeSocialPlatformId(value);
  if (!id) return null;
  return SOCIAL_PLATFORM_BY_ID.get(id) ?? null;
}

export type PersistedSocialLink = {
  enabled?: boolean;
  url?: string;
};

export type PersistedSocialLinks = Partial<
  Record<"facebook" | "instagram" | "tiktok" | "xTwitter" | "linkedin" | "youtube", PersistedSocialLink>
>;

export function normalizePersistedSocialLinks(input: unknown): PersistedSocialLinks {
  if (!input || typeof input !== "object") return {};
  const source = input as Record<string, unknown>;
  const keys: Array<keyof PersistedSocialLinks> = [
    "facebook",
    "instagram",
    "tiktok",
    "xTwitter",
    "linkedin",
    "youtube",
  ];
  const result: PersistedSocialLinks = {};
  for (const key of keys) {
    const value = source[key];
    if (!value || typeof value !== "object") continue;
    const candidate = value as Record<string, unknown>;
    const url =
      typeof candidate.url === "string" && candidate.url.trim().length > 0
        ? candidate.url.trim()
        : "";
    result[key] = {
      enabled: candidate.enabled === true,
      url,
    };
  }
  return result;
}