export interface RegisterBody {
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}


export interface LoginSuccessResponse {
  success: true;
  message: string;
  data: {
    user: {
      id: number;
      email: string;
      full_name: string | null;
    };
    token: string;
  };
}

export interface AuthPayload extends JwtPayload {
  userId: string;
}