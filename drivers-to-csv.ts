import fs from "fs";
import type { driver } from "./driver.d.ts";

try {
	fs.mkdirSync("./drivers_csv");
} catch {}

const allDrivers = fs.readdirSync("./drivers_data");

allDrivers.forEach((file) => {
	const drivers = JSON.parse(fs.readFileSync(`./drivers_data/${file}`, "utf8")) as driver[];
	let csv = "FRIST_NAME,EMAIL,SMS"
	
	for (const driver of drivers) {
		csv += `\n${driver["Legal Name"]},${driver.Email.toLowerCase()},${driver.Telephone.replace('(', '').replace(')', '')}`;
	}
	
	fs.writeFileSync(`./drivers_csv/${file.split(".")[0]}.csv`, csv);

});

