import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authMiddleware } from './middleware/auth';
import { prisma } from './lib/prisma';

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.get('/', (req, res) => {
  res.send('API is running');
});

// Protected route
app.get('/api/cv/me', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    // Find or create an empty profile for the user
    let profile = await prisma.cvProfile.findUnique({
      where: { userId },
      include: {
        experiences: true,
        education: true,
        skills: true,
        languages: true,
      }
    });

    if (!profile) {
      profile = await prisma.cvProfile.create({
        data: { userId },
        include: {
          experiences: true,
          education: true,
          skills: true,
          languages: true,
        }
      });
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// Global Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
