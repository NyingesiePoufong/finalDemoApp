const User = require('./models/user')
module.exports = function(app, passport, db) {

// normal routes ===============================================================
    var roles = ['DEV', 'UX']
    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    app.get('/members', isLoggedIn, function(req, res) {
      User.find({role: { $in: roles } }).then((employees)=>{
        res.render('members.ejs', {employees})
      }).catch(err=>{
        res.send('Error Fetching Employees')
      })
      User.find().then(rr=>{
        console.log(rr)
      })
    })
    app.delete('/members/:id', function(req, res){
      var id = req.params.id
      User.findOneAndDelete({'_id': id}).then((msg)=>{
        res.send({"mgs": "deleted"})
      })
    })

    app.get('/add-member', function(req, res) {
      res.render('add-member.ejs', {roles})
    })

    app.get('/update-member/:id', function(req, res) {
      var id = req.params.id
      User.findOne({'_id': id}).then(employee=>{
        res.render('update-member.ejs', {employee, roles: roles})
      }).catch(err=>{
        res.send("404 not Found")
      })
    })
    app.post('/update-member/:id', function(req, res){
      var id = req.params.id
      var role = req.body.role
      var firstName = req.body.firstName
      var lastName = req.body.lastName
      var team = req.body.team
      var progress = req.body.progress
      var dateJoined = req.body.dateJoined
      User.findOne({'_id': id}).then(employee=>{
        employee.role = role
        employee.name.firstName = firstName
        employee.name.lastName = lastName
        employee.team = team
        employee.progress = progress
        employee.dateJoined = Date(dateJoined)
        employee.save((err, emp)=>{
          res.redirect('/members')
        })
      })
    })

    app.post('/add-member', function(req, res) {
      console.log(req.body)
      var role = req.body.role
      var firstName = req.body.firstName
      var lastName = req.body.lastName
      var team = req.body.team
      var progress = req.body.progress
      var dateJoined = req.body.dateJoined
      let newUser = new User({
        name: {firstName, lastName},
        team,
        role,
        progress,
        dateJoined: Date(dateJoined)

      })
      newUser.save((err, user)=>{
        if(err){
          console.log(err)
        }else {
          res.redirect('/members')
        }
      })

    })

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('messages').find().toArray((err, result) => {
          if (err) return console.log(err)
          res.render('profile.ejs', {
            user : req.user,
            messages: result
          })
        })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// message board routes ===============================================================

    app.post('/messages', (req, res) => {
      db.collection('messages').save({name: req.body.name, msg: req.body.msg, thumbUp: 0, thumbDown:0}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/profile')
      })
    })

    app.put('/messages', (req, res) => {
      db.collection('messages')
      .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
        $set: {
          thumbUp:req.body.thumbUp + 1
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })

    app.delete('/messages', (req, res) => {
      db.collection('messages').findOneAndDelete({name: req.body.name, msg: req.body.msg}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login1.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/members', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));



        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
