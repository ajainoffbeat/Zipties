import { pool } from "../config/db.js";

export const createUser = async (newUser:any) =>{
  console.log("result inside querry 123",newUser)

 const result = await pool.query(
    "SELECT * FROM create_user($1, $2, $3, $4)",
    [newUser.email, newUser.password_hash, newUser.first_name, newUser.last_name]
  );
  console.log("result inside querry",result)
  return result.rows[0];
}

export const getUserByEmail = async (email: string) => {
  const result = await pool.query(
    "SELECT * FROM get_user_by_email($1)",
    [email.toLowerCase().trim()]
  );

  return result.rows[0]; 
};

export const updateUserPasswordResetToken = async (
  email: string,
  token: string,
  expires: Date
) => {
  const result = await pool.query(
    "SELECT fn_update_user_password_reset_token($1, $2, $3) AS success",
    [email, token, expires]
  );

  return result.rows[0].success as boolean;
};


export const logUserLogin = async (userId: string) => {
  const result = await pool.query(
    "SELECT log_for_user_login ($1) AS log_id",
    [userId]
  );

  return result.rows[0]?.log_id;
};

export const logUserLogout = async (userId: string): Promise<boolean> => {
  const result = await pool.query(
    "SELECT log_for_user_logout($1) AS success",
    [userId]
  );

  return result.rows[0]?.success === true;
};

export const verifyPasswordResetToken = async (token: string) => {
  console.log("token", token);
  const result = await pool.query(
    "SELECT fn_verify_password_reset_token($1) AS token_exists",
    [token]
  );
  console.log("result", result);
  return result.rows[0]?.token_exists == true;
};


export const resetUserPasswordByToken = async (
  token: string,
  hashedPassword: string
): Promise<boolean> => {
  const result = await pool.query(
    "SELECT fn_reset_password_with_token($1, $2) AS success",
    [token, hashedPassword]
  );

  return result.rows[0]?.success === true;
};

