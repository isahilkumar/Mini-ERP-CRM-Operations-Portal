const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const products = [
  {
    name: 'Industrial Pallet Jack',
    sku: 'PJ-5000',
    category: 'Warehouse Equipment',
    unitPrice: '450.00',
    currentStock: '15',
    minStockAlert: '3',
    location: 'Aisle 1',
    imagePath: 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\cc7a9b6c-d543-4cac-a5f4-afe1f79cf9a3\\product_pallet_jack_1786196453983.png'
  },
  {
    name: 'Wholesale Cardboard Boxes (Bundle of 50)',
    sku: 'CB-BOX-50',
    category: 'Packaging',
    unitPrice: '25.50',
    currentStock: '200',
    minStockAlert: '20',
    location: 'Aisle 4',
    imagePath: 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\cc7a9b6c-d543-4cac-a5f4-afe1f79cf9a3\\product_boxes_1786196468970.png'
  },
  {
    name: 'Safety Hard Hat (Yellow)',
    sku: 'SHH-YEL-01',
    category: 'Safety Gear',
    unitPrice: '15.99',
    currentStock: '120',
    minStockAlert: '10',
    location: 'Aisle 2',
    imagePath: 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\cc7a9b6c-d543-4cac-a5f4-afe1f79cf9a3\\product_safety_helmet_1786196479788.png'
  }
];

async function uploadProducts() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    });
    const token = loginRes.data.token;
    console.log('Logged in.');

    for (const p of products) {
      const form = new FormData();
      form.append('name', p.name);
      form.append('sku', p.sku);
      form.append('category', p.category);
      form.append('unitPrice', p.unitPrice);
      form.append('currentStock', p.currentStock);
      form.append('minStockAlert', p.minStockAlert);
      form.append('location', p.location);
      form.append('image', fs.createReadStream(p.imagePath));

      console.log(`Uploading ${p.name}...`);
      await axios.post('http://localhost:5000/api/products', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`Successfully uploaded ${p.name}!`);
    }
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

uploadProducts();
