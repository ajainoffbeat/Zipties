
import { pool } from "../config/db.js";

export const userProfile = async (
  userId: string
) : Promise<any> =>{
  console.log("userId", userId);
  const result =  await pool.query(
      `SELECT * FROM get_user_profile($1)`,
      [userId]
    );
    console.log("result", result);
    return result.rows[0]
}


export const updateUserProfile = async (
  userId: string,
  firstName: string,
  lastName: string,
  profileData: any
): Promise<boolean> => {
  try {
    const result = await pool.query(
      `SELECT update_user(
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) AS success`,
      [
        userId,
        firstName || null,
        lastName || null,
        profileData.username || null,
        profileData.bio || null,
        profileData.profileImageUrl || null,
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