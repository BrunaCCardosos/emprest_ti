const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const manifest = JSON.parse(readFileSync(path.join(__dirname, '..', 'docs', 'specs',
  '002-dados-iniciais', 'manifesto-fotos.json'), 'utf8').replace(/^\uFEFF/, ''));
const localDirectory = process.env.EMPRESTI_PHOTO_DIR;
const publicBase = process.env.EMPRESTI_PUBLIC_PHOTO_BASE;

function hash(data) {
  return createHash('sha256').update(data).digest('hex').toUpperCase();
}

test('CA-03 — manifesto liga 12 origens diferentes do Pixabay à aprovação e à revisão visual', () => {
  assert.ok(manifest.reviewedBy && manifest.reviewedOn);
  assert.equal(manifest.source, 'Pixabay');
  assert.equal(manifest.items.length, 12);
  assert.equal(new Set(manifest.items.map((item) => item.pixabayId)).size, 12);
  for (const [index, item] of manifest.items.entries()) {
    const url = new URL(item.sourceUrl);
    const expected = 'TI-' + String(index + 1).padStart(4, '0');
    assert.equal(item.patrimony, expected);
    assert.equal(item.photoPath, `suporte_ti/${expected}.jpg`);
    assert.equal(url.origin, 'https://pixabay.com');
    assert.match(url.pathname, new RegExp(`-${item.pixabayId}/$`));
    assert.equal(url.search, '');
    assert.ok(item.author && item.preparation);
    assert.equal(item.license, 'Pixabay Content License');
  }
  assert.equal(manifest.rejected.length, 25);
  assert.ok(manifest.rejected.every(({ pixabayId, reason }) => Number.isInteger(pixabayId) && reason));
});

test('CA-04/CA-05 — JPEGs aprovados medem 800 × 600 e correspondem a 12 hashes e caminhos estáveis',
  { skip: !localDirectory && 'Informe EMPRESTI_PHOTO_DIR para conferir os JPEGs aprovados.' }, () => {
    const hashes = new Set();
    for (const item of manifest.items) {
      const file = path.join(localDirectory, path.basename(item.photoPath));
      const result = spawnSync('ffprobe', [
        '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height', '-of', 'csv=p=0', file,
      ], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.error?.message || result.stderr);
      assert.equal(result.stdout.trim(), 'mjpeg,800,600');
      const digest = hash(readFileSync(file));
      assert.equal(digest, item.sha256);
      hashes.add(digest);
    }
    assert.equal(hashes.size, 12);
  });

test('CA-04 — URLs públicas devolvem os JPEGs aprovados sem autenticação',
  { skip: !publicBase && 'Publicação no bucket de entrega pendente.' }, async () => {
    const base = new URL(publicBase.endsWith('/') ? publicBase : publicBase + '/');
    assert.equal(base.protocol, 'https:');
    assert.ok(!base.username && !base.password && !base.search && !base.hash);
    for (const item of manifest.items) {
      const response = await fetch(new URL(item.photoPath, base), { redirect: 'error', signal: AbortSignal.timeout(10000) });
      assert.equal(response.status, 200, item.photoPath);
      assert.match(response.headers.get('content-type') || '', /^image\/jpeg\b/i);
      assert.equal(hash(Buffer.from(await response.arrayBuffer())), item.sha256, item.photoPath);
    }
  });
