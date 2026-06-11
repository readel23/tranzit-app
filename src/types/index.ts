export interface Product {
  id: number;
  title: string;
  price: number;
  unit: string;
  image: string;
  category: string;
}

export interface CartItem {
  id: number;
  title: string;
  price: number;
  unit: string;
  image: string;
  quantity: number;
}

export interface UserProfile {
  phone: string;
  isIp: boolean;
  address?: string;
  city?: string;
  ipName?: string;
}

export interface Order {
  id: string;
  userId: string;
  userPhone: string;
  userAddress: string;
  userName: string;
  items: CartItem[];
  totalPrice: number;
  comment?: string;
  status: 'pending' | 'ready';
  createdAt: any; // Firestore Timestamp
}
