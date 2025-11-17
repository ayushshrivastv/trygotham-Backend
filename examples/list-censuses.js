#!/usr/bin/env node

/**
 * Example: List all censuses
 *
 * This script demonstrates how to retrieve all censuses from the API.
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function listCensuses() {
  console.log('📋 Fetching all censuses...\n');

  try {
    const response = await fetch(`${API_URL}/api/v1/census`);
    const result = await response.json();

    if (response.ok) {
      const censuses = result.data;

      if (censuses.length === 0) {
        console.log('No censuses found. Create one first!');
        return;
      }

      console.log(`✅ Found ${censuses.length} census(es):\n`);

      censuses.forEach((census, index) => {
        console.log(`${index + 1}. ${census.name}`);
        console.log(`   ID: ${census.id}`);
        console.log(`   Description: ${census.description}`);
        console.log(`   Status: ${census.active ? '🟢 Active' : '🔴 Closed'}`);
        console.log(
          `   Created: ${new Date(census.createdAt).toLocaleDateString()}`
        );
        console.log('');
      });
    } else {
      console.error('❌ Failed to list censuses:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listCensuses();
