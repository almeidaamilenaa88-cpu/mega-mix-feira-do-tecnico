import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Joga Fácil | Sua próxima pelada começa aqui",
  description: "Encontre jogadores, organize partidas e reserve sua próxima pelada.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
