import { createHash } from 'crypto';

import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class IdentityThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req.user as { id?: unknown } | undefined;
    if (typeof user?.id === 'string') {
      return `user:${user.id}`;
    }

    const body = req.body as { refreshToken?: unknown } | undefined;
    if (typeof body?.refreshToken === 'string') {
      const hash = createHash('sha256').update(body.refreshToken).digest('hex');
      return `rt:${hash}`;
    }

    return `ip:${String(req.ip)}`;
  }
}
