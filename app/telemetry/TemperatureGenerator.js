const Chance = require('chance'); 
const chance = new Chance(); 
  
class LM35TemperatureGenerator { 
    constructor() { 
        // Define temperature limits 
        this.minTemperature = 20.0; // Minimum realistic temperature (°C) 
        this.maxTemperature = 40.0; // Maximum realistic temperature (°C) 
         
        // Initialize temperature 
        this.currentTemperature = chance.floating({ min: 25.0, max: 30.0, fixed: 2 }); 
// Start within normal room temperature 
         
        // Compute initial voltage 
        this.voltage = this.temperatureToVoltage(this.currentTemperature); 
    } 
  
    // Convert temperature to LM35 voltage 
    temperatureToVoltage(temperature) { 
        return parseFloat((temperature / 100).toFixed(3)); // Voltage = Temperature/100 
    } 
  
    // Simulate temperature changes 
    simulate() { 
        // Generate small random temperature fluctuation 
        let tempChange = chance.floating({ min: -0.5, max: 0.5, fixed: 2 }); 
         
        // Apply change while keeping temperature within limits 
        this.currentTemperature = Math.max(this.minTemperature, 
Math.min(this.maxTemperature, this.currentTemperature + tempChange)); 
         
        // Update voltage based on new temperature 
        this.voltage = this.temperatureToVoltage(this.currentTemperature); 
    } 
  
    // Generate real-time voltage output 
    generateRawData() { 
        this.simulate(); 
         
        return { 
            voltage: this.voltage, // Output only voltage, like an actual LM35 sensor 
        }; 
    } 

start() { 
console.log("Starting LM35 Temperature Data Generation..."); 
// Generate values continuously 
setInterval(() => { 
console.log(this.generateRawData()); 
}, 1000); 
// Handle Ctrl+C to stop the program gracefully 
process.on('SIGINT', () => { 
console.log('\nLM35 data generation stopped.'); 
process.exit(); 
}); 
} 
} 
// Export the class for use in other files 
module.exports = LM35TemperatureGenerator; 
// Initialize and start the LM35 Generator 
const lm35Generator = new LM35TemperatureGenerator(); 
lm35Generator.start(); 