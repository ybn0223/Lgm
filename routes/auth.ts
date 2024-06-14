import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { usersCollection, registerUser } from '../database';

declare module 'express-session' {
  export interface SessionData {
    user: { [key: string]: any };
  }
}

const router = Router();

router.post('/register', async (req, res) => {
  const { email, username, password, password2 } = req.body;

  let wrongCredentials: boolean = false;
  let userExists: boolean = true;

  if (password !== password2) {
    return res.status(400).send('Passwords do not match');
  }

  try {
    const result = await registerUser(email, username, password);
    if (result !== 'User registered successfully') {
      res.render("index", {
        wrongCredentials,
        user: false,
        userExists,
        emailNotFound: false
      });
      return;
    }

    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(400).send('User was not found');
    }

    req.session.user = user;
    return res.redirect('/');
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).send('Server error');
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await usersCollection.findOne({ username });
    if (!user) {
      res.render("index", {
        wrongCredentials: true,
        user: false,
        userExists: false,
        emailNotFound: true
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.render("index", {
        wrongCredentials: true,
        user: false,
        userExists: false,
        emailNotFound: false
      });
      return;
    }

    req.session.user = user;
    return res.redirect('/');
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).send('Server error');
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Server error');
    }
    res.redirect('/');
  });
});

router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.session.user._id;
    const user = await usersCollection.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await usersCollection.updateOne(
      { _id: userId },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;