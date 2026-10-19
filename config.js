/* =========================================================================
   EmpresTI — configuração pública do front-end
   -------------------------------------------------------------------------
   Aqui só entra valor que pode ser servido ao navegador: URL do projeto e
   chave PÚBLICA do Supabase (as mesmas `NEXT_PUBLIC_*` do .env).

   NUNCA coloque aqui a SUPABASE_SERVICE_ROLE_KEY: ela ignora o RLS e este
   arquivo é baixado por qualquer visitante (restrictions.md · Segurança).
   Operação administrativa é código de servidor (Route Handler),
   nunca front-end.

   Valores espelhados de `.env`:
     NEXT_PUBLIC_SUPABASE_URL      -> supabaseUrl
     NEXT_PUBLIC_SUPABASE_ANON_KEY -> supabasePublishableKey
   (a chave publicável `sb_publishable_…` substitui a anon key antiga)
   ========================================================================= */

window.EMPRESTI_CONFIG = {
  /* Supabase · Project Settings > Data API > Project URL */
  supabaseUrl: 'https://fobuhqvjheblmwbiwera.supabase.co',

  /* Supabase · Project Settings > API Keys > publishable key.
     Chave pública: pode ir para o navegador porque quem protege o dado é o
     RLS + os middlewares do tRPC, não o segredo da chave. */
  supabasePublishableKey: 'sb_publishable_Vz7D8Y9J-MNR6Ncec2-HSg_nvP0duh-',

  /* Opções do cliente de autenticação.
     persistSession:false — a sessão vive em memória enquanto a página está
     aberta e NUNCA é gravada em localStorage/sessionStorage
     (restrictions.md · Segurança: sessão é cookie httpOnly do @supabase/ssr
     na aplicação Next.js; aqui, num protótipo estático, fica só em memória). */
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
};
