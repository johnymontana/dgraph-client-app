'use client';

import React, { useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  Badge,
  Flex,
} from '@chakra-ui/react';

interface PropertyAnalysisProps {
  data: any;
}

interface PropertyStats {
  name: string;
  type: string;
  count: number;
  uniqueValues: number;
  distribution: { [key: string]: number };
  sampleValues: any[];
  isNumeric: boolean;
  min?: number;
  max?: number;
  avg?: number;
}

// Simple CSS-based bar chart component as fallback
const SimpleBarChart: React.FC<{ stat: PropertyStats }> = ({ stat }) => {
  // Convert distribution to sorted array
  const sortedData = Object.entries(stat.distribution)
    .sort(([,a], [,b]) => b - a) // Sort by count descending
    .slice(0, 10); // Show top 10 values
  
  const maxCount = Math.max(...sortedData.map(([,count]) => count));
  
  return (
    <Box>
      <Text fontSize="sm" color="gray.600" mb={2}>
        Top Value Distribution
      </Text>
      <Box height="150px" width="100%" overflowY="auto">
        {sortedData.length > 0 ? (
          <VStack gap={1} align="stretch">
            {sortedData.map(([value, count], index) => {
              const percentage = (count / maxCount) * 100;
              const displayValue = String(value).length > 15 
                ? String(value).substring(0, 15) + '...' 
                : String(value);
              
              return (
                <Flex key={index} align="center" gap={2}>
                  <Text fontSize="xs" minW="80px" color="gray.700" title={String(value)}>
                    {displayValue}
                  </Text>
                  <Box flex={1} position="relative">
                    <Box 
                      height="20px" 
                      bg="blue.100" 
                      borderRadius="2px"
                      position="relative"
                      overflow="hidden"
                    >
                      <Box 
                        height="100%" 
                        bg="blue.500" 
                        width={`${percentage}%`}
                        borderRadius="2px"
                        transition="width 0.3s ease"
                      />
                      <Text 
                        position="absolute" 
                        right={2} 
                        top="50%" 
                        transform="translateY(-50%)"
                        fontSize="xs" 
                        color="gray.600"
                        fontWeight="medium"
                      >
                        {count}
                      </Text>
                    </Box>
                  </Box>
                </Flex>
              );
            })}
          </VStack>
        ) : (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
            No data to display
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default function PropertyAnalysis({ data }: PropertyAnalysisProps) {
  const propertyStats = useMemo(() => {
    console.log('PropertyAnalysis received data:', data);
    
    if (!data || typeof data !== 'object') {
      console.log('No valid data received');
      return [];
    }

    const stats: PropertyStats[] = [];
    
    // Handle Dgraph response structure
    let processedData: any[];
    if (data.data && typeof data.data === 'object') {
      // This is a Dgraph response, extract the actual data
      const responseData = data.data;
      const queryKey = Object.keys(responseData)[0];
      if (queryKey && responseData[queryKey]) {
        processedData = Array.isArray(responseData[queryKey]) ? responseData[queryKey] : [responseData[queryKey]];
      } else {
        processedData = [];
      }
    } else if (Array.isArray(data)) {
      processedData = data;
    } else {
      processedData = [data];
    }
    
    console.log('Processed data for analysis:', processedData);

    if (processedData.length === 0) {
      console.log('No processed data to analyze');
      return [];
    }

    // Get all unique property names from the data
    const allProperties = new Set<string>();
    processedData.forEach(item => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(key => {
          if (key !== 'uid' && key !== 'dgraph.type') {
            allProperties.add(key);
          }
        });
      }
    });

    // Analyze each property
    allProperties.forEach(propName => {
      const values = processedData
        .map(item => item?.[propName])
        .filter(val => val !== undefined && val !== null);

      if (values.length === 0) return;

      const uniqueValues = new Set(values).size;
      const distribution: { [key: string]: number } = {};
      let isNumeric = true;
      const numericValues: number[] = [];

      // Build distribution and check if numeric
      values.forEach(value => {
        let strValue: string;
        
        // Handle nested objects (like allergy_of with uid, name, etc.)
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // For objects, try to extract meaningful identifiers
          if ('uid' in value && 'name' in value) {
            strValue = `uid:${value.uid} (${value.name})`;
          } else if ('uid' in value) {
            strValue = `uid:${value.uid}`;
          } else if ('name' in value) {
            strValue = String(value.name);
          } else {
            // Fallback: use first available property
            const firstKey = Object.keys(value)[0];
            strValue = firstKey ? `${firstKey}:${value[firstKey]}` : 'nested_object';
          }
        } else if (Array.isArray(value)) {
          // For arrays, show count and first item
          strValue = `array[${value.length}]`;
        } else {
          strValue = String(value);
        }
        
        distribution[strValue] = (distribution[strValue] || 0) + 1;
        
        if (isNumeric) {
          const num = Number(value);
          if (isNaN(num)) {
            isNumeric = false;
          } else {
            numericValues.push(num);
          }
        }
      });

      // Calculate numeric stats
      let min: number | undefined;
      let max: number | undefined;
      let avg: number | undefined;

      if (isNumeric && numericValues.length > 0) {
        min = Math.min(...numericValues);
        max = Math.max(...numericValues);
        avg = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      }

      // Get sample values (first 5 unique values)
      const sampleValues = Object.keys(distribution).slice(0, 5);

      stats.push({
        name: propName,
        type: isNumeric ? 'numeric' : 'categorical',
        count: values.length,
        uniqueValues,
        distribution,
        sampleValues,
        isNumeric,
        min,
        max,
        avg,
      });
    });

    // Sort by count (most frequent first)
    return stats.sort((a, b) => b.count - a.count);
  }, [data]);

  if (propertyStats.length === 0) {
    return (
      <Card.Root variant="elevated" p={4}>
        <Text textStyle="body.medium" textAlign="center" color="fg.muted">
          No properties found to analyze
        </Text>
      </Card.Root>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      <Heading textStyle="heading.section" size="md">
        Property Analysis
      </Heading>
      
      <Text textStyle="body.small" color="fg.muted">
        Distribution analysis of {propertyStats.length} properties across {Array.isArray(data) ? data.length : 1} results
      </Text>

      <VStack gap={3} align="stretch">
        {propertyStats.map((stat) => (
          <Card.Root key={stat.name} variant="outline" p={4}>
            <VStack gap={3} align="stretch">
              {/* Property header */}
              <Flex justify="space-between" align="center">
                <HStack gap={2}>
                  <Text textStyle="body.medium" fontWeight="semibold">
                    {stat.name}
                  </Text>
                  <Badge
                    variant="subtle"
                    colorPalette={stat.isNumeric ? 'blue' : 'green'}
                    size="sm"
                  >
                    {stat.isNumeric ? 'Numeric' : 'Categorical'}
                  </Badge>
                </HStack>
                
                <HStack gap={4} fontSize="sm" color="fg.muted">
                  <Text>Count: {stat.count}</Text>
                  <Text>Unique: {stat.uniqueValues}</Text>
                </HStack>
              </Flex>

              {/* Distribution chart */}
              <SimpleBarChart stat={stat} />

              {/* Property details */}
              <HStack gap={4} align="start" fontSize="sm">
                {/* Sample values */}
                <Box flex={1}>
                  <Text fontWeight="medium" mb={1}>
                    Sample Values
                  </Text>
                  <HStack gap={1} flexWrap="wrap">
                    {stat.sampleValues.map((value, valueIndex) => {
                      // Handle nested objects in sample values display
                      let displayValue: string;
                      let tooltipValue: string;
                      
                      if (value && typeof value === 'object' && !Array.isArray(value)) {
                        if ('uid' in value && 'name' in value) {
                          displayValue = `${value.name}`;
                          tooltipValue = `uid: ${value.uid}, name: ${value.name}`;
                        } else if ('uid' in value) {
                          displayValue = `uid:${value.uid.substring(0, 8)}...`;
                          tooltipValue = `uid: ${value.uid}`;
                        } else if ('name' in value) {
                          displayValue = String(value.name);
                          tooltipValue = `name: ${value.name}`;
                        } else {
                          displayValue = 'nested';
                          tooltipValue = JSON.stringify(value);
                        }
                      } else if (Array.isArray(value)) {
                        displayValue = `[${value.length}]`;
                        tooltipValue = `Array with ${value.length} items`;
                      } else {
                        displayValue = String(value);
                        tooltipValue = String(value);
                      }
                      
                      return (
                        <Badge 
                          key={valueIndex} 
                          variant="subtle" 
                          size="sm" 
                          title={`${tooltipValue} (Count: ${stat.distribution[value]})`}
                        >
                          {displayValue.length > 20 
                            ? displayValue.substring(0, 20) + '...' 
                            : displayValue
                          }
                        </Badge>
                      );
                    })}
                    {stat.uniqueValues > 5 && (
                      <Badge variant="subtle" size="sm">
                        +{stat.uniqueValues - 5} more
                      </Badge>
                    )}
                  </HStack>
                </Box>

                {/* Numeric stats */}
                {stat.isNumeric && stat.min !== undefined && (
                  <Box flex={1}>
                    <Text fontWeight="medium" mb={1}>
                      Numeric Stats
                    </Text>
                    <VStack gap={1} align="start">
                      <Text>Min: {stat.min?.toFixed(2)}</Text>
                      <Text>Max: {stat.max?.toFixed(2)}</Text>
                      <Text>Avg: {stat.avg?.toFixed(2)}</Text>
                    </VStack>
                  </Box>
                )}
              </HStack>
            </VStack>
          </Card.Root>
        ))}
      </VStack>
    </VStack>
  );
}
