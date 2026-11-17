#!/usr/bin/env node
/**
 * Bilingual content check. English is the source language (root of src/content/docs/),
 * Vietnamese translations live in src/content/docs/vi/. Reports:
 * 1. English lessons with no Vietnamese translation yet.
 * 2. Vietnamese lessons with no English source at the same slug (these never show up on the site).
 * 3. Pairs whose `verification` status differs.
 *
 * Exits with code 1 when there are problems, so it can be used in CI.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS = fileURLToPath(new URL('../src/content/docs/', import.meta.url));
const VI = join(DOCS, 'vi');
const EXT = /\.(md|mdx)$/;

async function walk(dir, skip = []) {
	const out = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (skip.includes(full)) continue;
		if (entry.isDirectory()) out.push(...(await walk(full, skip)));
		else if (EXT.test(entry.name)) out.push(full);
	}
	return out;
}

const slugOf = (base, file) => relative(base, file).split(sep).join('/').replace(EXT, '');

async function verificationOf(file) {
	const text = await readFile(file, 'utf8');
	const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	const line = fm?.[1].match(/^verification:\s*['"]?([\w-]+)['"]?\s*$/m);
	return line?.[1] ?? 'unverified';
}

const en = new Map((await walk(DOCS, [VI])).map((f) => [slugOf(DOCS, f), f]));
const vi = new Map((await walk(VI)).map((f) => [slugOf(VI, f), f]));

const missingVi = [];
const orphanVi = [];
const mismatch = [];

for (const [slug, file] of en) {
	if (!vi.has(slug)) {
		missingVi.push(slug);
		continue;
	}
	const [a, b] = await Promise.all([verificationOf(file), verificationOf(vi.get(slug))]);
	if (a !== b) mismatch.push({ slug, en: a, vi: b });
}
for (const slug of vi.keys()) if (!en.has(slug)) orphanVi.push(slug);

console.log(`English lessons: ${en.size} · Vietnamese lessons: ${vi.size}\n`);

if (missingVi.length) {
	console.log(`Missing Vietnamese translation (${missingVi.length}):`);
	missingVi.forEach((s) => console.log(`  - ${s}`));
	console.log();
}
if (orphanVi.length) {
	console.log(
		`Vietnamese version without an English source at the same slug (${orphanVi.length}):`,
	);
	orphanVi.forEach((s) => console.log(`  - vi/${s}`));
	console.log();
}
if (mismatch.length) {
	console.log(`Mismatched verification status (${mismatch.length}):`);
	mismatch.forEach((m) => console.log(`  - ${m.slug}: en=${m.en}, vi=${m.vi}`));
	console.log();
}

const problems = missingVi.length + orphanVi.length + mismatch.length;
if (problems === 0) console.log('No problems found.');
process.exit(problems ? 1 : 0);
