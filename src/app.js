'use strict';

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const uuid = require('uuid/v4');
const { NODE_ENV } = require('./config');
// const { bookmarks } = require('./store');
const bookmarks = require('./bookmarks-service');
const xss = require('xss');

const app = express();
const router = express.Router();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'dev';

// app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

function sanitize (bookmark) {
  return {
    id          : bookmark.id,
    title       : xss(bookmark.title),
    description : xss(bookmark.description),
    url         : xss(bookmark.url),
    rating      : bookmark.rating,
  };
}

app.use(function handleToken(req, res, next) {

  let authToken;
  if (req.get('Authorization')) {
    authToken = req.get('Authorization').split(' ')[1];
  }

  let apiKey = process.env.API_KEY;

  if(authToken !== apiKey) {
    return res.status(401).send('Unauthorized');
  }

  next();
});

// default 404 route handler
// app.use((req, res) => {
//   res.status(404).json({
//     message: 'Endpoint not found'
//   });
// });


app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

app.use(express.json());
app.use('/api', router);

router.route('/bookmarks')
  .get((req, res) => {

    const db = req.app.get('db');

    return bookmarks
      .getAllBookmarks(db)
      .then((data => {
        res.json(data.map(sanitize));
      }));
  })
  .post((req, res) => {
    const { title, url, description, rating } = req.body;

    const bookmark = {
      title,
      url,
      description,
      rating
    };

    const db = req.app.get('db');

    bookmarks.createBookmark(db, bookmark).then(resjson => {
      res.status(204).location(`http://localhost:8000/bookmarks/${resjson[0]}`).end();
    });
  });

router.route('/bookmarks/:id')
  .get((req, res) => {
    const db = req.app.get('db');

    return bookmarks.getBookmark(db, req.params.id).then(resjson => {
      if (resjson.length > 0) {
        res.json(resjson.map(sanitize));
      }
      else{
        res.status(404).end();
      }
    });

  })
  .delete((req, res) => {
    const db = req.app.get('db');

    return bookmarks.deleteBookmark(db, req.params.id).then(resjson => {
      if (resjson === 1) {
        res.status(204).end();
      } else {
        res.status(404).end();
      }
    });
  })
  .patch((req, res) =>{
    const db = req.app.get('db');

    if (Object.keys(req.body).length === 0) {
      return res.status(400).end();
    }

    return bookmarks.updateBookmark(db,req.params.id, req.body).then(resJson => {
      res.status(204).end();
    });
  });

module.exports = app;
