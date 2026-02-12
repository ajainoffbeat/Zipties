export interface UserProfileData {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  profile_image_url?: string;
  cityId?: string;
  interests?: string;
  tags?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username?: string;
  bio?: string;
  profile_image_url?: string;
  city_id?: string;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  country: string;
}

export interface UserSearchResult {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_image_url?: string;
}

export interface CreateUserRequest {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
}

export interface UserResponse {
  id: string;
  user_id: string;
  email: string;
  u_email: string;
  first_name: string;
  last_name: string;
  username?: string;
  password?: string;
  created_at: string;
}
