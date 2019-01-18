let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map("map", {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer(
        "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}",
        {
          mapboxToken:
            "pk.eyJ1Ijoib2tvY2hhIiwiYSI6ImNqa3d1MHEwMjAxa2gzd29jMGd3YmpvMTEifQ.4Edy2_1hoZ4fD6qZqK5IhQ",
          maxZoom: 18,
          attribution:
            'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          id: "mapbox.streets"
        }
      ).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName("id");
  if (!id) {
    // no id found in URL
    error = "No restaurant id in URL";
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

  const address = document.getElementById("restaurant-address");
  address.innerHTML = restaurant.address;

  const image = document.getElementById("restaurant-img");
  image.className = "restaurant-img";
  image.alt = "name" + restaurant.name;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById("restaurant-cuisine");
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  DBHelper.fetchRestaurantReviewsById(restaurant.id, fillReviewsHTML);

  createReviewForm();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById("restaurant-hours");
  for (let key in operatingHours) {
    const row = document.createElement("tr");

    const day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (error, reviews) => {
  self.restaurant.reviews = reviews;

  if (error) {
    console.log('Error retrieving reviews', error);
    return;
  }
  const container = document.getElementById("reviews-container");
  const title = document.createElement("h3");
  title.innerHTML = "Reviews";
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById("reviews-list");
  reviews.forEach(review => {
    // console.log(review)
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = review => {
  const li = document.createElement("li");
  const name = document.createElement("h2");
  name.innerHTML = review.name;
  li.appendChild(name);

  const createdAt = document.createElement("p");
  createdAt.innerHTML = "Created: "  + new Date(review.createdAt).toLocaleDateString();
  li.appendChild(createdAt);

  const updatedAt = document.createElement("p");
  updatedAt.innerHTML = "Updated: " + new Date(review.updatedAt).toLocaleDateString();
  li.appendChild(updatedAt);

  const rating = document.createElement("p");
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement("p");
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  // console.log(review)
  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById("breadcrumb");
  const li = document.createElement("li");
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};

/**
 * Create reviews form
 */
createReviewForm = () => {
  const container = document.getElementById("review-form");

  const formContainer = document.createElement("form");
  formContainer.setAttribute("method", "post");
  container.appendChild(formContainer);

  const addReviewTitle = document.createElement("h4");
  addReviewTitle.appendChild(document.createTextNode("Add review"));
  formContainer.appendChild(addReviewTitle);

  const name = document.createElement("input");
  name.setAttribute("type", "text");
  name.setAttribute("name", "name");
  name.setAttribute("required", "true")
  name.setAttribute("id", "reviewName")

  name.setAttribute("placeholder", "Name");
  formContainer.appendChild(name)

  const review = document.createElement("input");
  review.setAttribute("type", "number");
  review.setAttribute("name", "rating");
  review.setAttribute("required", "true")
  review.setAttribute("id", "ratingValue")
  review.setAttribute("placeholder", "Rating");
  review.setAttribute("min", "1");
  review.setAttribute("max", "5");
  formContainer.appendChild(review)

  const comment = document.createElement("textarea");
  comment.setAttribute("name", "comment");
  comment.setAttribute("required", "true")
  comment.setAttribute("id", "reviewComment")
  comment.setAttribute("rows", "8")
  comment.setAttribute("placeholder", "How was your experience?");
  formContainer.appendChild(comment);
  
  const button = document.createElement("button");
  button.setAttribute("name", "submit");
  button.appendChild(document.createTextNode("Submit"));
  button.setAttribute("id", "addReview");

  button.addEventListener('click', (evt) => {
    evt.preventDefault();
    const name = document.querySelector('#reviewName').value;
    const rating = document.querySelector('#ratingValue').value;
    const comments = document.querySelector('#reviewComment').value;

    const id = window.location.href.split("=")[1];
    console.log(id)
  
    DBHelper.createRestaurantReview(id, name, rating, comments,
      (error, review) => {
      if (error) {
        console.log(id, name, rating, comments)
        DBHelper.createOfflineReview(id, name, rating, comments)
        console.log('Error saving review');
      } else {
        console.log(review);
        window.location.href = `/restaurant.html?id=${id}`;
      }
    });
  });
  formContainer.appendChild(button);
}

DBHelper.test()