'use strict';
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/user.js');
const md5 = crypto.createHash('md5');
const Post = require('../models/post.js');
const Comment = require('../models/comment.js');
const multer = require('multer');
const fs = require('fs');

const upload = multer({
    dest: './public/images',
})
module.exports = function(app) {
    app.get('/', function(req, res) {
        Post.getAll(null, function(err, posts) {
            if (err) {
                posts = [];
            }
            res.render('index', {
                title: '主页',
                user: req.session.user,
                posts: posts,
                success: req.flash("success").toString(),
                error: req.flash("error").toString()
            });
        })

    });

    app.get('/reg', function(req, res) {
        res.render('reg', {
            title: '注册',
            user: req.session.user,
            success: req.flash("success").toString(),
            error: req.flash("error").toString()
        });
    });
    //注册
    app.post('/reg', function(req, res, next) {
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body["password-repeat"],
            email = req.body.email;
        if (password != password_re) {
            req.flash("error", "两次输入的密码不一致");
            return res.redirect("/reg");
        }
        //生成密码md5值加密
        var newUser = new User({
            name: name,
            password: crypto.createHash('md5').update(req.body.password).digest("hex"),
            email: email
        });

        //检测用户是否存在
        User.get(name, function(err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            if (user) {
                req.flash('error', '用户已经存在');
                return res.redirect('/reg');
            }
            //新增用户
            newUser.save(function(err, user) {
                if (err) {
                    req.flash('error', err);
                    req.redirect('/reg');
                }
                req.session.user = newUser;
                req.flash("success", "报名成功");
                res.redirect("/");
            })
        })
    });

    // 登录
    app.get('/login', function(req, res) {
        res.render('login', {
            title: '登录',
            user: req.session.user,
            success: req.flash("success").toString(),
            error: req.flash("error").toString()
        });
    });
    app.post('/login', function(req, res) {
        //先检测用户是否存在
        User.get(req.body.name, function(err, user) {
            if (err) {
                req.flash("error", err);
                return res.redirect('/');
            }
            if (!user) {
                req.flash('error', '密码错误');
                return res.redirect('/login');
            }
            // 加密输入的密码
            var password = md5.update(req.body.password).digest('hex');
            if (user.password != password) {
                req.flash('error', '密码错误');
                return res.redirect('/login');
            }
            // 匹配成功后存入session
            req.session.user = user;
            req.flash('success', '登陆成功');
            return res.redirect('/');
        })
    });
    //登出
    app.get('/logout', function(req, res) {
        req.session.user = null;
        req.flash('success', '登出成功');
        res.redirect('/')
    });
    // 发表文章
    app.get('/post', function(req, res) {

        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash("success").toString(),
            error: req.flash("error").toString()
        });
        //res.json(req.session.user);
    });
    app.post('/post', checkLogin);
    app.post('/post', function(req, res) {
        var currentUser = req.session.user;
        var post = new Post(currentUser.name, req.body.title, req.body.post);
        post.save(function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect("/");
            }
            //发布成功调到主页
            req.flash("发布成功");
            res.redirect("/");
        })
    })

    app.get('/upload', function(req, res) {
        res.render('upload', {
            title: '上传',
            user: req.session.user,
            success: req.flash("success").toString(),
            error: req.flash("error").toString()
        })
    })

    app.post('/upload', checkLogin);
    app.post('/upload', upload.fields(
        [{
            name: "file1"
        }, {
            name: "file2"
        }, {
            name: "file3"
        }, {
            name: "file4"
        }, {
            name: "file5"
        }]
    ), function(req, res) {
        for (var i in req.files) {
            console.log(req.files[i])
        }
        req.flash('success', "上传成功");
        res.redirect('/upload');
    });

    app.get('/u/:name', function(req, res) {
        User.get(req.params.name, function(err, user) {
            if (!user) {
                req.flash("error", err);
                return res.redirect("/");
            }
            Post.getAll(user.name, function(err, post) {
                if (err) {
                    req.flash("error", err);
                }
                res.render('user', {
                    title: user.name,
                    post: post,
                    user: req.session.user,
                    success: req.flash("success").toString(),
                    error: req.flash("error").toString()
                })
            })
        })
    });
    // 获取单个文章的
    app.get('/u/:name/:day/:title', function(req, res) {
            Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post) {
                if (err) {
                    req.flash("error", err);
                    return res.redirect('/');
                }
                res.render('article', {
                    title: post.title,
                    post: post,
                    user: req.session.user,
                    success: req.flash("success").toString(),
                    error: req.flash("error").toString()
                })
            })
        })
        //编辑文章
    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', function(req, res) {
            Post.edit(req.params.name, req.params.day, req.params.title, function(err, post) {
                if (err) {
                    req.flash("error", err);
                    return res.redirect('back');
                }
                res.render("edit", {
                    title: post.title,
                    user: req.session.user,
                    post: post,
                    success: req.flash("success").toString(),
                    error: req.flash("error").toString()
                })
            })
        })
        //编辑
    app.post('/edit/:name/:day/:title', checkLogin);
    app.post('/edit/:name/:day/:title', function(req, res) {
        var userName = req.session.user.name;
        var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
        Post.update(userName, req.params.day, req.params.title, req.body.post, function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect(url);
            }
            req.flash("success", "修改成功");
            res.redirect(url);
        })
    })

    //删除
    app.get('/remove/:name/:day/:title', checkLogin);
    app.get('/remove/:name/:day/:title', function(req, res) {
        Post.remove(req.session.user.name, req.params, req.params.day, req.params.title, function(err) {
            if(err){
                req.flash("error",err);
                res.redirect('back');
            }
            req.flash("success","删除成功");
            res.redirect('/');
        })
    })


    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', "没有登录");
            res.redirect("/login");
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', "已经登录");
            res.redirect('back');
        }
        next();
    }
};
