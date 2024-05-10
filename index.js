const redis = require('redis');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const AWS = require('aws-sdk');
const mm = require('fs');

const { initializeApp } = require("firebase/app");
const { getAuth, RecaptchaVerifier, signInWithPhoneNumber,signOut } = require("firebase/auth");
const { getFirestore, collection, doc, setDoc, getDoc,getDocs, query, where, Firestore,addDoc,updateDoc } = require('firebase/firestore');
const { getStorage, ref, getDownloadURL, getMetadata } = require('firebase/storage');
const { getApp } = require("firebase/app");

// const grecaptcha = require('grecaptcha')
const firebaseConfig = {
	apiKey: "AIzaSyB2r13V8v3bm6jrSX8apZnX1HZSOwqFQ0I",
    authDomain: "townplanmap.firebaseapp.com",
    projectId: "townplanmap",
    storageBucket: "townplanmap.appspot.com",
    messagingSenderId: "585432733039",
    appId: "1:585432733039:web:137d2b5633d4662748849a",
    measurementId: "G-YL1J9CT76L"
};
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
AWS.config.update({
    accessKeyId: 'AKIAYGY7F2XL2WNRTAVT',
    secretAccessKey: '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',
    region: 'us-east-2'});

// Create an instance of the S3 client
const s3 = new AWS.S3();

// Create a Redis client
const client = redis.createClient({
    password: 'zcsn0BNIiaUaFc3UbPmRSPR0LObfU95Y',
    socket: {
        host: 'redis-10882.c11.us-east-1-3.ec2.redns.redis-cloud.com',
        port: 10882
    }
});
client.connect();

// Handle errors
client.on('error', (err) => {
    console.error('Redis Error:', err);
});

client.on('connect', () => {
  console.log('Connected to Redis');
  // Start processing data
  processQueue();
});

// // Connect to Redis
// client.on('connect', async () => {
//     console.log('Connected to Redis');
//     try {
//         const result = await client.LRANGE('firebaseQueue', 0, -1);
//         const jsonData = result.map(JSON.parse);
//         console.log(jsonData)
//         await startProcess(jsonData[0])
//         console.log('Data from Redis (JSON):', jsonData);
        
//     } catch (err) {
//         console.error('Error getting data from Redis:', err);
//     }
// });

// async function processQueue() {
//   try {
//       const result = await client.LRANGE('firebaseQueue', 0, -1);
//       const jsonData = result.map(JSON.parse);
//       if (jsonData.length > 0) {
//           await startProcess(jsonData[0]);
//           console.log('Data from Redis (JSON):', jsonData);
//           // Remove processed data from the queue
//           await client.LTRIM('firebaseQueue', 1, -1);
//       } 
//       // Continue processing recursively
//       processQueue();
//   } catch (err) {
//       console.error('Error processing data from Redis:', err);
//       // Retry processing after a delay
//       setTimeout(processQueue, 5000); // Retry after 5 seconds
//   }
// }

async function processQueue() {
  try {
    const result = await client.BRPOP('firebaseQueue', 0);
    if (result === null) {
      console.log('No data available in the queue.');
      // Continue processing recursively
      processQueue();
      return; 
    }
    console.log(result)
    if (result) {
      const data = JSON.parse(result['element']);
      console.log('Received data:', data);

      await startProcess(data);

      // Remove the processed data from the queue
      await client.LPOP('firebaseQueue');
      console.log('Processed data removed from the queue');
      processQueue();
    }
  } catch (err) {
      console.error('Error processing data from Redis:', err);
      // Retry processing after a delay
      setTimeout(processQueue, 5000); // Retry after 5 seconds
  }
}

async function selectOptionWithValue(page, selector, value) {
    await page.select(selector, value);
  }
  
async function startProcess(jsonData) {
    const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  // Navigate to the website
  await page.goto('https://anyror.gujarat.gov.in/emilkat/GeneralReport_IDB.aspx');
  
  // Wait for the dropdown to be available
  await page.waitForSelector('#ContentPlaceHolder1_ddl_app');
  
  // Select the option with value "1"
  await selectOptionWithValue(page, '#ContentPlaceHolder1_ddl_app', '0');
  
  // Wait for the dropdown to be available
  await page.waitForSelector('#ContentPlaceHolder1_ddldistrict');
  await selectOptionWithValue(page, '#ContentPlaceHolder1_ddldistrict', String(jsonData.dvalue));

  await page.waitForSelector('#ContentPlaceHolder1_ddlcsoffice');
  await selectOptionWithValue(page, '#ContentPlaceHolder1_ddlcsoffice', String(jsonData.cvalue));

  await page.waitForSelector('#ContentPlaceHolder1_ddlward');
  await selectOptionWithValue(page, '#ContentPlaceHolder1_ddlward', String(jsonData.wvalue));


  await page.waitForSelector('#ContentPlaceHolder1_ddlsurvey');
  await selectOptionWithValue(page, '#ContentPlaceHolder1_ddlsurvey', String(jsonData.svalue));

  await page.waitForSelector('#ContentPlaceHolder1_ddlsheet');

// Evaluate in the browser context to retrieve options
const options = await page.evaluate(() => {
  const select = document.querySelector('#ContentPlaceHolder1_ddlsheet');
  // Convert NodeList to Array and map each option to return its value
  return Array.from(select.options).map(option => option.value);
});

// Print the retrieved options (for debugging purposes)
console.log('Dropdown options:', options);

// Select the second option if it exists
if (options.length >= 2) {
  const secondOptionValue = options[1]; // Index 1 corresponds to the second option
  // Set the dropdown value to the second option
  await page.select('#ContentPlaceHolder1_ddlsheet', secondOptionValue);
  console.log('Selected second option with value:', secondOptionValue);
} else {
  console.error('The dropdown does not have enough options to select the second one.');
}

  // Take a screenshot of the whole page
  console.log("yy")

  await delay(2000)
  console.log("xx")
  await page.screenshot({ path: 'screenshot.png' });
  
  await console.log("jjj")




  const selector = '#ContentPlaceHolder1_IMG3';
  await page.waitForSelector(selector);
  const element = await page.$( selector);
  await element.screenshot({ path: 'example.png' });
  let captchaKey = await postImg('example.png')
  const captchaInputSelector = '#ContentPlaceHolder1_TxtCaptcha';
  await page.waitForSelector(captchaInputSelector);
  await page.type(captchaInputSelector, captchaKey.solution.text);

  const submitButtonSelector = '#ContentPlaceHolder1_GetDetail'; // Replace with the actual ID of your submit button

// Wait for the submit button to appear
  await page.waitForSelector(submitButtonSelector);

// Click the submit button
  await page.click(submitButtonSelector);


  await delay(10000)
// Gen erate PDF of the page
  await page.pdf({ path: `${jsonData.id}.pdf`, format: 'A4' });
  await delay(2000)
  await uploadFile('reradata', `${jsonData.id}.pdf`,jsonData.id);
  browser.close();
}  

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  
  
  
  
  
  async function postImg(img){
    const data = {
      "clientKey": "f34546f9759051a407e0c7360cd2b4ac",
      "task": {
          "type": "ImageToTextTask",
          "body": await base64(img),
          "phrase": false,
          "case": true,
          "numeric": 0,
          "math": false,
          "minLength": 6,
          "maxLength": 6,
          "regsense":1,
          "comment": "Please give me captcha in case sensitive"
      },
      "languagePool": "en"
  }
  const url = "https://api.2captcha.com/createTask"
  const options = {
    method: 'POST', // Specify the request method
    headers: {
        'Content-Type': 'application/json' // Specify the content type in the headers
    },
    body: JSON.stringify(data) // Convert the JavaScript object to a JSON string
  };
  const initialResponse = await fetch(url, options);
          if (!initialResponse.ok) {
              throw new Error('Initial network response was not ok');
          }
  const initialDataResponse = await initialResponse.json();
  let taskId = initialDataResponse.taskId;
  
  let status = initialDataResponse.status;
  let firstTime = true
  let FinalKey
  
  
      while (status === "processing" || firstTime) {
        await new Promise(resolve => setTimeout(resolve, 4000)); // Wait for 2 seconds
  
        const checkUrl = "https://api.2captcha.com/getTaskResult";
        const checkData = {
            "clientKey": "f34546f9759051a407e0c7360cd2b4ac", // Add your actual client key
            "taskId": taskId
        };
        const checkOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(checkData)
        };
        const checkResponse = await fetch(checkUrl, checkOptions);
        if (!checkResponse.ok) {
            throw new Error('Check task status network response was not ok');
        }
        const checkDataResponse = await checkResponse.json();
        console.log('Check Response:', checkDataResponse);
        status = checkDataResponse.status;
        firstTime = false
        FinalKey = checkDataResponse
    }
  
    // Step 5: Handle the final response
    console.log('Final Response:', FinalKey);
    return FinalKey
  }
  
  /**
   * Convert an image file to a Base64 encoded string.
   * @param {string} path - The file path to the image.
   * @returns {Promise<string>} A promise that resolves with the Base64 encoded string.
   */
  async function base64(path) {
    try {
        const data = await fs.readFile(path, { encoding: 'base64' });
        return data;
    } catch (error) {
        throw new Error(`Error reading file: ${error.message}`);
    }
  }
    

  const uploadFile = async(bucketName, filePath,id) => {
    // Read content from the file
    
    const fileContent = mm.readFileSync(filePath);
  
    // Setting up S3 upload parameters
    const params = {
      Bucket: bucketName,
      Key: filePath,
      Body: fileContent
    };
  
    // Uploading files to the bucket
     await s3.upload(params, function(err, data) {
      if (err) {
        throw err;
      }
      console.log(`File uploaded successfully. ${data.Location}`);
      updateLink(data.Location,id)
    });
  };


  async function updateLink(link,id){
    try {
      await updateDoc(doc(db, "anyror",id), {
        link: link,
      })
    } catch (error) {
      console.error('Error submitting data:', error);
  }
  }