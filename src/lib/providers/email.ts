export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailProvider {
  name: string;
  send(message: EmailMessage): Promise<{ ok: boolean; id: string }>;
}

const sentInbox: Array<EmailMessage & { sentAt: Date; id: string }> = [];

class DevEmailProvider implements EmailProvider {
  name = "dev";
  async send(message: EmailMessage) {
    const id = `email_dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    sentInbox.push({ ...message, id, sentAt: new Date() });
    if (process.env.NODE_ENV !== "production") {
      console.log(`[EMAIL DEV] to=${message.to} subject="${message.subject}"`);
    }
    return { ok: true, id };
  }
}

export function getEmailProvider(): EmailProvider {
  return new DevEmailProvider();
}

export function getDevInbox() {
  return [...sentInbox].reverse();
}

export function clearDevInbox() {
  sentInbox.length = 0;
}

// ---- Templates ----

export const emailTemplates = {
  kycApproved(name: string) {
    return {
      subject: "Your Zarpay verification is complete",
      body: `Hi ${name},\n\nYour identity verification is complete. You can now send money to Pakistan.\n\nThe Zarpay team`,
    };
  },
  kycRejected(name: string, reason: string) {
    return {
      subject: "Your Zarpay verification needs attention",
      body: `Hi ${name},\n\nWe were unable to verify the documents you uploaded. Reason: ${reason}\n\nPlease submit fresh copies in your account.\n\nThe Zarpay team`,
    };
  },
  transferInitiated(name: string, reference: string, amountGbp: string, recipientName: string) {
    return {
      subject: `Transfer ${reference} initiated`,
      body: `Hi ${name},\n\nYour transfer of £${amountGbp} to ${recipientName} is being processed.\n\nReference: ${reference}\n\nThe Zarpay team`,
    };
  },
  transferFunded(name: string, reference: string) {
    return {
      subject: `Transfer ${reference} funded`,
      body: `Hi ${name},\n\nWe have received your payment for transfer ${reference}. We will send funds to your recipient shortly.\n\nThe Zarpay team`,
    };
  },
  transferInTransit(name: string, reference: string) {
    return {
      subject: `Transfer ${reference} in transit`,
      body: `Hi ${name},\n\nYour transfer ${reference} is now with our payout partner in Pakistan.\n\nThe Zarpay team`,
    };
  },
  transferDelivered(name: string, reference: string, recipientName: string, amountPkr: string) {
    return {
      subject: `Transfer ${reference} delivered`,
      body: `Hi ${name},\n\nPKR ${amountPkr} has been delivered to ${recipientName}.\n\nReference: ${reference}\n\nThe Zarpay team`,
    };
  },
};
