const fs = require('fs');
const path = require('path');
const { acquireLock, releaseLock } = require('../../src/helpers/lockManager');

describe('LockManager - Unit Tests (cPanel Stale Lock Protection)', () => {
    const testLockFile = path.join(__dirname, 'test.lock');

    afterEach(() => {
        if (fs.existsSync(testLockFile)) {
            fs.unlinkSync(testLockFile);
        }
    });

    it('acquires lock successfully when no file exists', () => {
        const acquired = acquireLock(testLockFile, 2);
        expect(acquired).toBe(true);
        expect(fs.existsSync(testLockFile)).toBe(true);
    });

    it('rejects lock acquisition when fresh lock file exists (prevents overlap)', () => {
        // Create fresh lock
        acquireLock(testLockFile, 2);

        // Try acquiring again immediately
        const secondAttempt = acquireLock(testLockFile, 2);
        expect(secondAttempt).toBe(false);
    });

    it('auto-cleans stale lock file (> 2 hours old) caused by cPanel killed process and acquires lock', () => {
        // Create an artificial stale lock file with modified mtime 3 hours in the past
        fs.writeFileSync(testLockFile, 'stale_process_pid_1234');
        const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000);
        fs.utimesSync(testLockFile, threeHoursAgo, threeHoursAgo);

        // Attempt acquisition with 2 hours TTL
        const acquired = acquireLock(testLockFile, 2);
        expect(acquired).toBe(true);
        expect(fs.existsSync(testLockFile)).toBe(true);

        const content = fs.readFileSync(testLockFile, 'utf8');
        expect(content).not.toBe('stale_process_pid_1234');
    });

    it('releases lock cleanly when task completes', () => {
        acquireLock(testLockFile, 2);
        expect(fs.existsSync(testLockFile)).toBe(true);

        releaseLock(testLockFile);
        expect(fs.existsSync(testLockFile)).toBe(false);
    });
});
