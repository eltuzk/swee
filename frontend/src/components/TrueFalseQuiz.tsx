/**
 * True/False quiz (React island). Usage in MDX:
 *
 * <TrueFalseQuiz client:visible locale="en" items={[{ claim: '...', truth: true, explanation: '...' }]} />
 *
 * Fixed UI text comes from the UI strings (src/content/i18n/{vi,en}.json), picked by the `locale` prop.
 * Without JS (or before hydration) each item renders as a <details> with the answer and explanation,
 * so the content stays readable.
 */
import { useEffect, useId, useState } from 'react';
import vi from '../content/i18n/vi.json';
import en from '../content/i18n/en.json';
import '../styles/swee-box.css';
import './TrueFalseQuiz.css';

export interface TrueFalseItem {
	claim: string;
	truth: boolean;
	explanation: string;
}

interface Props {
	items: TrueFalseItem[];
	locale?: 'vi' | 'en';
}

const strings = { vi, en } as const;

export default function TrueFalseQuiz({ items, locale = 'en' }: Props) {
	const t = strings[locale] ?? strings.en;
	const [hydrated, setHydrated] = useState(false);
	const [answers, setAnswers] = useState<(boolean | null)[]>(() => items.map(() => null));
	const baseId = useId();

	useEffect(() => setHydrated(true), []);

	const truthLabel = (v: boolean) => (v ? t['swee.quiz.true'] : t['swee.quiz.false']);

	return (
		<aside className="swee-box swee-quiz" aria-label={t['swee.quiz.title']}>
			<p className="swee-box-title">{t['swee.quiz.title']}</p>
			<ol className="swee-quiz-list">
				{items.map((item, i) => {
					const chosen = answers[i];
					const answered = chosen !== null;
					const correct = answered && chosen === item.truth;
					const feedbackId = `${baseId}-fb-${i}`;

					if (!hydrated) {
						// No-JS fallback.
						return (
							<li key={i}>
								<p className="swee-quiz-claim">{item.claim}</p>
								<details>
									<summary>{t['swee.quiz.showAnswer']}</summary>
									<p>
										<strong>
											{t['swee.quiz.answerIs']} {truthLabel(item.truth)}
										</strong>
									</p>
									<p>{item.explanation}</p>
								</details>
							</li>
						);
					}

					return (
						<li key={i}>
							<p className="swee-quiz-claim">{item.claim}</p>
							<div className="swee-quiz-actions" role="group" aria-label={item.claim}>
								{[true, false].map((value) => (
									<button
										key={String(value)}
										type="button"
										className="swee-quiz-btn"
										aria-pressed={chosen === value}
										aria-describedby={answered ? feedbackId : undefined}
										onClick={() => setAnswers((prev) => prev.map((a, j) => (j === i ? value : a)))}
									>
										{truthLabel(value)}
									</button>
								))}
							</div>
							<div id={feedbackId} aria-live="polite">
								{answered && (
									<div className={`swee-quiz-feedback ${correct ? 'is-correct' : 'is-wrong'}`}>
										<p>
											<strong>{correct ? t['swee.quiz.correct'] : t['swee.quiz.incorrect']}</strong>{' '}
											{t['swee.quiz.answerIs']} {truthLabel(item.truth)}
										</p>
										<p>{item.explanation}</p>
									</div>
								)}
							</div>
						</li>
					);
				})}
			</ol>
		</aside>
	);
}
