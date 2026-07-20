import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  username: string;
  fullName: string;
  email: string;
  bio: string;
  photoURL: string;
  isVerified?: boolean;
  createdAt: Timestamp | Date | any;
  gender?: "male" | "female" | "other";
  isPrivate?: boolean;
  blockedUsers?: string[];
}

export interface AppNotification {
  id: string;
  userId: string;
  type: "verification" | "like" | "comment" | "follow";
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp | Date | any;
  senderId?: string;
  postId?: string;
}

export interface PostReport {
  id: string;
  postId: string;
  postOwnerId: string;
  postOwnerUsername: string;
  reporterId: string;
  reporterUsername: string;
  reason: string;
  additionalDetails?: string;
  createdAt: Timestamp | Date | any;
  status: "Pending" | "Approved" | "Rejected";
}

export interface Post {
  id: string;
  ownerId: string;
  ownerUsername: string;
  ownerPhotoURL: string;
  imageURL: string;
  caption: string;
  likes: string[]; // List of user UIDs who liked
  likesCount: number;
  commentsCount: number;
  createdAt: Timestamp | Date | any;
  visibility?: "public" | "private" | "followers";
}

export interface Comment {
  id: string;
  postId: string;
  ownerId: string;
  ownerUsername: string;
  ownerPhotoURL: string;
  text: string;
  createdAt: Timestamp | Date | any;
  replyToCommentId?: string;
  replyToUsername?: string;
}

export interface Story {
  id: string;
  ownerId: string;
  ownerUsername: string;
  ownerPhotoURL: string;
  imageURL: string;
  caption?: string;
  createdAt: Timestamp | Date | any;
}

export interface Chat {
  id: string;
  participants: string[]; // UIDs of participants
  lastMessage: string;
  lastMessageTime: Timestamp | Date | any;
  updatedAt: Timestamp | Date | any;
  lastSenderId?: string;
  seenBy?: Record<string, any>;
  deletedAt?: Record<string, string>; // Maps userId -> ISOString timestamp of when the chat was cleared/deleted by them
  // Dynamic fields parsed for display
  otherUser?: UserProfile;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: Timestamp | Date | any;
}
