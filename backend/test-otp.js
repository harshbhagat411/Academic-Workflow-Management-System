const axios = require('axios');

async function test() {
  try {
    console.log('Sending request to API...');
    const res = await axios.post('http://localhost:5000/api/auth/forgot-password-request', {
      email: '22bmiit016@gmail.com'
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('API Error Response:', err.response ? err.response.data : err.message);
  }
}

test();
