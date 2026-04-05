const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/**
 * Build a readable history string from argument rows
 */
function buildHistory(args) {
  if (!args || args.length === 0) return 'No prior arguments.';
  return args
    .map(
      (a) =>
        `[Round ${a.round_number}, Participant ${a.participant_slot}]: ${a.content}`
    )
    .join('\n\n');
}

/**
 * Quick off-topic pre-check using Gemini 1.5 Flash
 * Returns { on_topic: boolean, warning: string }
 */
async function checkOffTopic(topic, priorArgs, newArgContent) {
  const history = buildHistory(priorArgs);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: 'You are a debate moderator. Given a debate topic and prior history, determine if a new argument is on-topic. Return ONLY valid JSON with no markdown, no explanation, no code fences.',
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  });

  const prompt = `Debate topic: "${topic}"

Prior debate history:
${history}

New argument to check:
"${newArgContent}"

Is this argument on-topic for the debate? Return ONLY this JSON:
{ "on_topic": true or false, "warning": "explanation if off-topic, null if on-topic" }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.trim().replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(clean);
}

/**
 * Full per-argument analysis using Gemini 1.5 Flash (async, called after save)
 */
async function analyzeArgument(topic, priorArgs, newArgContent) {
  const history = buildHistory(priorArgs);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: 'You are a debate analysis engine. Analyze the given argument in the context of the debate topic. Return ONLY valid JSON matching the exact schema provided — no markdown, no explanation, no code fences.',
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  });

  const prompt = `Debate topic: "${topic}"

Prior debate history:
${history}

New argument to analyze:
"${newArgContent}"

Return ONLY this JSON schema (no markdown):
{
  "claim_verified": true or false or "unverifiable",
  "claim_summary": "One-line summary of the claim made",
  "fallacies": [
    { "name": "Fallacy name", "explanation": "Why this is a fallacy in context" }
  ],
  "argument_strength": "weak" or "moderate" or "strong",
  "strength_reason": "Brief explanation",
  "references": [
    { "title": "Source name", "url": "https://...", "relevance": "Why this is relevant" }
  ],
  "on_topic": true or false,
  "off_topic_warning": "Explanation if off_topic is true, else null"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.trim().replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(clean);
}

/**
 * Full debate summary using Gemini 1.5 Pro
 */
async function generateSummary(topic, allArgs, p1name, p2name) {
  const history = buildHistory(allArgs);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: 'You are a strict debate judge. Analyze the full debate and return a structured verdict. Do NOT give a balanced conclusion. Declare a clear winner based purely on argument quality, logical consistency, use of evidence, and absence of fallacies. Return ONLY valid JSON matching the schema — no markdown, no explanation, no code fences.',
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  });

  const prompt = `Debate topic: "${topic}"

Participant 1: ${p1name}
Participant 2: ${p2name}

Full debate history:
${history}

Return ONLY this JSON schema (no markdown):
{
  "participant1": {
    "name": "${p1name}",
    "key_arguments": ["...", "..."],
    "strongest_argument": "...",
    "fallacies_used": ["..."],
    "overall_strength": "weak" or "moderate" or "strong"
  },
  "participant2": {
    "name": "${p2name}",
    "key_arguments": ["...", "..."],
    "strongest_argument": "...",
    "fallacies_used": ["..."],
    "overall_strength": "weak" or "moderate" or "strong"
  },
  "point_by_point_comparison": [
    {
      "round": 1,
      "p1_argument_summary": "...",
      "p2_argument_summary": "...",
      "winner": "participant1" or "participant2" or "tie",
      "reason": "..."
    }
  ],
  "conclusion": {
    "winner": "participant1" or "participant2",
    "winner_name": "...",
    "reasoning": "Detailed explanation of why this participant won. Be decisive, not diplomatic.",
    "decisive_argument": "The single most impactful argument in the entire debate"
  }
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.trim().replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(clean);
}

module.exports = { checkOffTopic, analyzeArgument, generateSummary };
