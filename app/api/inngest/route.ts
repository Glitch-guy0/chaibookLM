import { serve } from 'inngest/next';
import { inngest } from './client';
import { fnMidnightMaintenance } from './functions/midnight-maintenance';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [fnMidnightMaintenance],
});
