import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tableName = 'verdicts';
const csvFilePath = './import.csv';

const rows = [];

console.log('Starting CSV import...');

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    rows.push(row);
  })
  .on('end', async () => {
    console.log(`✅ Read ${rows.length} rows from CSV.`);
    console.log('📤 Uploading to Supabase...');

    // Batch upload (500 rows at a time)
    const batchSize = 500;
    let successCount = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from(tableName)
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error uploading batch ${i}-${i + batch.length}:`, error);
      } else {
        successCount += batch.length;
        console.log(`✅ Uploaded ${successCount}/${rows.length} rows`);
      }
    }

    console.log('🎉 Upload complete!');
  })
  .on('error', (error) => {
    console.error('❌ Error reading CSV:', error);
  });