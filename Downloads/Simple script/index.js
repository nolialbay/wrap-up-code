/**
 * Genesys Cloud Developer Training
 * Simple script - bulk create a wrap up code
 * @author Mark Francis Trono
 */

// Module requirements
// Obtain a reference to the platformClient object
const platformClient = require('purecloud-platform-client-v2');
const synchoronizedPromise = require('synchronized-promise');
const fs = require('fs');
// const { parse } = require('csv-parse');

// Genesys API client and region
const client = platformClient.ApiClient.instance;
client.setEnvironment(platformClient.PureCloudRegionHosts.us_west_2);

// Logging
// client.config.logger.log_level = client.config.logger.logLevelEnum.level.LTrace;
// client.config.logger.log_format = client.config.logger.logFormatEnum.formats.JSON;
// client.config.logger.log_request_body = true;
// client.config.logger.log_response_body = true;
// client.config.logger.log_to_console = true;
// client.config.logger.log_file_path = "/var/log/javascriptsdk.log";
// client.config.logger.setLogger(); // To apply above changes

// Genesys API
const authorizationApi = new platformClient.AuthorizationApi();
const routingApi = new platformClient.RoutingApi();

// Genesys Client Credentials
const clientId = '2bb6928e-8274-4049-9b0f-c9b2245b095e';
const clientSecret = 'IgazBUniq5uVeihJuhZKb0P5znYgS6BhG9I8H5mX2Lc';

// Clear console
console.clear();

// Program Arguments
console.log("Arguments:");
process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
});
const filePath = process.argv[2];
const wrapUpCodeColumnName = process.argv[3];

// Program arguments check
if (filePath == null || wrapUpCodeColumnName == null) {
    console.log("Please provide appropriate application arguments and try again: csv file path(2) and wrapup code column name(3)");
    process.exit();
}

// Read CSV file
var data;
try {
    data = fs.readFileSync(filePath)
        .toString() // convert Buffer to string
        .split('\n') // split string to lines
        .map(e => e.trim()) // remove white spaces for each line
        .map(e => e.split(',').map(e => e.trim())); // split each line to array
}
catch (err) {
    console.log("Unable to read file path: " + err);
    process.exit();
}
console.log("\nFile " + filePath + " contents:");
console.table(data);
// console.log(JSON.stringify(data, '', 2)); // as json

// Find wrap up code index
let wrapUpCodeIndex = -1;
let wrapUpCodes = [];
for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < data[row].length; col++) {
        if (row == 0 && data[row][col].replace(/['"]+/g, '') == wrapUpCodeColumnName) {
            wrapUpCodeIndex = col;
            break;
        }
    }
}

// Check column name presence in the file
if (wrapUpCodeIndex == -1) {
    console.log("Provided column names were not found in the file. Please check CSV contents.");
    process.exit();
}

// Final wrap up codes array
console.log("\nWrap up codes:");
console.log(wrapUpCodeColumnName);
for (let row = 1; row < data.length; row++) {
    wrapUpCodes.push(data[row][wrapUpCodeIndex].replace(/['"]+/g, ''));
    console.log(wrapUpCodes[row - 1]);
}

// Genesys API - Login client credentials
const loginClientCredentialsGrant = (clientId, clientSecret) =>
    client.loginClientCredentialsGrant(clientId, clientSecret)
        .then(() => {
            // Make request to GET /api/v2/authorization/permissions
            return authorizationApi.getAuthorizationPermissions();
        })
        .then((permissions) => {
            // Handle successful result
            // console.log(`\ngetAuthorizationPermissions success! permissions: \n${JSON.stringify(permissions, null, 2)}\n`);
        })
        .catch((err) => {
            // Handle failure response
            console.log('\nThere was a failure calling getAuthorizationPermissions\n');
            console.log(err);
        });

// Genesys API - Create wrapup codes
const postRoutingWrapupcodes = (body) =>
    routingApi.postRoutingWrapupcodes(body)
        .then((data) => {
            console.log(`postRoutingWrapupcodes success! data: ${JSON.stringify(data, null, 2)}\n`);
        })
        .catch((err) => {
            console.log('There was a failure calling postRoutingWrapupcodes\n');
            console.error(err);
        });

// Trigger promises synchronously
const syncLoginClientCredentialsGrant = synchoronizedPromise(loginClientCredentialsGrant);
const syncPostRoutingWrapupcodes = synchoronizedPromise(postRoutingWrapupcodes);
syncLoginClientCredentialsGrant(clientId, clientSecret);
wrapUpCodes.forEach(wrapUpCode => {
    let body = { name: wrapUpCode }; // Object | WrapupCode
    syncPostRoutingWrapupcodes(body);
})
