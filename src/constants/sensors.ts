import { SensorConfig } from '../types';

export const SENSOR_CONFIGS: SensorConfig[] = [
  {
    key: 'moisture',
    label: 'Kelembaban Tanah',
    unit: '%',
    min: 0,
    max: 100,
    goodMin: 40,
    goodMax: 70,
    color: '#5D7E2D',
  },
  {
    key: 'nitrogen',
    label: 'Nitrogen',
    unit: 'mg/kg',
    min: 0,
    max: 100,
    goodMin: 20,
    goodMax: 60,
    color: '#27513D',
  },
  {
    key: 'phosphorus',
    label: 'Fosfor',
    unit: 'mg/kg',
    min: 0,
    max: 60,
    goodMin: 10,
    goodMax: 40,
    color: '#809752',
  },
  {
    key: 'potassium',
    label: 'Kalium',
    unit: 'mg/kg',
    min: 0,
    max: 300,
    goodMin: 80,
    goodMax: 200,
    color: '#9288A6',
  },
  {
    key: 'temperature',
    label: 'Suhu',
    unit: '°C',
    min: 0,
    max: 50,
    goodMin: 20,
    goodMax: 32,
    color: '#61536F',
  },
  {
    key: 'ph',
    label: 'pH Tanah',
    unit: '',
    min: 0,
    max: 14,
    goodMin: 5.5,
    goodMax: 7.0,
    color: '#5C7B62',
  },
  {
    key: 'conductivity',
    label: 'Konduktivitas',
    unit: 'mS/cm',
    min: 0,
    max: 5,
    goodMin: 0.5,
    goodMax: 2.5,
    color: '#C2B4E2',
  },
];

export const DISEASES = [
  { label: 'Alternaria Porri', confidence: 91.4 },
  { label: 'Botrytis Leaf Blight', confidence: 85.7 },
  { label: 'Purple Blotch', confidence: 78.2 },
  { label: 'Stemphylium Leaf Blight', confidence: 88.9 },
  { label: 'Sehat', confidence: 96.1 },
];

export const DUMMY_IMAGE_URL = '';
