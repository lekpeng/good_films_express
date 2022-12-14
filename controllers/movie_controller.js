const axios = require("axios");
const cors = require("cors");
const Movie = require("../models/movie");

module.exports = {
  showMovie: async (req, res) => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${req.params.movieApiId}?api_key=${process.env.API_KEY}`
      );
      const data = await response.data;
      return res.json(data);
    } catch (err) {
      return res
        .status(500)
        .json({ error: `${err}. Failed to get movie with API Id ${req.params.movieApiId}` });
    }
  },

  showOurMovie: async (req, res) => {
    const currentMovie = req.params.movieApiId;
    const movie = await Movie.findOne({ movieApiId: currentMovie }).populate("reviewIds");

    if (!movie) {
      return res.json({});
    } else {
      return res.json(movie);
    }
  },

  listOfGenres: async (req, res) => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.API_KEY}`
      );
      const data = await response.data;
      return res.json(data.genres);
    } catch (error) {
      return res.status(500).json({ error: `Failed to get list of genres` });
    }
  },

  filterByGenre: async (req, res) => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/discover/movie?with_genres=${req.params.genreId}&api_key=${process.env.API_KEY}&page=${req.params.page}`
      );
      const data = await response.data;
      return res.json(data.results);
    } catch (err) {
      return res.status(404).json({ error: `Failed to get movie` });
    }
  },
  searchMovies: async (req, res) => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.API_KEY}&query=${req.params.query}&page=${req.params.page}`
      );

      const data = await response.data;

      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: `${err}. Failed to get movie` });
    }
  },
};
