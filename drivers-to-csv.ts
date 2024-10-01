import fs from "fs";
import type { driver } from "./driver.d.ts";

try {
    fs.mkdirSync("./drivers_csv");
} catch {}

const allDrivers = fs.readdirSync("./drivers_data");

allDrivers.forEach((file) => {
    const drivers = JSON.parse(
        fs.readFileSync(`./drivers_data/${file}`, "utf8")
    ) as driver[];
    let csv = "DATE,MC,USDOT,FULL_NAME,EMAIL,PHONE,ADDRESS,DRIVERS,POWER UNITS,CARRIER OPERATION,Straight Trucks,Truck Tractors,Trailers*,Hazmat Cargo Tank Trailers*,Hazmat Cargo Tank Trucks,Motor Coach,School Bus 1-8*,School Bus 9-15,School Bus 16+,Mini Bus 16+,Van 1-8*,Van 9-5,Limousine 1-8*,Limousine 9-15,Limousine 16+";

    for (const driver of drivers) {
        const date = driver["MCS-150 Date"] || "";
        const mc = driver["MC Number"] || "";
        const USDOT = driver["U.S. DOT#"] || "";
        const legalName = driver["Legal Name"] || "";
        const email = driver.Email.toLowerCase();
        const phone = driver.Telephone.replace("(", "").replace(")", "") || "";
        const address = `"${driver.Address.replace(/\n/g, "")}"` || "";
        const drivers = driver["Drivers"] || "";
        const powerUnits = driver["Power Units"] || "";
        const carrierOperation = driver["Carrier Operation"] || "";
        const straightTrucks = driver["Vehicle Type Breakdown"][0]["Owned"] || "";
        const truckTractors = driver["Vehicle Type Breakdown"][1]["Owned"] || "";
        const trailers = driver["Vehicle Type Breakdown"][2]["Owned"] || "";
        const hazmatTrailers = driver["Vehicle Type Breakdown"][3]["Owned"] || "";
        const hazmatTrucks = driver["Vehicle Type Breakdown"][4]["Owned"] || "";
        const motorCoach = driver["Vehicle Type Breakdown"][5]["Owned"] || "";
        const schoolBus1 = driver["Vehicle Type Breakdown"][6]["Owned"] || "";
        const schoolBus2 = driver["Vehicle Type Breakdown"][7]["Owned"] || "";
        const schoolBus3 = driver["Vehicle Type Breakdown"][8]["Owned"] || "";
        const miniBus1 = driver["Vehicle Type Breakdown"][9]["Owned"] || "";
        const miniBus2 = driver["Vehicle Type Breakdown"][10]["Owned"] || "";
        const van1 = driver["Vehicle Type Breakdown"][11]["Owned"] || "";
        const van2 = driver["Vehicle Type Breakdown"][12]["Owned"] || "";
        const limousine1 = driver["Vehicle Type Breakdown"][13]["Owned"] || "";
        const limousine2 = driver["Vehicle Type Breakdown"][14]["Owned"] || "";
        csv += `\n${date},${mc},${USDOT},${legalName},${email},${phone},${address},${drivers},${powerUnits},${carrierOperation},${straightTrucks},${truckTractors},${trailers},${hazmatTrailers},${hazmatTrucks},${motorCoach},${schoolBus1},${schoolBus2},${schoolBus3},${miniBus1},${miniBus2},${van1},${van2},${limousine1},${limousine2}`;
    }

    fs.writeFileSync(`./drivers_csv/drivers_data.csv`, csv);
});
