-- Newsroom API v1 tables (Cameroon Concord).
-- Additive and idempotent: CREATE TABLE IF NOT EXISTS only. Does not alter `articles`.
-- Apply with: npm run newsroom:migrate   (use --dry-run to print this SQL only)

CREATE TABLE IF NOT EXISTS newsroom_grants (
  telegram_user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('viewer','contributor','editor','publisher') NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  display_name VARCHAR(120) NULL,
  created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (telegram_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsroom_nonces (
  nonce CHAR(32) NOT NULL,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (nonce),
  KEY idx_newsroom_nonces_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsroom_idempotency (
  idem_key VARCHAR(200) NOT NULL,
  actor VARCHAR(40) NOT NULL,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(255) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  status_code INT NOT NULL,
  response_json LONGTEXT NULL,
  created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idem_key, actor),
  KEY idx_newsroom_idem_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsroom_audit (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id VARCHAR(64) NOT NULL,
  actor VARCHAR(40) NOT NULL,
  operation VARCHAR(40) NOT NULL,
  article_id INT UNSIGNED NULL,
  changed_fields JSON NULL,
  idempotency_key VARCHAR(200) NULL,
  result ENUM('ok','denied','error') NOT NULL,
  error_code VARCHAR(40) NULL,
  created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_newsroom_audit_article (article_id),
  KEY idx_newsroom_audit_actor_created (actor, created_at),
  KEY idx_newsroom_audit_request (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsroom_article_origins (
  article_id INT UNSIGNED NOT NULL,
  telegram_user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (article_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
