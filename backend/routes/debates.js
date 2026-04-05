const express = require('express');
const prisma = require('../services/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Generate a 6-char alphanumeric join code
function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Shape a full debate response object
function formatDebate(debate) {
  return {
    id: debate.id,
    topic: debate.topic,
    customTopic: debate.customTopic,
    status: debate.status,
    currentTurn: debate.currentTurn,
    maxTurns: debate.maxTurns,
    joinCode: debate.joinCode,
    p1Position: debate.p1Position || null,
    p2Position: debate.p2Position || null,
    createdAt: debate.createdAt,
    completedAt: debate.completedAt,
    participant1: debate.participant1
      ? { id: debate.participant1.id, name: debate.participant1.name }
      : null,
    participant2: debate.participant2
      ? { id: debate.participant2.id, name: debate.participant2.name }
      : null,
    arguments: (debate.arguments || []).map((a) => ({
      ...a,
      ai_analysis: a.aiAnalysis ? JSON.parse(a.aiAnalysis) : null,
      ai_analysis_status: a.aiAnalysisStatus,
    })),
    summary: debate.summary ? JSON.parse(debate.summary.summary) : null,
  };
}

const DEBATE_INCLUDE = {
  participant1: { select: { id: true, name: true } },
  participant2: { select: { id: true, name: true } },
  arguments: {
    orderBy: [{ roundNumber: 'asc' }, { participantSlot: 'asc' }],
  },
  summary: true,
};

// POST /api/debates — create a new debate
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { topic, customTopic, maxTurns } = req.body;

    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const turns = [3, 5, 7].includes(Number(maxTurns)) ? Number(maxTurns) : 5;
    const joinCode = generateJoinCode();

    const debate = await prisma.debate.create({
      data: {
        topic: topic.trim(),
        customTopic: !!customTopic,
        participant1Id: req.user.userId,
        status: 'waiting',
        maxTurns: turns,
        joinCode,
      },
    });

    return res.json({ debateId: debate.id, joinCode });
  } catch (err) {
    console.error('Create debate error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/debates/join-by-code — join via join code
router.post('/join-by-code', authMiddleware, async (req, res) => {
  try {
    const { joinCode } = req.body;
    if (!joinCode) return res.status(400).json({ error: 'Join code is required' });

    const debate = await prisma.debate.findFirst({
      where: { joinCode: joinCode.toUpperCase().trim() },
    });

    if (!debate) return res.status(404).json({ error: 'No debate found with that code' });

    // Already a participant — just return the debate ID
    if (
      debate.participant1Id === req.user.userId ||
      debate.participant2Id === req.user.userId
    ) {
      return res.json({ debateId: debate.id });
    }

    if (debate.participant2Id) {
      return res.status(400).json({ error: 'Debate already has two participants' });
    }

    // Join as participant 2
    await prisma.debate.update({
      where: { id: debate.id },
      data: { participant2Id: req.user.userId, status: 'active' },
    });

    return res.json({ debateId: debate.id });
  } catch (err) {
    console.error('Join by code error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/debates/:id/join — join as participant 2
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const debate = await prisma.debate.findUnique({
      where: { id: Number(req.params.id) },
      include: DEBATE_INCLUDE,
    });

    if (!debate) return res.status(404).json({ error: 'Debate not found' });
    if (debate.participant2Id) {
      return res.status(400).json({ error: 'Debate already has two participants' });
    }
    if (debate.participant1Id === req.user.userId) {
      return res.status(400).json({ error: 'You cannot join your own debate' });
    }

    const updated = await prisma.debate.update({
      where: { id: debate.id },
      data: { participant2Id: req.user.userId, status: 'active' },
      include: DEBATE_INCLUDE,
    });

    return res.json({ debate: formatDebate(updated) });
  } catch (err) {
    console.error('Join debate error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/debates/public — list completed public debates with pagination and search
router.get('/public', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const search = req.query.search ? req.query.search.trim() : '';
    const skip = (page - 1) * limit;

    const whereClause = {
      status: 'completed',
    };
    
    if (search) {
      whereClause.OR = [
        { topic: { contains: search, mode: 'insensitive' } },
        { arguments: { some: { content: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const [debates, totalCount] = await Promise.all([
      prisma.debate.findMany({
        where: whereClause,
        include: {
          participant1: { select: { id: true, name: true } },
          participant2: { select: { id: true, name: true } },
          summary: true,
        },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.debate.count({ where: whereClause })
    ]);

    const formatted = debates.map((d) => ({
      id: d.id,
      topic: d.topic,
      status: d.status,
      completedAt: d.completedAt,
      participant1: d.participant1,
      participant2: d.participant2,
      summary: d.summary ? JSON.parse(d.summary.summary) : null,
    }));

    return res.json({
      debates: formatted,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (err) {
    console.error('Public debates error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/debates/:id — get full debate
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const debate = await prisma.debate.findUnique({
      where: { id: Number(req.params.id) },
      include: DEBATE_INCLUDE,
    });

    if (!debate) return res.status(404).json({ error: 'Debate not found' });

    if (
      debate.participant1Id !== req.user.userId &&
      debate.participant2Id !== req.user.userId
    ) {
      return res.status(403).json({ error: 'You are not a participant in this debate' });
    }

    return res.json(formatDebate(debate));
  } catch (err) {
    console.error('Get debate error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/debates — list user's debates
router.get('/', authMiddleware, async (req, res) => {
  try {
    const debates = await prisma.debate.findMany({
      where: {
        OR: [
          { participant1Id: req.user.userId },
          { participant2Id: req.user.userId },
        ],
      },
      include: {
        participant1: { select: { id: true, name: true } },
        participant2: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = debates.map((d) => {
      const isP1 = d.participant1Id === req.user.userId;
      const opponent = isP1 ? d.participant2 : d.participant1;
      return {
        id: d.id,
        topic: d.topic,
        status: d.status,
        joinCode: d.joinCode,
        opponentName: opponent?.name || null,
        createdAt: d.createdAt,
      };
    });

    return res.json(formatted);
  } catch (err) {
    console.error('List debates error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/debates/:id/position — save participant's stated position/claim
router.post('/:id/position', authMiddleware, async (req, res) => {
  try {
    const debateId = Number(req.params.id);
    const { position } = req.body;

    if (!position || position.trim().length === 0) {
      return res.status(400).json({ error: 'Position cannot be empty' });
    }
    if (position.trim().length > 200) {
      return res.status(400).json({ error: 'Position must be 200 characters or fewer' });
    }

    const debate = await prisma.debate.findUnique({ where: { id: debateId } });
    if (!debate) return res.status(404).json({ error: 'Debate not found' });

    let field = null;
    if (debate.participant1Id === req.user.userId) field = 'p1Position';
    else if (debate.participant2Id === req.user.userId) field = 'p2Position';
    else return res.status(403).json({ error: 'You are not a participant in this debate' });

    const updated = await prisma.debate.update({
      where: { id: debateId },
      data: { [field]: position.trim() },
      include: DEBATE_INCLUDE,
    });

    return res.json({ debate: formatDebate(updated) });
  } catch (err) {
    console.error('Set position error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
