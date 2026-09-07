import { serve } from 'inngest/next';
import { inngest } from './client';
import { fnMidnightMaintenance } from './functions/midnight-maintenance';
import { fnSourceIngest } from './functions/source-ingest';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [fnMidnightMaintenance, fnSourceIngest],
});
