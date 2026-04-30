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
