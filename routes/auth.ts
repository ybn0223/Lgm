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
  const { email, username, password, password2 } = req.body;

  let wrongCredentials : boolean = false;
  let userExists : boolean = true;
  
  if (password !== password2) {
    return res.status(400).send('Passwords do not match');
  }

  try {
    const result = await registerUser(email ,username, password);
    if (result !== 'User registered successfully') {
      let user : boolean = false;
      res.render("index", {
        wrongCredentials, user, userExists
    })
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
  
  let wrongCredentials : boolean = true;
  let userExists : boolean = false;

  try {
    const user = await usersCollection.findOne({ username });
    if (!user) {
      
      res.render("index", {
          wrongCredentials, user, userExists
      })
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      let wrongCredentials : boolean = true;
      let user : boolean = false;
      res.render("index", {
          wrongCredentials, user, userExists
      })
      return;
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

// Route to change password
router.post('/change-password', async (req: Request, res: Response) => {
  try {
      const { currentPassword, newPassword, confirmNewPassword } = req.body;

      // Validate that new passwords match
      if (newPassword !== confirmNewPassword) {
          return res.status(400).json({ error: 'New passwords do not match' });
      }

      if (!req.session.user) {
          return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get the user from the session
      const userId = req.session.user._id;
      const user = await usersCollection.findOne({ _id: userId });

      // Check if the user exists
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
          return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user's password
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