Attempting to repro the user issue at https://github.com/azure/azure-sdk-for-js/issues/25832

# Setup
Add the following variables in the `.env` file

- AZURE_CLIENT_ID
- AZURE_CLIENT_SECRET
- AZURE_TENANT_ID
- STORAGE_ENDPOINT

# Run the test
```
npm install
npm run test
```