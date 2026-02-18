
import forge from "node-forge";

const SALT = new TextEncoder().encode("zipties-default-salt-123");
const SHARED_SECRET = "zipties-conversation-shared-secret";


// Derive 256-bit key using PBKDF2
let cachedKey: forge.Bytes | null = null;

const getEncryptionKey = (secret: string) => {
  if (cachedKey) return cachedKey;

  cachedKey = forge.pkcs5.pbkdf2(
    secret,
    SALT,
    100000,
    32,
    forge.md.sha256.create()
  );
  return cachedKey;
};

export const encryptMessage = async (message: string): Promise<string> => {
  const key = getEncryptionKey(SHARED_SECRET);

  // 12-byte IV for GCM
  const iv = forge.random.getBytesSync(12);

  const cipher = forge.cipher.createCipher("AES-GCM", key);
  cipher.start({
    iv,
    tagLength: 128,
  });

  cipher.update(forge.util.createBuffer(message, "utf8"));
  cipher.finish();

  const ciphertext = cipher.output.getBytes();
  const tag = cipher.mode.tag.getBytes();

  // Combine IV + ciphertext + tag
  const combined = iv + ciphertext + tag;

  return forge.util.encode64(combined);
};

export const decryptMessage = async (
  encryptedBase64: string
): Promise<string> => {
  try {
    if (!encryptedBase64) return "";

    const key = getEncryptionKey(SHARED_SECRET);

    const combined = forge.util.decode64(encryptedBase64);

    const iv = combined.slice(0, 12);
    const tag = combined.slice(combined.length - 16);
    const ciphertext = combined.slice(12, combined.length - 16);

    const decipher = forge.cipher.createDecipher("AES-GCM", key);

    decipher.start({
      iv,
      tag: forge.util.createBuffer(tag),
      tagLength: 128,
    });

    decipher.update(forge.util.createBuffer(ciphertext));
    const pass = decipher.finish();

    if (!pass) throw new Error("Auth failed");

    return decipher.output.toString("utf8");
  } catch (error) {
    return "Encrypted message";
  }
};


