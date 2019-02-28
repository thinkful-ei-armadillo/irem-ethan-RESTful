'use strict';
const getAllBookmarks = function (db) {

  return db.select('*').from('bookmarks').orderBy('id');
};

const getBookmark = function (db, id) {

  return db.select('*').from('bookmarks').where('id', id).orderBy('id');
};

const createBookmark = function (db, data) {

  return db('bookmarks').insert(data).returning('id');
};

const updateBookmark = function (db, id, data) {

  return db('bookmarks').update(data).where({ id });
};

const deleteBookmark = function (db, id) {

  return db('bookmarks').del().where('id', id);
};

module.exports = {
  getAllBookmarks,
  getBookmark,
  createBookmark,
  updateBookmark,
  deleteBookmark,
};
