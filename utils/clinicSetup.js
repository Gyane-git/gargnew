import pool from "@/utils/db";

export const CLINIC_SETUP_TABLE = "clinic_setup_requests";

export const ensureClinicSetupTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ${CLINIC_SETUP_TABLE} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      full_name VARCHAR(191) NOT NULL,
      email VARCHAR(191) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      budget VARCHAR(50) NULL,
      city VARCHAR(191) NULL,
      remarks LONGTEXT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY ${CLINIC_SETUP_TABLE}_email_index (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};
