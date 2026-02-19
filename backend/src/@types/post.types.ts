export interface CreatePostRequest {
  userId: string;
  content: string;
}

export interface EditPostRequest {
  postId: string;
  userId: string;
  content: string;
  deleteFilesIds?: string[];
}

export interface UpdatePostRequest {
  postId: string;
  userId: string;
  isBlocked: boolean;
}

export interface PostAssetData {
  postId: string;
  url: string;
  mimetype: string;
  size: number;
  userId: string;
}

export interface PostResponse {
  postId: string;
  content: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string | null;
  user: {
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  assets: Array<{
    id: string;
    url: string;
    mimetype: string;
    fileSizeBytes: number;
    position: number;
  }>;
}

export interface PostsResponse {
  posts: PostResponse[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}