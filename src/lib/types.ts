export const categories = [
  "Hortifruti",
  "Mercearia",
  "Bebidas",
  "Laticínios",
  "Limpeza",
  "Padaria",
] as const;
export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: string;
  old_price: string | null;
  stock: number;
  min_stock: number;
  image: string;
  active: boolean;
};
export type Order = {
  id: string;
  number: number;
  customer_name: string;
  contact: string;
  status: "pending" | "preparing" | "completed" | "cancelled";
  total: string;
  created_at: string;
  order_items: { name: string; quantity: number; unit_price: string }[];
};
export const statuses = {
  pending: "Pendente",
  preparing: "Em preparação",
  completed: "Concluído",
  cancelled: "Cancelado",
};
export const cents = (value: string | number) =>
  Math.round(Number(value) * 100);
export const money = (value: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
