import { fetchData } from './es_modules/fetchData.mjs';
// const express = require('express');
import express from 'express';
// const cors = require('cors');
import cors from 'cors';
import RateLimit from 'express-rate-limit';
const app = express();
const port = 8383;

// Enable trust proxy
app.set('trust proxy', true);

// Define custom function to get the client's IP address
const getClientIp = (req) => {
	// Check for X-Forwarded-For header
	if(req.headers['x-forwarded-for']) {
		// Split the header to get client's IP
		return req.headers['x-forwarded-for'].split(',')[0];
	}
	// If header not present, use remote address
	return req.connection.remoteAddress;
}

// Set up rate limiter
// const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
	windowMs: 1*1000, // 1 second
	max: 50, // Limit each unique IP to 50 reqs per second
	skip: (req) => getClientIp(req) // Use function to get IP
})
app.use(limiter);

// CORS required else network error is thrown
const allowedOrigins = ['http://localhost:5173', 'https://joelc95.github.io']
const corsOptions = {
	origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error(`No requests from ${origin} allowed by CORS`));
    }
  },
}
app.use(cors(corsOptions))

app.get('/:inputType/:inputTitle', async (req, res) => {
	// Private token API function call
	try {
		let url = `https://api.themoviedb.org/3/search/${req.params.inputType}?query=${req.params.inputTitle}&include_adult=false&language=en-US&page=1`;
		let json = await fetchData(url)
		res.send(json)
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: 'Failed to fetch data from API' })
	}
})

app.listen(port, () => console.log(`server started on port ${port}`))