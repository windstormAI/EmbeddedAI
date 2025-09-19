/**
 * Advanced Component Library
 * Enhanced library with IoT devices, sensors, and actuators
 */

import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Wifi,
  Bluetooth,
  Radio,
  Zap,
  Thermometer,
  Eye,
  Volume2,
  RotateCcw,
  Lightbulb,
  Square,
  Circle,
  Triangle,
  Settings,
  Search,
  Filter,
  Star,
  Download,
  Upload,
  Heart,
  Battery,
  Gauge,
  Wind,
  Droplets,
  Sun,
  Moon,
  Cloud,
  Zap as Lightning
} from 'lucide-react';

const AdvancedComponentLibrary = ({
  onComponentDrag,
  onComponentSelect
}) => {
  const [favorites, setFavorites] = useState(new Set(JSON.parse(localStorage.getItem('componentFavorites') || '[]')));
  const [recentlyUsed, setRecentlyUsed] = useState(new Set(JSON.parse(localStorage.getItem('recentlyUsedComponents') || '[]')));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);

  // Enhanced component library with IoT and advanced features
  const componentLibrary = useMemo(() => [
    // Microcontrollers & Boards
    {
      id: 'arduino-uno-r3',
      name: 'Arduino Uno R3',
      category: 'microcontroller',
      subcategory: 'arduino',
      icon: Cpu,
      color: '#00979C',
      size: { width: 120, height: 80 },
      pins: 20,
      voltage: 5.0,
      price: 23.00,
      inStock: true,
      featured: true,
      specifications: {
        microcontroller: 'ATmega328P',
        clockSpeed: 16,
        flashMemory: 32,
        sram: 2,
        eeprom: 1,
        digitalPins: 14,
        analogPins: 6,
        pwmPins: [3, 5, 6, 9, 10, 11]
      },
      compatibility: ['arduino', 'avr'],
      tags: ['arduino', 'uno', 'atmega328p', 'beginner']
    },
    {
      id: 'esp32-wroom-32',
      name: 'ESP32-WROOM-32',
      category: 'microcontroller',
      subcategory: 'esp32',
      icon: Wifi,
      color: '#E7352C',
      size: { width: 100, height: 60 },
      pins: 38,
      voltage: 3.3,
      price: 15.00,
      inStock: true,
      featured: true,
      specifications: {
        microcontroller: 'ESP32',
        clockSpeed: 240,
        flashMemory: 512,
        sram: 520,
        wifi: true,
        bluetooth: true,
        digitalPins: 34,
        analogPins: 18,
        touchPins: 10
      },
      compatibility: ['esp32', 'esp-idf', 'arduino'],
      tags: ['esp32', 'wifi', 'bluetooth', 'iot', 'advanced']
    },
    {
      id: 'raspberry-pi-pico',
      name: 'Raspberry Pi Pico',
      category: 'microcontroller',
      subcategory: 'raspberry-pi',
      icon: Cpu,
      color: '#A22846',
      size: { width: 85, height: 50 },
      pins: 40,
      voltage: 3.3,
      price: 4.00,
      inStock: true,
      featured: true,
      specifications: {
        microcontroller: 'RP2040',
        clockSpeed: 133,
        flashMemory: 2048,
        sram: 264,
        digitalPins: 26,
        analogPins: 3,
        pwmPins: 16
      },
      compatibility: ['raspberry-pi', 'micropython', 'circuitpython'],
      tags: ['raspberry-pi', 'pico', 'rp2040', 'micropython']
    },

    // IoT & Communication
    {
      id: 'esp8266-12e',
      name: 'ESP8266-12E',
      category: 'communication',
      subcategory: 'wifi',
      icon: Wifi,
      color: '#00A651',
      size: { width: 60, height: 40 },
      pins: 22,
      voltage: 3.3,
      price: 6.50,
      inStock: true,
      specifications: {
        wifi: '802.11 b/g/n',
        flashMemory: 512,
        sram: 80,
        gpioPins: 17,
        adcPins: 1
      },
      compatibility: ['esp8266', 'arduino', 'nodemcu'],
      tags: ['wifi', 'iot', 'esp8266', 'nodemcu']
    },
    {
      id: 'hc-05-bluetooth',
      name: 'HC-05 Bluetooth',
      category: 'communication',
      subcategory: 'bluetooth',
      icon: Bluetooth,
      color: '#0082FC',
      size: { width: 50, height: 35 },
      pins: 6,
      voltage: 5.0,
      price: 8.00,
      inStock: true,
      specifications: {
        bluetooth: '2.0 + EDR',
        range: 10,
        speed: 'Up to 1Mbps',
        profiles: ['SPP', 'HID', 'HSP']
      },
      compatibility: ['arduino', 'esp32', 'raspberry-pi'],
      tags: ['bluetooth', 'wireless', 'hc-05', 'serial']
    },
    {
      id: 'nrf24l01-transceiver',
      name: 'NRF24L01+ Transceiver',
      category: 'communication',
      subcategory: 'rf',
      icon: Radio,
      color: '#FF6B35',
      size: { width: 45, height: 30 },
      pins: 8,
      voltage: 3.3,
      price: 3.00,
      inStock: true,
      specifications: {
        frequency: 2.4,
        range: 100,
        speed: 'Up to 2Mbps',
        channels: 125
      },
      compatibility: ['arduino', 'esp32', 'raspberry-pi'],
      tags: ['rf', 'wireless', 'nrf24l01', 'transceiver']
    },

    // Sensors
    {
      id: 'dht22-temperature-humidity',
      name: 'DHT22 Temp/Humidity',
      category: 'sensor',
      subcategory: 'environmental',
      icon: Thermometer,
      color: '#D0021B',
      size: { width: 55, height: 35 },
      pins: 4,
      voltage: 5.0,
      price: 5.50,
      inStock: true,
      specifications: {
        temperatureRange: [-40, 80],
        humidityRange: [0, 100],
        accuracy: '±0.5°C, ±2-5% RH',
        interface: 'OneWire'
      },
      compatibility: ['arduino', 'esp32', 'raspberry-pi'],
      tags: ['temperature', 'humidity', 'dht22', 'environmental']
    },
    {
      id: 'mpu6050-imu',
      name: 'MPU6050 IMU',
      category: 'sensor',
      subcategory: 'motion',
      icon: RotateCcw,
      color: '#7ED321',
      size: { width: 40, height: 40 },
      pins: 8,
      voltage: 3.3,
      price: 4.50,
      inStock: true,
      specifications: {
        accelerometer: '±2g, ±4g, ±8g, ±16g',
        gyroscope: '±250, ±500, ±1000, ±2000°/s',
        interface: 'I2C',
        address: '0x68'
      },
      compatibility: ['arduino', 'esp32', 'raspberry-pi'],
      tags: ['accelerometer', 'gyroscope', 'imu', 'motion', 'i2c']
    },
    {
      id: 'bh1750-light-sensor',
      name: 'BH1750 Light Sensor',
      category: 'sensor',
      subcategory: 'optical',
      icon: Sun,
      color: '#BD10E0',
      size: { width: 50, height: 30 },
      pins: 5,
      voltage: 3.3,
      price: 3.50,
      inStock: true,
      specifications: {
        range: '1-65535 lux',
        resolution: '1 lux',
        interface: 'I2C',
        address: '0x23'
      },
      compatibility: ['arduino', 'esp32', 'raspberry-pi'],
      tags: ['light', 'lux', 'optical', 'i2c', 'bh1750']
    },
    {
      id: 'ultrasonic-hc-sr04',
      name: 'HC-SR04 Ultrasonic',
      category: 'sensor',
      subcategory: 'distance',
      icon: Radio,
      color: '#F5A623',
      size: { width: 45, height: 20 },
      pins: 4,
      voltage: 5.0,
      price: 3.00,
      inStock: true,
      specifications: {
        range: [2, 400],
        accuracy: '±3mm',
        interface: 'Digital',
        frequency: 40
      },
      compatibility: ['arduino', 'esp32', 'raspberry-pi'],
      tags: ['ultrasonic', 'distance', 'hc-sr04', 'proximity']
    },

    // Actuators
    {
      id: 'servo-motor-sg90',
      name: 'SG90 Servo Motor',
      category: 'actuator',
      subcategory: 'motor',
      icon: RotateCcw,
      color: '#9013FE',
      size: { width: 55, height: 40 },
      pins: 3,
      voltage: 5.0,
      price: 5.00,
      inStock: true,
      specifications: {
        torque: '1.8 kg/cm',
        speed: '0.1 sec/60°',
        angle: 180,
        interface: 'PWM'
      },
      compatibility: ['arduino', 'esp32', 'raspberry-pi'],
      tags: ['servo', 'motor', 'sg90', 'pwm', 'actuator']
    },
    {
      id: 'dc-motor-5v',
      name: '5V DC Motor',
      category: 'actuator',
      subcategory: 'motor',
      icon: Zap,
      color: '#FF6B35',
      size: { width: 60, height: 35 },
      pins: 2,
      voltage: 5.0,
      price: 2.50,
      inStock: true,
      specifications: {
        voltage: 5.0,
        speed: '6000 RPM',
        current: '0.2A',
        interface: 'Digital'
      },
      compatibility: ['arduino', 'esp32', 'raspberry-pi'],
      tags: ['dc-motor', 'motor', 'actuator', '5v']
    },
    {
      id: 'relay-module-5v',
      name: '5V Relay Module',
      category: 'actuator',
      subcategory: 'relay',
      icon: Zap,
      color: '#50E3C2',
      size: { width: 50, height: 45 },
      pins: 6,
      voltage: 5.0,
      price: 4.00,
      inStock: true,
      specifications: {
        coilVoltage: 5.0,
        contactVoltage: 250,
        contactCurrent: 10,
        type: 'SPDT'
      },
      compatibility: ['arduino', 'esp32', 'raspberry-pi'],
      tags: ['relay', 'switch', 'actuator', '5v', 'spdt']
    },

    // Displays
    {
      id: 'oled-ssd1306-096',
      name: '0.96" OLED Display',
      category: 'display',
      subcategory: 'oled',
      icon: Eye,
      color: '#4A90E2',
      size: { width: 45, height: 35 },
      pins: 4,
      voltage: 3.3,
      price: 8.00,
      inStock: true,
      specifications: {
        size: '0.96"',
        resolution: '128x64',
        interface: 'I2C',
        address: '0x3C',
        colors: 'Monochrome'
      },
      compatibility: ['arduino', 'esp32', 'raspberry-pi'],
      tags: ['oled', 'display', 'ssd1306', 'i2c', '128x64']
    },
    {
      id: 'lcd-1602-i2c',
      name: '16x2 LCD with I2C',
      category: 'display',
      subcategory: 'lcd',
      icon: Eye,
      color: '#B8E986',
      size: { width: 80, height: 36 },
      pins: 4,
      voltage: 5.0,
      price: 6.50,
      inStock: true,
      specifications: {
        size: '16x2',
        characters: 32,
        interface: 'I2C',
        backlight: 'Blue',
        contrast: 'Adjustable'
      },
      compatibility: ['arduino', 'esp32', 'raspberry-pi'],
      tags: ['lcd', 'display', '1602', 'i2c', '16x2']
    },

    // Power & Battery
    {
      id: 'lipo-battery-18650',
      name: '18650 LiPo Battery',
      category: 'power',
      subcategory: 'battery',
      icon: Battery,
      color: '#FF9500',
      size: { width: 65, height: 18 },
      pins: 2,
      voltage: 3.7,
      price: 8.00,
      inStock: true,
      specifications: {
        capacity: 2000,
        voltage: 3.7,
        maxCurrent: 1,
        chemistry: 'LiPo',
        protection: 'Built-in'
      },
      compatibility: ['all'],
      tags: ['battery', 'lipo', '18650', '3.7v', '2000mah']
    },
    {
      id: 'buck-converter-lm2596',
      name: 'LM2596 Buck Converter',
      category: 'power',
      subcategory: 'converter',
      icon: Lightning,
      color: '#FF3B30',
      size: { width: 43, height: 21 },
      pins: 4,
      voltage: [4.5, 40],
      price: 3.50,
      inStock: true,
      specifications: {
        inputVoltage: [4.5, 40],
        outputVoltage: [1.25, 35],
        maxCurrent: 3,
        efficiency: '92%',
        type: 'Step-down'
      },
      compatibility: ['all'],
      tags: ['buck', 'converter', 'lm2596', 'step-down', 'power']
    }
  ], []);

  // Filter components based on search and category
  const filteredComponents = useMemo(() => {
    return componentLibrary.filter(component => {
      const matchesSearch = !searchQuery ||
        component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' ||
        component.category === selectedCategory ||
        component.subcategory === selectedCategory;

      const matchesFavorites = !showFavorites || favorites.has(component.id);

      return matchesSearch && matchesCategory && matchesFavorites;
    });
  }, [componentLibrary, searchQuery, selectedCategory, showFavorites, favorites]);

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Components', icon: Settings },
    { id: 'microcontroller', name: 'Microcontrollers', icon: Cpu },
    { id: 'communication', name: 'Communication', icon: Wifi },
    { id: 'sensor', name: 'Sensors', icon: Thermometer },
    { id: 'actuator', name: 'Actuators', icon: Zap },
    { id: 'display', name: 'Displays', icon: Eye },
    { id: 'power', name: 'Power', icon: Battery }
  ];

  const handleDragStart = (e, component) => {
    e.dataTransfer.setData('application/json', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'copy';

    // Track recently used
    const newRecentlyUsed = new Set(recentlyUsed);
    newRecentlyUsed.add(component.id);
    if (newRecentlyUsed.size > 10) {
      const oldest = newRecentlyUsed.values().next().value;
      newRecentlyUsed.delete(oldest);
    }
    setRecentlyUsed(newRecentlyUsed);
    localStorage.setItem('recentlyUsedComponents', JSON.stringify([...newRecentlyUsed]));

    if (onComponentDrag) {
      onComponentDrag(component);
    }
  };

  const toggleFavorite = (componentId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(componentId)) {
      newFavorites.delete(componentId);
    } else {
      newFavorites.add(componentId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('componentFavorites', JSON.stringify([...newFavorites]));
  };

  const ComponentCard = ({ component }) => {
    const Icon = component.icon;
    const isFavorite = favorites.has(component.id);
    const isRecentlyUsed = recentlyUsed.has(component.id);

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, component)}
        onClick={() => onComponentSelect && onComponentSelect(component)}
        className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-move"
      >
        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(component.id);
          }}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Star
            className={`h-4 w-4 ${isFavorite ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        </button>

        {/* Recently used indicator */}
        {isRecentlyUsed && (
          <div className="absolute top-2 left-2 w-2 h-2 bg-green-500 rounded-full" title="Recently used"></div>
        )}

        {/* Component icon */}
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto"
          style={{ backgroundColor: `${component.color}20` }}
        >
          <Icon className="h-6 w-6" style={{ color: component.color }} />
        </div>

        {/* Component info */}
        <div className="text-center">
          <h3 className="font-medium text-gray-900 text-sm mb-1">{component.name}</h3>
          <p className="text-xs text-gray-500 mb-2">{component.category}</p>

          {/* Specifications */}
          <div className="text-xs text-gray-600 space-y-1">
            <div>Voltage: {Array.isArray(component.voltage) ? `${component.voltage[0]}-${component.voltage[1]}V` : `${component.voltage}V`}</div>
            <div>Pins: {component.pins}</div>
            <div className="font-medium text-green-600">${component.price}</div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2 justify-center">
            {component.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Featured badge */}
        {component.featured && (
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
            Featured
          </div>
        )}

        {/* Stock status */}
        {!component.inStock && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-medium">Out of Stock</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Component Library</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={`p-2 rounded-lg ${showFavorites ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-100'}`}
              title="Show favorites"
            >
              <Heart className="h-5 w-5" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Import components"
            >
              <Upload className="h-5 w-5" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Export library"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(category => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Component Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComponents.map(component => (
            <ComponentCard key={component.id} component={component} />
          ))}
        </div>

        {filteredComponents.length === 0 && (
          <div className="text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No components found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{filteredComponents.length} components</span>
          <span>{favorites.size} favorites</span>
        </div>
      </div>
    </div>
  );
};

export default AdvancedComponentLibrary;