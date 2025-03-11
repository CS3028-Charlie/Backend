const mongoose = require("mongoose");

const draftSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    cardIndex: { type: Number, required: true },
    cardType: { type: String, enum: ["eCard", "Printable"], default: "eCard" },
    images: { type: Array, default: [] },
    activeTexts: { type: Object, default: {} },
    stickers: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Draft", draftSchema);