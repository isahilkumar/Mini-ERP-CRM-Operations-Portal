const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    // 1. Login to get token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    });
    const token = loginRes.data.token;
    console.log('Successfully logged in.');

    // 2. Prepare form data with the image
    const imagePath = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\cc7a9b6c-d543-4cac-a5f4-afe1f79cf9a3\\wholesale_product_1786194333536.png';
    const form = new FormData();
    form.append('name', 'Premium Tech Box');
    form.append('sku', 'TECH-BOX-001');
    form.append('category', 'Electronics');
    form.append('unitPrice', '299.99');
    form.append('currentStock', '50');
    form.append('minStockAlert', '10');
    form.append('location', 'Warehouse A');
    form.append('image', fs.createReadStream(imagePath));

    // 3. Send POST request
    console.log('Uploading image to S3 via backend API...');
    const uploadRes = await axios.post('http://localhost:5000/api/products', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('SUCCESS! Product created with S3 Image URL:');
    console.log(uploadRes.data);
  } catch (error) {
    console.error('Error during upload test:', error.response ? error.response.data : error.message);
  }
}

testUpload();
