export interface CreatePostRequest {
  userId: string;
  content: string;
}

export interface CreateCommentRequest {
  userId: string;
  postId: string;
  comment: string;
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

export interface ReportPostRequest {
  userId: string;
  postId: string;
  comment: string;
}

export interface PostResponse {
  postId: string;
  content: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
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

export interface PostCommentResponse {
  id: string;
  postId: string;
  comment: string;
  userId: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string | null;
  isBlocked: boolean;
  blockedAt: string | null;
  user: {
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
    profileImageUrl: string | null;
  };
}

export interface PostCommentsResponse {
  comments: PostCommentResponse[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}