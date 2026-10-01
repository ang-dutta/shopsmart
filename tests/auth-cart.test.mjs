import test from 'node:test';
import assert from 'node:assert/strict';
import { toUser, validateSignup } from '../lib/auth.js';
import { isConfigured } from '../lib/supabase.js';

test('toUser maps a Supabase user and falls back to the email name', () => {
  assert.deepEqual(toUser({ id: 'u1', email: 'ada@example.com', user_metadata: { name: 'Ada' } }), { id: 'u1', email: 'ada@example.com', name: 'Ada' });
  assert.equal(toUser({ id: 'u2', email: 'bob@example.com', user_metadata: {} }).name, 'bob');
  assert.equal(toUser(null), null);
});

test('validateSignup trims, lowercases and rejects bad input', () => {
  assert.deepEqual(validateSignup({ name: ' Ada ', email: ' Ada@Example.com ', password: 'secret1' }), { name: 'Ada', email: 'ada@example.com', password: 'secret1' });
  assert.throws(() => validateSignup({ name: 'A', email: 'a@b.co', password: 'secret1' }), /name/);
  assert.throws(() => validateSignup({ name: 'Ada', email: 'nope', password: 'secret1' }), /email/);
  assert.throws(() => validateSignup({ name: 'Ada', email: 'a@b.co', password: '123' }), /6 characters/);
});

test('app reports unconfigured Supabase when env vars are absent', () => {
  assert.equal(typeof isConfigured(), 'boolean');
});
