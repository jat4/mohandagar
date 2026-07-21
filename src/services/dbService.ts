import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  serverTimestamp,
  limit,
  increment,
  deleteDoc,
  collectionGroup
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType, isLocalDemo } from "../firebase";
import { UserProfile, Post, Comment, Story, Chat, Message, AppNotification, PostReport } from "../types";
import { DEFAULT_AVATAR_URL } from "../constants";

/**
 * Local Storage Seeding Utility
 */
export function seedLocalData() {
  if (localStorage.getItem("dagar_local_seeded") === "true") return;

  const defaultUsers: UserProfile[] = [];
  const defaultPosts: Post[] = [];
  const defaultComments: Comment[] = [];
  const defaultStories: Story[] = [];

  localStorage.setItem("dagar_local_users", JSON.stringify(defaultUsers));
  localStorage.setItem("dagar_local_posts", JSON.stringify(defaultPosts));
  localStorage.setItem("dagar_local_comments", JSON.stringify(defaultComments));
  localStorage.setItem("dagar_local_stories", JSON.stringify(defaultStories));
  localStorage.setItem("dagar_local_chats", JSON.stringify([]));
  localStorage.setItem("dagar_local_messages", JSON.stringify([]));
  localStorage.setItem("dagar_local_seeded", "true");
}

function getLocalUsers(): UserProfile[] {
  seedLocalData();
  return JSON.parse(localStorage.getItem("dagar_local_users") || "[]");
}

function saveLocalUsers(users: UserProfile[]) {
  localStorage.setItem("dagar_local_users", JSON.stringify(users));
  window.dispatchEvent(new Event("dagar_chats_db_update"));
}

function getLocalPosts(): Post[] {
  seedLocalData();
  return JSON.parse(localStorage.getItem("dagar_local_posts") || "[]");
}

function saveLocalPosts(posts: Post[]) {
  localStorage.setItem("dagar_local_posts", JSON.stringify(posts));
  window.dispatchEvent(new Event("dagar_chats_db_update"));
}

function getLocalComments(): Comment[] {
  seedLocalData();
  return JSON.parse(localStorage.getItem("dagar_local_comments") || "[]");
}

function saveLocalComments(comments: Comment[]) {
  localStorage.setItem("dagar_local_comments", JSON.stringify(comments));
  window.dispatchEvent(new Event("dagar_chats_db_update"));
}

function getLocalStories(): Story[] {
  seedLocalData();
  return JSON.parse(localStorage.getItem("dagar_local_stories") || "[]");
}

function saveLocalStories(stories: Story[]) {
  localStorage.setItem("dagar_local_stories", JSON.stringify(stories));
  window.dispatchEvent(new Event("dagar_chats_db_update"));
}

function getLocalChats(): Chat[] {
  seedLocalData();
  return JSON.parse(localStorage.getItem("dagar_local_chats") || "[]");
}

function saveLocalChats(chats: Chat[]) {
  localStorage.setItem("dagar_local_chats", JSON.stringify(chats));
  window.dispatchEvent(new Event("dagar_chats_db_update"));
}

function getLocalMessages(): Message[] {
  seedLocalData();
  return JSON.parse(localStorage.getItem("dagar_local_messages") || "[]");
}

function saveLocalMessages(messages: Message[]) {
  localStorage.setItem("dagar_local_messages", JSON.stringify(messages));
  window.dispatchEvent(new Event("dagar_chats_db_update"));
}

/**
 * Checks if a username is already taken in the users collection.
 * Usernames are lowercase for consistency.
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return false;

  if (isLocalDemo()) {
    const users = getLocalUsers();
    return users.some(u => u.username.toLowerCase() === normalized);
  }

  const path = "users";
  try {
    const q = query(collection(db, path), where("username", "==", normalized));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return false;
  }
}

/**
 * Retrieves a user profile by username.
 */
export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  const normalized = username.trim().toLowerCase().replace(/^@/, "");
  if (!normalized) return null;

  if (isLocalDemo()) {
    const users = getLocalUsers();
    return users.find(u => u.username.toLowerCase() === normalized) || null;
  }

  const path = "users";
  try {
    const q = query(collection(db, path), where("username", "==", normalized));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Creates or updates a user profile document in Firestore.
 */
export async function createUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
  const cleanUsername = profile.username?.trim().toLowerCase() || "";
  const cleanFullName = profile.fullName?.trim() || "DagarChat User";
  const bioValue = profile.bio || "Hello! I am on DagarChat.";
  const photoUrlValue = profile.photoURL || DEFAULT_AVATAR_URL;

  if (isLocalDemo()) {
    const users = getLocalUsers();
    const existingIndex = users.findIndex(u => u.uid === uid);
    
    const updatedUser: UserProfile = {
      uid,
      username: cleanUsername || (existingIndex >= 0 ? users[existingIndex].username : ""),
      fullName: cleanFullName || (existingIndex >= 0 ? users[existingIndex].fullName : ""),
      email: profile.email || (existingIndex >= 0 ? users[existingIndex].email : ""),
      bio: bioValue,
      photoURL: photoUrlValue,
      createdAt: existingIndex >= 0 ? users[existingIndex].createdAt : new Date().toISOString()
    };

    if (existingIndex >= 0) {
      users[existingIndex] = updatedUser;
    } else {
      users.push(updatedUser);
    }
    saveLocalUsers(users);
    return;
  }

  const path = `users`;
  try {
    const userDocRef = doc(db, path, uid);
    const docSnap = await getDoc(userDocRef);

    const payload = {
      uid,
      username: cleanUsername,
      fullName: cleanFullName,
      email: profile.email || "",
      bio: bioValue,
      photoURL: photoUrlValue,
      createdAt: docSnap.exists() ? docSnap.data().createdAt : serverTimestamp(),
    };

    await setDoc(userDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${uid}`);
  }
}

/**
 * Retrieves a user profile by UID.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (isLocalDemo()) {
    const users = getLocalUsers();
    const found = users.find(u => u.uid === uid);
    return found || null;
  }

  const path = `users`;
  try {
    const docRef = doc(db, path, uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${path}/${uid}`);
    return null;
  }
}

/**
 * Fetches all registered users (limit 150) for administrative actions.
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  if (isLocalDemo()) {
    return getLocalUsers();
  }

  const path = "users";
  try {
    const q = query(collection(db, path), limit(150));
    const snapshot = await getDocs(q);
    const users: UserProfile[] = [];
    snapshot.forEach((d) => {
      users.push(d.data() as UserProfile);
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

/**
 * Searches users by username prefix or matching letters.
 */
export async function searchUsers(searchQuery: string): Promise<UserProfile[]> {
  const searchLower = searchQuery.trim().toLowerCase();
  if (!searchLower) return [];

  if (isLocalDemo()) {
    const users = getLocalUsers();
    return users.filter(u => 
      u.username.toLowerCase().includes(searchLower) ||
      u.fullName.toLowerCase().includes(searchLower)
    );
  }

  const path = "users";
  try {
    // Simple matching: fetch some and filter on client to give high fidelity
    const q = query(collection(db, path), limit(100));
    const snapshot = await getDocs(q);
    const users: UserProfile[] = [];
    snapshot.forEach((d) => {
      const u = d.data() as UserProfile;
      if (
        u.username.toLowerCase().includes(searchLower) ||
        u.fullName.toLowerCase().includes(searchLower)
      ) {
        users.push(u);
      }
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Creates a new post in Firestore.
 */
export async function createPost(post: Omit<Post, "id" | "likes" | "likesCount" | "commentsCount" | "createdAt">): Promise<void> {
  if (isLocalDemo()) {
    const posts = getLocalPosts();
    const newPost: Post = {
      ...post,
      id: "post_" + Math.random().toString(36).substr(2, 9),
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString()
    };
    posts.push(newPost);
    saveLocalPosts(posts);
    return;
  }

  const path = "posts";
  try {
    const postColRef = collection(db, path);
    const newDocRef = doc(postColRef); // generates ID
    const payload: Post = {
      ...post,
      id: newDocRef.id,
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
    };
    await setDoc(newDocRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Deletes a post from Firestore or localStorage, cascading to all related comments, likes, notifications and reports.
 */
export async function deletePost(postId: string): Promise<void> {
  if (isLocalDemo()) {
    const posts = getLocalPosts();
    const updated = posts.filter(p => p.id !== postId);
    saveLocalPosts(updated);

    // Cascading comments deletion
    const comments = getLocalComments();
    const filteredComments = comments.filter(c => c.postId !== postId);
    saveLocalComments(filteredComments);

    // Cascading notifications deletion where postId matches
    const users = getLocalUsers();
    for (const u of users) {
      const key = `dagar_local_notifications_${u.uid}`;
      const notifs = JSON.parse(localStorage.getItem(key) || "[]");
      const filteredNotifs = notifs.filter((n: any) => n.postId !== postId);
      localStorage.setItem(key, JSON.stringify(filteredNotifs));
    }

    // Cascading reports deletion
    const reports = getLocalReports();
    const filteredReports = reports.filter(r => r.postId !== postId);
    saveLocalReports(filteredReports);

    window.dispatchEvent(new Event("dagar_chats_db_update"));
    return;
  }
  const path = `posts/${postId}`;
  try {
    // 1. Delete parent post document
    await deleteDoc(doc(db, "posts", postId));

    // 2. Delete all related comments
    const commentsColRef = collection(db, "posts", postId, "comments");
    const commentsSnap = await getDocs(commentsColRef);
    for (const d of commentsSnap.docs) {
      await deleteDoc(doc(db, "posts", postId, "comments", d.id));
    }

    // 3. Delete related notifications across all users using collectionGroup
    const notifsQuery = query(collectionGroup(db, "notifications"), where("postId", "==", postId));
    const notifsSnap = await getDocs(notifsQuery);
    for (const d of notifsSnap.docs) {
      await deleteDoc(d.ref);
    }

    // 4. Delete related reports
    const reportsQuery = query(collection(db, "reports"), where("postId", "==", postId));
    const reportsSnap = await getDocs(reportsQuery);
    for (const d of reportsSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribes to real-time posts feed.
 */
export function subscribeToFeed(callback: (posts: Post[]) => void) {
  if (isLocalDemo()) {
    const fetchAndSort = () => {
      const posts = getLocalPosts();
      return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };
    callback(fetchAndSort());
    const handler = () => {
      callback(fetchAndSort());
    };
    window.addEventListener("dagar_chats_db_update", handler);
    return () => window.removeEventListener("dagar_chats_db_update", handler);
  }

  const path = "posts";
  const q = query(collection(db, path), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const posts: Post[] = [];
      snapshot.forEach((doc) => {
        posts.push(doc.data() as Post);
      });
      callback(posts);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Likes or unlikes a post.
 */
export async function toggleLikePost(postId: string, userId: string, hasLiked: boolean): Promise<void> {
  if (isLocalDemo()) {
    const posts = getLocalPosts();
    const index = posts.findIndex(p => p.id === postId);
    if (index >= 0) {
      const post = posts[index];
      if (hasLiked) {
        post.likes = post.likes.filter(uid => uid !== userId);
      } else {
        if (!post.likes.includes(userId)) {
          post.likes.push(userId);
          
          // Send notification to post owner if someone else likes it
          if (post.ownerId !== userId) {
            const users = getLocalUsers();
            const liker = users.find(u => u.uid === userId);
            const likerUsername = liker ? liker.username : "someone";
            await addNotification(post.ownerId, {
              userId: post.ownerId,
              type: "like",
              title: "New Like!",
              message: `@${likerUsername} liked your post.`,
              read: false,
              postId: postId
            });
          }
        }
      }
      post.likesCount = post.likes.length;
      posts[index] = post;
      saveLocalPosts(posts);
    }
    return;
  }

  const path = `posts/${postId}`;
  try {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      likes: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
      likesCount: hasLiked ? increment(-1) : increment(1),
    });

    if (!hasLiked) {
      // Get the post to find ownerId
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const post = postSnap.data() as Post;
        if (post.ownerId !== userId) {
          // Get liker details
          const likerSnap = await getDoc(doc(db, "users", userId));
          const likerUsername = likerSnap.exists() ? (likerSnap.data() as UserProfile).username : "someone";
          await addNotification(post.ownerId, {
            userId: post.ownerId,
            type: "like",
            title: "New Like!",
            message: `@${likerUsername} liked your post.`,
            read: false,
            postId: postId
          });
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Helper to notify tagged users in a comment text and handle comment replies.
 */
async function notifyTagsAndReplies(
  postId: string,
  text: string,
  senderProfile: { uid: string; username: string },
  replyToCommentOwnerId?: string
): Promise<Set<string>> {
  const tagRegex = /@([a-zA-Z0-9_]{3,20})/g;
  const matches = [...text.matchAll(tagRegex)];
  const notifiedUserIds = new Set<string>();

  for (const match of matches) {
    const username = match[1].toLowerCase();
    if (username === senderProfile.username.toLowerCase()) continue;

    try {
      const userProfile = await getUserProfileByUsername(username);
      if (userProfile && userProfile.uid !== senderProfile.uid) {
        notifiedUserIds.add(userProfile.uid);
        await addNotification(userProfile.uid, {
          userId: userProfile.uid,
          type: "comment",
          title: "New Tag!",
          message: `@${senderProfile.username} tagged you in a comment: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`,
          read: false,
          postId: postId
        });
      }
    } catch (err) {
      console.error("Failed to notify tagged user", username, err);
    }
  }

  if (replyToCommentOwnerId && replyToCommentOwnerId !== senderProfile.uid && !notifiedUserIds.has(replyToCommentOwnerId)) {
    await addNotification(replyToCommentOwnerId, {
      userId: replyToCommentOwnerId,
      type: "comment",
      title: "Comment Reply!",
      message: `@${senderProfile.username} replied to your comment: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`,
      read: false,
      postId: postId
    });
    notifiedUserIds.add(replyToCommentOwnerId);
  }

  return notifiedUserIds;
}

/**
 * Adds a comment to a post.
 */
export async function addComment(postId: string, comment: Omit<Comment, "id" | "createdAt"> & { replyToCommentId?: string; replyToUsername?: string; replyToCommentOwnerId?: string }): Promise<void> {
  if (isLocalDemo()) {
    const comments = getLocalComments();
    const newComment: Comment = {
      ...comment,
      id: "comment_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    comments.push(newComment);
    saveLocalComments(comments);

    // Increment post commentsCount
    const posts = getLocalPosts();
    const postIdx = posts.findIndex(p => p.id === postId);
    if (postIdx >= 0) {
      const post = posts[postIdx];
      posts[postIdx].commentsCount = (posts[postIdx].commentsCount || 0) + 1;
      saveLocalPosts(posts);

      // Handle tags & replies
      const notified = await notifyTagsAndReplies(postId, comment.text, { uid: comment.ownerId, username: comment.ownerUsername }, comment.replyToCommentOwnerId);

      // Create notification for post owner if commented by someone else and not already notified
      if (post.ownerId !== comment.ownerId && !notified.has(post.ownerId)) {
        await addNotification(post.ownerId, {
          userId: post.ownerId,
          type: "comment",
          title: "New Comment!",
          message: `@${comment.ownerUsername} commented: "${comment.text.substring(0, 30)}${comment.text.length > 30 ? "..." : ""}"`,
          read: false,
          postId: postId
        });
      }
    }
    return;
  }

  const commentsPath = `posts/${postId}/comments`;
  try {
    const commentsColRef = collection(db, "posts", postId, "comments");
    const commentDocRef = doc(commentsColRef);
    const commentPayload: any = {
      ...comment,
      ownerPhotoURL: comment.ownerPhotoURL || DEFAULT_AVATAR_URL,
      id: commentDocRef.id,
      createdAt: serverTimestamp(),
    };
    
    // Clean undefined fields to avoid Firestore error
    Object.keys(commentPayload).forEach((key) => {
      if (commentPayload[key] === undefined) {
        delete commentPayload[key];
      }
    });

    await setDoc(commentDocRef, commentPayload);

    // Update comment counter on parent post
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      commentsCount: increment(1),
    });

    // Handle tags & replies
    const notified = await notifyTagsAndReplies(postId, comment.text, { uid: comment.ownerId, username: comment.ownerUsername }, comment.replyToCommentOwnerId);

    // Create notification for post owner if not already notified
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const post = postSnap.data() as Post;
      if (post.ownerId !== comment.ownerId && !notified.has(post.ownerId)) {
        await addNotification(post.ownerId, {
          userId: post.ownerId,
          type: "comment",
          title: "New Comment!",
          message: `@${comment.ownerUsername} commented: "${comment.text.substring(0, 30)}${comment.text.length > 30 ? "..." : ""}"`,
          read: false,
          postId: postId
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, commentsPath);
  }
}

/**
 * Deletes a comment from a post.
 */
export async function deleteComment(postId: string, commentId: string): Promise<void> {
  if (isLocalDemo()) {
    const comments = getLocalComments();
    const filtered = comments.filter(c => c.id !== commentId);
    saveLocalComments(filtered);

    // Decrement post commentsCount
    const posts = getLocalPosts();
    const postIdx = posts.findIndex(p => p.id === postId);
    if (postIdx >= 0) {
      posts[postIdx].commentsCount = Math.max(0, (posts[postIdx].commentsCount || 1) - 1);
      saveLocalPosts(posts);
    }
    return;
  }

  const commentPath = `posts/${postId}/comments/${commentId}`;
  try {
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    await deleteDoc(commentRef);

    // Decrement comment counter on parent post
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      commentsCount: increment(-1),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, commentPath);
  }
}

/**
 * Subscribes to real-time comments for a post.
 */
export function subscribeToComments(postId: string, callback: (comments: Comment[]) => void) {
  if (isLocalDemo()) {
    const fetchComments = () => {
      const comments = getLocalComments();
      return comments
        .filter(c => c.postId === postId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    };
    callback(fetchComments());
    const handler = () => {
      callback(fetchComments());
    };
    window.addEventListener("dagar_chats_db_update", handler);
    return () => window.removeEventListener("dagar_chats_db_update", handler);
  }

  const path = `posts/${postId}/comments`;
  const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const comments: Comment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Comment;
        comments.push({
          ...data,
          id: doc.id
        });
      });
      callback(comments);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Creates a story.
 */
export async function createStory(story: Omit<Story, "id" | "createdAt">): Promise<void> {
  if (isLocalDemo()) {
    const stories = getLocalStories();
    const newStory: Story = {
      ...story,
      id: "story_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    stories.push(newStory);
    saveLocalStories(stories);
    return;
  }

  const path = "stories";
  try {
    const colRef = collection(db, path);
    const docRef = doc(colRef);
    const payload: Story = {
      ...story,
      id: docRef.id,
      createdAt: serverTimestamp(),
    };
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Fetches stories created in the last 24 hours.
 */
export function subscribeToStories(callback: (stories: Story[]) => void) {
  if (isLocalDemo()) {
    const fetchStories = () => {
      const stories = getLocalStories();
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      return stories
        .filter(s => new Date(s.createdAt).getTime() > yesterday)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };
    callback(fetchStories());
    const handler = () => {
      callback(fetchStories());
    };
    window.addEventListener("dagar_chats_db_update", handler);
    return () => window.removeEventListener("dagar_chats_db_update", handler);
  }

  const path = "stories";
  // Fetch active stories
  const q = query(collection(db, path), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const stories: Story[] = [];
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      snapshot.forEach((d) => {
        const data = d.data() as Story;
        // Simple client side filter for safety with various timestamp models
        const createdTime = data.createdAt?.seconds
          ? data.createdAt.seconds * 1000
          : data.createdAt instanceof Date
          ? data.createdAt.getTime()
          : Date.now();

        if (createdTime > yesterday) {
          stories.push(data);
        }
      });
      callback(stories);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Creates or gets a chat thread between two users.
 */
export async function getOrCreateChat(user1Id: string, user2Id: string): Promise<string> {
  const chatId = [user1Id, user2Id].sort().join("_");

  if (isLocalDemo()) {
    const chats = getLocalChats();
    const existing = chats.find(c => c.id === chatId);
    if (!existing) {
      const newChat: Chat = {
        id: chatId,
        participants: [user1Id, user2Id],
        lastMessage: "Conversation started",
        lastMessageTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      chats.push(newChat);
      saveLocalChats(chats);
    }
    return chatId;
  }

  const path = "chats";
  try {
    const chatRef = doc(db, path, chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      const payload = {
        id: chatId,
        participants: [user1Id, user2Id],
        lastMessage: "Conversation started",
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(chatRef, payload);
    }
    return chatId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

/**
 * Sends a chat message.
 */
export async function sendMessage(chatId: string, senderId: string, receiverId: string, text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  if (isLocalDemo()) {
    const messages = getLocalMessages();
    const newMsg: Message = {
      id: "msg_" + Math.random().toString(36).substr(2, 9),
      chatId,
      senderId,
      receiverId,
      text: trimmed,
      createdAt: new Date().toISOString()
    };
    messages.push(newMsg);
    saveLocalMessages(messages);

    // Update parent Chat
    const chats = getLocalChats();
    const chatIdx = chats.findIndex(c => c.id === chatId);
    if (chatIdx >= 0) {
      chats[chatIdx].lastMessage = trimmed;
      chats[chatIdx].lastMessageTime = new Date().toISOString();
      chats[chatIdx].updatedAt = new Date().toISOString();
      chats[chatIdx].lastSenderId = senderId;
    } else {
      // Just in case it wasn't created yet
      chats.push({
        id: chatId,
        participants: [senderId, receiverId],
        lastMessage: trimmed,
        lastMessageTime: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSenderId: senderId
      });
    }
    saveLocalChats(chats);
    return;
  }

  const messagePath = `chats/${chatId}/messages`;
  try {
    const messagesCol = collection(db, "chats", chatId, "messages");
    const msgDocRef = doc(messagesCol);
    const payload: Message = {
      id: msgDocRef.id,
      chatId,
      senderId,
      receiverId,
      text: trimmed,
      createdAt: serverTimestamp(),
    };
    await setDoc(msgDocRef, payload);

    // Update parent Chat
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      lastMessage: trimmed,
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSenderId: senderId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, messagePath);
  }
}

// Module-level cache of user profiles to optimize chat snapshots
const globalProfileCache: Record<string, UserProfile> = {};

/**
 * Determines whether a chat should be shown to a user based on its deletedAt status.
 */
export function shouldShowChatForUser(chat: Chat, userId: string): boolean {
  if (!chat.deletedAt || !chat.deletedAt[userId]) return true;
  const deletedTime = new Date(chat.deletedAt[userId]).getTime();
  
  let lastMsgTime = 0;
  if (chat.lastMessageTime) {
    if (chat.lastMessageTime.seconds) {
      lastMsgTime = chat.lastMessageTime.seconds * 1000;
    } else if (chat.lastMessageTime instanceof Date) {
      lastMsgTime = chat.lastMessageTime.getTime();
    } else {
      lastMsgTime = new Date(chat.lastMessageTime).getTime();
    }
  }
  
  return lastMsgTime > deletedTime;
}

/**
 * Subscribes to chat threads for a user.
 */
export function subscribeToUserChats(uid: string, callback: (chats: Chat[]) => void) {
  if (isLocalDemo()) {
    const fetchUserChats = () => {
      const chats = getLocalChats();
      const users = getLocalUsers();
      
      const filtered = chats
        .filter(c => c.participants.includes(uid) && shouldShowChatForUser(c, uid))
        .map(chatData => {
          const otherUserId = chatData.participants.find(p => p !== uid);
          const copy = { ...chatData };
          if (otherUserId) {
            copy.otherUser = users.find(u => u.uid === otherUserId);
          }
          return copy;
        });
      // Sort desc by updatedAt
      return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    };

    callback(fetchUserChats());
    const handler = () => {
      callback(fetchUserChats());
    };
    window.addEventListener("dagar_chats_db_update", handler);
    return () => window.removeEventListener("dagar_chats_db_update", handler);
  }

  const path = "chats";
  const q = query(
    collection(db, path),
    where("participants", "array-contains", uid)
  );

  return onSnapshot(
    q,
    async (snapshot) => {
      const chats: Chat[] = [];
      const missingProfileIds: string[] = [];

      for (const d of snapshot.docs) {
        const chatData = d.data() as Chat;
        chatData.id = d.id;

        if (!shouldShowChatForUser(chatData, uid)) {
          continue;
        }

        const otherUserId = chatData.participants.find((p) => p !== uid);

        if (otherUserId) {
          if (globalProfileCache[otherUserId]) {
            chatData.otherUser = globalProfileCache[otherUserId];
          } else {
            missingProfileIds.push(otherUserId);
            // set a fallback placeholder so the UI has structure immediately
            chatData.otherUser = {
              uid: otherUserId,
              username: "User",
              fullName: "Active Participant",
              email: "",
              photoURL: DEFAULT_AVATAR_URL,
              bio: "",
              createdAt: "",
              isVerified: false
            };
          }
        }
        chats.push(chatData);
      }

      const sortChats = (list: Chat[]) => {
        return list.sort((a, b) => {
          const timeA = a.updatedAt?.seconds
            ? a.updatedAt.seconds * 1000 + Math.floor(a.updatedAt.nanoseconds / 1000000 || 0)
            : a.updatedAt instanceof Date
            ? a.updatedAt.getTime()
            : typeof a.updatedAt === "string"
            ? new Date(a.updatedAt).getTime()
            : Date.now();

          const timeB = b.updatedAt?.seconds
            ? b.updatedAt.seconds * 1000 + Math.floor(b.updatedAt.nanoseconds / 1000000 || 0)
            : b.updatedAt instanceof Date
            ? b.updatedAt.getTime()
            : typeof b.updatedAt === "string"
            ? new Date(b.updatedAt).getTime()
            : Date.now();

          return timeB - timeA;
        });
      };

      // Call callback immediately with loaded + placeholders
      callback(sortChats([...chats]));

      // Asynchronously fetch missing profiles in parallel
      if (missingProfileIds.length > 0) {
        Promise.all(
          missingProfileIds.map(async (id) => {
            const p = await getUserProfile(id);
            if (p) {
              globalProfileCache[id] = p;
              chats.forEach((c) => {
                if (c.participants.includes(id)) {
                  c.otherUser = p;
                }
              });
            }
          })
        ).then(() => {
          callback(sortChats([...chats]));
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Subscribes to real-time messages in a specific chat.
 */
export function subscribeToMessages(chatId: string, callback: (messages: Message[]) => void) {
  if (isLocalDemo()) {
    const fetchMessages = () => {
      const messages = getLocalMessages();
      return messages
        .filter(m => m.chatId === chatId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    };
    callback(fetchMessages());
    const handler = () => {
      callback(fetchMessages());
    };
    window.addEventListener("dagar_chats_db_update", handler);
    return () => window.removeEventListener("dagar_chats_db_update", handler);
  }

  const path = `chats/${chatId}/messages`;
  const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Message;
        data.id = doc.id; // Guarantee the correct document ID is present
        messages.push(data);
      });
      callback(messages);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Creates a notification for a user in Firestore (or local state if in demo mode).
 */
export async function addNotification(
  userId: string,
  notification: Omit<AppNotification, "id" | "createdAt">
): Promise<void> {
  if (isLocalDemo()) {
    const key = `dagar_local_notifications_${userId}`;
    const notifications: AppNotification[] = JSON.parse(localStorage.getItem(key) || "[]");
    const newNotif: AppNotification = {
      ...notification,
      id: "notif_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    notifications.unshift(newNotif);
    localStorage.setItem(key, JSON.stringify(notifications));
    window.dispatchEvent(new Event("dagar_chats_db_update"));
    return;
  }

  const path = `users/${userId}/notifications`;
  try {
    const notifsCol = collection(db, "users", userId, "notifications");
    const docRef = doc(notifsCol);
    const payload: AppNotification = {
      ...notification,
      id: docRef.id,
      createdAt: serverTimestamp(),
    };
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Subscribes to real-time notifications for a user.
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: AppNotification[]) => void
) {
  if (isLocalDemo()) {
    const fetchNotifications = () => {
      const key = `dagar_local_notifications_${userId}`;
      const notifications = JSON.parse(localStorage.getItem(key) || "[]");
      return notifications;
    };
    callback(fetchNotifications());
    const handler = () => {
      callback(fetchNotifications());
    };
    window.addEventListener("dagar_chats_db_update", handler);
    return () => window.removeEventListener("dagar_chats_db_update", handler);
  }

  const path = `users/${userId}/notifications`;
  const q = query(collection(db, "users", userId, "notifications"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const notifications: AppNotification[] = [];
      snapshot.forEach((doc) => {
        notifications.push(doc.data() as AppNotification);
      });
      callback(notifications);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  if (isLocalDemo()) {
    const key = `dagar_local_notifications_${userId}`;
    const notifications: AppNotification[] = JSON.parse(localStorage.getItem(key) || "[]");
    const idx = notifications.findIndex(n => n.id === notificationId);
    if (idx >= 0) {
      notifications[idx].read = true;
      localStorage.setItem(key, JSON.stringify(notifications));
      window.dispatchEvent(new Event("dagar_chats_db_update"));
    }
    return;
  }

  const path = `users/${userId}/notifications/${notificationId}`;
  try {
    const docRef = doc(db, "users", userId, "notifications", notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Toggles a user's verification status in Firestore or local storage.
 */
export async function toggleUserProfileVerification(uid: string, currentStatus: boolean): Promise<void> {
  const newStatus = !currentStatus;

  if (isLocalDemo()) {
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.uid === uid);
    if (idx >= 0) {
      users[idx].isVerified = newStatus;
      saveLocalUsers(users);
    }
    return;
  }

  const path = `users/${uid}`;
  try {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, { isVerified: newStatus });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==========================================
// FOLLOW / UNFOLLOW SYSTEM
// ==========================================

function getLocalFollows(): { followerId: string; followingId: string }[] {
  return JSON.parse(localStorage.getItem("dagar_local_follows") || "[]");
}

function saveLocalFollows(follows: { followerId: string; followingId: string }[]) {
  localStorage.setItem("dagar_local_follows", JSON.stringify(follows));
  window.dispatchEvent(new Event("dagar_chats_db_update"));
}

/**
 * Follows a user.
 */
export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (isLocalDemo()) {
    const follows = getLocalFollows();
    const exists = follows.some(f => f.followerId === followerId && f.followingId === followingId);
    if (!exists) {
      follows.push({ followerId, followingId });
      saveLocalFollows(follows);
    }
    return;
  }

  const docId = `${followerId}_${followingId}`;
  const path = `follows/${docId}`;
  try {
    const docRef = doc(db, "follows", docId);
    await setDoc(docRef, {
      followerId,
      followingId,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Unfollows a user.
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  if (isLocalDemo()) {
    const follows = getLocalFollows();
    const updated = follows.filter(f => !(f.followerId === followerId && f.followingId === followingId));
    saveLocalFollows(updated);
    return;
  }

  const docId = `${followerId}_${followingId}`;
  const path = `follows/${docId}`;
  try {
    const docRef = doc(db, "follows", docId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribes to the follower list (user IDs) of a specific user.
 */
export function subscribeToFollowers(userId: string, callback: (followerIds: string[]) => void) {
  if (isLocalDemo()) {
    const fetchFollowers = () => {
      const follows = getLocalFollows();
      return follows.filter(f => f.followingId === userId).map(f => f.followerId);
    };
    callback(fetchFollowers());
    const handler = () => {
      callback(fetchFollowers());
    };
    window.addEventListener("dagar_chats_db_update", handler);
    return () => window.removeEventListener("dagar_chats_db_update", handler);
  }

  const q = query(collection(db, "follows"), where("followingId", "==", userId));
  return onSnapshot(q, (snapshot) => {
    const ids: string[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.followerId) {
        ids.push(data.followerId);
      }
    });
    callback(ids);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, "follows");
  });
}

/**
 * Subscribes to the following list (user IDs) of a specific user.
 */
export function subscribeToFollowing(userId: string, callback: (followingIds: string[]) => void) {
  if (isLocalDemo()) {
    const fetchFollowing = () => {
      const follows = getLocalFollows();
      return follows.filter(f => f.followerId === userId).map(f => f.followingId);
    };
    callback(fetchFollowing());
    const handler = () => {
      callback(fetchFollowing());
    };
    window.addEventListener("dagar_chats_db_update", handler);
    return () => window.removeEventListener("dagar_chats_db_update", handler);
  }

  const q = query(collection(db, "follows"), where("followerId", "==", userId));
  return onSnapshot(q, (snapshot) => {
    const ids: string[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.followingId) {
        ids.push(data.followingId);
      }
    });
    callback(ids);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, "follows");
  });
}

/**
 * Deletes a message from a chat thread (Instagram-style unsend/delete).
 */
export async function deleteMessage(chatId: string, messageId: string): Promise<void> {
  if (!chatId || !messageId) {
    console.error("deleteMessage called with invalid params:", { chatId, messageId });
    return;
  }

  if (isLocalDemo()) {
    const messages = getLocalMessages();
    const filtered = messages.filter((m) => m.id !== messageId);
    saveLocalMessages(filtered);

    // Update parent Chat's last message if needed
    const remainingForChat = filtered.filter((m) => m.chatId === chatId);
    const chats = getLocalChats();
    const chatIdx = chats.findIndex((c) => c.id === chatId);
    if (chatIdx >= 0) {
      if (remainingForChat.length > 0) {
        const lastMsg = remainingForChat[remainingForChat.length - 1];
        chats[chatIdx].lastMessage = lastMsg.text;
        chats[chatIdx].lastMessageTime = lastMsg.createdAt;
        chats[chatIdx].lastSenderId = lastMsg.senderId;
      } else {
        chats[chatIdx].lastMessage = "Conversation started";
        chats[chatIdx].lastSenderId = undefined;
      }
      saveLocalChats(chats);
    }
    window.dispatchEvent(new Event("dagar_chats_db_update"));
    return;
  }

  const path = `chats/${chatId}/messages/${messageId}`;
  try {
    const msgRef = doc(db, "chats", chatId, "messages", messageId);
    await deleteDoc(msgRef);

    // Update parent Chat last message
    const messagesCol = collection(db, "chats", chatId, "messages");
    const q = query(messagesCol, orderBy("createdAt", "desc"), limit(1));
    const snap = await getDocs(q);
    
    const chatRef = doc(db, "chats", chatId);
    if (!snap.empty) {
      const lastMsg = snap.docs[0].data() as Message;
      await updateDoc(chatRef, {
        lastMessage: lastMsg.text,
        lastMessageTime: lastMsg.createdAt || serverTimestamp(),
        lastSenderId: lastMsg.senderId,
      });
    } else {
      await updateDoc(chatRef, {
        lastMessage: "Conversation started",
        lastSenderId: "",
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Deletes an entire chat conversation/thread for a specific user (one-sided deletion).
 */
export async function deleteChat(chatId: string, userId: string): Promise<void> {
  if (isLocalDemo()) {
    const chats = getLocalChats();
    const chatIdx = chats.findIndex((c) => c.id === chatId);
    if (chatIdx >= 0) {
      if (!chats[chatIdx].deletedAt) {
        chats[chatIdx].deletedAt = {};
      }
      chats[chatIdx].deletedAt![userId] = new Date().toISOString();
      saveLocalChats(chats);
    }
    window.dispatchEvent(new Event("dagar_chats_db_update"));
    return;
  }

  const path = `chats/${chatId}`;
  try {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      [`deletedAt.${userId}`]: new Date().toISOString()
    });
    window.dispatchEvent(new Event("dagar_chats_db_update"));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Marks a chat as seen by a specific user.
 */
export async function markChatAsSeen(chatId: string, userId: string): Promise<void> {
  if (isLocalDemo()) {
    const chats = getLocalChats();
    const chatIdx = chats.findIndex((c) => c.id === chatId);
    if (chatIdx >= 0) {
      if (!chats[chatIdx].seenBy) {
        chats[chatIdx].seenBy = {};
      }
      chats[chatIdx].seenBy![userId] = new Date().toISOString();
      saveLocalChats(chats);
    }
    return;
  }

  const path = `chats/${chatId}`;
  try {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      [`seenBy.${userId}`]: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Report helper utilities for LocalStorage
 */
function getLocalReports(): PostReport[] {
  return JSON.parse(localStorage.getItem("dagar_local_reports") || "[]");
}

function saveLocalReports(reports: PostReport[]) {
  localStorage.setItem("dagar_local_reports", JSON.stringify(reports));
}

/**
 * Creates a new post report.
 */
export async function createPostReport(
  report: Omit<PostReport, "id" | "createdAt" | "status">
): Promise<void> {
  if (isLocalDemo()) {
    const reports = getLocalReports();
    const newReport: PostReport = {
      ...report,
      id: "report_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: "Pending"
    };
    reports.unshift(newReport);
    saveLocalReports(reports);
    window.dispatchEvent(new Event("dagar_chats_db_update"));
    return;
  }

  const path = "reports";
  try {
    const reportsCol = collection(db, "reports");
    const docRef = doc(reportsCol);
    const payload: PostReport = {
      ...report,
      id: docRef.id,
      createdAt: serverTimestamp(),
      status: "Pending"
    };
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Subscribes to realtime post reports.
 */
export function subscribeToPostReports(callback: (reports: PostReport[]) => void): () => void {
  if (isLocalDemo()) {
    const reports = getLocalReports();
    callback(reports);
    const handler = () => {
      callback(getLocalReports());
    };
    window.addEventListener("dagar_chats_db_update", handler);
    return () => window.removeEventListener("dagar_chats_db_update", handler);
  }

  const path = "reports";
  const q = query(collection(db, path), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const reports: PostReport[] = [];
      snapshot.forEach((doc) => {
        reports.push(doc.data() as PostReport);
      });
      callback(reports);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Updates status of a post report.
 */
export async function updatePostReportStatus(
  reportId: string,
  status: "Approved" | "Rejected"
): Promise<void> {
  if (isLocalDemo()) {
    const reports = getLocalReports();
    const idx = reports.findIndex((r) => r.id === reportId);
    if (idx >= 0) {
      reports[idx].status = status;
      saveLocalReports(reports);
      window.dispatchEvent(new Event("dagar_chats_db_update"));
    }
    return;
  }

  const path = `reports/${reportId}`;
  try {
    await updateDoc(doc(db, "reports", reportId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deletes a notification from Firestore or localStorage.
 */
export async function deleteNotification(userId: string, notificationId: string): Promise<void> {
  if (isLocalDemo()) {
    const key = `dagar_local_notifications_${userId}`;
    const notifications: AppNotification[] = JSON.parse(localStorage.getItem(key) || "[]");
    const filtered = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem(key, JSON.stringify(filtered));
    window.dispatchEvent(new Event("dagar_chats_db_update"));
    return;
  }

  const path = `users/${userId}/notifications/${notificationId}`;
  try {
    const docRef = doc(db, "users", userId, "notifications", notificationId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Checks if a post exists in Firestore or localStorage.
 */
export async function checkPostExists(postId: string): Promise<boolean> {
  if (isLocalDemo()) {
    const posts = getLocalPosts();
    return posts.some(p => p.id === postId);
  }
  try {
    const docRef = doc(db, "posts", postId);
    const snap = await getDoc(docRef);
    return snap.exists();
  } catch (err) {
    console.error("Error checking post existence:", err);
    return false;
  }
}


