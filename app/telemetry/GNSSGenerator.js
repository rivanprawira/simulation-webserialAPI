const Chance = require('chance'); 
const chance = new Chance(); 
  
class GNSSDataGenerator { 
    constructor() { 
        // Initialize realistic starting position (Example: New York) 
        this.currentLat = 40.7128; // Latitude (°) 
        this.currentLon = -74.0060; // Longitude (°) 
        this.currentAltitude = 10.0; // Altitude in meters 
        this.hdop = 0.9; // Initial HDOP value 
        this.satellites = chance.integer({ min: 6, max: 12 }); // Number of satellites 
        this.fixType = 1; // 1 = GPS fix 
    } 
  
    // Simulate smooth movement (small latitude/longitude changes) 
    simulateMovement() { 
        this.currentLat += chance.floating({ min: -0.0005, max: 0.0005, fixed: 6 }); 
        this.currentLon += chance.floating({ min: -0.0005, max: 0.0005, fixed: 6 }); 
        this.currentAltitude += chance.floating({ min: -0.2, max: 0.2, fixed: 1 }); 
  
        // Slight fluctuation in HDOP and satellite count 
        this.hdop = chance.floating({ min: 0.5, max: 1.5, fixed: 1 }); 
        this.satellites = chance.integer({ min: 6, max: 12 }); 
    } 
  
    // Convert Latitude & Longitude to NMEA format 
    formatNMEA(value, directionPositive, directionNegative) { 
        let degrees = Math.floor(Math.abs(value)); 
        let minutes = (Math.abs(value) - degrees) * 60; 
        let direction = value >= 0 ? directionPositive : directionNegative; 
        return `${degrees}${minutes.toFixed(3)},${direction}`; 
    } 
  
    // Compute XOR checksum for NMEA data 
    computeChecksum(sentence) { 
        let checksum = sentence.split('').reduce((acc, char) => acc ^ 
char.charCodeAt(0), 0); 
        return checksum.toString(16).toUpperCase().padStart(2, '0'); 
    } 
  
    // Generate NMEA GNSS data 
    generateRawData() { 
        this.simulateMovement(); // Update GNSS values 
  
        // Get UTC time in HHMMSS format 
        let now = new Date(); 
        let utcTime = now.getUTCHours().toString().padStart(2, '0') + 
                      now.getUTCMinutes().toString().padStart(2, '0') + 
                      now.getUTCSeconds().toString().padStart(2, '0'); 
  
        // Format Latitude & Longitude 
        let latitude = this.formatNMEA(this.currentLat, "N", "S"); 
        let longitude = this.formatNMEA(this.currentLon, "E", "W"); 
  
        // Construct raw NMEA sentence (without checksum) 
        let rawData = `$GPGGA,${utcTime},${latitude},${longitude},${this.fixType},${this.satellites},${this.hdop},${this.currentAltitude.toFixed(1)},M,,M,,`; 

        // Calculate checksum 
        let checksum = this.computeChecksum(rawData); 

        return `${rawData}*${checksum}`; 
    } 

    start() { 
        console.log("Starting GNSS Data Generation..."); 
        // Generate values continuously 
        setInterval(() => { 
            console.log(this.generateRawData()); 
        }, 1000); 

        // Handle Ctrl+C to stop the program gracefully 
        process.on('SIGINT', () => { 
            console.log('\nGNSS data generation stopped.'); 
            process.exit(); 
        }); 
    } 
} 

// Export the class for use in other files 
module.exports = GNSSDataGenerator; 

// Initialize and start the GNSS Generator 
const gnssGenerator = new GNSSDataGenerator(); 
gnssGenerator.start(); 