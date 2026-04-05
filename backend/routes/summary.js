const express = require('express');
const prisma = require('../services/db');
const authMiddleware = require('../middleware/auth');
const { generateSummary } = require('../services/ai');

const router = express.Router({ mergeParams: true });

// POST /api/debates/:id/summary — generate summary
router.post('/', authMiddleware, async (req, res) => {
  try {
    const debateId = Number(req.params.id);

    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        participant1: { select: { id: true, name: true } },
        participant2: { select: { id: true, name: true } },
        summary: true,
        arguments: {
          orderBy: [{ roundNumber: 'asc' }, { participantSlot: 'asc' }],
        },
      },
    });

    if (!debate) return res.status(404).json({ error: 'Debate not found' });

    if (debate.status !== 'completed') {
      return res.status(400).json({ error: 'Debate is not yet completed' });
    }

    if (
      debate.participant1Id !== req.user.userId &&
      debate.participant2Id !== req.user.userId
    ) {
      return res.status(403).json({ error: 'You are not a participant in this debate' });
    }

    // Return existing summary if already generated
    if (debate.summary) {
      return res.json({ summary: JSON.parse(debate.summary.summary) });
    }

    const p1Name = debate.participant1?.name || 'Participant 1';
    const p2Name = debate.participant2?.name || 'Participant 2';

    // Generate via Claude Sonnet
    const summaryData = await generateSummary(
      debate.topic,
      debate.arguments,
      p1Name,
      p2Name
    );

    // Save to DB
    await prisma.debateSummary.create({
      data: {
        debateId,
        summary: JSON.stringify(summaryData),
      },
    });

    return res.json({ summary: summaryData });
  } catch (err) {
    console.error('Generate summary error:', err);
    return res.status(500).json({ error: 'Failed to generate summary: ' + err.message });
  }
});

// GET /api/debates/:id/summary — retrieve saved summary
router.get('/', authMiddleware, async (req, res) => {
  try {
    const debateId = Number(req.params.id);

    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: { summary: true },
    });

    if (!debate) return res.status(404).json({ error: 'Debate not found' });

    if (
      debate.participant1Id !== req.user.userId &&
      debate.participant2Id !== req.user.userId
    ) {
      return res.status(403).json({ error: 'You are not a participant in this debate' });
    }

    if (!debate.summary) {
      return res.status(404).json({ error: 'Summary not yet generated' });
    }

    return res.json({ summary: JSON.parse(debate.summary.summary) });
  } catch (err) {
    console.error('Get summary error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
