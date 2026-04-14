export interface OtpProvider {
  name: string;
  send(args: { phone: string }): Promise<{ challengeId: string }>;
  verify(args: { challengeId: string; code: string }): Promise<{ ok: boolean }>;
}

const challenges = new Map<string, { phone: string; expiresAt: number }>();

class DevOtpProvider implements OtpProvider {
  name = "dev";
  async send(args: { phone: string }) {
    const id = `otp_dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    challenges.set(id, { phone: args.phone, expiresAt: Date.now() + 10 * 60_000 });
    if (process.env.NODE_ENV !== "production") {
      // Dev: any 6-digit code works, but we surface the "expected" one
      console.log(`[OTP DEV] phone=${args.phone} challenge=${id} accept any 6-digit code (e.g. 123456)`);
    }
    return { challengeId: id };
  }
  async verify(args: { challengeId: string; code: string }) {
    const challenge = challenges.get(args.challengeId);
    if (!challenge || challenge.expiresAt < Date.now()) return { ok: false };
    if (!/^\d{6}$/.test(args.code)) return { ok: false };
    challenges.delete(args.challengeId);
    return { ok: true };
  }
}

export function getOtpProvider(): OtpProvider {
  return new DevOtpProvider();
}
