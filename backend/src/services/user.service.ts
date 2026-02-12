
import { pool } from "../config/db.js";

export const userProfile = async (
  currentUserId: string,
  userId: string
): Promise<any> => {
  const result = await pool.query(
    `SELECT * FROM fn_get_user_profile($1,$2)`,
    [currentUserId,userId]
  );
  console.log(result.rows[0]);
  return result.rows[0]
}


export const updateUserProfile = async (
  userId: string,
  profileData: any
): Promise<boolean> => {
  try {
    console.log(profileData);
    const result = await pool.query(
      `SELECT fn_update_user(
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) AS success`,
      [
        userId,
        profileData.firstName || null,
        profileData.lastName || null,
        profileData.username || null,
        profileData.bio || null,
        profileData.profile_image_url || null,
        userId,
        profileData.cityId || null,
        profileData.interests || null,
        profileData.tags || null,
      ]
    );
    return result.rows[0]?.success === true;
  } catch (err) {
    console.error("Error updating user profile:", err);
    return false;
  }
};

export const getUsCities = async (
  countryCode: string,
  search?: string,
  state?: string,
  limit = 50,
  offset = 0
): Promise<any[]> => {
  try {
    console.log(countryCode, state, search, limit, offset)
    const result = await pool.query(
      `SELECT * FROM fn_get_cities($1, $2, $3, $4, $5)`,
      [
        countryCode,
        state || null,
        search || null,
        limit,
        offset
      ]
    );

    return result.rows;
  } catch (err) {
    console.error("Error fetching cities:", err);
    throw err;
  }
};

export const searchUsersByName = async (query: string, currentUserId: string): Promise<any[]> => {
  const result = await pool.query(
    `SELECT * FROM fn_search_users_by_name($1, $2)`,
    [query, currentUserId]
  );

  return result.rows;
};


