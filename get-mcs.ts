import fs from "fs";
import { JSDOM } from "jsdom";
import prompt from "prompt-sync";

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
	fs.mkdirSync("./drivers_mc");
} catch {}

let checkLastMC: string | null = null;
try {
	checkLastMC = fs.readFileSync("./drivers_mc/last-mc.txt", "utf8");
	if (checkLastMC) {
		console.log(`\x1b[32mLast MC is ${checkLastMC} \x1b[0m`);
	}
} catch {}

const allOldMCs = fs.readdirSync("./drivers_mc");

let date = new Date(checkLastMC || new Date().toDateString());

const totalDays = prompt({sigint: true})("How many days back do you want to go?: ");
let totalDaysNumber = Number(totalDays);
if (isNaN(totalDaysNumber)) {
	totalDaysNumber = 30;
	console.log(`\x1b[31mInvalid input. Defaulting to ${totalDaysNumber} days back. \x1b[0m`);
} else {
	console.log(`\x1b[32mGoing back ${totalDaysNumber} days. \x1b[0m`);
}

for (let i = 0; i < totalDaysNumber; i++) {
	const formatedDate = formatDate(date);
	if (allOldMCs.includes(`MC-${formatedDate}.csv`)) {
		date.setDate(date.getDate() - 1);
		continue;
	}
	const pageText = await fetchMCs(formatedDate);
	if (!pageText) {
		console.error(`\x1b[31mPage failed to load for MC-${formatedDate} \x1b[0m`);
		fs.writeFileSync("./drivers_mc/last-mc.txt", date.toDateString());
		date.setDate(date.getDate() - 1);
		continue;
	}
	const parsedPageText = new JSDOM(pageText).window.document;
	const data = await extractMC("body > font > table:nth-child(12)", parsedPageText);
	const data2 = await extractMC("body > font > table:nth-child(16)", parsedPageText);
	if (data.length === 0 && data2.length === 0) {
		console.log(`\x1b[31mNo data for MC-${formatedDate} \x1b[0m`);
		fs.writeFileSync("./drivers_mc/last-mc.txt", date.toDateString());
		date.setDate(date.getDate() - 1);
		continue;
	}
	fs.writeFileSync(`./drivers_mc/MC-${formatedDate}.csv`, data.join("\n") + "\n" + data2.join("\n"));
	fs.writeFileSync("./drivers_mc/last-mc.txt", date.toDateString());
	console.log(`\x1b[32mCompleted MC-${formatedDate} \x1b[0m`);
	date.setDate(date.getDate() - 1);
}


async function fetchMCs(dateString: string) {
	try {
		const requestData = {
			method: "POST",
			headers: {
				"Content-Type": "content-type: multipart/form-data",
			},
			body: `pd_date=${dateString}&pv_vpath=LIVIEW`,
		};
		const request = await fetch(`https://li-public.fmcsa.dot.gov/LIVIEW/PKG_register.prc_reg_detail`, requestData)
		const response = await request.text();
		return response;
	} catch {
		return null;
	}

}

async function extractMC(selector: string, parsedHtml: Document) {
	const tableSelector = parsedHtml.querySelector(selector);
	if (!tableSelector) {
		throw new Error("Could not find the table");
	}
	let allItems: string[] = [];
	tableSelector.querySelectorAll("th").forEach((row) => {
		allItems.push(row.textContent?.replace(/\t/g, '').replace(/\n/g, '') || "");
	});
	allItems.splice(0, 3);
	return allItems;
}


function formatDate(date: Date) {
	const day = String(date.getDate()).padStart(2, '0'); // Day with leading zero
	const monthIndex = date.getMonth(); // Month index (0-11)
	const year = String(date.getFullYear()).slice(-2); // Last two digits of the year

	const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
		"JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

	const month = monthNames[monthIndex];

	return `${day}-${month}-${year}`;
}
