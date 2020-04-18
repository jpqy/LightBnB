const db = require('./db');
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return db.query(`
  SELECT * FROM users
  WHERE email=$1::text
  LIMIT 1;
  `, [email])
    .then(res => {
      if (res.rows.length === 0) return null;
      return res.rows[0];
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return db.query(`
  SELECT * FROM users
  WHERE id=$1::integer
  LIMIT 1;
  `, [id])
    .then(res => {
      if (res.rows.length === 0) return null;
      return res.rows[0];
    });
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  return db.query(`
  INSERT INTO users
  (name, email, password)
  VALUES
  ($1::text, $2::text, $3::text)
  RETURNING *;
  `, [user.name, user.email, user.password])
    .then(res => {
      return res.rows[0];
    })
    .catch(error => {
      console.log(error);
    });
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return db.query(`
  SELECT properties.*, reservations.*, avg(rating) AS average_rating
  FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1::integer
    AND end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2::integer;
  `, [guest_id, limit])
    .then(res => {
      return res.rows;
    })
    .catch(error => {
      console.log(error);
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  const queryParams = [];

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  LEFT JOIN property_reviews ON properties.id = property_id
  `;

  // Only add 'WHERE' clause if options has some values
  if (Object.values(options).join('')) {
    queryString += ` WHERE `;
  }

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `city LIKE $${queryParams.length} AND `;
  }

  if (options.owner_id) {
    queryParams.push(Number(options.owner_id));
    queryString += `properties.owner_id = $${queryParams.length} AND `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night));
    queryString += `cost_per_night >= $${queryParams.length} AND `;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(Number(options.maximum_price_per_night));
    queryString += `cost_per_night <= $${queryParams.length} AND `;
  }

  // Get rid of last 'AND' if it exists
  if (queryString.endsWith(' AND ')) {
    queryString = queryString.slice(0, -5);
  }

  queryString += `
  GROUP BY properties.id
  `;

  // HAVING
  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length}
    `;
  }
  // ORDER, LIMIT
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  return db.query(queryString, queryParams)
    .then(res => {
      return res.rows;
    })
    .catch(error => {
      console.log(error);
    });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const queryParams = [
    Number(property.owner_id),
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    Number(property.cost_per_night),
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    Number(property.parking_spaces),
    Number(property.number_of_bathrooms),
    Number(property.number_of_bedrooms)
  ];

  const queryString = `
  INSERT INTO properties (
  owner_id,
  title,
  description,
  thumbnail_photo_url,
  cover_photo_url,
  cost_per_night,
  street,
  city,
  province,
  post_code,
  country,
  parking_spaces,
  number_of_bathrooms,
  number_of_bedrooms
  )
  VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;
  `;

  return db.query(queryString, queryParams)
    .then(res => res.rows[0])
    .catch(error => {
      console.log(error);
    });
};
exports.addProperty = addProperty;

/**
 * Add a reservation to the database
 * @param {{start_date: Number, end_date: Number, property_id: Number, guest_id: Number}} reservation
 * @return {Promise<{}>} A promise to add the reservation
 */
const addReservation = function(reservation) {
  const queryParams = [
    reservation.start_date,
    reservation.end_date,
    reservation.property_id,
    reservation.guest_id
  ];

  const queryString = `
    INSERT INTO reservations
      (start_date , end_date , property_id , guest_id )
    VALUES
      ($1, $2, $3, $4)
    RETURNING *;
  `;

  return db.query(queryString, queryParams)
    .then(res => res.rows[0])
    .catch(error => {
      console.log(error);
    });
};
exports.addReservation = addReservation;