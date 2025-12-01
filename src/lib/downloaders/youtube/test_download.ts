import { downloadVideoAndExtractAudioToMp3 } from './ytdl';

const TEST_URL = 'https://www.youtube.com/watch?v=DUT5rEU6pqM&pp=ygUOaGlwcyBkb24ndCBsaWU%3D';

async function runTest() {
  console.log(`Starting download test for URL: ${TEST_URL}`);

  try {
    await downloadVideoAndExtractAudioToMp3(TEST_URL);
    console.log('\n✅ Test finished successfully!');
  } catch (error) {
    console.error('\n❌ Test failed with an error:', error);
    process.exit(1);
  }
}

runTest();
