'use client';

import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { serialize } from 'next-mdx-remote/serialize';
import MdxGuideRenderer from './mdx/MdxGuideRenderer';
import { GuideMetadata } from '@/utils/mdxLoader';

// Import Slick carousel styles
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface GuidedExperienceProps {
  guides: { content: string; metadata: GuideMetadata }[];
  onLoadQuery: (query: string) => void;
  onClose: () => void;
}

export default function GuidedExperience({ guides, onLoadQuery, onClose }: GuidedExperienceProps) {
  const [serializedContent, setSerializedContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  // Serialize MDX content
  useEffect(() => {
    async function serializeContent() {
      try {
        const serialized = await Promise.all(
          guides.map(async (guide) => {
            return {
              content: await serialize(guide.content),
              metadata: guide.metadata
            };
          })
        );
        setSerializedContent(serialized);
        setLoading(false);
      } catch (error) {
        console.error('Error serializing MDX content:', error);
        setLoading(false);
      }
    }

    serializeContent();
  }, [guides]);

  // Slider settings
  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    beforeChange: (_: number, next: number) => setActiveSlide(next),
    afterChange: (current: number) => setActiveSlide(current)
  };

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Guided DQL Experience</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close guided experience"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Guided DQL Experience</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Guide {activeSlide + 1} of {serializedContent.length}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close guided experience"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {serializedContent.length > 0 ? (
        <div className="guide-slider">
          <Slider {...settings}>
            {serializedContent.map((guide, index) => (
              <div key={guide.metadata.slug} className="p-2">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-indigo-600">{guide.metadata.title}</h3>
                  <p className="text-gray-600">{guide.metadata.description}</p>
                </div>
                <div className="h-[400px] overflow-auto pr-2 custom-scrollbar">
                  <div className="prose prose-indigo max-w-none">
                    <MdxGuideRenderer content={guide.content} onLoadQuery={onLoadQuery} />
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      ) : (
        <div className="text-center p-8 border border-gray-200 rounded-md">
          <p className="text-gray-500">No guides available</p>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => (Slider as any).slickPrev()}
          disabled={activeSlide === 0}
          className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => (Slider as any).slickNext()}
          disabled={activeSlide === serializedContent.length - 1}
          className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
