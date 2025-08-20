# Geospatial Analysis Improvements

This document outlines the improvements made to the geospatial analysis functionality in the Dgraph Client App.

## Overview

The geospatial tab has been significantly enhanced to provide better discovery, querying, and visualization of geospatial data in Dgraph databases.

## Key Improvements

### 1. Enhanced Geospatial Predicate Discovery

The system now automatically discovers geospatial predicates by:

- **Comprehensive Pattern Matching**: Searches for 40+ common geospatial field names including:
  - Geometry fields: `geometry`, `coordinates`, `boundary`, `area`, `shape`
  - Coordinate fields: `lat`, `lng`, `latitude`, `longitude`, `x`, `y`
  - Address fields: `address`, `street`, `city`, `state`, `country`
  - Building fields: `building`, `floor`, `room`, `zone`
  - Natural features: `landmark`, `mountain`, `river`, `lake`, `forest`, `park`
  - Custom fields: `position`, `placement`, `site`, `venue`, `facility`

- **Smart Validation**: Tests each predicate to ensure it actually contains geospatial data
- **Data Sampling**: Analyzes sample nodes to find additional geospatial predicates

### 2. Comprehensive Query Structure

Queries now return all location-related fields through the `expand(_all_)` clause:

```dql
{
  q(func: has(geometry)) @filter(within(geometry, [[[-74.006, 40.7128], [-73.700, 40.900], [-74.006, 40.7128]]])) {
    uid
    dgraph.type
    geometry
    # All properties including location fields (no duplicates)
    expand(_all_)
  }
}
```

**Important**: Dgraph's `within()` function expects coordinates in **nested array format**: `[[[lng, lat], [lng, lat], ...]]`. The system automatically converts map coordinates to the correct format.

**Note**: We use `expand(_all_)` instead of explicitly listing location fields to avoid DQL errors about duplicate field references.

### 3. Enhanced Result Processing

- **Multiple Geometry Sources**: Tries multiple sources for geometry data:
  1. Primary geometry predicate (used in the query)
  2. Alternative geometry fields (`geometry`, `coordinates`, `location`, etc.)
  3. Coordinate fields (`lat`/`lng`, `latitude`/`longitude`, `x`/`y`)

- **Automatic Point Creation**: Creates Point geometries from coordinate pairs when no explicit geometry exists

- **Comprehensive Location Data**: Collects all location-related fields into `allLocationFields` property

### 4. Improved Map Rendering

- **Better Geometry Handling**: Supports multiple geometry formats and automatic conversion
- **Enhanced Properties**: Map features now include all location data and metadata
- **Fallback Rendering**: Creates map features even when primary geometry is missing
- **Interactive Features**: Click on any map marker to view detailed node information
- **Feature Popups**: Comprehensive popup showing UID, type, location fields, and properties
- **Visual Feedback**: Cursor changes to pointer when hovering over clickable features

### 5. Fallback Query System

When specific geospatial queries fail, the system:

1. **Comprehensive Fallback**: Queries for all nodes with potential geospatial data
2. **Smart Filtering**: Filters results to only include nodes with actual geospatial information
3. **Data Discovery**: Helps identify what geospatial data is available in the database

### 6. Testing and Debugging

- **Test Query Button**: Allows testing geospatial functionality without drawing polygons
- **Enhanced Logging**: Comprehensive logging for debugging geospatial queries
- **Error Handling**: Better error messages and fallback strategies

## Usage

### Basic Workflow

1. **Connect to Database**: Ensure connection to Dgraph database
2. **Test Functionality**: Click "Test Query" to discover available geospatial data
3. **Draw Query Area**: Use the map drawing tools to create a polygon, point, or line
4. **Execute Query**: Click "Execute Query" to find nodes within the drawn area
5. **View Results**: Results are displayed on the map and in the results table

### Advanced Features

- **Multiple Drawing Modes**: Polygon, point, and line drawing tools
- **Comprehensive Results**: View all location fields and properties for each result
- **Interactive Map**: Click on map features to see detailed information
- **Feature Popups**: Rich popup interface showing:
  - Basic node information (UID, type, geometry predicate)
  - All location fields with values
  - Node properties and metadata
  - Truncated display for long values with "show more" indicators
- **Visual Feedback**: Cursor changes to pointer when hovering over clickable features
- **Data Export**: Results can be analyzed and exported for further processing

## Technical Details

### Supported Geometry Formats

- **WKT (Well-Known Text)**: `POINT(-74.006 40.7128)`, `POLYGON(...)`, etc.
- **GeoJSON**: Standard GeoJSON geometry objects
- **Coordinate Objects**: `{lat: 40.7128, lng: -74.006}`
- **Coordinate Arrays**: `[longitude, latitude]` pairs

### DQL Coordinate Format

**Important**: Dgraph's `within()` function expects coordinates in **nested array format**, not WKT format!

- **Correct Dgraph format**: `[[[-74.006, 40.7128], [-73.700, 40.900], [-74.006, 40.7128]]]`
- **Incorrect WKT format**: `"POLYGON((-74.006 40.7128, -73.700 40.900, -74.006 40.7128))"`
- **Incorrect string format**: `"-74.006 40.7128, -73.700 40.900, -74.006 40.7128"`
- **Incorrect lat/lng format**: `[[40.7128, -74.006], [40.900, -73.700], [40.7128, -74.006]]`

The system automatically converts map coordinates (which are in `[longitude, latitude]` format) to the correct Dgraph nested array format.

### Query Optimization

- **Predicate Discovery**: Automatically finds the best predicates to use
- **Fallback Strategies**: Multiple query approaches for maximum compatibility
- **Error Recovery**: Graceful handling of query failures

### Performance Considerations

- **Smart Sampling**: Limits initial queries to reasonable sizes
- **Efficient Filtering**: Uses Dgraph's built-in spatial filtering when available
- **Result Limiting**: Configurable result limits to prevent overwhelming responses

## Troubleshooting

### Common Issues

1. **No Geospatial Data Found**
   - Use "Test Query" button to discover available data
   - Check if database contains location information
   - Verify Dgraph supports spatial queries

2. **Query Failures**
   - Check console logs for detailed error information
   - Try different drawing areas or query parameters
   - Use fallback queries for broader data discovery

3. **Map Rendering Issues**
   - Verify geometry data format
   - Check coordinate ranges (longitude: -180 to 180, latitude: -90 to 90)
   - Use test queries to validate data structure

4. **DQL Errors**
   - **"location not allowed multiple times in same sub-query"**: This error occurs when the same field is referenced multiple times. The system now uses `expand(_all_)` to avoid this issue.
   - **"while converting to subgraph"**: Usually indicates a DQL syntax error. Check that all predicates exist in your schema.
   - **Spatial function errors**: Ensure your Dgraph version supports spatial queries and that spatial indexes are properly configured.

5. **Coordinate Format Issues**
   - **"Invalid coordinates"**: Usually means coordinates are in wrong format. DQL expects `longitude latitude`, not `latitude longitude`.
   - **Coordinate range errors**: Longitude must be -180 to 180, latitude must be -90 to 90.
   - **Polygon not closed**: The first and last coordinates must be identical to form a closed polygon.
   - Use the "Test DQL Format" button to validate your coordinate format.

6. **WKT Format Errors**
   - **"Invalid coordinates" with WKT**: Dgraph's `within()` function does NOT accept WKT format like `"POLYGON((...))"`.
   - **Correct format**: Nested array format: `[[[-74.006, 40.7128], [-73.700, 40.900], [-74.006, 40.7128]]]`
   - **Remove WKT wrapper**: Never use `POLYGON()`, `POINT()`, etc. in Dgraph geospatial queries.
   - **Use nested arrays**: Dgraph expects `[[[lng, lat], [lng, lat], ...]]` format.

### Debug Information

The system provides extensive logging:
- Predicate discovery process
- Query generation and execution
- Result processing and validation
- Map rendering and feature creation

## Future Enhancements

- **Spatial Index Support**: Better integration with Dgraph spatial indexes
- **Advanced Queries**: Support for complex spatial relationships
- **Data Import**: Tools for importing and validating geospatial data
- **Performance Metrics**: Query performance analysis and optimization
- **Export Formats**: Support for various geospatial export formats

## Testing

Use the provided `test-geospatial.js` script to test geospatial functionality:

```bash
node test-geospatial.js
```

This script will:
1. Test basic database connectivity
2. Discover available geospatial predicates
3. Test specific geospatial queries
4. Validate spatial query functionality

## Conclusion

These improvements provide a robust, user-friendly interface for exploring geospatial data in Dgraph databases. The system automatically adapts to different data structures and provides comprehensive fallback options to ensure maximum compatibility and data discovery.
