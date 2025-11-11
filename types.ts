export interface Provider {
  id: string;
  name: string;
  logo: string | null;
}

export interface DeliveryNoteItem {
  barcode?: string;
  codigo: string;
  producto: string;
  cantidad: number;
}

export interface PointOfSale {
  id: string;
  name: string;
  manager: string;
  managerId?: string;
  providerId: string;
}

export interface DeliveryNote {
  sequence: number;
  date: string;
  origin: PointOfSale;
  destination: PointOfSale;
  items: DeliveryNoteItem[];
  deliveredBy: string;
  receiverName: string;
  receiverId: string;
  processed: boolean;
  providerMessage?: string;
  image?: string | null;
}

export interface UserPermissions {
  note: boolean;
  history: boolean;
  products: boolean;
  settings: boolean;
  warehouse: boolean;
}

export interface User {
    id: string;
    username: string;
    password: string; // En una app real, esto debería ser un hash.
    role: 'admin' | 'user' | 'auditor';
    pointOfSaleId?: string; // Opcional, admin/auditor puede no tener uno.
    permissions: UserPermissions;
}

export interface Product {
    id: string;
    barcode: string;
    code: string;
    name: string;
    price: number;
}

export interface WarehouseStock {
  productId: string;
  pointOfSaleId: string;
  quantity: number;
}

export interface WarehouseTransaction {
  id: string;
  type: 'entry' | 'exit';
  productId: string;
  pointOfSaleId: string;
  quantity: number;
  date: string;
  reason: string;
  userId: string;
}
