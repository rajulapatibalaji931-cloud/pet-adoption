const crypto = require('crypto');

const getKey = () => {
  const raw = process.env.DATA_ENCRYPTION_KEY || 'pawbridge_dev_32_char_enc_key_26';
  return crypto.createHash('sha256').update(raw).digest();
};

const encryptText = (plainText) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
};

const verifyWebhookSignature = (payload, signature, secret) => {
  if (!secret || !signature) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
};

module.exports = {
  encryptText,
  verifyWebhookSignature,
};
