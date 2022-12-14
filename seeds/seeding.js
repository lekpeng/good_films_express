const userModel = require("../models/user");
const movieModel = require("../models/movie");
const reviewModel = require("../models/review");

const userData = require("./seed_data/user_seed_data");
const movieData = require("./seed_data/movie_seed_data");
const reviewData = require("./seed_data/review_seed_data");

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const seedUsers = async () => {
  const data = await Promise.all(
    userData.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;
      return user;
    })
  );

  await userModel.insertMany(data);
  console.log("seeded users");
};

const seedMovies = async () => {
  await movieModel.insertMany(movieData);
  console.log("seeded movies");
};

const seedReviews = async () => {
  // get movieApiIds
  const movieApiIds = movieData.map((movie) => movie.movieApiId);
  const numMovies = movieData.length;

  // get usernames
  const usernames = userData.map((user) => user.username);
  const numUsers = userData.length;

  const data = await Promise.all(
    reviewData.map(async (review, idx) => {
      review._id = new mongoose.Types.ObjectId();

      // 1) assign and push that review to movie
      const movieApiAssigned = movieApiIds[idx % numMovies];
      const movieAssigned = await movieModel.findOneAndUpdate(
        {
          movieApiId: movieApiAssigned,
        },
        { $push: { reviewIds: review._id } }
      );

      // 2) add movie to review
      review.movieId = movieAssigned._id;

      // 3) assign and push that review to a user
      const usernameAssigned = usernames[idx % numUsers];
      const user = await userModel.findOneAndUpdate(
        { username: usernameAssigned },
        {
          $push: { reviewIds: review._id },
        }
      );

      review.authorUserId = user._id;

      return review;
    })
  );

  await reviewModel.insertMany(data);

  console.log("seeded reviews and linked");
};

const updateAverageRatings = async () => {
  const movies = await movieModel.find({}).populate("reviewIds");
  const moviesWithUpdatedAverage = await Promise.all(
    movies.map(async (movie) => {
      const ratings = movie.reviewIds.map((review) => review.rating).filter((rating) => rating > 0);
      let averageRating = "None";
      if (ratings.length) {
        averageRating = ratings.reduce((a, b) => a + b) / ratings.length;
      }

      await movie.updateOne({
        $set: {
          averageRating: averageRating,
        },
      });
      return;
    })
  );
};

const seed = async (req, res) => {
  const firstUsername = userData[0].username;
  const firstUser = await userModel.findOne({ username: firstUsername });

  if (!firstUser) {
    await seedUsers();
    await seedMovies();
    await seedReviews();
    await updateAverageRatings();
    res.send("seeded!");
    return;
  }
  res.send("already seeded previously!");
};

module.exports = seed;
