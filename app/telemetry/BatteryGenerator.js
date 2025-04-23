const Chance = require('chance');
const chance = new Chance();

// Using MAX17048 to gauge the voltage, percentage, and current

class BatteryDataGenerator {
    constructor() {
        this.minVoltage = 3.0;  // Minimum voltage (0%)
        this.maxVoltage = 4.2;  // Maximum voltage (100%)
        this.voltage = chance.floating({ min: 3.3, max: 4.2, fixed: 3 }); // Initial voltage
        this.percentage = this.voltageToPercentage(this.voltage); // Initial percentage
        this.current = 0; // Initial current in amperes (A)
        this.isCharging = false; // Track if the battery is charging
    }

    // Convert voltage to percentage (linear approximation)
    voltageToPercentage(voltage) {
        return parseFloat(((voltage - this.minVoltage) / (this.maxVoltage - this.minVoltage) * 100).toFixed(1));
    }

    // Simulate current based on charging/discharging state
    simulate() {
        if (this.isCharging) {
            // Charging: current is negative (e.g., -1.5A)
            this.current = -chance.floating({ min: 0.5, max: 2.0, fixed: 2 });
            this.voltage += chance.floating({ min: 0, max: 0.01, fixed: 3 }); // Simulate small changes
        } else {
            // Discharging: current is positive (e.g., 1.2A)
            this.current = chance.floating({ min: 0.1, max: 2.0, fixed: 2 });
            this.voltage += chance.floating({ min: -0.01, max: 0, fixed: 3 }); // Simulate small changes
        }
    }

    // Update voltage, percentage, and current
    update() {
        // Simulate charging/discharging state
        if (this.percentage <= 20 && !this.isCharging) {
            this.isCharging = true; // Start charging if battery is low
        } else if (this.percentage >= 95 && this.isCharging) {
            this.isCharging = false; // Stop charging if battery is full
        }

        // Simulate current and voltage
        this.simulate();
        // Update voltage and percentage
        this.voltage = Math.min(this.maxVoltage, Math.max(this.minVoltage, this.voltage)); // Clamp voltage
        this.percentage = this.voltageToPercentage(this.voltage); // Update percentage
    }

    // Generate raw data (voltage, percentage, and current)
    generateRawData() {
        this.update();
        return {
            voltage: parseFloat(this.voltage.toFixed(3)), // Voltage with 3 decimal places
            percentage: parseFloat(this.percentage.toFixed(1)), // Percentage with 1 decimal place
            current: parseFloat(this.current.toFixed(2)), // Current with 2 decimal places
            status: this.isCharging ? "Charging" : "Discharging" // Charging/discharging status
        };
    }

    start() {
        console.log("Starting Data Generation...");

        // Generate values continuously
        setInterval(() => {
            console.log(this.generateRawData());
        }, 1000);

        // Handle Ctrl+C
        process.on('SIGINT', () => {
            console.log('\nData generation stopped.');
            process.exit();
        });
    }
}

// Export the class for use in other files
module.exports = BatteryDataGenerator;

// Initialize and start the BatteryGenerator
const batteryGenerator = new BatteryDataGenerator();
batteryGenerator.start();