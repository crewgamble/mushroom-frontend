import React, { useState, useRef } from 'react'
import { CheckCircleIcon, XCircleIcon, PhotoIcon } from '@heroicons/react/24/solid'
import axios from 'axios'
import { featureDescriptions } from './featureDescriptions'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface PredictionResult {
  prediction: 'edible' | 'poisonous';
  confidence: number;
}

interface MushroomFeatures {
  [key: string]: string;
}

const REQUIRED_FEATURES = [
  'odor',           // Strong indicator of toxicity
  'spore-print-color', // Important taxonomic feature
  'gill-color',     // Key visual identifier
  'cap-color',      // Primary visual feature
  'bruises',        // Important toxicity indicator
  'ring-type',      // Key taxonomic feature
  'gill-spacing',   // Important morphological feature
  'cap-shape',      // Basic visual identifier
  'population',     // Environmental indicator
  'habitat',        // Growth context
  'stalk-surface-above-ring', // Texture indicator
  'cap-surface'     // Surface characteristic
];

function App() {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [features, setFeatures] = useState<MushroomFeatures>(() => {
    // Initialize all features with empty strings
    return Object.keys(featureDescriptions).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {} as MushroomFeatures);
  });

  const handleFeatureChange = (feature: string, value: string) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    setImagePreview(URL.createObjectURL(file));

    // Create form data for image upload
    const formData = new FormData();
    formData.append('image', file);

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/analyze-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      console.log('Image analysis results:', data);

      // Update form fields with detected features
      if (data.features) {
        const newFeatures = { ...features };
        Object.entries(data.features).forEach(([key, value]) => {
          if (key in newFeatures) {
            newFeatures[key] = value as string;
          }
        });
        setFeatures(newFeatures);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Check only required fields
    const emptyRequiredFields = Object.entries(features)
      .filter(([key, value]) => REQUIRED_FEATURES.includes(key) && !value)
      .map(([key]) => key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
    
    if (emptyRequiredFields.length > 0) {
      setError(`Please fill in all required fields: ${emptyRequiredFields.join(', ')}`);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/predict`, features);
      setResult(response.data);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to get prediction. Please try again.');
      }
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      <main className="flex-grow bg-white w-full">
        <div className="container mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl lg:text-6xl">
                Mushroom Classifier
              </h1>
              <p className="mt-6 text-xl text-gray-500 max-w-4xl mx-auto">
                Upload a photo or enter characteristics to determine if a mushroom is edible or poisonous. NOTE: Image uploading is inconsistent and limited to a few features. You are required to fill in the rest of the features.
              </p>
            </div>

            {/* Main Form */}
            <div className="bg-white shadow-lg rounded-xl border border-gray-200 mx-auto">
              <div className="px-8 py-10 sm:p-12">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Image Upload */}
                  <div className="space-y-3">
                    <label className="block text-lg font-medium text-gray-700">
                      Upload Mushroom Image (Optional)
                    </label>
                    <div 
                      className="mt-2 flex justify-center px-8 pt-6 pb-8 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:border-indigo-500 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="space-y-2 text-center">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Uploaded mushroom" className="mx-auto h-48 w-48 object-cover rounded-lg shadow-md" />
                        ) : (
                          <PhotoIcon className="mx-auto h-16 w-16 text-gray-400" />
                        )}
                        <div className="flex justify-center text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                            <span>Upload a photo</span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                    </div>
                    {loading && (
                      <p className="text-sm text-indigo-600">Analyzing image...</p>
                    )}
                  </div>

                  {/* Feature Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(featureDescriptions).map(([feature, options]) => {
                      const isRequired = REQUIRED_FEATURES.includes(feature);
                      return (
                        <div key={feature} className="relative">
                          <label htmlFor={feature} className="block text-sm font-medium text-gray-700">
                            {feature.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            {isRequired && <span className="text-red-500 ml-1">*</span>}
                            {!isRequired && <span className="text-gray-400 ml-1">(Optional)</span>}
                          </label>
                          <select
                            id={feature}
                            value={features[feature]}
                            onChange={(e) => handleFeatureChange(feature, e.target.value)}
                            className={`mt-1 block w-full pl-3 pr-10 py-2.5 text-base text-gray-900 border-2 ${
                              isRequired ? 'border-gray-300' : 'border-gray-200'
                            } focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm rounded-lg shadow-sm`}
                          >
                            <option value="">Select...</option>
                            {Object.entries(options).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="rounded-lg bg-red-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">{error}</h3>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      className="px-8 py-3 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 min-w-[200px]"
                      disabled={loading}
                    >
                      {loading ? 'Analyzing...' : 'Analyze Mushroom'}
                    </button>
                  </div>
                </form>

                {/* Results */}
                {result && (
                  <div className="mt-8">
                    <div className={`rounded-lg p-6 ${
                      result.prediction === 'edible' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {result.prediction === 'edible' ? (
                            <CheckCircleIcon className="h-8 w-8 text-green-400" />
                          ) : (
                            <XCircleIcon className="h-8 w-8 text-red-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <h3 className={`text-xl font-medium ${
                            result.prediction === 'edible' ? 'text-green-800' : 'text-red-800'
                          }`}>
                            This mushroom is predicted to be {result.prediction}
                          </h3>
                          <div className="mt-2 text-lg text-gray-700">
                            <p>Confidence: {(result.confidence * 100).toFixed(2)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App 