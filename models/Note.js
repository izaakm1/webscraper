const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const NoteSchema = new Schema({
    note: {
        type: String,
        require: true
    }
});

const Note = mongoose.model('Note', NoteSchema);

module.exports = Note;