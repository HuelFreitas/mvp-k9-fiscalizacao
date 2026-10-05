CREATE TABLE IF NOT EXISTS schema_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('client', 'operator', 'admin')),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  company text,
  certification text,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requests (
  id text PRIMARY KEY,
  client_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_operator_id text REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS requests_client_id_idx ON requests(client_id);
CREATE INDEX IF NOT EXISTS requests_operator_id_idx ON requests(assigned_operator_id);
CREATE INDEX IF NOT EXISTS requests_status_idx ON requests(status);
CREATE INDEX IF NOT EXISTS requests_created_at_idx ON requests(created_at DESC);
