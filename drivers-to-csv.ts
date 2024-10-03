import fs from "fs";
import type { driver } from "./driver.d.ts";

try {
    fs.mkdirSync("./drivers_csv");
} catch {}

const allDrivers = fs.readdirSync("./drivers_data");

let csv = "INDEX,DATE,MC,USDOT,FULL_NAME,EMAIL,PHONE,ADDRESS,DRIVERS,POWER UNITS,CARRIER OPERATION,Straight Trucks,Truck Tractors,Trailers*,Hazmat Cargo Tank Trailers*,Hazmat Cargo Tank Trucks,Motor Coach,School Bus 1-8*,School Bus 9-15,School Bus 16+,Mini Bus 16+,Van 1-8*,Van 9-5,Limousine 1-8*,Limousine 9-15,Limousine 16+";
let i = 0;
allDrivers.forEach((file) => {
    const drivers = JSON.parse(
        fs.readFileSync(`./drivers_data/${file}`, "utf8")
    ) as driver[];

    for (const driver of drivers) {
        try {
            const index = i++;
            const date = driver["MCS-150 Date"] || "";
            const mc = driver["MC Number"] || "";
            const USDOT = driver["U.S. DOT#"] || "";
            const legalName = driver["Legal Name"].replace(/,/g, "") || "";
            const email = driver.Email?.toLowerCase().replace(/,/g, "") || "";
            const phone = driver.Telephone?.replace("(", "").replace(")", "") || "";
            const address = `"${driver.Address?.replace(/\n/g, "")}"` || "";
            const drivers = driver["Drivers"].replace(/,/g, "") || "";
            const powerUnits = driver["Power Units"].replace(/,/g, "") || "";
            const carrierOperation = driver["Carrier Operation"] || "";
            const straightTrucks = driver["Vehicle Type Breakdown"][0]["Owned"].replace(/,/g, "") || "";
            const truckTractors = driver["Vehicle Type Breakdown"][1]["Owned"].replace(/,/g, "") || "";
            const trailers = driver["Vehicle Type Breakdown"][2]["Owned"].replace(/,/g, "") || "";
            const hazmatTrailers = driver["Vehicle Type Breakdown"][3]["Owned"].replace(/,/g, "") || "";
            const hazmatTrucks = driver["Vehicle Type Breakdown"][4]["Owned"].replace(/,/g, "") || "";
            const motorCoach = driver["Vehicle Type Breakdown"][5]["Owned"].replace(/,/g, "") || "";
            const schoolBus1 = driver["Vehicle Type Breakdown"][6]["Owned"].replace(/,/g, "") || "";
            const schoolBus2 = driver["Vehicle Type Breakdown"][7]["Owned"].replace(/,/g, "") || "";
            const schoolBus3 = driver["Vehicle Type Breakdown"][8]["Owned"].replace(/,/g, "") || "";
            const miniBus1 = driver["Vehicle Type Breakdown"][9]["Owned"].replace(/,/g, "") || "";
            const miniBus2 = driver["Vehicle Type Breakdown"][10]["Owned"].replace(/,/g, "") || "";
            const van1 = driver["Vehicle Type Breakdown"][11]["Owned"].replace(/,/g, "") || "";
            const van2 = driver["Vehicle Type Breakdown"][12]["Owned"].replace(/,/g, "") || "";
            const limousine1 = driver["Vehicle Type Breakdown"][13]["Owned"].replace(/,/g, "") || "";
            const limousine2 = driver["Vehicle Type Breakdown"][14]["Owned"].replace(/,/g, "") || "";
            csv += `\n${i},${date},${mc},${USDOT},${legalName},${email},${phone},${address},${drivers},${powerUnits},${carrierOperation},${straightTrucks},${truckTractors},${trailers},${hazmatTrailers},${hazmatTrucks},${motorCoach},${schoolBus1},${schoolBus2},${schoolBus3},${miniBus1},${miniBus2},${van1},${van2},${limousine1},${limousine2}`;
        } catch (e) {
            console.log(driver);
            console.log(e);
            process.exit(1);
        }
    }

});

fs.writeFileSync(`./drivers_csv/drivers_data.csv`, csv);