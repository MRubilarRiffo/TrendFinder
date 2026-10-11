const fs = require('fs');
const path = require('path');
const { recordBotRunFinished, getLastRunFinishedAt, clearBotState } = require('../../src/helpers/botState');

describe('botState - Unit Tests (Bot Run State Tracker)', () => {
    const testStateFile = path.join(__dirname, 'test_bot_state.json');

    afterEach(() => {
        clearBotState(testStateFile);
    });

    it('returns null when state file does not exist', () => {
        const lastRun = getLastRunFinishedAt(testStateFile);
        expect(lastRun).toBeNull();
    });

    it('records bot completion timestamp and retrieves it accurately', () => {
        const now = new Date();
        recordBotRunFinished(testStateFile);

        const lastRun = getLastRunFinishedAt(testStateFile);
        expect(lastRun).toBeInstanceOf(Date);
        expect(Math.abs(lastRun.getTime() - now.getTime())).toBeLessThan(1000); // Within 1s
    });

    it('clears bot state file cleanly', () => {
        recordBotRunFinished(testStateFile);
        expect(fs.existsSync(testStateFile)).toBe(true);

        clearBotState(testStateFile);
        expect(fs.existsSync(testStateFile)).toBe(false);
    });
});
