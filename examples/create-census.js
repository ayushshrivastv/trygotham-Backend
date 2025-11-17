#!/usr/bin/env node

/**
 * Example: Create a new census
 *
 * This script demonstrates how to create a new census using the API.
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function createCensus() {
  console.log('🚀 Creating new census...\n');

  const censusData = {
    name: 'Community Census 2024',
    description: 'Annual census for our decentralized community',
    enableLocation: true,
    minAge: 1, // Minimum age range: 18-24
  };

  try {
    const response = await fetch(`${API_URL}/api/v1/census`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(censusData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Census created successfully!');
      console.log('\nCensus Details:');
      console.log('  ID:', result.data.id);
      console.log('  Name:', result.data.name);
      console.log('  Description:', result.data.description);
      console.log('  Active:', result.data.active);
      console.log('  Created:', new Date(result.data.createdAt).toLocaleString());
      console.log('\n📊 Save this Census ID for registrations:', result.data.id);
    } else {
      console.error('❌ Failed to create census:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createCensus();
