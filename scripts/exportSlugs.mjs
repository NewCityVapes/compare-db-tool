import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let allSlugs = [];
let from = 0;
let to = 999;
let hasMore = true;

while (hasMore) {
  const { data, error } = await supabase
    .from('verdicts')
    .select('slug')
    .range(from, to);

  if (error) {
    console.error('❌ Supabase Error:', error);
    process.exit(1);
  }

  if (data.length === 0) {
    hasMore = false;
  } else {
    allSlugs.push(...data);
    from += 1000;
    to += 1000;
  }
}

fs.writeFileSync('./public-slugs.txt', allSlugs.map((v) => v.slug).join('\n'));
console.log(`✅ Exported ${allSlugs.length} slugs to public-slugs.txt`);
