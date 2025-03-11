const express = require('express');
const router = express.Router();
const Draft = require('../models/Draft');
const { authenticate } = require('../middleware/auth');

// 获取用户所有草稿
router.get('/', authenticate, async (req, res) => {
    try {
        const drafts = await Draft.find({ userId: req.user.id }).sort({ updatedAt: -1 });
        res.json(drafts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 获取单个草稿
router.get('/:id', authenticate, async (req, res) => {
    try {
        const draft = await Draft.findOne({ _id: req.params.id, userId: req.user.id });
        if (!draft) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        res.json(draft);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 创建新草稿
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, cardIndex, cardType, images, activeTexts, stickers } = req.body;
        const draft = new Draft({
            userId: req.user.id,
            name,
            cardIndex,
            cardType,
            images,
            activeTexts,
            stickers
        });
        await draft.save();
        res.status(201).json(draft);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 更新草稿
router.put('/:id', authenticate, async (req, res) => {
    try {
        const draft = await Draft.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        if (!draft) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        res.json(draft);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 删除草稿
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const draft = await Draft.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!draft) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        res.json({ message: 'Draft deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;