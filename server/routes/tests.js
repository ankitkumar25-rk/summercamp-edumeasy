const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const User = require('../models/User');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CSRF check middleware (Ajax check)
const requireAjax = (req, res, next) => {
    const requestedWith = req.headers['x-requested-with'];
    if (!requestedWith || requestedWith !== 'XMLHttpRequest') {
        return res.status(403).json({ message: 'CSRF validation failed' });
    }
    next();
};

// ----------------------------------------------------
// ADMIN ENDPOINTS
// ----------------------------------------------------

// 1. Create a Mock Test
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { title, description, duration, startTime, endTime, studentClass, questions } = req.body;
        if (!title || !duration || !startTime || !endTime || !studentClass) {
            return res.status(400).json({ message: 'Missing required test configurations.' });
        }

        const newTest = await Test.create({
            title,
            description,
            duration: parseInt(duration),
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            studentClass: parseInt(studentClass),
            questions: questions || []
        });

        res.status(201).json({ message: 'Test created successfully', test: newTest });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error creating test' });
    }
});

// 2. Fetch all tests (Admin panel view)
router.get('/admin/all', verifyToken, requireAdmin, async (req, res) => {
    try {
        const tests = await Test.find().sort({ createdAt: -1 });
        res.json(tests);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching tests' });
    }
});

// 3. Toggle Lock / Unlock Test Window (Admin)
router.patch('/:id/window', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { startTime, endTime } = req.body;
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ message: 'Test not found' });

        if (startTime) test.startTime = new Date(startTime);
        if (endTime) test.endTime = new Date(endTime);
        await test.save();

        res.json({ message: 'Test window updated successfully', test });
    } catch (err) {
        res.status(500).json({ message: 'Server error updating window' });
    }
});

// 4. Delete a Mock Test (Admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const test = await Test.findByIdAndDelete(req.params.id);
        if (!test) return res.status(404).json({ message: 'Test not found' });
        // Clean up attempts
        await TestAttempt.deleteMany({ testId: req.params.id });
        res.json({ message: 'Test and associated attempts deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error deleting test' });
    }
});

// 5. Bulk CSV Question Bank Upload (Admin)
// Receives CSV as raw text inside a request body or JSON array
router.post('/:id/bulk-questions', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { csvText } = req.body;
        if (!csvText) return res.status(400).json({ message: 'No CSV data provided' });

        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ message: 'Test not found' });

        const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length <= 1) {
            return res.status(400).json({ message: 'CSV contains no question rows (only header or empty).' });
        }

        // Header: text,type,options,correctAnswers,points,negativePoints,difficulty,topic
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const textIdx = headers.indexOf('text');
        const typeIdx = headers.indexOf('type');
        const optionsIdx = headers.indexOf('options');
        const correctAnswersIdx = headers.indexOf('correctanswers');
        const pointsIdx = headers.indexOf('points');
        const negPointsIdx = headers.indexOf('negativepoints');
        const difficultyIdx = headers.indexOf('difficulty');
        const topicIdx = headers.indexOf('topic');

        if (textIdx === -1 || typeIdx === -1 || correctAnswersIdx === -1) {
            return res.status(400).json({ message: 'CSV requires at least "text", "type", and "correctAnswers" columns.' });
        }

        const parsedQuestions = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            
            // Simple comma split but support basic quotes handling
            // For standard simplicity in direct CSV parsing:
            const cols = [];
            let current = '';
            let inQuotes = false;
            for (let charIdx = 0; charIdx < line.length; charIdx++) {
                const char = line[charIdx];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    cols.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            cols.push(current.trim());

            if (cols.length < Math.max(textIdx, typeIdx, correctAnswersIdx) + 1) {
                errors.push(`Row ${i + 1}: Insufficient columns.`);
                continue;
            }

            const text = cols[textIdx];
            const type = cols[typeIdx].toLowerCase();
            const rawOptions = optionsIdx !== -1 ? cols[optionsIdx] : '';
            const rawCorrect = cols[correctAnswersIdx];
            const pointsVal = pointsIdx !== -1 && cols[pointsIdx] ? parseInt(cols[pointsIdx]) : 4;
            const negPointsVal = negPointsIdx !== -1 && cols[negPointsIdx] ? parseInt(cols[negPointsIdx]) : 0;
            const difficulty = difficultyIdx !== -1 && cols[difficultyIdx] ? cols[difficultyIdx].toLowerCase() : 'medium';
            const topic = topicIdx !== -1 && cols[topicIdx] ? cols[topicIdx] : 'General Algebra';

            // Validate types
            if (!['mcq_single', 'mcq_multi', 'integer', 'boolean'].includes(type)) {
                errors.push(`Row ${i + 1}: Invalid question type "${type}".`);
                continue;
            }

            // Split options and answers by semicolon (;)
            const options = rawOptions ? rawOptions.split(';').map(o => o.trim()).filter(o => o.length > 0) : [];
            const correctAnswers = rawCorrect ? rawCorrect.split(';').map(c => c.trim()).filter(c => c.length > 0) : [];

            if (correctAnswers.length === 0) {
                errors.push(`Row ${i + 1}: Missing correct answers.`);
                continue;
            }

            parsedQuestions.push({
                text,
                type,
                options,
                correctAnswers,
                points: isNaN(pointsVal) ? 4 : pointsVal,
                negativePoints: isNaN(negPointsVal) ? 0 : negPointsVal,
                difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
                topic
            });
        }

        if (errors.length > 0) {
            return res.status(400).json({ message: 'Validation errors found during CSV parsing.', errors });
        }

        // Atomic update: append parsed questions to the test
        test.questions.push(...parsedQuestions);
        await test.save();

        res.json({ message: `Successfully imported ${parsedQuestions.length} questions.`, test });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error processing CSV bulk upload' });
    }
});

// 6. View Test Results & Submissions (Admin)
router.get('/:id/results', verifyToken, requireAdmin, async (req, res) => {
    try {
        const attempts = await TestAttempt.find({ testId: req.params.id })
            .populate('userId', 'fullName email studentClass')
            .sort({ score: -1 });
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching results' });
    }
});

// ----------------------------------------------------
// STUDENT ENDPOINTS
// ----------------------------------------------------

// 1. Get Active Mock Tests targeting student's class
router.get('/active', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const now = new Date();
        
        // Find tests that are:
        // - Matching the student's class
        // - Within the current open window
        const tests = await Test.find({
            studentClass: user.studentClass,
            startTime: { $lte: now },
            endTime: { $gte: now }
        }).select('-questions.correctAnswers'); // Do not leak correct answers!

        // Map attempts status
        const activeTests = [];
        for (const t of tests) {
            const attempt = await TestAttempt.findOne({ userId: user._id, testId: t._id });
            activeTests.push({
                test: t,
                hasAttempted: !!attempt,
                isSubmitted: attempt ? attempt.isSubmitted : false,
                attemptId: attempt ? attempt._id : null,
                startedAt: attempt ? attempt.startedAt : null
            });
        }

        res.json(activeTests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching active tests' });
    }
});

// 2. Start Test Attempt
router.post('/:id/start', verifyToken, requireAjax, async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ message: 'Test not found' });

        const user = await User.findById(req.user.userId);
        if (user.studentClass !== test.studentClass) {
            return res.status(403).json({ message: 'This test is not configured for your class level.' });
        }

        // Check if window is open
        const now = new Date();
        if (now < test.startTime || now > test.endTime) {
            return res.status(403).json({ message: 'Test window is currently locked.' });
        }

        // Check for existing attempt
        let attempt = await TestAttempt.findOne({ userId: user._id, testId: test._id });
        if (attempt) {
            return res.status(400).json({ message: 'You have already started or submitted this test.', attempt });
        }

        attempt = await TestAttempt.create({
            userId: user._id,
            testId: test._id,
            startedAt: new Date(),
            isSubmitted: false
        });

        // Hide correct answers from question list returned
        const sanitizedTest = test.toObject();
        sanitizedTest.questions.forEach(q => delete q.correctAnswers);

        res.status(201).json({ attempt, test: sanitizedTest });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error starting attempt' });
    }
});

// 3. Submit Test Responses & Auto-grade
router.post('/:id/submit', verifyToken, requireAjax, async (req, res) => {
    try {
        const { responses } = req.body; // Array of { questionId, selectedAnswers, timeSpentSeconds }
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ message: 'Test not found' });

        const user = await User.findById(req.user.userId);

        const attempt = await TestAttempt.findOne({ userId: user._id, testId: test._id });
        if (!attempt) {
            return res.status(404).json({ message: 'No active test attempt found. Start the test first.' });
        }

        if (attempt.isSubmitted) {
            return res.status(400).json({ message: 'Test has already been submitted.' });
        }

        // Validate server-side timer:
        const timeLimitMs = (test.duration * 60 * 1000) + 120000; // adding 2 minutes buffer for networking lag
        const elapsedMs = Date.now() - attempt.startedAt.getTime();
        const hasTimedOut = elapsedMs > timeLimitMs;

        // Auto-grading calculations
        let totalScore = 0;
        let correctCount = 0;
        let wrongCount = 0;
        let totalTimeSpent = 0;

        const gradedResponses = [];
        const topicWise = new Map(); // topic -> { correct, total }

        test.questions.forEach(q => {
            const studentResp = (responses || []).find(r => r.questionId.toString() === q._id.toString());
            const selected = studentResp ? studentResp.selectedAnswers || [] : [];
            const timeSpent = studentResp ? parseInt(studentResp.timeSpentSeconds || 0) : 0;
            totalTimeSpent += timeSpent;

            // Sort both correct and selected to evaluate matching answers
            const correctSorted = [...q.correctAnswers].sort();
            const selectedSorted = [...selected].sort();
            
            let isCorrect = false;
            if (selectedSorted.length > 0) {
                isCorrect = JSON.stringify(correctSorted) === JSON.stringify(selectedSorted);
            }

            // Negative marking math
            let pointsGained = 0;
            if (selectedSorted.length > 0) {
                if (isCorrect) {
                    pointsGained = q.points;
                    correctCount++;
                } else {
                    pointsGained = -Math.abs(q.negativePoints); // apply negative deduction
                    wrongCount++;
                }
            }

            totalScore += pointsGained;

            // Track topic metrics
            const currentTopic = q.topic || 'General Algebra';
            if (!topicWise.has(currentTopic)) {
                topicWise.set(currentTopic, { correct: 0, total: 0 });
            }
            const tStats = topicWise.get(currentTopic);
            tStats.total += 1;
            if (isCorrect) tStats.correct += 1;

            gradedResponses.push({
                questionId: q._id,
                selectedAnswers: selected,
                isCorrect,
                timeSpentSeconds: timeSpent
            });
        });

        // Cap score at 0 minimum
        const finalScore = Math.max(0, totalScore);

        // Gamified reward updates:
        const xpForAttempt = 50; // base complete reward
        const xpForCorrectAnswers = correctCount * 10;
        const totalXpEarned = xpForAttempt + xpForCorrectAnswers;

        // Update attempt analytics
        attempt.completedAt = new Date();
        attempt.isSubmitted = true;
        attempt.responses = gradedResponses;
        attempt.score = finalScore;
        attempt.xpEarned = totalXpEarned;
        attempt.analytics = {
            accuracyPercent: test.questions.length > 0 ? Math.round((correctCount / test.questions.length) * 100) : 0,
            totalCorrect: correctCount,
            totalWrong: wrongCount,
            timeSpentMinutes: Math.round(totalTimeSpent / 60),
            topicWiseAnalysis: Object.fromEntries(topicWise)
        };

        await attempt.save();

        // Grant XP to User profile
        user.xp += totalXpEarned;
        
        // Dynamic Level adjustment
        if (user.xp >= 1000) {
            user.level = 'Math Wizard';
        } else if (user.xp >= 600) {
            user.level = 'Elite Solver';
        } else if (user.xp >= 300) {
            user.level = 'Algebra Challenger';
        } else {
            user.level = 'Rookie';
        }
        await user.save();

        res.json({
            message: hasTimedOut ? 'Test auto-submitted due to timer expiration.' : 'Test submitted successfully!',
            attempt,
            gradedWithAnswers: test // return test with correct answers for instant review
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error processing submission' });
    }
});

// 4. Get Student attempt for a specific test
router.get('/:id/attempt', verifyToken, async (req, res) => {
    try {
        const attempt = await TestAttempt.findOne({ userId: req.user.userId, testId: req.params.id });
        if (!attempt) return res.status(404).json({ message: 'No attempt record found' });

        const test = await Test.findById(req.params.id);
        res.json({ attempt, test });
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching attempt' });
    }
});

// 5. Get Student overall quiz analytics
router.get('/student/dashboard-stats', verifyToken, async (req, res) => {
    try {
        const attempts = await TestAttempt.find({ userId: req.user.userId, isSubmitted: true });
        
        let totalScore = 0;
        let totalCorrect = 0;
        let totalQuestionsAttempted = 0;

        attempts.forEach(a => {
            totalScore += a.score;
            totalCorrect += a.analytics.totalCorrect;
            totalQuestionsAttempted += (a.analytics.totalCorrect + a.analytics.totalWrong);
        });

        res.json({
            testsCompleted: attempts.length,
            totalScore,
            accuracy: totalQuestionsAttempted > 0 ? Math.round((totalCorrect / totalQuestionsAttempted) * 100) : 0
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error loading student statistics' });
    }
});

module.exports = router;
