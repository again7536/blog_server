import express from 'express';
import posts from './routes/posts';
import auth from './routes/auth';
import cookieParser from 'cookie-parser';

const app = express();
const port = 5000;

app.use(express.static('uploads'));
app.use(cookieParser());

app.use('/posts', posts);
app.use('/auth', auth);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
