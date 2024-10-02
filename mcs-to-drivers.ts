import fs from "fs";
import { JSDOM } from "jsdom";
import { userAgents } from "./user-agents";

try {
    const locationFetch = await fetch("https://ip.monib.xyz/all");
    const location = await locationFetch.json();
    if (location.country !== "United States") {
        console.error(`\x1b[31mIP not in the US \x1b[0m`);
        process.exit(1);
    }
} catch {
    console.error(`\x1b[31mIP not in the US \x1b[0m`);
    process.exit(1);
}

try {
    fs.mkdirSync("./drivers_data");
} catch {}

let allCsvFiles = fs.readdirSync("./drivers_mc/");
allCsvFiles = allCsvFiles.filter((file) => file.endsWith(".csv"));
let sanatizedMCs: string[][] = [];
let driversData: { [key: string]: any }[] = [];
const batchSize = 5;

for (const csvName of allCsvFiles) {
    const csv = fs.readFileSync(`./drivers_mc/${csvName}`, "utf8");
    const lines = csv.split("\n");
    let tempMCs: string[] = [];
    lines.forEach((line) => {
        tempMCs.push(line.split("-")[1]);
        if (tempMCs.length === batchSize) {
            sanatizedMCs.push(tempMCs);
            tempMCs = [];
        }
    });
    console.log(
        `\n\n========== ${csvName} has ${
            sanatizedMCs.length * batchSize
        } MCs. Extracting data ==========\n\n`
    );
    for (let i = 0; i < sanatizedMCs.length; i++) {
        await Promise.all(
            sanatizedMCs[i].map(async (MC) => {
                await getDriverData(MC);
            })
        );
        if (i % 10 === 0 && i !== 0) {
            fs.writeFileSync(
                `./drivers_data/${csvName.split(".")[0]}.json`,
                JSON.stringify(driversData, null, 2)
            );
        }
    }
    fs.writeFileSync(
        `./drivers_data/${csvName.split(".")[0]}.json`,
        JSON.stringify(driversData, null, 2)
    );
    fs.renameSync(`./drivers_mc/${csvName}`, `./drivers_mc/${csvName}.bak`);
    console.log(
        `\n\n========== ${csvName} has been processed with ${driversData.length} drivers. ==========\n\n`
    );
    sanatizedMCs = [];
    driversData = [];
}

async function getDriverData(MCNumber: string) {
    let retryTime = 5;
    let USDOTRequestResponse = await fetchUSDOT(MCNumber);
    while (USDOTRequestResponse === "Request was blocked") {
        console.error(
            `\x1b[31mRequest was blocked for MC-${MCNumber}. Retrying in ${retryTime} minutes \x1b[0m`
        );
        // This will hault the script for minium of 5 minutes after a block is detected
        await new Promise((resolve) => setTimeout(resolve, 60000 * retryTime));
        //retryTime++;
        USDOTRequestResponse = await fetchUSDOT(MCNumber);
    }
    if (!USDOTRequestResponse) {
        console.error(`\x1b[31mNo data for MC-${MCNumber} \x1b[0m`);
        return;
    }
    const parsedUSDOTRequestResponse = new JSDOM(USDOTRequestResponse).window
        .document;
    const usdotSelector = parsedUSDOTRequestResponse.querySelector<HTMLElement>(
        "body > p > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td > center:nth-child(3) > table > tbody > tr:nth-child(5) > td:nth-child(2)"
    );
    if (!usdotSelector) {
        console.error(`\x1b[31mNo data for MC-${MCNumber} \x1b[0m`);
        return;
    }
    const usdot = Number(usdotSelector.textContent);
    if (!usdot) {
        console.error(`\x1b[31mNo data for MC-${MCNumber} \x1b[0m`);
        return;
    }
    
    let driverDataRequest = await fetchDriverData(usdot);
    while (driverDataRequest === "Request was blocked") {
        console.error(
            `\x1b[31mRequest was blocked for MC-${MCNumber}. Retrying in ${retryTime} minutes \x1b[0m`
        );
        // This will hault the script for minium of 5 minutes after a block is detected
        await new Promise((resolve) => setTimeout(resolve, 60000 * retryTime));
        //retryTime++;
        driverDataRequest = await fetchDriverData(usdot);
    }
    if (!driverDataRequest) {
        console.error(
            `\x1b[31mNo registration box for MC-${MCNumber} USDOT-${usdot} \x1b[0m`
        );
        return;
    }
    const parsedDriverData = new JSDOM(driverDataRequest).window.document;
    const node = parsedDriverData.querySelector("#regBox");
    if (!node) {
        console.error(
            `\x1b[31mNo registration box for MC-${MCNumber} USDOT-${usdot} \x1b[0m`
        );
        return;
    }
    const result = {};

    // **1. Extract MCS-150 Date**
    const mcsDate = node.querySelector("h3 span")?.textContent?.trim();
    result["MCS-150 Date"] = mcsDate?.split(")")[0];

    // **1.5 Misc Data**
    result["MC Number"] = MCNumber;
    result[
        "Link"
    ] = `https://ai.fmcsa.dot.gov/SMS/Carrier/${usdot}/CarrierRegistration.aspx`;

    // **2. Extract Carrier Information (Left Column)**
    const col1Items = node.querySelectorAll("ul.col1 li");
    col1Items.forEach((li) => {
        const label = li
            .querySelector("label")
            ?.textContent?.replace(":", "")
            .trim();
        const value = li
            .querySelector<HTMLElement>("span.dat")
            ?.textContent?.trim();
        if (label == "Address") {
            result[label || ""] = value
                ?.replace(/\t/g, "")
                .replace(/\n/g, "")
                .replace(/\s{2,}/g, " ");
        } else {
            result[label || ""] = value;
        }
    });

    // **3. Extract Carrier Information (Right Column)**
    const col2Items = node.querySelectorAll("ul.col2 li");
    col2Items.forEach((li) => {
        const label = li
            .querySelector("label")
            ?.textContent?.replace(":", "")
            .trim();
        const value = li
            .querySelector<HTMLElement>("span.dat")
            ?.textContent?.trim();
        result[label || ""] = value;
    });

    // **4. Extract Operation Classification**
    result["Operation Classification"] = [];
    const opClassItems = node.querySelectorAll("ul.opClass li");
    opClassItems.forEach((li) => {
        if (li.classList.contains("checked")) {
            const text = li.textContent?.replace("X", "").trim();
            result["Operation Classification"].push(text);
        }
    });

    // **5. Extract Cargo Carried**
    result["Cargo Carried"] = [];
    const cargoItems = node.querySelectorAll<HTMLElement>("ul.cargo li");
    cargoItems.forEach((li) => {
        if (li.classList.contains("checked")) {
            const text = li.textContent?.replace("X", "").trim();
            result["Cargo Carried"].push(text);
        }
    });

    // **6. Extract Vehicle Type Breakdown**
    result["Vehicle Type Breakdown"] = [];
    const rows = node.querySelectorAll("table tbody tr");
    rows.forEach((tr) => {
        const cells = tr.querySelectorAll<HTMLElement>("th, td");
        const vehicleType = cells[0].textContent?.trim();
        const owned = cells[1].textContent?.trim();
        const termLeased = cells[2].textContent?.trim();
        const tripLeased = cells[3].textContent?.trim();

        result["Vehicle Type Breakdown"].push({
            "Vehicle Type": vehicleType,
            Owned: owned,
            "Term Leased": termLeased,
            "Trip Leased": tripLeased,
        });
    });
    console.log(`MC-${MCNumber} USDOT-${usdot} driver data extracted`);
    driversData.push(result);
}

async function fetchUSDOT(currentMC: string) {
    try {
        const requestData = {
            method: "POST",
            headers: {
                "Content-Type":
                    "content-type: application/x-www-form-urlencoded",
                "User-Agent":
                    userAgents[Math.floor(Math.random() * userAgents.length)],
            },
            body: `searchtype=ANY&query_type=queryCarrierSnapshot&query_param=MC_MX&query_string=${currentMC}`,
        };
        const request = await fetch(
            `https://safer.fmcsa.dot.gov/query.asp`,
            requestData
        );
        if (!request.ok) {
            return "Request was blocked";
        }
        const response = await request.text();
        return response;
    } catch (error) {
        console.error(
            `\x1b[31mError fetching USDOT for MC-${currentMC}. Your internet connection may be down. \x1b[0m`
        );
        // This will hault the script for minium of 5 minutes if the request failed for any reason
        return "Request was blocked";
    }
}

async function fetchDriverData(usdot: number) {
    try {
        const request = await fetch(
            `https://ai.fmcsa.dot.gov/SMS/Carrier/${usdot}/CarrierRegistration.aspx`
        );
        const response = await request.text();
        return response;
    } catch (error) {
        console.error(
            `\x1b[31mError fetching driver data for USDOT-${usdot}. Your internet connection may be down. \x1b[0m`
        );
        return "Request was blocked";
    }
}
