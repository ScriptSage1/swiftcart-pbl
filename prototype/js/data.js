/*
 * SwiftCart prototype — catalogue and configuration data.
 * In the real platform this comes from the Catalogue, Delivery and Promotion
 * services; here it is static so the prototype runs with no backend.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SC_DATA = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const config = {
    currency: 'INR',
    locale: 'en-IN',
    freeDeliveryThreshold: 999,
    maxQtyPerItem: 10,
    gstRate: 0.18 // prices are GST-inclusive; shown for transparency only
  };

  const categories = ['All', 'Audio', 'Tech', 'Home', 'Lifestyle'];

  const products = [
    {
      id: 'aura-headphones', name: 'Aura Wireless Headphones', category: 'Audio',
      price: 6499, mrp: 7999, rating: 4.6, reviews: 214, stock: 12, tile: '#ECEEF2', image: 'images/aura-headphones.jpg',
      blurb: 'Over-ear headphones with adaptive noise cancellation and a 40-hour battery.',
      highlights: ['Adaptive noise cancellation', '40-hour battery, USB-C fast charge', 'Multipoint Bluetooth 5.3', '1-year warranty']
    },
    {
      id: 'pulse-watch', name: 'Pulse Smart Watch', category: 'Tech',
      price: 8999, mrp: 10999, rating: 4.4, reviews: 389, stock: 8, tile: '#E8EFEA', image: 'images/pulse-watch.jpg',
      blurb: 'A lightweight fitness watch with an always-on display and 7-day battery life.',
      highlights: ['1.4" always-on AMOLED display', 'Heart-rate, SpO2 and sleep tracking', '5 ATM water resistance', '7-day battery life']
    },
    {
      id: 'nomad-backpack', name: 'Nomad Backpack 22L', category: 'Lifestyle',
      price: 3299, mrp: 3299, rating: 4.7, reviews: 156, stock: 20, tile: '#F3ECE3', image: 'images/nomad-backpack.jpg',
      blurb: 'A weatherproof everyday pack with a padded 16" laptop sleeve.',
      highlights: ['Water-repellent recycled shell', 'Padded 16" laptop sleeve', 'Hidden back pocket', 'Lifetime repair promise']
    },
    {
      id: 'halo-lamp', name: 'Halo Desk Lamp', category: 'Home',
      price: 2499, mrp: 2999, rating: 4.5, reviews: 98, stock: 15, tile: '#F2EEE3', image: 'images/halo-lamp.jpg',
      blurb: 'Warm, flicker-free light with touch dimming for late-night work.',
      highlights: ['Three colour temperatures', 'Touch dimming with memory', 'Flicker-free LED, 25,000 hours', 'USB-C powered']
    },
    {
      id: 'stride-shoes', name: 'Stride Running Shoes', category: 'Lifestyle',
      price: 4799, mrp: 5999, rating: 4.3, reviews: 271, stock: 3, tile: '#E6EEF2', image: 'images/stride-shoes.jpg',
      blurb: 'Breathable knit runners with responsive cushioning for daily miles.',
      highlights: ['Engineered knit upper', 'Responsive foam midsole', 'Reflective heel detail', '30-day comfort guarantee']
    },
    {
      id: 'ember-mug', name: 'Ember Ceramic Mug Set', category: 'Home',
      price: 899, mrp: 1099, rating: 4.8, reviews: 412, stock: 40, tile: '#EEF0F6', image: 'images/ember-mug.jpg',
      blurb: 'A set of two hand-glazed stoneware mugs, microwave and dishwasher safe.',
      highlights: ['Set of two, 330 ml each', 'Hand-glazed stoneware', 'Microwave and dishwasher safe', 'Plastic-free packaging']
    },
    {
      id: 'tactile-keyboard', name: 'Tactile Mechanical Keyboard', category: 'Tech',
      price: 5499, mrp: 6499, rating: 4.6, reviews: 187, stock: 9, tile: '#F1EDEA', image: 'images/tactile-keyboard.jpg',
      blurb: 'A compact 75% wireless keyboard with hot-swappable tactile switches.',
      highlights: ['Hot-swappable tactile switches', 'Bluetooth, 2.4 GHz and USB-C', 'Aluminium top plate', 'Up to 200 hours per charge']
    },
    {
      id: 'flow-bottle', name: 'Flow Steel Bottle 750 ml', category: 'Lifestyle',
      price: 1199, mrp: 1499, rating: 4.7, reviews: 520, stock: 60, tile: '#E8F0EC', image: 'images/flow-bottle.jpg',
      blurb: 'Double-wall insulated steel that keeps drinks cold for 24 hours.',
      highlights: ['Cold 24 h, hot 12 h', 'Leak-proof twist cap', 'BPA-free 18/8 steel', 'Fits car cup holders']
    },
    {
      id: 'echo-speaker', name: 'Echo Mini Speaker', category: 'Audio',
      price: 2999, mrp: 3499, rating: 4.2, reviews: 143, stock: 18, tile: '#F2EAE7', image: 'images/echo-speaker.jpg',
      blurb: 'Pocket-sized speaker with surprisingly deep bass and IP67 protection.',
      highlights: ['IP67 dust and water protection', '14-hour playtime', 'Stereo pairing', 'USB-C charging']
    },
    {
      id: 'shade-sunglasses', name: 'Shade Polarised Sunglasses', category: 'Lifestyle',
      price: 1899, mrp: 2499, rating: 4.4, reviews: 76, stock: 25, tile: '#F2EFE6', image: 'images/shade-sunglasses.jpg',
      blurb: 'Classic lightweight frames with polarised, UV400 lenses.',
      highlights: ['Polarised UV400 lenses', 'Lightweight acetate frame', 'Scratch-resistant coating', 'Hard case included']
    },
    {
      id: 'terra-planter', name: 'Terra Self-Watering Planter', category: 'Home',
      price: 749, mrp: 749, rating: 4.5, reviews: 64, stock: 30, tile: '#EAF0E6', image: 'images/terra-planter.jpg',
      blurb: 'A terracotta-finish planter with a hidden reservoir that waters for two weeks.',
      highlights: ['Two-week water reservoir', 'Matte terracotta finish', 'Drainage plug included', 'For indoor plants up to 40 cm']
    },
    {
      id: 'volt-powerbank', name: 'Volt Power Bank 20,000 mAh', category: 'Tech',
      price: 1799, mrp: 2299, rating: 4.3, reviews: 305, stock: 35, tile: '#ECEDF3', image: 'images/volt-powerbank.jpg',
      blurb: 'A slim 22.5 W fast-charging power bank that tops up a phone four times.',
      highlights: ['22.5 W fast charging', 'Two USB-C ports and one USB-A', 'Flight-safe capacity', 'LED charge indicator']
    }
  ];

  const deliveryOptions = [
    {
      id: 'standard', label: 'Standard delivery', note: 'Delivered by our courier partners',
      fee: 79, freeAboveThreshold: true, minDays: 3, maxDays: 5
    },
    {
      id: 'express', label: 'Express delivery', note: 'Priority dispatch, tracked end to end',
      fee: 149, freeAboveThreshold: false, minDays: 1, maxDays: 2
    }
  ];

  const promoCodes = {
    WELCOME10: { type: 'percent', value: 10, maxDiscount: 500, minSubtotal: 999, label: '10% off your first order' },
    SAVE200: { type: 'flat', value: 200, minSubtotal: 2499, label: '₹200 off orders above ₹2,499' },
    FREESHIP: { type: 'shipping', minSubtotal: 0, label: 'Free delivery on this order' }
  };

  // Small sample of the PIN-code directory used for address auto-fill.
  const pinDirectory = {
    '110001': { city: 'New Delhi', state: 'Delhi' },
    '160017': { city: 'Chandigarh', state: 'Chandigarh' },
    '226001': { city: 'Lucknow', state: 'Uttar Pradesh' },
    '302001': { city: 'Jaipur', state: 'Rajasthan' },
    '380001': { city: 'Ahmedabad', state: 'Gujarat' },
    '400001': { city: 'Mumbai', state: 'Maharashtra' },
    '411001': { city: 'Pune', state: 'Maharashtra' },
    '500001': { city: 'Hyderabad', state: 'Telangana' },
    '560001': { city: 'Bengaluru', state: 'Karnataka' },
    '600001': { city: 'Chennai', state: 'Tamil Nadu' },
    '682001': { city: 'Kochi', state: 'Kerala' },
    '700001': { city: 'Kolkata', state: 'West Bengal' }
  };

  return {
    config: config,
    categories: categories,
    products: products,
    deliveryOptions: deliveryOptions,
    promoCodes: promoCodes,
    pinDirectory: pinDirectory
  };
});
