// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
// Expects the .env file at the same level
import { config } from "dotenv";
import { delay } from "@azure/core-util";

config();

let loops = 0;
let testDurationInSeconds = 20 * 24 * 60 * 60;
let globalCount = 0; // number of storageBlobs listed
const startedAt = new Date();
let timer: NodeJS.Timer

async function main() {
    const credential = new DefaultAzureCredential();
    const client = new BlobServiceClient(process.env["STORAGE_ENDPOINT"] || "", credential);
    const containerName = "test-" + Math.floor(Math.random() * 1000000);
    await client.createContainer(containerName);
    const containerClient = client.getContainerClient(containerName);
    for (let i = 0; i < 20; i++) {
        const blobClient = containerClient.getBlockBlobClient("blob" + i);
        await blobClient.uploadData(Buffer.from("content" + i));
    }

    while ((new Date().valueOf() - startedAt.valueOf()) < testDurationInSeconds * 1000) {
        try {
            let iterable = client.getContainerClient(containerName).listBlobsFlat().byPage({ maxPageSize: 3 });
            let count = 0
            for await (const element of iterable) {
                count += element.segment.blobItems.length;
            }
            loops++;
            globalCount = count
            console.log(`listBlobsFlat: ${count}, loops: ${loops}`);
            await delay(3000 + Math.ceil(Math.random() * 100));
        } catch (error) {
            console.log((error as Error)!.message);
            await delay(10000);
        }
    }
    console.log("Done");
    clearInterval(timer)
}

main().catch((err) => {
    throw new Error("Failed to run sample:" + err.message);
});

function snapshot() {
    const elapsedTimeInSeconds = (new Date().valueOf() - startedAt.valueOf()) / 1000;
    const eventProperties: Record<string, number> = {}
    const { arrayBuffers, rss, heapUsed } = process.memoryUsage()
    eventProperties["elapsedTimeInSeconds"] = elapsedTimeInSeconds;
    eventProperties["memory.arrayBuffers"] = arrayBuffers;
    eventProperties["memory.rss"] = rss;
    eventProperties["memory.heapUsed"] = heapUsed;
    eventProperties["loops"] = loops;
    eventProperties["globalCount"] = globalCount;
}

timer = setInterval(() => { snapshot() }, 5000)
