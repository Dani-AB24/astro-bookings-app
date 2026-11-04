import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { loadAllData } from './utils/data-loader';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import activitiesRouter from './routes/activities';
import bookingsRouter from './routes/bookings';

// Load all data on startup
loadAllData();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'ActivityBookings API' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/users', usersRouter);
app.use('/login', authRouter);
app.use('/activities', activitiesRouter);
app.use('/bookings', bookingsRouter);

app.listen(PORT, () => {
  logger.info('Server', `Running on port ${PORT}`);
});

export default app;
