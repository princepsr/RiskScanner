package com.riskscanner.dependencyriskanalyzer.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Small utility service for encrypting/decrypting sensitive values (currently the AI API key).
 *
 * <p>Encryption details:
 * <ul>
 *   <li>AES-GCM with random IV per ciphertext</li>
 *   <li>Key material derived from {@code buildaegis.encryption.secret} using SHA-256</li>
 * </ul>
 *
 * <p>Operational notes:
 * <ul>
 *   <li>If {@code buildaegis.encryption.secret} is blank, values are stored in plaintext.</li>
 *   <li>If values were stored encrypted and the secret is later removed/changed, decryption will fail.</li>
 * </ul>
 */
@Service
public class CryptoService {

    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final int IV_LENGTH_BYTES = 12;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${buildaegis.encryption.secret:}")
    private String encryptionSecret;

    public boolean isEncryptionConfigured() {
        return encryptionSecret != null && !encryptionSecret.isBlank();
    }

    public String encrypt(String plaintext) {
        if (!isEncryptionConfigured()) {
            return plaintext;
        }
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKeyFromSecret(encryptionSecret), new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt value", e);
        }
    }

    public String decrypt(String ciphertextOrPlaintext, boolean encrypted) {
        if (!encrypted) {
            return ciphertextOrPlaintext;
        }
        if (!isEncryptionConfigured()) {
            throw new IllegalStateException("Encryption secret is not configured");
        }
        try {
            byte[] combined = Base64.getDecoder().decode(ciphertextOrPlaintext);
            byte[] iv = new byte[IV_LENGTH_BYTES];
            byte[] ciphertext = new byte[combined.length - IV_LENGTH_BYTES];
            System.arraycopy(combined, 0, iv, 0, IV_LENGTH_BYTES);
            System.arraycopy(combined, IV_LENGTH_BYTES, ciphertext, 0, ciphertext.length);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, secretKeyFromSecret(encryptionSecret), new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] plaintext = cipher.doFinal(ciphertext);

            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt value", e);
        }
    }

    private SecretKey secretKeyFromSecret(String secret) throws Exception {
        MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
        byte[] keyBytes = sha256.digest(secret.getBytes(StandardCharsets.UTF_8));
        return new SecretKeySpec(keyBytes, "AES");
    }
}
