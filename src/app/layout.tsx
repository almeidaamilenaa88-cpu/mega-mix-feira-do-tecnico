import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Mega Mix | Economia e qualidade em cada compra",
  description: "Supermercado digital Mega Mix.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
