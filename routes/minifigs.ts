// routes/minifigs.ts
import { Router, Request, Response } from 'express';
import { minifigsCollection, usersCollection } from '../database';

const router = Router();

// Fetch a specified number of random minifigs
router.get('/fetch', async (req: Request, res: Response) => {
  const { amount } = req.query;
  try {
    const minifigs = await minifigsCollection.aggregate([{ $sample: { size: parseInt(amount as string, 10) } }]).toArray();
    res.json(minifigs);
  } catch (error) {
    console.error('Error fetching minifigs:', error);
    res.status(500).send('Server error');
  }
});

// Update the user's collection with sorted minifigs
router.post('/updateCollection', async (req: Request, res: Response) => {
  const { userId, minifigId, setName, isCorrect } = req.body;
  try {
    if (isCorrect) {
      await usersCollection.updateOne(
        { _id: userId },
        { $addToSet: { collection: { minifigId, setName } } }
      );
    }
    res.status(200).send('Updated collection');
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).send('Server error');
  }
});

export default router;