export const ENV = {
  /** MySQL connection string, e.g. mysql://user:pass@host:3306/dbname */
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  /** Password required to use the /admin panel and its API endpoints. */
  adminPassword: process.env.ADMIN_PASSWORD ?? "Villacampito2023",
};
