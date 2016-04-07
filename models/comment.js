'use strict';
const mongodb = require('./db');

class Comment {
    constructor(name, day, title) {
        this.name = name;
        this.day = day;
        this.title = title;
    }

    save(callback) {
        var name = this.name,
            day = this.day,
            title = this.title;
        mongodb.open((err, db) => {
            if (err) {
                return callback(err);
            }
            db.collection('posts', (name, day, title) => {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                collection.update({
                    name: name,
                    title: title,
                    time: day
                }, {
                    $push: {
                        comments: comment
                    }
                }, (err) => {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    callback(null);
                })

            })
        })
    }

}

module.exports = Comment;
