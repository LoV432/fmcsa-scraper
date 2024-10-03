export type driver = {
    "MCS-150 Date": string;
    "MC Number": string;
    Link: string;
    "Legal Name": string;
    "DBA Name": string;
    "U.S. DOT#": string;
    Address?: string;
    Telephone?: string;
    Fax?: string;
    Email?: string;
    "Vehicle Miles Traveled": string;
    "VMT Year": string;
    "Power Units": string;
    "DUNS Number": string;
    Drivers: string;
    "Carrier Operation": string;
    Passenger: string;
    HM: string;
    HHG: string;
    "New Entrant": string;
    "Operation Classification": string[];
    "Cargo Carried": string[];
    "Vehicle Type Breakdown": VehicleTypeBreakdown[];
};

export type VehicleTypeBreakdown = {
    "Vehicle Type": string;
    Owned: string;
    "Term Leased": string;
    "Trip Leased": string;
};
