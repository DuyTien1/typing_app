import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { ServerUserRecord, ServerMultiLeaderboard, MarketListing, MarketLog } from './types';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let isInitialized = false;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

export function getDbPool(): pg.Pool | null {
  if (!isDatabaseConfigured()) return null;
  if (!pool) {
    const connectionString = process.env.DATABASE_URL!;
    const isProduction = process.env.NODE_ENV === 'production' || connectionString.includes('railway') || connectionString.includes('render');
    pool = new Pool({
      connectionString,
      ssl: isProduction ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected error on idle client:', err);
    });
  }
  return pool;
}

/**
 * Tự động khởi tạo cấu trúc bảng trên PostgreSQL khi kết nối lần đầu
 */
export async function initDatabase(): Promise<boolean> {
  const p = getDbPool();
  if (!p) {
    console.log('[Database] DATABASE_URL not set - using in-memory / local storage mode');
    return false;
  }

  if (isInitialized) return true;

  try {
    const client = await p.connect();
    try {
      console.log('[Database] Connecting to PostgreSQL on Railway/Production...');
      const schemaPath = path.resolve(process.cwd(), 'server', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(sql);
        console.log('[Database] PostgreSQL tables verified & initialized successfully!');
      }
      isInitialized = true;
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[Database] Failed to initialize PostgreSQL tables:', err);
    return false;
  }
}

/**
 * Tải toàn bộ tài khoản người chơi từ PostgreSQL
 */
export async function dbLoadUsers(): Promise<Map<string, ServerUserRecord> | null> {
  const p = getDbPool();
  if (!p) return null;

  try {
    const res = await p.query(`
      SELECT id, username, email, display_name as "displayName", avatar, frame,
             password_hash as "passwordHash", salt, is_admin as "isAdmin",
             is_verified as "isVerified", auth_provider as "authProvider",
             session_tokens as "sessionTokens",
             best_wpm as "bestWpm", best_wpm_record as "bestWpmRecord",
             total_games as "totalGames", match_history as "matchHistory",
             showcase_achievements as "showcaseAchievements",
             unlocked_achievements as "unlockedAchievements",
             cultivation, created_at as "createdAt", updated_at as "updatedAt"
      FROM app_users
    `);

    const usersMap = new Map<string, ServerUserRecord>();
    for (const row of res.rows) {
      usersMap.set(row.id, {
        id: row.id,
        username: row.username,
        email: row.email,
        displayName: row.displayName,
        avatar: row.avatar || '🧘',
        frame: row.frame || 'wood',
        passwordHash: row.passwordHash,
        salt: row.salt,
        isAdmin: Boolean(row.isAdmin),
        isVerified: Boolean(row.isVerified),
        authProvider: (row.authProvider as 'google' | 'email') || 'email',
        sessionTokens: Array.isArray(row.sessionTokens) ? row.sessionTokens : [],
        bestWpm: Number(row.bestWpm) || 0,
        bestWpmRecord: row.bestWpmRecord,
        totalGames: Number(row.totalGames) || 0,
        matchHistory: row.matchHistory || [],
        showcaseAchievements: row.showcaseAchievements || [],
        unlockedAchievements: row.unlockedAchievements || [],
        cultivation: row.cultivation,
        createdAt: Number(row.createdAt) || Date.now(),
        updatedAt: Number(row.updatedAt) || Date.now(),
      });
    }
    console.log(`[Database] Loaded ${usersMap.size} users from PostgreSQL.`);
    return usersMap;
  } catch (err) {
    console.error('[Database] Error loading users from PostgreSQL:', err);
    return null;
  }
}

/**
 * Lưu hoặc cập nhật một tài khoản người chơi vào PostgreSQL
 */
export async function dbSaveUser(user: ServerUserRecord): Promise<void> {
  const p = getDbPool();
  if (!p) return;

  const query = `
    INSERT INTO app_users (
      id, username, email, display_name, avatar, frame,
      password_hash, salt, is_admin, is_verified, auth_provider,
      session_tokens, best_wpm, best_wpm_record, total_games, match_history,
      showcase_achievements, unlocked_achievements, cultivation,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11,
      $12, $13, $14, $15, $16,
      $17, $18, $19,
      $20, $21
    )
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      avatar = EXCLUDED.avatar,
      frame = EXCLUDED.frame,
      password_hash = EXCLUDED.password_hash,
      salt = EXCLUDED.salt,
      is_admin = EXCLUDED.is_admin,
      is_verified = EXCLUDED.is_verified,
      auth_provider = EXCLUDED.auth_provider,
      session_tokens = EXCLUDED.session_tokens,
      best_wpm = EXCLUDED.best_wpm,
      best_wpm_record = EXCLUDED.best_wpm_record,
      total_games = EXCLUDED.total_games,
      match_history = EXCLUDED.match_history,
      showcase_achievements = EXCLUDED.showcase_achievements,
      unlocked_achievements = EXCLUDED.unlocked_achievements,
      cultivation = EXCLUDED.cultivation,
      updated_at = EXCLUDED.updated_at;
  `;

  const values = [
    user.id,
    user.username,
    user.email || null,
    user.displayName || user.username,
    user.avatar || '🧘',
    user.frame || 'wood',
    user.passwordHash || null,
    user.salt || null,
    Boolean(user.isAdmin),
    Boolean(user.isVerified),
    user.authProvider || 'email',
    JSON.stringify(user.sessionTokens || []),
    user.bestWpm || 0,
    JSON.stringify(user.bestWpmRecord || null),
    user.totalGames || 0,
    JSON.stringify(user.matchHistory || []),
    JSON.stringify(user.showcaseAchievements || []),
    JSON.stringify(user.unlockedAchievements || []),
    JSON.stringify(user.cultivation || null),
    user.createdAt || Date.now(),
    Date.now(),
  ];

  try {
    await p.query(query, values);
  } catch (err) {
    console.error(`[Database] Failed to upsert user ${user.id} (${user.username}):`, err);
  }
}

/**
 * Tải danh sách Tông môn từ PostgreSQL
 */
export async function dbLoadSects(): Promise<any[] | null> {
  const p = getDbPool();
  if (!p) return null;

  try {
    const res = await p.query('SELECT * FROM app_sects ORDER BY level DESC, exp DESC');
    if (res.rows.length === 0) return null;
    return res.rows.map((row) => ({
      id: row.id,
      name: row.name,
      tag: row.tag,
      description: row.description,
      icon: row.icon,
      leaderId: row.leader_id,
      leaderName: row.leader_name,
      level: row.level,
      exp: row.exp,
      members: row.members || [],
      buffs: row.buffs || {},
    }));
  } catch (err) {
    console.error('[Database] Error loading sects from PostgreSQL:', err);
    return null;
  }
}

/**
 * Lưu danh sách Tông môn vào PostgreSQL
 */
export async function dbSaveSects(sects: any[]): Promise<void> {
  const p = getDbPool();
  if (!p) return;

  const client = await p.connect();
  try {
    await client.query('BEGIN');
    for (const sect of sects) {
      await client.query(`
        INSERT INTO app_sects (id, name, tag, description, icon, leader_id, leader_name, level, exp, members, buffs, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          tag = EXCLUDED.tag,
          description = EXCLUDED.description,
          icon = EXCLUDED.icon,
          leader_id = EXCLUDED.leader_id,
          leader_name = EXCLUDED.leader_name,
          level = EXCLUDED.level,
          exp = EXCLUDED.exp,
          members = EXCLUDED.members,
          buffs = EXCLUDED.buffs,
          updated_at = NOW();
      `, [
        sect.id,
        sect.name,
        sect.tag,
        sect.description || '',
        sect.icon || '⚔️',
        sect.leaderId || null,
        sect.leaderName || null,
        sect.level || 1,
        sect.exp || 0,
        JSON.stringify(sect.members || []),
        JSON.stringify(sect.buffs || {}),
      ]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Database] Failed to save sects to PostgreSQL:', err);
  } finally {
    client.release();
  }
}

/**
 * Tải dữ liệu Phường Thị P2P từ PostgreSQL
 */
export async function dbLoadMarket(): Promise<{ listings: MarketListing[]; logs: MarketLog[] } | null> {
  const p = getDbPool();
  if (!p) return null;

  try {
    const listingsRes = await p.query(`
      SELECT id, seller_id as "sellerId", seller_username as "sellerUsername",
             seller_avatar as "sellerAvatar", seller_frame as "sellerFrame",
             item_type as "itemType", item_id as "itemId",
             item_name as "itemName", item_icon as "itemIcon", quality,
             quantity, price_per_unit as "pricePerUnit", total_price as "totalPrice",
             listed_at as "listedAt", expires_at as "expiresAt", status,
             buyer_id as "buyerId", buyer_username as "buyerUsername", sold_at as "soldAt"
      FROM app_market_listings
      WHERE status = 'active'
      ORDER BY listed_at DESC
    `);

    const logsRes = await p.query(`
      SELECT id, type, details, timestamp,
             actor_username as "actorUsername", target_username as "targetUsername",
             amount
      FROM app_market_logs
      ORDER BY timestamp DESC
      LIMIT 100
    `);

    return {
      listings: listingsRes.rows,
      logs: logsRes.rows,
    };
  } catch (err) {
    console.error('[Database] Error loading market from PostgreSQL:', err);
    return null;
  }
}

/**
 * Lưu tin niêm yết Phường Thị vào PostgreSQL
 */
export async function dbSaveMarketListing(listing: MarketListing): Promise<void> {
  const p = getDbPool();
  if (!p) return;

  try {
    await p.query(`
      INSERT INTO app_market_listings (
        id, seller_id, seller_username, seller_avatar, seller_frame,
        item_type, item_id, item_name, item_icon, quality,
        quantity, price_per_unit, total_price, listed_at, expires_at, status,
        buyer_id, buyer_username, sold_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (id) DO UPDATE SET
        quantity = EXCLUDED.quantity,
        status = EXCLUDED.status,
        buyer_id = EXCLUDED.buyer_id,
        buyer_username = EXCLUDED.buyer_username,
        sold_at = EXCLUDED.sold_at;
    `, [
      listing.id,
      listing.sellerId,
      listing.sellerUsername,
      listing.sellerAvatar || '🧘',
      listing.sellerFrame || 'wood',
      listing.itemType,
      listing.itemId,
      listing.itemName,
      listing.itemIcon,
      listing.quality || 'ha_pham',
      listing.quantity,
      listing.pricePerUnit,
      listing.totalPrice,
      listing.listedAt,
      listing.expiresAt,
      listing.status || 'active',
      listing.buyerId || null,
      listing.buyerUsername || null,
      listing.soldAt || null,
    ]);
  } catch (err) {
    console.error('[Database] Error saving market listing:', err);
  }
}

/**
 * Lưu log giao dịch Phường Thị vào PostgreSQL
 */
export async function dbSaveMarketLog(log: MarketLog): Promise<void> {
  const p = getDbPool();
  if (!p) return;

  try {
    await p.query(`
      INSERT INTO app_market_logs (
        id, type, details, timestamp, actor_username, target_username, amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING;
    `, [
      log.id,
      log.type,
      log.details,
      log.timestamp,
      log.actorUsername,
      log.targetUsername || null,
      log.amount || null,
    ]);
  } catch (err) {
    console.error('[Database] Error saving market log:', err);
  }
}

/**
 * Tải Bảng xếp hạng từ PostgreSQL
 */
export async function dbLoadLeaderboard(): Promise<ServerMultiLeaderboard | null> {
  const p = getDbPool();
  if (!p) return null;

  try {
    const res = await p.query("SELECT data FROM app_leaderboards WHERE id = 'main'");
    if (res.rows.length > 0 && res.rows[0].data) {
      return res.rows[0].data as ServerMultiLeaderboard;
    }
    return null;
  } catch (err) {
    console.error('[Database] Error loading leaderboard from PostgreSQL:', err);
    return null;
  }
}

/**
 * Lưu Bảng xếp hạng vào PostgreSQL
 */
export async function dbSaveLeaderboard(board: ServerMultiLeaderboard): Promise<void> {
  const p = getDbPool();
  if (!p) return;

  try {
    await p.query(`
      INSERT INTO app_leaderboards (id, data, updated_at)
      VALUES ('main', $1, NOW())
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = NOW();
    `, [JSON.stringify(board)]);
  } catch (err) {
    console.error('[Database] Error saving leaderboard to PostgreSQL:', err);
  }
}

/**
 * Tải danh sách tài khoản bị cấm từ PostgreSQL
 */
export async function dbLoadBannedUsers(): Promise<string[] | null> {
  const p = getDbPool();
  if (!p) return null;

  try {
    const res = await p.query('SELECT identifier FROM app_banned_users');
    return res.rows.map((r) => r.identifier);
  } catch (err) {
    console.error('[Database] Error loading banned users from PostgreSQL:', err);
    return null;
  }
}

/**
 * Lưu danh sách tài khoản bị cấm vào PostgreSQL
 */
export async function dbSaveBannedUsers(bannedIdentifiers: string[]): Promise<void> {
  const p = getDbPool();
  if (!p) return;

  const client = await p.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM app_banned_users');
    for (const id of bannedIdentifiers) {
      await client.query(`
        INSERT INTO app_banned_users (identifier, created_at)
        VALUES ($1, EXTRACT(EPOCH FROM NOW()) * 1000)
        ON CONFLICT (identifier) DO NOTHING
      `, [id]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Database] Error saving banned users to PostgreSQL:', err);
  } finally {
    client.release();
  }
}
