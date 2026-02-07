import type { Response, Request, NextFunction } from "express";
import { comparePassword, hashPassword } from "../utils/hashPassword.js";
import { decodeToken, generateToken, extractBearerToken } from "../utils/jwt.util.js";
import { createUser, getUserByEmail, logUserLogin, logUserLogout, resetUserPasswordByToken, updateUserPasswordResetToken, verifyPasswordResetToken } from "../services/auth.service.js";
import { AppError } from "../utils/response/appError.js";   
import { sendSuccess } from "../utils/response/appSuccess.js";
import { RESPONSE_CODES } from "../constants/responseCode.constant.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.constant.js";
import crypto from "crypto";
import { EmailService } from "../services/email.service.js";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);

    if (!user) {
      throw new AppError(200, RESPONSE_MESSAGES[2], {
        code: RESPONSE_CODES.USER_NOT_FOUND,
        success: false,
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, RESPONSE_MESSAGES[1], {
        code: RESPONSE_CODES.INVALID_CREDS,
        success: false,
      });
    }

     const loginLogId = await logUserLogin(user.user_id);

    if (!loginLogId) {
      throw new AppError(500, "Login log failed", {
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        success: false,
      });
    }

    const token = generateToken({
      userId: user.user_id,
      email: user.u_email,
    });
    res.cookie("token", token, {
      path: "/ ",
      httpOnly: false, // or true if you don’t need JS to access it
      secure: false, // must be true for SameSite=None
      sameSite: "lax", // allows cross-site cookies
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      domain: "localhost"
    });

    return sendSuccess(res, {
      status: 200,
      message: "Login successful",
      token,
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (err) {
    next(err);
  }
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password, fullName } = req.body;
    console.log("req.body",req.body)
    // Spliting fullName
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    // Hash the password
    const hashedPassword = await hashPassword(password);
    console.log("password",hashedPassword)
    // Create user object
    const newUser = {
      email:email,
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
    };

    const result = await createUser(newUser);
    console.log("result",result);
    if (result) {
      const token = generateToken({
        userId: result.user_id,
        email: email,
      });

      // res.cookie("token", token, {
      //   path: "/",
      //   httpOnly: false,
      //   secure: true,
      //   sameSite: "none",
      //   maxAge: 1000 * 60 * 60 * 24 * 7,
      // });

      return sendSuccess(res, {
        status: 200,
        message: "User registered successfully",
        token,
        code: RESPONSE_CODES.SUCCESS,
      });
    }
    throw new AppError(400, "User already exist with this email", {
      code: RESPONSE_CODES.USER_ALREADY_EXISTS,
      success: false,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, RESPONSE_MESSAGES[RESPONSE_CODES.UNAUTHORIZED], {
        code: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new AppError(401, RESPONSE_MESSAGES[RESPONSE_CODES.UNAUTHORIZED], {
        code: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
      });
    }

    const decoded = decodeToken(token);

    if (!decoded || !decoded.userId) {
      throw new AppError(401, RESPONSE_MESSAGES[RESPONSE_CODES.UNAUTHORIZED], {
        code: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
      });
    }

    const userId = decoded.userId as string;

    const isLoggedOut = await logUserLogout(userId);

    if (!isLoggedOut) {
      throw new AppError(
        500,
        RESPONSE_MESSAGES[RESPONSE_CODES.INTERNAL_SERVER_ERROR],
        {
          code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
          success: false,
        },
      );
    }

    // Clear cookie if used by frontend
    res.clearCookie("token", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    sendSuccess(res, {
      status: 200,
      message: RESPONSE_MESSAGES[RESPONSE_CODES.SUCCESS],
      code: RESPONSE_CODES.SUCCESS,
    });
    return;
  } catch (err) {
    next(err);
  }
};
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  console.log("email", email);
  const user = await getUserByEmail(email);
  console.log("user", user);
  // // Do NOT reveal if email exists
  // if (!user.rows.length) {
  //   return res.json({
  //     message: "If this email exists, a reset link has been sent"
  //   });
  // }

  const resetToken = crypto.randomBytes(32).toString("hex");
  console.log("resetToken", resetToken);
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  console.log("hashedToken", hashedToken);

  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  console.log("expires", expires);

  await updateUserPasswordResetToken(email, hashedToken, expires);

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${hashedToken}`;
  console.log("resetLink", resetLink);

  await EmailService.sendResetPasswordEmail(email,resetLink);

  return res.json({
    message: "A reset link has been sent to your email"
  });
};

export const verifyResetToken = async (
  req: Request,
  res: Response
) => {
  const { token } = req.query;
  console.log("token", token);
  if (!token || typeof token !== "string") {
    return res.status(400).json({ valid: false });
  }

  try {
    const isValid = await verifyPasswordResetToken(token);
    console.log("isValid", isValid);
    return res.json({ valid: isValid });
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(500).json({ valid: false });
  }
};


export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new AppError(400, "Token and password are required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    const hashedPassword = await hashPassword(password);

    const isUpdated = await resetUserPasswordByToken(
      token,
      hashedPassword
    );

    if (!isUpdated) {
      throw new AppError(400, "Invalid or expired reset token", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

