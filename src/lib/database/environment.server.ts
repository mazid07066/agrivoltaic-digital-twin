import "server-only";

function requireServerEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}

export const serverEnvironment = {
  supabaseUrl: requireServerEnvironmentVariable(
    "NEXT_PUBLIC_SUPABASE_URL",
  ),
  supabasePublishableKey: requireServerEnvironmentVariable(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ),
  supabaseServiceRoleKey: requireServerEnvironmentVariable(
    "SUPABASE_SERVICE_ROLE_KEY",
  ),
} as const;
