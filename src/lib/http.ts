import { NextRequest, NextResponse } from "next/server";
export function sameOrigin(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin)
    throw new Error("FORBIDDEN");
}
export async function body(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > 20000) throw new Error("INVALID_INPUT");
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("INVALID_INPUT");
    return value;
  } catch {
    throw new Error("INVALID_INPUT");
  }
}
export function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "INTERNAL_ERROR";
  const map: Record<string, [number, string]> = {
    SETUP_REQUIRED: [503, "Configure o Supabase para ativar esta operação."],
    UNAUTHORIZED: [401, "Entre com sua conta de administrador."],
    FORBIDDEN: [403, "Acesso não autorizado."],
    INVALID_INPUT: [422, "Confira os dados informados."],
    ACTIVATION_DENIED: [
      403,
      "Código de ativação inválido. Confira o código recebido.",
    ],
    REGISTRATION_CLOSED: [
      409,
      "O cadastro inicial já foi concluído. Entre com sua conta.",
    ],
    ACCOUNT_EXISTS: [
      409,
      "Este e-mail já possui conta. Use o login ou outro e-mail.",
    ],
    REGISTRATION_FAILED: [
      422,
      "Não foi possível criar a conta. Confira o e-mail e use uma senha mais forte.",
    ],
    INSUFFICIENT_STOCK: [
      409,
      "O estoque mudou. Atualize a loja e confira o carrinho.",
    ],
    INVALID_STATE: [409, "Esta alteração de status não é permitida."],
    IDEMPOTENCY_CONFLICT: [
      409,
      "Esta tentativa já foi usada com outros dados.",
    ],
    STOCK_CONFLICT: [
      409,
      "O estoque mudou durante a edição. Recarregue antes de salvar.",
    ],
  };
  const [status, message] = map[code] ?? [
    500,
    "Não foi possível concluir. Tente novamente.",
  ];
  return NextResponse.json(
    { code: map[code] ? code : "INTERNAL_ERROR", message },
    { status },
  );
}
