// routes/auth.ts
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { usersCollection, registerUser } from '../database';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, password2 } = req.body;

  if (!firstName || !lastName || !email || !password || !password2) {
    return res.status(400).send('All fields are required');
  }

  if (password !== password2) {
    return res.status(400).send('Passwords do not match');
  }

  const result = await registerUser(firstName, lastName, email, password);
  if (result === 'User registered successfully') {
    return res.status(201).send(result);
  } else {
    return res.status(400).send(result);
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('All fields are required');
  }

  try {
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(400).send('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send('Invalid email or password');
    }

    req.session.user = user;
    return res.status(200).send('Login successful');
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
    res.status(200).send('Logout successful');
  });
});

export default router;