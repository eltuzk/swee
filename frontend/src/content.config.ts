import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

export const verificationStatuses = ['unverified', 'claude-checked', 'approved'] as const;

/**
 * Starlight's `docsLoader()` ignores every file whose name starts with `_`.
 * We want the `_template` page to render (to preview every component),
 * so we use Astro's `glob()` directly with the same base directory and extensions as docsLoader,
 * plus an exception for `_template.mdx`.
 */
const docsGlob = glob({
	base: './src/content/docs',
	pattern: ['**/[^_]*.{md,mdx}', '**/_template.mdx'],
});

export const collections = {
	docs: defineCollection({
		loader: docsGlob,
		schema: docsSchema({
			extend: z.object({
				/** Verification status of THIS language version only. */
				verification: z.enum(verificationStatuses).default('unverified'),
				/** Links to official documentation. */
				sources: z.array(z.string()).default([]),
				/** Slugs of lessons worth reading first (optional), e.g. `database-design/data-modeling`. */
				prerequisites: z.array(z.string()).default([]),
			}),
		}),
	}),
	i18n: defineCollection({
		loader: i18nLoader(),
		schema: i18nSchema({
			extend: z.object({
				'swee.youWillLearn': z.string(),
				'swee.pitfall': z.string(),
				'swee.pitfall.wrong': z.string(),
				'swee.pitfall.right': z.string(),
				'swee.deepDive': z.string(),
				'swee.interview': z.string(),
				'swee.interview.showAnswer': z.string(),
				'swee.challenge': z.string(),
				'swee.challenge.showSolution': z.string(),
				'swee.challenge.sampleCode': z.string(),
				'swee.recap': z.string(),
				'swee.quiz.title': z.string(),
				'swee.quiz.true': z.string(),
				'swee.quiz.false': z.string(),
				'swee.quiz.correct': z.string(),
				'swee.quiz.incorrect': z.string(),
				'swee.quiz.answerIs': z.string(),
				'swee.quiz.showAnswer': z.string(),
				'swee.prerequisites': z.string(),
				'swee.lessonCount_one': z.string(),
				'swee.lessonCount_other': z.string(),
				'swee.verification.label': z.string(),
				'swee.verification.unverified': z.string(),
				'swee.verification.claude-checked': z.string(),
				'swee.verification.approved': z.string(),
				'swee.verification.fallbackNote': z.string(),
			}),
		}),
	}),
};
