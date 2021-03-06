const idbApp = (function() {
  'use strict';
  if(!navigator.serviceWorker) {
    console.log('Exited idbApp due to no service worker installed.');
    return Promise.resolve();
  }
  const dbPromise = idb.open('restaurantreviews', 2, function(upgradeDb) {
    switch (upgradeDb.oldVersion) {
      case 0:
        upgradeDb.createObjectStore('restaurants')
        upgradeDb.createObjectStore('reviews', {keyPath: 'id'})
        upgradeDb.createObjectStore('offline',
        { keyPath: 'id' });
    }
  });
  function addRestaurantById(restaurant) {
    dbPromise.then(function(db) {
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');
      return store.put(restaurant);
    }).catch(function(e) {
      tx.abort();
      console.log("Unable to add restaurant to IndexedDB", e);
    });
  }

  function fetchRestaurantById(id) {
    return dbPromise.then(function(db) {
      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');
      return store.get(parseInt(id));
    }).then(function(restaurantObject) {
      return restaurantObject;
    }).catch(function(e) {
      console.log("idbApp.fetchRestaurantById errored out:", e);
    });
  }

  function fetchAllReviewsByRestaurantId(id) {
    return dbPromise.then((db) => {
      const tx = db.transaction('reviews');
      const store = tx.objectStore('reviews');
      return store.getAll();
    }).then((reviews) => {
      let r;
      reviews.forEach(review => {
        // console.log(review)
        if(review.id == id) {
          r = review.reviews
        }
      }
      )
      return r
    }
    
    ).catch(err => console.log(err))
  }

  function addReviewByRestaurant(id, reviews) {
    dbPromise.then(function(db) {
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');
      store.put({id, reviews});
    }).catch(function(e) {
      tx.abort();
      console.log("Unable to add review to IndexedDB", e);
    });
  }

// add review offline
  function addReviewOffline(id, reviews) {
    dbPromise.then(function(db) {
      const tx = db.transaction('offline', 'readwrite');
      const store = tx.objectStore('offline');
      store.put({id, reviews});
    }).catch(function(e) {
      tx.abort();
      console.log("Unable to add review to offline db", e);
    });
  }

// get offlineReviews
  function fetchAllOfflineReviews() {
    return dbPromise.then(function(db) {
      const tx = db.transaction('offline');
      const store = tx.objectStore('offline');
      return store.getAll();
    }).then(function(reviews) {
      return reviews;
    }).catch(function(e) {
      console.log("idbApp.fetchAllOfflineReviews errored out:", e);
    });
  }

// add review to reviews db (online)

// delete from offline
function deleteOfflineReview(id) {
  return dbPromise.then(function(db) {
    const tx = db.transaction('offline', 'readwrite');
    tx.objectStore('offline').get(id).then(review => {
      return tx.objectStore("offline").delete(id);
    });
    tx.complete.then(() => console.log('done'));
  })
}

  return {
    dbPromise: (dbPromise),
    addRestaurantById: (addRestaurantById),
    fetchRestaurantById: (fetchRestaurantById),
    fetchAllReviewsByRestaurantId: (fetchAllReviewsByRestaurantId),
    addReviewByRestaurant: (addReviewByRestaurant),
    addReviewOffline: (addReviewOffline),
    fetchAllOfflineReviews: (fetchAllOfflineReviews),
    deleteOfflineReview: (deleteOfflineReview)
  };
})();



const idbKeyVal = {
  get(key) {
    return dbPromise.then(db => {
      return db
        .transaction('restaurants')
        .objectStore('restaurants')
        .get(key);
    });
  },
  set(key, val) {
    return dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      tx.objectStore('restaurants').put(val, key);
      return tx.complete;
    });
  }
};

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get BASE_URL() {
    const port = 1337;
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL)
    .then(response => response.json())
    .then(function(jsonResponse) {
      callback(null, jsonResponse);
    })
    .catch(function(error) {
      const errorMessage = (`Request failed. Returned status of ${error}`);
      callback(errorMessage, null);
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    const idbRestaurant = idbApp.fetchRestaurantById(id);
    idbRestaurant.then(function(idbRestaurantObject) {
      if (idbRestaurantObject) {
        callback(null, idbRestaurantObject);
        return;
      }
      else {
        DBHelper.fetchRestaurants((error, restaurants) => {
          if (error) {
            callback(error, null);
          } else {
            const restaurant = restaurants.find(r => r.id == id);
            if (restaurant) {
              idbApp.addRestaurantById(restaurant); // add restaurant to DB
              callback(null, restaurant);
            } else {
              callback('Restaurant not found', null);
            }
          }
        });
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

  /**
   * Like a restaurant
   */
  static like(id) {
    fetch(`${DBHelper.DATABASE_URL}/${id}/?is_favorite=true`, {
      method: 'PUT'
    });
  }

  /**
   * Unlike a restaurant
   */
  static unlike(id) {
    fetch(`${DBHelper.DATABASE_URL}/${id}/?is_favorite=false`, {
      method: "PUT"
    });
  }

  /**
   * Fetch reviews by ID
   */
  static fetchRestaurantReviewsById(id, callback) {
    if(!navigator.onLine) {
      idbApp.fetchAllReviewsByRestaurantId(id).then((reviews) => {
        return callback(null, reviews)
      })
    } else {
      fetch(DBHelper.BASE_URL + `/reviews/?restaurant_id=${id}`)
        .then(response => {
          if(response) {
            // response.json().then((body) => {console.log(body)}).catch(err => console.log(err))
            // // console.log(response.json())
            // // idbApp.addReviewByRestaurant(response);
            return response.json()
              .then(body => {
                idbApp.addReviewByRestaurant(id, body);
                return body;
              })
          }
          
        })
        .then(data => callback(null, data))
        .catch(err => callback(err, null));
    }
  }

  static createRestaurantReview(id, name, rating, comments, callback) {
    const data = {
      'restaurant_id': id,
      'name': name,
      'rating': rating,
      'comments': comments
    };
    console.log(data)
    fetch(`${DBHelper.BASE_URL}/reviews`, {
      headers: { 'Content-Type': 'application/form-data' },
      method: 'POST',
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(data => callback(null, data))
      .catch(err => callback(err, null));
  }

  static createOfflineReview(id, name, rating, comments, callback) {
    const now = Date.now();
    const data = {
      'restaurant_id': id,
      'name': name,
      'rating': rating,
      'comments': comments,
      'timeId': now
    };
    console.log(data)
    idbApp.addReviewOffline(now, data);
  }

  static fetchAllReviewsByRestaurantId(restaurantId) {
    idbApp.fetchAllReviewsByRestaurantId(restaurantId);
  }

  static fetchAllOfflineReviews() {
    return idbApp.fetchAllOfflineReviews();
  }

  static deleteOfflineReview(id) {
    return idbApp.deleteOfflineReview(id);
  }

  static test() {
    console.log("TEST")
    // idbApp.addReviewOffline({name: "moses"});
    const x = idbApp.fetchAllOfflineReviews();
    console.log(x)
  }

}

window.addEventListener("load", event => {
  console.log("ONLINE: " + navigator.onLine)
  if(navigator.onLine) {
    DBHelper.fetchAllOfflineReviews().then((reviews) => {
      reviews.forEach(review => {
        rev = review.reviews;
        console.log(review)
        DBHelper.createRestaurantReview(rev.restaurant_id, rev.name, rev.rating, rev.comments, 
          (err, response) => {
            if(err) {
              console.log(err)
            } else {
              DBHelper.deleteOfflineReview(review.id);
            }
          })
      })
      }
    )
  }
})
