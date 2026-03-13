const request = require('supertest');
const app = require('../src/app');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

describe('Image Endpoints', () => {
  let testImageBuffer;

  beforeAll(async () => {
    // Create a simple 100x100 red image
    testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 }
      }
    })
    .png()
    .toBuffer();
  });

  it('should compress an uploaded image', async () => {
    const res = await request(app)
      .post('/api/images/compress')
      .attach('image', testImageBuffer, 'test.png')
      .field('quality', 80)
      .field('maxWidth', 500);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('url');
    expect(res.body).toHaveProperty('filename');
    expect(res.body).toHaveProperty('originalSize');
    expect(res.body).toHaveProperty('compressedSize');
    expect(res.body.width).toBeLessThanOrEqual(500);
  });

  it('should allow forcing output format on compress', async () => {
    const res = await request(app)
      .post('/api/images/compress')
      .attach('image', testImageBuffer, 'test.png')
      .field('quality', 80)
      .field('format', 'webp');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.format).toEqual('webp');
    expect(res.body.filename).toMatch(/\.webp$/);
  });

  it('should convert an uploaded image', async () => {
    const res = await request(app)
      .post('/api/images/convert')
      .attach('image', testImageBuffer, 'test.png')
      .field('quality', 85)
      .field('format', 'webp');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('url');
    expect(res.body.format).toEqual('webp');
  });

  it('should fail if no image is uploaded', async () => {
    const res = await request(app)
      .post('/api/images/compress')
      .send({ quality: 80 });
    
    expect(res.statusCode).toEqual(400);
  });

  it('should return 400 for invalid file type', async () => {
    const res = await request(app)
      .post('/api/images/compress')
      .attach('image', Buffer.from('fake data'), 'test.txt');
    
    expect(res.statusCode).toEqual(400);
  });
});
