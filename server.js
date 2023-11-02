require('dotenv').config();
const express = require('express');
const cors = require('cors');
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
const RateLimit = require("express-rate-limit");
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
		const options = {
			method: 'GET',
			headers: {
				accept: 'application/json',
				Authorization: `Bearer ${process.env.VITE_API_KEY}`
			}
		};
		let apiData = await fetch(url, options);
		let json = await apiData.json()
		// console.log(json)
		for(let i = 0; i < json.results.length; i++) {
			json.results[i].netflix = []
			json.results[i].amazonPrime = []
			json.results[i].disneyPlus = []
			json.results[i].crunchyroll = []
			json.results[i].freevee = []
			json.results[i].hboMax = []
			json.results[i].paramountPlus = []
			json.results[i].skyGo = []
			json.results[i].hulu = []
			json.results[i].adultSwim = []
			json.results[i].funimationNow = []
			json.results[i].channel4 = []
			json.results[i].bfiPlayer = []
			json.results[i].appleTv = []
		}
		json.results.sort(({popularity:a}, {popularity:b}) => b - a);
		let regionObjects = []
		for(let i = 0; i < json.results.length; i++) {
			const regionFetchRes = await fetch(`https://api.themoviedb.org/3/${req.params.inputType}/${json.results[i].id}/watch/providers`, options)
			const regionJSON = await regionFetchRes.json();
			regionObjects.push(regionJSON);
		}
		
		for(let i = 0; i < regionObjects.length; i++) {
			for(const [region, value] of Object.entries(regionObjects[i].results)) {
				if(value.flatrate) {
					for(let service of value.flatrate) {
						if (service.provider_name == "Netflix") {
							json.results[i].netflix.push(region);
						} else if (service.provider_name == "Amazon Prime Video") {
							json.results[i].amazonPrime.push(region);
						} else if (service.provider_name == "Disney Plus") {
							json.results[i].disneyPlus.push(region);
						} else if (service.provider_name == "Crunchyroll") {
							json.results[i].crunchyroll.push(region);
						} else if (service.provider_name == "HBO Max") {
							json.results[i].hboMax.push(region);
						} else if (service.provider_name == "Paramount Plus") {
							json.results[i].paramountPlus.push(region);
						} else if (service.provider_name == "Sky Go") {
							json.results[i].skyGo.push(region)
						} else if (service.provider_name == "Hulu") {
							json.results[i].hulu.push(region)
						} else if (service.provider_name == "Funimation Now") {
							json.results[i].funimationNow.push(region)
						} else if (service.provider_name == "Adult Swim") {
							json.results[i].adultSwim.push(region)
						} else if (service.provider_name == "Channel 4") {
							json.results[i].channel4.push(region)
						} else if (service.provider_name == "BFI Player") {
							json.results[i].bfiPlayer.push(region)
						} else if (service.provider_name == "Apple TV Plus") {
							json.results[i].appleTv.push(region)
						}
					}
				}
				if(value.ads) {
					for(let service of value.ads) {
						if(service.provider_name == "Freevee") {
							json.results[i].freevee.push(region)
						}
					}
				}
			}
		}
		res.send(json)
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: 'Failed to fetch data from API' })
	}
})

app.listen(port, () => console.log(`server started on port ${port}`))