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

  const result = await registerUser(username, password);
  if (!(result === 'User registered successfully')) {
      return res.status(400).send(result);
  }
    const user = await usersCollection.findOne({username});
    if (!user) {
      return res.status(400).send('user was not found');
    }
    req.session.user = user;
    return res.redirect('/');
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  let userExists : boolean = true;

  if (!email || !password) {
    return res.status(400).send('All fields are required');
  }

  try {
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!user || !isMatch) {
      return res.redirect('/');
    }

    req.session.user = user;
    res.render('/', {userExists});
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).send('Server error');
  }
});

router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Server error');
    }
    res.redirect('/');
  });
});

export default router;