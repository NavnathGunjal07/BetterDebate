const express = require('express');
const prisma = require('../services/db');
const authMiddleware = require('../middleware/auth');
const { checkOffTopic, analyzeArgument } = require('../services/ai');

const router = express.Router({ mergeParams: true });

// Helper: run async AI analysis and update DB
async function runAsyncAnalysis(argId, topic, priorArgs, content) {
  try {
    const analysis = await analyzeArgument(topic, priorArgs, content);
    await prisma.argument.update({
      where: { id: argId },
      data: {
        aiAnalysis: JSON.stringify(analysis),
        aiAnalysisStatus: 'done',
      },
    });
  } catch (err) {
    console.error('AI analysis failed for argument', argId, err.message);
    await prisma.argument.update({
      where: { id: argId },
      data: { aiAnalysisStatus: 'failed' },
    });
  }
}

// Helper: advance debate turn and check completion
async function advanceTurn(debateId, newSlot, p1Count, p2Count, maxTurns) {
  const totalP1 = newSlot === 1 ? p1Count + 1 : p1Count;
  const totalP2 = newSlot === 2 ? p2Count + 1 : p2Count;

  if (totalP1 >= maxTurns && totalP2 >= maxTurns) {
    await prisma.debate.update({
      where: { id: debateId },
      data: { status: 'completed', completedAt: new Date() },
    });
  } else {
    const nextTurn = newSlot === 1 ? 2 : 1;
    await prisma.debate.update({
      where: { id: debateId },
      data: { currentTurn: nextTurn },
    });
  }
}

// POST /api/debates/:id/arguments — submit with off-topic check
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const debateId = Number(req.params.id);

    const debate = await prisma.debate.findUnique({ where: { id: debateId } });
    if (!debate) return res.status(404).json({ error: 'Debate not found' });
    if (debate.status !== 'active') {
      return res.status(400).json({ error: 'Debate is not active' });
    }

    // Determine slot
    let slot = null;
    if (debate.participant1Id === req.user.userId) slot = 1;
    else if (debate.participant2Id === req.user.userId) slot = 2;
    else return res.status(403).json({ error: 'You are not a participant in this debate' });

    if (debate.currentTurn !== slot) {
      return res.status(400).json({ error: 'It is not your turn' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Argument content cannot be empty' });
    }
    if (content.trim().length > 1000) {
      return res.status(400).json({ error: 'Argument must not exceed 1000 characters' });
    }

    // Fetch all prior arguments for context
    const priorArgs = await prisma.argument.findMany({
      where: { debateId },
      orderBy: [{ roundNumber: 'asc' }, { participantSlot: 'asc' }],
    });


    // Determine round number for this slot
    const slotArgs = priorArgs.filter((a) => a.participantSlot === slot);
    const roundNumber = slotArgs.length + 1;
    const p1Count = priorArgs.filter((a) => a.participantSlot === 1).length;
    const p2Count = priorArgs.filter((a) => a.participantSlot === 2).length;

    // Save argument
    const saved = await prisma.argument.create({
      data: {
        debateId,
        userId: req.user.userId,
        participantSlot: slot,
        roundNumber,
        content: content.trim(),
      },
    });

    // Advance turn / mark completed
    await advanceTurn(debateId, slot, p1Count, p2Count, debate.maxTurns);

    // Async AI analysis (do not await)
    runAsyncAnalysis(saved.id, debate.topic, priorArgs, content.trim());

    return res.json({ argument: saved, offTopic: false });
  } catch (err) {
    console.error('Submit argument error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/debates/:id/arguments/force — skip off-topic check
router.post('/force', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const debateId = Number(req.params.id);

    const debate = await prisma.debate.findUnique({ where: { id: debateId } });
    if (!debate) return res.status(404).json({ error: 'Debate not found' });
    if (debate.status !== 'active') {
      return res.status(400).json({ error: 'Debate is not active' });
    }

    let slot = null;
    if (debate.participant1Id === req.user.userId) slot = 1;
    else if (debate.participant2Id === req.user.userId) slot = 2;
    else return res.status(403).json({ error: 'You are not a participant in this debate' });

    if (debate.currentTurn !== slot) {
      return res.status(400).json({ error: 'It is not your turn' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Argument content cannot be empty' });
    }
    if (content.trim().length > 1000) {
      return res.status(400).json({ error: 'Argument must not exceed 1000 characters' });
    }

    const priorArgs = await prisma.argument.findMany({
      where: { debateId },
      orderBy: [{ roundNumber: 'asc' }, { participantSlot: 'asc' }],
    });

    const slotArgs = priorArgs.filter((a) => a.participantSlot === slot);
    const roundNumber = slotArgs.length + 1;
    const p1Count = priorArgs.filter((a) => a.participantSlot === 1).length;
    const p2Count = priorArgs.filter((a) => a.participantSlot === 2).length;

    const saved = await prisma.argument.create({
      data: {
        debateId,
        userId: req.user.userId,
        participantSlot: slot,
        roundNumber,
        content: content.trim(),
      },
    });

    await advanceTurn(debateId, slot, p1Count, p2Count, debate.maxTurns);
    runAsyncAnalysis(saved.id, debate.topic, priorArgs, content.trim());

    return res.json({ argument: saved, offTopic: false });
  } catch (err) {
    console.error('Force submit argument error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
