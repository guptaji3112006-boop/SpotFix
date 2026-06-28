import React, { useState, useRef } from 'react';
import { 
  MapPin, 
  Camera, 
  Upload, 
  Loader2, 
  AlertTriangle, 
  User, 
  FileText, 
  Sparkles, 
  Check, 
  Trash2,
  HelpCircle,
  Locate,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { IssueReport, IssueCategory, UrgencyLevel } from '../types';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAudio } from '../contexts/AudioContext';

// Fix for default marker icons in React Leaflet
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


interface IssueReportingFormProps {
  onSubmitReport: (report: Omit<IssueReport, 'id' | 'status' | 'createdAt'> & { simulatedCategory?: string }) => Promise<void> | void;
}

export default function IssueReportingForm({ onSubmitReport }: IssueReportingFormProps) {
  const { t } = useTranslation();
  const { playClick, playSuccess } = useAudio();
  // Form parameters
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [urgency, setUrgency] = useState<UrgencyLevel | ''>('');
  
  // Image handling
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Geolocation states
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string>('');

  // AI Simulation states
  const [isAISimulating, setIsAISimulating] = useState(false);
  const [aiTagDetected, setAiTagDetected] = useState<{mainCategory: string, subCategory: string} | null>(null);
  const [isAiValidated, setIsAiValidated] = useState(false);
  const [apiLimitExceeded, setApiLimitExceeded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issueCategories: Record<string, string[]> = {
    "Roads & Transport": ["Potholes", "Open Manholes", "Broken Footpaths & Pavements", "Waterlogging", "Other"],
    "Waste Management": ["Overflowing Community Bins", "Illegal Dumping Yards", "Dead Animal Carcasses", "Other"],
    "Water & Sanitation": ["Burst Pipelines", "Sewage Overflow", "Contaminated Water Supply", "Unmaintained Public Toilets", "Other"],
    "Public Safety & Lighting": ["Broken Streetlights", "Dangling Live Wires", "Malfunctioning Traffic Signals", "Other"],
    "Environment & Greenery": ["Fallen or Dangerous Trees", "Burning of Dry Leaves/Garbage", "Other"],
    "Others": ["Other"]
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Browser Geolocation Trigger
  const handleFetchLocation = () => {
    playClick();
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsFetchingLocation(true);
    setLocationStatus('fetching');
    setLocationError('');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat);
        setLongitude(lng);
        setLocationStatus('success');
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          const data = await response.json();
          if (data && data.address) {
            const { address } = data;
            const areaParts = [
              address.amenity || address.building,
              address.road,
              address.neighbourhood,
              address.suburb,
              address.village || address.town || address.city,
              address.postcode
            ];
            const readableAddress = areaParts.filter(Boolean).join(", ");
            setLocationAddress(readableAddress || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          } else if (data && data.display_name) {
            setLocationAddress(data.display_name);
          } else {
            setLocationAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        } catch (err) {
          console.error("Failed to reverse geocode:", err);
          setLocationAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        setIsFetchingLocation(false);
        setLocationStatus('error');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable permission in your browser.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Request to get location timed out.');
            break;
          default:
            setLocationError('An unknown error occurred while fetching location.');
            break;
        }
      },
      options
    );
  };

  // Helper to process files (images and videos)
  const processImageFile = (file: File) => {
    playClick();
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Please upload an image or video file.');
      return;
    }
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Get resized base64
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setImagePreview(resizedBase64);
          
          // Trigger AI Analysis
          analyzeImageWithAI(file);
        };
        img.src = result;
      } else {
        // It's a video
        setImagePreview(result); // Using data URL directly for video
        analyzeImageWithAI(file);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setAiTagDetected(null);
    setIsAiValidated(false);
  };

  // Real AI image analysis by Gemini API
  const analyzeImageWithAI = async (file: File) => {
    setIsAISimulating(true);
    setAiTagDetected(null);
    setIsAiValidated(false);

    try {
      const formData = new FormData();
      formData.append('media', file);

      const response = await fetch('/api/issues/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to analyze image';
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          errorMessage = 'Server error or timeout. Please try again.';
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.apiLimitExceeded) {
        setApiLimitExceeded(true);
        alert('AI analysis is currently unavailable due to high traffic. Your image has been attached, please fill in the details manually.');
        setIsAiValidated(true); // Treat as validated so they can proceed
      } else if (!data.isValid) {
        alert(data.rejectionReason || 'Image does not appear to be a valid civic issue.');
        removeImage();
      } else {
        const predicted = { 
          mainCategory: data.mainCategory, 
          subCategory: data.subCategory,
          title: data.description, // we map description to suggestedTitle in geminiService
          tags: data.tags
        };
        setAiTagDetected(predicted);
        setSelectedMainCategory(predicted.mainCategory);
        setSelectedSubCategory(predicted.subCategory);
        if (predicted.title) setTitle(predicted.title);
        setIsAiValidated(true);
      }
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      alert(error.message || 'Error analyzing image. Please try again.');
      removeImage();
    } finally {
      setIsAISimulating(false);
    }
  };

  // Submit complete details
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();

    if (!title.trim()) {
      alert('Please provide a title for the issue.');
      return;
    }
    if (!description.trim()) {
      alert('Please provide a description.');
      return;
    }
    if (!imagePreview) {
      alert('Please take/upload a photo of the issue to verify it.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitReport({
        title,
        description,
        category: selectedMainCategory, // Provide backwards compatible category temporarily if needed
        mainCategory: selectedMainCategory,
        subCategory: selectedSubCategory,
        latitude,
        longitude,
        imageUrl: imagePreview,
        urgency,
        reporterName: reporterName.trim(),
        reporterEmail: reporterEmail.trim(),
        locationAddress: locationAddress || 'Current Location Coordinates Saved',
        apiLimitExceeded
      });

      playSuccess();
      // Reset Form
      setTitle('');
      setDescription('');
      setReporterName('');
      setReporterEmail('');
      setSelectedMainCategory('');
      setSelectedSubCategory('');
      setUrgency('Medium');
      setApiLimitExceeded(false);
      removeImage();
      setLatitude(null);
      setLongitude(null);
      setLocationAddress('');
      setLocationStatus('idle');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="reporting_form_container" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm p-6 md:p-8 transition-colors duration-200">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 md:w-6 h-5 md:h-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          {t('reportIssueTitle')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('reportIssueSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Media Upload (Required) */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('step1')} <span className="text-red-500">*</span>
          </label>
          
          <AnimatePresence mode="wait">
            {!imagePreview ? (
              <motion.div
                key="upload-dropzone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                  isDragOver 
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' 
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="file"
                  id="evidence_image_upload"
                  accept="image/*,video/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Drag & drop your photo/video, or click to upload</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Supports Images and Video files</p>
                
                <div className="mt-4 flex gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-full transition">
                    <Upload className="w-3.5 h-3.5" />
                    Browse Files
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="element-preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative rounded-2xl overflow-hidden border border-slate-200/60 bg-slate-50 dark:bg-slate-800 shadow-sm"
              >
                {/* Real Preview Container */}
                <div className="relative aspect-video max-h-[300px] w-full flex items-center justify-center bg-black overflow-hidden group">
                  {imageFile?.type.startsWith('video/') ? (
                    <video 
                      src={imagePreview} 
                      className="h-full object-cover w-full opacity-90 transition-transform duration-500 group-hover:scale-105"
                      controls
                    />
                  ) : (
                    <img 
                      src={imagePreview} 
                      alt="Report preview" 
                      className="h-full object-cover w-full opacity-90 transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  
                  {/* Photo details & remove button overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 p-4 flex flex-col justify-end">
                    <p className="text-xs text-white/90 truncate font-mono">
                      {imageFile?.name || 'Evidence_Media.jpg'} ({((imageFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-rose-600 text-white rounded-full backdrop-blur-md transition-colors shadow-lg z-10"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Simulated Gemini AI Scan Drawer */}
                <div className="p-4 border-t border-slate-200/60 bg-white dark:bg-slate-900 shadow-sm">
                  {isAISimulating ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Scanning Image with AI...</p>
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 font-semibold rounded-full animate-pulse">Running</span>
                        </div>
                        <p className="text-xs text-slate-500">Extracting image features, classifying core neighborhood anomaly...</p>
                        <div className="w-full bg-slate-200 rounded-full h-1 mt-1.5 overflow-hidden">
                          <div className="bg-indigo-600 h-1 rounded-full animate-pulse w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  ) : isAiValidated && aiTagDetected ? (
                    <div className="flex items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-slate-800">Gemini AI Auto-Tag</p>
                            <span className="text-[9px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded border border-violet-200">CONFIRMED</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Auto-categorized as <span className="font-bold text-indigo-700 underline decoration-indigo-400">{aiTagDetected.mainCategory} &gt; {aiTagDetected.subCategory}</span>. You can still modify below if inaccurate.
                          </p>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold font-mono text-slate-400">
                        <Check className="w-3.5 h-3.5 text-indigo-500" /> GEMINI V2.5-FLASH
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      Upload a photo to let server-side Gemini AI automatically label the issue class.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step 2: Location (Dynamic coordinates) */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('step2')} <span className="text-red-500">*</span>
          </label>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              placeholder="e.g. 123 Main St, Springfield"
              className="flex-1 rounded-xl border border-slate-200/60 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              required
            />
            <button
              type="button"
              onClick={handleFetchLocation}
              disabled={isFetchingLocation}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                isFetchingLocation
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95'
              }`}
            >
              {isFetchingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Locate className="w-4 h-4" />
                  📍 Detect My Location
                </>
              )}
            </button>
          </div>

          {locationError && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-4 h-4" />
              {locationError}
            </p>
          )}

          {latitude && longitude && locationStatus === 'success' && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium mt-1">
              📍 Coordinates: {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
            </p>
          )}

          {/* Mini-map preview */}
          {latitude && longitude && (
            <div className="mt-4 h-48 w-full rounded-xl overflow-hidden border border-slate-200/60 shadow-sm relative z-0">
              <MapContainer 
                key={`${latitude}-${longitude}`}
                center={[latitude, longitude]} 
                zoom={15} 
                scrollWheelZoom={false} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker position={[latitude, longitude]} icon={customIcon} />
              </MapContainer>
            </div>
          )}
        </div>

        {/* Step 3: Issue Details */}
        <div className="space-y-4 pt-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-t border-slate-200/60 dark:border-slate-800 pt-4">{t('step3')}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                {t('issueTitle')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={t('issueTitlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
              />
            </div>

            {/* Reporter name */}
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Reporter Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Jane Doe"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                required
                className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
              />
            </div>
            
            {/* Reporter email */}
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Reporter Email (for updates) <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="e.g. jane@example.com"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                required
                className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Main Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Main Category <span className="text-red-500">*</span></label>
              <select
                value={selectedMainCategory}
                onChange={(e) => {
                  setSelectedMainCategory(e.target.value);
                  setSelectedSubCategory(''); // Reset sub category when main changes
                }}
                required
                className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans text-slate-900 dark:text-slate-100 shadow-sm"
              >
                <option value="" disabled>Select Main Category</option>
                {Object.keys(issueCategories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sub Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sub-Category <span className="text-red-500">*</span></label>
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                disabled={!selectedMainCategory}
                required
                className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans text-slate-900 dark:text-slate-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>Select Sub-Category</option>
                {selectedMainCategory && issueCategories[selectedMainCategory]?.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Urgency */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                {t('urgency')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Low', 'Medium', 'High', 'Critical'] as UrgencyLevel[]).map((level) => {
                  const colors = {
                    Low: 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700',
                    Medium: 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700',
                    High: 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700',
                    Critical: 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                  };
                  const activeColors = {
                    Low: 'border-indigo-600 bg-indigo-600 text-white font-semibold shadow-sm',
                    Medium: 'border-indigo-600 bg-indigo-600 text-white font-semibold shadow-sm',
                    High: 'border-indigo-600 bg-indigo-600 text-white font-semibold shadow-sm',
                    Critical: 'border-indigo-600 bg-indigo-600 text-white font-semibold shadow-sm'
                  };
                  const isActive = urgency === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setUrgency(level)}
                      className={`py-2 text-center rounded-xl border text-xs transition-all ${
                        isActive ? activeColors[level] : colors[level]
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('issueDescription')} <span className="text-red-500">*</span></label>
            <textarea
              rows={3}
              placeholder={t('issueDescriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
            ></textarea>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white py-3.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 text-base cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <PlusCircleIcon className="w-5 h-5" />
              {t('submit')}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// Simple internal icon to replace react-icons elegantly
function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}
