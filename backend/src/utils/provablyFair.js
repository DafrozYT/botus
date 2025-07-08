const crypto = require('crypto');

class ProvablyFair {
  constructor() {
    this.serverSeedSecret = process.env.SERVER_SEED_SECRET || 'default_secret_change_in_production';
  }

  /**
   * Generate a server seed hash for display to users
   * @param {string} serverSeed - The server seed
   * @returns {string} - SHA256 hash of the server seed
   */
  generateServerSeedHash(serverSeed) {
    return crypto.createHash('sha256').update(serverSeed).digest('hex');
  }

  /**
   * Generate a new server seed
   * @returns {string} - Random server seed
   */
  generateServerSeed() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a client seed (usually provided by user or auto-generated)
   * @returns {string} - Random client seed
   */
  generateClientSeed() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate the final hash used for randomness
   * @param {string} serverSeed - The server seed
   * @param {string} clientSeed - The client seed
   * @param {number} nonce - The nonce (incremental counter)
   * @returns {string} - SHA256 hash
   */
  generateHash(serverSeed, clientSeed, nonce) {
    const combined = serverSeed + clientSeed + nonce.toString();
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Convert hash to a random number between 0 and 100
   * @param {string} hash - The SHA256 hash
   * @returns {number} - Random number between 0 and 100
   */
  hashToRandomNumber(hash) {
    // Use the first 8 characters of the hash for randomness
    const hashSegment = hash.substring(0, 8);
    const decimal = parseInt(hashSegment, 16);
    
    // Convert to percentage (0-100)
    const randomValue = (decimal / 0xffffffff) * 100;
    return parseFloat(randomValue.toFixed(6));
  }

  /**
   * Generate a provably fair random number
   * @param {string} serverSeed - The server seed
   * @param {string} clientSeed - The client seed
   * @param {number} nonce - The nonce
   * @returns {Object} - Object containing hash and random value
   */
  generateRandom(serverSeed, clientSeed, nonce) {
    const hash = this.generateHash(serverSeed, clientSeed, nonce);
    const randomValue = this.hashToRandomNumber(hash);
    
    return {
      hash,
      randomValue,
      serverSeed,
      clientSeed,
      nonce
    };
  }

  /**
   * Verify a provably fair result
   * @param {string} serverSeed - The server seed
   * @param {string} clientSeed - The client seed
   * @param {number} nonce - The nonce
   * @param {string} expectedHash - The expected hash
   * @param {number} expectedRandomValue - The expected random value
   * @returns {boolean} - Whether the result is valid
   */
  verify(serverSeed, clientSeed, nonce, expectedHash, expectedRandomValue) {
    const result = this.generateRandom(serverSeed, clientSeed, nonce);
    
    return (
      result.hash === expectedHash &&
      Math.abs(result.randomValue - expectedRandomValue) < 0.000001
    );
  }

  /**
   * Select an item from a case based on provably fair randomness
   * @param {Array} items - Array of items with chances
   * @param {number} randomValue - Random value from 0-100
   * @returns {Object} - Selected item
   */
  selectItem(items, randomValue) {
    let cumulative = 0;
    
    for (const item of items) {
      cumulative += item.chance;
      if (randomValue <= cumulative) {
        return item;
      }
    }
    
    // Fallback to last item if something goes wrong
    return items[items.length - 1];
  }

  /**
   * Generate complete provably fair data for a case opening
   * @param {Array} items - Array of items with chances
   * @param {string} clientSeed - Client seed (optional, will generate if not provided)
   * @param {number} nonce - Nonce (required)
   * @returns {Object} - Complete provably fair result
   */
  openCase(items, clientSeed = null, nonce) {
    const serverSeed = this.generateServerSeed();
    const finalClientSeed = clientSeed || this.generateClientSeed();
    
    const randomResult = this.generateRandom(serverSeed, finalClientSeed, nonce);
    const selectedItem = this.selectItem(items, randomResult.randomValue);
    
    return {
      selectedItem,
      provablyFair: {
        serverSeed,
        serverSeedHash: this.generateServerSeedHash(serverSeed),
        clientSeed: finalClientSeed,
        nonce,
        hash: randomResult.hash,
        randomValue: randomResult.randomValue
      }
    };
  }

  /**
   * Generate a verification URL for external verification
   * @param {string} serverSeed - The server seed
   * @param {string} clientSeed - The client seed
   * @param {number} nonce - The nonce
   * @param {string} hash - The hash
   * @returns {string} - Verification URL
   */
  generateVerificationUrl(serverSeed, clientSeed, nonce, hash) {
    const params = new URLSearchParams({
      server_seed: serverSeed,
      client_seed: clientSeed,
      nonce: nonce.toString(),
      hash: hash
    });
    
    return `${process.env.FRONTEND_URL}/verify?${params.toString()}`;
  }

  /**
   * Create a verification object for API responses
   * @param {string} serverSeed - The server seed
   * @param {string} clientSeed - The client seed
   * @param {number} nonce - The nonce
   * @param {string} hash - The hash
   * @param {number} randomValue - The random value
   * @returns {Object} - Verification object
   */
  createVerificationData(serverSeed, clientSeed, nonce, hash, randomValue) {
    return {
      serverSeed,
      serverSeedHash: this.generateServerSeedHash(serverSeed),
      clientSeed,
      nonce,
      hash,
      randomValue,
      verificationUrl: this.generateVerificationUrl(serverSeed, clientSeed, nonce, hash),
      isVerifiable: this.verify(serverSeed, clientSeed, nonce, hash, randomValue)
    };
  }

  /**
   * Batch verify multiple results (useful for auditing)
   * @param {Array} results - Array of provably fair results
   * @returns {Object} - Verification summary
   */
  batchVerify(results) {
    let totalResults = results.length;
    let validResults = 0;
    let invalidResults = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const isValid = this.verify(
        result.serverSeed,
        result.clientSeed,
        result.nonce,
        result.hash,
        result.randomValue
      );

      if (isValid) {
        validResults++;
      } else {
        invalidResults.push({
          index: i,
          result: result
        });
      }
    }

    return {
      totalResults,
      validResults,
      invalidResults: invalidResults.length,
      successRate: ((validResults / totalResults) * 100).toFixed(2) + '%',
      details: invalidResults
    };
  }
}

module.exports = new ProvablyFair();