const Chance = require('chance');
const chance = new Chance();

class GasSensorDataGenerator {
  constructor(customConfig = {}) {
    // Merge custom config with defaults
    this.CONFIG = { ...this.DEFAULT_CONFIG, ...customConfig };

    this.state = {
      baseValue: chance.floating({ min: this.CONFIG.BASE_MIN, max: this.CONFIG.BASE_MAX }),
      activePeak: 0,
      peakDuration: 0,
      timeStep: 0
    };
  }

  // Default configuration
  DEFAULT_CONFIG = {
    BASE_MIN: 200,
    BASE_MAX: 400,
    BASE_DRIFT: 0.2,
    FLUCTUATION_AMPLITUDE: 30,
    FLUCTUATION_PERIOD: 40, // 5 minutes in seconds
    PEAK_PROBABILITY: 5,   // 1.5% chance per second
    NOISE_RANGE: 2,
    PEAK_MIN: 250,
    PEAK_MAX: 500,
    PEAK_DURATION: { min: 10, max: 30 }
  };

  // Clamp value between 0 and 1023
  clampValue(value) {
    return Math.min(1023, Math.max(0, Math.round(value)));
  }

  // Generate sensor value
  generateSensorValue() {
    // Base value drift
    this.state.baseValue += chance.normal({
      mean: 0,
      dev: this.CONFIG.BASE_DRIFT,
      min: -this.CONFIG.BASE_DRIFT,
      max: this.CONFIG.BASE_DRIFT
    });
    this.state.baseValue = this.clampValue(this.state.baseValue);

    // Environmental fluctuations
    const fluctuation = this.CONFIG.FLUCTUATION_AMPLITUDE * 
      Math.sin(2 * Math.PI * this.state.timeStep / this.CONFIG.FLUCTUATION_PERIOD);
    this.state.timeStep = (this.state.timeStep + 1) % this.CONFIG.FLUCTUATION_PERIOD;

    // CO peak detection and decay
    let peakEffect = 0;
    if (this.state.peakDuration > 0) {
      peakEffect = this.state.activePeak * (this.state.peakDuration / this.state.peakInitialDuration);
      this.state.peakDuration--;
    } else if (chance.bool({ likelihood: this.CONFIG.PEAK_PROBABILITY })) {
      this.state.activePeak = chance.floating({ 
        min: this.CONFIG.PEAK_MIN, 
        max: this.CONFIG.PEAK_MAX,
        fixed: 2
      });
      this.state.peakInitialDuration = chance.integer(this.CONFIG.PEAK_DURATION);
      this.state.peakDuration = this.state.peakInitialDuration;
    }

    // Combine components with sensor noise
    const noise = chance.floating({ 
      min: -this.CONFIG.NOISE_RANGE, 
      max: this.CONFIG.NOISE_RANGE,
      fixed: 2
    });
    
    const rawValue = this.state.baseValue + fluctuation + peakEffect + noise;
    return this.clampValue(rawValue);
  }

  // Generate raw data (sensor value)
  generateRawData() {
    return {
      sensorValue: this.generateSensorValue()
    };
  }

  start() {
    console.log("Starting Data Generation..")

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
module.exports = GasSensorDataGenerator;

// Initialize and start the GasGenerator
const gasGenerator = new GasSensorDataGenerator();
gasGenerator.start();