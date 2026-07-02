export const ENV = {
  /** MySQL connection string, e.g. mysql://user:pass@host:3306/dbname */
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  /** Password required to use the /admin panel and its API endpoints. */
  adminPassword: process.env.ADMIN_PASSWORD ?? "Villacampito2023",
  /**
   * Public base URL of this deployment, e.g. https://villacampito-production.up.railway.app.
   * Needed to turn locally-stored upload paths (/uploads/...) into absolute
   * URLs that WhatsApp's servers can fetch (e.g. campaign images).
   * Falls back to Railway's auto-provided domain env var.
   */
  publicUrl: process.env.PUBLIC_URL ?? (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : ""),
};
