export interface SmsMessage {
  to: string;
  body: string;
}

export interface SmsProvider {
  name: string;
  send(message: SmsMessage): Promise<{ ok: boolean; id: string }>;
}

const sentSms: Array<SmsMessage & { sentAt: Date; id: string }> = [];

class DevSmsProvider implements SmsProvider {
  name = "dev";
  async send(message: SmsMessage) {
    const id = `sms_dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    sentSms.push({ ...message, id, sentAt: new Date() });
    if (process.env.NODE_ENV !== "production") {
      console.log(`[SMS DEV] to=${message.to} body="${message.body.slice(0, 60)}..."`);
    }
    return { ok: true, id };
  }
}

export function getSmsProvider(): SmsProvider {
  return new DevSmsProvider();
}

export function getDevSmsLog() {
  return [...sentSms].reverse();
}

export const smsTemplates = {
  delivered(name: string, amountPkr: string) {
    return {
      en: `Zarpay: PKR ${amountPkr} delivered to your account, ${name}. Thank you.`,
      ur: `زرپے: PKR ${amountPkr} آپ کے اکاؤنٹ میں موصول ہو گئے ہیں، ${name}۔ شکریہ۔`,
    };
  },
};
