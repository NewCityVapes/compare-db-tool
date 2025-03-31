import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service key for upsert
);

const tableName = 'verdicts';
const csvFilePath = './import.csv';

const rows = [];

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    rows.push(row);
  })
  .on('end', async () => {
    console.log(`Read ${rows.length} rows from CSV.`);

    const { data, error } = await supabase
      .from(tableName)
      .upsert(rows, { onConflict: ['id'] }); // use your unique identifier here

    if (error) {
      console.error('Error uploading:', error);
    } else {
      console.log('Upload successful:', data);
    }
  });
