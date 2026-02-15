'use client';

import { useEffect, useState } from 'react';
import PencilAnimation from './PencilAnimation';

interface ProgressBarProps {
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message: string;
}

const PROGRESS_STAGES = [
  "Reading your script...",
  "Analyzing story structure...",
  "Mapping character relationships...",
  "Evaluating dialogue and craft...",
  "Assessing commercial viability...",
  "Preparing your coverage report..."
];

export default function ProgressBar({ status, message }: ProgressBarProps) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (status === 'processing') {
      const interval = setInterval(() => {
        setStageIndex((prev) => (prev + 1) % PROGRESS_STAGES.length);
      }, 18000); // Change every 18 seconds

      return () => clearInterval(interval);
    }
  }, [status]);

  // Determine if we're uploading or analyzing
  const isUploading = message.toLowerCase().includes('uploading');
  const isAnalyzing = status === 'processing' && !isUploading;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-premium p-12 border border-gray-200">
        {/* Animation */}
        <div className="mb-8">
          {isUploading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-3 border-[#c9a962]"></div>
            </div>
          )}
          {isAnalyzing && <PencilAnimation />}
          {status === 'completed' && (
            <div className="text-center text-6xl">✅</div>
          )}
          {status === 'error' && (
            <div className="text-center text-6xl">❌</div>
          )}
        </div>

        {/* Main message */}
        <h2 className="text-center text-2xl font-serif font-semibold text-[#0a1628] mb-3 transition-all duration-500">
          {isAnalyzing ? PROGRESS_STAGES[stageIndex] : message}
        </h2>

        {/* Reassurance text */}
        {isAnalyzing && (
          <p className="text-center text-sm text-gray-500 mb-6 transition-opacity duration-500">
            You can leave this page — we'll email you when it's ready
          </p>
        )}

        {/* Progress bar for analyzing */}
        {isAnalyzing && (
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-[#c9a962] to-[#b89850] h-2 rounded-full animate-progress"></div>
            </div>
            <p className="text-sm text-gray-500 text-center mt-3">
              This usually takes 3-5 minutes
            </p>
          </div>
        )}

        {/* Simple loading for upload */}
        {isUploading && (
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-[#c9a962] h-2 rounded-full animate-fast-progress"></div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 90%;
          }
        }
        @keyframes fast-progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress 60s ease-out forwards;
        }
        .animate-fast-progress {
          animation: fast-progress 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
