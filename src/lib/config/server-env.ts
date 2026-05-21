export function getRequiredServerEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }
  return value;
}

export function getOptionalServerEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function isBackendPersistenceConfigured(): boolean {
  return Boolean(getOptionalServerEnv("DATABASE_URL"));
}
