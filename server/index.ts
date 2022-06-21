import express from 'express';
import posts from './routes/posts';
import images from './routes/images';
import auth from './routes/auth';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();
const port = 5000;

if (process.env.NODE_ENV === 'development') {
  app.use(
    cors({
      origin: 'http://localhost:6006',
      credentials: true,
    })
  );
}

app.use('/uploads', express.static('uploads'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/posts', posts);
app.use('/auth', auth);
app.use('/images', images);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
