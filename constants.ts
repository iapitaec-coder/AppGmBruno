import { PointOfSale, User, Product, Provider, WarehouseStock } from './types';

export const INITIAL_PROVIDERS: Provider[] = [
    { id: 'prov_1', name: 'Distribuidora La Favorita', logo: null },
    { id: 'prov_2', name: 'Logística Andina S.A.', logo: null },
];

export const INITIAL_POINTS_OF_SALE: PointOfSale[] = [
  { id: 'bodega_central', name: 'Bodega Central', manager: 'Juan Pérez', managerId: '1712345678', providerId: 'prov_1' },
  { id: 'punto_magdalena', name: 'Punto Magdalena', manager: 'Andres Clavijo', managerId: '1787654321', providerId: 'prov_1' },
  { id: 'sucursal_norte', name: 'Sucursal Norte', manager: 'Maria Rodriguez', managerId: '1722334455', providerId: 'prov_2' },
  { id: 'sucursal_sur', name: 'Sucursal Sur', manager: 'Carlos Sánchez', managerId: '1755667788', providerId: 'prov_2' },
];

export const INITIAL_USERS: User[] = [
    { id: 'user_admin', username: 'admin', password: 'admin', role: 'admin', permissions: { note: true, history: true, products: true, settings: true, warehouse: true } },
    { id: 'user_1', username: 'jperez', password: '123', role: 'user', pointOfSaleId: 'bodega_central', permissions: { note: true, history: true, products: false, settings: false, warehouse: false } },
    { id: 'user_2', username: 'mrodriguez', password: '123', role: 'user', pointOfSaleId: 'sucursal_norte', permissions: { note: true, history: true, products: false, settings: false, warehouse: false } },
    { id: 'user_auditor', username: 'auditor', password: 'auditor', role: 'auditor', permissions: { note: false, history: true, products: false, settings: false, warehouse: true } },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'prod_1', barcode: '7861234567890', code: 'GAS-001', name: 'Gaseosa 3L', price: 2.50 },
  { id: 'prod_2', barcode: '7861234567891', code: 'AGU-001', name: 'Agua Sin Gas 500ml', price: 0.50 },
  { id: 'prod_3', barcode: '7861234567892', code: 'SNK-001', name: 'Papas Fritas Onduladas', price: 0.75 },
  { id: 'prod_4', barcode: '7861234567893', code: 'GAL-001', name: 'Galletas de Chocolate Paquete', price: 1.25 },
  { id: 'prod_5', barcode: '3154147425350', code: 'p001', name: 'resaltador', price: 1.00 },
];

export const INITIAL_WAREHOUSE_STOCK: WarehouseStock[] = [
  { productId: 'prod_1', pointOfSaleId: 'bodega_central', quantity: 150 },
  { productId: 'prod_2', pointOfSaleId: 'bodega_central', quantity: 300 },
  { productId: 'prod_3', pointOfSaleId: 'bodega_central', quantity: 200 },
  { productId: 'prod_4', pointOfSaleId: 'bodega_central', quantity: 120 },
  { productId: 'prod_5', pointOfSaleId: 'bodega_central', quantity: 1 },
];
