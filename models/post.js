var mongodb = require('./db');
var markdown = require('markdown').markdown;
// model-Post
function Post(name, title, post) {
    this.name = name;
    this.title = title;
    this.post = post;
}
Post.prototype.save = function(callback) {
    var date = new Date();
    // 时间
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: +date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }

    //Post
    var post = {
        name: this.name,
        title: this.title,
        post: this.post,
        time: time.day,
        comments:[]
    }

    //打开数据库
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                return callback(err);
            }
            //插入post内容
            collection.insert(post, {
                safe: true
            }, function(err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            })
        })
    });
}
Post.getAll = function(name, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //查询对象
            var query = {};
            if (name) {
                query.name = name;
            }
            collection.find(query).sort({
                time: -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                docs.forEach(function(doc) {
                        doc.post = markdown.toHTML(doc.post);
                    })
                    //返回数组的查询结果
                callback(null, docs);
            })
        })
    })
}


//获取单独一片文章
Post.getOne = function(name, day, title, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                name: name,
                title: title,
                time: day
            }, function(err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                if(doc){
                    doc.post = markdown.toHTML(doc.post);
                    // doc.comments.forEach(function(comment){
                    //     comment.content = markdown.toHTML(comment.content);
                    // })
                    doc.comments.forEach(comment => {
                        comment.content = markdown.toHTML(comment.content);
                    })
                }

                callback(null, doc); //返回查询的一篇文章
            })
        })
    })
}
Post.edit = function(name, day, title, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                name: name,
                time: day,
                title: title
            }, function(err, doc) {
                if (err) {
                    return callback(err);
                }
                callback(null, doc);
            })
        })
    })
}
Post.update = function(name, day, title, post, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                return callback(err);
            }
            collection.update({
                name: name,
                time: day,
                title: title
            }, {
                $set: {
                    post: post
                }
            }, function(err, post) {
                console.log(post)
                    //更新一次后需要关闭mongodb
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);

            })
        })
    })
}

Post.remove = function(name, day, title, post, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            callback(err);
        }
        db.collection("posts", function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.remove({
                name: name,
                time: day,
                title: title
            }, {
                w: 1
            }, function(err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}



module.exports = Post;
