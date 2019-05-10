# Passport-intro
Introduction to using passport for authentication.  My goal is to include the minimum steps to creating a website from scratch using node, express, and passport.

For more info, see:
* https://www.npmjs.com/package/express
* https://www.npmjs.com/package/express-generate
* http://www.passportjs.org/docs/google/


# First steps
## Setup
Do the following command-line steps to set up a project in the folder "ab" (which I'll use repeatedly throughout, but you can of course call it anything).  This will set up the basic node project & the express web server:
```
mkdir ab
cd ab
npm init
npm install express-generator
./node_modules/.bin/express
npm install
```

## Test these steps
Run "npm start" to start your web server.
Navigate with a browser to "localhost:3000".  You should see an Express welcome message.

## Source control
Go to github.
Create a new repository.  Enter the repository name, select private (or public if you want), and add .gitignore for Node.

```
git clone https://github.com/your-git-name/passport-intro.git temp
mv ./temp/.git .
mv ./temp/.gitignore ./.gitignore
git add .
git commit -m "my first steps"
git push
```

# Add Authentication

## Setup google authentication

1. https://console.developers.google.com/
1. New project, set project name
   * because this is a local development test, I use *ab-local*
1. After it's created, go to Getting Started > Enable APIs and Services
1. Enable *Google+ API*
1. In the overview tab, click *Create credentials*
   1. Which API are you using?  *Google+ API*
   1. Where will you be calling the API from?  *Web server*
   1. What data will you be accessing?  *User data*
1. Set up OAuth consent screen
   1. Enter Application name, Application logo, Support email
   1. Add scopes for openid & email
   1. Authorized domains (for local development *my-company-name.com*)
   1. Application Homepage link (e.g. *http://ab-local.my-company-name.com*)
   1. Application Privacy Policy link (e.g. *http://ab-local.my-company-name.com/privacy-policy*)
1. Create Credentials
   1. *OAuth Client Id*
   1. Application Type = *Web application*
   1. Name = *AB Local Test*
   1. Restrictions: Authorized redirect URIs = *http://ab-local.my-company-name.com:3000/auth/google/callback*
   1. Click *Create*
   1. Copy the client ID & client secret

## Enter local DNS overrides for local dev testing

Any 3rd party authenticator will want to redirect your browser to only a safe known site, so after we authenticate we override the callback redirect to our localhost.

1. start the nano editor for your /etc/hosts file:
```
sudo nano /etc/hosts
```
2. add the line "127.0.0.1    ab-local.my-company-name.com"
3. exit nano with *Ctrl-X*, *Yes*, *Enter*

## Add code to authenticate
1. Install the passport and session handling modules:
```
npm install passport passport-google-oauth express-session
```
2. add the following code to the top of the app.js:
```
    const session = require('express-session');
    const passport = require('passport');
    const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
    const googleKeys = require('./google-keys-do-not-commit');
```
3. add the following code after "app.use(express.static..." to handle maintaining sessions after login, initialize passport, and handle serializing and deserializing the user in a basic-in-memory repository ("repo")
```
    app.use(session({ secret: 'a-session-secret-string' }));
    app.use(passport.initialize());
    app.use(passport.session());
    
    const repo = {};
    passport.serializeUser((user, done) => done(null, user.googleId));
    passport.deserializeUser((id, done) => done(null, repo[id]));
```
4. add the following code immediately after that to hook up the google oauth2 strategy, including the initial redirect to google's login page and the callback address that google will use after handling the user's login:
```
    passport.use(new GoogleStrategy({
      clientID: googleKeys.clientId,
      clientSecret: googleKeys.clientSecret,
      callbackURL: "http://ab-local.my-company-name.com:3000/auth/google/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      const user = { googleId: profile.id, Name: profile.displayName };
      repo[user.googleId] = user;
      done(null, user);
    }));
    
    app.get('/auth/google', passport.authenticate('google',
      { scope: ['https://www.googleapis.com/auth/plus.login'] }));

    app.get('/auth/google/callback', 
      passport.authenticate('google', { failureRedirect: '/login' }),
      (req, res) => res.redirect('/'));
```
5. Note in step 2 there's a referenced file called *google-keys-do-not-commit.js*.  You'll need to create this with your clientId & clientSecret from google (I haven't included it in my repo).  It looks like:
```
module.exports = {
  clientId: *my-client-id*,
  clientSecret: *my-client-secret*,
};
```
   * You'll also need to update your .gitignore to include this file (unless you have a private repo that will _always_ stay private)
   ```
   google-keys-do-not-commit.js
   ```

## Testing authentication

1. Update the routes/index.js home page handler to pass in the user
```
    /* GET home page. */
    router.get('/', function(req, res, next) {
      const user = req.user || { Name: 'Unknown User' };
      res.render('index', { user, title: 'Express' });
    });
```
2. Update the views/index.jade home page to display the current user and provide a login with google link
```
    p Welcome to #{title}, #{user.Name}
    a(href='/auth/google') Sign In with Google
```
3. Start your server using *npm start*, then open the browser again and this time navigate to *http://ab-local.my-company-name.com:3000*.  You should initially see the welcome message to "Unknown User", and after you login using google it should change to your user name.
