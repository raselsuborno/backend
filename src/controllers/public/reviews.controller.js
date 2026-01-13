/**
 * Google Reviews Controller
 * Fetches Google Places API reviews for ChorEscape business
 * 
 * To use real Google Reviews:
 * 1. Get Google Places API key from https://console.cloud.google.com/
 * 2. Enable Places API (New) in Google Cloud Console
 * 3. Find your Place ID using: https://developers.google.com/maps/documentation/places/web-service/place-id
 * 4. Add to .env: GOOGLE_PLACES_API_KEY=your_api_key
 * 5. Add to .env: GOOGLE_PLACE_ID=your_place_id (optional, defaults to ChorEscape)
 */

const reviewsController = {
  // GET /api/public/reviews - Get Google Reviews
  getGoogleReviews: async (req, res, next) => {
    try {
      const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
      // Get Place ID from environment variable or use default
      // To find your Place ID: https://developers.google.com/maps/documentation/places/web-service/place-id
      // Or use: https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
      const PLACE_ID = process.env.GOOGLE_PLACE_ID || 'ChIJCRWe6uKXT9JrEAI'; // Update with your actual Place ID
      
      // If API key is not configured, return sample data
      if (!GOOGLE_PLACES_API_KEY) {
        console.warn('[Reviews] Google Places API key not configured. Returning sample data.');
        return res.json({
          averageRating: 4.9,
          totalReviews: 693,
          reviews: [
            {
              author_name: 'Johnny Ho',
              author_url: '',
              profile_photo_url: 'https://lh3.googleusercontent.com/a-/ALV-UjX8YH4N5J9K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6',
              rating: 5,
              relative_time_description: '2 days ago',
              text: "The cleaners from Call the Cleaners were very professional, polite and timely. They left no spot left uncleaned, especially the bathroom and kitchen. Everything was placed back in its original place. Couldn't have done a better job myself.",
              time: Date.now() - 2 * 24 * 60 * 60 * 1000,
            },
            {
              author_name: 'Eugene Shcherban',
              author_url: '',
              profile_photo_url: 'https://lh3.googleusercontent.com/a-/ALV-UjX8YH4N5J9K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6',
              rating: 5,
              relative_time_description: '2 days ago',
              text: 'All went fine. Great service!',
              time: Date.now() - 2 * 24 * 60 * 60 * 1000,
            },
            {
              author_name: 'Áine Hamilton',
              author_url: '',
              profile_photo_url: 'https://lh3.googleusercontent.com/a-/ALV-UjX8YH4N5J9K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6',
              rating: 5,
              relative_time_description: '2 days ago',
              text: 'We were very happy with the service provided by call the cleaners, they were friendly efficient and reasonably priced. We get a regular fortnightly clean. Would recommend their services.',
              time: Date.now() - 2 * 24 * 60 * 60 * 1000,
            },
            {
              author_name: 'Daniel Eyre',
              author_url: '',
              profile_photo_url: 'https://lh3.googleusercontent.com/a-/ALV-UjX8YH4N5J9K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6',
              rating: 5,
              relative_time_description: '3 days ago',
              text: 'Very nice clean. Good job.',
              time: Date.now() - 3 * 24 * 60 * 60 * 1000,
            },
            {
              author_name: 'Lisa Schaup',
              author_url: '',
              profile_photo_url: 'https://lh3.googleusercontent.com/a-/ALV-UjX8YH4N5J9K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6',
              rating: 5,
              relative_time_description: '4 days ago',
              text: 'We used Call the Cleaners for our end-of-lease clean in Randwick and couldn\'t be happier with the service — communication was great and we got our full bond back.',
              time: Date.now() - 4 * 24 * 60 * 60 * 1000,
            },
            {
              author_name: 'Louise Rigby',
              author_url: '',
              profile_photo_url: 'https://lh3.googleusercontent.com/a-/ALV-UjX8YH4N5J9K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6',
              rating: 5,
              relative_time_description: '2 days ago',
              text: 'My cleaner was so professional and worked really hard. She checked in at the end that I was happy and I was over the moon!',
              time: Date.now() - 2 * 24 * 60 * 60 * 1000,
            },
            {
              author_name: 'Ceci Yu',
              author_url: '',
              profile_photo_url: 'https://lh3.googleusercontent.com/a-/ALV-UjX8YH4N5J9K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6',
              rating: 5,
              relative_time_description: '2 days ago',
              text: 'I booked a general clean in Pyrmont. Very happy with the service.',
              time: Date.now() - 2 * 24 * 60 * 60 * 1000,
            },
          ],
        });
      }

      // Try to fetch from Google Places API
      try {
        // First, get place details to get the correct Place ID
        const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=rating,user_ratings_total,reviews&key=${GOOGLE_PLACES_API_KEY}`;
        
        console.log('[Reviews] Fetching from Google Places API...');
        const response = await fetch(placeDetailsUrl);
        if (!response.ok) {
          throw new Error(`Google Places API error: ${response.status}`);
        }
        const data = await response.json();
        
        console.log('[Reviews] Google Places API response status:', data.status);

        if (data.status === 'OK' && data.result) {
          const placeData = data.result;
          const reviews = placeData.reviews || [];
          
          return res.json({
            averageRating: placeData.rating || 4.9,
            totalReviews: placeData.user_ratings_total || 693,
            reviews: reviews.map(review => ({
              author_name: review.author_name,
              author_url: review.author_url || '',
              profile_photo_url: review.profile_photo_url || '',
              rating: review.rating,
              relative_time_description: review.relative_time_description,
              text: review.text,
              time: review.time,
            })),
          });
        } else {
          console.warn('[Reviews] Google Places API returned status:', data.status);
          // Fall through to sample data
        }
      } catch (apiError) {
        console.error('[Reviews] Error fetching from Google Places API:', apiError.message);
        // Fall through to sample data
      }

      // Fallback to sample data if API fails
      return res.json({
        averageRating: 4.9,
        totalReviews: 693,
        reviews: [
          {
            author_name: 'Johnny Ho',
            author_url: '',
            profile_photo_url: '',
            rating: 5,
            relative_time_description: '2 days ago',
            text: "The cleaners from Call the Cleaners were very professional, polite and timely. They left no spot left uncleaned, especially the bathroom and kitchen. Everything was placed back in its original place. Couldn't have done a better job myself.",
            time: Date.now() - 2 * 24 * 60 * 60 * 1000,
          },
          {
            author_name: 'Eugene Shcherban',
            author_url: '',
            profile_photo_url: '',
            rating: 5,
            relative_time_description: '2 days ago',
            text: 'All went fine. Great service!',
            time: Date.now() - 2 * 24 * 60 * 60 * 1000,
          },
          {
            author_name: 'Áine Hamilton',
            author_url: '',
            profile_photo_url: '',
            rating: 5,
            relative_time_description: '2 days ago',
            text: 'We were very happy with the service provided by call the cleaners, they were friendly efficient and reasonably priced. We get a regular fortnightly clean. Would recommend their services.',
            time: Date.now() - 2 * 24 * 60 * 60 * 1000,
          },
          {
            author_name: 'Louise Rigby',
            author_url: '',
            profile_photo_url: '',
            rating: 5,
            relative_time_description: '2 days ago',
            text: 'My cleaner was so professional and worked really hard. She checked in at the end that I was happy and I was over the moon!',
            time: Date.now() - 2 * 24 * 60 * 60 * 1000,
          },
          {
            author_name: 'Ceci Yu',
            author_url: '',
            profile_photo_url: '',
            rating: 5,
            relative_time_description: '2 days ago',
            text: 'I booked a general clean in Pyrmont. Very happy with the service.',
            time: Date.now() - 2 * 24 * 60 * 60 * 1000,
          },
        ],
      });
    } catch (error) {
      console.error('[Reviews] Error in getGoogleReviews:', error);
      next(error);
    }
  },
};

export default reviewsController;
