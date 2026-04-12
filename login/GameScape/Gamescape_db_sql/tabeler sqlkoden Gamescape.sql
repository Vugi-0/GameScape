CREATE DATABASE "gamescape_db"
  WITH OWNER = postgres
  TEMPLATE template0
  ENCODING 'UTF8';

\c gamescape_db
SELECT current_database();
SET search_path TO public;








--  4) Sätt default search_path (gäller automatiskt vid nya anslutningar)
ALTER DATABASE gamescape_db SET search_path = gamescape, public;

-- (Valfritt) om du vill sätta per user istället:
-- ALTER ROLE ditt_usernamn IN DATABASE gamescape_db SET search_path = gamescape, public;

-- 5) För nuvarande session (om du vill direkt utan att reconnecta)
SET search_path TO gamescape, public;

-- Databasschema – GameScape (PostgreSQL)
SET search_path TO public;
-- nu räcker det att skriva CREATE TABLE game (...)

-- ===== USER =====
CREATE TABLE users (
  user_id      SERIAL	 PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  full_name   VARCHAR(120)	Not null,
  status      VARCHAR(20)  NOT NULL DEFAULT 'online',
	birth_date  DATE NOT NULL CHECK (birth_date <= CURRENT_DATE - INTERVAL '18 years'),  is_admin    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT users_status_chk CHECK (status IN ('online', 'offline','away'))
);

-- ===== GAME =====
CREATE TABLE game (
  game_id     SERIAL  PRIMARY KEY,
  name        VARCHAR(120) NOT NULL UNIQUE,
  image_path  VARCHAR(500) NOT NULL
);

-- ===== USER_GAME =====
CREATE TABLE user_game (
  user_game_id SERIAL  PRIMARY KEY,
  user_id      INT  ,
  game_id      INT  ,
  rank         VARCHAR(60)  NOT NULL,
  platform     VARCHAR(60)  NOT NULL,
  CONSTRAINT user_game_unique UNIQUE (user_id, game_id, platform),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
);

-- ===== LOCATION =====
CREATE TABLE location (
  location_id SERIAL  PRIMARY KEY,
  user_id     INT NOT NULL UNIQUE ,
  ip_address  INET NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE

);

-- ===== EVENT =====
CREATE TABLE event (
  event_id          SERIAL PRIMARY KEY,
  creator_id        INT NOT NULL ,
  game_id           INT not null , -- om event är "ett spel"
  title             VARCHAR(160) NOT NULL,
  datetime          TIMESTAMPTZ  NOT NULL,
  description       TEXT,
  rank_user_game_id INT NULL ,
  min_rank          VARCHAR(60),
  max_rank          VARCHAR(60),
   	 FOREIGN KEY (creator_id) REFERENCES users(user_id) ON DELETE CASCADE,
     FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE,
	 FOREIGN KEY (rank_user_game_id) REFERENCES user_game(user_game_id) ON DELETE CASCADE

);

-- ===== TAG =====
CREATE TABLE tag (
  tag_id SERIAL PRIMARY KEY,
  name   VARCHAR(60) NOT NULL UNIQUE
);

-- ===== EVENT_GAME (Many-to-Many) =====
CREATE TABLE event_game (
  event_id INT NOT NULL ,
  game_id  INT NOT NULL ,
  PRIMARY KEY (event_id, game_id),
	
	FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE,
	FOREIGN KEY (game_id) REFERENCES game(game_id) ON DELETE CASCADE
);

-- ===== EVENT_PARTICIPANT =====
CREATE TABLE event_participant (
  event_id   INT NOT NULL ,
  user_id    INT NOT NULL ,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id),

  FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE,
	FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE

  
  
);

-- ===== EVENT_TAG =====
CREATE TABLE event_tag (
  event_id INT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
  tag_id   INT NOT NULL REFERENCES tag(tag_id)     ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);

-- ===== MESSAGE =====
CREATE TABLE message (
  message_id   SERIAL PRIMARY KEY,
  sender_id    INT NOT NULL,
  receiver_id  INT NOT NULL,
  content      TEXT NOT NULL,
  "timestamp"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Förhindrar att man skickar meddelande till sig själv
  CONSTRAINT message_sender_receiver_chk CHECK (sender_id <> receiver_id),
  
  -- Foreign Keys (Rättade referenser)
  FOREIGN KEY (sender_id)   REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ===== NOTIFICATION =====
CREATE TABLE notification (
  notification_id SERIAL PRIMARY KEY,
  user_id         INT NOT NULL , -- mottagare
  sender_id       INT ,         -- avsändare
  type            VARCHAR(30) NOT NULL, -- t.ex. 'chat' / 'event'
  content         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  FOREIGN KEY (user_id)   REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE

  
);

-- (Valfritt) Index för snabbare queries
CREATE INDEX idx_user_game_user_id ON user_game(user_id);
CREATE INDEX idx_user_game_game_id ON user_game(game_id);
CREATE INDEX idx_event_creator_id ON event(creator_id);
CREATE INDEX idx_event_datetime ON event(datetime);
CREATE INDEX idx_message_receiver ON message(receiver_id, "timestamp");
CREATE INDEX idx_notification_user ON notification(user_id, created_at);
