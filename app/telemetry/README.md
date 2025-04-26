# Telemetry System

This section of the application provides real-time telemetry data visualization and monitoring for various sensors.

## Architecture

The telemetry system uses the following architecture:

1. **Data Generators** - TypeScript classes that simulate real sensor data
   - Located in `/lib/generators/`
   - Includes battery, temperature, GNSS, and gas sensors (CO, NO2, SO2)

2. **Database Models** - Prisma models to store historical telemetry data
   - Models defined in `/prisma/schema.prisma`

3. **API Endpoints** - Next.js API routes for data access
   - `/api/telemetry` - Generates and returns real-time data
   - `/api/telemetry/history` - Retrieves historical data with filtering

4. **React Components** - UI components for data visualization
   - Located in the telemetry page and supporting components

## Available Sensors

1. **Battery** - Simulates battery voltage, percentage, and charging status
2. **Temperature** - Simulates temperature readings using an LM35 sensor model
3. **GNSS (GPS)** - Simulates location data with NMEA format output
4. **Gas Sensors**:
   - **CO** - Carbon Monoxide sensor
   - **NO2** - Nitrogen Dioxide sensor
   - **SO2** - Sulfur Dioxide sensor

## Data Flow

1. Client requests data from `/api/telemetry`
2. Server generates new simulated sensor readings
3. Data is saved to the database for historical records
4. Real-time data is returned to the client for display
5. UI components render the data with appropriate visualizations

## Historical Data

Historical data can be retrieved through the `/api/telemetry/history` endpoint with various filtering options:

- `sensorType` - Filter by sensor type (battery, temperature, gnss, gas)
- `gasType` - Filter by gas type (CO, NO2, SO2)
- `startTime` and `endTime` - Filter by time range
- `limit` and `page` - Pagination options

## Development

To extend the telemetry system:

1. Add new sensor types in `/lib/generators/`
2. Update the database schema in `prisma/schema.prisma`
3. Update API endpoints to handle the new sensor types
4. Create or update UI components to visualize the new data 