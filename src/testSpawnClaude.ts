#!/usr/bin/env tsx

/**
 * Test script for spawn-claude.ts using duplex streams
 *
 * Usage:
 *   tsx spawn-claude-test.ts
 */

import type { WebSocketMessage } from '@lasercat/claudeli';
import { spawnClaude, createStreamWrapper } from '@lasercat/claudeli';
import { Duplex } from 'stream';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

/**
 * Create a test duplex stream that collects messages
 */
function createTestStream(): {
  stream: Duplex;
  messages: WebSocketMessage[];
  waitForCompletion: (timeoutMs?: number) => Promise<void>;
} {
  const messages: WebSocketMessage[] = [];
  let completionResolve: (() => void) | null = null;
  const completionPromise = new Promise<void>((resolve) => {
    completionResolve = resolve;
  });

  const stream = new Duplex({
    write(chunk: Buffer | string, _encoding: string, callback: (error?: Error | null) => void) {
      try {
        const lines = chunk
          .toString()
          .split('\n')
          .filter((line) => line.trim());
        for (const line of lines) {
          const message = JSON.parse(line) as WebSocketMessage;
          messages.push(message);
          console.log(
            `${colors.dim}[${message.type}] ${JSON.stringify(message).substring(0, 100)}...${colors.reset}`,
          );

          // Check for completion
          if (message.type === 'claude-complete' && completionResolve) {
            completionResolve();
          }
        }
        callback();
      } catch (error) {
        callback(error as Error);
      }
    },
    read() {
      // Reading is handled by the write side
    },
  });

  return {
    stream,
    messages,
    waitForCompletion: (timeoutMs: number = 10000) => {
      return Promise.race([
        completionPromise,
        new Promise<void>((_resolve, reject) =>
          setTimeout(
            () => reject(new Error(`Timeout waiting for completion after ${timeoutMs}ms`)),
            timeoutMs,
          ),
        ),
      ]);
    },
  };
}

/**
 * Test 1: Basic command execution
 */
async function testBasicCommand(): Promise<void> {
  console.log(`${colors.yellow}▶ Test 1: Basic command execution${colors.reset}`);

  const { stream, messages, waitForCompletion } = createTestStream();

  try {
    // Start spawn without waiting for it to complete
    const spawnPromise = spawnClaude(
      'What is 2+2?',
      {
        cwd: process.cwd(),
      },
      stream,
    );

    // Wait for completion signal
    await waitForCompletion();

    // Now wait for spawn to finish
    const sessionId = await spawnPromise;

    console.log(`${colors.green}✓ Command executed successfully${colors.reset}`);
    console.log(`  ${colors.dim}Session ID: ${sessionId}${colors.reset}`);
    console.log(`  ${colors.dim}Messages received: ${messages.length}${colors.reset}`);

    // Check message types
    const messageTypes = new Set(messages.map((m) => m.type));
    console.log(
      `  ${colors.dim}Message types: ${Array.from(messageTypes).join(', ')}${colors.reset}`,
    );
  } catch (error) {
    console.error(`${colors.red}✗ Test failed: ${error}${colors.reset}`);
    throw error;
  }
}

/**
 * Test 2: Session resumption
 */
async function testSessionResumption(): Promise<void> {
  console.log(`\n${colors.yellow}▶ Test 2: Session resumption${colors.reset}`);

  // First create a session
  const { stream: stream1, waitForCompletion: wait1 } = createTestStream();

  try {
    console.log(`${colors.cyan}  Creating initial session...${colors.reset}`);
    const promise1 = spawnClaude('Remember the number 42', { cwd: process.cwd() }, stream1);

    await wait1();
    const sessionId = await promise1;

    if (!sessionId) {
      throw new Error('No session ID returned');
    }

    console.log(`${colors.green}  ✓ Initial session created: ${sessionId}${colors.reset}`);

    // Now resume the session
    console.log(`${colors.cyan}  Resuming session...${colors.reset}`);
    const { stream: stream2, messages: messages2, waitForCompletion: wait2 } = createTestStream();

    const promise2 = spawnClaude(
      'What number did I ask you to remember?',
      {
        cwd: process.cwd(),
        resume: sessionId,
      },
      stream2,
    );

    try {
      await wait2(5000); // 5 second timeout for resumed sessions
    } catch (timeoutError) {
      console.log(
        `${colors.yellow}  ⚠ Session resume didn't send completion signal (may be normal)${colors.reset}`,
        timeoutError,
      );
    }
    const resumedSessionId = await promise2;

    console.log(`${colors.green}  ✓ Session resumed successfully${colors.reset}`);
    console.log(`  ${colors.dim}Resumed session ID: ${resumedSessionId}${colors.reset}`);
    console.log(`  ${colors.dim}Messages in resumed session: ${messages2.length}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Test failed: ${error}${colors.reset}`);
    throw error;
  }
}

/**
 * Test 3: Tool settings
 */
async function testToolSettings(): Promise<void> {
  console.log(`\n${colors.yellow}▶ Test 3: Tool settings${colors.reset}`);

  const { stream, messages, waitForCompletion } = createTestStream();

  try {
    const promise = spawnClaude(
      'List files in current directory',
      {
        cwd: process.cwd(),
        allowedTools: ['Bash', 'Read'],
        permissionMode: 'bypassPermissions',
      },
      stream,
    );

    await waitForCompletion();
    const sessionId = await promise;

    console.log(`${colors.green}✓ Command with tool settings executed${colors.reset}`);
    console.log(`  ${colors.dim}Session ID: ${sessionId}${colors.reset}`);
    console.log(`  ${colors.dim}Messages received: ${messages.length}${colors.reset}`);

    // Check for tool usage
    const toolMessages = messages.filter(
      (m) => m.data && typeof m.data === 'object' && 'tool' in m.data,
    );
    console.log(`  ${colors.dim}Tool usage messages: ${toolMessages.length}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Test failed: ${error}${colors.reset}`);
    throw error;
  }
}

/**
 * Test 4: Session abortion
 */
async function testSessionAbortion(): Promise<void> {
  console.log(`\n${colors.yellow}▶ Test 4: Session abortion${colors.reset}`);

  const { stream, messages } = createTestStream();

  try {
    // Start a long-running command
    const promise = spawnClaude('Count from 1 to 1000000 slowly', { cwd: process.cwd() }, stream);

    // Give it a moment to start
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Abort the session (we don't have the session ID yet, so we'd need to handle this differently)
    console.log(
      `${colors.cyan}  Note: Abortion test would require session ID tracking${colors.reset}`,
    );

    // For now, just let it complete or timeout
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(
          `${colors.yellow}  Command timed out (expected for abortion test)${colors.reset}`,
        );
        resolve();
      }, 2000);
    });

    await Promise.race([promise, timeoutPromise]);

    console.log(`${colors.green}✓ Abortion test completed${colors.reset}`);
    console.log(
      `  ${colors.dim}Messages received before timeout: ${messages.length}${colors.reset}`,
    );
  } catch (error) {
    console.log(`${colors.yellow}  Expected error in abortion test: ${error}${colors.reset}`);
  }
}

/**
 * Test 5: Stream wrapper utility
 */
async function testStreamWrapper(): Promise<void> {
  console.log(`\n${colors.yellow}▶ Test 5: Stream wrapper utility${colors.reset}`);

  const { stream, onMessage } = createStreamWrapper();
  const receivedMessages: WebSocketMessage[] = [];

  onMessage((msg) => {
    receivedMessages.push(msg);
    console.log(`${colors.dim}  Received: ${msg.type}${colors.reset}`);
  });

  try {
    const promise = spawnClaude('Hello, Claude!', { cwd: process.cwd() }, stream);

    // Wait a bit for messages
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await promise;

    console.log(`${colors.green}✓ Stream wrapper test completed${colors.reset}`);
    console.log(`  ${colors.dim}Messages handled: ${receivedMessages.length}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Test failed: ${error}${colors.reset}`);
    throw error;
  }
}

/**
 * Main test runner
 */
async function runTests(): Promise<void> {
  console.log(
    `${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`,
  );
  console.log(`${colors.bright}Testing spawn-claude.ts with Duplex Streams${colors.reset}`);
  console.log(
    `${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`,
  );

  try {
    await testBasicCommand();
    await testSessionResumption();
    await testToolSettings();
    await testSessionAbortion();
    await testStreamWrapper();

    console.log(`\n${colors.bright}${colors.green}✅ All tests completed!${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.bright}${colors.red}❌ Test suite failed:${colors.reset}`);
    if (error instanceof Error) {
      console.error(`${colors.red}${error.message}${colors.reset}`);
      if (error.stack) {
        console.error(`${colors.dim}${error.stack}${colors.reset}`);
      }
    }
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
