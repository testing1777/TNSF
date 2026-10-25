const STOP = new Set(['the','and','for','with','that','this','from','are','was','were','have','has','into','their','there','which','using','use','our','you','your','but','not','can','may','also','these','those','than','then','such','its','a','an','of','to','in','on','at','by','as','is','be','or']);

export function normalize(text='') {
  return text.toLowerCase().normalize('NFKC').replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}
function shingles(text, n=5) {
  const words = normalize(text).split(' ').filter(Boolean);
  const set = new Set();
  if (words.length < n) { if (words.length) set.add(words.join(' ')); return set; }
  for (let i=0; i<=words.length-n; i++) set.add(words.slice(i,i+n).join(' '));
  return set;
}
function jaccard(a,b) {
  if (!a.size || !b.size) return 0;
  let common=0; for (const item of a) if (b.has(item)) common++;
  return common / (a.size + b.size - common);
}
export function screenText(input, corpus) {
  const normalized = normalize(input);
  const words = normalized.split(' ').filter(Boolean);
  if (words.length < 40) {
    return { eligible: false, message: 'Please provide at least 40 words for a useful comparison.', internalMatches: [], writingStyleIndicator: { available: false, note: 'Not assessed for short text.' } };
  }
  const shinglesInput = shingles(normalized);
  const matches = corpus.map(article => ({
    articleId: String(article._id),
    title: article.title,
    slug: article.slug,
    similarityPercent: Math.round(jaccard(shinglesInput, shingles(article.fullText || article.abstract)) * 1000) / 10
  })).filter(x => x.similarityPercent >= 8).sort((a,b) => b.similarityPercent-a.similarityPercent).slice(0,10);

  const unique = new Set(words);
  const sentences = input.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
  const avgSentenceLength = sentences.length ? words.length / sentences.length : words.length;
  const rareRatio = words.length ? words.filter(w => !STOP.has(w) && w.length > 3).length / words.length : 0;
  // Transparent, intentionally weak heuristic; NOT a validated AI detector.
  const heuristic = Math.max(0, Math.min(100, Math.round((Math.min(avgSentenceLength, 35) / 35 * 35) + (unique.size / words.length * 35) + (rareRatio * 30))));
  return {
    eligible: true,
    checkedAt: new Date().toISOString(),
    wordCount: words.length,
    internalMatches: matches,
    scope: 'Only published articles in this journal database; no internet-wide or subscription-database search.',
    interpretation: 'Similarity percentages are triage signals, not proof of plagiarism. Common phrases, quotations, and references may match.',
    writingStyleIndicator: {
      available: true,
      score: heuristic,
      label: 'Unvalidated text-style heuristic — not an AI-generated-text probability',
      note: 'This score must not be used to decide whether text was written by AI. AI detectors can be wrong; human editorial review is required.'
    }
  };
}
