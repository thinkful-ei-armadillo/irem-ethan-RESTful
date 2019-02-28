/* global supertest */
'use strict';

const knex = require('knex');
const xss  = require('xss');
const app = require('../src/app');
const SETTINGS = require('../src/config');

const db = knex({
  client: 'pg',
  connection: SETTINGS.TEST_DB_URL,
});

app.set('db', db);

after('disconnect from DB', () => {
  db.destroy();
});

describe('GET /bookmarks', () => {

  const seedData = [
    { id: 1, title: 'Alpha', url: 'http://example.com', description: 'a description', rating: 1 },
    { id: 2, title: 'Bravo', url: 'http://example.com', description: 'a description', rating: 2 },
    { id: 3, title: 'Charlie', url: 'http://example.com', description: 'a description', rating: 3 },
    { id: 4, title: 'Delta', url: 'http://example.com', description: 'a description', rating: 4 },
    { id: 5, title: 'Echo', url: 'http://example.com', description: 'a description', rating: 5 },
  ];

  beforeEach('empty,populate table', () => {
    return db('bookmarks').truncate().then(() => {
      return db('bookmarks').insert(seedData);
    });
  });

  afterEach('empty table', () => {
    return db('bookmarks').truncate();
  });

  it('Should return expected data', () => {

    return supertest(app)
      .get('/bookmarks')
      .set('Authorization', `Bearer ${process.env.API_KEY}`)
      .expect(200)
      .expect('Content-Type', /json/)
      .then((resp) => {

        expect(resp.body).to.deep.equal(seedData);
      });
  });
});

describe('POST /bookmarks', () => {

  beforeEach('empty table', () => {
    return db('bookmarks').truncate();
  });

  afterEach('empty', () => {
    return db('bookmarks').truncate();
  });

  it('Create a new bookmark', () => {

    const newItem = {
      id: 1,
      title: 'New Bookmark',
      url: 'http://example.com',
      description: 'A new bookmark',
      rating: 5,
    };

    return db('bookmarks').insert(newItem).returning('id').then((result) => {

      expect(result[0]).to.equal(1);

      return db.select('*').from('bookmarks').where('id', 1).then((r) => {

        expect(r[0]).to.deep.equal(newItem);
      });
    });
  });
});

describe('GET /bookmarks/:id', () => {
  const seedData = [{
    id: 1,
    title: 'Alpha',
    url: 'http://example.com',
    description: 'a description',
    rating: 1
  },
  {
    id: 2,
    title: 'Bravo',
    url: 'http://example.com',
    description: 'a description',
    rating: 2
  },
  {
    id: 3,
    title: 'Charlie',
    url: 'http://example.com',
    description: 'a description',
    rating: 3
  },
  {
    id: 4,
    title: 'Delta',
    url: 'http://example.com',
    description: 'a description',
    rating: 4
  },
  {
    id: 5,
    title: 'Echo',
    url: 'http://example.com',
    description: 'a description',
    rating: 5
  },
  ];
  beforeEach('empty,populate table', () => {
    return db('bookmarks').truncate().then(() => {
      return db('bookmarks').insert(seedData);
    });
  });

  afterEach('empty', () => {
    return db('bookmarks').truncate();
  });

  it('gets a bookmark by id', () => {
    return supertest(app)
      .get('/bookmarks/4')
      .set('Authorization', `Bearer ${process.env.API_KEY}`)
      .expect(200)
      .expect('Content-Type', /json/)
      .then((resp) => {
        expect(resp.body[0]).to.deep.equal(seedData[3]);
      });
  });
});

describe('DELETE /bookmarks/:id', () => {

  const seedData = [{
    id: 1,
    title: 'Alpha',
    url: 'http://example.com',
    description: 'a description',
    rating: 1
  },
  {
    id: 2,
    title: 'Bravo',
    url: 'http://example.com',
    description: 'a description',
    rating: 2
  },
  {
    id: 3,
    title: 'Charlie',
    url: 'http://example.com',
    description: 'a description',
    rating: 3
  },
  {
    id: 4,
    title: 'Delta',
    url: 'http://example.com',
    description: 'a description',
    rating: 4
  },
  {
    id: 5,
    title: 'Echo',
    url: 'http://example.com',
    description: 'a description',
    rating: 5
  },
  ];
  beforeEach('empty,populate table', () => {
    return db('bookmarks').truncate().then(() => {
      return db('bookmarks').insert(seedData);
    });
  });

  afterEach('empty', () => {
    return db('bookmarks').truncate();
  });

  it('deletes an item by its id', () => {
    it('gets a bookmark by id', () => {
      return supertest(app)
        .delete('/bookmarks/4')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(200)
        .then((resp) => {
          expect(resp.body).to.be.deep.equal([]);
        });
    });
  });
});

describe('XSS', () => {

  const maliciousBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: 'https://url.to.file.which/does-not.exist',
    description: 'bad!',
    rating: 1,
  };

  before('add malicious item', () => {

    return db('bookmarks').insert(maliciousBookmark);
  });

  after('empty table', () => {

    return db('bookmarks').truncate();
  });


  it('GET /bookmarks should sanitize response', () => {

    return supertest(app)
      .get('/bookmarks')
      .set('Authorization', `Bearer ${process.env.API_KEY}`)
      .expect(200)
      .expect('Content-Type', /json/)
      .then((resp) => {

        expect(resp.body[0].title).to.equal(xss(maliciousBookmark.title));
        expect(resp.body[0].description).to.equal(xss(maliciousBookmark.description));
      });
  });

  it('GET /bookmarks/:id should sanitize response', () => {

    return supertest(app)
      .get(`/bookmarks/${maliciousBookmark.id}`)
      .set('Authorization', `Bearer ${process.env.API_KEY}`)
      .expect(200)
      .expect('Content-Type', /json/)
      .then((resp) => {

        expect(resp.body[0].title).to.equal(xss(maliciousBookmark.title));
        expect(resp.body[0].description).to.equal(xss(maliciousBookmark.description));
      });
  });
});
