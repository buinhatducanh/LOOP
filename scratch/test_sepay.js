require('dotenv').config();
const axios = require('axios');

async function check() {
  try {
    const res = await axios.get('https://my.sepay.vn/userapi/transactions/list', {
      headers: {
        'Authorization': `Bearer ${process.env.SEPAY_API_KEY}`
      }
    });
    console.log(res.data);
  } catch (e) {
    console.log("Error:", e.response ? e.response.data : e.message);
  }
}
check();
