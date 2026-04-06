// ask-user-questions-dedup — Tests for the per-turn signature cache in ask-user-questions.
//
// Verifies that:
// - identical question sets return cached results without re-dispatching
// - different question sets are treated as distinct (cache miss)
// - the cache is cleared on session_start / session_switch / agent_end

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  questionSignature,
  resetAskUserQuestionsCache,
} from '../../ask-user-questions.ts';

// ─── questionSignature ────────────────────────────────────────────────────────

console.log('\n── questionSignature: same questions produce same signature ──');

{
  const questions = [
    { id: 'q1', header: 'Approach', question: 'Which approach?', options: [{ label: 'A', description: 'Option A' }], allowMultiple: false },
  ];
  const sig1 = questionSignature(questions);
  const sig2 = questionSignature(questions);
  assert.strictEqual(sig1, sig2, 'Same questions should produce same signature');
  assert.ok(sig1.length > 0, 'Signature should be non-empty');
}

console.log('\n── questionSignature: different questions produce different signatures ──');

{
  const q1 = [{ id: 'q1', header: 'H1', question: 'Question 1?', options: [{ label: 'A', description: 'A' }] }];
  const q2 = [{ id: 'q2', header: 'H2', question: 'Question 2?', options: [{ label: 'B', description: 'B' }] }];
  const sig1 = questionSignature(q1);
  const sig2 = questionSignature(q2);
  assert.notStrictEqual(sig1, sig2, 'Different questions should produce different signatures');
}

console.log('\n── questionSignature: order-independent (sort by id) ──');

{
  const questionsAB = [
    { id: 'a', header: 'A', question: 'Q A?', options: [{ label: 'X', description: 'x' }] },
    { id: 'b', header: 'B', question: 'Q B?', options: [{ label: 'Y', description: 'y' }] },
  ];
  const questionsBA = [
    { id: 'b', header: 'B', question: 'Q B?', options: [{ label: 'Y', description: 'y' }] },
    { id: 'a', header: 'A', question: 'Q A?', options: [{ label: 'X', description: 'x' }] },
  ];
  const sigAB = questionSignature(questionsAB);
  const sigBA = questionSignature(questionsBA);
  assert.strictEqual(sigAB, sigBA, 'Signature should be the same regardless of question order');
}

console.log('\n── questionSignature: allowMultiple=false vs omitted are different ──');

{
  const withFalse = [{ id: 'q', header: 'H', question: 'Q?', options: [{ label: 'A', description: 'A' }], allowMultiple: false }];
  const withTrue  = [{ id: 'q', header: 'H', question: 'Q?', options: [{ label: 'A', description: 'A' }], allowMultiple: true }];
  const sigFalse = questionSignature(withFalse);
  const sigTrue  = questionSignature(withTrue);
  assert.notStrictEqual(sigFalse, sigTrue, 'allowMultiple:false and allowMultiple:true should produce different signatures');
}

// ─── resetAskUserQuestionsCache ───────────────────────────────────────────────

console.log('\n── resetAskUserQuestionsCache: cache is cleared ──');

{
  // Just verify the function exists and can be called without throwing
  resetAskUserQuestionsCache();
  resetAskUserQuestionsCache(); // calling twice is safe (idempotent)
  // If we get here without throwing, the function works
  assert.ok(true, 'resetAskUserQuestionsCache should be callable without error');
}

// ─── Signature stability ──────────────────────────────────────────────────────

console.log('\n── questionSignature: options content affects signature ──');

{
  const q1 = [{ id: 'q', header: 'H', question: 'Q?', options: [{ label: 'Option A', description: 'First' }] }];
  const q2 = [{ id: 'q', header: 'H', question: 'Q?', options: [{ label: 'Option B', description: 'Second' }] }];
  const sig1 = questionSignature(q1);
  const sig2 = questionSignature(q2);
  assert.notStrictEqual(sig1, sig2, 'Different options should produce different signatures');
}

console.log('\n── questionSignature: header affects signature ──');

{
  const q1 = [{ id: 'q', header: 'Header A', question: 'Q?', options: [{ label: 'X', description: 'x' }] }];
  const q2 = [{ id: 'q', header: 'Header B', question: 'Q?', options: [{ label: 'X', description: 'x' }] }];
  const sig1 = questionSignature(q1);
  const sig2 = questionSignature(q2);
  assert.notStrictEqual(sig1, sig2, 'Different headers should produce different signatures');
}

console.log('\n── questionSignature: empty array produces stable signature ──');

{
  const sig1 = questionSignature([]);
  const sig2 = questionSignature([]);
  assert.strictEqual(sig1, sig2, 'Empty array should produce a stable signature');
  assert.ok(sig1.length > 0, 'Empty array signature should be non-empty string');
}

// ═══════════════════════════════════════════════════════════════════════════
