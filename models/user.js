'use strict'
const mongodb = require('./db');
const crypto = require('crypto');


class User {
    constructor(user) {
        this.name = user.name;
        this.password = user.password;
        this.email = user.email;
    }
}

function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
};

User.prototype.save = function(callback) {
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(this.email.toLowerCase()).digest('hex');

    var user = {
        name: this.name,
        password: this.password,
        email: this.email
    };

    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('users', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 插入user collection中
            collection.insert(user, {
                safe: true
            }, function(err, result) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, result["ops"][0]);
            })
        })
    });
};


User.get = function(name, callback) {
    // open db
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('users', function(err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            //查找用户
            collection.findOne({
                name: name
            }, function(err, user) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                //返回查询的结果
                callback(null, user);
            });
        });
    });
};

module.exports = User;
