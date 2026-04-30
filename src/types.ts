export type PropertyCategory = 'Bachelor' | 'Family' | 'Office';

export interface Property {
  id: string;
  title: string;
  category: PropertyCategory;
  description: string;
  rent: number;
  deposit: number;
  utilityDetails: string;
  city: string;
  area: string;
  address: string;
  isFeatured?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  amenities: string[];
  images: string[];
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerWhatsapp?: string;
  createdAt: any;
  updatedAt: any;
}

export type OperationType = 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  bio?: string;
  city?: string;
  area?: string;
  photoURL?: string;
  contactPrivacy: 'Public' | 'Private';
  createdAt: any;
  updatedAt: any;
}

export interface Chat {
  id: string;
  participants: string[]; // [uid1, uid2]
  participantDetails: {
    [uid: string]: {
      displayName: string;
      photoURL: string;
    }
  };
  lastMessage?: string;
  lastSenderId?: string;
  lastTimestamp: any;
  unreadCount?: {
    [uid: string]: number;
  };
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  isRead: boolean;
}
