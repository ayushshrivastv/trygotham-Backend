#!/usr/bin/env node

/**
 * Example: Get census statistics
 *
 * This script demonstrates how to retrieve statistics for a census.
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function getCensusStats(censusId) {
  console.log(`📊 Fetching statistics for census: ${censusId}\n`);

  try {
    const response = await fetch(`${API_URL}/api/v1/stats/${censusId}`);
    const result = await response.json();

    if (response.ok) {
      console.log('✅ Statistics retrieved successfully!\n');

      const stats = result.data;

      console.log('📈 Overview:');
      console.log(`  Total Members: ${stats.totalMembers}`);
      console.log(`  Last Updated: ${new Date(stats.lastUpdated).toLocaleString()}\n`);

      console.log('👥 Age Distribution:');
      const ageRanges = [
        '0-17',
        '18-24',
        '25-34',
        '35-44',
        '45-54',
        '55-64',
        '65+',
      ];
      ageRanges.forEach((range, index) => {
        const count = stats.ageDistribution[index] || 0;
        const percentage =
          stats.totalMembers > 0
            ? ((count / stats.totalMembers) * 100).toFixed(1)
            : '0.0';
        console.log(`  ${range.padEnd(8)} ${count.toString().padStart(5)} (${percentage}%)`);
      });

      console.log('\n🌍 Location Distribution:');
      const continents = [
        'Africa',
        'Asia',
        'Europe',
        'N. America',
        'S. America',
        'Oceania',
        'Antarctica',
      ];
      continents.forEach((continent, index) => {
        const count = stats.continentDistribution[index] || 0;
        const percentage =
          stats.totalMembers > 0
            ? ((count / stats.totalMembers) * 100).toFixed(1)
            : '0.0';
        console.log(
          `  ${continent.padEnd(12)} ${count.toString().padStart(5)} (${percentage}%)`
        );
      });
    } else {
      console.error('❌ Failed to get statistics:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get census ID from command line argument
const censusId = process.argv[2];

if (!censusId) {
  console.log('Usage: node get-stats.js <census-id>');
  console.log('Example: node get-stats.js census-123456');
  process.exit(1);
}

getCensusStats(censusId);
