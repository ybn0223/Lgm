// routes/auth.ts
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
  const { username, password, password2 } = req.body;

  if (password !== password2) {
    return res.status(400).send('Passwords do not match');
  }

  try {
    const result = await registerUser(username, password);
    if (result !== 'User registered successfully') {
      return res.status(400).send(result);
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
      return res.status(400).send('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send('Invalid credentials');
    }

    req.session.user = user;
    return res.redirect('/');
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).send('Server error');
  }
});

router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Server error');
    }
    res.redirect('/');
  });
});

export default router;