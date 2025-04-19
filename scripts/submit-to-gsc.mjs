import { google } from 'googleapis';
import fs from 'fs';

// Auth with Google Indexing API
const auth = new google.auth.GoogleAuth({
  keyFile: './exalted-analogy-457304-u1-4485f74622f1.json',
  scopes: ['https://www.googleapis.com/auth/indexing'],
});

const indexing = google.indexing({ version: 'v3', auth });

async function submitURLs() {
  const rawSlugs = fs.readFileSync('./public-slugs.txt', 'utf8').split('\n');
  const slugs = rawSlugs.map((s) => s.trim()).filter(Boolean);

  console.log(`📦 Found ${slugs.length} slugs to submit.\n`);

  let submitted = 0;
  let failed = 0;

  for (const slug of slugs) {
    const url = `https://compare.newcityvapes.com/compare/${slug}`;
    try {
      await indexing.urlNotifications.publish({
        requestBody: { url, type: 'URL_UPDATED' },
      });
      console.log(`✅ Submitted: ${url}`);
      submitted++;
    } catch (e) {
      console.error(`❌ Failed: ${url}`, e?.message ?? e);
      failed++;
    }

    // Optional: throttle requests to avoid rate limits
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\n🎉 Done. ${submitted} submitted, ${failed} failed.`);
}

submitURLs();
