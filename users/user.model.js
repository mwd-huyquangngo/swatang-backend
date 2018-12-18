const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    username: { type: String, unique: true, required: true },
    hash: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String },
    bio: { type: String },
    company: { type: String },
    location: { type: String },
    status: { type: String, default: 'active' },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', schema);