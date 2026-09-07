import { inngest } from '../client';
import { cron } from 'inngest';
import { getBackend } from '../../lib/backend';
import { executeMidnightMaintenanceCascade } from '../../../../backend/src/contexts/limits/midnight-maintenance';

/**
 * fnMidnightMaintenance (AD-11 / AC-1.5.2)
 * Scheduled cron function running at 18:30 UTC / 12:00 AM Asia/Kolkata:
 * 1. Purges vector points in Qdrant matching active notebook IDs
 * 2. Purges remaining temporary files in Cloudinary
 * 3. Deletes records from Neon notebooks, sources, and chat_messages
 * 4. Resets limit_counters back to 10 credits.
 */
export const fnMidnightMaintenance = inngest.createFunction(
  { id: 'midnight-maintenance', triggers: [cron('30 18 * * *')] },
  async ({ step }: { step: any }) => {
    return await step.run('purge-and-reset-cascade', async () => {
      const { notebooks } = await getBackend();
      const result = await executeMidnightMaintenanceCascade([], [], {
        neonRepo: (notebooks as any).repo,
      });
      return { success: true, result, timestamp: new Date().toISOString() };
    });
  },
);
