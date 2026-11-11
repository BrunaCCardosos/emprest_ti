import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-static';

export async function GET() {
  const prototype = await readFile(path.join(process.cwd(), 'index.html'), 'utf8');
  const html = prototype
    .replace('<html lang="pt-BR">', '<html lang="pt-BR" data-empresti-server>')
    .replace(/^<script src="(?:https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/[^"]+|config\.js)"><\/script>\r?\n/gm, '');
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
